import { test, expect } from '@playwright/test';

test.describe('Blog index page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/Blog/);
  });

  test('displays page heading', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Blog');
  });

  test('displays the empty state', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('.blog-card')).toHaveCount(0);
    await expect(page.locator('.blog-empty')).toContainText('No posts yet');
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/blog');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /software|quality|automation/i);
  });

  test('navigation hides Blog', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('nav a[href="/blog"]')).toHaveCount(0);
  });
});

test.describe('Blog draft filtering', () => {
  test('draft posts are not accessible as detail pages', async ({ request }) => {
    for (const slug of [
      'astro-for-personal-sites',
      'building-quality-into-ci-cd',
      'draft-post',
    ]) {
      const response = await request.get(`/blog/${slug}`);
      expect(response.status()).toBe(404);
    }
  });

  test('draft posts do not appear in the blog index', async ({ page }) => {
    await page.goto('/blog');
    const titles = page.locator('.blog-card-title');
    await expect(titles).toHaveCount(0);
  });
});
