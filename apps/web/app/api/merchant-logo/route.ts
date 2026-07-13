import type { NextRequest } from 'next/server';

/**
 * Proxied merchant-logo endpoint.
 *
 * The browser requests /api/merchant-logo?domain=netflix.com and this route
 * fetches the logo from logo.dev SERVER-SIDE, so:
 *  - the user's browser only ever talks to genwel.com (logo.dev never sees
 *    which brands a given user transacts with — a real privacy win for a
 *    banking app),
 *  - responses are cached hard at the edge/CDN.
 *
 * Needs LOGO_DEV_TOKEN (free publishable token, pk_...). Without it, or when a
 * logo isn't found, we return 404 so the client falls back to the neutral
 * category circle.
 */

export const runtime = 'edge';

const ALLOWED_DOMAIN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.trim().toLowerCase();
  const token = process.env.LOGO_DEV_TOKEN;

  if (!domain || !ALLOWED_DOMAIN.test(domain) || !token) {
    return new Response(null, { status: 404 });
  }

  // fallback=404 so a domain logo.dev doesn't have returns 404 (→ neutral
  // category circle) rather than a generic monogram.
  const upstream = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${token}&size=80&format=png&retina=true&fallback=404`;

  try {
    const res = await fetch(upstream, {
      // cache the upstream fetch for a long time; logos rarely change
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!res.ok) {
      return new Response(null, { status: 404 });
    }

    const body = await res.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/png',
        // browser + CDN cache for 30 days, allow stale for a year
        'Cache-Control':
          'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=31536000',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
