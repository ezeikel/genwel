import { getCurrentUserFromToken } from '@/lib/auth-mobile';

/**
 * GET /api/auth/mobile/me — return the current user for the Bearer token. The RN
 * app calls this on launch to validate a stored token and hydrate the user.
 */
export async function GET() {
  try {
    const user = await getCurrentUserFromToken();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return Response.json(
      { user },
      { headers: corsHeaders('GET'), status: 200 },
    );
  } catch (error) {
    console.error('[Auth] Error getting current mobile user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders('GET') });
}

const corsHeaders = (methods: string) => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': `${methods}, OPTIONS`,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
});
