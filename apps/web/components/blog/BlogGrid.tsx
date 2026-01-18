import type { SanityPostSummary } from '@/lib/sanity/types';
import { BlogPostCard } from './BlogPostCard';

type BlogGridProps = {
  posts: SanityPostSummary[];
};

export function BlogGrid({ posts }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No posts found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogPostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
