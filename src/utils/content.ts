export interface Dated {
  date: Date | string;
}

export interface Draftable {
  draft?: boolean;
}

export interface Ordered {
  order: number;
}

export interface ContentEntry<T> {
  data: T;
}

/**
 * Sort content entries by date field, newest first.
 */
export function sortByDate<E extends ContentEntry<Dated>>(entries: E[]): E[] {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.data.date).getTime();
    const dateB = new Date(b.data.date).getTime();
    return dateB - dateA;
  });
}

/**
 * Filter out draft entries. In production, drafts are excluded.
 */
export function filterDrafts<E extends ContentEntry<Draftable>>(
  entries: E[],
  isProduction = true,
): E[] {
  if (!isProduction) return entries;
  return entries.filter((entry) => !entry.data.draft);
}

/**
 * Sort content entries by an explicit order field, ascending.
 */
export function sortByOrder<E extends ContentEntry<Ordered>>(entries: E[]): E[] {
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}
