/**
 * OpenAI Integration Client
 *
 * Provides a configured OpenAI client for generating insights and recommendations.
 * Features:
 * - Singleton pattern for client reuse
 * - Error handling and retry logic
 * - Rate limiting protection
 * - Streaming support for long responses
 */

import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model configuration
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface ChatCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Generate a chat completion with retry logic
 */
export async function generateCompletion(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 1024,
    temperature = 0.7,
    systemPrompt = 'You are a helpful financial analyst assistant specializing in cash flow management and business intelligence.',
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return content;
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error
      if (isRateLimitError(error)) {
        await delay(RETRY_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error('Failed to generate completion after retries');
}

/**
 * Generate a structured JSON response
 */
export async function generateJsonCompletion<T>(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<T> {
  const jsonPrompt = `${prompt}\n\nRespond with valid JSON only. No additional text or formatting.`;

  const response = await generateCompletion(jsonPrompt, {
    ...options,
    temperature: 0.3, // Lower temperature for structured output
  });

  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    throw new Error(`Failed to parse JSON response: ${response}`);
  }
}

/**
 * Generate a streaming completion for long responses
 */
export async function* generateStreamingCompletion(
  prompt: string,
  options: ChatCompletionOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 2048,
    temperature = 0.7,
    systemPrompt = 'You are a helpful financial analyst assistant specializing in cash flow management and business intelligence.',
  } = options;

  const stream = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('rate limit') ||
           error.message.includes('429') ||
           error.message.includes('Too Many Requests');
  }
  return false;
}

/**
 * Delay utility for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if OpenAI is properly configured
 */
export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Get the OpenAI client instance (for advanced use cases)
 */
export function getOpenAIClient(): OpenAI {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY environment variable.');
  }
  return openai;
}

// Export the client for direct access if needed
export { openai };
