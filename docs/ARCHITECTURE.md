# ARCHITECTURE.md

## Site Shape

This is a static Astro site with thin pages, reusable layouts/components, and file-based content.

## Content Model

### Global Data

Stored in `src/data/`:

- `site.json`
- `skills.json`
- `navigation.json`

### Content Collections

Stored in `src/content/`:

- `blog/` — MDX
- `experience/` — JSON
- `recommendations/` — JSON
- `homelab/` — MDX

### Experience and Recommendation Links

- Each recommendation role can include `experiences`, an array of experience entry IDs (the JSON filenames without `.json`). Omitted arrays default to empty.
- These are Astro collection references, resolved by `src/utils/recommendations.ts`. Missing destinations fail page generation with the recommendation and experience IDs in the error.
- Recommendation roles link to `/experience#<experience-id>`; roles spanning multiple experiences show separate links labeled with the corresponding job titles. Roles without references remain plain text.
- Experience cards derive compact recommendation links automatically, newest first, using only the roles associated with that experience. Each recommendation appears once per experience, even when multiple roles match.
- Compact cards link back to `/recommendations#<recommendation-id>`. Experiences without recommendations omit the section.
- Recommender titles and company wording remain independent from the site's experience titles; links are never inferred from names or recommendation dates.

### Logo Assets

- `src/assets/logos/companies/` — company logos used by Experience and Recommendations.
- `src/assets/logos/projects/` — project logos resolved by the Projects schema.
- Content keeps filename-only references (`logo` or `logoImage`); each loader supplies the appropriate directory.

## Rendering Model

- Prefer static generation wherever possible
- Keep pages thin
- Move logic into utilities and reusable components
- Use schemas to validate content early

## Styling

- Plain CSS only
- CSS variables for design tokens
- component-scoped styles in Astro files
- no Tailwind or utility framework

## Testing Philosophy

### Unit / Integration

Vitest covers:

- schema validation
- utility functions
- SEO helpers
- data validation
- coverage comparison logic

### E2E

Playwright covers:

- page rendering
- navigation
- blog flow
- homelab flow
- broken links
- metadata checks

### Coverage

Coverage is enforced at a minimum of 80% for:

- lines
- branches
- functions
- statements

Coverage must not regress relative to `main`.

## Agent Principle

Favor explicit, testable logic over implicit framework behavior.
