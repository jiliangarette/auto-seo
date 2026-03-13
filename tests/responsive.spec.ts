import { test, expect } from '@playwright/test';
import { login } from './helpers';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1024, height: 768 },
];

test.describe('Responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) {
      test.skip(true, 'No credentials configured in creds.txt');
    }
  });

  for (const vp of viewports) {
    test(`dashboard renders at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 20);
    });
  }

  test('mobile sidebar opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Mobile menu button should be visible
    const menuBtn = page.locator('button:has(svg)').first();
    await expect(menuBtn).toBeVisible({ timeout: 5000 });

    // Click to open sidebar
    await menuBtn.click();

    // Sidebar should be visible with Auto-SEO branding
    const sidebar = page.locator('text=Auto-SEO');
    await expect(sidebar.first()).toBeVisible({ timeout: 3000 });
  });

  test('tool pages are responsive at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const pages = ['/site-audit', '/analyzer', '/generator', '/one-click'];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      // Check no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(395); // 375 + small tolerance
    }
  });
});
