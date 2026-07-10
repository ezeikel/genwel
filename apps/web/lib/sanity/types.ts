import type { PortableTextBlock } from '@portabletext/react';

export type SanityImage = {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
};

export type SanitySlug = {
  _type: 'slug';
  current: string;
};

export type SanityAuthor = {
  _id: string;
  name: string;
  slug: SanitySlug;
  title?: string;
  image?: SanityImage;
  bio?: PortableTextBlock[];
};

export type SanityCategory = {
  _id: string;
  title: string;
  slug: SanitySlug;
  description?: string;
  postCount?: number;
};

export type SanityFeaturedImage = {
  asset?: SanityImage['asset'];
  alt?: string;
  credit?: string;
  creditUrl?: string;
};

export type SanitySeo = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: SanityImage;
};

export type SanityGenerationMeta = {
  isGenerated?: boolean;
  generatedAt?: string;
  imageSource?: 'manual' | 'pexels' | 'gpt-image' | 'gemini' | 'dalle';
  prompt?: string;
  pexelsPhotoId?: string;
};

export type SanityPost = {
  _id: string;
  title: string;
  slug: SanitySlug;
  excerpt?: string;
  body?: PortableTextBlock[];
  publishedAt: string;
  status: 'draft' | 'published' | 'archived';
  author?: SanityAuthor;
  featuredImage?: SanityFeaturedImage;
  categories?: SanityCategory[];
  seo?: SanitySeo;
  generationMeta?: SanityGenerationMeta;
  readingTime?: number;
};

export type SanityPostSummary = Omit<
  SanityPost,
  'body' | 'seo' | 'generationMeta'
>;
