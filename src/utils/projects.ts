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

/** Label a schema-validated URL without discarding its branch, query, or fragment. */
export function getRepositoryLink(href: string) {
  const url = new URL(href);
  const [owner, repository] = url.pathname.split('/').filter(Boolean);
  const isGitHub = ['github.com', 'www.github.com'].includes(url.hostname);
  if (!isGitHub || !owner || !repository) return { href, label: href, isGitHub: false };

  return { href, label: `${owner}/${repository.replace(/\.git$/i, '')}`, isGitHub: true };
}

/** Filename prefixes control presentation, not permanent project URLs. Explicit slugs stay intact. */
export function getProjectId({ entry, data }: { entry: string; data: Record<string, unknown> }): string {
  if (data.slug) return String(data.slug);
  return entry.replace(/\\/g, '/').replace(/(^|\/)\d+-/g, '$1').replace(/\.mdx$/, '').replace(/\/index$/, '');
}

interface ProjectSummary {
  id: string;
  filePath?: string;
  data: Pick<ProjectFrontmatter, 'draft'>;
}

/** Publish in alphabetical source-path order, independent of titles and stable route IDs. */
export function getPublishedProjects<E extends ProjectSummary>(entries: E[]): E[] {
  return filterDrafts(entries).sort((a, b) =>
    (a.filePath ?? a.id).localeCompare(b.filePath ?? b.id, 'en')
  );
}
