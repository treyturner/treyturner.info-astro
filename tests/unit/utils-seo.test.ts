import { describe, it, expect } from 'vitest';
import { truncate, buildPageTitle, buildDescription, buildSEOMeta } from '../../src/utils/seo';
import type { SEODefaults } from '../../src/utils/seo';

const defaults: SEODefaults = {
  siteName: 'Trey Turner',
  defaultDescription: 'Software Quality Architect and Staff SDET.',
  siteURL: 'https://treyturner.info',
};

describe('truncate', () => {
  it('returns text unchanged if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis when over limit', () => {
    const result = truncate('a very long string that exceeds the limit', 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.endsWith('...')).toBe(true);
  });

  it('handles exact length', () => {
    expect(truncate('exact', 5)).toBe('exact');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

describe('buildPageTitle', () => {
  it('returns site name when no page title', () => {
    expect(buildPageTitle(undefined, 'Trey Turner')).toBe('Trey Turner');
  });

  it('combines page title and site name', () => {
    const result = buildPageTitle('Skills', 'Trey Turner');
    expect(result).toBe('Skills | Trey Turner');
  });

  it('truncates long titles', () => {
    const longTitle = 'A'.repeat(80);
    const result = buildPageTitle(longTitle, 'Trey Turner');
    expect(result.length).toBeLessThanOrEqual(70);
  });
});

describe('buildDescription', () => {
  it('uses provided description', () => {
    expect(buildDescription('Custom desc', 'Default')).toBe('Custom desc');
  });

  it('falls back to default when undefined', () => {
    expect(buildDescription(undefined, 'Default desc')).toBe('Default desc');
  });

  it('truncates long descriptions', () => {
    const longDesc = 'B'.repeat(200);
    const result = buildDescription(longDesc, 'Default');
    expect(result.length).toBeLessThanOrEqual(160);
  });
});

describe('buildSEOMeta', () => {
  it('builds complete meta from props and defaults', () => {
    const meta = buildSEOMeta(
      { title: 'Skills', description: 'My skills page' },
      defaults,
    );
    expect(meta.title).toBe('Skills | Trey Turner');
    expect(meta.description).toBe('My skills page');
    expect(meta.canonicalURL).toBe('https://treyturner.info');
    expect(meta.ogType).toBe('website');
    expect(meta.ogTitle).toBe(meta.title);
    expect(meta.ogDescription).toBe(meta.description);
  });

  it('uses defaults when props are empty', () => {
    const meta = buildSEOMeta({}, defaults);
    expect(meta.title).toBe('Trey Turner');
    expect(meta.description).toBe(defaults.defaultDescription);
  });

  it('respects custom canonical URL', () => {
    const meta = buildSEOMeta(
      { canonicalURL: 'https://treyturner.info/skills' },
      defaults,
    );
    expect(meta.canonicalURL).toBe('https://treyturner.info/skills');
  });

  it('respects custom og type', () => {
    const meta = buildSEOMeta({ ogType: 'article' }, defaults);
    expect(meta.ogType).toBe('article');
  });
});
