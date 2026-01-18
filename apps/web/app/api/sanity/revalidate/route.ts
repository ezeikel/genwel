import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{
      _type: string;
      slug?: { current?: string };
    }>(req, process.env.SANITY_REVALIDATE_SECRET);

    if (!isValidSignature) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    if (!body?._type) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Revalidate based on document type
    switch (body._type) {
      case 'post':
        revalidateTag('blog-posts', { expire: 0 });
        if (body.slug?.current) {
          revalidateTag(`blog-post-${body.slug.current}`, { expire: 0 });
        }
        break;
      case 'author':
        revalidateTag('blog-posts', { expire: 0 });
        break;
      case 'category':
        revalidateTag('blog-posts', { expire: 0 });
        break;
      default:
        break;
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      body,
    });
  } catch (err) {
    console.error('Revalidation error:', err);
    return new NextResponse('Error revalidating', { status: 500 });
  }
}
