import { describe, it, expect } from 'vitest';
import { blogSchema, formatBlogDate } from '../../src/schemas/blog';

describe('blogSchema', () => {
  const validPost = {
    title: 'Test Post',
    date: '2024-06-15',
    description: 'A test blog post.',
    draft: false,
    tags: ['testing', 'astro'],
  };

  it('accepts a valid blog post', () => {
    const result = blogSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it('coerces date strings to Date objects', () => {
    const result = blogSchema.parse(validPost);
    expect(result.date).toBeInstanceOf(Date);
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
  it('formats a date in long US format', () => {
    const date = new Date('2024-06-15T00:00:00Z');
    const formatted = formatBlogDate(date);
    expect(formatted).toContain('June');
    expect(formatted).toContain('2024');
    expect(formatted).toContain('15');
  });

  it('formats January correctly', () => {
    const date = new Date('2023-01-01T00:00:00Z');
    const formatted = formatBlogDate(date);
    expect(formatted).toContain('January');
    expect(formatted).toContain('2023');
  });

  it('formats December correctly', () => {
    const date = new Date('2025-12-25T00:00:00Z');
    const formatted = formatBlogDate(date);
    expect(formatted).toContain('December');
    expect(formatted).toContain('2025');
  });
});
