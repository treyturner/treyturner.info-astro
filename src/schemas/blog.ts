import { z } from 'zod';
import { formatDatetime } from './common';

export const blogSchema = z.object({
  title: z.string().min(1),
  date: z.iso.datetime().pipe(z.coerce.date()),
  description: z.string().min(1),
  draft: z.boolean().default(false),
  tags: z.array(z.string().min(1)).default([]),
});

export type BlogFrontmatter = z.infer<typeof blogSchema>;

export function formatBlogDate(date: Date): string {
  return formatDatetime(date);
}
