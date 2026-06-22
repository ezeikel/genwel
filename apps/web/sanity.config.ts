import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemas';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'genwel-blog',
  title: 'Genwel Blog',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool({ defaultApiVersion: '2025-01-17' })],
  schema: {
    types: schemaTypes,
  },
});
