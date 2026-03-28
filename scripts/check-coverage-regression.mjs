#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';

/**
 * Coverage regression check script.
 *
 * Usage: node scripts/check-coverage-regression.mjs <base-summary> <current-summary>
 *
 * Compares two coverage-summary.json files and fails if any metric decreased.
 * If the base file doesn't exist (bootstrap case), exits 0 with a log message.
 */

const METRIC_KEYS = ['lines', 'branches', 'functions', 'statements'];

const [basePath, currentPath] = process.argv.slice(2);

if (!basePath || !currentPath) {
  console.error('Usage: check-coverage-regression.mjs <base-summary.json> <current-summary.json>');
  process.exit(1);
}

if (!existsSync(basePath)) {
  console.log('No base coverage found — skipping regression check, thresholds still enforced');
  process.exit(0);
}

if (!existsSync(currentPath)) {
  console.error(`Current coverage file not found: ${currentPath}`);
  process.exit(1);
}

const base = JSON.parse(readFileSync(basePath, 'utf-8'));
const current = JSON.parse(readFileSync(currentPath, 'utf-8'));

let failed = false;

for (const key of METRIC_KEYS) {
  const basePct = base.total[key].pct;
  const currentPct = current.total[key].pct;

  if (currentPct < basePct) {
    console.error(
      `❌ ${key}: ${basePct.toFixed(2)}% → ${currentPct.toFixed(2)}% (decreased by ${(basePct - currentPct).toFixed(2)}%)`
    );
    failed = true;
  } else {
    console.log(`✅ ${key}: ${basePct.toFixed(2)}% → ${currentPct.toFixed(2)}%`);
  }
}

if (failed) {
  console.error('\nCoverage regression detected!');
  process.exit(1);
} else {
  console.log('\nNo coverage regression detected.');
  process.exit(0);
}
