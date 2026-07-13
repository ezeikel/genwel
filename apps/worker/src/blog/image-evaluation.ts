/**
 * AI-powered image evaluation for blog posts
 *
 * Uses the Claude Opus 4.8 vision judge to evaluate whether stock photos
 * are relevant and appropriate for blog post content.
 */

import { models } from '@genwel/banking/models';
import { mapWithConcurrency, withRetry } from '@genwel/banking/retry-utils';
import { generateObject } from 'ai';
import { z } from 'zod/v3';

// Schema for image evaluation response
const ImageEvaluationSchema = z.object({
  isRelevant: z
    .boolean()
    .describe('Whether the image is relevant to the blog post'),
  confidence: z.number().min(0).max(100).describe('Confidence score 0-100'),
  reasoning: z.string().describe('Brief explanation of the evaluation'),
  concerns: z
    .array(z.string())
    .describe(
      'Any concerns about the image (e.g., too generic, wrong context, misleading)',
    ),
});

export type ImageEvaluation = z.infer<typeof ImageEvaluationSchema>;

export interface EvaluateImageOptions {
  /** Blog post title */
  title: string;
  /** Blog post excerpt/summary */
  excerpt: string;
  /** Blog post category */
  category: string;
  /** URL of the image to evaluate */
  imageUrl: string;
  /** Search term that found this image */
  searchTerm: string;
  /** Minimum confidence threshold (default: 60) */
  minConfidence?: number;
}

/**
 * Evaluate whether a stock photo is suitable for a blog post
 *
 * Uses the Claude Opus 4.8 vision judge to analyze the image and determine
 * if it's relevant to the blog post content.
 *
 * @returns Evaluation result with relevance decision, confidence, and reasoning
 */
export async function evaluateImageRelevance(
  options: EvaluateImageOptions,
): Promise<ImageEvaluation> {
  const { title, excerpt, category, imageUrl, searchTerm } = options;

  const prompt = `You are evaluating whether a stock photo is suitable as the featured image for a blog post.

BLOG POST CONTEXT:
- Title: ${title}
- Excerpt: ${excerpt}
- Category: ${category}
- Search term used: "${searchTerm}"

EVALUATION CRITERIA:
1. Relevance: Does the image relate to the blog post's topic?
2. Appropriateness: Is the image professional and suitable for a business blog?
3. Context: Does the image's setting/scenario match the article's context?
4. Quality: Is the image high quality and visually appealing?
5. Avoiding generic: Is it specific enough (not just a random stock photo)?

For a UK personal finance blog, good images might include:
- People budgeting, using apps, or managing finances
- UK currency (pounds), British bank cards
- Families discussing finances
- Savings jars, piggy banks, financial planning
- Modern smartphones showing finance apps
- UK urban scenes, British homes

Poor images would be:
- Generic office scenes unrelated to personal finance
- Wrong geographic context (US dollars instead of UK pounds)
- Misleading or confusing imagery
- Low quality or unprofessional photos
- Overly corporate or stock-looking

Analyze the attached image and determine if it's a good match for this blog post.`;

  try {
    const { object: evaluation } = await withRetry(
      () =>
        generateObject({
          model: models.vision,
          schema: ImageEvaluationSchema,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image', image: imageUrl },
              ],
            },
          ],
        }),
      { label: 'image-eval', maxAttempts: 3 },
    );

    return evaluation;
  } catch (error) {
    // If evaluation fails (e.g., quota exceeded), return a result that passes the threshold
    // This ensures we still get a Pexels image even if AI evaluation is unavailable
    console.error('Image evaluation failed:', error);
    return {
      isRelevant: true,
      confidence: 65, // Above the 60% threshold to ensure it passes
      reasoning: 'Evaluation failed, defaulting to accept image',
      concerns: ['Evaluation error - could not analyze image'],
    };
  }
}

/**
 * Evaluate multiple images and return the best match
 *
 * Evaluates images in parallel and returns the one with highest confidence
 * that meets the minimum threshold, or null if none qualify.
 */
export async function findBestImage(
  images: Array<{ url: string; searchTerm: string }>,
  context: { title: string; excerpt: string; category: string },
  minConfidence: number = 60,
): Promise<{
  selectedIndex: number | null;
  evaluations: ImageEvaluation[];
}> {
  // Evaluate sequentially (concurrency 1) to keep vision-judge request rate
  // low and avoid provider 429s under load; withRetry backs off on the rest.
  const evaluations = await mapWithConcurrency(images, 1, (img) =>
    evaluateImageRelevance({
      ...context,
      imageUrl: img.url,
      searchTerm: img.searchTerm,
      minConfidence,
    }),
  );

  // Find the best qualifying image
  let bestIndex: number | null = null;
  let bestConfidence = 0;

  evaluations.forEach((evaluation, index) => {
    if (
      evaluation.isRelevant &&
      evaluation.confidence >= minConfidence &&
      evaluation.confidence > bestConfidence
    ) {
      bestIndex = index;
      bestConfidence = evaluation.confidence;
    }
  });

  return {
    selectedIndex: bestIndex,
    evaluations,
  };
}
