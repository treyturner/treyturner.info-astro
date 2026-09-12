import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const cvPath = '/trey-turner-cv.pdf';
const cvFile = new URL('../../public/trey-turner-cv.pdf', import.meta.url);

test('serves the bundled CV as an unchanged PDF', async ({ request }) => {
  const response = await request.get(cvPath);
  await expect(response).toBeOK();
  expect(response.headers()['content-type']).toContain('application/pdf');
  const pdf = await response.body();
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.equals(await readFile(cvFile))).toBe(true);
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`CV download with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, () => {
    test.use({ javaScriptEnabled });
    test(`downloads the PDF by ${javaScriptEnabled ? 'click' : 'keyboard'} without leaving the home page`, async ({ page }) => {
      await page.goto('/');
      const homeUrl = page.url();
      const link = page.getByRole('link', { name: 'Download CV', exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', cvPath);
      await expect(link).toHaveAttribute('download', 'Trey-Turner-CV.pdf');
      const downloadEvent = page.waitForEvent('download');
      if (javaScriptEnabled) {
        await link.click();
      } else {
        await link.focus();
        await page.keyboard.press('Enter');
      }
      const download = await downloadEvent;
      expect(await download.failure()).toBeNull();
      expect(download.suggestedFilename()).toBe('Trey-Turner-CV.pdf');
      expect((await readFile((await download.path())!)).equals(await readFile(cvFile))).toBe(true);
      await expect(page).toHaveURL(homeUrl);
      expect(page.context().pages()).toHaveLength(1);
    });
  });
}

for (const width of [1280, 390, 320]) {
  test(`keeps the outlined CV button between the copy and icons at ${width}px in both themes and text sizes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const colorScheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/');
      const link = page.getByRole('link', { name: 'Download CV', exact: true });
      const icon = link.locator('svg');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon).toHaveAttribute('focusable', 'false');
      const accent = await page.locator('nav [aria-current="page"]').evaluate((element) => getComputedStyle(element).color);
      await expect(link).toHaveCSS('border-style', 'solid');
      await expect(link).toHaveCSS('border-width', '1px');
      await expect(link).toHaveCSS('border-color', accent);
      await expect(link).toHaveCSS('color', accent);
      await expect(icon).toHaveCSS('stroke', accent);
      for (const scale of ['100%', '200%']) {
        await page.locator('html').evaluate((element, scale) => { element.style.fontSize = scale; }, scale);
        const box = (await link.boundingBox())!;
        const labelBox = (await link.locator('span').boundingBox())!;
        const iconBox = (await icon.boundingBox())!;
        const copyBox = (await page.locator('.vcard-tagline').boundingBox())!;
        const socialBox = (await page.locator('.vcard-social').boundingBox())!;
        const nameBox = (await page.locator('.vcard-name').boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        // Allow the browser's subpixel rounding for content-sized elements.
        expect(box.x + box.width / 2).toBeCloseTo(nameBox.x + nameBox.width / 2, 1);
        expect(box.y).toBeGreaterThan(copyBox.y + copyBox.height);
        expect(socialBox.y).toBeGreaterThan(box.y + box.height);
        expect(iconBox.x).toBeGreaterThan(labelBox.x + labelBox.width);
        expect(iconBox.y + iconBox.height / 2).toBeCloseTo(labelBox.y + labelBox.height / 2, 1);
        expect(labelBox.x).toBeGreaterThan(box.x);
        expect(iconBox.x + iconBox.width).toBeLessThan(box.x + box.width);
        expect(await link.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        expect(await page.locator('html').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      }
      await link.hover();
      await expect(link).toHaveCSS('text-decoration-line', 'none');
      await page.mouse.move(0, 0);
      await link.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(link).toBeFocused();
      await expect(link).toHaveCSS('outline-style', 'solid');
      await expect(link).toHaveCSS('outline-width', '2px');
      await expect(link).toHaveCSS('outline-color', accent);
    }
  });
}
