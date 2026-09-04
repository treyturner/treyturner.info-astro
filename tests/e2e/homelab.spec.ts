import { test, expect } from '@playwright/test';

test.describe('Homelab index page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/homelab');
    await expect(page).toHaveTitle(/Homelab/);
  });

  test('displays page heading', async ({ page }) => {
    await page.goto('/homelab');
    await expect(page.locator('h1')).toContainText('Homelab');
  });

  test('displays the empty state', async ({ page }) => {
    await page.goto('/homelab');
    await expect(page.locator('.homelab-card')).toHaveCount(0);
    await expect(page.locator('.homelab-empty')).toContainText('No homelab posts yet');
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/homelab');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /infrastructure|automation|homelab/i);
  });

  test('navigation hides Homelab', async ({ page }) => {
    await page.goto('/homelab');
    await expect(page.locator('nav a[href="/homelab"]')).toHaveCount(0);
  });
});

test.describe('Homelab draft filtering', () => {
  test('draft posts are not accessible as detail pages', async ({ request }) => {
    for (const slug of ['draft-monitoring', 'network-automation', 'proxmox-cluster']) {
      const response = await request.get(`/homelab/${slug}`);
      expect(response.status()).toBe(404);
    }
  });

  test('draft posts do not appear in the homelab index', async ({ page }) => {
    await page.goto('/homelab');
    const titles = page.locator('.homelab-card-title');
    await expect(titles).toHaveCount(0);
  });
});
