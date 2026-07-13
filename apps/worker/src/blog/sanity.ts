import { createClient } from '@sanity/client';

// Worker-side Sanity clients. The web app reads the NEXT_PUBLIC_SANITY_* names
// (they end up in the client bundle); the worker is server-only, so it takes
// the same values under plain names set in apps/worker/.env on the box.
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2025-01-17';

if (!projectId) {
  console.warn('[blog] SANITY_PROJECT_ID not set — Sanity writes will fail');
}

export const readClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

// Idempotency anchor: the generated topic string, stored as
// generationMeta.prompt on each post (mirrors the in-web pipeline).
export const coveredTopicsQuery = `*[_type == "post"].generationMeta.prompt`;
export const topicExistsQuery = `count(*[_type == "post" && generationMeta.prompt == $topic]) > 0`;
