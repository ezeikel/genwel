import type { Metadata } from 'next';
import { sanityFetch } from '@/lib/sanity/client';
import { postsQuery } from '@/lib/sanity/queries';
import type { SanityPostSummary } from '@/lib/sanity/types';
import { BlogGrid } from '@/components/blog/BlogGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Expert UK personal finance tips on budgeting, saving, debt recovery, and building generational wealth from Genwel.',
  alternates: {
    canonical: 'https://genwel.com/blog',
  },
  openGraph: {
    title: 'Genwel Blog | UK Personal Finance Tips & Guides',
    description:
      'Expert advice on budgeting, saving, debt recovery, and building generational wealth.',
    url: 'https://genwel.com/blog',
  },
};

export default async function BlogPage() {
  const posts = await sanityFetch<SanityPostSummary[]>({
    query: postsQuery,
    tags: ['blog-posts'],
  });

  return (
    <>
      <Header variant="waitlist" />
      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="bg-primary/5 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Personal Finance Tips
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                The Genwel <span className="text-primary">Blog</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Practical advice on budgeting, saving, debt recovery, and building
                generational wealth—written for real-life money pressures.
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {posts.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-foreground">
                    Latest Articles
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {posts.length} {posts.length === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <BlogGrid posts={posts} />
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📝</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Coming Soon
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We&apos;re working on some great content for you. Check back soon
                  for tips on budgeting, saving, and building wealth.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
