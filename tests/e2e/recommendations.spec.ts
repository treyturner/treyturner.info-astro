import { test, expect } from '@playwright/test';

test.describe('Recommendations page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/recommendations');
    await expect(page).toHaveTitle(/Recommendations/);
  });

  test('displays page heading', async ({ page }) => {
    await page.goto('/recommendations');
    await expect(page.locator('h1')).toContainText('Recommendations');
  });

  test('displays recommendation cards', async ({ page }) => {
    await page.goto('/recommendations');
    const cards = page.locator('.recommendation-card');
    await expect(cards).not.toHaveCount(0);
  });

  test('each card has recommendation text', async ({ page }) => {
    await page.goto('/recommendations');
    const texts = page.locator('.recommendation-text p');
    const count = await texts.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(texts.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has an author name', async ({ page }) => {
    await page.goto('/recommendations');
    const authors = page.locator('.recommendation-author strong');
    const count = await authors.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(authors.nth(i)).not.toBeEmpty();
    }
  });

  test('each card has a role and company', async ({ page }) => {
    await page.goto('/recommendations');
    const roles = page.locator('.recommendation-role');
    const count = await roles.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await roles.nth(i).textContent();
      expect(text).toContain(' at ');
    }
  });

  test('each card has a relationship label', async ({ page }) => {
    await page.goto('/recommendations');
    const relationships = page.locator('.recommendation-relationship');
    const count = await relationships.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(relationships.nth(i)).not.toBeEmpty();
    }
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/recommendations');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /endorsements|recommendations/i);
  });

  test('navigation shows Recommendations as active', async ({ page }) => {
    await page.goto('/recommendations');
    const activeLink = page.locator('nav a.active');
    await expect(activeLink).toContainText('Recommendations');
  });
});
