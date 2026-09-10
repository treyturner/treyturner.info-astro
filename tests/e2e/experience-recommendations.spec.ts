import { test, expect, type Locator, type Page } from '@playwright/test';

async function expectArrivalHighlight(page: Page, card: Locator, reducedMotion = false, blur = false) {
  await expect(card).toBeInViewport();
  await expect(card).toBeFocused();
  await expect(card).toHaveCSS('border-top-width', '1px');
  await expect(card).toHaveCSS('outline-style', 'none');
  await expect(card).toHaveCSS('box-shadow', 'none');
  await expect(card).toHaveCSS('animation-duration', '5s');
  await expect(card).toHaveCSS('animation-timing-function', reducedMotion ? 'steps(1)' : 'linear');

  const colors = await card.evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    const accent = document.querySelector('nav a.active')!;
    const normalCard = document.querySelector('.experience-card:not(:target), .recommendation-card:not(:target)')!;
    return { accent: getComputedStyle(accent).color, normal: getComputedStyle(normalCard).borderTopColor };
  });
  await expect(card).toHaveCSS('border-top-color', colors.accent);

  // Seek the actual CSS animation instead of making the test wait five seconds.
  await card.evaluate((element) => { element.getAnimations()[0].currentTime = 2500; });
  if (reducedMotion) {
    await expect(card).toHaveCSS('border-top-color', colors.accent);
  } else {
    await expect(card).not.toHaveCSS('border-top-color', colors.accent);
    await expect(card).not.toHaveCSS('border-top-color', colors.normal);
  }

  if (blur) {
    await page.locator('main h1').click();
    await expect(card).not.toBeFocused();
    expect(await card.evaluate((element) => element.getAnimations()[0].currentTime)).toBe(2500);
    await expect(card).toHaveCSS('outline-style', 'none');
  }

  await card.evaluate((element) => { element.getAnimations()[0].finish(); });
  await expect(card).toHaveCSS('border-top-color', colors.normal);
  await expect(card).toHaveCSS('outline-style', 'none');
  expect(await card.evaluate((element) => element.matches(':target'))).toBe(true);
  if (!blur) await expect(card).toBeFocused();
}

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
      const role = card.locator(`a.recommendation-role-entry[href="/experience#${experience}"]`);
      await expect(role).toHaveCount(1);
      await expect(role.locator('.recommendation-role')).toHaveCount(1);
      await expect(role.locator('.recommendation-relationship')).toHaveCount(1);
      await expect(role.locator('.recommendation-engagement-link')).toHaveText('See engagement →');
      await expect(role.locator('.recommendation-engagement-link > span')).toHaveAttribute('aria-hidden', 'true');
      await expect(role.locator('a, button')).toHaveCount(0);
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
    await expect(role).toHaveAccessibleName('Eng. Manager, AT&T Wi-Fi Direct manager See engagement');
    await expect(role.locator('.recommendation-role')).toHaveText('Eng. Manager, AT&T Wi-Fi');
    await role.focus();
    await expect(role).toHaveCSS('outline-style', 'none');
    await expect(role.locator('.recommendation-engagement-link')).toHaveCSS('text-decoration-line', 'underline');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/experience#att-wifi-qa-ii$/);
    await expect(page.locator('#att-wifi-qa-ii')).toBeInViewport();
    await expect(page.locator('#att-wifi-qa-ii')).toBeFocused();

    const preview = page.locator('#att-wifi-qa-ii').getByRole('link', { name: 'Read recommendation from Alan Feldman' });
    await expect(preview.locator('a, button')).toHaveCount(0);
    await preview.focus();
    await expect(preview).toHaveCSS('outline-style', 'none');
    await expect(preview.locator('.preview-link')).toHaveCSS('text-decoration-line', 'underline');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/recommendations#alan-feldman$/);
    await expect(page.locator('#alan-feldman')).toBeInViewport();
    await expect(page.locator('#alan-feldman')).toBeFocused();
  });

  for (const target of ['.recommendation-role', '.recommendation-relationship', '.recommendation-engagement-link', '.recommendation-role-logo', 'empty space']) {
    test(`clicking a role block's ${target} navigates to its experience`, async ({ page }) => {
      await page.goto('/recommendations');
      const role = page.locator('#alan-feldman a[href="/experience#att-wifi-qa-ii"]');
      if (target === 'empty space') {
        const box = (await role.boundingBox())!;
        await role.click({ position: { x: box.width - 2, y: box.height - 2 } });
      } else await role.locator(target).click();
      await expect(page).toHaveURL(/\/experience#att-wifi-qa-ii$/);
      await expect(page.locator('#att-wifi-qa-ii')).toBeFocused();
      await expect(page.locator('#att-wifi-qa-ii')).toBeInViewport();
    });
  }

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

  test('loads 48px author photos with dimensions and supports an author without a photo', async ({ page }) => {
    await page.goto('/experience');
    const photos = page.locator('.recommendation-preview img');
    await expect(photos).toHaveCount(13);
    for (let i = 0; i < await photos.count(); i++) {
      const photo = photos.nth(i);
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toHaveAttribute('width', '48');
      await expect(photo).toHaveAttribute('height', '48');
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

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`Linked-entry styling in ${colorScheme} mode`, () => {
    test.use({ colorScheme, contextOptions: { reducedMotion: 'no-preference' } });

    test('role blocks keep plain, theme-readable titles during hover and keyboard focus', async ({ page }) => {
      await page.goto('/recommendations');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      const textColor = await page.locator('body').evaluate((element) => getComputedStyle(element).color);
      const accentColor = await page.locator('nav a.active').evaluate((element) => getComputedStyle(element).color);
      for (const role of await page.locator('.recommendation-role-entry').all()) {
        await expect(role.locator('.recommendation-role')).toHaveCSS('color', textColor);
        await expect(role.locator('.recommendation-role')).toHaveCSS('text-decoration-line', 'none');
        await expect(role).toHaveCSS('text-decoration-line', 'none');
        await expect(role.locator('.recommendation-role-logo')).toHaveAttribute('alt', '');
        const relationship = role.locator('.recommendation-relationship');
        await expect(relationship).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(relationship).toHaveCSS('border-top-width', '0px');
        await expect(relationship).toHaveCSS('outline-style', 'none');
        await expect(relationship).toHaveCSS('padding', '0px');
        const action = role.locator('.recommendation-engagement-link');
        const linked = await role.getAttribute('href') !== null;
        await expect(action).toHaveCount(linked ? 1 : 0);
        if (linked) {
          await expect(action).toHaveCSS('color', accentColor);
          await expect(action).toHaveCSS('font-size', '14px');
          await expect(action).toHaveCSS('text-decoration-line', 'none');
          const relationshipBox = (await relationship.boundingBox())!;
          const actionBox = (await action.boundingBox())!;
          expect(actionBox.y).toBeGreaterThan(relationshipBox.y + relationshipBox.height);
          await expect(role.locator('.recommendation-role-text > :last-child')).toHaveClass(/\brecommendation-engagement-link\b/);
        }
      }
      const role = page.locator('#alan-feldman a[href="/experience#att-wifi-qa-ii"]');
      for (const state of ['hover', 'focus']) {
        if (state === 'hover') await role.hover();
        else {
          await role.focus();
          // Establish keyboard modality after the pointer hover.
          await page.keyboard.press('Shift');
          await expect(role).toHaveCSS('outline-style', 'none');
          await expect(role.locator('.recommendation-engagement-link')).toHaveCSS('text-decoration-line', 'underline');
          await expect(role.locator('.recommendation-engagement-link')).toHaveCSS('text-decoration-thickness', '2px');
        }
        await expect(role).toHaveCSS('color', textColor);
        await expect(role).toHaveCSS('text-decoration-line', 'none');
        await expect(role.locator('.recommendation-role')).toHaveCSS('color', textColor);
        await expect(role.locator('.recommendation-role')).toHaveCSS('text-decoration-line', 'none');
        await expect(role.locator('.recommendation-engagement-link')).toHaveCSS('color', accentColor);
      }
    });

    test('both directions share bio-sized text and images, flush spacing, and keyboard feedback', async ({ page }) => {
      const appearances = [];
      for (const path of ['/experience', '/recommendations']) {
        await page.mouse.move(0, 0);
        await page.goto(path);
        const card = page.locator('a.related-entry').first();
        appearances.push(await card.evaluate((element) => {
          const styles = (target: Element, properties: string[]) => {
            const computed = getComputedStyle(target);
            return Object.fromEntries(properties.map((property) => [property, computed.getPropertyValue(property)]));
          };
          return {
            card: styles(element, ['display', 'gap', 'padding', 'border', 'background-color', 'color', 'line-height']),
            image: styles(element.querySelector('.related-entry-image')!, ['height', 'margin-top']),
            content: styles(element.querySelector('.related-entry-content')!, ['display', 'flex-direction', 'align-items', 'row-gap']),
            title: styles(element.querySelector('.related-entry-title')!, ['font-size', 'font-weight', 'color', 'line-height']),
            meta: styles(element.querySelector('.related-entry-meta')!, ['font-size', 'color', 'line-height']),
            action: styles(element.querySelector('.related-entry-action')!, ['font-size', 'color', 'margin-top']),
          };
        }));
        await expect(card).toHaveCSS('border-top-width', '0px');
        await expect(card).toHaveCSS('border-style', 'none');
        await expect(card).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(card).toHaveCSS('padding', '0px');
        await expect(card.locator('.related-entry-title')).toHaveCSS('font-weight', '700');
        await expect(card.locator('.related-entry-title')).toHaveCSS('font-size', '16px');
        await expect(card.locator('.related-entry-meta').first()).toHaveCSS('font-size', '14px');
        await expect(card.locator('.related-entry-content')).toHaveCSS('row-gap', '4px');
        await expect(card.locator('.related-entry-image')).toHaveCSS('height', '48px');
        await expect(card.locator('h1, h2, h3, h4, a, button')).toHaveCount(0);
        await card.scrollIntoViewIfNeeded();
        const originalBox = await card.boundingBox();
        await card.hover();
        await expect(card).toHaveCSS('border-style', 'none');
        await expect(card).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(card).toHaveCSS('text-decoration-line', 'none');
        await expect(card.locator('.related-entry-title')).toHaveCSS('text-decoration-line', 'none');
        await expect(card.locator('.related-entry-meta').first()).toHaveCSS('text-decoration-line', 'none');
        await card.focus();
        await page.keyboard.press('Shift');
        await expect(card).toHaveCSS('border-style', 'none');
        await expect(card).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(card).toHaveCSS('outline-style', 'none');
        await expect(card.locator('.related-entry-action')).toHaveCSS('text-decoration-line', 'underline');
        await expect(card.locator('.related-entry-action')).toHaveCSS('text-decoration-thickness', '2px');
        expect(await card.boundingBox()).toEqual(originalBox);
      }
      expect(appearances[1]).toEqual(appearances[0]);
    });

    test('role lines match the bio typography, baselines, and larger image size', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/recommendations');
      const footers = await page.locator('.recommendation-footer').evaluateAll((elements) => elements.map((footer) => {
        const typography = (element: Element) => {
          const style = getComputedStyle(element);
          return { font: style.fontFamily, size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight, color: style.color };
        };
        const name = footer.querySelector('.recommendation-author-link')!;
        const date = footer.querySelector('.recommendation-date')!;
        const photo = footer.querySelector('.recommendation-photo');
        return {
          nameStyle: typography(name.querySelector('strong')!),
          dateStyle: typography(date),
          nameY: name.getBoundingClientRect().y,
          dateY: date.getBoundingClientRect().y,
          gap: getComputedStyle(footer.querySelector('.recommendation-author')!).rowGap,
          photo: photo ? photo.getBoundingClientRect().toJSON() : null,
          roles: [...footer.querySelectorAll('.recommendation-role-entry')].map((role) => {
            const title = role.querySelector('.related-entry-title')!;
            const meta = role.querySelector('.related-entry-meta')!;
            const action = role.querySelector('.related-entry-action')!;
            return {
              titleStyle: typography(title), metaStyle: typography(meta), actionStyle: typography(action),
              titleY: title.getBoundingClientRect().y, metaY: meta.getBoundingClientRect().y,
              gap: getComputedStyle(role.querySelector('.related-entry-content')!).rowGap,
              logo: role.querySelector('.related-entry-image')!.getBoundingClientRect().toJSON(),
              actionGap: action.getBoundingClientRect().y - meta.getBoundingClientRect().bottom,
            };
          }),
        };
      }));
      for (const footer of footers) {
        if (footer.photo) {
          expect(footer.photo.width).toBe(48);
          expect(footer.photo.height).toBe(48);
        }
        for (const role of footer.roles) {
          expect(role.titleStyle).toEqual(footer.nameStyle);
          expect(role.metaStyle).toEqual(footer.dateStyle);
          expect(role.actionStyle.size).toBe(footer.dateStyle.size);
          expect(role.actionStyle.lineHeight).toBe(footer.dateStyle.lineHeight);
          expect(role.gap).toBe(footer.gap);
          expect(Math.abs(role.titleY - footer.nameY)).toBeLessThan(1);
          expect(Math.abs(role.metaY - footer.dateY)).toBeLessThan(1);
          expect(Math.abs(role.actionGap - parseFloat(footer.gap))).toBeLessThan(1);
          expect(role.logo.height).toBe(48);
          if (footer.photo) expect(Math.abs(role.logo.y - footer.photo.y)).toBeLessThan(1);
        }
      }
    });

    for (const navigation of ['mouse', 'keyboard'] as const) {
      test(`${navigation} arrivals use one border that fades while the entry stays targeted`, async ({ page }) => {
        await page.goto('/recommendations');
        const role = page.locator('#alan-feldman a[href="/experience#att-wifi-qa-ii"]');
        if (navigation === 'mouse') await role.click();
        else {
          await role.focus();
          await page.keyboard.press('Enter');
        }
        await expect(page).toHaveURL(/\/experience#att-wifi-qa-ii$/);
        const experience = page.locator('#att-wifi-qa-ii');
        await expectArrivalHighlight(page, experience, false, navigation === 'mouse');

        const preview = experience.getByRole('link', { name: 'Read recommendation from Alan Feldman' });
        if (navigation === 'mouse') await preview.click();
        else {
          await preview.focus();
          await page.keyboard.press('Enter');
        }
        await expect(page).toHaveURL(/\/recommendations#alan-feldman$/);
        await expectArrivalHighlight(page, page.locator('#alan-feldman'), false, navigation === 'mouse');
      });
    }

    test('reduced motion holds the single border briefly, then restores the normal border', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const path of ['/experience#att-wifi-qa-ii', '/recommendations#alan-feldman']) {
        await page.goto(path);
        await expectArrivalHighlight(page, page.locator('article:target'), true);
      }
    });
  });
}

for (const width of [1280, 390, 320]) {
  test.describe(`Recommendation role layout at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('aligns larger compact headshots with the name and relationship pair', async ({ page }) => {
      await page.goto('/experience');
      for (const fontSize of width === 1280 ? ['100%', '200%'] : ['100%']) {
        await page.locator('html').evaluate((element, size) => { element.style.fontSize = size; }, fontSize);
        for (const card of await page.locator('.recommendation-preview').all()) {
          const cardBox = (await card.boundingBox())!;
          const author = card.locator('.preview-author');
          const authorBox = (await author.boundingBox())!;
          const role = card.locator('.preview-role').first();
          const roleBox = (await role.boundingBox())!;
          const topInset = await card.evaluate((element) => {
            const style = getComputedStyle(element);
            return parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
          });
          const textGap = await card.locator('.preview-details').evaluate(
            (element) => parseFloat(getComputedStyle(element).rowGap),
          );
          // Use the same first/second-line spacing as the recommender bio.
          expect(Math.abs(authorBox.y - cardBox.y - topInset)).toBeLessThan(1);
          expect(Math.abs(roleBox.y - authorBox.y - authorBox.height - textGap)).toBeLessThan(1);

          const photo = card.locator('.preview-photo');
          if (!await photo.count()) continue;
          const photoBox = (await photo.boundingBox())!;
          const nameLineHeight = await author.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
          const roleLineHeight = await role.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
          // Keep the photo beside the first two text lines even if a long role wraps.
          const textPairCenter = authorBox.y + (nameLineHeight + textGap + roleLineHeight) / 2;
          expect(photoBox.y).toBeGreaterThan(authorBox.y);
          expect(Math.abs(photoBox.y + photoBox.height / 2 - textPairCenter)).toBeLessThan(1);
          expect(photoBox.width).toBeCloseTo(photoBox.height);
          const actionBox = (await card.locator('.preview-link').boundingBox())!;
          expect(photoBox.y + photoBox.height).toBeLessThan(actionBox.y);
        }
      }
    });

    test('centers headshots and places company logos to the left of left-aligned role text and links', async ({ page }) => {
      await page.goto('/recommendations');
      for (const card of await page.locator('.recommendation-card').all()) {
        const authorBox = (await card.locator('.recommendation-author-block').boundingBox())!;
        const textBox = (await card.locator('.recommendation-author').boundingBox())!;
        const nameBox = (await card.locator('.recommendation-author-link').boundingBox())!;
        const dateBox = (await card.locator('.recommendation-date').boundingBox())!;
        expect(Math.abs(nameBox.y - authorBox.y)).toBeLessThan(1);
        const textGap = await card.locator('.recommendation-author').evaluate(
          (element) => parseFloat(getComputedStyle(element).rowGap),
        );
        expect(Math.abs(dateBox.y - nameBox.y - nameBox.height - textGap)).toBeLessThan(1);
        const photo = card.locator('.recommendation-photo');
        if (await photo.count()) {
          const photoBox = (await photo.boundingBox())!;
          expect(photoBox.y).toBeGreaterThan(nameBox.y);
          expect(Math.abs(photoBox.y + photoBox.height / 2 - textBox.y - textBox.height / 2)).toBeLessThan(1);
          expect(photoBox.width).toBeCloseTo(photoBox.height);
        }
        const rolesBox = (await card.locator('.recommendation-roles').boundingBox())!;
        // Company logos stay anchored to the footer row, including without a headshot.
        if (width === 1280) expect(Math.abs(rolesBox.y - authorBox.y)).toBeLessThan(1);
        else expect(rolesBox.y).toBeGreaterThanOrEqual(authorBox.y + authorBox.height);
        const firstRoleBox = (await card.locator('.recommendation-role-entry').first().boundingBox())!;
        expect(Math.abs(firstRoleBox.y - rolesBox.y)).toBeLessThan(1);
      }
      for (const role of await page.locator('.recommendation-role-entry').all()) {
        const logo = role.locator('.recommendation-role-logo');
        if (!await logo.count()) continue;
        await logo.scrollIntoViewIfNeeded();
        await expect(logo).toHaveCSS('object-position', '50% 0%');
        const logoBox = (await logo.boundingBox())!;
        const textBox = (await role.locator('.recommendation-role-text').boundingBox())!;
        expect(logoBox.x + logoBox.width).toBeLessThan(textBox.x);
        const relationship = role.locator('.recommendation-relationship');
        await expect(relationship).toHaveCSS('text-align', 'left');
        const relationshipBox = (await relationship.boundingBox())!;
        expect(Math.abs(relationshipBox.x - textBox.x)).toBeLessThan(1);
        const titleBox = (await role.locator('.recommendation-role').boundingBox())!;
        expect(Math.abs(titleBox.x - textBox.x)).toBeLessThan(1);
        const nameLineHeight = await role.locator('.recommendation-role').evaluate(
          (element) => parseFloat(getComputedStyle(element).lineHeight),
        );
        const metaLineHeight = await relationship.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
        const textGap = await role.locator('.recommendation-role-text').evaluate(
          (element) => parseFloat(getComputedStyle(element).rowGap),
        );
        expect(Math.abs(logoBox.y + logoBox.height / 2 - textBox.y - (nameLineHeight + textGap + metaLineHeight) / 2)).toBeLessThan(1);
        if (width < 600) {
          const roleBox = (await role.boundingBox())!;
          const rolesBox = (await role.locator('..').boundingBox())!;
          expect(Math.abs(roleBox.x - rolesBox.x)).toBeLessThan(1);
          expect(Math.abs(roleBox.width - rolesBox.width)).toBeLessThan(1);
        }
        const action = role.locator('.recommendation-engagement-link');
        if (await action.count()) {
          const actionBox = (await action.boundingBox())!;
          expect(Math.abs(actionBox.x - textBox.x)).toBeLessThan(1);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    test('keeps every quote line evenly spaced, including with enlarged text', async ({ page }) => {
      await page.goto('/recommendations');
      for (const fontSize of ['100%', '200%']) {
        await page.locator('html').evaluate((element, size) => { element.style.fontSize = size; }, fontSize);
        const paragraphs = await page.locator('.recommendation-text p').evaluateAll((elements) => elements.map((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const lines = [...range.getClientRects()];
          const style = getComputedStyle(element);
          const before = getComputedStyle(element, '::before');
          const after = getComputedStyle(element, '::after');
          return {
            lineHeight: parseFloat(style.lineHeight),
            steps: lines.slice(1).map((line, index) => line.y - lines[index].y),
            openingQuote: before.content,
            closingQuote: after.content,
            openingSizeRatio: parseFloat(before.fontSize) / parseFloat(style.fontSize),
            closingSizeRatio: parseFloat(after.fontSize) / parseFloat(style.fontSize),
          };
        }));
        expect(paragraphs.some(({ steps }) => steps.length > 1)).toBe(true);
        for (const paragraph of paragraphs) {
          expect(paragraph.openingQuote).toBe('"“"');
          expect(paragraph.closingQuote).toBe('"”"');
          expect(paragraph.openingSizeRatio).toBeCloseTo(1.5);
          expect(paragraph.closingSizeRatio).toBeCloseTo(1.5);
          for (const step of paragraph.steps) expect(Math.abs(step - paragraph.lineHeight)).toBeLessThan(1);
        }
      }
    });
  });
}

for (const width of [1280, 600, 320]) {
  test.describe(`Recommendation role title wrapping at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('keeps the title on one line when it fits, otherwise breaks after the comma', async ({ page }) => {
      await page.goto('/recommendations');
      const role = page.locator('#alan-feldman a[href="/experience#att-wifi-qa-ii"]');
      const title = role.locator('.recommendation-role');
      await expect(title).toHaveText('Eng. Manager, AT&T Wi-Fi');
      await expect(role).toHaveAccessibleName('Eng. Manager, AT&T Wi-Fi Direct manager See engagement');
      const phrases = title.locator('.recommendation-role-phrase');
      await expect(phrases).toHaveText(['Eng. Manager,', 'AT&T Wi-Fi']);
      const jobBox = (await phrases.nth(0).boundingBox())!;
      const companyBox = (await phrases.nth(1).boundingBox())!;
      const titleBox = (await title.boundingBox())!;
      const lineHeight = await title.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));

      // Neither phrase needs to split internally at these sizes.
      expect(Math.abs(jobBox.height - lineHeight)).toBeLessThan(1);
      expect(Math.abs(companyBox.height - lineHeight)).toBeLessThan(1);
      if (width !== 320) {
        expect(Math.abs(companyBox.y - jobBox.y)).toBeLessThan(1);
        expect(companyBox.x).toBeGreaterThan(jobBox.x + jobBox.width);
        expect(Math.abs(titleBox.height - lineHeight)).toBeLessThan(1);
      } else {
        expect(Math.abs(companyBox.y - jobBox.y - lineHeight)).toBeLessThan(1);
        expect(Math.abs(companyBox.x - jobBox.x)).toBeLessThan(1);
        expect(Math.abs(titleBox.height - 2 * lineHeight)).toBeLessThan(1);
      }
    });
  });
}

test('current role and company labels fit one line in the desktop columns', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/recommendations');
  const titles = page.locator('.recommendation-role');
  expect(await titles.count()).toBeGreaterThan(0);
  for (const title of await titles.all()) {
    const titleBox = (await title.boundingBox())!;
    const lineHeight = await title.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
    expect(Math.abs(titleBox.height - lineHeight), await title.textContent() ?? '').toBeLessThan(1);
    expect(await title.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
});

test('oversized role and company phrases can wrap within a narrow card', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/recommendations');
  const title = page.locator('#alan-feldman a[href="/experience#att-wifi-qa-ii"] .recommendation-role');
  // Exercise future content that cannot fit even on its own line.
  await title.locator('.recommendation-role-phrase').nth(0).evaluate((element) => {
    element.textContent = 'Senior Infrastructure Engineering Manager,';
  });
  await title.locator('.recommendation-role-phrase').nth(1).evaluate((element) => {
    element.textContent = 'AnExceptionallyLongUnbrokenCompanyName';
  });
  const titleBox = (await title.boundingBox())!;
  const lineHeight = await title.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
  for (const phrase of await title.locator('.recommendation-role-phrase').all()) {
    const box = (await phrase.boundingBox())!;
    expect(box.height).toBeGreaterThan(lineHeight);
    expect(box.x).toBeGreaterThanOrEqual(titleBox.x);
    expect(box.x + box.width).toBeLessThanOrEqual(titleBox.x + titleBox.width + 1);
    expect(await phrase.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

for (const width of [1280, 820, 768, 767, 600, 390, 320]) {
  test.describe(`Recommendation footer columns at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('uses a narrower bio column and equal right-filled role columns, or stacks without empty slots', async ({ page }) => {
      await page.goto('/recommendations');
      const rightColumnStarts = [];
      const roleWidths = [];
      const roleCounts = new Set<number>();
      for (const card of await page.locator('.recommendation-card').all()) {
        const footer = card.locator('.recommendation-footer');
        const footerBox = (await footer.boundingBox())!;
        const authorBox = (await card.locator('.recommendation-author-block').boundingBox())!;
        const authorNameBox = (await card.locator('.recommendation-author-link').boundingBox())!;
        const gap = await footer.evaluate((element) => parseFloat(getComputedStyle(element).columnGap));
        const roles = await card.locator('.recommendation-role-entry').all();
        roleCounts.add(roles.length);
        expect(roles.length).toBeGreaterThanOrEqual(1);
        expect(roles.length).toBeLessThanOrEqual(2);
        expect(Math.abs(authorBox.x - footerBox.x)).toBeLessThan(1);
        const columnWidth = width >= 768 ? (footerBox.width - 2 * gap) / 2.8 : footerBox.width;
        const bioWidth = width >= 768 ? columnWidth * 0.8 : footerBox.width;
        expect(Math.abs(authorBox.width - bioWidth)).toBeLessThan(1);

        let previousBottom = authorBox.y + authorBox.height;
        for (const [index, role] of roles.entries()) {
          const roleBox = (await role.boundingBox())!;
          const titleBox = (await role.locator('.recommendation-role').boundingBox())!;
          // Compare the visible content's line boxes, not just the outer grid items.
          expect(Math.abs(titleBox.y - roleBox.y)).toBeLessThan(1);
          roleWidths.push(roleBox.width);
          expect(Math.abs(roleBox.width - columnWidth)).toBeLessThan(1);
          if (width >= 768) {
            // Preserve content order; the last role always occupies column three.
            const roleColumn = 2 - roles.length + index;
            expect(Math.abs(roleBox.x - footerBox.x - bioWidth - gap - roleColumn * (columnWidth + gap))).toBeLessThan(1);
            expect(Math.abs(roleBox.y - authorBox.y)).toBeLessThan(1);
            expect(Math.abs(titleBox.y - authorNameBox.y)).toBeLessThan(1);
          } else {
            expect(Math.abs(roleBox.x - footerBox.x)).toBeLessThan(1);
            expect(Math.abs(roleBox.y - previousBottom - gap)).toBeLessThan(1);
            previousBottom = roleBox.y + roleBox.height;
          }
          if (index === roles.length - 1) rightColumnStarts.push(roleBox.x);
        }
      }
      expect([...roleCounts].sort()).toEqual([1, 2]);
      // Short titles such as Matthew's must not produce narrower cards.
      expect(Math.max(...roleWidths) - Math.min(...roleWidths)).toBeLessThan(1);
      expect(Math.max(...rightColumnStarts) - Math.min(...rightColumnStarts)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}

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
