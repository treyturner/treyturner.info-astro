import { describe, it, expect } from 'vitest';
import { resolveTheme, toggleTheme } from '../../src/utils/theme';

describe('resolveTheme', () => {
  it('returns "dark" when stored preference is "dark"', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
  });

  it('returns "light" when stored preference is "light"', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('ignores invalid stored values and uses system preference', () => {
    expect(resolveTheme('invalid', true)).toBe('dark');
    expect(resolveTheme('invalid', false)).toBe('light');
    expect(resolveTheme('', true)).toBe('dark');
    expect(resolveTheme('', false)).toBe('light');
  });

  it('uses system dark preference when stored is null', () => {
    expect(resolveTheme(null, true)).toBe('dark');
  });

  it('uses system light preference when stored is null', () => {
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('falls back to dark when matchMedia is unsupported (systemPrefersDark = true)', () => {
    // Callers pass true when matchMedia is unavailable to enforce the dark fallback
    expect(resolveTheme(null, true)).toBe('dark');
  });
});

describe('toggleTheme', () => {
  it('toggles dark to light', () => {
    expect(toggleTheme('dark')).toBe('light');
  });

  it('toggles light to dark', () => {
    expect(toggleTheme('light')).toBe('dark');
  });
});
