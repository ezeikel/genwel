import { NextRequest, NextResponse } from 'next/server';
import { postToWorker } from '@/lib/worker';

// Vercel cron hits this daily (see apps/web/vercel.json). It authenticates the
// cron caller, then hands off to the Genwel worker's /generate/blog, which
// generates one UK personal-finance post and publishes it to Sanity on the box
// (flat-cost Hetzner compute, no serverless timeout). Generation no longer runs
// in this Vercel function — the route is now a thin trigger.
//
// Vercel auto-sends CRON_SECRET as a bearer on scheduled invocations. A manual
// caller can still pass ?topic=... to target a specific topic.
async function handleGeneration(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');

  try {
    const res = await postToWorker(
      '/generate/blog',
      topic ? { topicOverride: topic } : {},
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: 'worker rejected', status: res.status },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { success: true, accepted: true, message: 'blog cron handed off' },
      { status: 202 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'worker unreachable' },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleGeneration(request);
}

export async function POST(request: NextRequest) {
  return handleGeneration(request);
}
