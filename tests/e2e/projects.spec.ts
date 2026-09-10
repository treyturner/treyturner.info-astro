import { basename, extname } from 'node:path';
import { test, expect, type Locator } from '@playwright/test';
import { formatYearMonthDay } from '../../src/schemas/common';
import { projectRoleLabels, projectStatusLabels } from '../../src/utils/projects';
import { inlineCodeToText, parseInlineCode } from '../../src/utils/inline-code';
import { readProjectContent } from '../helpers/project-content';

const { publishedProjects, draftProjects } = readProjectContent();

async function expectInlineCode(locator: Locator, text: string) {
  await expect(locator).toHaveText(inlineCodeToText(text));
  await expect(locator.locator('code')).toHaveText(
    parseInlineCode(text).filter((part) => part.code).map((part) => part.text),
  );
  for (const code of await locator.locator('code').all()) {
    await expect(code).toHaveCSS('font-family', /monospace/);
  }
  await expect(locator.locator('a, script, iframe')).toHaveCount(0);
}

async function expectProjectImage(image: Locator, imagePath: string | undefined) {
  await expect(image).toHaveCount(imagePath ? 1 : 0);
  if (!imagePath) return;

  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('width', /^[1-9]\d*$/);
  await expect(image).toHaveAttribute('height', /^[1-9]\d*$/);

  // Development uses an image endpoint; production uses a hashed, optimized filename.
  const src = new URL((await image.getAttribute('src'))!, 'http://localhost');
  const resolvedPath = src.searchParams.get('href') ?? decodeURIComponent(src.pathname);
  const imageName = basename(imagePath, extname(imagePath));
  expect(basename(resolvedPath).startsWith(`${imageName}.`), `Expected image ${imagePath}, received ${resolvedPath}`).toBe(true);

  await expect.poll(() => image.evaluate(
    (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
  )).toBe(true);
}

test.describe('Projects page', () => {
  test('renders the Projects landing page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveTitle(/Projects/);
    await expect(page.locator('h1')).toHaveText('Projects');
    await expect(page.locator('.projects-intro')).toContainText('personal software');
  });

  test('shows Projects as the active navigation item', async ({ page }) => {
    await page.goto('/projects');
    const activeLink = page.locator('nav a.active');
    await expect(activeLink).toHaveText('Projects');
    await expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  test('has a descriptive SEO summary', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /software|automation|infrastructure/i,
    );
  });

  test('offers a branded Patreon link that opens a new tab with the keyboard', async ({ page, context }) => {
    await page.goto('/projects');
    const originalUrl = page.url();
    const badge = page.getByRole('link', { name: 'Support on Patreon', exact: true });
    await expect(badge).toHaveCount(1);
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('href', 'https://patreon.treyturner.info');
    await expect(badge).toHaveAttribute('target', '_blank');
    await expect(badge).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(badge.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(badge.locator('svg')).toHaveAttribute('focusable', 'false');
    await expect(badge.locator('svg')).toBeVisible();
    await badge.hover();
    await expect(badge).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(badge).toHaveCSS('background-color', 'rgb(0, 0, 0)');

    await page.locator('main h1').click();
    await page.keyboard.press('Tab');
    await expect(badge).toBeFocused();
    await expect(badge).toHaveCSS('outline-style', 'solid');
    await expect(badge).toHaveCSS('outline-width', '2px');
    // Intercept the new tab's navigation without depending on the external service.
    await context.route('https://patreon.treyturner.info/', (route) => route.fulfill({
      status: 200, contentType: 'text/html', body: '<title>Patreon destination</title>',
    }));
    const opened = page.waitForEvent('popup');
    await page.keyboard.press('Enter');
    const tab = await opened;
    await expect(tab).toHaveURL('https://patreon.treyturner.info/');
    await expect(tab).toHaveTitle('Patreon destination');
    expect(await tab.evaluate(() => window.opener === null)).toBe(true);
    expect(await tab.evaluate(() => document.referrer)).toBe('');
    await expect(page).toHaveURL(originalUrl);
    await tab.close();
  });

  test('shows only published cards in display order, with title as the tie-breaker', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('.project-card-title')).toHaveText(publishedProjects.map(({ title }) => title));
    await expect(page.locator('.project-card-link')).toHaveCount(publishedProjects.length);
    expect(await page.locator('.project-card-link').evaluateAll(
      (links) => links.map((link) => link.getAttribute('href')),
    )).toEqual(publishedProjects.map(({ id }) => `/projects/${id}`));
    await expect(page.locator('.projects-empty')).toHaveCount(publishedProjects.length ? 0 : 1);
    for (const { id } of draftProjects) {
      await expect(page.locator(`.project-card-link[href="/projects/${id}"]`)).toHaveCount(0);
    }
    await expect(page.locator('.project-content')).toHaveCount(0);
  });

  test('cards include summaries, roles, labeled statuses, technologies, and optional logos', async ({ page }) => {
    await page.goto('/projects');
    for (const { id, logoImage, role, status, description, technologyStack } of publishedProjects) {
      const card = page.locator(`.project-card-link[href="/projects/${id}"]`);
      await expectInlineCode(card.locator('.project-card-description'), description);
      await expect(card.locator('.project-card-role')).toHaveText(projectRoleLabels[role]);
      await expect(card.locator('.project-status')).toHaveText(`Status: ${projectStatusLabels[status]}`);
      await expect(card.locator('.project-status')).toHaveCSS('border-top-width', '0px');
      await expect(card.locator('.project-status')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(card.locator('.project-card-separator')).toHaveAttribute('aria-hidden', 'true');
      const technologies = card.getByRole('list', { name: 'Technology stack' });
      await expect(technologies).toHaveCount(technologyStack.length ? 1 : 0);
      await expect(technologies.locator('li')).toHaveText(technologyStack);
      await expect(card.locator('.project-card-more')).toContainText('Read about this project');
      await expectProjectImage(card.locator('.project-card-logo'), logoImage);
    }
  });

  test('a whole card is a single native link and can be opened with the keyboard', async ({ page }) => {
    test.skip(!publishedProjects.length, 'No published projects to navigate to.');
    const { id, title } = publishedProjects[0];
    const path = `/projects/${id}`;
    await page.goto('/projects');
    const card = page.locator(`.project-card-link[href="${path}"]`);
    await expect(card).toHaveAccessibleName(title);
    await expect(card.locator('a, button')).toHaveCount(0);
    await card.focus();
    await expect(card).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL((url) => decodeURIComponent(url.pathname).replace(/\/$/, '') === path);
    await expect(page.locator('h1')).toHaveText(title);
    await page.locator('.project-back-link').first().click();
    await expect(page).toHaveURL(/\/projects\/?$/);
  });

  test('clicking the card description navigates to its project', async ({ page }) => {
    test.skip(!publishedProjects.length, 'No published projects to navigate to.');
    const path = `/projects/${publishedProjects[0].id}`;
    await page.goto('/projects');
    await page.locator(`.project-card-link[href="${path}"] .project-card-description`).click();
    await expect(page).toHaveURL((url) => decodeURIComponent(url.pathname).replace(/\/$/, '') === path);
  });

  test('draft projects and unknown projects have no accessible detail page', async ({ request }) => {
    let unknownId = 'not-a-project';
    const ids = new Set([...publishedProjects, ...draftProjects].map(({ id }) => id));
    while (ids.has(unknownId)) unknownId += '-missing';
    for (const id of [...draftProjects.map(({ id }) => id), unknownId]) {
      const response = await request.get(`/projects/${id}`);
      expect(response.status()).toBe(404);
    }
  });
});

test.describe('Project detail pages', () => {
  for (const kind of ['deployment', 'repository'] as const) {
    test(`opens a ${kind} in a new tab without leaving the project page`, async ({ page, context }) => {
      const project = publishedProjects.find((project) => (
        kind === 'deployment' ? project.liveUrl : project.repositoryUrls?.length
      ));
      test.skip(!project, `No published project with a ${kind} link.`);
      const destination = new URL(kind === 'deployment' ? project!.liveUrl! : project!.repositoryUrls![0]).href;
      await page.goto(`/projects/${project!.id}`);
      const originalUrl = page.url();
      const links = page.getByRole('list', { name: 'Project links' });
      const link = kind === 'deployment'
        ? links.getByRole('link', { name: /^Visit / })
        : links.locator('.project-repository-link').first();

      // Intercept at context level so the new tab never needs the external service.
      await context.route(destination, (route) => route.fulfill({
        status: 200, contentType: 'text/html', body: '<title>Project destination</title>',
      }));
      const opened = page.waitForEvent('popup');
      if (kind === 'deployment') await link.click();
      else {
        await link.focus();
        await page.keyboard.press('Enter');
      }
      const tab = await opened;
      await expect(tab).toHaveURL(destination);
      await expect(tab).toHaveTitle('Project destination');
      expect(await tab.evaluate(() => window.opener === null)).toBe(true);
      expect(await tab.evaluate(() => document.referrer)).toBe('');
      await expect(page).toHaveURL(originalUrl);
      await tab.close();
    });
  }

  for (const project of publishedProjects) {
    const { id, title, logoImage, role, status, liveUrl, startDate, endDate, technologyStack } = project;
    test(`renders the ${id} logo according to its content`, async ({ page }) => {
      const response = await page.goto(`/projects/${id}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(title);
      await expectProjectImage(page.locator('.project-logo'), logoImage);
    });

    test(`renders the full ${id} project and page-specific metadata`, async ({ page, request }) => {
      const response = await page.goto(`/projects/${id}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(title);
      await expect(page).toHaveTitle(`${title} | Trey Turner`);
      await expectInlineCode(page.locator('.project-description'), project.description);
      await expectInlineCode(page.locator('.project-goal dd'), project.goal);
      await expect(page.locator('.project-facts')).toContainText(projectRoleLabels[role]);
      await expect(page.locator('.project-facts dt')).toHaveText([
        'Goal', 'My role', 'Status', 'Started', ...(endDate ? ['Ended'] : []),
      ]);
      await expect(page.locator('.project-facts .project-status')).toHaveText(projectStatusLabels[status]);
      await expect(page.locator('.project-status')).toHaveCount(1);
      await expect(page.locator('.project-status')).toHaveCSS('border-top-width', '0px');
      const visitLink = page.locator('.project-links').getByRole('link', { name: /^Visit / });
      if (liveUrl) {
        await expect(visitLink).toHaveAccessibleName(`Visit ${liveUrl}`);
        await expect(visitLink).toHaveAttribute('href', liveUrl);
      } else {
        await expect(visitLink).toHaveCount(0);
      }
      const dates = endDate ? [startDate, endDate] : [startDate];
      await expect(page.locator('.project-facts time')).toHaveText(dates.map(formatYearMonthDay));
      for (const [index, date] of dates.entries()) {
        await expect(page.locator('.project-facts time').nth(index)).toHaveAttribute('datetime', date.toISOString());
      }
      const content = page.locator('.project-content');
      await expect(content).toHaveCount(1);
      if (project.body) await expect(content).not.toBeEmpty();
      else await expect(content).toBeEmpty();
      for (const code of await content.locator(':not(pre) > code').all()) {
        await expect(code).toHaveCSS('font-family', /monospace/);
      }
      const technologies = page.getByRole('list', { name: 'Technology stack' });
      await expect(technologies).toHaveCount(technologyStack.length ? 1 : 0);
      await expect(technologies.locator('li')).toHaveText(technologyStack);

      const repositories = project.repositoryUrls ?? [];
      const links = page.getByRole('list', { name: 'Project links' });
      const linkCount = repositories.length + (liveUrl ? 1 : 0);
      await expect(links).toHaveCount(linkCount ? 1 : 0);
      await expect(links.getByRole('link')).toHaveCount(linkCount);
      for (const link of await links.getByRole('link').all()) {
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      const repositoryLinks = links.locator('.project-repository-link');
      await expect(repositoryLinks).toHaveCount(repositories.length);
      for (const [index, url] of repositories.entries()) {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean);
        const isGitHub = /^(www\.)?github\.com$/.test(parsed.hostname) && segments.length >= 2;
        const name = isGitHub ? segments.slice(0, 2).join('/').replace(/\.git$/i, '') : url;
        const link = repositoryLinks.nth(index);
        await expect(link).toHaveAccessibleName(name);
        await expect(link).toHaveAttribute('href', url);
        const icon = link.locator('svg.github-icon');
        await expect(icon).toHaveCount(isGitHub ? 1 : 0);
        if (isGitHub) {
          await expect(icon).toBeVisible();
          await expect(icon).toHaveAttribute('aria-hidden', 'true');
          await expect(icon).toHaveAttribute('focusable', 'false');
          await expect(icon).toHaveAttribute('fill', 'currentColor');
          const iconBox = (await icon.boundingBox())!;
          const labelBox = (await link.locator(':scope > span').boundingBox())!;
          expect(iconBox.x + iconBox.width).toBeLessThan(labelBox.x);
        }
      }

      await expectProjectImage(page.locator('.project-featured-image'), project.featuredImage);

      const activeLink = page.locator('nav a.active');
      await expect(activeLink).toHaveText('Projects');
      await expect(activeLink).toHaveAttribute('aria-current', 'location');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href', new RegExp(`^https://astro\\.treyturner\\.info/projects/${id}/?$`),
      );
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect((await page.locator('.project-description').innerText()).startsWith(description!.replace(/\.\.\.$/, ''))).toBe(true);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description!);
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description!);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', `${title} | Trey Turner`);

      const internalLinks = await page.locator('main a[href^="/"]').evaluateAll(
        (links) => [...new Set(links.map((link) => link.getAttribute('href')!))],
      );
      for (const href of internalLinks) {
        expect((await request.get(href)).status(), `${href} on ${id}`).toBeLessThan(400);
      }
    });
  }
});

for (const width of [1280, 820, 390, 320]) {
  test.describe(`Project layout at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('positions the Patreon badge alongside the heading or below it in both themes', async ({ page }) => {
      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        await page.goto('/projects');
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
        const header = page.locator('.projects-header');
        const badge = header.getByRole('link', { name: 'Support on Patreon' });
        await expect(badge).toBeVisible();
        const headerBox = (await header.boundingBox())!;
        const headingBox = (await header.locator('.projects-heading').boundingBox())!;
        const badgeBox = (await badge.boundingBox())!;
        const listBox = (await page.locator('.projects-grid, .projects-empty').boundingBox())!;
        expect(badgeBox.height).toBeGreaterThanOrEqual(44);
        expect(listBox.y).toBeGreaterThan(headerBox.y + headerBox.height);
        if (width > 768) {
          expect(badgeBox.x).toBeGreaterThan(headingBox.x + headingBox.width);
          expect(Math.abs(badgeBox.x + badgeBox.width - headerBox.x - headerBox.width)).toBeLessThan(1);
          expect(Math.abs(badgeBox.y + badgeBox.height / 2 - headingBox.y - headingBox.height / 2)).toBeLessThan(1);
        } else {
          expect(badgeBox.y).toBeGreaterThan(headingBox.y + headingBox.height);
          expect(Math.abs(badgeBox.x - headingBox.x)).toBeLessThan(1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    });

    test('keeps role and status on one line beneath the logo and title', async ({ page }) => {
      test.skip(!publishedProjects.length, 'No published project cards to measure.');
      await page.goto('/projects');
      const cards = page.locator('.project-card-link');
      await expect(cards.first()).toBeVisible();
      for (const card of await cards.all()) {
        const header = card.locator('.project-card-header');
        const metadata = card.locator('.project-card-metadata');
        const footer = card.locator('.project-card-footer');
        await expect(header.locator('.project-card-title')).toHaveCount(1);
        await expect(header.locator('.project-status')).toHaveCount(0);
        await expect(footer.locator('.project-card-more')).toHaveCount(1);
        await expect(footer.locator('.project-status')).toHaveCount(0);
        await expect(metadata.locator('.project-card-role')).toHaveCount(1);
        await expect(metadata.locator('.project-status')).toHaveCount(1);
        await expect(card.locator('.project-status')).toHaveCount(1);
        await expect(card.locator(':scope > :first-child')).toHaveClass('project-card-heading');
        await expect(card.locator(':scope > :last-child')).toHaveClass('project-card-footer');

        const titleBox = (await header.locator('.project-card-title').boundingBox())!;
        const headerBox = (await header.boundingBox())!;
        if (await header.locator('.project-card-logo').count()) {
          const logoBox = (await header.locator('.project-card-logo').boundingBox())!;
          expect(titleBox.x).toBeGreaterThan(logoBox.x + logoBox.width);
          expect(Math.abs(titleBox.y + titleBox.height / 2 - logoBox.y - logoBox.height / 2)).toBeLessThan(1);
        } else {
          expect(Math.abs(titleBox.x - headerBox.x)).toBeLessThan(1);
        }

        const footerBox = (await footer.boundingBox())!;
        const moreBox = (await footer.locator('.project-card-more').boundingBox())!;
        const metadataBox = (await metadata.boundingBox())!;
        const roleBox = (await metadata.locator('.project-card-role').boundingBox())!;
        const statusBox = (await metadata.locator('.project-status').boundingBox())!;
        const descriptionBox = (await card.locator('.project-card-description').boundingBox())!;
        expect(Math.abs(moreBox.x - footerBox.x)).toBeLessThan(1);
        expect(metadataBox.y).toBeGreaterThan(headerBox.y + headerBox.height);
        expect(descriptionBox.y).toBeGreaterThan(metadataBox.y + metadataBox.height);
        expect(Math.abs(metadataBox.x - headerBox.x)).toBeLessThan(1);
        expect(statusBox.x).toBeGreaterThan(roleBox.x + roleBox.width);
        expect(Math.abs(statusBox.y - roleBox.y)).toBeLessThan(1);

        const contentBottom = await card.evaluate((element) => {
          const style = getComputedStyle(element);
          return element.getBoundingClientRect().bottom - parseFloat(style.paddingBottom) - parseFloat(style.borderBottomWidth);
        });
        expect(Math.abs(footerBox.y + footerBox.height - contentBottom)).toBeLessThan(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    test('aligns detail logos and titles and orders the project facts', async ({ page }) => {
      for (const { id, logoImage } of publishedProjects) {
        await page.goto(`/projects/${id}`);
        const heading = page.locator('.project-title-row');
        const titleBox = (await heading.locator('h1').boundingBox())!;
        const headingBox = (await heading.boundingBox())!;
        if (logoImage) {
          const logoBox = (await heading.locator('.project-logo').boundingBox())!;
          expect(titleBox.x).toBeGreaterThan(logoBox.x + logoBox.width);
          expect(Math.abs(titleBox.y + titleBox.height / 2 - logoBox.y - logoBox.height / 2)).toBeLessThan(1);
        } else {
          await expect(heading.locator('.project-logo')).toHaveCount(0);
          expect(Math.abs(titleBox.x - headingBox.x)).toBeLessThan(1);
        }

        const facts = page.locator('.project-facts > div');
        const roleBox = (await facts.filter({ has: page.getByText('My role', { exact: true }) }).boundingBox())!;
        const statusBox = (await facts.filter({ has: page.getByText('Status', { exact: true }) }).boundingBox())!;
        const startedBox = (await facts.filter({ has: page.getByText('Started', { exact: true }) }).boundingBox())!;
        if (width > 576) {
          expect(statusBox.x).toBeGreaterThan(roleBox.x + roleBox.width);
          expect(startedBox.x).toBeGreaterThan(statusBox.x + statusBox.width);
          expect(Math.abs(roleBox.y - statusBox.y)).toBeLessThan(1);
          expect(Math.abs(statusBox.y - startedBox.y)).toBeLessThan(1);
        } else {
          expect(statusBox.y).toBeGreaterThan(roleBox.y + roleBox.height);
          expect(startedBox.y).toBeGreaterThan(statusBox.y + statusBox.height);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    });
  });
}

test.describe('Projects on small screens', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps card metadata readable with enlarged text', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('html').evaluate((element) => { element.style.fontSize = '200%'; });
    const badge = page.getByRole('link', { name: 'Support on Patreon' });
    await expect(badge).toBeVisible();
    expect(await badge.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const metadata of await page.locator('.project-card-metadata').all()) {
      await expect(metadata.locator('.project-card-role')).toBeVisible();
      await expect(metadata.locator('.project-status')).toBeVisible();
      expect(await metadata.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('cards and full articles fit the viewport in both themes', async ({ page }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      for (const path of ['/projects', ...publishedProjects.map(({ id }) => `/projects/${id}`)]) {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    }
  });
});
