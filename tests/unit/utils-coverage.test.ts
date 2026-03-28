import { describe, it, expect } from 'vitest';
import { compareCoverage } from '../../src/utils/coverage';
import type { CoverageSummary } from '../../src/utils/coverage';

function makeSummary(
  lines: number,
  branches: number,
  functions: number,
  statements: number,
): CoverageSummary {
  return {
    total: {
      lines: { pct: lines },
      branches: { pct: branches },
      functions: { pct: functions },
      statements: { pct: statements },
    },
  };
}

describe('compareCoverage', () => {
  it('passes when coverage is the same', () => {
    const base = makeSummary(85, 80, 90, 85);
    const current = makeSummary(85, 80, 90, 85);
    const result = compareCoverage(base, current);
    expect(result.passed).toBe(true);
    expect(result.regressions).toHaveLength(0);
  });

  it('passes when coverage increases', () => {
    const base = makeSummary(80, 80, 80, 80);
    const current = makeSummary(90, 85, 95, 88);
    const result = compareCoverage(base, current);
    expect(result.passed).toBe(true);
    expect(result.regressions).toHaveLength(0);
  });

  it('fails when any metric decreases', () => {
    const base = makeSummary(85, 80, 90, 85);
    const current = makeSummary(85, 75, 90, 85);
    const result = compareCoverage(base, current);
    expect(result.passed).toBe(false);
    expect(result.regressions).toHaveLength(1);
    expect(result.regressions[0]).toContain('branches');
  });

  it('reports multiple regressions', () => {
    const base = makeSummary(90, 90, 90, 90);
    const current = makeSummary(80, 80, 80, 80);
    const result = compareCoverage(base, current);
    expect(result.passed).toBe(false);
    expect(result.regressions).toHaveLength(4);
  });

  it('handles 100% to 100% (no regression)', () => {
    const base = makeSummary(100, 100, 100, 100);
    const current = makeSummary(100, 100, 100, 100);
    const result = compareCoverage(base, current);
    expect(result.passed).toBe(true);
  });

  it('handles 0% to 0% (no regression)', () => {
    const base = makeSummary(0, 0, 0, 0);
    const current = makeSummary(0, 0, 0, 0);
    const result = compareCoverage(base, current);
    expect(result.passed).toBe(true);
  });

  it('detects regression from fractional differences', () => {
    const base = makeSummary(85.5, 80, 90, 85);
    const current = makeSummary(85.4, 80, 90, 85);
    const result = compareCoverage(base, current);
    expect(result.passed).toBe(false);
    expect(result.regressions).toHaveLength(1);
    expect(result.regressions[0]).toContain('lines');
  });
});
