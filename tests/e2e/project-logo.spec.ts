import { test, expect, type Locator } from '@playwright/test';
import { readProjectContent } from '../helpers/project-content';

const { publishedProjects } = readProjectContent();
const astroProject = publishedProjects.find(({ logoImage }) => logoImage?.endsWith('/astro.svg'));

async function readLogoPixels(logo: Locator) {
  // Sample a screenshot, not a re-rendered SVG, to check the actual embedded image's theme.
  const png = (await logo.screenshot()).toString('base64');
  return logo.page().evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const sample = (x: number, y: number) => [...context.getImageData(
      Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1,
    ).data];
    return { mark: sample(0.5, 0.15), flame: sample(0.5, 0.8) };
  }, png);
}

for (const placement of ['card', 'detail'] as const) {
  test(`SVG ${placement} logos bypass the long-lived development image cache`, async ({ page, request }) => {
    const svgProjects = publishedProjects.filter(({ logoImage }) => logoImage?.endsWith('.svg'));
    test.skip(svgProjects.length === 0, 'No published project uses an SVG logo.');

    for (const { id } of svgProjects) {
      const path = `/projects/${id}`;
      await page.goto(placement === 'card' ? '/projects' : path);
      const logo = placement === 'card'
        ? page.locator(`.project-card-link[href="${path}"] .project-card-logo`)
        : page.locator('.project-logo');
      const src = await logo.getAttribute('src');
      expect(src).toBeTruthy();
      const url = new URL(src!, page.url());
      expect(url.pathname).not.toBe('/_image');
      expect(url.pathname).toMatch(/\.svg$/);
      await expect(logo).toHaveAttribute('width', /^[1-9]\d*$/);
      await expect(logo).toHaveAttribute('height', placement === 'card' ? '48' : '64');

      const response = await request.get(url.href);
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('image/svg+xml');
      // Production assets have content-hashed URLs; Vite's source URLs must revalidate.
      if (url.pathname.startsWith('/@fs/') || url.pathname.startsWith('/src/')) {
        expect(response.headers()['cache-control']).toMatch(/no-cache|no-store|max-age=0/);
      }
    }
  });

  for (const systemTheme of ['light', 'dark'] as const) {
    test(`Astro ${placement} logo follows the selected theme with a ${systemTheme} system preference`, async ({ page }) => {
      test.skip(!astroProject, 'No published project uses the Astro logo.');
      await page.emulateMedia({ colorScheme: systemTheme });
      const path = `/projects/${astroProject!.id}`;
      await page.goto(placement === 'card' ? '/projects' : path);
      const logo = placement === 'card'
        ? page.locator(`.project-card-link[href="${path}"] .project-card-logo`)
        : page.locator('.project-logo');
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

      let originalFlame: number[] | undefined;
      const opposite = systemTheme === 'light' ? 'dark' : 'light';
      for (const theme of [systemTheme, opposite, systemTheme]) {
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect.poll(async () => (await readLogoPixels(logo)).mark)
          .toEqual(theme === 'light' ? [30, 41, 59, 255] : [255, 255, 255, 255]);
        const { flame } = await readLogoPixels(logo);
        // Preserve the colored flame; filtering the entire image would change it too.
        expect(flame[0]).toBeGreaterThan(flame[1] + 50);
        expect(flame[3]).toBe(255);
        if (originalFlame) expect(flame).toEqual(originalFlame);
        else originalFlame = flame;
        await expect(logo).toHaveCSS('color-scheme', theme);
        await page.locator('#theme-toggle').click();
      }

      // A saved site preference must also override the OS preference on a fresh load.
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', opposite);
      await expect.poll(async () => (await readLogoPixels(logo)).mark)
        .toEqual(opposite === 'light' ? [30, 41, 59, 255] : [255, 255, 255, 255]);
    });
  }
}
