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

  test('displays homelab post cards', async ({ page }) => {
    await page.goto('/homelab');
    const cards = page.locator('.homelab-card');
    await expect(cards).not.toHaveCount(0);
  });

  test('each card has a title link', async ({ page }) => {
    await page.goto('/homelab');
    const titles = page.locator('.homelab-card-title');
    const count = await titles.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(titles.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has a date', async ({ page }) => {
    await page.goto('/homelab');
    const dates = page.locator('.homelab-card-date');
    const count = await dates.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(dates.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has a category badge', async ({ page }) => {
    await page.goto('/homelab');
    const categories = page.locator('.homelab-card-category');
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(categories.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has a description', async ({ page }) => {
    await page.goto('/homelab');
    const descriptions = page.locator('.homelab-card-description');
    const count = await descriptions.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(descriptions.nth(i)).not.toBeEmpty();
    }
  });

  test('posts are sorted newest first', async ({ page }) => {
    await page.goto('/homelab');
    const dates = page.locator('.homelab-card-date');
    const count = await dates.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const dateTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      const datetime = await dates.nth(i).getAttribute('datetime');
      dateTexts.push(datetime!);
    }

    const timestamps = dateTexts.map((d) => new Date(d).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
    }
  });

  test('clicking a card navigates to homelab detail', async ({ page }) => {
    await page.goto('/homelab');
    const firstLink = page.locator('.homelab-card-link').first();
    await firstLink.click();
    await expect(page.locator('.homelab-post')).toBeVisible();
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/homelab');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /infrastructure|automation|homelab/i);
  });

  test('navigation shows Homelab as active', async ({ page }) => {
    await page.goto('/homelab');
    const activeLink = page.locator('nav a.active');
    await expect(activeLink).toContainText('Homelab');
  });
});

test.describe('Homelab draft filtering', () => {
  test('draft posts are not accessible as detail pages', async ({ request }) => {
    const response = await request.get('/homelab/draft-monitoring');
    expect(response.status()).toBe(404);
  });

  test('draft posts do not appear in the homelab index', async ({ page }) => {
    await page.goto('/homelab');
    const titles = page.locator('.homelab-card-title');
    const count = await titles.count();
    for (let i = 0; i < count; i++) {
      await expect(titles.nth(i)).not.toContainText('Monitoring Stack with Grafana and Prometheus');
    }
  });
});

test.describe('Homelab detail page', () => {
  test('renders post title as h1', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    await expect(page.locator('.homelab-post-title')).toContainText('Building a Proxmox Cluster');
  });

  test('displays post date', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    const date = page.locator('.homelab-post-date');
    await expect(date).toBeVisible();
    await expect(date).not.toBeEmpty();
  });

  test('displays category badge', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    const category = page.locator('.homelab-post-category');
    await expect(category).toBeVisible();
    await expect(category).toContainText('compute');
  });

  test('displays post tags', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    const tags = page.locator('.homelab-post-tag');
    await expect(tags).not.toHaveCount(0);
  });

  test('renders MDX content', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    const content = page.locator('.homelab-post-content');
    await expect(content).toBeVisible();
    await expect(content.locator('h2')).not.toHaveCount(0);
    await expect(content.locator('p')).not.toHaveCount(0);
  });

  test('renders code blocks', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    const codeBlock = page.locator('.homelab-post-content pre');
    await expect(codeBlock).not.toHaveCount(0);
  });

  test('has back to homelab link', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/homelab');
  });

  test('back link navigates to homelab index', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    await page.locator('.back-link').click();
    await expect(page).toHaveURL('/homelab');
    await expect(page.locator('h1')).toContainText('Homelab');
  });

  test('has correct page title in head', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    await expect(page).toHaveTitle(/Proxmox Cluster/);
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/homelab/proxmox-cluster');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /Proxmox|cluster/i);
  });
});
