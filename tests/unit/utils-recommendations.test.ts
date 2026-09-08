import { describe, expect, it } from 'vitest';
import type { Experience } from '../../src/schemas/experience';
import type { Recommendation } from '../../src/schemas/recommendations';
import { linkRecommendations } from '../../src/utils/recommendations';

const experience = (id: string) => ({
  id,
  data: {
    company: id,
    role: 'My job title',
    startDate: new Date('2020-01-01'),
    description: 'My work',
    highlights: ['A highlight'],
    logo: 'company.png',
  } satisfies Experience,
});

const role = (
  ids: string[],
  relationship = 'Colleague',
  title = 'Their job title',
): Recommendation['roles'][number] => ({
  role: title,
  company: 'Their company label',
  relationship,
  logo: 'company.png',
  experiences: ids.map((id) => ({ id, collection: 'experience' })),
});

const recommendation = (id: string, roles: Recommendation['roles'], date = '2024-01-01') => ({
  id,
  data: {
    author: id,
    roles,
    text: 'An excellent person to work with.',
    date: new Date(date),
    linkedIn: `https://www.linkedin.com/in/${id}`,
  } satisfies Recommendation,
});

describe('linkRecommendations', () => {
  it('handles empty collections', () => {
    expect(linkRecommendations([], [])).toEqual({ recommendations: [], byExperience: new Map() });
  });

  it('leaves unrelated experiences empty and does not guess links from labels', () => {
    const entry = experience('unrelated');
    const rec = recommendation('someone', [{ ...role([]), company: entry.data.company }]);
    const result = linkRecommendations([rec], [entry]);
    expect(result.byExperience.get('unrelated')).toEqual([]);
    expect(result.recommendations[0].data.roles[0].experiences).toEqual([]);
  });

  it('resolves explicit IDs while preserving the recommender title and company wording', () => {
    const entry = experience('kapsch-trafficcom');
    const rec = recommendation('chad', [role(['kapsch-trafficcom'], 'Direct report', 'Test Engineer II')]);
    const result = linkRecommendations([rec], [entry]);
    expect(result.recommendations[0].data.roles[0]).toEqual({
      ...rec.data.roles[0], experiences: [entry],
    });
    expect(result.byExperience.get(entry.id)).toEqual([{
      id: 'chad', author: 'chad', roles: [{ role: 'Test Engineer II', relationship: 'Direct report' }],
    }]);
  });

  it('keeps relationship context specific to the linked workplace', () => {
    const result = linkRecommendations([
      recommendation('chad', [
        role(['kapsch-trafficcom'], 'Direct report', 'Test Engineer II'),
        role(['stoplight-io'], 'Colleague', 'SDET'),
      ]),
    ], [experience('kapsch-trafficcom'), experience('stoplight-io')]);
    expect(result.byExperience.get('kapsch-trafficcom')![0].roles).toEqual([
      { role: 'Test Engineer II', relationship: 'Direct report' },
    ]);
    expect(result.byExperience.get('stoplight-io')![0].roles).toEqual([
      { role: 'SDET', relationship: 'Colleague' },
    ]);
  });

  it('supports a single recommendation role spanning multiple experiences', () => {
    const first = experience('att-wifi-qa');
    const second = experience('att-wifi-qa-ii');
    const result = linkRecommendations([
      recommendation('colleague', [role([first.id, second.id])]),
    ], [first, second]);
    expect(result.recommendations[0].data.roles[0].experiences).toEqual([first, second]);
    expect(result.byExperience.get(first.id)).toHaveLength(1);
    expect(result.byExperience.get(second.id)).toHaveLength(1);
  });

  it('deduplicates a recommendation with multiple roles referencing the same experience', () => {
    const result = linkRecommendations([
      recommendation('someone', [
        role(['invodo'], 'Colleague', 'Engineer'),
        role(['invodo'], 'Direct manager', 'Engineering Manager'),
      ]),
    ], [experience('invodo')]);
    expect(result.byExperience.get('invodo')).toEqual([{
      id: 'someone', author: 'someone', roles: [
        { role: 'Engineer', relationship: 'Colleague' },
        { role: 'Engineering Manager', relationship: 'Direct manager' },
      ],
    }]);
  });

  it('sorts recommendations newest first in both directions without mutating content', () => {
    const old = recommendation('older', [role(['invodo'])], '2022-01-01');
    const recent = recommendation('newer', [role(['invodo'])], '2025-01-01');
    const recs = [old, recent];
    const experiences = [experience('invodo')];
    const original = structuredClone({ recs, experiences });
    const result = linkRecommendations(recs, experiences);
    expect(result.recommendations.map((entry) => entry.id)).toEqual(['newer', 'older']);
    expect(result.byExperience.get('invodo')!.map((entry) => entry.id)).toEqual(['newer', 'older']);
    expect({ recs, experiences }).toEqual(original);
  });

  it('fails with the recommendation and missing experience ID instead of making a broken link', () => {
    expect(() => linkRecommendations([
      recommendation('alan-feldman', [role(['invodo', 'missing'])]),
    ], [experience('invodo')])).toThrow(
      'Recommendation "alan-feldman" (Their job title at Their company label) references missing experience "missing"',
    );
  });
});
