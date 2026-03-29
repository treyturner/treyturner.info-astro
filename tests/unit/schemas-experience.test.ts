import { describe, it, expect } from 'vitest';
import { experienceSchema, formatDateRange } from '../../src/schemas/experience';

const validEntry = {
  company: 'Acme Corp',
  role: 'Staff SDET',
  startDate: '2021-03',
  endDate: '2024-01',
  description: 'Led quality engineering.',
  highlights: ['Built test framework'],
  order: 0,
};

describe('experienceSchema', () => {
  it('accepts a valid entry with endDate', () => {
    const result = experienceSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('accepts a valid entry without endDate (current role)', () => {
    const current = { ...validEntry };
    delete (current as Record<string, unknown>).endDate;
    const result = experienceSchema.safeParse(current);
    expect(result.success).toBe(true);
  });

  it('rejects empty company', () => {
    const result = experienceSchema.safeParse({ ...validEntry, company: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty role', () => {
    const result = experienceSchema.safeParse({ ...validEntry, role: '' });
    expect(result.success).toBe(false);
  });

  it('rejects startDate with single digit month', () => {
    const result = experienceSchema.safeParse({ ...validEntry, startDate: '2021-3' });
    expect(result.success).toBe(false);
  });

  it('rejects startDate with month outside lower boundary', () => {
    const result = experienceSchema.safeParse({ ...validEntry, startDate: '2021-00' });
    expect(result.success).toBe(false);
  });

  it('rejects startDate with month outside upper boundary', () => {
    const result = experienceSchema.safeParse({ ...validEntry, startDate: '2021-13' });
    expect(result.success).toBe(false);
  });

  it('rejects startDate with year outside lower boundary', () => {
    const result = experienceSchema.safeParse({ ...validEntry, startDate: '1994-01' });
    expect(result.success).toBe(false);
  });

  it('rejects startDate with year outside upper boundary', () => {
    const result = experienceSchema.safeParse({ ...validEntry, startDate: '2080-01' });
    expect(result.success).toBe(false);
  });

  it('rejects full ISO date as startDate', () => {
    const result = experienceSchema.safeParse({ ...validEntry, startDate: '2021-03-15' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid endDate format', () => {
    const result = experienceSchema.safeParse({ ...validEntry, endDate: 'Jan 2024' });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = experienceSchema.safeParse({ ...validEntry, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty highlights array', () => {
    const result = experienceSchema.safeParse({ ...validEntry, highlights: [] });
    expect(result.success).toBe(false);
  });

  it('rejects highlights with empty strings', () => {
    const result = experienceSchema.safeParse({ ...validEntry, highlights: [''] });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = experienceSchema.safeParse({ ...validEntry, order: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer order', () => {
    const result = experienceSchema.safeParse({ ...validEntry, order: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = experienceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('formatDateRange', () => {
  it('formats a range with both dates', () => {
    const result = formatDateRange('2021-03', '2024-01');
    expect(result).toContain('Mar 2021');
    expect(result).toContain('Jan 2024');
    expect(result).toContain('–');
  });

  it('formats a range ending with Present when no endDate', () => {
    const result = formatDateRange('2021-03');
    expect(result).toContain('Mar 2021');
    expect(result).toContain('Present');
  });

  it('formats month names correctly', () => {
    expect(formatDateRange('2020-01', '2020-12')).toContain('Jan 2020');
    expect(formatDateRange('2020-01', '2020-12')).toContain('Dec 2020');
  });

  it('handles undefined endDate explicitly', () => {
    const result = formatDateRange('2023-06', undefined);
    expect(result).toContain('Present');
  });
});
