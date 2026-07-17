import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Minimal config for unit-testing PURE logic only (no RN runtime) — mirrors
// outside-ir35-jobs / go-unbeaten mobile. Tests must `import type` anything
// from RN-backed modules so nothing native loads at runtime. Full-screen
// behaviour stays in Maestro (.maestro/).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.expo/**',
      '**/ios/**',
      '**/android/**',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
