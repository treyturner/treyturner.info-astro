import { describe, it, expect } from 'vitest';
import { experienceSchema, formatDateRange } from '../../src/schemas/experience';

const validEntry = {
  company: 'Acme Corp',
  role: 'Staff SDET',
  startDate: '2021-03',
  endDate: '2024-01',
  description: 'Led quality engineering.',
  highlights: ['Built test framework'],
  logo: 'acme-corp.png',
};

describe('experienceSchema', () => {
  it('accepts a valid entry with endDate', () => {
    const result = experienceSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('produces Date objects for startDate and endDate', () => {
    const result = experienceSchema.parse(validEntry);
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
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

  it('rejects missing required fields', () => {
    const result = experienceSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts logo with .png extension', () => {
    const result = experienceSchema.safeParse({ ...validEntry, logo: 'company.png' });
    expect(result.success).toBe(true);
  });

  it('accepts logo with .svg extension', () => {
    const result = experienceSchema.safeParse({ ...validEntry, logo: 'company.svg' });
    expect(result.success).toBe(true);
  });

  it('accepts logo with .jpg extension', () => {
    const result = experienceSchema.safeParse({ ...validEntry, logo: 'company.jpg' });
    expect(result.success).toBe(true);
  });

  it('rejects logo with disallowed extension', () => {
    const result = experienceSchema.safeParse({ ...validEntry, logo: 'company.gif' });
    expect(result.success).toBe(false);
  });

  it('rejects logo with uppercase extension', () => {
    const result = experienceSchema.safeParse({ ...validEntry, logo: 'company.PNG' });
    expect(result.success).toBe(false);
  });

  it('rejects logo with no extension', () => {
    const result = experienceSchema.safeParse({ ...validEntry, logo: 'company' });
    expect(result.success).toBe(false);
  });

  it('rejects missing logo', () => {    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logo: _logo, ...withoutLogo } = validEntry;    
    const result = experienceSchema.safeParse(withoutLogo);
    expect(result.success).toBe(false);
  });
});

describe('formatDateRange', () => {
  it('formats a range with both dates', () => {
    const start = new Date('2021-03-01T12:00:00.000Z');
    const end = new Date('2024-01-01T12:00:00.000Z');
    expect(formatDateRange(start, end)).toBe('March 2021 – January 2024');
  });

  it('formats a range ending with Present when no endDate', () => {
    const start = new Date('2021-03-01T12:00:00.000Z');
    const result = formatDateRange(start);
    expect(result).toContain('March 2021');
    expect(result).toContain('Present');
  });

  it('formats boundary months correctly', () => {
    const jan = new Date('2020-01-01T12:00:00.000Z');
    const dec = new Date('2020-12-01T12:00:00.000Z');
    expect(formatDateRange(jan, dec)).toBe('January 2020 – December 2020');
  });

  it('handles undefined endDate explicitly', () => {
    const start = new Date('2023-06-01T12:00:00.000Z');
    expect(formatDateRange(start, undefined)).toContain('Present');
  });
});
