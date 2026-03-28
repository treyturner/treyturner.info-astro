import { z } from 'zod';

export const recommendationSchema = z.object({
  author: z.string().min(1),
  role: z.string().min(1),
  company: z.string().min(1),
  relationship: z.string().min(1),
  text: z.string().min(10),
  date: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  order: z.number().int().nonnegative(),
});

export type Recommendation = z.infer<typeof recommendationSchema>;
