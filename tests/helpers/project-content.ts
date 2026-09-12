import { globSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from 'astro/markdown';
import { z } from 'astro/zod';
import { createProjectSchema } from '../../src/schemas/projects';

// Validate frontmatter without invoking Astro's image pipeline; browser tests check image loading.
const schema = createProjectSchema(z.string().min(1));

export function readProjectContent(directory = fileURLToPath(new URL('../../src/content/projects/', import.meta.url))) {
  // Sort the source files independently of the site's getPublishedProjects utility.
  const files = globSync('**/*.mdx', { cwd: directory }).sort((a, b) => a.localeCompare(b, 'en'));
  const projects = files.map((file) => {
    const { frontmatter, content } = parseFrontmatter(readFileSync(join(directory, file), 'utf8'));
    return {
      ...schema.parse(frontmatter),
      id: frontmatter.slug
        ? String(frontmatter.slug)
        : file.slice(0, -4).split(sep).join('/').replace(/(^|\/)\d+-/g, '$1').replace(/\/index$/, ''),
      body: content.trim(),
    };
  });

  const publishedProjects = projects.filter(({ draft }) => !draft);
  const draftProjects = projects.filter(({ draft }) => draft);
  return { publishedProjects, draftProjects };
}
