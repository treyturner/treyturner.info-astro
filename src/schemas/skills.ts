import { z } from 'zod';

export const skillCategorySchema = z.object({
  name: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
});

export const skillsDataSchema = z.object({
  categories: z.array(skillCategorySchema).min(1),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillsData = z.infer<typeof skillsDataSchema>;
