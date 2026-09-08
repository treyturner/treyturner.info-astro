import { describe, expect, it, vi } from 'vitest';
import { z } from 'astro/zod';
import {
  createProjectSchema,
  projectRoles,
  projectSchema as createAstroProjectSchema,
  projectStatuses,
} from '../../src/schemas/projects';

const projectSchema = createProjectSchema(z.string().min(1));

const validProject = {
  title: 'Test Results Explorer',
  role: 'solo-dev',
  goal: 'Make automated test failures easier to understand.',
  description: 'A local-first interface for exploring and comparing test runs.',
  status: 'active' as const,
  repositoryUrls: ['https://github.com/treyturner/test-results-explorer'],
  liveUrl: 'https://example.com/projects/test-results-explorer',
  technologyStack: ['TypeScript', 'Astro'],
  featuredImage: './test-results-explorer.png',
  displayOrder: 1,
  startDate: '2025-02-01',
  draft: false
};

describe('projectSchema', () => {
  it("builds the schema from Astro's image context", () => {
    const image = vi.fn(() => z.string().min(1).transform((src) => ({ src })));
    const schema = createAstroProjectSchema({
      image,
    } as unknown as Parameters<typeof createAstroProjectSchema>[0]);

    expect(image).toHaveBeenCalledOnce();
    const result = schema.parse({ ...validProject, logoImage: 'project-logo.png' });
    expect(result.logoImage).toEqual({ src: '/src/assets/logos/projects/project-logo.png' });
    expect(result.featuredImage).toEqual({ src: validProject.featuredImage });
  });

  it('accepts a complete project entry', () => {
    const result = projectSchema.parse(validProject);
    expect(result.repositoryUrls).toEqual(validProject.repositoryUrls);
  });

  it('accepts every supported project role', () => {
    for (const role of projectRoles) {
      expect(projectSchema.safeParse({ ...validProject, role }).success).toBe(true);
    }
  });

  it('accepts every supported project status', () => {
    for (const status of projectStatuses) {
      expect(projectSchema.safeParse({ ...validProject, status }).success).toBe(true);
    }
  });

  it('requires title, goal, description, status, and start date', () => {
    for (const field of ['title', 'goal', 'description', 'status', 'startDate']) {
      const project = { ...validProject } as Record<string, unknown>;
      delete project[field];
      expect(projectSchema.safeParse(project).success).toBe(false);
    }
  });

  it('defaults optional collections and publishing fields', () => {
    const result = projectSchema.parse({
      title: validProject.title,
      role: 'collaborator',
      goal: validProject.goal,
      description: validProject.description,
      status: validProject.status,
      startDate: validProject.startDate,
      draft: false
    });

    expect(result.technologyStack).toEqual([]);
    expect(result.displayOrder).toBe(0);
    expect(result.repositoryUrls).toBeUndefined();
  });

  it('coerces project dates to Date objects', () => {
    const result = projectSchema.parse({ ...validProject, endDate: '2025-08-15' });
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it('rejects an end date before the start date', () => {
    const result = projectSchema.safeParse({ ...validProject, endDate: '2025-01-31' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed dates', () => {
    expect(projectSchema.safeParse({ ...validProject, startDate: 'February 2025' }).success).toBe(false);
  });

  it('accepts multiple repository URLs in order', () => {
    const repositoryUrls = [
      ...validProject.repositoryUrls,
      'https://github.com/treyturner/test-results-explorer-client',
    ];
    const result = projectSchema.parse({ ...validProject, repositoryUrls });
    expect(result.repositoryUrls).toEqual(repositoryUrls);
  });

  it('accepts an empty repository URL list', () => {
    expect(projectSchema.parse({ ...validProject, repositoryUrls: [] }).repositoryUrls).toEqual([]);
  });

  it.each(['', 'github', null, 42])('rejects invalid repository URL entries: %j', (invalidUrl) => {
    const result = projectSchema.safeParse({
      ...validProject,
      repositoryUrls: [...validProject.repositoryUrls, invalidUrl],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['repositoryUrls', 1]);
    }
  });

  it.each([validProject.repositoryUrls[0], null, 42, {}])(
    'rejects non-array repository URLs: %j',
    (repositoryUrls) => {
      expect(projectSchema.safeParse({ ...validProject, repositoryUrls }).success).toBe(false);
    },
  );

  it('rejects invalid live URLs', () => {
    expect(projectSchema.safeParse({ ...validProject, liveUrl: 'demo' }).success).toBe(false);
  });

  it('rejects negative or fractional display order values', () => {
    expect(projectSchema.safeParse({ ...validProject, displayOrder: -1 }).success).toBe(false);
    expect(projectSchema.safeParse({ ...validProject, displayOrder: 1.5 }).success).toBe(false);
  });

  it('rejects empty technology names and featured-image paths', () => {
    expect(projectSchema.safeParse({ ...validProject, technologyStack: [''] }).success).toBe(false);
    expect(projectSchema.safeParse({ ...validProject, featuredImage: '' }).success).toBe(false);
  });

  it('allows projects without a logo image', () => {
    expect(projectSchema.parse(validProject).logoImage).toBeUndefined();
  });

  it.each(['project-logo.png', 'project-logo.jpg', 'project-logo.svg'])(
    'resolves logo filename %s from the project logos directory',
    (logoImage) => {
      const result = projectSchema.parse({ ...validProject, logoImage });
      expect(result.logoImage).toBe(`/src/assets/logos/projects/${logoImage}`);
      expect(result.featuredImage).toBe(validProject.featuredImage);
    },
  );

  it.each([
    '',
    '   ',
    'project-logo',
    '.png',
    'project-logo.gif',
    'project-logo.PNG',
    './project-logo.png',
    '../project-logo.png',
    'nested/project-logo.png',
    'nested\\project-logo.png',
    'projects/project-logo.png',
    '../companies/company-logo.png',
    '/src/assets/logos/project-logo.png',
    '/src/assets/logos/projects/project-logo.png',
    '/src/assets/logos/companies/company-logo.png',
    'https://example.com/project-logo.png',
  ])('rejects invalid logo filename %j', (logoImage) => {
    const result = projectSchema.safeParse({ ...validProject, logoImage });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['logoImage']);
    }
  });

  it.each([null, 42, true, {}, []].map((logoImage) => ({ logoImage })))(
    'rejects non-string logo values: $logoImage',
    ({ logoImage }) => {
      expect(projectSchema.safeParse({ ...validProject, logoImage }).success).toBe(false);
    },
  );

  it('supports asynchronous image loading', async () => {
    const schema = createProjectSchema(z.string().transform(async (src) => ({ src })));
    const result = await schema.parseAsync({ ...validProject, logoImage: 'project-logo.png' });
    expect(result.logoImage).toEqual({ src: '/src/assets/logos/projects/project-logo.png' });
  });

  it('preserves image-loader validation errors for a logo', () => {
    const schema = createProjectSchema(
      z.string().refine((src) => src !== '/src/assets/logos/projects/missing.png', 'Image does not exist'),
    );
    const result = schema.safeParse({ ...validProject, logoImage: 'missing.png' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({ path: ['logoImage'], message: 'Image does not exist' }),
      ]);
    }
  });

  it('rejects missing draft status', () => {
    expect(projectSchema.safeParse({ ...validProject, draft: null }).success).toBe(false);
  });
});
