import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readProjectContent } from '../helpers/project-content';

let directory: string;

beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'project-content-test-')); });
afterEach(() => { rmSync(directory, { recursive: true, force: true }); });

function writeProject(file: string, overrides: Record<string, unknown> = {}, body = '') {
  const frontmatter = {
    title: file,
    role: 'solo-dev',
    goal: 'Test content discovery.',
    description: 'A dynamically discovered project.',
    status: 'concept',
    startDate: '2026-01-01',
    draft: false,
    ...overrides,
  };
  const path = join(directory, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `---\n${JSON.stringify(frontmatter)}\n---\n${body}`);
}

describe('project browser-test content', () => {
  it('discovers new and nested MDX entries while ignoring other files', () => {
    writeProject('first.mdx');
    writeProject('nested/second.mdx');
    writeProject('ignored.txt');
    expect(readProjectContent(directory).publishedProjects.map(({ id }) => id)).toEqual(['first', 'nested/second']);
    writeProject('new.mdx');
    expect(readProjectContent(directory).publishedProjects.map(({ id }) => id)).toContain('new');
  });

  it('uses draft frontmatter as the only publishing switch', () => {
    writeProject('project.mdx', { draft: true });
    expect(readProjectContent(directory).publishedProjects).toEqual([]);
    expect(readProjectContent(directory).draftProjects.map(({ id }) => id)).toEqual(['project']);
    writeProject('project.mdx', { draft: false });
    expect(readProjectContent(directory).publishedProjects.map(({ id }) => id)).toEqual(['project']);
    expect(readProjectContent(directory).draftProjects).toEqual([]);
  });

  it('sorts by display order, then title, then ID', () => {
    writeProject('last.mdx', { displayOrder: 2, title: 'A' });
    writeProject('second.mdx', { title: 'Same' });
    writeProject('first.mdx', { title: 'Same' });
    writeProject('alpha.mdx', { title: 'Alpha' });
    writeProject('draft.mdx', { title: 'A', draft: true });
    expect(readProjectContent(directory).publishedProjects.map(({ id }) => id))
      .toEqual(['alpha', 'first', 'second', 'last']);
  });

  it('preserves optional fields, defaults, and arbitrary or empty bodies', () => {
    writeProject('empty.mdx');
    writeProject('article.mdx', { logoImage: 'logo.png', endDate: '2026-02-01' }, '# Heading\n\nOne paragraph.');
    const { publishedProjects } = readProjectContent(directory);
    expect(publishedProjects[0]).toMatchObject({
      id: 'article', logoImage: '/src/assets/logos/projects/logo.png',
      body: '# Heading\n\nOne paragraph.', endDate: new Date('2026-02-01T12:00:00Z'),
    });
    expect(publishedProjects[1]).toMatchObject({ id: 'empty', body: '', displayOrder: 0, technologyStack: [] });
    expect(publishedProjects[1].repositoryUrls).toBeUndefined();
  });

  it('supports explicit slugs and nested index routes', () => {
    writeProject('entry.mdx', { slug: 'custom/route' });
    writeProject('nested/index.mdx');
    expect(readProjectContent(directory).publishedProjects.map(({ id }) => id)).toEqual(['custom/route', 'nested']);
  });

  it('handles an empty collection', () => {
    expect(readProjectContent(directory)).toEqual({ publishedProjects: [], draftProjects: [] });
  });

  it('rejects invalid frontmatter instead of guessing publishing state', () => {
    writeProject('invalid.mdx', { draft: 'false' });
    expect(() => readProjectContent(directory)).toThrow();
  });
});
