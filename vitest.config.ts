import { defineConfig } from 'vitest/config';
import type { Reporter } from 'vitest/reporters';

const reporters: (string | [string, Record<string, unknown>])[] = ['default'];
if (process.env.CI) {
  reporters.push(['allure-vitest/reporter', { resultsDir: './allure-results' }]);
}

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    reporters: reporters as Reporter[],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.astro',
        'src/content/**',
        'src/pages/**',
        // Declarative Astro collection wiring; meaningful coverage belongs on the imported schemas/logic
        'src/content.config.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
