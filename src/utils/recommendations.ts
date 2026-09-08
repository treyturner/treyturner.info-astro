import type { Experience } from '../schemas/experience';
import type { Recommendation } from '../schemas/recommendations';
import { sortByDate } from './content';

interface ExperienceEntry {
  id: string;
  data: Experience;
}

interface RecommendationEntry {
  id: string;
  data: Recommendation;
}

type LinkedRole = Omit<Recommendation['roles'][number], 'experiences'> & {
  experiences: ExperienceEntry[];
};

export interface LinkedRecommendation {
  id: string;
  data: Omit<Recommendation, 'roles'> & { roles: LinkedRole[] };
}

export interface ExperienceRecommendation {
  id: string;
  author: string;
  roles: Pick<LinkedRole, 'role' | 'relationship'>[];
}

/** Resolve explicit role references and derive both directions from the same content. */
export function linkRecommendations(
  recommendations: RecommendationEntry[],
  experiences: ExperienceEntry[],
) {
  const experienceById = new Map(experiences.map((entry) => [entry.id, entry]));
  const byExperience = new Map<string, ExperienceRecommendation[]>(
    experiences.map((entry) => [entry.id, []]),
  );

  const linked: LinkedRecommendation[] = sortByDate(recommendations).map((entry) => ({
    id: entry.id,
    data: {
      ...entry.data,
      roles: entry.data.roles.map((role) => ({
        ...role,
        experiences: role.experiences.map((reference) => {
          const experience = experienceById.get(reference.id);
          if (!experience) {
            throw new Error(
              `Recommendation "${entry.id}" (${role.role} at ${role.company}) references missing experience "${reference.id}"`,
            );
          }
          return experience;
        }),
      })),
    },
  }));

  for (const recommendation of linked) {
    for (const role of recommendation.data.roles) {
      for (const experience of role.experiences) {
        const matches = byExperience.get(experience.id)!;
        const existing = matches.find((match) => match.id === recommendation.id);
        const context = { role: role.role, relationship: role.relationship };
        if (existing) {
          existing.roles.push(context);
        } else {
          matches.push({ id: recommendation.id, author: recommendation.data.author, roles: [context] });
        }
      }
    }
  }

  return { recommendations: linked, byExperience };
}
