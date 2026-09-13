import { test, expect } from '@playwright/test';

test('serves a responsive, optimized portrait with reserved dimensions', async ({ page, request }) => {
  await page.goto('/');
  const portrait = page.getByRole('img', { name: 'Trey Turner', exact: true });
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute('width', '160');
  await expect(portrait).toHaveAttribute('height', '160');
  await expect(portrait).toHaveAttribute('loading', 'eager');
  await expect(portrait).toHaveAttribute('fetchpriority', 'high');
  await expect(portrait).toHaveAttribute('srcset', /128w.*160w.*256w.*320w/);
  await expect.poll(() => portrait.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const currentSrc = await portrait.evaluate((image) => (image as HTMLImageElement).currentSrc);
  const response = await request.get(currentSrc);
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/webp');
});

for (const colorScheme of ['dark', 'light'] as const) {
  for (const width of [1280, 390, 320]) {
    test(`centers the circular portrait and yellow crescent above the name at ${width}px in ${colorScheme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/');
      const frame = page.locator('.home-portrait');
      const portrait = frame.locator('img');
      for (const scale of ['100%', '200%']) {
        await page.locator('html').evaluate((element, scale) => { element.style.fontSize = scale; }, scale);
        const photo = (await portrait.boundingBox())!;
        const name = (await page.locator('.vcard-name').boundingBox())!;
        const nav = (await page.getByRole('navigation').boundingBox())!;
        const rem = await page.locator('html').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
        // The shared page padding and home section each contribute 3rem above the photo.
        expect(photo.y - nav.y - nav.height).toBeCloseTo(6 * rem);
        expect(photo.width).toBeCloseTo(photo.height);
        if (scale === '100%') expect(photo.width).toBe(width === 1280 ? 160 : 128);
        expect(photo.x + photo.width / 2).toBeCloseTo(name.x + name.width / 2);
        expect(photo.y + photo.height).toBeLessThan(name.y);
        await expect(portrait).toHaveCSS('border-radius', '50%');
        await expect(portrait).toHaveCSS('object-fit', 'cover');

        const crescent = await frame.evaluate((element) => {
          const style = getComputedStyle(element, '::before');
          return {
            left: parseFloat(style.left), top: parseFloat(style.top),
            width: parseFloat(style.width), height: parseFloat(style.height),
            background: style.backgroundImage, radius: style.borderRadius,
            pointerEvents: style.pointerEvents, zIndex: style.zIndex,
          };
        });
        expect(crescent.left).toBeCloseTo(-photo.width * 0.07, 1);
        expect(crescent.top).toBeCloseTo(photo.height * 0.07, 1);
        expect(crescent.width).toBeCloseTo(photo.width);
        expect(crescent.height).toBeCloseTo(photo.height);
        expect(crescent.background).toContain('rgba(238, 238, 34, 0.4)');
        expect(crescent.radius).toBe('50%');
        expect(crescent.pointerEvents).toBe('none');
        expect(crescent.zIndex).toBe('-1');
        expect(photo.x + crescent.left).toBeGreaterThanOrEqual(0);
        expect(photo.y + crescent.top + crescent.height).toBeLessThan(name.y);
        expect(await page.locator('html').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      }
    });
  }
}

test('shows the portrait with JavaScript disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    const portrait = page.getByRole('img', { name: 'Trey Turner', exact: true });
    await expect(portrait).toBeVisible();
    await expect.poll(() => portrait.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});
