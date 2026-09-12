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
- `projects/` — MDX

### Project Ordering and URLs

Published projects are ordered alphabetically by source file path, not by their titles or metadata. Use zero-padded filename prefixes such as `00-treyturner-info.mdx`, `01-nurevolution-net.mdx`, and `10-docker-beets.mdx` to arrange the list in the file explorer. Keep the same padding width throughout the collection; this is alphabetical, not numeric sorting.

The project loader removes a leading number and hyphen from each path segment when generating route IDs. For example, `04-mister-deskflow.mdx` still serves `/projects/mister-deskflow`, and changing `04-` to `02-` changes only its position. Unprefixed names and nested index routes remain supported; an explicit `slug` overrides the generated route without affecting filename order. Keep the resulting route IDs unique. Draft entries stay out of both the index and generated detail pages.

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
- Project logo images use `--image-color-scheme` to pass the selected site theme to embedded SVGs without changing other browser controls. The Astro SVG uses that scheme to switch its main mark between dark and white while keeping the gradient flame unchanged.

## Rendering Model

- Prefer static generation wherever possible
- Keep pages thin
- Move logic into utilities and reusable components
- Use schemas to validate content early

### Animated Home Title

The home page progressively enhances its canonical `site.json` title with `TypewriterTitle.astro`. `rotatingTitles` supplies the ordered phrases; `titleAnimation` configures typing, deletion, initial delay, inter-title delay, and the completed-title hold (all in milliseconds). No Typed.js or client framework dependency is required.

`titleAnimation.randomTypeDelay` adds a newly sampled, whole-millisecond delay from zero through the configured maximum before each typed character. Between characters this is added to `typeDelay`; for the first character it is added to `startDelay` or `gapDelay`. It never affects deletion or the completed-title hold, and pausing preserves the already sampled delay. Omit it or set it to `0` to disable variation. The homepage's current timings live in `src/data/site.json`. Timing values, including the maximum combined delay, must fit within the browser timer limit.

The pure player in `src/utils/typewriter.ts` types/deletes whole Unicode graphemes and preserves the remaining delay when paused. The custom element owns its lifecycle, cancels timers/listeners when removed, and suspends in hidden documents. A grayscale icon-only play/pause button sits to the right of the longest animated title, outside the text layout so the title and surrounding content retain their positions. The button uses 75% opacity at rest to exceed 3:1 non-text contrast on both page backgrounds and becomes fully opaque on hover or keyboard focus, with an accessible action label and a focus outline. The manual play/pause preference is saved in `localStorage` as `title-animation-paused`, surviving navigation and reloads as well as tab visibility changes, reduced-motion changes, and reconnection of the same element. A page restored from the browser history cache rechecks the saved choice. A fresh paused title displays the first complete rotating title and seeds the player with `initialTitleComplete`. Selecting Play backspaces that title at the configured deletion speed, then continues with the next title, without clearing or retyping the first entry. Pauses during an existing animation retain their exact position and remaining delay. If storage is blocked, the control still works for the current component without persistence. The title has no cursor. Forward typing defaults to 61 ms per character, with deletion and hold timings configured independently. Reduced motion and no-JavaScript access retain the canonical static title and hide the control. Screen readers receive stable text instead of the animated characters. Invisible, accessibility-hidden title copies reserve responsive space so changing words cannot move surrounding content. The title shares the active navigation's `--color-primary` token: yellow in dark mode and blue in light mode, including when the theme changes.

### CV Download

The home page places an outlined “Download CV” link between the tagline and social icons, with equal 2.25rem gaps above and below the button. Its text, outline, and icon match the body-copy color at rest and use the theme accent on hover. It uses a native same-origin download link, with a decorative download icon to the right, and works without JavaScript. `public/trey-turner-cv.pdf` is served unchanged and downloads as `Trey Turner - Automation Engineer, CI-CD & Test Infrastructure.pdf`; replace that asset to update the CV while keeping the link stable.

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
