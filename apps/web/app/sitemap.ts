import { MetadataRoute } from 'next';
import { isSanityConfigured, sanityFetch } from '@/lib/sanity/client';

const BASE_URL = 'https://genwel.com';

type SitemapPost = {
  slug: { current: string };
  publishedAt: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...['privacy', 'terms', 'cookies'].map((path) => ({
      url: `${BASE_URL}/${path}`,
      lastModified: new Date('2026-07-10'),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ];

  // Dynamic blog posts from Sanity
  let blogPosts: MetadataRoute.Sitemap = [];

  if (isSanityConfigured) {
    try {
      const posts = await sanityFetch<SitemapPost[]>({
        query: `*[_type == "post" && status == "published"] | order(publishedAt desc) {
          slug,
          publishedAt
        }`,
        revalidate: 3600,
      });

      blogPosts = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug.current}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    } catch (error) {
      console.error('Error fetching blog posts for sitemap:', error);
    }
  }

  return [...staticPages, ...blogPosts];
}
