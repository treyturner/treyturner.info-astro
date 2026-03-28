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

  test('displays role description', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Software Quality Architect');
  });
});
