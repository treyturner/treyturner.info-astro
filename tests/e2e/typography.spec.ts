import { test, expect } from '@playwright/test';
import { unwrappedWidth } from '../helpers/layout';
import { readProjectContent } from '../helpers/project-content';

const { publishedProjects } = readProjectContent();

// Exercise different font metrics without relying on one machine's system-ui fallback.
for (const font of ['sans-serif', 'monospace']) {
  test.describe(`Responsive typography with ${font}`, () => {
    for (const width of [1280, 390, 320]) {
      test(`enlarged home name wraps without horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        await page.addStyleTag({ content: `:root { --font-family-body: ${font}; font-size: 200%; }` });
        const name = page.locator('.vcard-name');
        await expect(name).toHaveText('Trey Turner');
        // Keep the enlarged text readable: wrap it instead of shrinking or clipping it.
        const rem = await page.locator('html').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
        await expect(name).toHaveCSS('font-size', `${3 * rem}px`);
        await expect(name).toHaveCSS('overflow-x', 'visible');
        for (const locator of [name, page.locator('.vcard'), page.locator('html')]) {
          const { scrollWidth, clientWidth } = await locator.evaluate((element) => ({
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          }));
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
        }
      });

      test(`recommendations wrap within their content column at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/recommendations');
        await page.addStyleTag({ content: `:root { --font-family-body: ${font}; }` });
        const content = page.locator('.recommendations-page');
        await expect(content.locator('h1')).toHaveText('Recommendations');
        expect(await content.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        for (const title of await page.locator('.recommendation-role').all()) {
          const box = (await title.boundingBox())!;
          const availableWidth = (await title.locator('..').boundingBox())!.width;
          const lineHeight = await title.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
          if (await unwrappedWidth(title) <= availableWidth) {
            expect(Math.abs(box.height - lineHeight)).toBeLessThan(1);
          } else expect(box.height).toBeGreaterThan(lineHeight);
          expect(await title.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        }
      });

      test(`enlarged Skills text stays within its column at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/skills');
        await page.addStyleTag({ content: `:root { --font-family-body: ${font}; font-size: 200%; }` });
        for (const locator of [page.locator('.skills-page'), page.locator('.skills-intro')]) {
          expect(await locator.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        }
      });

      test(`project metadata fits or wraps without overlap at ${width}px`, async ({ page }) => {
        test.skip(!publishedProjects.length, 'No published project cards to measure.');
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/projects');
        await page.addStyleTag({ content: `:root { --font-family-body: ${font}; }` });
        const metadata = page.locator('.project-card-metadata');
        await expect(metadata).not.toHaveCount(0);
        for (const entry of await metadata.all()) {
          const roleBox = (await entry.locator('.project-card-role').boundingBox())!;
          const statusBox = (await entry.locator('.project-card-status').boundingBox())!;
          const availableWidth = (await entry.locator('..').boundingBox())!.width;
          if (await unwrappedWidth(entry) <= availableWidth) {
            expect(Math.abs(statusBox.y - roleBox.y)).toBeLessThan(1);
            expect(statusBox.x).toBeGreaterThan(roleBox.x + roleBox.width);
          } else {
            expect(statusBox.y).toBeGreaterThan(roleBox.y + roleBox.height);
            expect(Math.abs(statusBox.x - roleBox.x)).toBeLessThan(1);
          }
          expect(await entry.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        }
      });
    }
  });
}
