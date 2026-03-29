import { describe, it, expect } from 'vitest';
import { recommendationSchema } from '../../src/schemas/recommendations';

const validEntry = {
  author: 'Sarah Chen',
  role: 'VP of Engineering',
  company: 'Acme Corp',
  relationship: 'Direct manager',
  text: 'An outstanding quality engineer who transformed our practices.',
  date: '2024-08',
  order: 0,
};

describe('recommendationSchema', () => {
  it('accepts a valid entry', () => {
    const result = recommendationSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('rejects empty author', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, author: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty role', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, role: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty company', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, company: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty relationship', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, relationship: '' });
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
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2024-8' });
    expect(result.success).toBe(false);
  });

  it('rejects date with month outside lower boundary', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2024-00' });
    expect(result.success).toBe(false);
  });

  it('rejects date with month outside upper boundary', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2024-13' });
    expect(result.success).toBe(false);
  });

  it('rejects date with year outside lower boundary', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '1999-12' });
    expect(result.success).toBe(false);
  });

  it('rejects date with year outside upper boundary', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2080-01' });
    expect(result.success).toBe(false);
  });

  it('rejects full ISO date', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, date: '2024-08-15' });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, order: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer order', () => {
    const result = recommendationSchema.safeParse({ ...validEntry, order: 0.5 });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = recommendationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
