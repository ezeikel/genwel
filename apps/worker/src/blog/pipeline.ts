import { models } from '@genwel/banking/models';
import { generateObject, generateText } from 'ai';
import { z } from 'zod/v3';
import { generateDynamicTopics, seedTopics } from './dynamic-topics.js';
import { type FeaturedImage, getFeaturedImage } from './image.js';
import {
  bioToPortableText,
  markdownToPortableText,
} from './markdown-to-portable-text.js';
import {
  BLOG_AUTHORS,
  BLOG_CONTENT_PROMPT,
  BLOG_META_PROMPT,
  BLOG_TOPICS,
  type BlogAuthor,
} from './prompts.js';
import { coveredTopicsQuery, readClient, writeClient } from './sanity.js';

// Genwel AI blog pipeline (ported from the in-web server action
// apps/web/app/actions/blog.ts). Runs on the box worker: pick an uncovered topic
// (fixed seed list + never-dry dynamic fallback) → generate meta + markdown body
// (Claude Sonnet 5) → featured image (Pexels + vision judge → gpt-image-2
// fallback → Sanity asset) → create the post as status:'published'. Idempotency
// anchor = generationMeta.prompt (the topic string).

const BlogMetaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  keywords: z.array(z.string()),
  category: z.string(),
});

type BlogMeta = z.infer<typeof BlogMetaSchema>;

type ImageSource = 'pexels' | 'gpt-image' | 'manual';

// Covered topics (generationMeta.prompt on every generated post).
async function getCoveredTopics(): Promise<string[]> {
  const topics: (string | null)[] = await readClient
    .fetch<(string | null)[]>(coveredTopicsQuery)
    .catch(() => [] as (string | null)[]);
  return topics.filter((t): t is string => t !== null);
}

// Pick a random uncovered topic from the fixed seed list.
function getRandomUncoveredTopic(covered: string[]): string | null {
  const coveredSet = new Set(covered);
  const uncovered = BLOG_TOPICS.filter((t) => !coveredSet.has(t));
  if (uncovered.length === 0) return null;
  return uncovered[Math.floor(Math.random() * uncovered.length)];
}

// All Pexels photo ids already used, for dedup across posts.
async function getUsedPexelsIds(): Promise<string[]> {
  return writeClient
    .fetch<string[]>(
      `*[_type == "post" && defined(generationMeta.pexelsPhotoId)].generationMeta.pexelsPhotoId`,
    )
    .catch(() => []);
}

async function generateBlogMeta(topic: string): Promise<BlogMeta> {
  const { object } = await generateObject({
    model: models.text,
    schema: BlogMetaSchema,
    prompt: `${BLOG_META_PROMPT}\n\nTopic: ${topic}`,
  });
  return object;
}

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

  // Belt-and-braces: strip any em dashes the model slipped in despite the prompt.
  return text.replace(/\s*—\s*/g, ', ');
}

// Pick a random persona author and return its Sanity reference, creating the
// author document (with an honest bio) on first use.
async function ensureRandomAuthor(): Promise<string> {
  const persona: BlogAuthor =
    BLOG_AUTHORS[Math.floor(Math.random() * BLOG_AUTHORS.length)];

  const existing = await writeClient.fetch<{ _id: string } | null>(
    `*[_type == "author" && slug.current == $slug][0]{ _id }`,
    { slug: persona.slug },
  );
  if (existing?._id) return existing._id;

  const created = await writeClient.create({
    _type: 'author',
    name: persona.name,
    slug: { _type: 'slug', current: persona.slug },
    title: persona.title,
    bio: bioToPortableText(persona.bio),
  });
  return created._id;
}

// Create the published post in Sanity.
async function createSanityPost(
  meta: BlogMeta,
  body: unknown[],
  featuredImage: FeaturedImage | null,
  topic: string,
): Promise<{ _id: string; slug: string }> {
  const authorRef = await ensureRandomAuthor();

  let featuredImageData: Record<string, unknown> | null = null;
  if (featuredImage) {
    featuredImageData = {
      _type: 'image',
      asset: featuredImage.asset,
      alt: featuredImage.alt,
      credit: featuredImage.credit,
      creditUrl: featuredImage.creditUrl,
    };
  }

  // Find or create the matching category.
  const categories = await writeClient.fetch<{ _id: string }[]>(
    `*[_type == "category" && title == $category]{ _id }`,
    { category: meta.category },
  );
  let categoryRef = categories?.[0]?._id;
  if (!categoryRef) {
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

  const imageSource: ImageSource = featuredImage?.pexelsPhotoId
    ? 'pexels'
    : featuredImage
      ? 'gpt-image'
      : 'manual';

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

type RunOpts = { topicOverride?: string; dryRun?: boolean };

// Generate one blog post for a specific topic and PUBLISH it to Sanity.
async function generateBlogPostForTopic(
  topic: string,
  opts: RunOpts = {},
): Promise<{ slug: string; title: string } | null> {
  // 1. Metadata.
  const meta = await generateBlogMeta(topic);

  // 2. Skip if a post with this slug already exists.
  const existingPost = await writeClient.fetch<{ _id: string } | null>(
    `*[_type == "post" && slug.current == $slug][0]{ _id }`,
    { slug: meta.slug },
  );
  if (existingPost) {
    console.log(
      `[blog] post with slug "${meta.slug}" already exists, skipping`,
    );
    return null;
  }

  // 3. Content (with covered topics as anti-duplication context).
  const covered = await getCoveredTopics();
  const content = await generateBlogContent(meta, covered);
  const body = markdownToPortableText(content);

  if (opts.dryRun) {
    console.log(`[blog] dryRun — would publish: "${meta.title}"`);
    console.log(`[blog] slug: ${meta.slug}, blocks: ${body.length}`);
    return { slug: meta.slug, title: meta.title };
  }

  // 4. Featured image (non-blocking; null on failure).
  const usedPexelsIds = await getUsedPexelsIds();
  const featuredImage = await getFeaturedImage(
    meta.title,
    meta.excerpt,
    meta.category,
    meta.slug,
    usedPexelsIds,
  );

  // 5. Publish.
  const { slug } = await createSanityPost(meta, body, featuredImage, topic);
  console.log(
    `[blog] published: ${slug}${featuredImage ? ' (with image)' : ''}`,
  );
  return { slug, title: meta.title };
}

// Daily entry point. Picks a random uncovered seed topic, falling back to the
// never-dry dynamic generator so the cadence never runs out of topics.
export async function runBlogCron(opts: RunOpts = {}): Promise<void> {
  try {
    if (opts.topicOverride) {
      await generateBlogPostForTopic(opts.topicOverride, opts);
      return;
    }

    const covered = await getCoveredTopics();
    let topic = getRandomUncoveredTopic(covered);

    // NEVER-DRY fallback: the fixed seed list is finite, so once daily
    // generation exhausts it, ask the model for fresh, deduped topics.
    if (!topic) {
      console.log('[blog] seed list exhausted, generating dynamic topics');
      try {
        const dynamic = await generateDynamicTopics(
          new Set(covered),
          seedTopics(),
        );
        topic = dynamic[0] ?? null;
        if (topic) console.log(`[blog] dynamic topic: ${topic}`);
      } catch (err) {
        console.error('[blog] dynamic topic generation failed:', err);
      }
    }

    if (!topic) {
      console.warn('[blog] no uncovered topic available (dynamic gen empty)');
      return;
    }

    await generateBlogPostForTopic(topic, opts);
  } catch (err) {
    console.error('[blog] pipeline failed:', err);
    throw err;
  }
}
