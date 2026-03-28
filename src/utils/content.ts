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
export function sortByDate<T extends Dated>(entries: ContentEntry<T>[]): ContentEntry<T>[] {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.data.date).getTime();
    const dateB = new Date(b.data.date).getTime();
    return dateB - dateA;
  });
}

/**
 * Filter out draft entries. In production, drafts are excluded.
 */
export function filterDrafts<T extends Draftable>(
  entries: ContentEntry<T>[],
  isProduction = true,
): ContentEntry<T>[] {
  if (!isProduction) return entries;
  return entries.filter((entry) => !entry.data.draft);
}

/**
 * Sort content entries by an explicit order field, ascending.
 */
export function sortByOrder<T extends Ordered>(entries: ContentEntry<T>[]): ContentEntry<T>[] {
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}
