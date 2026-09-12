import { describe, expect, it } from 'vitest';
import { getProjectId, getPublishedProjects, getRepositoryLink, projectRoleLabels, projectStatusLabels } from '../../src/utils/projects';

const entry = (id: string, filePath = id, title = id, draft = false) => ({
  id,
  filePath,
  data: { title, draft },
});

describe('getProjectId', () => {
  it.each([
    ['04-mister-deskflow.mdx', 'mister-deskflow'],
    ['02-mister-deskflow.mdx', 'mister-deskflow'],
    ['100-project.mdx', 'project'],
    ['example-project.mdx', 'example-project'],
    ['00-group/02-project.mdx', 'group/project'],
    ['00-group/02-index.mdx', 'group'],
    ['nested/index.mdx', 'nested'],
    ['00-group\\02-project.mdx', 'group/project'],
    ['2026project.mdx', '2026project'],
    ['project-01.mdx', 'project-01'],
  ])('derives the stable route for %s', (path, id) => {
    expect(getProjectId({ entry: path, data: {} })).toBe(id);
  });

  it('preserves explicit slugs, including their numeric prefixes', () => {
    expect(getProjectId({ entry: '00-project.mdx', data: { slug: '2026-custom/route' } }))
      .toBe('2026-custom/route');
  });

  it('matches Astro slug coercion and empty-slug fallback', () => {
    expect(getProjectId({ entry: '00-project.mdx', data: { slug: 42 } })).toBe('42');
    expect(getProjectId({ entry: '00-project.mdx', data: { slug: '' } })).toBe('project');
  });
});

describe('getPublishedProjects', () => {
  it('excludes drafts even when they would otherwise sort first', () => {
    const published = entry('published', '01-published.mdx');
    expect(getPublishedProjects([entry('draft', '00-draft.mdx', 'Draft', true), published])).toEqual([published]);
  });

  it('sorts by zero-padded filenames rather than titles or stable route IDs', () => {
    const first = entry('zebra', '00-zebra.mdx', 'Zebra');
    const second = entry('alpha', '01-alpha.mdx', 'Alpha');
    const third = entry('beta', '10-beta.mdx', 'Beta');
    expect(getPublishedProjects([third, second, first])).toEqual([first, second, third]);
  });

  it('sorts unprefixed filenames independently of explicit slugs and titles', () => {
    const first = entry('z', 'alpha.mdx', 'Zebra');
    const second = entry('a', 'zebra.mdx', 'Alpha');
    expect(getPublishedProjects([second, first])).toEqual([first, second]);
  });

  it('uses alphabetical rather than numeric sorting for unpadded prefixes', () => {
    const first = entry('first', '10-first.mdx');
    const second = entry('second', '2-second.mdx');
    expect(getPublishedProjects([second, first])).toEqual([first, second]);
  });

  it('falls back to route IDs when source paths are unavailable', () => {
    const first = { id: 'alpha', data: { draft: false } };
    const second = { id: 'beta', data: { draft: false } };
    expect(getPublishedProjects([second, first])).toEqual([first, second]);
  });

  it('handles completely equal sort keys', () => {
    const first = entry('same');
    const second = entry('same');
    expect(getPublishedProjects([first, second])).toEqual([first, second]);
  });

  it('does not mutate the source collection or lose entry data', () => {
    const first = { ...entry('first'), body: 'Full MDX content' };
    const second = entry('second');
    const entries = [second, first];
    const result = getPublishedProjects(entries);
    expect(entries).toEqual([second, first]);
    expect(result).not.toBe(entries);
    expect(result[0]).toBe(first);
  });

  it('returns an empty list when there are no projects', () => {
    expect(getPublishedProjects([])).toEqual([]);
  });

  it('returns an empty list when every project is a draft', () => {
    expect(getPublishedProjects([entry('draft', '00-draft.mdx', 'Draft', true)])).toEqual([]);
  });
});

describe('project labels', () => {
  it('provides readable labels for every project status', () => {
    expect(projectStatusLabels).toEqual({
      concept: 'Concept',
      planning: 'Planning',
      'on-hold': 'On hold',
      'pre-alpha': 'Pre-alpha',
      'pre-release': 'Pre-release',
      active: 'Active',
      complete: 'Complete',
      archived: 'Archived',
    });
  });

  it('provides readable labels for every project role', () => {
    expect(projectRoleLabels).toEqual({
      'solo-dev': 'Solo developer',
      contributor: 'Contributor',
      collaborator: 'Collaborator',
      member: 'Member',
    });
  });
});

describe('getRepositoryLink', () => {
  it.each([
    ['https://github.com/beetbox/beets', 'beetbox/beets'],
    ['https://github.com/Samik081/beets-beatport4', 'Samik081/beets-beatport4'],
    ['https://github.com/treyturner/codedoodl.es/tree/feat/containerize', 'treyturner/codedoodl.es'],
    ['https://github.com/owner/repo/blob/main/README.md?plain=1#readme', 'owner/repo'],
    ['https://github.com/owner/repo/', 'owner/repo'],
    ['https://github.com/owner/repo.git', 'owner/repo'],
    ['https://www.GitHub.com/owner/repo', 'owner/repo'],
  ])('labels %s without changing its destination', (href, label) => {
    expect(getRepositoryLink(href)).toEqual({ href, label, isGitHub: true });
  });

  it.each([
    'https://gitlab.com/group/subgroup/repo',
    'https://git.example.com/owner/repo',
    'https://github.com.example.com/owner/repo',
    'https://github.com/',
    'https://github.com/owner',
  ])('keeps an unrecognized repository URL readable without GitHub branding: %s', (href) => {
    expect(getRepositoryLink(href)).toEqual({ href, label: href, isGitHub: false });
  });
});
