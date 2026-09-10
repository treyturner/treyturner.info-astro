import { test, expect } from '@playwright/test';
import skillsData from '../../src/data/skills.json' with { type: 'json' };

test.describe('Skills page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/skills');
    await expect(page).toHaveTitle(/Skills/);
  });

  test('displays page heading', async ({ page }) => {
    await page.goto('/skills');
    await expect(page.locator('main h1')).toContainText('Skills');
  });

  test('displays skill categories', async ({ page }) => {
    await page.goto('/skills');
    const categories = page.locator('.skill-category');
    await expect(categories).toHaveCount(skillsData.categories.length);
  });

  test('category headings preserve the curated group order', async ({ page }) => {
    await page.goto('/skills');
    const headings = page.locator('.skill-category h2');
    await expect(headings).toHaveText(skillsData.categories.map((category) => category.name));
  });

  test('each group preserves its skill order in a named, unnumbered list', async ({ page }) => {
    await page.goto('/skills');
    for (const category of skillsData.categories) {
      const list = page.getByRole('list', { name: category.name, exact: true });
      expect(await list.evaluate((element) => element.tagName)).toBe('OL');
      await expect(list).toHaveCSS('list-style-type', 'none');
      await expect(list.getByRole('listitem')).toHaveText(category.skills);
    }
    await expect(page.locator('.skill-item')).toHaveText(skillsData.categories.flatMap((category) => category.skills));
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

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`Skills layout in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const [width, columns] of [[1280, 3], [820, 3], [768, 2], [600, 2], [390, 1], [320, 1]]) {
      test(`uses ${columns} columns at ${width}px with one skill per line and no tag styling`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/skills');
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
        const grid = page.locator('.skills-grid');
        expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(columns);

        const groups = await page.locator('.skill-category').all();
        const boxes = await Promise.all(groups.map((group) => group.boundingBox()));
        for (const [index, group] of groups.entries()) {
          const box = boxes[index]!;
          // Visual reading order remains left-to-right, then top-to-bottom.
          expect(Math.abs(box.x - boxes[index % columns]!.x)).toBeLessThan(1);
          expect(Math.abs(box.y - boxes[Math.floor(index / columns) * columns]!.y)).toBeLessThan(1);
          if (index >= columns) {
            const previous = boxes[index - columns]!;
            expect(box.y).toBeGreaterThan(previous.y + previous.height);
          }
          await expect(group).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
          let previousBottom = 0;
          for (const item of await group.locator('.skill-item').all()) {
            const itemBox = (await item.boundingBox())!;
            expect(itemBox.y).toBeGreaterThan(previousBottom);
            expect(Math.abs(itemBox.x - box.x)).toBeLessThan(1);
            expect(itemBox.x + itemBox.width).toBeLessThanOrEqual(box.x + box.width + 1);
            previousBottom = itemBox.y + itemBox.height;
            await expect(item).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
            await expect(item).toHaveCSS('border-top-width', '0px');
            await expect(item).toHaveCSS('border-radius', '0px');
            await expect(item).toHaveCSS('padding', '0px');
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
    }
  });
}

for (const width of [1280, 390, 320]) {
  test(`skills content reflows within its column with enlarged text at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/skills');
    await page.locator('html').evaluate((element) => { element.style.fontSize = '200%'; });
    await expect(page.locator('.skill-item')).toHaveText(skillsData.categories.flatMap((category) => category.skills));
    for (const group of await page.locator('.skill-category').all()) {
      expect(await group.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    // Check the skills content separately from the site-wide navigation and footer.
    expect(await page.locator('.skills-page').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    const box = (await page.locator('.skills-page').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  });
}
