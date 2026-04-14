# DEPLOYMENT.md

## Hosting Model

This site is deployed as a static Astro site to GitHub Pages.

## Blue/Green Rollout

Current production Wordpress site remains live at:

- `treyturner.info`

New Astro site is deployed first to:

- `astro.treyturner.info`

When ready, DNS can be updated to cut over the apex domain.

## GitHub Pages Notes

- deploy via GitHub Actions
- keep site static
- do not introduce a server adapter
- do not configure a repo subpath base for custom-domain deployment

## Custom Domain

Current Pages custom domain target:

- `astro.treyturner.info`

Expected repo file:

- `public/CNAME`

Current CNAME contents:

    astro.treyturner.info

## Cutover Plan

When ready to replace the old site:

1. update `public/CNAME` to `treyturner.info`
2. update DNS to point apex domain to GitHub Pages
3. verify HTTPS/certificate issuance
4. validate pages and canonical URLs after cutover
