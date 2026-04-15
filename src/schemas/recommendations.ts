import { z } from "astro/zod";
import { yyyyMmDdToDateSchema, formatYearMonthDay } from "./common";

export const roleSchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  relationship: z.string().min(1),
});

export const recommendationSchema = z.object({
  author: z.string().min(1),
  roles: z.array(roleSchema).min(1),
  text: z.string().min(10),
  date: yyyyMmDdToDateSchema,
});

export type Recommendation = z.infer<typeof recommendationSchema>;

export function formatRecommendationDate(date: Date): string {
  return formatYearMonthDay(date);
}
