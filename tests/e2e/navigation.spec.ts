import { test, expect } from '@playwright/test';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Skills', href: '/skills' },
  { label: 'Experience', href: '/experience' },
  { label: 'Recommendations', href: '/recommendations' },
  { label: 'Homelab', href: '/homelab' },
  { label: 'Blog', href: '/blog' },
];

test.describe('Site navigation', () => {
  test('renders all navigation links on every page', async ({ page }) => {
    for (const item of navItems) {
      await page.goto(item.href);
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeVisible();

      for (const link of navItems) {
        const navLink = nav.locator(`a[href="${link.href}"]`);
        await expect(navLink).toBeVisible();
        await expect(navLink).toContainText(link.label);
      }
    }
  });

  test('highlights the active page in navigation', async ({ page }) => {
    for (const item of navItems) {
      await page.goto(item.href);
      const activeLink = page.locator('nav a.active');
      await expect(activeLink).toHaveCount(1);
      await expect(activeLink).toContainText(item.label);
      await expect(activeLink).toHaveAttribute('aria-current', 'page');
    }
  });

  test('each nav link navigates to the correct page', async ({ page }) => {
    await page.goto('/');
    for (const item of navItems) {
      await page.locator(`nav a[href="${item.href}"]`).click();
      await expect(page).toHaveURL(item.href);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('header site title links to home', async ({ page }) => {
    await page.goto('/blog');
    const siteTitle = page.locator('.site-title');
    await expect(siteTitle).toBeVisible();
    await siteTitle.click();
    await expect(page).toHaveURL('/');
  });

  test('footer is visible on all pages', async ({ page }) => {
    for (const item of navItems) {
      await page.goto(item.href);
      const footer = page.locator('footer.site-footer');
      await expect(footer).toBeVisible();
    }
  });
});

test.describe('SEO meta tags on all pages', () => {
  test('every page has a title', async ({ page }) => {
    for (const item of navItems) {
      await page.goto(item.href);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    }
  });

  test('every page has a meta description', async ({ page }) => {
    for (const item of navItems) {
      await page.goto(item.href);
      const description = page.locator('meta[name="description"]');
      const content = await description.getAttribute('content');
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(0);
    }
  });

  test('every page has a canonical link', async ({ page }) => {
    for (const item of navItems) {
      await page.goto(item.href);
      const canonical = page.locator('link[rel="canonical"]');
      const href = await canonical.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('astro.treyturner.info');
    }
  });

  test('every page has Open Graph tags', async ({ page }) => {
    for (const item of navItems) {
      await page.goto(item.href);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', /.+/);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', /.+/);
      await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', /.+/);
    }
  });

  test('every page has Twitter card tags', async ({ page }) => {
    for (const item of navItems) {
      await page.goto(item.href);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', /.+/);
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', /.+/);
    }
  });
});
