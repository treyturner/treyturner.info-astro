import { test, expect } from '@playwright/test';

const expectedLinks = [
  ['alan-feldman', 'invodo'],
  ['alan-feldman', 'att-wifi-qa-ii'],
  ['amelia-wilson', 'att-wifi-qa-ii'],
  ['chad-johnson', 'kapsch-trafficcom'],
  ['chad-johnson', 'stoplight-io'],
  ['chris-lanzo', 'stoplight-io'],
  ['cody-myhre', 'kapsch-trafficcom'],
  ['curtis-matthews', 'stoplight-io'],
  ['curtis-matthews', 'repeat-md'],
  ['ethan-riback', 'repeat-md'],
  ['hank-brown', 'invodo'],
  ['jim-carlile', 'kapsch-trafficcom'],
  ['joshua-fontenot', 'kapsch-trafficcom'],
  ['matthew-spell', 'invodo'],
];

test.describe('Experience and recommendation links', () => {
  test('each role links to the correct experience and every destination has a return link', async ({ page }) => {
    await page.goto('/recommendations');
    await expect(page.locator('.recommendation-experience-link')).toHaveCount(expectedLinks.length);
    for (const [recommendation, experience] of expectedLinks) {
      const card = page.locator(`.recommendation-card[id="${recommendation}"]`);
      await expect(card.locator(`a[href="/experience#${experience}"]`)).toHaveCount(1);
      await expect(card).toHaveAttribute('tabindex', '-1');
    }

    await page.goto('/experience');
    await expect(page.locator('.recommendation-preview')).toHaveCount(expectedLinks.length);
    for (const [recommendation, experience] of expectedLinks) {
      const card = page.locator(`.experience-card[id="${experience}"]`);
      await expect(card.locator(`a[href="/recommendations#${recommendation}"]`)).toHaveCount(1);
      await expect(card).toHaveAttribute('tabindex', '-1');
    }
  });

  test('both AT&T recommendations belong only to QA Engineer II', async ({ page }) => {
    await page.goto('/experience');
    await expect(page.locator('#att-wifi-qa-ii .experience-role')).toHaveText('QA Engineer II');
    await expect(page.locator('#att-wifi-qa-ii .preview-author')).toHaveText(['Amelia Wilson', 'Alan Feldman']);
    await expect(page.locator('#att-wifi-qa .experience-recommendations')).toHaveCount(0);
  });

  test('native keyboard links land on the correct card in both directions', async ({ page }) => {
    await page.goto('/recommendations');
    const role = page.locator('#alan-feldman a[href="/experience#att-wifi-qa-ii"]');
    await expect(role).toHaveText('Eng. Manager at AT&T Wi-Fi');
    await role.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/experience#att-wifi-qa-ii$/);
    await expect(page.locator('#att-wifi-qa-ii')).toBeInViewport();
    await expect(page.locator('#att-wifi-qa-ii')).toBeFocused();

    const preview = page.locator('#att-wifi-qa-ii').getByRole('link', { name: 'Read recommendation from Alan Feldman' });
    await expect(preview.locator('a, button')).toHaveCount(0);
    await preview.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/recommendations#alan-feldman$/);
    await expect(page.locator('#alan-feldman')).toBeInViewport();
    await expect(page.locator('#alan-feldman')).toBeFocused();
  });

  test('compact cards use the relationship at that workplace, not the recommendation group', async ({ page }) => {
    await page.goto('/experience');
    await expect(page.locator('#kapsch-trafficcom [href="/recommendations#chad-johnson"] .preview-role'))
      .toHaveText('Test Engineer II · Direct report');
    await expect(page.locator('#stoplight-io [href="/recommendations#chad-johnson"] .preview-role'))
      .toHaveText('SDET · Colleague');
    await expect(page.locator('.experience-card .recommendation-text')).toHaveCount(0);
  });

  test('omits the section on experiences without recommendations', async ({ page }) => {
    await page.goto('/experience');
    const linkedExperiences = new Set(expectedLinks.map(([, experience]) => experience));
    const cards = page.locator('.experience-card');
    for (let i = 0; i < await cards.count(); i++) {
      const card = cards.nth(i);
      const linked = linkedExperiences.has((await card.getAttribute('id'))!);
      await expect(card.locator('.experience-recommendations')).toHaveCount(linked ? 1 : 0);
    }
  });

  test('loads small author photos with dimensions and supports an author without a photo', async ({ page }) => {
    await page.goto('/experience');
    const photos = page.locator('.recommendation-preview img');
    await expect(photos).toHaveCount(13);
    for (let i = 0; i < await photos.count(); i++) {
      const photo = photos.nth(i);
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toHaveAttribute('width', '32');
      await expect(photo).toHaveAttribute('height', '32');
      await expect.poll(() => photo.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      )).toBe(true);
    }
    const jim = page.getByRole('link', { name: 'Read recommendation from Jim Carlile' });
    await jim.scrollIntoViewIfNeeded();
    await expect(jim).toBeVisible();
    await expect(jim.locator('img')).toHaveCount(0);
  });
});

test.describe('Recommendation links on small screens', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('compact cards stack and both pages fit the viewport in both themes', async ({ page }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto('/experience#kapsch-trafficcom');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      const cards = page.locator('#kapsch-trafficcom .recommendation-preview');
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await cards.first().click();
      await expect(page.locator('.recommendation-card:target')).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
});
