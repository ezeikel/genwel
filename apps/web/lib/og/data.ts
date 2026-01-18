import { sanityFetch, isSanityConfigured } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import type { SanityPost } from '@/lib/sanity/types';

export type BlogPostOGData = {
  title: string;
  excerpt: string | null;
  author: {
    name: string;
    image: string | null;
  } | null;
  categories: Array<{ title: string }>;
  publishedAt: string;
  featuredImage: string | null;
  readingTime: number | null;
};

const postForOGQuery = `*[_type == "post" && slug.current == $slug && status == "published"][0] {
  title,
  excerpt,
  publishedAt,
  readingTime,
  author-> {
    name,
    image
  },
  categories[]-> {
    title
  },
  featuredImage {
    asset
  }
}`;

export async function getBlogPostForOG(
  slug: string
): Promise<BlogPostOGData | null> {
  if (!isSanityConfigured) {
    return null;
  }

  try {
    const post = await sanityFetch<SanityPost | null>({
      query: postForOGQuery,
      params: { slug },
      revalidate: 3600,
    });

    if (!post) {
      return null;
    }

    return {
      title: post.title,
      excerpt: post.excerpt || null,
      author: post.author
        ? {
            name: post.author.name,
            image: post.author.image
              ? urlFor(post.author.image).width(80).height(80).url()
              : null,
          }
        : null,
      categories: post.categories || [],
      publishedAt: post.publishedAt,
      featuredImage: post.featuredImage?.asset
        ? urlFor(post.featuredImage.asset).width(600).height(400).url()
        : null,
      readingTime: post.readingTime || null,
    };
  } catch (error) {
    console.error('Error fetching blog post for OG:', error);
    return null;
  }
}
