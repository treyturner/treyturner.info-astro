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
