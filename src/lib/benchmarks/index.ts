/**
 * Industry Benchmarks Module Exports
 *
 * Centralized exports for industry benchmark functions and types
 */

// Type exports
export * from './types';

// Industry data exports
export {
  DEFAULT_INDUSTRY_BENCHMARKS,
  getDefaultBenchmark,
  getAvailableIndustries,
  normalizeIndustryName,
  findClosestIndustry,
} from './industries';

// Core benchmark functions
export {
  getIndustryBenchmark,
  getAllIndustryBenchmarks,
  compareClientToBenchmark,
  calculateIndustryBenchmarkDelta,
  getBenchmarkResultsForOrganization,
  updateClientBenchmarkDelta,
  updateBenchmarkFromPaymentData,
} from './benchmarks';
