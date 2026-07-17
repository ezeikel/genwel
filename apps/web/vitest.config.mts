import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for @genwel/web (mirrors the PTP / outside-ir35 web setup).
 *
 * Scope: pure logic tests only — the RevenueCat webhook identity/subscriber
 * helpers and the TrueLayer provider parsing. We do NOT render React Server
 * Components or exercise Next routing here — that's Playwright's job (e2e/).
 * Tests run in a plain node environment; add jsdom + @vitejs/plugin-react
 * only when the first component test lands.
 *
 * `@/*` path alias is resolved from tsconfig.json by vite-tsconfig-paths.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', 'e2e/**'],
  },
});
