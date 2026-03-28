import { describe, it, expect } from 'vitest';
import { sortByDate, filterDrafts, sortByOrder } from '../../src/utils/content';
import type { ContentEntry, Dated, Draftable, Ordered } from '../../src/utils/content';

describe('sortByDate', () => {
  it('sorts entries newest first', () => {
    const entries: ContentEntry<Dated>[] = [
      { data: { date: '2023-01-01' } },
      { data: { date: '2024-06-15' } },
      { data: { date: '2023-07-20' } },
    ];
    const sorted = sortByDate(entries);
    expect(sorted[0].data.date).toBe('2024-06-15');
    expect(sorted[1].data.date).toBe('2023-07-20');
    expect(sorted[2].data.date).toBe('2023-01-01');
  });

  it('handles Date objects', () => {
    const entries: ContentEntry<Dated>[] = [
      { data: { date: new Date('2023-01-01') } },
      { data: { date: new Date('2024-01-01') } },
    ];
    const sorted = sortByDate(entries);
    expect(new Date(sorted[0].data.date).getFullYear()).toBe(2024);
  });

  it('returns empty array for empty input', () => {
    expect(sortByDate([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const entries: ContentEntry<Dated>[] = [
      { data: { date: '2023-01-01' } },
      { data: { date: '2024-01-01' } },
    ];
    const original = [...entries];
    sortByDate(entries);
    expect(entries).toEqual(original);
  });

  it('handles entries with equal dates', () => {
    const entries: ContentEntry<Dated>[] = [
      { data: { date: '2023-06-01' } },
      { data: { date: '2023-06-01' } },
    ];
    const sorted = sortByDate(entries);
    expect(sorted).toHaveLength(2);
  });
});

describe('filterDrafts', () => {
  const entries: ContentEntry<Draftable>[] = [
    { data: { draft: true } },
    { data: { draft: false } },
    { data: {} },
  ];

  it('filters out drafts in production', () => {
    const result = filterDrafts(entries, true);
    expect(result).toHaveLength(2);
    expect(result.every((e) => !e.data.draft)).toBe(true);
  });

  it('keeps all entries in development', () => {
    const result = filterDrafts(entries, false);
    expect(result).toHaveLength(3);
  });

  it('defaults to production mode', () => {
    const result = filterDrafts(entries);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(filterDrafts([])).toEqual([]);
  });
});

describe('sortByOrder', () => {
  it('sorts entries by order ascending', () => {
    const entries: ContentEntry<Ordered>[] = [
      { data: { order: 3 } },
      { data: { order: 1 } },
      { data: { order: 2 } },
    ];
    const sorted = sortByOrder(entries);
    expect(sorted[0].data.order).toBe(1);
    expect(sorted[1].data.order).toBe(2);
    expect(sorted[2].data.order).toBe(3);
  });

  it('returns empty array for empty input', () => {
    expect(sortByOrder([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const entries: ContentEntry<Ordered>[] = [
      { data: { order: 2 } },
      { data: { order: 1 } },
    ];
    const original = [...entries];
    sortByOrder(entries);
    expect(entries).toEqual(original);
  });
});
