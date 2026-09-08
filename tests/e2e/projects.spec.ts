import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { parseFrontmatter } from 'astro/markdown';
import { test, expect, type Locator } from '@playwright/test';

const publishedProjects = [
  { id: 'wled-builds', title: 'Custom WLED and WLED-MM builds' },
  { id: 'mister-deskflow', title: 'MiSTer-deskflow' },
  { id: 'patreage', title: 'Patreage' },
  { id: 'lower-duck-pond', title: 'Lower Duck Pond Hosting' },
  { id: 'docker-beets', title: 'docker-beets' },
  { id: 'code-doodles', title: 'Code Doodles Revival' },
  { id: 'playwright-adventures', title: 'playwright-adventures' },
].map((project) => {
  const source = readFileSync(new URL(`../../src/content/projects/${project.id}.mdx`, import.meta.url), 'utf8');
  const { frontmatter } = parseFrontmatter(source);
  return { ...project, logoImage: frontmatter.logoImage as string | undefined };
});

async function expectProjectLogo(logo: Locator, logoImage: string | undefined) {
  await expect(logo).toHaveCount(logoImage ? 1 : 0);
  if (!logoImage) return;

  await logo.scrollIntoViewIfNeeded();
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('width', /^[1-9]\d*$/);
  await expect(logo).toHaveAttribute('height', /^[1-9]\d*$/);

  // Development uses an image endpoint; production uses a hashed, optimized filename.
  const src = new URL((await logo.getAttribute('src'))!, 'http://localhost');
  const imagePath = src.searchParams.get('href') ?? decodeURIComponent(src.pathname);
  const logoName = basename(logoImage, extname(logoImage));
  expect(basename(imagePath).startsWith(`${logoName}.`), `Expected logo ${logoImage}, received ${imagePath}`).toBe(true);

  await expect.poll(() => logo.evaluate(
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

  test('shows only published cards in display order, with title as the tie-breaker', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('.project-card-title')).toHaveText(publishedProjects.map(({ title }) => title));
    await expect(page.locator('.projects-empty')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Example Project', exact: true })).toHaveCount(0);
    await expect(page.locator('.project-content')).toHaveCount(0);
  });

  test('cards include summaries, readable statuses, technologies, and optional logos', async ({ page }) => {
    await page.goto('/projects');
    for (const { id, logoImage } of publishedProjects) {
      const card = page.locator(`.project-card-link[href="/projects/${id}"]`);
      await expect(card.locator('.project-card-description')).not.toBeEmpty();
      await expect(card.locator('.project-status')).toHaveText(id === 'lower-duck-pond' ? 'Pre-alpha' : 'Active');
      await expect(card.getByRole('list', { name: 'Technology stack' })).toBeVisible();
      await expect(card.locator('.project-card-more')).toContainText('Read about this project');
      await expectProjectLogo(card.locator('.project-card-logo'), logoImage);
    }
  });

  test('a whole card is a single native link and can be opened with the keyboard', async ({ page }) => {
    await page.goto('/projects');
    const card = page.getByRole('link', { name: 'MiSTer-deskflow', exact: true });
    await expect(card).toHaveAttribute('href', '/projects/mister-deskflow');
    await expect(card.locator('a, button')).toHaveCount(0);
    await card.focus();
    await expect(card).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects\/mister-deskflow\/?$/);
    await expect(page.locator('h1')).toHaveText('MiSTer-deskflow');
    await page.locator('.project-back-link').first().click();
    await expect(page).toHaveURL(/\/projects\/?$/);
  });

  test('clicking the card description navigates to its project', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('[href="/projects/wled-builds"] .project-card-description').click();
    await expect(page).toHaveURL(/\/projects\/wled-builds\/?$/);
  });

  test('draft projects and unknown projects have no accessible detail page', async ({ request }) => {
    for (const id of ['example-project', 'not-a-project']) {
      const response = await request.get(`/projects/${id}`);
      expect(response.status()).toBe(404);
    }
  });
});

test.describe('Project detail pages', () => {
  for (const { id, title, logoImage } of publishedProjects) {
    test(`renders the ${id} logo according to its content`, async ({ page }) => {
      const response = await page.goto(`/projects/${id}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(title);
      await expectProjectLogo(page.locator('.project-logo'), logoImage);
    });

    test(`renders the full ${id} project and page-specific metadata`, async ({ page, request }) => {
      const response = await page.goto(`/projects/${id}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(title);
      await expect(page).toHaveTitle(`${title} | Trey Turner`);
      await expect(page.locator('.project-description')).not.toBeEmpty();
      await expect(page.locator('.project-goal dd')).not.toBeEmpty();
      await expect(page.locator('.project-facts')).toContainText('Solo developer');
      await expect(page.locator('.project-facts time').first()).toHaveAttribute('datetime', /\d{4}-\d{2}-\d{2}T/);
      await expect(page.locator('.project-content > p')).toHaveCount(5);
      await expect(page.locator('.project-content > ul > li')).toHaveCount(5);
      await expect(page.getByRole('list', { name: 'Technology stack' })).toBeVisible();

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
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', `${title} | Trey Turner`);

      const internalLinks = await page.locator('main a[href^="/"]').evaluateAll(
        (links) => [...new Set(links.map((link) => link.getAttribute('href')!))],
      );
      for (const href of internalLinks) {
        expect((await request.get(href)).status(), `${href} on ${id}`).toBeLessThan(400);
      }
    });
  }

  test('renders multiple repository links and omits absent optional fields', async ({ page }) => {
    await page.goto('/projects/wled-builds');
    const links = page.getByRole('list', { name: 'Project links' });
    await expect(links.getByRole('link', { name: 'Repository 1', exact: true })).toHaveAttribute('href', 'https://github.com/treyturner/wled-builds');
    await expect(links.getByRole('link', { name: 'Repository 2', exact: true })).toHaveAttribute('href', 'https://github.com/treyturner/wled-mm-builds');
    await expect(links.getByRole('link', { name: 'Visit project' })).toHaveCount(0);
    await expect(page.locator('.project-featured-image')).toHaveCount(0);
    await expect(page.locator('.project-facts dt')).toHaveText(['Goal', 'My role', 'Started']);
  });

  test('renders a single repository and live link with the supplied dates', async ({ page }) => {
    await page.goto('/projects/code-doodles');
    const links = page.getByRole('list', { name: 'Project links' });
    await expect(links.getByRole('link', { name: 'Repository', exact: true })).toHaveAttribute('href', 'https://github.com/treyturner/codedoodl.es/tree/feat/containerize');
    await expect(links.getByRole('link', { name: 'Visit project', exact: true })).toHaveAttribute('href', 'https://doodles.treyturner.info');
    await expect(page.locator('.project-facts time')).toHaveText(['April 27, 2026', 'April 27, 2026']);
    await expect(page.locator('.project-facts dt')).toContainText(['Started', 'Ended']);
  });

  test('renders the optional featured image without inventing a repository link', async ({ page }) => {
    await page.goto('/projects/patreage');
    const image = page.locator('.project-featured-image');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('width', /^[1-9]\d*$/);
    await expect(image).toHaveAttribute('height', /^[1-9]\d*$/);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(
      (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
    )).toBe(true);
    await expect(page.locator('.project-links a')).toHaveCount(1);
    await expect(page.locator('.project-links a')).toHaveAttribute('href', 'https://patreon-verification.treyturner.info');
  });
});

for (const width of [1280, 820, 390, 320]) {
  test.describe(`Project card layout at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('keeps the title beside its logo and the status at the bottom right', async ({ page }) => {
      await page.goto('/projects');
      const cards = page.locator('.project-card-link');
      await expect(cards.first()).toBeVisible();
      for (const card of await cards.all()) {
        const header = card.locator('.project-card-header');
        const footer = card.locator('.project-card-footer');
        await expect(header.locator('.project-card-title')).toHaveCount(1);
        await expect(header.locator('.project-status')).toHaveCount(0);
        await expect(footer.locator('.project-card-more')).toHaveCount(1);
        await expect(footer.locator('.project-status')).toHaveCount(1);
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
        const statusBox = (await footer.locator('.project-status').boundingBox())!;
        expect(Math.abs(moreBox.x - footerBox.x)).toBeLessThan(1);
        expect(statusBox.x).toBeGreaterThan(moreBox.x + moreBox.width);
        expect(Math.abs(statusBox.x + statusBox.width - footerBox.x - footerBox.width)).toBeLessThan(1);
        expect(Math.abs(statusBox.y + statusBox.height / 2 - moreBox.y - moreBox.height / 2)).toBeLessThan(1);

        const contentBottom = await card.evaluate((element) => {
          const style = getComputedStyle(element);
          return element.getBoundingClientRect().bottom - parseFloat(style.paddingBottom) - parseFloat(style.borderBottomWidth);
        });
        expect(Math.abs(footerBox.y + footerBox.height - contentBottom)).toBeLessThan(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}

test.describe('Projects on small screens', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('cards and full articles fit the viewport in both themes', async ({ page }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      for (const path of ['/projects', '/projects/wled-builds', '/projects/patreage']) {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    }
  });
});
