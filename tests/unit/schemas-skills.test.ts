import { describe, it, expect } from 'vitest';
import { skillCategorySchema, skillsDataSchema } from '../../src/schemas/skills';
import skillsData from '../../src/data/skills.json';

describe('skillCategorySchema', () => {
  it('accepts a valid category', () => {
    const result = skillCategorySchema.safeParse({
      name: 'Test Automation',
      skills: ['Selenium', 'Playwright'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = skillCategorySchema.safeParse({ name: '', skills: ['Selenium'] });
    expect(result.success).toBe(false);
  });

  it('rejects empty skills array', () => {
    const result = skillCategorySchema.safeParse({ name: 'Testing', skills: [] });
    expect(result.success).toBe(false);
  });

  it('rejects skills with empty strings', () => {
    const result = skillCategorySchema.safeParse({ name: 'Testing', skills: [''] });
    expect(result.success).toBe(false);
  });
});

describe('skillsDataSchema', () => {
  it('accepts valid skills data', () => {
    const result = skillsDataSchema.safeParse({
      categories: [{ name: 'Testing', skills: ['Vitest'] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty categories array', () => {
    const result = skillsDataSchema.safeParse({ categories: [] });
    expect(result.success).toBe(false);
  });

  it('rejects missing categories field', () => {
    const result = skillsDataSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('skills.json data validation', () => {
  it('passes schema validation', () => {
    const result = skillsDataSchema.safeParse(skillsData);
    expect(result.success).toBe(true);
  });

  it('has at least one category', () => {
    expect(skillsData.categories.length).toBeGreaterThan(0);
  });

  it('every category has a non-empty name', () => {
    for (const cat of skillsData.categories) {
      expect(cat.name.length).toBeGreaterThan(0);
    }
  });

  it('every category has at least one skill', () => {
    for (const cat of skillsData.categories) {
      expect(cat.skills.length).toBeGreaterThan(0);
    }
  });
});
