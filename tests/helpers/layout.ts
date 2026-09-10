import type { Locator } from '@playwright/test';

/** Measure the actual font's space requirement without changing the visible layout. */
export async function unwrappedWidth(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const probe = element.cloneNode(true) as HTMLElement;
    probe.setAttribute('aria-hidden', 'true');
    Object.assign(probe.style, {
      position: 'fixed', visibility: 'hidden', pointerEvents: 'none',
      width: 'max-content', maxWidth: 'none', whiteSpace: 'nowrap', flexWrap: 'nowrap',
    });
    element.parentElement!.append(probe);
    try {
      return probe.getBoundingClientRect().width;
    } finally {
      probe.remove();
    }
  });
}
