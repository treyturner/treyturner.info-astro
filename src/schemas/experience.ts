import { z } from 'zod';

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().regex(/^(199[5-9]|20[0-7]\d)-(0[1-9]|1[0-2])$/, 'Must be YYYY-MM with year 1995–2079 and month 01–12'),
  endDate: z
    .string()
    .regex(/^(199[5-9]|20[0-7]\d)-(0[1-9]|1[0-2])$/, 'Must be YYYY-MM with year 1995–2079 and month 01–12')
    .optional(),
  description: z.string().min(1),
  highlights: z.array(z.string().min(1)).min(1),
  order: z.number().int().nonnegative(),
});

export type Experience = z.infer<typeof experienceSchema>;

export function formatDateRange(startDate: string, endDate?: string): string {
  const format = (ym: string) => {
    const [year, month] = ym.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  return `${format(startDate)} – ${endDate ? format(endDate) : 'Present'}`;
}
