import { test, expect } from '@playwright/test';
import site from '../../src/data/site.json' with { type: 'json' };

const socialLinks = [
  { label: 'GitHub', href: site.social.github },
  { label: 'LinkedIn', href: site.social.linkedin },
  { label: 'Patreon', href: site.social.patreon },
  { label: 'Stack Overflow', href: site.social.stackoverflow },
  { label: 'Spotify', href: site.social.spotify },
];

test.describe('Home page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Trey Turner');
  });

  test('displays name heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Trey Turner');
  });

  test('displays role title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Software Quality Architect / Staff SDET');
  });

  test('displays tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Building quality into software');
  });

  for (const { label, href } of socialLinks) {
    test(`has an accessible ${label} icon linking to the configured profile in a new tab`, async ({ page }) => {
      await page.goto('/');
      const link = page.locator('.vcard-social').getByRole('link', { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveAttribute('title', `${label} (opens in a new tab)`);
      await expect(link).toHaveCSS('border-width', '0px');
      const icon = link.locator('svg');
      await expect(icon).toBeVisible();
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon).toHaveAttribute('focusable', 'false');
      expect(await icon.locator('path').count()).toBeGreaterThan(0);
      if (label === 'GitHub') await expect(icon).toHaveClass('github-icon');
      if (label === 'Patreon') await expect(icon).toHaveClass('patreon-icon');
    });
  }

  test('supports keyboard navigation with visible focus on every social icon', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('.vcard-social').getByRole('link');
    await expect(links).toHaveCount(socialLinks.length);
    await expect(links).toHaveText(socialLinks.map(({ label }) => label));
    await links.first().focus();
    for (let index = 0; index < socialLinks.length; index++) {
      await expect(links.nth(index)).toBeFocused();
      await expect(links.nth(index)).toHaveCSS('outline-style', 'solid');
      await expect(links.nth(index)).toHaveCSS('outline-width', '2px');
      await page.keyboard.press('Tab');
    }
  });

  for (const width of [1280, 390, 320]) {
    test(`keeps social icons centered, consistently sized, and usable at ${width}px in both themes`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const colorScheme of ['dark', 'light'] as const) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        await page.goto('/');
        for (const scale of ['100%', '200%']) {
          await page.locator('html').evaluate((element, scale) => { element.style.fontSize = scale; }, scale);
          const links = page.locator('.vcard-social a');
          const boxes = [];
          for (const link of await links.all()) {
            const box = (await link.boundingBox())!;
            const icon = link.locator('svg');
            const iconBox = (await icon.boundingBox())!;
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(iconBox.width).toBeCloseTo(iconBox.height);
            expect(iconBox.width).toBeCloseTo(scale === '100%' ? 28 : 56);
            // Only the artwork shifts: preserve evenly spaced, centered click targets.
            const label = await link.innerText();
            const opticalOffset = (label === 'Patreon' ? 1 : label === 'Stack Overflow' ? -1 : 0)
              * (scale === '100%' ? 1 : 2);
            expect(iconBox.x + iconBox.width / 2).toBeCloseTo(box.x + box.width / 2 + opticalOffset);
            expect(iconBox.y + iconBox.height / 2).toBeCloseTo(box.y + box.height / 2);
            const color = await link.evaluate((element) => getComputedStyle(element).color);
            await expect(icon).toHaveCSS('fill', color);
            boxes.push(box);
          }
          const name = (await page.locator('.vcard-name').boundingBox())!;
          const gap = await page.locator('.vcard-social').evaluate((element) => parseFloat(getComputedStyle(element).columnGap));
          for (const box of boxes) expect(box.width).toBeCloseTo(boxes[0].width);
          if (scale === '100%') expect(new Set(boxes.map((box) => box.y)).size).toBe(1);
          for (const y of new Set(boxes.map((box) => box.y))) {
            const row = boxes.filter((box) => box.y === y);
            const left = Math.min(...row.map((box) => box.x));
            const right = Math.max(...row.map((box) => box.x + box.width));
            expect((left + right) / 2).toBeCloseTo(name.x + name.width / 2);
            for (let index = 1; index < row.length; index++) {
              expect(row[index].x - row[index - 1].x - row[index - 1].width).toBeCloseTo(gap);
            }
          }
          expect(await page.locator('.vcard-social').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        }
      }
    });
  }

  test('has navigation with expected links', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('a')).toHaveCount(5);
    await expect(nav.locator('a[href="/projects"]')).toBeVisible();
    await expect(nav.locator('a[href="/blog"]')).toHaveCount(0);
    await expect(nav.locator('a[href="/homelab"]')).toHaveCount(0);
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /quality|software/i);
  });
});
