import { describe, expect, it } from 'vitest';
import { getPublishedProjects, projectRoleLabels, projectStatusLabels } from '../../src/utils/projects';

const entry = (id: string, displayOrder = 0, title = id, draft = false) => ({
  id,
  data: { title, displayOrder, draft },
});

describe('getPublishedProjects', () => {
  it('excludes drafts even when they would otherwise sort first', () => {
    const published = entry('published', 2);
    expect(getPublishedProjects([entry('draft', 0, 'Draft', true), published])).toEqual([published]);
  });

  it('sorts by display order before title', () => {
    const first = entry('zebra', 0);
    const second = entry('alpha', 1);
    const third = entry('beta', 2);
    expect(getPublishedProjects([third, second, first])).toEqual([first, second, third]);
  });

  it('sorts equal display orders by title', () => {
    const first = entry('z', 0, 'Alpha');
    const second = entry('a', 0, 'Beta');
    expect(getPublishedProjects([second, first])).toEqual([first, second]);
  });

  it('uses the ID to break ties between identical titles', () => {
    const first = entry('first', 0, 'Same title');
    const second = entry('second', 0, 'Same title');
    expect(getPublishedProjects([second, first])).toEqual([first, second]);
  });

  it('handles completely equal sort keys', () => {
    const first = entry('same');
    const second = entry('same');
    expect(getPublishedProjects([first, second])).toEqual([first, second]);
  });

  it('does not mutate the source collection or lose entry data', () => {
    const first = { ...entry('first'), body: 'Full MDX content' };
    const second = entry('second', 1);
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
    expect(getPublishedProjects([entry('draft', 0, 'Draft', true)])).toEqual([]);
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
