import { expect, test } from '@playwright/test';
import site from '../../src/data/site.json' with { type: 'json' };

const { typeDelay, randomTypeDelay, deleteDelay, holdDelay, gapDelay, startDelay } = site.titleAnimation;
const firstTitleTime = startDelay + (site.rotatingTitles[0].length - 1) * typeDelay;

// Measure the rendered icon color, including the button opacity over the page background.
// WCAG 2.2 SC 1.4.11 requires 3:1 for the visual cue identifying an active control.
function controlContrast(button: Element) {
  const rgb = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  const background = rgb(getComputedStyle(document.documentElement).backgroundColor);
  const foreground = rgb(getComputedStyle(button.querySelector('svg')!).fill);
  const opacity = Number(getComputedStyle(button).opacity);
  const composited = foreground.map((channel, index) => channel * opacity + background[index] * (1 - opacity));
  const luminance = (channels: number[]) => {
    const [r, g, b] = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const lightness = [luminance(composited), luminance(background)];
  return (Math.max(...lightness) + 0.05) / (Math.min(...lightness) + 0.05);
}

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

  test('types at the configured speed with a pause control but no cursor', async ({ page }) => {
    const title = page.locator('typewriter-title');
    await expect(title.locator('[data-cursor], .typewriter-cursor')).toHaveCount(0);
    await expect(title.getByRole('button', { name: 'Pause title animation', exact: true })).toBeVisible();
    await page.clock.runFor(startDelay + typeDelay - 1);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
    await page.clock.runFor(1);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0].slice(0, 2));
  });

  for (const { phase, elapsed, remaining, before, after } of [
    { phase: 'before typing', elapsed: 0, remaining: startDelay, before: '', after: site.rotatingTitles[0][0] },
    { phase: 'typing', elapsed: startDelay + Math.floor(typeDelay / 2), remaining: typeDelay - Math.floor(typeDelay / 2), before: site.rotatingTitles[0][0], after: site.rotatingTitles[0].slice(0, 2) },
    { phase: 'holding', elapsed: firstTitleTime + 1000, remaining: holdDelay - 1000, before: site.rotatingTitles[0], after: site.rotatingTitles[0].slice(0, -1) },
    { phase: 'deleting', elapsed: firstTitleTime + holdDelay + Math.floor(deleteDelay / 2), remaining: deleteDelay - Math.floor(deleteDelay / 2), before: site.rotatingTitles[0].slice(0, -1), after: site.rotatingTitles[0].slice(0, -2) },
    { phase: 'between titles', elapsed: firstTitleTime + holdDelay + (site.rotatingTitles[0].length - 1) * deleteDelay + Math.floor(gapDelay / 2), remaining: gapDelay - Math.floor(gapDelay / 2), before: '', after: site.rotatingTitles[1][0] },
  ]) {
    test(`pauses and resumes ${phase} from the remaining delay`, async ({ page }) => {
      const title = page.locator('typewriter-title');
      const text = title.locator('[data-text]');
      await page.clock.runFor(elapsed);
      await title.getByRole('button', { name: 'Pause title animation', exact: true }).click();
      await expect(title).not.toHaveAttribute('data-running');
      await expect(title).toHaveAttribute('data-paused', '');
      const play = title.getByRole('button', { name: 'Play title animation', exact: true });
      await expect(play).toHaveAttribute('title', 'Play title animation');
      await expect(play.locator('.play-icon')).toBeVisible();
      await expect(play.locator('.pause-icon')).toBeHidden();
      await page.clock.runFor(10000);
      await expect(text).toHaveText(before);
      await play.click();
      await expect(title).toHaveAttribute('data-running', '');
      await expect(title).not.toHaveAttribute('data-paused');
      await expect(title.locator('.pause-icon')).toBeVisible();
      await expect(title.locator('.play-icon')).toBeHidden();
      await page.clock.runFor(remaining - 1);
      await expect(text).toHaveText(before);
      await page.clock.runFor(1);
      await expect(text).toHaveText(after);
    });
  }

  test('retains a manual pause across visibility and reduced-motion changes', async ({ page }) => {
    const title = page.locator('typewriter-title');
    await page.clock.runFor(startDelay);
    await title.getByRole('button', { name: 'Pause title animation', exact: true }).click();
    for (const hidden of [true, false]) {
      await page.evaluate((hidden) => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
      await page.clock.runFor(10000);
      await expect(title).not.toHaveAttribute('data-running');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(title.locator('[data-toggle]')).toBeHidden();
    await expect(title.locator('[data-fallback]')).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(title.getByRole('button', { name: 'Play title animation', exact: true })).toBeVisible();
    await expect(title).not.toHaveAttribute('data-running');
    await page.clock.runFor(10000);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
  });

  for (const returnVia of ['Home link', 'Back button', 'reload']) {
    test(`remembers pause and play across navigation using the ${returnVia}`, async ({ page }) => {
      const title = page.locator('typewriter-title');
      await page.clock.runFor(firstTitleTime);
      await title.getByRole('button', { name: 'Pause title animation', exact: true }).click();
      if (returnVia === 'reload') {
        await page.reload();
      } else {
        await page.getByRole('navigation').getByRole('link', { name: 'Skills', exact: true }).click();
        await expect(page).toHaveURL(/\/skills\/?$/);
        if (returnVia === 'Back button') await page.goBack();
        else await page.getByRole('navigation').getByRole('link', { name: 'Home', exact: true }).click();
      }
      await expect(title.getByRole('button', { name: 'Play title animation', exact: true })).toBeVisible();
      await expect(title).not.toHaveAttribute('data-running');
      await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0]);
      await page.clock.runFor(10000);
      await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0]);
      await title.getByRole('button', { name: 'Play title animation', exact: true }).click();
      await expect(title).toHaveAttribute('data-running', '');
      await page.reload();
      await expect(title).toHaveAttribute('data-running', '');
      await expect(title.getByRole('button', { name: 'Pause title animation', exact: true })).toBeVisible();
      await page.clock.runFor(startDelay);
      await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
    });
  }

  test('backspaces the displayed first title when playing after a paused load', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('title-animation-paused', 'true'));
    await page.reload();
    const title = page.locator('typewriter-title');
    const text = title.locator('[data-text]');
    const first = site.rotatingTitles[0];
    const second = site.rotatingTitles[1];
    await expect(title.getByRole('button', { name: 'Play title animation', exact: true })).toBeVisible();
    await page.clock.runFor(10000);
    await expect(text).toHaveText(first);
    await title.getByRole('button', { name: 'Play title animation', exact: true }).click();
    await expect(text).toHaveText(first);
    await page.clock.runFor(deleteDelay - 1);
    await expect(text).toHaveText(first);
    await page.clock.runFor(1);
    await expect(text).toHaveText(first.slice(0, -1));
    await page.clock.runFor((first.length - 1) * deleteDelay);
    await expect(text).toBeEmpty();
    await page.clock.runFor(gapDelay - 1);
    await expect(text).toBeEmpty();
    await page.clock.runFor(1);
    await expect(text).toHaveText(second[0]);
    await page.clock.runFor((second.length - 1) * typeDelay);
    await expect(text).toHaveText(second);
  });

  test('refreshes the saved choice when restored from the browser history cache', async ({ page }) => {
    const title = page.locator('typewriter-title');
    await page.clock.runFor(startDelay);
    await page.evaluate(() => {
      localStorage.setItem('title-animation-paused', 'true');
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await expect(title).not.toHaveAttribute('data-running');
    await page.clock.runFor(10000);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
    await page.evaluate(() => {
      localStorage.setItem('title-animation-paused', 'false');
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await expect(title).toHaveAttribute('data-running', '');
    await page.clock.runFor(typeDelay);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0].slice(0, 2));
  });

  test('ignores an invalid saved preference', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('title-animation-paused', 'invalid'));
    await page.reload();
    await expect(page.locator('typewriter-title')).toHaveAttribute('data-running', '');
    await expect(page.getByRole('button', { name: 'Pause title animation', exact: true })).toBeVisible();
  });

  test('keeps the control usable when preference storage is blocked', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const getItem = Storage.prototype.getItem;
      const setItem = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (key === 'title-animation-paused') throw new DOMException('Storage blocked', 'SecurityError');
        return getItem.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (key === 'title-animation-paused') throw new DOMException('Storage blocked', 'SecurityError');
        return setItem.call(this, key, value);
      };
    });
    await page.reload();
    const title = page.locator('typewriter-title');
    await expect(title).toHaveAttribute('data-running', '');
    await page.clock.runFor(startDelay);
    await title.getByRole('button', { name: 'Pause title animation', exact: true }).click();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await page.clock.runFor(10000);
    await expect(title).not.toHaveAttribute('data-running');
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0][0]);
    await title.getByRole('button', { name: 'Play title animation', exact: true }).click();
    await expect(title).toHaveAttribute('data-running', '');
    await page.clock.runFor(typeDelay);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0].slice(0, 2));
    expect(errors).toEqual([]);
  });

  test('retains the pause choice on reconnection without duplicate button listeners', async ({ page }) => {
    const title = page.locator('typewriter-title');
    await title.getByRole('button', { name: 'Pause title animation', exact: true }).click();
    await title.evaluate((element) => {
      element.remove();
      document.querySelector('.vcard-name')!.after(element);
      (element as HTMLElement & { connectedCallback(): void }).connectedCallback();
    });
    await expect(title).not.toHaveAttribute('data-running');
    await page.clock.runFor(10000);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0]);
    await title.getByRole('button', { name: 'Play title animation', exact: true }).click();
    await expect(title).toHaveAttribute('data-running', '');
    await page.clock.runFor(deleteDelay);
    await expect(title.locator('[data-text]')).toHaveText(site.rotatingTitles[0].slice(0, -1));
  });

  for (const colorScheme of ['dark', 'light'] as const) {
    test(`keeps the control subtle but makes hover and keyboard focus clear in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      // The theme is selected from the OS preference when the page initializes.
      await page.reload();
      await expect(page.locator('typewriter-title')).toHaveAttribute('data-running', '');
      const button = page.locator('typewriter-title [data-toggle]');
      await expect(button).toHaveCSS('opacity', '0.75');
      await expect(button).toHaveCSS('border-width', '0px');
      const controlColor = colorScheme === 'dark' ? 'rgb(204, 204, 204)' : 'rgb(102, 102, 102)';
      await expect(button).toHaveCSS('color', controlColor);
      await expect(button.locator('svg')).toHaveCSS('fill', controlColor);
      await button.hover();
      await expect(button).toHaveCSS('opacity', '1');
      await page.mouse.move(0, 0);
      await expect(button).toHaveCSS('opacity', '0.75');
      await button.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(button).toBeFocused();
      await expect(button).toHaveCSS('opacity', '1');
      await expect(button).toHaveCSS('outline-style', 'solid');
      await page.keyboard.press('Space');
      await expect(button).toHaveAccessibleName('Play title animation');
      await expect(page.locator('typewriter-title')).not.toHaveAttribute('data-running');
      await page.keyboard.press('Enter');
      await expect(button).toHaveAccessibleName('Pause title animation');
      await expect(page.locator('typewriter-title')).toHaveAttribute('data-running', '');
    });
  }

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
        const button = title.locator('[data-toggle]');
        const buttonBox = (await button.boundingBox())!;
        const controls = (await title.locator('.typewriter-controls').boundingBox())!;
        expect(buttonBox.x).toBeCloseTo(Math.min(controls.x + controls.width + 4, width - buttonBox.width));
        const initialWords = (await title.locator('.typewriter-words').boundingBox())!;
        // Showing a control must not displace the pre-existing text or change its wrapping.
        await button.evaluate((element) => { element.setAttribute('hidden', ''); });
        expect(await title.locator('.typewriter-words').boundingBox()).toEqual(initialWords);
        expect(await title.boundingBox()).toEqual(initial);
        expect((await page.locator('.vcard-tagline').boundingBox())!.y).toBe(taglineY);
        await button.evaluate((element) => { element.removeAttribute('hidden'); });
        expect(buttonBox.width).toBeGreaterThanOrEqual(24);
        expect(buttonBox.height).toBeGreaterThanOrEqual(24);
        expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(width + 0.01);
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
            expect(buttonBox.x).toBeGreaterThanOrEqual(textBox.x + textBox.width - 1);
          }
          expect(await button.boundingBox()).toEqual(buttonBox);
          expect((await page.locator('.vcard-tagline').boundingBox())!.y).toBeCloseTo(taglineY);
          expect(await title.locator('.typewriter-words').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
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
  for (const touch of [false, true]) {
    test.describe(`Playback contrast in ${colorScheme} mode on ${touch ? 'touch' : 'desktop'}`, () => {
      test.use({ colorScheme, hasTouch: touch, isMobile: touch, viewport: { width: touch ? 390 : 1280, height: 900 } });
      test('keeps both icons at 3:1 contrast without hover or focus', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto('/');
        for (const paused of [false, true]) {
          await page.evaluate((paused) => localStorage.setItem('title-animation-paused', String(paused)), paused);
          await page.reload();
          const button = page.getByRole('button', { name: paused ? 'Play title animation' : 'Pause title animation', exact: true });
          await expect(button).toBeVisible();
          await expect(button.locator(paused ? '.play-icon' : '.pause-icon')).toBeVisible();
          await expect(button).not.toBeFocused();
          expect(await button.evaluate((element) => element.matches(':hover'))).toBe(false);
          expect(await button.evaluate(controlContrast)).toBeGreaterThanOrEqual(3);
        }
      });
    });
  }

  test.describe(`Title accent in ${colorScheme} mode`, () => {
    test.use({ colorScheme, contextOptions: { reducedMotion: 'reduce' } });
    test('uses yellow on dark backgrounds and readable gold on light backgrounds', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('typewriter-title')).toHaveCSS('color', colorScheme === 'dark' ? 'rgb(238, 238, 34)' : 'rgb(128, 96, 0)');
    });
  });
}
