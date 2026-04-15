import { describe, it, expect } from 'vitest';
import { blogSchema, formatBlogDate } from '../../src/schemas/blog';

describe('blogSchema', () => {
  const validPost = {
    title: 'Test Post',
    date: '2026-04-14T08:12:35.123Z',
    description: 'A test blog post.',
    draft: false,
    tags: ['testing', 'astro'],
  };

  it('accepts a valid blog post', () => {
    const result = blogSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it('produces a Date object for the date field', () => {
    const result = blogSchema.parse(validPost);
    expect(result.date).toBeInstanceOf(Date);
  });

  it('rejects YYYY-MM date format', () => {
    const result = blogSchema.safeParse({ ...validPost, date: '2024-06' });
    expect(result.success).toBe(false);
  });

  it('rejects YYYY-MM-DD date format', () => {
    const result = blogSchema.safeParse({ ...validPost, date: '2024-06-01' });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const result = blogSchema.safeParse({ ...validPost, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = blogSchema.safeParse({ ...validPost, description: '' });
    expect(result.success).toBe(false);
  });

  it('defaults draft to false', () => {
    const noDraft = { title: validPost.title, date: validPost.date, description: validPost.description, tags: validPost.tags };
    const result = blogSchema.parse(noDraft);
    expect(result.draft).toBe(false);
  });

  it('defaults tags to empty array', () => {
    const noTags = { title: validPost.title, date: validPost.date, description: validPost.description };
    const result = blogSchema.parse(noTags);
    expect(result.tags).toEqual([]);
  });

  it('rejects empty tag strings', () => {
    const result = blogSchema.safeParse({ ...validPost, tags: [''] });
    expect(result.success).toBe(false);
  });

  it('accepts draft true', () => {
    const result = blogSchema.parse({ ...validPost, draft: true });
    expect(result.draft).toBe(true);
  });

  it('rejects invalid date', () => {
    const result = blogSchema.safeParse({ ...validPost, date: 'not-a-date' });
    expect(result.success).toBe(false);
  });
});

describe('formatBlogDate', () => {
  it('formats a date with month, day, year, time, and timezone', () => {
    // UTC noon on a summer date → stays in CDT range
    const date = new Date('2024-06-15T17:00:00.000Z'); // noon CDT
    const formatted = formatBlogDate(date);
    expect(formatted).toMatch(/^June 15, 2024, \d+:\d{2}[ap]m C[SD]T$/);
  });

  it('formats January correctly', () => {
    const date = new Date('2023-01-01T18:00:00.000Z'); // noon CST
    const formatted = formatBlogDate(date);
    expect(formatted).toContain('January');
    expect(formatted).toContain('2023');
  });

  it('formats December correctly', () => {
    const date = new Date('2025-12-25T18:00:00.000Z'); // noon CST
    const formatted = formatBlogDate(date);
    expect(formatted).toContain('December');
    expect(formatted).toContain('2025');
  });

  it('uses lowercase am/pm and comma separator', () => {
    const date = new Date('2024-06-15T17:00:00.000Z');
    const formatted = formatBlogDate(date);
    const commaCount = formatted.split(',').length - 1;
    expect(commaCount).toEqual(2);
    expect(formatted).toMatch(/[ap]m/);
    expect(formatted).not.toMatch(/[AP]M/);
  });
});
