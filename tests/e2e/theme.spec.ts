import { test, expect } from '@playwright/test';

const pages = ['/', '/skills', '/experience', '/blog'];

test.describe('Dark mode toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('toggle button is visible in the header on every page', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      const toggle = page.locator('#theme-toggle');
      await expect(toggle).toBeVisible();
    }
  });

  test('defaults to dark mode when system preference is dark and nothing is stored', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).toBe('dark');
  });

  test('defaults to light mode when system preference is light and nothing is stored', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).toBe('light');
  });

  test('clicking the toggle switches from dark to light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme')))
      .toBe('dark');

    await page.locator('#theme-toggle').click();

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).toBe('light');
  });

  test('clicking the toggle switches from light to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme')))
      .toBe('light');

    await page.locator('#theme-toggle').click();

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).toBe('dark');
  });

  test('theme persists after navigating to another page', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    // Switch to light
    await page.locator('#theme-toggle').click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme')))
      .toBe('light');

    // Navigate to another page
    await page.goto('/skills');
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).toBe('light');
  });

  test('button aria-label reflects the action it will perform', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const toggle = page.locator('#theme-toggle');
    // In dark mode the button switches to light
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to light mode');

    await toggle.click();
    // In light mode the button switches to dark
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode');
  });
});
