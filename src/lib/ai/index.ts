/**
 * AI Module Exports
 *
 * Centralized exports for AI-powered features including:
 * - OpenAI integration
 * - Natural language insights
 * - Combined recommendations service
 */

// OpenAI client
export {
  generateCompletion,
  generateJsonCompletion,
  generateStreamingCompletion,
  isOpenAIConfigured,
  getOpenAIClient,
  openai,
  type ChatCompletionOptions,
} from './openai-client';

// Natural language insights
export {
  generateCashFlowSummary,
  generateScoreExplanation,
  generateRecoveryStrategy,
  generateGapResolutionInsight,
} from './insights';

// Combined recommendations service
export {
  generateRecommendations,
  analyzeClient,
  getCollectionOpportunities,
  type RecommendationInput,
  type RecommendationOutput,
  type DataQualityReport,
} from './recommendations';
