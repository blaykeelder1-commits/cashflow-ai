/**
 * Industry Benchmarks Types
 *
 * Types for industry payment behavior benchmarks and client comparisons
 */

/**
 * Industry benchmark data matching the Prisma IndustryBenchmark model
 */
export interface IndustryBenchmarkData {
  id?: string;
  industry: string;
  avgDaysToPay: number;
  medianDaysToPay: number;
  stdDevDaysToPay: number;
  pctPayOnTime: number;
  pctPay30Days: number;
  pctPay60Days: number;
  pctPay90Plus: number;
  seasonalMultipliers?: SeasonalMultipliers | null;
  economicSensitivity: number;
  sampleSize: number;
  lastUpdated?: Date;
  createdAt?: Date;
}

/**
 * Seasonal multipliers for payment timing adjustments
 * Values > 1.0 mean faster payments, < 1.0 mean slower payments
 */
export interface SeasonalMultipliers {
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
}

/**
 * Result of comparing a client to their industry benchmark
 */
export interface BenchmarkComparison {
  clientId: string;
  clientName: string;
  industry: string;
  benchmark: IndustryBenchmarkData;
  comparison: {
    avgDaysToPayDelta: number; // Negative = better than benchmark
    onTimeRateDelta: number; // Positive = better than benchmark
    performanceCategory: BenchmarkPerformanceCategory;
    percentileRank: number; // 0-100, where 100 is best
  };
  insights: string[];
  calculatedAt: Date;
}

/**
 * Performance category relative to industry benchmark
 */
export type BenchmarkPerformanceCategory =
  | 'excellent' // Top 10%
  | 'above_average' // Top 25%
  | 'average' // Middle 50%
  | 'below_average' // Bottom 25%
  | 'poor'; // Bottom 10%

/**
 * Aggregated result for a client including benchmark data
 */
export interface ClientBenchmarkResult {
  clientId: string;
  clientName: string;
  clientIndustry: string;
  clientScore: number;
  clientAvgDaysToPay: number;
  benchmarkScore: number | null;
  benchmarkAvgDaysToPay: number | null;
  industryBenchmarkDelta: number; // -50 to +50, positive is better
  performanceCategory: BenchmarkPerformanceCategory | null;
}

/**
 * Options for fetching benchmarks
 */
export interface BenchmarkFetchOptions {
  industry?: string;
  includeSeasonalData?: boolean;
}

/**
 * Result of updating benchmarks from payment data
 */
export interface BenchmarkUpdateResult {
  industry: string;
  updated: boolean;
  previousAvgDaysToPay: number | null;
  newAvgDaysToPay: number;
  sampleSize: number;
  message: string;
}

/**
 * Input data for calculating benchmarks from payments
 */
export interface PaymentDataPoint {
  clientId: string;
  industry: string;
  amount: number;
  dueDate: Date;
  paidDate: Date;
  daysToPay: number;
}
