import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { regeneratePostImage, regenerateAllPostImages } from '@/app/actions/blog';
import { createServerLogger } from '@/lib/logger';

const log = createServerLogger({ action: 'regenerate-image-api' });

export const maxDuration = 300; // 5 minutes for regeneration

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Regenerate all post images
      const result = await regenerateAllPostImages();

      // Revalidate blog cache
      await revalidateTag('blog-posts', { expire: 0 });

      return NextResponse.json({
        success: true,
        message: 'Batch image regeneration complete',
        ...result,
        timestamp: new Date().toISOString(),
      });
    }

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Missing postId parameter' },
        { status: 400 }
      );
    }

    // Regenerate single post image
    const result = await regeneratePostImage(postId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Revalidate blog cache
    await revalidateTag('blog-posts', { expire: 0 });

    return NextResponse.json({
      success: true,
      message: 'Image regenerated successfully',
      postId,
      imageSource: result.imageSource,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error(
      'Image regeneration error',
      {},
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
