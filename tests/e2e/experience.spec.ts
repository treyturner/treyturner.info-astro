import { test, expect } from '@playwright/test';

test.describe('Experience page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/experience');
    await expect(page).toHaveTitle(/Experience/);
  });

  test('displays page heading', async ({ page }) => {
    await page.goto('/experience');
    await expect(page.locator('main h1')).toContainText('Work Experience');
  });

  test('displays experience cards', async ({ page }) => {
    await page.goto('/experience');
    const cards = page.locator('.experience-card');
    await expect(cards).not.toHaveCount(0);
  });

  test('each card has a role heading', async ({ page }) => {
    await page.goto('/experience');
    const roles = page.locator('.experience-role');
    const count = await roles.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(roles.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has a company name', async ({ page }) => {
    await page.goto('/experience');
    const companies = page.locator('.experience-company');
    const count = await companies.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(companies.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has date information', async ({ page }) => {
    await page.goto('/experience');
    const dates = page.locator('.experience-dates');
    const count = await dates.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(dates.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has a non-placeholder description', async ({ page }) => {
    await page.goto('/experience');
    const cards = page.locator('.experience-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const description = cards.nth(i).locator('.experience-description');
      await expect(description).toHaveCount(1);
      await expect(description).toContainText(/\S/);
      await expect(description).not.toContainText(/lorem\s+ipsum/i);
    }
  });

  test('each card has highlights', async ({ page }) => {
    await page.goto('/experience');
    const cards = page.locator('.experience-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const highlights = cards.nth(i).locator('.experience-highlights li');
      await expect(highlights).not.toHaveCount(0);
    }
  });

  test('any Current badge labels a present role', async ({ page }) => {
    await page.goto('/experience');
    const badges = page.locator('.experience-badge');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toContainText('Current');
    }
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/experience');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /experience|quality/i);
  });

  test('navigation shows Experience as active', async ({ page }) => {
    await page.goto('/experience');
    const activeLink = page.locator('nav a.active');
    await expect(activeLink).toContainText('Experience');
  });

  test('each card loads its company logo', async ({ page }) => {
    await page.goto('/experience');
    const cards = page.locator('.experience-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const logo = cards.nth(i).locator('.experience-logo');
      await expect(logo).toHaveCount(1);
      await logo.scrollIntoViewIfNeeded();
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      )).toBe(true);
    }
  });

  for (const width of [1280, 768, 600, 390, 320]) {
    test(`keeps dates below the company and enlarged logos at the right at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/experience');
      const headers = page.locator('.experience-header');
      await expect(headers).not.toHaveCount(0);

      for (const header of await headers.all()) {
        await header.scrollIntoViewIfNeeded();
        const logo = header.locator('.experience-logo');
        await expect.poll(() => logo.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        )).toBe(true);

        const layout = await header.evaluate((element) => {
          const role = element.querySelector<HTMLElement>('.experience-role')!;
          const company = element.querySelector<HTMLElement>('.experience-company')!;
          const logo = element.querySelector<HTMLImageElement>('.experience-logo')!;
          const dates = element.querySelector<HTMLElement>('.experience-dates')!;
          const roleStyle = getComputedStyle(role);
          return {
            header: element.getBoundingClientRect().toJSON(),
            role: role.getBoundingClientRect().toJSON(),
            company: company.getBoundingClientRect().toJSON(),
            logo: logo.getBoundingClientRect().toJSON(),
            dates: dates.getBoundingClientRect().toJSON(),
            twoLineHeight: parseFloat(roleStyle.lineHeight)
              + parseFloat(roleStyle.marginBottom)
              + parseFloat(getComputedStyle(company).lineHeight),
          };
        });

        expect(Math.abs(layout.dates.left - layout.company.left)).toBeLessThan(1);
        expect(layout.dates.top).toBeGreaterThan(layout.company.bottom);
        expect(layout.dates.top).toBeGreaterThan(layout.logo.bottom);
        expect(Math.abs(layout.logo.top - layout.role.top)).toBeLessThan(1);
        expect(Math.abs(layout.logo.right - layout.header.right)).toBeLessThan(1);
        expect(Math.abs(layout.logo.height - layout.twoLineHeight)).toBeLessThan(1);
        expect(layout.logo.height).toBeGreaterThan(36);
        expect(layout.role.right).toBeLessThan(layout.logo.left);
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    });
  }

  test('keeps the experience header readable with enlarged text', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/experience');
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    for (const header of await page.locator('.experience-header').all()) {
      const layout = await header.evaluate((element) => {
        const company = element.querySelector('.experience-company')!.getBoundingClientRect();
        const logo = element.querySelector('.experience-logo')!.getBoundingClientRect();
        const dates = element.querySelector('.experience-dates')!.getBoundingClientRect();
        return {
          company: company.toJSON(), logo: logo.toJSON(), dates: dates.toJSON(),
          width: element.clientWidth, contentWidth: element.scrollWidth,
        };
      });
      expect(layout.logo.height).toBeGreaterThan(100);
      expect(layout.company.right).toBeLessThan(layout.logo.left);
      expect(layout.dates.top).toBeGreaterThan(layout.company.bottom);
      expect(Math.abs(layout.dates.left - layout.company.left)).toBeLessThan(1);
      expect(layout.contentWidth).toBeLessThanOrEqual(layout.width);
    }
  });
});
