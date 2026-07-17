import { expect, test } from '@playwright/test';

/**
 * Smoke: the marketing home page renders end-to-end — hero copy, header nav,
 * and the blog link are all present. Auth() runs on the home route, so this
 * also proves the app boots with whatever env the runner has (dev server is
 * tolerant of missing optional keys).
 */
test('home page renders the hero and navigation', async ({ page }) => {
  await page.goto('/');

  // Hero headline (stable marketing anchor).
  await expect(
    page.getByRole('heading', { level: 1, name: /See where your money/i }),
  ).toBeVisible();

  // Header navigation is interactive.
  await expect(page.getByRole('link', { name: /blog/i }).first()).toBeVisible();

  // Footer confirms full-page render (no crashed section mid-stream).
  await expect(page.locator('footer')).toBeVisible();
});
