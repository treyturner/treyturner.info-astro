import { test, expect } from '@playwright/test';

test.describe('Skills page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/skills');
    await expect(page).toHaveTitle(/Skills/);
  });

  test('displays page heading', async ({ page }) => {
    await page.goto('/skills');
    await expect(page.locator('h1')).toContainText('Skills');
  });

  test('displays skill categories', async ({ page }) => {
    await page.goto('/skills');
    const categories = page.locator('.skill-category');
    await expect(categories).not.toHaveCount(0);
  });

  test('each category has a heading', async ({ page }) => {
    await page.goto('/skills');
    const headings = page.locator('.skill-category h2');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(headings.nth(i)).not.toBeEmpty();
    }
  });

  test('each category has skill items', async ({ page }) => {
    await page.goto('/skills');
    const categories = page.locator('.skill-category');
    const count = await categories.count();
    for (let i = 0; i < count; i++) {
      const skills = categories.nth(i).locator('.skill-item');
      await expect(skills).not.toHaveCount(0);
    }
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/skills');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /skills|expertise/i);
  });

  test('navigation shows Skills as active', async ({ page }) => {
    await page.goto('/skills');
    const activeLink = page.locator('nav a.active');
    await expect(activeLink).toContainText('Skills');
  });
});
