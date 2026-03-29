import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { blogSchema } from './schemas/blog';
import { experienceSchema } from './schemas/experience';
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
  recommendations: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/recommendations' }),
    schema: recommendationSchema,
  }),
};
