import { describe, it, expect } from 'vitest';
import { sortByDate, filterDrafts, sortByStartDate } from '../../src/utils/content';
import type { ContentEntry, Dated, Draftable, HasStartDate } from '../../src/utils/content';

describe('sortByDate', () => {
  it('sorts entries newest first', () => {
    const d1 = new Date('2023-01-01T12:00:00.000Z');
    const d2 = new Date('2024-06-01T12:00:00.000Z');
    const d3 = new Date('2023-07-01T12:00:00.000Z');
    const entries: ContentEntry<Dated>[] = [
      { data: { date: d1 } },
      { data: { date: d2 } },
      { data: { date: d3 } },
    ];
    const sorted = sortByDate(entries);
    expect(sorted[0].data.date).toBe(d2);
    expect(sorted[1].data.date).toBe(d3);
    expect(sorted[2].data.date).toBe(d1);
  });

  it('handles time-level ordering within a day', () => {
    const morning = new Date('2024-03-01T08:00:00.000Z');
    const noon = new Date('2024-03-01T12:30:00.000Z');
    const evening = new Date('2024-03-15T23:59:59.000Z');
    const entries: ContentEntry<Dated>[] = [
      { data: { date: morning } },
      { data: { date: evening } },
      { data: { date: noon } },
    ];
    const sorted = sortByDate(entries);
    expect(sorted[0].data.date).toBe(evening);
    expect(sorted[1].data.date).toBe(noon);
    expect(sorted[2].data.date).toBe(morning);
  });

  it('returns empty array for empty input', () => {
    expect(sortByDate([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const d1 = new Date('2023-01-01T12:00:00.000Z');
    const d2 = new Date('2024-01-01T12:00:00.000Z');
    const entries: ContentEntry<Dated>[] = [
      { data: { date: d1 } },
      { data: { date: d2 } },
    ];
    const original = [...entries];
    sortByDate(entries);
    expect(entries).toEqual(original);
  });

  it('handles entries with equal dates', () => {
    const d = new Date('2023-06-01T12:00:00.000Z');
    const entries: ContentEntry<Dated>[] = [
      { data: { date: d } },
      { data: { date: new Date(d) } },
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

describe('sortByStartDate', () => {
  it('sorts entries newest first', () => {
    const d1 = new Date('2020-01-01T12:00:00.000Z');
    const d2 = new Date('2023-06-01T12:00:00.000Z');
    const d3 = new Date('2021-09-01T12:00:00.000Z');
    const entries: ContentEntry<HasStartDate>[] = [
      { data: { startDate: d1 } },
      { data: { startDate: d2 } },
      { data: { startDate: d3 } },
    ];
    const sorted = sortByStartDate(entries);
    expect(sorted[0].data.startDate).toBe(d2);
    expect(sorted[1].data.startDate).toBe(d3);
    expect(sorted[2].data.startDate).toBe(d1);
  });

  it('returns empty array for empty input', () => {
    expect(sortByStartDate([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const d1 = new Date('2020-01-01T12:00:00.000Z');
    const d2 = new Date('2023-01-01T12:00:00.000Z');
    const entries: ContentEntry<HasStartDate>[] = [
      { data: { startDate: d1 } },
      { data: { startDate: d2 } },
    ];
    const original = [...entries];
    sortByStartDate(entries);
    expect(entries).toEqual(original);
  });
});
