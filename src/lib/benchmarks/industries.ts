/**
 * Default Industry Benchmark Data
 *
 * Pre-populated benchmark data for common industries.
 * Based on industry payment behavior research and B2B payment statistics.
 */

import { IndustryBenchmarkData, SeasonalMultipliers } from './types';

/**
 * Seasonal patterns by industry type
 */
const SEASONAL_PATTERNS: Record<string, SeasonalMultipliers> = {
  // Retail - Q4 holiday rush, slow Q1
  retail: { Q1: 0.85, Q2: 0.95, Q3: 1.0, Q4: 1.2 },
  // Construction - summer peak, winter slow
  construction: { Q1: 0.8, Q2: 1.1, Q3: 1.15, Q4: 0.95 },
  // Education - academic calendar driven
  education: { Q1: 0.9, Q2: 1.05, Q3: 0.85, Q4: 1.2 },
  // Healthcare - relatively stable
  healthcare: { Q1: 1.0, Q2: 1.0, Q3: 0.95, Q4: 1.05 },
  // Technology - year-end budget flush
  technology: { Q1: 0.9, Q2: 0.95, Q3: 1.0, Q4: 1.15 },
  // Manufacturing - inventory cycles
  manufacturing: { Q1: 0.95, Q2: 1.05, Q3: 1.0, Q4: 1.0 },
  // Default pattern
  default: { Q1: 0.95, Q2: 1.0, Q3: 1.0, Q4: 1.05 },
};

/**
 * Default industry benchmarks
 * Data based on B2B payment research and industry statistics
 */
export const DEFAULT_INDUSTRY_BENCHMARKS: IndustryBenchmarkData[] = [
  {
    industry: 'technology',
    avgDaysToPay: 32.0,
    medianDaysToPay: 28.0,
    stdDevDaysToPay: 12.5,
    pctPayOnTime: 0.72,
    pctPay30Days: 0.85,
    pctPay60Days: 0.94,
    pctPay90Plus: 0.06,
    seasonalMultipliers: SEASONAL_PATTERNS.technology,
    economicSensitivity: 1.1,
    sampleSize: 10000,
  },
  {
    industry: 'healthcare',
    avgDaysToPay: 45.0,
    medianDaysToPay: 42.0,
    stdDevDaysToPay: 18.0,
    pctPayOnTime: 0.58,
    pctPay30Days: 0.72,
    pctPay60Days: 0.88,
    pctPay90Plus: 0.12,
    seasonalMultipliers: SEASONAL_PATTERNS.healthcare,
    economicSensitivity: 0.7,
    sampleSize: 8500,
  },
  {
    industry: 'manufacturing',
    avgDaysToPay: 42.0,
    medianDaysToPay: 38.0,
    stdDevDaysToPay: 15.0,
    pctPayOnTime: 0.62,
    pctPay30Days: 0.78,
    pctPay60Days: 0.91,
    pctPay90Plus: 0.09,
    seasonalMultipliers: SEASONAL_PATTERNS.manufacturing,
    economicSensitivity: 1.3,
    sampleSize: 12000,
  },
  {
    industry: 'retail',
    avgDaysToPay: 28.0,
    medianDaysToPay: 25.0,
    stdDevDaysToPay: 10.0,
    pctPayOnTime: 0.75,
    pctPay30Days: 0.88,
    pctPay60Days: 0.95,
    pctPay90Plus: 0.05,
    seasonalMultipliers: SEASONAL_PATTERNS.retail,
    economicSensitivity: 1.4,
    sampleSize: 15000,
  },
  {
    industry: 'construction',
    avgDaysToPay: 52.0,
    medianDaysToPay: 48.0,
    stdDevDaysToPay: 22.0,
    pctPayOnTime: 0.48,
    pctPay30Days: 0.65,
    pctPay60Days: 0.82,
    pctPay90Plus: 0.18,
    seasonalMultipliers: SEASONAL_PATTERNS.construction,
    economicSensitivity: 1.5,
    sampleSize: 9000,
  },
  {
    industry: 'professional_services',
    avgDaysToPay: 35.0,
    medianDaysToPay: 30.0,
    stdDevDaysToPay: 14.0,
    pctPayOnTime: 0.68,
    pctPay30Days: 0.82,
    pctPay60Days: 0.93,
    pctPay90Plus: 0.07,
    seasonalMultipliers: SEASONAL_PATTERNS.default,
    economicSensitivity: 1.0,
    sampleSize: 11000,
  },
  {
    industry: 'financial_services',
    avgDaysToPay: 25.0,
    medianDaysToPay: 22.0,
    stdDevDaysToPay: 8.0,
    pctPayOnTime: 0.82,
    pctPay30Days: 0.92,
    pctPay60Days: 0.97,
    pctPay90Plus: 0.03,
    seasonalMultipliers: SEASONAL_PATTERNS.default,
    economicSensitivity: 0.9,
    sampleSize: 7000,
  },
  {
    industry: 'transportation',
    avgDaysToPay: 38.0,
    medianDaysToPay: 35.0,
    stdDevDaysToPay: 13.0,
    pctPayOnTime: 0.65,
    pctPay30Days: 0.80,
    pctPay60Days: 0.92,
    pctPay90Plus: 0.08,
    seasonalMultipliers: SEASONAL_PATTERNS.default,
    economicSensitivity: 1.2,
    sampleSize: 6500,
  },
  {
    industry: 'real_estate',
    avgDaysToPay: 40.0,
    medianDaysToPay: 36.0,
    stdDevDaysToPay: 16.0,
    pctPayOnTime: 0.60,
    pctPay30Days: 0.76,
    pctPay60Days: 0.89,
    pctPay90Plus: 0.11,
    seasonalMultipliers: SEASONAL_PATTERNS.default,
    economicSensitivity: 1.4,
    sampleSize: 5500,
  },
  {
    industry: 'education',
    avgDaysToPay: 48.0,
    medianDaysToPay: 45.0,
    stdDevDaysToPay: 20.0,
    pctPayOnTime: 0.52,
    pctPay30Days: 0.68,
    pctPay60Days: 0.85,
    pctPay90Plus: 0.15,
    seasonalMultipliers: SEASONAL_PATTERNS.education,
    economicSensitivity: 0.6,
    sampleSize: 4000,
  },
  {
    industry: 'hospitality',
    avgDaysToPay: 30.0,
    medianDaysToPay: 28.0,
    stdDevDaysToPay: 11.0,
    pctPayOnTime: 0.70,
    pctPay30Days: 0.85,
    pctPay60Days: 0.94,
    pctPay90Plus: 0.06,
    seasonalMultipliers: SEASONAL_PATTERNS.retail,
    economicSensitivity: 1.6,
    sampleSize: 7500,
  },
  {
    industry: 'media_entertainment',
    avgDaysToPay: 55.0,
    medianDaysToPay: 50.0,
    stdDevDaysToPay: 25.0,
    pctPayOnTime: 0.45,
    pctPay30Days: 0.62,
    pctPay60Days: 0.80,
    pctPay90Plus: 0.20,
    seasonalMultipliers: SEASONAL_PATTERNS.default,
    economicSensitivity: 1.3,
    sampleSize: 3500,
  },
  {
    industry: 'agriculture',
    avgDaysToPay: 45.0,
    medianDaysToPay: 40.0,
    stdDevDaysToPay: 18.0,
    pctPayOnTime: 0.55,
    pctPay30Days: 0.72,
    pctPay60Days: 0.88,
    pctPay90Plus: 0.12,
    seasonalMultipliers: { Q1: 0.85, Q2: 1.1, Q3: 1.1, Q4: 0.95 },
    economicSensitivity: 1.2,
    sampleSize: 4500,
  },
  {
    industry: 'energy',
    avgDaysToPay: 38.0,
    medianDaysToPay: 35.0,
    stdDevDaysToPay: 14.0,
    pctPayOnTime: 0.68,
    pctPay30Days: 0.82,
    pctPay60Days: 0.93,
    pctPay90Plus: 0.07,
    seasonalMultipliers: SEASONAL_PATTERNS.default,
    economicSensitivity: 1.0,
    sampleSize: 5000,
  },
  {
    industry: 'government',
    avgDaysToPay: 60.0,
    medianDaysToPay: 55.0,
    stdDevDaysToPay: 22.0,
    pctPayOnTime: 0.40,
    pctPay30Days: 0.55,
    pctPay60Days: 0.75,
    pctPay90Plus: 0.25,
    seasonalMultipliers: { Q1: 0.8, Q2: 1.0, Q3: 1.0, Q4: 1.2 },
    economicSensitivity: 0.3,
    sampleSize: 6000,
  },
  {
    industry: 'nonprofit',
    avgDaysToPay: 50.0,
    medianDaysToPay: 45.0,
    stdDevDaysToPay: 20.0,
    pctPayOnTime: 0.50,
    pctPay30Days: 0.68,
    pctPay60Days: 0.85,
    pctPay90Plus: 0.15,
    seasonalMultipliers: { Q1: 0.9, Q2: 0.95, Q3: 0.95, Q4: 1.2 },
    economicSensitivity: 0.8,
    sampleSize: 3000,
  },
];

/**
 * Get default benchmark for a specific industry
 */
export function getDefaultBenchmark(industry: string): IndustryBenchmarkData | null {
  const normalized = normalizeIndustryName(industry);
  return DEFAULT_INDUSTRY_BENCHMARKS.find(
    (b) => normalizeIndustryName(b.industry) === normalized
  ) || null;
}

/**
 * Get all available industry names
 */
export function getAvailableIndustries(): string[] {
  return DEFAULT_INDUSTRY_BENCHMARKS.map((b) => b.industry);
}

/**
 * Normalize industry name for consistent matching
 */
export function normalizeIndustryName(industry: string): string {
  return industry
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Find the closest matching industry based on partial name
 */
export function findClosestIndustry(searchTerm: string): string | null {
  const normalized = normalizeIndustryName(searchTerm);

  // Exact match
  const exact = DEFAULT_INDUSTRY_BENCHMARKS.find(
    (b) => normalizeIndustryName(b.industry) === normalized
  );
  if (exact) return exact.industry;

  // Partial match
  const partial = DEFAULT_INDUSTRY_BENCHMARKS.find(
    (b) => normalizeIndustryName(b.industry).includes(normalized) ||
           normalized.includes(normalizeIndustryName(b.industry))
  );
  if (partial) return partial.industry;

  // Common aliases
  const aliases: Record<string, string> = {
    tech: 'technology',
    it: 'technology',
    software: 'technology',
    saas: 'technology',
    medical: 'healthcare',
    health: 'healthcare',
    pharma: 'healthcare',
    factory: 'manufacturing',
    industrial: 'manufacturing',
    store: 'retail',
    ecommerce: 'retail',
    consulting: 'professional_services',
    legal: 'professional_services',
    accounting: 'professional_services',
    bank: 'financial_services',
    finance: 'financial_services',
    insurance: 'financial_services',
    logistics: 'transportation',
    shipping: 'transportation',
    trucking: 'transportation',
    property: 'real_estate',
    housing: 'real_estate',
    school: 'education',
    university: 'education',
    hotel: 'hospitality',
    restaurant: 'hospitality',
    food: 'hospitality',
    media: 'media_entertainment',
    entertainment: 'media_entertainment',
    film: 'media_entertainment',
    farming: 'agriculture',
    oil: 'energy',
    gas: 'energy',
    utilities: 'energy',
    public_sector: 'government',
    federal: 'government',
    state: 'government',
    municipal: 'government',
    charity: 'nonprofit',
    ngo: 'nonprofit',
  };

  return aliases[normalized] || null;
}
