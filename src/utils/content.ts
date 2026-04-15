export interface Dated {
  date: Date;
}

export interface Draftable {
  draft?: boolean;
}

export interface HasStartDate {
  startDate: Date;
}

export interface ContentEntry<T> {
  data: T;
}

/**
 * Sort content entries by date field, newest first.
 */
export function sortByDate<E extends ContentEntry<Dated>>(entries: E[]): E[] {
  return [...entries].sort((a, b) =>
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
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
 * Sort content entries by startDate field, newest first.
 */
export function sortByStartDate<E extends ContentEntry<HasStartDate>>(entries: E[]): E[] {
  return [...entries].sort((a, b) =>
    new Date(b.data.startDate).getTime() - new Date(a.data.startDate).getTime()
  );
}
