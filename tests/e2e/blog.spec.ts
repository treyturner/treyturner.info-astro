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

  test('displays blog post cards', async ({ page }) => {
    await page.goto('/blog');
    const cards = page.locator('.blog-card');
    await expect(cards).not.toHaveCount(0);
  });

  test('each card has a title link', async ({ page }) => {
    await page.goto('/blog');
    const titles = page.locator('.blog-card-title');
    const count = await titles.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(titles.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has a date', async ({ page }) => {
    await page.goto('/blog');
    const dates = page.locator('.blog-card-date');
    const count = await dates.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(dates.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has a description', async ({ page }) => {
    await page.goto('/blog');
    const descriptions = page.locator('.blog-card-description');
    const count = await descriptions.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(descriptions.nth(i)).not.toBeEmpty();
    }
  });

  test('posts are sorted newest first', async ({ page }) => {
    await page.goto('/blog');
    const dates = page.locator('.blog-card-date');
    const count = await dates.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const dateTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await dates.nth(i).textContent();
      dateTexts.push(text!.trim());
    }

    const timestamps = dateTexts.map((d) => new Date(d).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
    }
  });

  test('clicking a card navigates to blog detail', async ({ page }) => {
    await page.goto('/blog');
    const firstLink = page.locator('.blog-card-link').first();
    await firstLink.click();
    await expect(page.locator('.blog-post')).toBeVisible();
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/blog');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /software|quality|automation/i);
  });

  test('navigation shows Blog as active', async ({ page }) => {
    await page.goto('/blog');
    const activeLink = page.locator('nav a.active');
    await expect(activeLink).toContainText('Blog');
  });
});

test.describe('Blog draft filtering', () => {
  test('draft posts are not accessible as detail pages', async ({ request }) => {
    const response = await request.get('/blog/draft-post');
    expect(response.status()).toBe(404);
  });

  test('draft posts do not appear in the blog index', async ({ page }) => {
    await page.goto('/blog');
    const titles = page.locator('.blog-card-title');
    const count = await titles.count();
    for (let i = 0; i < count; i++) {
      await expect(titles.nth(i)).not.toContainText('Upcoming: Test Automation Patterns');
    }
  });
});

test.describe('Blog detail page', () => {
  test('renders post title as h1', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    await expect(page.locator('.blog-post-title')).toContainText('Building Quality Into CI/CD Pipelines');
  });

  test('displays post date', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    const date = page.locator('.blog-post-date');
    await expect(date).toBeVisible();
    await expect(date).not.toBeEmpty();
  });

  test('displays post tags', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    const tags = page.locator('.blog-post-tag');
    await expect(tags).not.toHaveCount(0);
  });

  test('renders MDX content', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    const content = page.locator('.blog-post-content');
    await expect(content).toBeVisible();
    await expect(content.locator('h2')).not.toHaveCount(0);
    await expect(content.locator('p')).not.toHaveCount(0);
  });

  test('renders code blocks', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    const codeBlock = page.locator('.blog-post-content pre');
    await expect(codeBlock).not.toHaveCount(0);
  });

  test('has back to blog link', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog');
  });

  test('back link navigates to blog index', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    await page.locator('.back-link').click();
    await expect(page).toHaveURL('/blog');
    await expect(page.locator('h1')).toContainText('Blog');
  });

  test('has correct page title in head', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    await expect(page).toHaveTitle(/Building Quality Into CI\/CD Pipelines/);
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/blog/building-quality-into-ci-cd');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /CI\/CD|quality/i);
  });
});
