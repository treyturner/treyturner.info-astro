import { test, expect } from '@playwright/test';

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

  test('has GitHub social link with valid href', async ({ page }) => {
    await page.goto('/');
    const githubLink = page.locator('a:has-text("GitHub")');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/treyturner');
  });

  test('has LinkedIn social link with valid href', async ({ page }) => {
    await page.goto('/');
    const linkedinLink = page.locator('a:has-text("LinkedIn")');
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/treyeturner/');
  });

  test('has navigation with expected links', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('a')).toHaveCount(6);
  });

  test('has SEO meta description', async ({ page }) => {
    await page.goto('/');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /quality|software/i);
  });
});
