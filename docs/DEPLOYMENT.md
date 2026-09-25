# DEPLOYMENT.md

## Hosting Model

This site is deployed as a static Astro site to GitHub Pages.

## Blue/Green Rollout

The old production Wordpress site is now retired.

The new Astro site is now deployed to:

- `treyturner.info`

## GitHub Pages Notes

- deploy via GitHub Actions
- keep site static
- do not introduce a server adapter
- do not configure a repo subpath base for custom-domain deployment

## Custom Domain

Current Pages custom domain target:

- `treyturner.info`

Expected repo file:

- `public/CNAME`
