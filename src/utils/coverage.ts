export interface CoverageMetrics {
  lines: { pct: number };
  branches: { pct: number };
  functions: { pct: number };
  statements: { pct: number };
}

export interface CoverageSummary {
  total: CoverageMetrics;
}

export interface ComparisonResult {
  passed: boolean;
  regressions: string[];
}

const METRIC_KEYS = ['lines', 'branches', 'functions', 'statements'] as const;

/**
 * Compare two coverage summaries and detect regressions.
 * Returns pass/fail and a list of regressed metrics.
 */
export function compareCoverage(
  base: CoverageSummary,
  current: CoverageSummary,
): ComparisonResult {
  const regressions: string[] = [];

  for (const key of METRIC_KEYS) {
    const basePct = base.total[key].pct;
    const currentPct = current.total[key].pct;
    if (currentPct < basePct) {
      regressions.push(
        `${key}: ${basePct.toFixed(2)}% → ${currentPct.toFixed(2)}% (decreased by ${(basePct - currentPct).toFixed(2)}%)`,
      );
    }
  }

  return {
    passed: regressions.length === 0,
    regressions,
  };
}
