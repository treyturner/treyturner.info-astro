import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { yyyyMmDdToDateSchema } from './common';

export const projectStatuses = [
  'concept',
  'planning',
  'on-hold',
  'pre-alpha',
  'pre-release',
  'active',
  'complete',
  'archived'
] as const;

export const projectRoles = [
  'solo-dev',
  'contributor',
  'collaborator',
  'member'
]

export function createProjectSchema<TImage extends z.ZodType>(imageSchema: TImage) {
  return z
    .object({
      title: z.string().min(1),
      role: z.enum(projectRoles),
      goal: z.string().min(1),
      description: z.string().min(1),
      status: z.enum(projectStatuses),
      repositoryUrls: z.array(z.url()).optional(),
      liveUrl: z.url().optional(),
      technologyStack: z.array(z.string().min(1)).default([]),
      featuredImage: imageSchema.optional(),
      logoImage: z.string()
        .regex(/^[^/\\]+\.(jpg|svg|png)$/, 'Must be a filename ending in .jpg, .svg, or .png')
        .pipe(z.preprocess((filename) => `/src/assets/logos/projects/${filename}`, imageSchema))
        .optional(),
      displayOrder: z.number().int().nonnegative().default(0),
      startDate: yyyyMmDdToDateSchema,
      endDate: yyyyMmDdToDateSchema.optional(),
      draft: z.boolean(),
    })
    .refine((project) => !project.endDate || project.endDate >= project.startDate, {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    });
}

export const projectSchema = ({ image }: SchemaContext) => createProjectSchema(image());

export type ProjectFrontmatter = z.infer<ReturnType<typeof projectSchema>>;
