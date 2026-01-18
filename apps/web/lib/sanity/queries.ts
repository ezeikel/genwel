import { groq } from 'next-sanity';

// Posts queries
export const postsQuery = groq`
  *[_type == "post" && status == "published"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    "author": author->{
      _id,
      name,
      slug,
      image
    },
    featuredImage,
    "categories": categories[]->{
      _id,
      title,
      slug
    },
    "readingTime": round(length(pt::text(body)) / 5 / 200)
  }
`;

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    body,
    publishedAt,
    status,
    seo,
    generationMeta,
    "author": author->{
      _id,
      name,
      slug,
      title,
      image,
      bio
    },
    featuredImage,
    "categories": categories[]->{
      _id,
      title,
      slug
    },
    "readingTime": round(length(pt::text(body)) / 5 / 200)
  }
`;

export const postSlugsQuery = groq`
  *[_type == "post" && status == "published"].slug.current
`;

export const postsByCategoryQuery = groq`
  *[_type == "post" && status == "published" && $categorySlug in categories[]->slug.current] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    "author": author->{
      _id,
      name,
      slug,
      image
    },
    featuredImage,
    "categories": categories[]->{
      _id,
      title,
      slug
    },
    "readingTime": round(length(pt::text(body)) / 5 / 200)
  }
`;

export const recentPostsQuery = groq`
  *[_type == "post" && status == "published" && _id != $currentPostId] | order(publishedAt desc)[0...$limit] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    featuredImage,
    "readingTime": round(length(pt::text(body)) / 5 / 200)
  }
`;

// Author queries
export const authorBySlugQuery = groq`
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    title,
    image,
    bio,
    "posts": *[_type == "post" && status == "published" && author._ref == ^._id] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      featuredImage,
      "readingTime": round(length(pt::text(body)) / 5 / 200)
    }
  }
`;

// Category queries
export const categoriesQuery = groq`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    "postCount": count(*[_type == "post" && status == "published" && references(^._id)])
  }
`;

// Feed queries
export const sitemapPostsQuery = groq`
  *[_type == "post" && status == "published"] {
    slug,
    publishedAt,
    _updatedAt
  }
`;

export const rssFeedQuery = groq`
  *[_type == "post" && status == "published"] | order(publishedAt desc)[0...20] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    "author": author->name
  }
`;

// Topics for blog generation
export const coveredTopicsQuery = groq`
  *[_type == "post"].generationMeta.prompt
`;

export const topicExistsQuery = groq`
  count(*[_type == "post" && generationMeta.prompt == $topic]) > 0
`;
