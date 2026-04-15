import { z } from "astro/zod";
import { yyyyMmToDateSchema, formatYearMonth } from "./common";

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: yyyyMmToDateSchema,
  endDate: yyyyMmToDateSchema.optional(),
  description: z.string().min(1),
  highlights: z.array(z.string().min(1)).min(1),
});

export type Experience = z.infer<typeof experienceSchema>;

export function formatDateRange(startDate: Date, endDate?: Date): string {
  return `${formatYearMonth(startDate)} – ${endDate ? formatYearMonth(endDate) : 'Present'}`;
}
