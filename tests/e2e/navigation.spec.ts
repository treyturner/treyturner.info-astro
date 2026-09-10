import { test, expect } from '@playwright/test';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Skills', href: '/skills' },
  { label: 'Experience', href: '/experience' },
  { label: 'Recommendations', href: '/recommendations' },
  { label: 'Projects', href: '/projects' },
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

  test('hides Blog when there are no published posts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav a[href="/blog"]')).toHaveCount(0);
  });

  test('hides Homelab when there are no published posts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav a[href="/homelab"]')).toHaveCount(0);
  });

  test('positions Projects before Homelab and Blog in the navigation config', async () => {
    const navigation = (
      await import('../../src/data/navigation.json', { with: { type: 'json' } })
    ).default;
    const labels = navigation.map((item) => item.label);
    expect(labels.indexOf('Projects')).toBeLessThan(labels.indexOf('Homelab'));
    expect(labels.indexOf('Projects')).toBeLessThan(labels.indexOf('Blog'));
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
    await page.goto('/recommendations');
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

for (const font of ['system-ui', 'sans-serif', 'monospace']) {
  test.describe(`Navigation reflow with ${font}`, () => {
    for (const width of [1280, 390, 320]) {
      test(`fits its column with normal and enlarged text at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        // Exercise the longest label at its heavier active-link weight.
        await page.goto('/recommendations');
        await page.addStyleTag({ content: `:root { --font-family-body: ${font}; }` });
        const nav = page.getByRole('navigation', { name: 'Main navigation' });
        const list = nav.locator('.nav-list');
        const links = nav.getByRole('link');
        await expect(links).toHaveText(navItems.map(({ label }) => label));

        for (const scale of [100, 200]) {
          await page.locator('html').evaluate((element, scale) => {
            element.style.fontSize = `${scale}%`;
          }, scale);
          const rootFontSize = await page.locator('html').evaluate(
            (element) => parseFloat(getComputedStyle(element).fontSize),
          );
          for (const element of [nav, list]) {
            expect(await element.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
          }
          const listBox = (await list.boundingBox())!;
          const boxes = [];
          for (const link of await links.all()) {
            await expect(link).toBeVisible();
            await expect(link).toHaveCSS('font-size', `${rootFontSize * 0.9375}px`);
            const box = (await link.boundingBox())!;
            expect(box.x).toBeGreaterThanOrEqual(listBox.x - 1);
            expect(box.x + box.width).toBeLessThanOrEqual(listBox.x + listBox.width + 1);
            expect(await link.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
            for (const previous of boxes) {
              const separate = box.x >= previous.x + previous.width - 1
                || box.y >= previous.y + previous.height - 1;
              expect(separate, 'Navigation links must not overlap').toBe(true);
            }
            boxes.push(box);
          }
        }
      });
    }
  });
}

test('enlarged mobile navigation remains keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/skills');
  await page.locator('html').evaluate((element) => { element.style.fontSize = '200%'; });
  const links = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link');
  await links.first().focus();
  for (let index = 0; index < navItems.length; index++) {
    await expect(links.nth(index)).toBeFocused();
    await expect(links.nth(index)).toBeInViewport();
    if (index < navItems.length - 1) await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Shift+Tab');
  await expect(links.filter({ hasText: /^Recommendations$/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/recommendations');
  await expect(page.locator('nav a.active')).toHaveAttribute('aria-current', 'page');
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
