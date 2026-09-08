import { reference } from 'astro:content';
import { z } from "astro/zod";
import { yyyyMmDdToDateSchema, formatYearMonthDay } from "./common";

export const roleSchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  relationship: z.string().min(1),
  logo: z.string().regex(/^.+\.(jpg|svg|png)$/, "Must be a filename ending in .jpg, .svg, or .png"),
  experiences: z.array(
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be an experience entry ID')
      .pipe(reference('experience')),
  ).default([]).refine(
    (entries) => new Set(entries.map((entry) => entry.id)).size === entries.length,
    'Experience references must be unique within a role',
  ),
});

export const recommendationSchema = z.object({
  author: z.string().min(1),
  roles: z.array(roleSchema).min(1),
  text: z.string().min(10),
  date: yyyyMmDdToDateSchema,
  linkedIn: z.string().regex(
    /^https:\/\/www\.linkedin\.com\/in\/.+$/,
    "Must be a fully qualified HTTPS URL like 'https://www.linkedin.com/in/some-username'"
  ),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

export function formatRecommendationDate(date: Date): string {
  return formatYearMonthDay(date);
}
