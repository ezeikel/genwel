import { PortableText } from '@portabletext/react';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { portableTextComponents } from '@/components/blog/PortableTextComponents';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { ArticleJsonLd } from '@/components/JsonLd';
import { isSanityConfigured, sanityFetch } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import {
  postBySlugQuery,
  postSlugsQuery,
  recentPostsQuery,
} from '@/lib/sanity/queries';
import type { SanityPost, SanityPostSummary } from '@/lib/sanity/types';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  if (!isSanityConfigured) {
    return [];
  }
  const slugs = await sanityFetch<string[]>({ query: postSlugsQuery });
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await sanityFetch<SanityPost | null>({
    query: postBySlugQuery,
    params: { slug },
  });

  if (!post) {
    return {
      title: 'Post Not Found | Genwel',
    };
  }

  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.excerpt || '';

  return {
    title: `${title} | Genwel Blog`,
    description,
    alternates: {
      canonical: `https://genwel.com/blog/${post.slug.current}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [post, recentPosts] = await Promise.all([
    sanityFetch<SanityPost | null>({
      query: postBySlugQuery,
      params: { slug },
      tags: [`blog-post-${slug}`],
    }),
    sanityFetch<SanityPostSummary[]>({
      query: recentPostsQuery,
      params: { currentPostId: '', limit: 3 },
      tags: ['blog-posts'],
    }),
  ]);

  if (!post || post.status !== 'published') {
    notFound();
  }

  const imageUrl = post.featuredImage?.asset
    ? urlFor(post.featuredImage.asset).width(1200).height(600).url()
    : null;

  return (
    <>
      <Header variant="waitlist" />
      <main className="min-h-screen pt-16">
        <ArticleJsonLd
          title={post.title}
          description={post.excerpt || ''}
          image={imageUrl || undefined}
          datePublished={post.publishedAt}
          authorName={post.author?.name || 'Genwel'}
        />

        {/* Hero Section */}
        <section className="bg-primary/5 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Blog
            </Link>

            <div className="mx-auto max-w-3xl">
              {post.categories && post.categories.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.categories.map((category) => (
                    <span
                      key={category._id}
                      className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                    >
                      {category.title}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="mb-4 text-4xl font-bold md:text-5xl text-foreground leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4">
                {post.author?.image && (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={urlFor(post.author.image).width(96).height(96).url()}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  {post.author?.name && (
                    <p className="font-medium text-foreground">
                      {post.author.name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                    {post.readingTime && ` • ${post.readingTime} min read`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {imageUrl && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="relative mx-auto aspect-video max-w-4xl overflow-hidden rounded-xl">
              <Image
                src={imageUrl}
                alt={post.featuredImage?.alt || post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            {post.featuredImage?.credit && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Photo by{' '}
                {post.featuredImage.creditUrl ? (
                  <a
                    href={post.featuredImage.creditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary transition-colors"
                  >
                    {post.featuredImage.credit}
                  </a>
                ) : (
                  post.featuredImage.credit
                )}
              </p>
            )}
          </section>
        )}

        {/* Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <article className="prose prose-lg mx-auto max-w-3xl prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
            {post.body && (
              <PortableText
                value={post.body}
                components={portableTextComponents}
              />
            )}
          </article>
        </section>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <section className="bg-muted/30 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="mb-8 text-center text-2xl font-bold">
                More from the Blog
              </h2>
              <BlogGrid posts={recentPosts} />
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
