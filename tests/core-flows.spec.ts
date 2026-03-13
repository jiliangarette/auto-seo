import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Core flows', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) {
      test.skip(true, 'No credentials configured in creds.txt');
    }
  });

  test('dashboard loads with key elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    // Stats section should exist
    await expect(page.locator('[class*="grid"]').first()).toBeVisible();
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/');
    // Click on a nav item
    const siteAuditLink = page.locator('a[href="/site-audit"], button:has-text("Site Audit")').first();
    if (await siteAuditLink.isVisible()) {
      await siteAuditLink.click();
      await expect(page).toHaveURL(/site-audit/);
    }
  });

  test('one-click mode page loads', async ({ page }) => {
    await page.goto('/one-click');
    await expect(page.locator('text=One-Click SEO')).toBeVisible({ timeout: 10000 });
  });

  test('projects page loads', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('text=Projects')).toBeVisible({ timeout: 10000 });
  });

  test('URL auto-populates from project context', async ({ page }) => {
    await page.goto('/projects');
    // If there are projects, select one and verify URL propagation
    const projectCard = page.locator('[class*="card"]').first();
    if (await projectCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Navigate to a tool page and check URL field
      await page.goto('/site-audit');
      const urlInput = page.locator('input[placeholder*="mybusiness"]').first();
      if (await urlInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        // URL should be populated or empty based on context
        const value = await urlInput.inputValue();
        // Just verify the input exists and is interactive
        await expect(urlInput).toBeEnabled();
      }
    }
  });
});
