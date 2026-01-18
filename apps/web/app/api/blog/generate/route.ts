import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateBlogPostForTopic,
  generateRandomBlogPost,
  getCoveredTopics,
} from '@/app/actions/blog';
import { BLOG_TOPICS } from '@/lib/ai/prompts';

export const maxDuration = 180; // 3 minutes for long-running generation

export async function GET(request: NextRequest) {
  return handleGeneration(request);
}

export async function POST(request: NextRequest) {
  return handleGeneration(request);
}

async function handleGeneration(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    let result;

    if (topic) {
      // Generate for specific topic
      result = await generateBlogPostForTopic(topic);
    } else {
      // Generate random post
      result = await generateRandomBlogPost();
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Revalidate blog cache
    revalidateTag('blog-posts', { expire: 0 });

    // Get remaining topics count
    const coveredTopics = await getCoveredTopics();
    const remainingTopics = BLOG_TOPICS.length - coveredTopics.length;

    return NextResponse.json({
      success: true,
      message: 'Blog post generated successfully',
      post: {
        slug: result.slug,
        title: result.title,
      },
      remainingTopics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
