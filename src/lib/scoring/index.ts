/**
 * Scoring Module Exports
 *
 * Centralized exports for all scoring functions and types
 */

// Type exports
export * from './types';

// Payment behavior scoring
export {
  calculatePaymentBehaviorScore,
  calculateBatchPaymentScores,
  scoreTierFromScore,
  getTierDescription,
  groupClientsByTier,
} from './payment-behavior';

// Recovery likelihood scoring
export {
  calculateRecoveryLikelihood,
  calculateBatchRecoveryLikelihood,
  calculateExpectedValue,
  getRecoveryCategory,
  prioritizeOverdueInvoices,
  calculateTotalExpectedRecovery,
  getRecoveryRecommendations,
} from './recovery-likelihood';

// Follow-up recommendations
export {
  generateFollowUpRecommendation,
  generateBatchFollowUpRecommendations,
  getTodaysFollowUpQueue,
} from './follow-up';
