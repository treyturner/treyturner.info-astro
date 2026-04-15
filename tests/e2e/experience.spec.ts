import { test, expect } from '@playwright/test';

test.describe('Experience page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/experience');
    await expect(page).toHaveTitle(/Experience/);
  });

  test('displays page heading', async ({ page }) => {
    await page.goto('/experience');
    await expect(page.locator('h1')).toContainText('Work Experience');
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
});
