import { test, expect } from '@playwright/test';

test.describe('RSS feed', () => {
  test('returns valid XML', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('xml');
  });

  test('contains channel title', async ({ request }) => {
    const response = await request.get('/rss.xml');
    const body = await response.text();
    expect(body).toContain('<title>');
    expect(body).toContain('Trey Turner');
  });

  test('contains no items when all posts are drafts', async ({ request }) => {
    const response = await request.get('/rss.xml');
    const body = await response.text();
    expect(body).not.toContain('<item>');
    expect(body).not.toContain('Building Quality Into CI/CD Pipelines');
    expect(body).not.toContain('Why I Chose Astro for My Personal Site');
  });

  test('does not include draft posts', async ({ request }) => {
    const response = await request.get('/rss.xml');
    const body = await response.text();
    expect(body).not.toContain('Upcoming: Test Automation Patterns');
  });

  test('channel contains required RSS elements', async ({ request }) => {
    const response = await request.get('/rss.xml');
    const body = await response.text();
    expect(body).toContain('<link>');
    expect(body).toContain('<description>');
  });

  test('RSS link is discoverable from pages', async ({ page }) => {
    await page.goto('/');
    const rssLink = page.locator('link[type="application/rss+xml"]');
    await expect(rssLink).toHaveAttribute('href', '/rss.xml');
  });
});
