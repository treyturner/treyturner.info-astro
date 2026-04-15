import { describe, it, expect } from 'vitest';
import { recommendationSchema, formatRecommendationDate } from '../../src/schemas/recommendations';

const validEntry = {
  author: 'Sarah Chen',
  roles: [
    {
      role: 'VP of Engineering',
      company: 'Acme Corp',
      relationship: 'Direct manager',
    }
  ],
  text: 'An outstanding quality engineer who transformed our practices.',
  date: '2024-08-15',
};

describe('recommendationSchema', () => {
  it('accepts a valid entry', () => {
    const result = recommendationSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('produces a Date object for the date field', () => {
    const result = recommendationSchema.parse(validEntry);
    expect(result.date).toBeInstanceOf(Date);
  });

  it('rejects empty author', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, author: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty roles', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, ...{ roles: [] }});
    expect(result.success).toBe(false);
  })

  it('rejects empty role', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, ...{ roles: [{ role: '' }] }});
    expect(result.success).toBe(false);
  });

  it('rejects empty company', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, ...{ roles: [{ company: '' }] }});
    expect(result.success).toBe(false);
  });

  it('rejects empty relationship', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, ...{ roles: [{ relationship: '' }] }});
    expect(result.success).toBe(false);
  });

  it('rejects text shorter than 10 characters', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, text: 'Short' });
    expect(result.success).toBe(false);
  });

  it('accepts text with exactly 10 characters', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, text: '1234567890' });
    expect(result.success).toBe(true);
  });

  it('rejects date with single digit month', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2024-8-15' });
    expect(result.success).toBe(false);
  });

  it('rejects date with month outside lower boundary', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2024-00-15' });
    expect(result.success).toBe(false);
  });

  it('rejects date with month outside upper boundary', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2024-13-15' });
    expect(result.success).toBe(false);
  });

  it('rejects date with year outside lower boundary', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '1999-12-31' });
    expect(result.success).toBe(false);
  });

  it('rejects date with year outside upper boundary', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2080-01-01' });
    expect(result.success).toBe(false);
  });

  it('rejects yyyy-mm date', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2024-08' });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = recommendationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('formatRecommendationDate', () => {
  it('formats as long month and year', () => {
    const date = new Date('2024-08-01T12:00:00.000Z');
    expect(formatRecommendationDate(date)).toBe('August 1, 2024');
  });

  it('formats January correctly', () => {
    const date = new Date('2023-01-01T12:00:00.000Z');
    expect(formatRecommendationDate(date)).toBe('January 1, 2023');
  });

  it('formats December correctly', () => {
    const date = new Date('2022-12-01T12:00:00.000Z');
    expect(formatRecommendationDate(date)).toBe('December 1, 2022');
  });
});
