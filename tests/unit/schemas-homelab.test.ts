import { describe, it, expect } from 'vitest';
import { homelabSchema, formatHomelabDate } from '../../src/schemas/homelab';

describe('homelabSchema', () => {
  const validData = {
    title: 'Proxmox Cluster Setup',
    date: '2024-08-15',
    description: 'Building a three-node Proxmox cluster.',
    tags: ['proxmox', 'virtualization'],
    category: 'compute',
  };

  it('accepts valid homelab frontmatter', () => {
    const result = homelabSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('coerces date strings to Date objects', () => {
    const result = homelabSchema.parse(validData);
    expect(result.date).toBeInstanceOf(Date);
  });

  it('rejects empty title', () => {
    const result = homelabSchema.safeParse({ ...validData, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = homelabSchema.safeParse({ ...validData, description: '' });
    expect(result.success).toBe(false);
  });

  it('defaults draft to false', () => {
    const result = homelabSchema.parse(validData);
    expect(result.draft).toBe(false);
  });

  it('accepts explicit draft value', () => {
    const result = homelabSchema.parse({ ...validData, draft: true });
    expect(result.draft).toBe(true);
  });

  it('defaults tags to empty array', () => {
    const data = { title: validData.title, date: validData.date, description: validData.description, category: validData.category };
    const result = homelabSchema.parse(data);
    expect(result.tags).toEqual([]);
  });

  it('rejects empty tag strings', () => {
    const result = homelabSchema.safeParse({ ...validData, tags: [''] });
    expect(result.success).toBe(false);
  });

  it('defaults category to other', () => {
    const data = { title: validData.title, date: validData.date, description: validData.description, tags: validData.tags };
    const result = homelabSchema.parse(data);
    expect(result.category).toBe('other');
  });

  it('accepts all valid category values', () => {
    const categories = ['networking', 'compute', 'storage', 'automation', 'monitoring', 'other'] as const;
    for (const category of categories) {
      const result = homelabSchema.safeParse({ ...validData, category });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const result = homelabSchema.safeParse({ ...validData, category: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const result = homelabSchema.safeParse({ date: validData.date, description: validData.description });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = homelabSchema.safeParse({ title: validData.title, date: validData.date });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = homelabSchema.safeParse({ title: validData.title, description: validData.description });
    expect(result.success).toBe(false);
  });
});

describe('formatHomelabDate', () => {
  it('formats a date with month, day, year, time, and timezone', () => {
    // UTC 15:00 = 10:00am CDT (summer)
    const date = new Date('2024-08-15T15:00:00.000Z');
    expect(formatHomelabDate(date)).toMatch(/^August 15, 2024, \d+:\d{2}[ap]m C[SD]T$/);
  });

  it('formats January correctly', () => {
    // UTC 18:00 = noon CST (winter)
    const date = new Date('2024-01-15T18:00:00.000Z');
    expect(formatHomelabDate(date)).toContain('January 15, 2024');
  });

  it('formats December correctly', () => {
    // UTC 18:00 = noon CST (winter)
    const date = new Date('2024-12-31T18:00:00.000Z');
    expect(formatHomelabDate(date)).toContain('December 31, 2024');
  });

  it('uses lowercase am/pm and comma separator', () => {
    const date = new Date('2024-08-15T15:00:00.000Z');
    const formatted = formatHomelabDate(date);
    const commaCount = formatted.split(',').length - 1;
    expect(commaCount).toEqual(2);
    expect(formatted).toMatch(/[ap]m/);
    expect(formatted).not.toMatch(/[AP]M/);
  });
});
