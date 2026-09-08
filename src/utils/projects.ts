import type { ProjectFrontmatter } from '../schemas/projects';
import { filterDrafts } from './content';

export const projectStatusLabels: Record<ProjectFrontmatter['status'], string> = {
  concept: 'Concept',
  planning: 'Planning',
  'on-hold': 'On hold',
  'pre-alpha': 'Pre-alpha',
  'pre-release': 'Pre-release',
  active: 'Active',
  complete: 'Complete',
  archived: 'Archived',
};

export const projectRoleLabels: Record<ProjectFrontmatter['role'], string> = {
  'solo-dev': 'Solo developer',
  contributor: 'Contributor',
  collaborator: 'Collaborator',
  member: 'Member',
};

interface ProjectSummary {
  id: string;
  data: Pick<ProjectFrontmatter, 'draft' | 'displayOrder' | 'title'>;
}

/** Keep the index and detail routes limited to published projects, including in development. */
export function getPublishedProjects<E extends ProjectSummary>(entries: E[]): E[] {
  return filterDrafts(entries).sort((a, b) =>
    a.data.displayOrder - b.data.displayOrder
    || a.data.title.localeCompare(b.data.title, 'en')
    || a.id.localeCompare(b.id, 'en')
  );
}
