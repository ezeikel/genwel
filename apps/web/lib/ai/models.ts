import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

/**
 * AI Model Configuration
 *
 * Centralized model definitions for consistent usage across the application.
 * Change models here to switch providers or model versions globally.
 *
 * Model roles (updated Jul 2026):
 * - Categorization is high-volume/low-cost → GPT-5.6 Luna (cheap, fast, smart
 *   enough for structured labelling; replaces Gemini, which throttled hard).
 * - Insights / budget suggestions are high-value/low-frequency → Claude Sonnet 5
 *   (strongest reasoning per £ for money advice).
 * - Gemini is kept ONLY for vision/image work (image evaluation + generation),
 *   where it remains a good fit and volume is low.
 */

// Model identifiers
export const MODEL_IDS = {
  // OpenAI text models
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  // GPT-5.6 Luna — cheapest 5.6 tier ($1/$6). Fast structured output; used for
  // high-volume transaction categorization.
  GPT_5_6_LUNA: 'gpt-5.6-luna',

  // Anthropic models
  // Sonnet 5 — strong reasoning at Sonnet pricing; used for financial insights
  // and budget suggestions (high-value, low-frequency).
  CLAUDE_SONNET_5: 'claude-sonnet-5',

  // Google Gemini models — VISION ONLY now (categorization moved to GPT-5.6).
  // Most intelligent multimodal model - best for vision/evaluation
  GEMINI_3_PRO: 'gemini-3-pro-preview',
  // Image generation model (use with generateText, not generateImage)
  GEMINI_3_PRO_IMAGE: 'gemini-3-pro-image-preview',
} as const;

// Pre-configured model instances
export const models = {
  // Primary text model for complex tasks (blog content, structured output)
  text: openai(MODEL_IDS.GPT_4O),

  // Faster/cheaper text model for simpler tasks
  textFast: openai(MODEL_IDS.GPT_4O_MINI),

  // High-volume analytics/categorization — GPT-5.6 Luna.
  // Best for: transaction categorization, structured extraction at scale.
  analytics: openai(MODEL_IDS.GPT_5_6_LUNA),

  // Most intelligent vision model for evaluation (Gemini 3 Pro).
  // Best for: evaluating image relevance, quality assessment.
  vision: google(MODEL_IDS.GEMINI_3_PRO),

  // Gemini image generation model (uses generateText, not generateImage).
  // Best for: blog featured images when Pexels doesn't have suitable photos.
  geminiImage: google(MODEL_IDS.GEMINI_3_PRO_IMAGE),

  // Most capable reasoning model for high-value, low-frequency tasks — Sonnet 5.
  // Best for: financial insights, personalised advice, budget suggestions.
  intelligent: anthropic(MODEL_IDS.CLAUDE_SONNET_5),
};

// Type exports
export type ModelId = (typeof MODEL_IDS)[keyof typeof MODEL_IDS];
export type ModelType = keyof typeof models;
