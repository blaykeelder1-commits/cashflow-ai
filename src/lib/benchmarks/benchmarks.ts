/**
 * Industry Benchmarks Core Logic
 *
 * Functions for comparing clients to industry benchmarks
 * and calculating performance metrics.
 */

import { prisma } from '@/lib/db/prisma';
import {
  IndustryBenchmarkData,
  BenchmarkComparison,
  BenchmarkPerformanceCategory,
  ClientBenchmarkResult,
  BenchmarkUpdateResult,
  PaymentDataPoint,
  SeasonalMultipliers,
} from './types';
import {
  DEFAULT_INDUSTRY_BENCHMARKS,
  getDefaultBenchmark,
  normalizeIndustryName,
  findClosestIndustry,
} from './industries';

/**
 * Get industry benchmark from database or fall back to defaults
 */
export async function getIndustryBenchmark(
  industry: string
): Promise<IndustryBenchmarkData | null> {
  const normalized = normalizeIndustryName(industry);

  // Try database first
  const dbBenchmark = await prisma.industryBenchmark.findFirst({
    where: {
      industry: {
        equals: normalized,
        mode: 'insensitive',
      },
    },
  });

  if (dbBenchmark) {
    return {
      id: dbBenchmark.id,
      industry: dbBenchmark.industry,
      avgDaysToPay: Number(dbBenchmark.avgDaysToPay),
      medianDaysToPay: Number(dbBenchmark.medianDaysToPay),
      stdDevDaysToPay: Number(dbBenchmark.stdDevDaysToPay),
      pctPayOnTime: Number(dbBenchmark.pctPayOnTime),
      pctPay30Days: Number(dbBenchmark.pctPay30Days),
      pctPay60Days: Number(dbBenchmark.pctPay60Days),
      pctPay90Plus: Number(dbBenchmark.pctPay90Plus),
      seasonalMultipliers: dbBenchmark.seasonalMultipliers
        ? (JSON.parse(dbBenchmark.seasonalMultipliers) as SeasonalMultipliers)
        : null,
      economicSensitivity: Number(dbBenchmark.economicSensitivity),
      sampleSize: dbBenchmark.sampleSize,
      lastUpdated: dbBenchmark.lastUpdated,
      createdAt: dbBenchmark.createdAt,
    };
  }

  // Try to find a matching default
  const matchedIndustry = findClosestIndustry(industry);
  if (matchedIndustry) {
    return getDefaultBenchmark(matchedIndustry);
  }

  return getDefaultBenchmark(industry);
}

/**
 * Get all industry benchmarks (database + defaults for missing)
 */
export async function getAllIndustryBenchmarks(): Promise<IndustryBenchmarkData[]> {
  const dbBenchmarks = await prisma.industryBenchmark.findMany({
    orderBy: { industry: 'asc' },
  });

  const dbIndustries = new Set(dbBenchmarks.map((b) => normalizeIndustryName(b.industry)));

  // Convert DB benchmarks
  const results: IndustryBenchmarkData[] = dbBenchmarks.map((b) => ({
    id: b.id,
    industry: b.industry,
    avgDaysToPay: Number(b.avgDaysToPay),
    medianDaysToPay: Number(b.medianDaysToPay),
    stdDevDaysToPay: Number(b.stdDevDaysToPay),
    pctPayOnTime: Number(b.pctPayOnTime),
    pctPay30Days: Number(b.pctPay30Days),
    pctPay60Days: Number(b.pctPay60Days),
    pctPay90Plus: Number(b.pctPay90Plus),
    seasonalMultipliers: b.seasonalMultipliers
      ? (JSON.parse(b.seasonalMultipliers) as SeasonalMultipliers)
      : null,
    economicSensitivity: Number(b.economicSensitivity),
    sampleSize: b.sampleSize,
    lastUpdated: b.lastUpdated,
    createdAt: b.createdAt,
  }));

  // Add defaults for industries not in DB
  for (const defaultBenchmark of DEFAULT_INDUSTRY_BENCHMARKS) {
    if (!dbIndustries.has(normalizeIndustryName(defaultBenchmark.industry))) {
      results.push(defaultBenchmark);
    }
  }

  return results.sort((a, b) => a.industry.localeCompare(b.industry));
}

/**
 * Compare a client's payment behavior to their industry benchmark
 */
export async function compareClientToBenchmark(
  clientId: string,
  clientName: string,
  clientIndustry: string | null,
  clientAvgDaysToPay: number | null,
  clientOnTimeRate: number | null
): Promise<BenchmarkComparison | null> {
  if (!clientIndustry || clientAvgDaysToPay === null) {
    return null;
  }

  const benchmark = await getIndustryBenchmark(clientIndustry);
  if (!benchmark) {
    return null;
  }

  const avgDaysToPayDelta = clientAvgDaysToPay - benchmark.avgDaysToPay;
  const onTimeRate = clientOnTimeRate ?? 0;
  const onTimeRateDelta = onTimeRate - benchmark.pctPayOnTime;

  // Calculate percentile rank (0-100, higher is better)
  // Based on how many standard deviations from mean
  const zScore = (benchmark.avgDaysToPay - clientAvgDaysToPay) / benchmark.stdDevDaysToPay;
  const percentileRank = Math.min(100, Math.max(0, 50 + zScore * 34));

  const performanceCategory = categorizePerformance(percentileRank);
  const insights = generateBenchmarkInsights(
    clientName,
    benchmark,
    avgDaysToPayDelta,
    onTimeRateDelta,
    performanceCategory
  );

  return {
    clientId,
    clientName,
    industry: clientIndustry,
    benchmark,
    comparison: {
      avgDaysToPayDelta,
      onTimeRateDelta,
      performanceCategory,
      percentileRank: Math.round(percentileRank),
    },
    insights,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate the industry benchmark delta for a client (-50 to +50)
 * Positive = better than industry average
 */
export function calculateIndustryBenchmarkDelta(
  clientAvgDaysToPay: number,
  benchmarkAvgDaysToPay: number,
  benchmarkStdDev: number
): number {
  // Calculate how many standard deviations better/worse
  const zScore = (benchmarkAvgDaysToPay - clientAvgDaysToPay) / benchmarkStdDev;
  // Map to -50 to +50 range (roughly 3 std devs each direction)
  return Math.max(-50, Math.min(50, Math.round(zScore * 17)));
}

/**
 * Get benchmark results for multiple clients in an organization
 */
export async function getBenchmarkResultsForOrganization(
  organizationId: string
): Promise<ClientBenchmarkResult[]> {
  const clients = await prisma.client.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      industry: true,
      paymentBehaviorScore: true,
      avgDaysToPay: true,
      industryBenchmarkDelta: true,
    },
  });

  const results: ClientBenchmarkResult[] = [];

  for (const client of clients) {
    const benchmark = client.industry
      ? await getIndustryBenchmark(client.industry)
      : null;

    let delta = client.industryBenchmarkDelta ?? 0;
    let performanceCategory: BenchmarkPerformanceCategory | null = null;

    if (benchmark && client.avgDaysToPay !== null) {
      delta = calculateIndustryBenchmarkDelta(
        Number(client.avgDaysToPay),
        benchmark.avgDaysToPay,
        benchmark.stdDevDaysToPay
      );
      const percentile = 50 + delta * (50 / 50); // Map delta to percentile
      performanceCategory = categorizePerformance(percentile);
    }

    results.push({
      clientId: client.id,
      clientName: client.name,
      clientIndustry: client.industry ?? 'unknown',
      clientScore: client.paymentBehaviorScore ?? 0,
      clientAvgDaysToPay: client.avgDaysToPay ? Number(client.avgDaysToPay) : 0,
      benchmarkScore: benchmark ? Math.round(benchmark.pctPayOnTime * 100) : null,
      benchmarkAvgDaysToPay: benchmark?.avgDaysToPay ?? null,
      industryBenchmarkDelta: delta,
      performanceCategory,
    });
  }

  return results;
}

/**
 * Update a client's industry benchmark delta in the database
 */
export async function updateClientBenchmarkDelta(
  clientId: string
): Promise<number | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      industry: true,
      avgDaysToPay: true,
    },
  });

  if (!client || !client.industry || client.avgDaysToPay === null) {
    return null;
  }

  const benchmark = await getIndustryBenchmark(client.industry);
  if (!benchmark) {
    return null;
  }

  const delta = calculateIndustryBenchmarkDelta(
    Number(client.avgDaysToPay),
    benchmark.avgDaysToPay,
    benchmark.stdDevDaysToPay
  );

  await prisma.client.update({
    where: { id: clientId },
    data: { industryBenchmarkDelta: delta },
  });

  return delta;
}

/**
 * Update industry benchmarks from actual payment data
 */
export async function updateBenchmarkFromPaymentData(
  industry: string,
  payments: PaymentDataPoint[]
): Promise<BenchmarkUpdateResult> {
  const normalized = normalizeIndustryName(industry);

  if (payments.length < 10) {
    return {
      industry: normalized,
      updated: false,
      previousAvgDaysToPay: null,
      newAvgDaysToPay: 0,
      sampleSize: payments.length,
      message: 'Insufficient data points (minimum 10 required)',
    };
  }

  // Calculate statistics
  const daysToPay = payments.map((p) => p.daysToPay).sort((a, b) => a - b);
  const avgDaysToPay = daysToPay.reduce((a, b) => a + b, 0) / daysToPay.length;
  const medianDaysToPay = daysToPay[Math.floor(daysToPay.length / 2)];

  const variance =
    daysToPay.reduce((sum, val) => sum + Math.pow(val - avgDaysToPay, 2), 0) /
    daysToPay.length;
  const stdDevDaysToPay = Math.sqrt(variance);

  // Calculate distribution
  const onTime = payments.filter((p) => p.daysToPay <= 0).length;
  const within30 = payments.filter((p) => p.daysToPay <= 30).length;
  const within60 = payments.filter((p) => p.daysToPay <= 60).length;
  const over90 = payments.filter((p) => p.daysToPay > 90).length;

  const pctPayOnTime = onTime / payments.length;
  const pctPay30Days = within30 / payments.length;
  const pctPay60Days = within60 / payments.length;
  const pctPay90Plus = over90 / payments.length;

  // Get existing benchmark for comparison
  const existing = await prisma.industryBenchmark.findUnique({
    where: { industry: normalized },
  });

  // Upsert the benchmark
  await prisma.industryBenchmark.upsert({
    where: { industry: normalized },
    update: {
      avgDaysToPay,
      medianDaysToPay,
      stdDevDaysToPay,
      pctPayOnTime,
      pctPay30Days,
      pctPay60Days,
      pctPay90Plus,
      sampleSize: payments.length,
    },
    create: {
      industry: normalized,
      avgDaysToPay,
      medianDaysToPay,
      stdDevDaysToPay,
      pctPayOnTime,
      pctPay30Days,
      pctPay60Days,
      pctPay90Plus,
      economicSensitivity: 1.0,
      sampleSize: payments.length,
    },
  });

  return {
    industry: normalized,
    updated: true,
    previousAvgDaysToPay: existing ? Number(existing.avgDaysToPay) : null,
    newAvgDaysToPay: avgDaysToPay,
    sampleSize: payments.length,
    message: existing
      ? `Updated benchmark from ${payments.length} data points`
      : `Created new benchmark from ${payments.length} data points`,
  };
}

/**
 * Categorize performance based on percentile rank
 */
function categorizePerformance(percentileRank: number): BenchmarkPerformanceCategory {
  if (percentileRank >= 90) return 'excellent';
  if (percentileRank >= 75) return 'above_average';
  if (percentileRank >= 25) return 'average';
  if (percentileRank >= 10) return 'below_average';
  return 'poor';
}

/**
 * Generate insights based on benchmark comparison
 */
function generateBenchmarkInsights(
  clientName: string,
  benchmark: IndustryBenchmarkData,
  avgDaysDelta: number,
  onTimeRateDelta: number,
  category: BenchmarkPerformanceCategory
): string[] {
  const insights: string[] = [];
  const industryName = benchmark.industry.replace(/_/g, ' ');

  // Overall performance insight
  switch (category) {
    case 'excellent':
      insights.push(
        `${clientName} is a top performer in the ${industryName} industry`
      );
      break;
    case 'above_average':
      insights.push(
        `${clientName} pays faster than most ${industryName} clients`
      );
      break;
    case 'average':
      insights.push(
        `${clientName} has typical payment behavior for ${industryName}`
      );
      break;
    case 'below_average':
      insights.push(
        `${clientName} pays slower than most ${industryName} clients`
      );
      break;
    case 'poor':
      insights.push(
        `${clientName} is among the slowest payers in ${industryName}`
      );
      break;
  }

  // Days to pay insight
  if (Math.abs(avgDaysDelta) >= 5) {
    if (avgDaysDelta < 0) {
      insights.push(
        `Pays ${Math.abs(Math.round(avgDaysDelta))} days faster than industry average`
      );
    } else {
      insights.push(
        `Pays ${Math.round(avgDaysDelta)} days slower than industry average`
      );
    }
  }

  // On-time rate insight
  if (Math.abs(onTimeRateDelta) >= 0.1) {
    const pctDelta = Math.round(Math.abs(onTimeRateDelta) * 100);
    if (onTimeRateDelta > 0) {
      insights.push(`On-time rate is ${pctDelta}% higher than industry average`);
    } else {
      insights.push(`On-time rate is ${pctDelta}% lower than industry average`);
    }
  }

  // Economic sensitivity insight
  if (benchmark.economicSensitivity > 1.2) {
    insights.push(
      `${industryName} clients are highly sensitive to economic conditions`
    );
  }

  return insights;
}
