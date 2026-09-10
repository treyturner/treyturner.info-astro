# ARCHITECTURE.md

## Site Shape

This is a static Astro site with thin pages, reusable layouts/components, and file-based content.

## Content Model

### Global Data

Stored in `src/data/`:

- `site.json`
- `skills.json`
- `navigation.json`

### Skills Lists

- The Skills page renders `src/data/skills.json` in its curated category and skill order, with the most recently used skills first within each group. `skills.previous.json` is reference material, not a page data source.
- Each group is an accessible, named ordered list with its numbers hidden and one skill per row. Plain sections replace tags and boxed cards; a responsive grid uses three, two, or one column as space allows, including when text is enlarged.

### Content Collections

Stored in `src/content/`:

- `blog/` — MDX
- `experience/` — JSON
- `recommendations/` — JSON
- `homelab/` — MDX

### Experience and Recommendation Links

- Each recommendation role can include `experiences`, an array of experience entry IDs (the JSON filenames without `.json`). Omitted arrays default to empty.
- These are Astro collection references, resolved by `src/utils/recommendations.ts`. Missing destinations fail page generation with the recommendation and experience IDs in the error.
- Recommendation role blocks link to `/experience#<experience-id>`; the title, relationship, logo, and remaining block area form one native link. Roles spanning multiple experiences show a separate block for each destination, labeled with the corresponding job title. Roles without references remain non-interactive text.
- Linked role blocks show “See engagement →” beneath a plain relationship label. Keyboard focus underlines that action instead of outlining the whole block.
- Experience cards derive compact recommendation links automatically, newest first, using only the roles associated with that experience. Each recommendation appears once per experience, even when multiple roles match.
- Compact cards link back to `/recommendations#<recommendation-id>`. Experiences without recommendations omit the section.
- Both directions share `src/styles/related-entry.css`: transparent, borderless blocks without inset padding. Their 16px bold primary line, 14px metadata/action lines, and 4px line gaps match the recommender bio. Photos and company logos are 48px high and align with the first two text lines; photos stay circular and logos retain their proportions. Hover/focus leaves the surface transparent, and keyboard focus underlines the text-aligned action. Role blocks do not add a separate section heading.
- Recommendation footers use a narrower bio column and two equal role columns (0.8:1:1) on desktop. Up to two roles fill the middle and right in content order. A single role occupies the right column, leaving the middle empty. Below 768px, author details and roles stack full-width without empty slots.
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

Layout assertions measure text using the active font instead of assuming that a particular label always occupies one line. Typography regressions also exercise sans-serif and monospace fallbacks so wider glyphs and enlarged text cannot silently overflow content columns.

### Coverage

Coverage is enforced at a minimum of 80% for:

- lines
- branches
- functions
- statements

Coverage must not regress relative to `main`.

## Agent Principle

Favor explicit, testable logic over implicit framework behavior.
