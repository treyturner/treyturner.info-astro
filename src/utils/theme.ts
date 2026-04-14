export type Theme = 'dark' | 'light';

/**
 * Resolve the initial theme from a stored preference and the system preference.
 * Priority: stored → system → dark (fallback when system preference is unknown).
 *
 * Pass `systemPrefersDark = true` when `window.matchMedia` is unsupported so
 * the function falls back to dark mode, as per the site default.
 */
export function resolveTheme(stored: string | null, systemPrefersDark: boolean): Theme {
  if (stored === 'dark' || stored === 'light') return stored;
  return systemPrefersDark ? 'dark' : 'light';
}

export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
