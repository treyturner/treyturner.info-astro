import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { blogSchema } from './schemas/blog';
import { experienceSchema } from './schemas/experience';
import { homelabSchema } from './schemas/homelab';
import { projectSchema } from './schemas/projects';
import { recommendationSchema } from './schemas/recommendations';

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
    schema: blogSchema,
  }),
  experience: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/experience' }),
    schema: experienceSchema,
  }),
  homelab: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './src/content/homelab' }),
    schema: homelabSchema,
  }),
  projects: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
    schema: projectSchema,
  }),
  recommendations: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/recommendations' }),
    // Roles reference experience entries; both pages derive their links from these references.
    schema: recommendationSchema,
  }),
};
