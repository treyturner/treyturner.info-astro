import { describe, it, expect } from 'vitest';
import { roleSchema, recommendationSchema, formatRecommendationDate } from '../../src/schemas/recommendations';

const validRole = {
  role: 'VP of Engineering',
  company: 'Acme Corp',
  relationship: 'Direct manager',
  logo: 'acme-corp.png',
};

const validEntry = {
  author: 'Sarah Chen',
  roles: [validRole],
  text: 'An outstanding quality engineer who transformed our practices.',
  date: '2024-08-15',
  linkedIn: 'https://www.linkedin.com/in/sarahchen',
};

describe('roleSchema', () => {
  it('accepts a valid role', () => {
    const result = roleSchema.safeParse(validRole);
    expect(result.success).toBe(true);
  });

  it('accepts logo with .png extension', () => {
    const result = roleSchema.safeParse({ ...validRole, logo: 'company.png' });
    expect(result.success).toBe(true);
  });

  it('accepts logo with .svg extension', () => {
    const result = roleSchema.safeParse({ ...validRole, logo: 'company.svg' });
    expect(result.success).toBe(true);
  });

  it('accepts logo with .jpg extension', () => {
    const result = roleSchema.safeParse({ ...validRole, logo: 'company.jpg' });
    expect(result.success).toBe(true);
  });

  it('rejects logo with disallowed extension', () => {
    const result = roleSchema.safeParse({ ...validRole, logo: 'company.gif' });
    expect(result.success).toBe(false);
  });

  it('rejects logo with uppercase extension', () => {
    const result = roleSchema.safeParse({ ...validRole, logo: 'company.PNG' });
    expect(result.success).toBe(false);
  });

  it('rejects logo with no extension', () => {
    const result = roleSchema.safeParse({ ...validRole, logo: 'company' });
    expect(result.success).toBe(false);
  });

  it('rejects missing logo', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logo: _logo, ...withoutLogo } = validRole;
    const result = roleSchema.safeParse(withoutLogo);
    expect(result.success).toBe(false);
  });
});

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

  it('accepts a valid linkedIn URL', () => {
    const result = recommendationSchema.safeParse({
      ...validEntry,
      linkedIn: 'https://www.linkedin.com/in/some-person-123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a linkedIn URL with wrong path prefix', () => {
    const result = recommendationSchema.safeParse({
      ...validEntry,
      linkedIn: 'https://www.linkedin.com/pub/some-person',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-LinkedIn URL', () => {
    const result = recommendationSchema.safeParse({
      ...validEntry,
      linkedIn: 'https://twitter.com/someone',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an HTTP (non-HTTPS) linkedIn URL', () => {
    const result = recommendationSchema.safeParse({
      ...validEntry,
      linkedIn: 'http://www.linkedin.com/in/someone',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing linkedIn field', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { linkedIn: _li, ...withoutLinkedIn } = validEntry;
    const result = recommendationSchema.safeParse(withoutLinkedIn);
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
