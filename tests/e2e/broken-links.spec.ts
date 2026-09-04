import { test, expect } from '@playwright/test';

const pages = [
  '/',
  '/skills',
  '/experience',
  '/recommendations',
  '/homelab',
  '/blog',
];

test.describe('Broken link detection', () => {
  for (const pageUrl of pages) {
    test(`no broken internal links on ${pageUrl}`, async ({ page, request }) => {
      await page.goto(pageUrl);

      const links = page.locator('a[href^="/"]');
      const count = await links.count();
      const checked = new Set<string>();

      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute('href');
        if (!href || checked.has(href)) continue;
        checked.add(href);

        const response = await request.get(href);
        expect(response.status(), `Link ${href} on ${pageUrl} returned ${response.status()}`).toBeLessThan(400);
      }
    });
  }

  test('RSS feed is accessible', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('xml');
  });
});
