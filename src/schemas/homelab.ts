import { z } from 'zod';

export const homelabSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  description: z.string().min(1),
  draft: z.boolean().default(false),
  tags: z.array(z.string().min(1)).default([]),
  category: z.enum(['networking', 'compute', 'storage', 'automation', 'monitoring', 'other']).default('other'),
});

export type HomelabFrontmatter = z.infer<typeof homelabSchema>;

export function formatHomelabDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
