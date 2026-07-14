import { getUserIdFromToken } from '@/lib/auth-mobile';

const BASE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'private, no-store',
};

export const mobileJson = (data: unknown, init?: ResponseInit) =>
  Response.json(data, {
    ...init,
    headers: { ...BASE_HEADERS, ...init?.headers },
  });

export const mobileError = (message: string, status: number) =>
  mobileJson({ error: message }, { status });

export const getMobileUserId = async () => {
  const userId = await getUserIdFromToken();
  return userId || null;
};

export const mobileOptions = (methods: string) =>
  new Response(null, {
    status: 204,
    headers: {
      ...BASE_HEADERS,
      'Access-Control-Allow-Methods': `${methods}, OPTIONS`,
    },
  });
