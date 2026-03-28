import { z } from 'zod';

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format')
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
