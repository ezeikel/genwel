'use server';

import { models } from '@genwel/banking/models';
import {
  experimental_generateImage as generateImage,
  generateObject,
  generateText,
} from 'ai';
import { z } from 'zod/v3';
import { findBestImage, type ImageEvaluation } from '@/lib/ai/image-evaluation';
import {
  BLOG_CONTENT_PROMPT,
  BLOG_IMAGE_GENERATION_PROMPT,
  BLOG_META_PROMPT,
  BLOG_TOPICS,
} from '@/lib/ai/prompts';
import { createServerLogger } from '@/lib/logger';
import {
  downloadPhoto,
  fetchBlogPhotosForEvaluation,
  formatPhotoCredit,
  type PexelsPhoto,
} from '@/lib/pexels/client';
import {
  generateAltText,
  getCombinedSearchTerms,
} from '@/lib/pexels/search-terms';
import { sanityFetch, writeClient } from '@/lib/sanity/client';
import { coveredTopicsQuery } from '@/lib/sanity/queries';

// Create a server logger for blog generation
const log = createServerLogger({ action: 'blog_generation' });

// Types
type ImageSource = 'pexels' | 'gpt-image' | 'manual';

interface FeaturedImage {
  asset: { _type: 'reference'; _ref: string };
  alt: string;
  credit?: string;
  creditUrl?: string;
  pexelsPhotoId?: string;
}

// Schema for blog metadata
const BlogMetaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  keywords: z.array(z.string()),
  category: z.string(),
});

type BlogMeta = z.infer<typeof BlogMetaSchema>;

/** Minimum confidence score for AI to approve a Pexels image */
const IMAGE_EVALUATION_THRESHOLD = 60;

// Get topics that have already been covered
export async function getCoveredTopics(): Promise<string[]> {
  const topics = await sanityFetch<(string | null)[]>({
    query: coveredTopicsQuery,
    revalidate: 0,
  });
  return topics.filter((t): t is string => t !== null);
}

// Get a random uncovered topic
export async function getRandomUncoveredTopic(): Promise<string | null> {
  const coveredTopics = await getCoveredTopics();
  const uncoveredTopics = BLOG_TOPICS.filter(
    (topic) => !coveredTopics.includes(topic),
  );

  if (uncoveredTopics.length === 0) {
    return null;
  }

  return uncoveredTopics[Math.floor(Math.random() * uncoveredTopics.length)];
}

/**
 * Get all Pexels photo IDs currently in use across blog posts
 * Used for deduplication to avoid using the same photo twice
 */
async function getUsedPexelsIds(excludePostId?: string): Promise<string[]> {
  const query = excludePostId
    ? `*[_type == "post" && _id != $excludePostId && defined(generationMeta.pexelsPhotoId)].generationMeta.pexelsPhotoId`
    : `*[_type == "post" && defined(generationMeta.pexelsPhotoId)].generationMeta.pexelsPhotoId`;

  const ids = await writeClient.fetch<string[]>(query, { excludePostId });
  return ids;
}

// Generate blog metadata
async function generateBlogMeta(topic: string): Promise<BlogMeta> {
  const { object } = await generateObject({
    model: models.text,
    schema: BlogMetaSchema,
    prompt: `${BLOG_META_PROMPT}\n\nTopic: ${topic}`,
  });

  return object;
}

// Generate blog content
async function generateBlogContent(
  meta: BlogMeta,
  existingPosts: string[],
): Promise<string> {
  const existingContext =
    existingPosts.length > 0
      ? `\n\nNote: We've already covered these topics, so ensure this post offers unique value:\n${existingPosts.slice(0, 5).join('\n')}`
      : '';

  const { text } = await generateText({
    model: models.text,
    system: BLOG_CONTENT_PROMPT + existingContext,
    prompt: `Write a blog post titled "${meta.title}" about ${meta.excerpt}`,
  });

  return text;
}

/**
 * Get search terms for image lookup
 * Uses the search-terms module for efficient, pre-defined mappings
 */
function getImageSearchTerms(
  title: string,
  category: string,
): { searchTerms: string[]; altText: string } {
  const searchTerms = getCombinedSearchTerms(category, title);
  const altText = generateAltText(searchTerms[0] || 'finance', { title });
  return { searchTerms, altText };
}

/**
 * Generate a blog featured image with gpt-image-2 when Pexels doesn't have a
 * suitable photo. Uses OpenAI's gpt-image-2 (quality 'high', landscape) via the
 * Vercel AI SDK's experimental_generateImage. Returns null on failure so the
 * caller can degrade gracefully (post ships without a featured image).
 */
async function generateImageWithOpenAI(
  title: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const prompt = BLOG_IMAGE_GENERATION_PROMPT.replace('{{TITLE}}', title);

  try {
    log.info('Generating image with gpt-image-2', { title });

    const { image } = await generateImage({
      model: models.blogImage,
      prompt: `Generate a high-quality professional photograph for this blog post. Do not include any text in the image. ${prompt}`,
      // Landscape hero (3:2). gpt-image-2 supports 1024x1024 / 1024x1536 / 1536x1024.
      size: '1536x1024',
      providerOptions: {
        openai: {
          quality: 'high',
          // Blog imagery is benign; keep default 'auto' moderation but pin it
          // explicitly so behaviour is stable across model updates.
          moderation: 'auto',
        },
      },
    });

    log.info('gpt-image-2 image generated successfully', { title });

    return {
      buffer: Buffer.from(image.uint8Array),
      mimeType: image.mediaType || 'image/png',
    };
  } catch (error) {
    log.error(
      'gpt-image-2 image generation failed',
      { title },
      error instanceof Error ? error : undefined,
    );
    return null;
  }
}

/**
 * Upload image to Sanity from buffer
 */
async function uploadImageToSanity(
  buffer: Buffer,
  filename: string,
): Promise<{ _type: 'reference'; _ref: string }> {
  const asset = await writeClient.assets.upload('image', buffer, {
    filename,
  });

  return {
    _type: 'reference',
    _ref: asset._id,
  };
}

/**
 * Get featured image from Pexels (with AI evaluation) or gpt-image-2.
 *
 * Flow:
 * 1. Get search terms using pre-defined mappings (efficient, no AI call)
 * 2. Fetch multiple candidate photos from Pexels (excluding already-used photos)
 * 3. Use AI vision model to evaluate each photo's relevance
 * 4. Select the best photo that meets the confidence threshold
 * 5. Fall back to gpt-image-2 generation if no Pexels photo qualifies
 */
async function getFeaturedImage(
  title: string,
  excerpt: string,
  category: string,
  slug: string,
  excludeIds: string[] = [],
): Promise<FeaturedImage | null> {
  log.info('Getting featured image', {
    title,
    category,
    slug,
    excludeIdsCount: excludeIds.length,
  });

  try {
    // 1. Get search terms using pre-defined mappings (no AI call needed)
    const { searchTerms, altText } = getImageSearchTerms(title, category);
    log.debug('Using search terms', { searchTerms: searchTerms.slice(0, 5) });

    // 2. Fetch multiple candidate photos from Pexels (excluding already-used)
    log.info('Searching Pexels for candidates', {
      termCount: searchTerms.length,
      excludingCount: excludeIds.length,
    });
    const pexelsResult = await fetchBlogPhotosForEvaluation(searchTerms, {
      orientation: 'landscape',
      excludeIds,
    });

    let selectedPhoto: PexelsPhoto | null = null;
    let selectedSearchTerm = '';
    let evaluationResult: ImageEvaluation | null = null;

    if (pexelsResult.photos.length > 0) {
      // 3. Evaluate photos with AI vision model (Gemini 3 Pro)
      log.info('Evaluating Pexels images with AI', {
        candidateCount: pexelsResult.photos.length,
      });

      try {
        const { selectedIndex, evaluations } = await findBestImage(
          pexelsResult.photos.map((p) => ({
            url: p.photo.src.large,
            searchTerm: p.searchTerm,
          })),
          { title, excerpt, category },
          IMAGE_EVALUATION_THRESHOLD,
        );

        if (selectedIndex !== null) {
          selectedPhoto = pexelsResult.photos[selectedIndex].photo;
          selectedSearchTerm = pexelsResult.photos[selectedIndex].searchTerm;
          evaluationResult = evaluations[selectedIndex];

          log.info('AI selected Pexels image', {
            searchTerm: selectedSearchTerm,
            photographer: selectedPhoto.photographer,
            photoId: selectedPhoto.id,
            confidence: evaluationResult.confidence,
          });
        } else {
          // Log why no photo was selected
          const bestEvaluation = evaluations.reduce(
            (best, curr) => (curr.confidence > best.confidence ? curr : best),
            evaluations[0],
          );
          log.info('AI rejected all Pexels images', {
            bestConfidence: bestEvaluation?.confidence ?? 0,
            threshold: IMAGE_EVALUATION_THRESHOLD,
          });
        }
      } catch (evalError) {
        // If AI evaluation fails, fall back to using the first Pexels photo
        log.warn(
          'AI evaluation failed, using first Pexels photo',
          {},
          evalError instanceof Error ? evalError : undefined,
        );
        selectedPhoto = pexelsResult.photos[0].photo;
        selectedSearchTerm = pexelsResult.photos[0].searchTerm;
      }
    }

    // 4. Use selected Pexels photo if available
    if (selectedPhoto) {
      const buffer = await downloadPhoto(selectedPhoto, 'large2x');
      const assetRef = await uploadImageToSanity(
        buffer,
        `${slug}-featured.jpg`,
      );
      const credit = formatPhotoCredit(selectedPhoto);

      return {
        asset: assetRef,
        alt: altText,
        credit: credit.credit,
        creditUrl: credit.creditUrl,
        pexelsPhotoId: String(selectedPhoto.id),
      };
    }

    // 5. Fallback to gpt-image-2 generation
    log.info('No suitable Pexels image, falling back to gpt-image-2', {
      title,
    });
    const generatedResult = await generateImageWithOpenAI(title);

    if (generatedResult) {
      const assetRef = await uploadImageToSanity(
        generatedResult.buffer,
        `${slug}-featured-generated.png`,
      );

      return {
        asset: assetRef,
        alt: altText,
        credit: 'Generated with AI',
      };
    }

    log.warn('gpt-image-2 image generation returned no image', { title });
    return null;
  } catch (error) {
    log.error(
      'Error getting featured image',
      { title },
      error instanceof Error ? error : undefined,
    );
    return null;
  }
}

// Parse inline markdown (bold, italic) into Portable Text spans
function parseInlineMarkdown(text: string): unknown[] {
  const spans: unknown[] = [];
  let spanIndex = 0;

  // Regex to match **bold**, *italic*, or ***bold italic***
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText) {
        spans.push({
          _type: 'span',
          _key: `span-${spanIndex++}`,
          text: beforeText,
        });
      }
    }

    // Determine the type of match
    if (match[2]) {
      // ***bold italic***
      spans.push({
        _type: 'span',
        _key: `span-${spanIndex++}`,
        text: match[2],
        marks: ['strong', 'em'],
      });
    } else if (match[3]) {
      // **bold**
      spans.push({
        _type: 'span',
        _key: `span-${spanIndex++}`,
        text: match[3],
        marks: ['strong'],
      });
    } else if (match[4]) {
      // *italic*
      spans.push({
        _type: 'span',
        _key: `span-${spanIndex++}`,
        text: match[4],
        marks: ['em'],
      });
    }

    lastIndex = regex.lastIndex;
    match = regex.exec(text);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      spans.push({
        _type: 'span',
        _key: `span-${spanIndex++}`,
        text: remainingText,
      });
    }
  }

  // If no matches, return simple span
  if (spans.length === 0) {
    return [{ _type: 'span', _key: 'span-0', text }];
  }

  return spans;
}

// Convert markdown to Portable Text
function markdownToPortableText(markdown: string): unknown[] {
  const blocks: unknown[] = [];
  const lines = markdown.split('\n');

  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push({
          _type: 'block',
          _key: `block-${blocks.length}`,
          style: 'normal',
          children: parseInlineMarkdown(text),
        });
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip the title if it starts with # (we already have the title in meta)
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
      continue;
    }

    // Headers
    if (trimmedLine.startsWith('## ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'h2',
        children: parseInlineMarkdown(trimmedLine.slice(3)),
      });
    } else if (trimmedLine.startsWith('### ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'h3',
        children: parseInlineMarkdown(trimmedLine.slice(4)),
      });
    } else if (trimmedLine.startsWith('#### ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'h4',
        children: parseInlineMarkdown(trimmedLine.slice(5)),
      });
    } else if (trimmedLine === '') {
      flushParagraph();
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'normal',
        listItem: 'bullet',
        children: parseInlineMarkdown(trimmedLine.slice(2)),
      });
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'normal',
        listItem: 'number',
        children: parseInlineMarkdown(trimmedLine.replace(/^\d+\.\s/, '')),
      });
    } else if (trimmedLine.startsWith('> ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'blockquote',
        children: parseInlineMarkdown(trimmedLine.slice(2)),
      });
    } else {
      currentParagraph.push(trimmedLine);
    }
  }

  flushParagraph();
  return blocks;
}

// Create blog post in Sanity
async function createSanityPost(
  meta: BlogMeta,
  body: unknown[],
  featuredImage: FeaturedImage | null,
  topic: string,
): Promise<{ _id: string; slug: string }> {
  // Find or create default author
  const authors = await writeClient.fetch(
    `*[_type == "author"][0]{ _id, name }`,
  );

  let authorRef = authors?._id;

  if (!authorRef) {
    // Create default author
    const author = await writeClient.create({
      _type: 'author',
      name: 'Genwel Team',
      slug: { _type: 'slug', current: 'genwel-team' },
      title: 'Content Team',
    });
    authorRef = author._id;
  }

  // Build featuredImage object for Sanity
  let featuredImageData = null;
  if (featuredImage) {
    featuredImageData = {
      _type: 'image',
      asset: featuredImage.asset,
      alt: featuredImage.alt,
      credit: featuredImage.credit,
      creditUrl: featuredImage.creditUrl,
    };
  }

  // Find matching category
  const categories = await writeClient.fetch(
    `*[_type == "category" && title == $category]{ _id }`,
    { category: meta.category },
  );

  let categoryRef = categories?.[0]?._id;

  if (!categoryRef) {
    // Create category
    const category = await writeClient.create({
      _type: 'category',
      title: meta.category,
      slug: {
        _type: 'slug',
        current: meta.category.toLowerCase().replace(/\s+/g, '-'),
      },
    });
    categoryRef = category._id;
  }

  // Determine image source
  const imageSource: ImageSource = featuredImage?.pexelsPhotoId
    ? 'pexels'
    : featuredImage
      ? 'gpt-image'
      : 'manual';

  // Create post
  const post = await writeClient.create({
    _type: 'post',
    title: meta.title,
    slug: { _type: 'slug', current: meta.slug },
    author: { _type: 'reference', _ref: authorRef },
    featuredImage: featuredImageData,
    categories: [{ _type: 'reference', _ref: categoryRef }],
    excerpt: meta.excerpt,
    body,
    publishedAt: new Date().toISOString(),
    status: 'published',
    seo: {
      metaTitle: meta.title,
      metaDescription: meta.excerpt,
    },
    generationMeta: {
      isGenerated: true,
      generatedAt: new Date().toISOString(),
      imageSource,
      imageUpdatedAt: new Date().toISOString(),
      prompt: topic,
      ...(featuredImage?.pexelsPhotoId && {
        pexelsPhotoId: featuredImage.pexelsPhotoId,
      }),
    },
  });

  return { _id: post._id, slug: meta.slug };
}

// Main generation function
export async function generateBlogPostForTopic(topic: string): Promise<{
  success: boolean;
  slug?: string;
  title?: string;
  error?: string;
}> {
  try {
    // 1. Generate metadata
    const meta = await generateBlogMeta(topic);

    // 2. Check if slug already exists
    const existingPost = await writeClient.fetch(
      `*[_type == "post" && slug.current == $slug][0]{ _id }`,
      { slug: meta.slug },
    );

    if (existingPost) {
      return {
        success: false,
        error: `Post with slug "${meta.slug}" already exists`,
      };
    }

    // 3. Get existing posts for context
    const coveredTopics = await getCoveredTopics();

    // 4. Generate content
    const content = await generateBlogContent(meta, coveredTopics);

    // 5. Get featured image (Pexels first with AI evaluation, then Gemini)
    const usedPexelsIds = await getUsedPexelsIds();
    log.debug('Excluding already-used Pexels photos', {
      count: usedPexelsIds.length,
    });
    const featuredImage = await getFeaturedImage(
      meta.title,
      meta.excerpt,
      meta.category,
      meta.slug,
      usedPexelsIds,
    );

    // 6. Convert to Portable Text
    const body = markdownToPortableText(content);

    // 7. Create post in Sanity
    const { slug } = await createSanityPost(meta, body, featuredImage, topic);

    return { success: true, slug, title: meta.title };
  } catch (error) {
    log.error(
      'Error generating blog post',
      { topic },
      error instanceof Error ? error : undefined,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Generate random blog post
export async function generateRandomBlogPost(): Promise<{
  success: boolean;
  slug?: string;
  title?: string;
  error?: string;
}> {
  const topic = await getRandomUncoveredTopic();

  if (!topic) {
    return { success: false, error: 'All topics have been covered' };
  }

  return generateBlogPostForTopic(topic);
}

/**
 * Regenerate featured image for an existing post
 * Uses AI Judge + Gemini fallback flow
 */
export async function regeneratePostImage(postId: string): Promise<{
  success: boolean;
  imageSource?: 'pexels' | 'gpt-image';
  error?: string;
}> {
  try {
    // 1. Fetch post details
    const post = await writeClient.fetch(
      `*[_type == "post" && _id == $postId][0]{
        _id,
        title,
        excerpt,
        "slug": slug.current,
        "category": categories[0]->title
      }`,
      { postId },
    );

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    log.info('Regenerating image for post', { postId, title: post.title });

    // 2. Get used Pexels IDs (excluding this post's current ID)
    const usedPexelsIds = await getUsedPexelsIds(postId);
    log.debug('Excluding already-used Pexels photos', {
      count: usedPexelsIds.length,
    });

    const featuredImage = await getFeaturedImage(
      post.title,
      post.excerpt || '',
      post.category || 'Budgeting',
      post.slug,
      usedPexelsIds,
    );

    if (!featuredImage) {
      return { success: false, error: 'Failed to generate image' };
    }

    // 4. Determine image source
    const imageSource = featuredImage.pexelsPhotoId ? 'pexels' : 'gpt-image';

    // 5. Update post with new image
    const patchData: Record<string, unknown> = {
      featuredImage: {
        _type: 'image',
        asset: featuredImage.asset,
        alt: featuredImage.alt,
        credit: featuredImage.credit,
        creditUrl: featuredImage.creditUrl,
      },
      'generationMeta.imageSource': imageSource,
      'generationMeta.imageUpdatedAt': new Date().toISOString(),
    };

    // Add pexelsPhotoId if available
    if (featuredImage.pexelsPhotoId) {
      patchData['generationMeta.pexelsPhotoId'] = featuredImage.pexelsPhotoId;
    }

    await writeClient.patch(postId).set(patchData).commit();

    log.info('Successfully regenerated image', {
      postId,
      title: post.title,
      imageSource,
    });

    return { success: true, imageSource };
  } catch (error) {
    log.error(
      'Failed to regenerate post image',
      { postId },
      error instanceof Error ? error : undefined,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Regenerate images for all posts (batch operation)
 */
export async function regenerateAllPostImages(): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    postId: string;
    title: string;
    success: boolean;
    imageSource?: 'pexels' | 'gpt-image';
    error?: string;
  }>;
}> {
  // Fetch all posts
  const posts = await writeClient.fetch<Array<{ _id: string; title: string }>>(
    `*[_type == "post"] | order(publishedAt desc) { _id, title }`,
  );

  log.info('Starting batch image regeneration', { totalPosts: posts.length });

  const results: Array<{
    postId: string;
    title: string;
    success: boolean;
    imageSource?: 'pexels' | 'gpt-image';
    error?: string;
  }> = [];

  let successful = 0;
  let failed = 0;

  for (const post of posts) {
    const progress = results.length + 1;
    log.debug('Processing post', {
      progress,
      total: posts.length,
      title: post.title,
    });

    const result = await regeneratePostImage(post._id);

    results.push({
      postId: post._id,
      title: post.title,
      success: result.success,
      imageSource: result.imageSource,
      error: result.error,
    });

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  log.info('Batch regeneration complete', {
    successful,
    failed,
    total: posts.length,
  });

  return {
    total: posts.length,
    successful,
    failed,
    results,
  };
}
