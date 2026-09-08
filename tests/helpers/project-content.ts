import { globSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from 'astro/markdown';
import { z } from 'astro/zod';
import { createProjectSchema } from '../../src/schemas/projects';

// Validate frontmatter without invoking Astro's image pipeline; browser tests check image loading.
const schema = createProjectSchema(z.string().min(1));

export function readProjectContent(directory = fileURLToPath(new URL('../../src/content/projects/', import.meta.url))) {
  const projects = globSync('**/*.mdx', { cwd: directory }).map((file) => {
    const { frontmatter, content } = parseFrontmatter(readFileSync(join(directory, file), 'utf8'));
    return {
      ...schema.parse(frontmatter),
      id: frontmatter.slug
        ? String(frontmatter.slug)
        : file.slice(0, -4).split(sep).join('/').replace(/\/index$/, ''),
      body: content.trim(),
    };
  });

  // Keep the E2E expectation independent from getPublishedProjects, which the site uses.
  const publishedProjects = projects.filter(({ draft }) => !draft).sort((a, b) =>
    a.displayOrder - b.displayOrder
    || a.title.localeCompare(b.title, 'en')
    || a.id.localeCompare(b.id, 'en'),
  );
  const draftProjects = projects.filter(({ draft }) => draft);
  return { publishedProjects, draftProjects };
}
