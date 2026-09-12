import { expect, test } from '@playwright/test';
import site from '../../src/data/site.json' with { type: 'json' };

const { typeDelay, randomTypeDelay, deleteDelay, holdDelay, gapDelay, startDelay } = site.titleAnimation;
const firstTitleTime = startDelay + (site.rotatingTitles[0].length - 1) * typeDelay;

test.describe('Animated job title', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
    // Test timing boundaries deterministically, with separate coverage for nonzero variation.
    await page.addInitScript(() => { Math.random = () => 0; });
    await page.goto('/');
    await expect(page.locator('typewriter-title')).toHaveAttribute('data-running', '');
  });

  test('types, holds, backspaces, and cycles through every configured title with the configured timings', async ({ page }) => {
    const text = page.locator('typewriter-title [data-text]');
    await expect(text).toBeEmpty();
    await page.clock.runFor(startDelay);
    await expect(text).toHaveText(site.rotatingTitles[0][0]);
    await page.clock.runFor(firstTitleTime - startDelay);
    for (let index = 0; index < site.rotatingTitles.length; index++) {
      const current = site.rotatingTitles[index];
      const next = site.rotatingTitles[(index + 1) % site.rotatingTitles.length];
      await expect(text).toHaveText(current);
      await page.clock.runFor(holdDelay - 1);
      await expect(text).toHaveText(current);
      await page.clock.runFor(1);
      await expect(text).toHaveText(current.slice(0, -1));
      await page.clock.runFor((current.length - 1) * deleteDelay);
      await expect(text).toBeEmpty();
      await page.clock.runFor(gapDelay + (next.length - 1) * typeDelay);
      await expect(text).toHaveText(next);
    }
  });

  test('types at the configured speed without a cursor or playback controls', async ({ page }) => {
    const title = page.locator('typewriter-title');
    await expect(title.locator('button, [data-toggle], [data-cursor], .typewriter-cursor')).toHaveCount(0);
    await page.clock.runFor(startDelay + typeDelay - 1);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
    await page.clock.runFor(1);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0].slice(0, 2));
  });

  test('applies the configured random extra delay separately for each typed character', async ({ page }) => {
    const text = page.locator('typewriter-title [data-text]');
    await page.evaluate(() => { Math.random = () => 1 - Number.EPSILON; });
    // The initial character was already scheduled with zero randomness during initialization.
    await page.clock.runFor(startDelay + typeDelay + randomTypeDelay - 1);
    await expect(text).toHaveText(site.rotatingTitles[0][0]);
    await page.evaluate(() => { Math.random = () => 0; });
    await page.clock.runFor(1);
    await expect(text).toHaveText(site.rotatingTitles[0].slice(0, 2));
    await page.clock.runFor(typeDelay - 1);
    await expect(text).toHaveText(site.rotatingTitles[0].slice(0, 2));
    await page.clock.runFor(1);
    await expect(text).toHaveText(site.rotatingTitles[0].slice(0, 3));
  });

  test('uses a stable accessible title instead of announcing every keystroke', async ({ page }) => {
    await page.clock.runFor(startDelay);
    const title = page.locator('typewriter-title');
    const snapshot = await title.ariaSnapshot();
    expect(snapshot).toContain(site.title);
    expect(snapshot).not.toContain('Software Quality Architect\n');
    await expect(title.locator('.typewriter-words')).toHaveAttribute('aria-hidden', 'true');
    await expect(title.locator('[aria-live="polite"], [aria-live="assertive"]')).toHaveCount(0);
    await page.clock.runFor(5000);
    expect(await title.ariaSnapshot()).toBe(snapshot);
  });

  test('reacts to reduced-motion changes and resumes with the remaining hold time', async ({ page }) => {
    await page.clock.runFor(firstTitleTime + 1000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const title = page.locator('typewriter-title');
    await expect(title.locator('[data-fallback]')).toBeVisible();
    await expect(title.locator('[data-fallback]')).toHaveText(site.title);
    await expect(title.locator('[data-animated]')).toBeHidden();
    await expect(title.getByRole('button')).toHaveCount(0);
    await expect(title).not.toHaveAttribute('data-running');
    await page.clock.runFor(10000);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0]);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(title).toHaveAttribute('data-running', '');
    await expect(title.locator('[data-fallback]')).toBeHidden();
    await expect(title.locator('[data-animated]')).toBeVisible();
    await page.clock.runFor(holdDelay - 1000 - 1);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0]);
    await page.clock.runFor(1);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0].slice(0, -1));
  });

  test('suspends in a hidden document and resumes without a catch-up burst', async ({ page }) => {
    await page.clock.runFor(startDelay);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(10000);
    await expect(page.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
    await page.evaluate(() => {
      delete (document as unknown as { hidden?: boolean }).hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(typeDelay);
    await expect(page.locator('[data-text]')).toHaveText(site.rotatingTitles[0].slice(0, 2));
  });

  test('cleans up on removal and initializes only once on reconnection', async ({ page }) => {
    await page.clock.runFor(startDelay);
    const element = await page.locator('typewriter-title').elementHandle();
    await element!.evaluate((element) => element.remove());
    await page.clock.runFor(10000);
    expect(await element!.evaluate((element) => element.querySelector('[data-text]')!.textContent))
      .toBe(site.rotatingTitles[0][0]);
    await element!.evaluate((element) => document.querySelector('.vcard-name')!.after(element));
    await page.clock.runFor(startDelay);
    await expect(page.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
    await element!.evaluate((element) => {
      (element as HTMLElement & { connectedCallback(): void }).connectedCallback();
    });
    await page.clock.runFor(typeDelay - 1);
    await expect(page.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
    await page.clock.runFor(1);
    await expect(page.locator('[data-text]')).toHaveText(site.rotatingTitles[0].slice(0, 2));
  });

  for (const width of [1280, 390, 320]) {
    test(`centers the text beneath the name without overflow or layout jumps at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const scale of ['100%', '200%']) {
        await page.locator('html').evaluate((element, scale) => { element.style.fontSize = scale; }, scale);
        const title = page.locator('typewriter-title');
        const initial = (await title.boundingBox())!;
        const name = (await page.locator('.vcard-name').boundingBox())!;
        const nameCenter = name.x + name.width / 2;
        const taglineY = (await page.locator('.vcard-tagline').boundingBox())!.y;
        for (let index = 0; index < 12; index++) {
          await page.clock.runFor(800);
          const box = (await title.boundingBox())!;
          const words = (await title.locator('.typewriter-words').boundingBox())!;
          expect(box.height).toBeCloseTo(initial.height);
          // Grid tracks can round to different subpixels at fractional font sizes.
          expect(Math.abs(words.x + words.width / 2 - nameCenter)).toBeLessThan(1);
          const textBox = await title.locator('[data-text]').evaluate((element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            const { x, width } = range.getBoundingClientRect();
            return { x, width };
          });
          if (textBox.width > 0) {
            expect(Math.abs(textBox.x + textBox.width / 2 - nameCenter)).toBeLessThan(1);
          }
          expect((await page.locator('.vcard-tagline').boundingBox())!.y).toBeCloseTo(taglineY);
          for (const element of [title, title.locator('.typewriter-words')]) {
            expect(await element.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
          }
        }
      }
    });
  }
});

for (const mode of ['reduced-motion', 'no-javascript'] as const) {
  test.describe(`Static title with ${mode}`, () => {
    test.use(mode === 'no-javascript' ? { javaScriptEnabled: false } : { contextOptions: { reducedMotion: 'reduce' } });
    test('shows the canonical title without a cursor or animation controls', async ({ page }) => {
      await page.goto('/');
      const title = page.locator('typewriter-title');
      await expect(title.locator('[data-fallback]')).toBeVisible();
      await expect(title.locator('[data-fallback]')).toHaveText(site.title);
      await expect(title.locator('[data-animated]')).toBeHidden();
      await expect(title.getByRole('button')).toHaveCount(0);
      await expect(title.locator('[data-cursor], .typewriter-cursor')).toHaveCount(0);
      await expect(title).not.toHaveAttribute('data-running');
      expect(await title.ariaSnapshot()).toContain(site.title);
    });
  });
}

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`Title accent in ${colorScheme} mode`, () => {
    test.use({ colorScheme, contextOptions: { reducedMotion: 'reduce' } });
    test('uses yellow on dark backgrounds and readable gold on light backgrounds', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('typewriter-title')).toHaveCSS('color', colorScheme === 'dark' ? 'rgb(238, 238, 34)' : 'rgb(128, 96, 0)');
    });
  });
}
