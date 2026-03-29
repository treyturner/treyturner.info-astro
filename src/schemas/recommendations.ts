import { z } from 'zod';

export const recommendationSchema = z.object({
  author: z.string().min(1),
  role: z.string().min(1),
  company: z.string().min(1),
  relationship: z.string().min(1),
  text: z.string().min(10),
  date: z.string().regex(/^(20[0-7]\d)-(0[1-9]|1[0-2])$/, 'Must be YYYY-MM with year 2000–2079 and month 01–12'),
  order: z.number().int().nonnegative(),
});

export type Recommendation = z.infer<typeof recommendationSchema>;
