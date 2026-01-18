import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import type { SanityPostSummary } from '@/lib/sanity/types';
import { urlFor } from '@/lib/sanity/image';

type BlogPostCardProps = {
  post: SanityPostSummary;
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  const imageUrl = post.featuredImage?.asset
    ? urlFor(post.featuredImage.asset).width(800).height(450).url()
    : null;

  return (
    <Link
      href={`/blog/${post.slug.current}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.featuredImage?.alt || post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <span className="text-4xl">📝</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {post.categories && post.categories.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {post.categories.slice(0, 2).map((category) => (
              <span
                key={category._id}
                className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
              >
                {category.title}
              </span>
            ))}
          </div>
        )}
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {post.author?.name && <span>{post.author.name}</span>}
          <span>•</span>
          <span>{format(new Date(post.publishedAt), 'MMM d, yyyy')}</span>
          {post.readingTime && (
            <>
              <span>•</span>
              <span>{post.readingTime} min read</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
