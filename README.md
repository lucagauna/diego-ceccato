# Sitio de Diego Ceccato

Static site for Diego Ceccato: house painting and repairs in Tigre and Zona Norte (Buenos Aires), and drum lessons at home or online.

Built with [Astro](https://astro.build), hand-written CSS and no client-side JavaScript. All content lives in the HTML so search engines and AI crawlers can read it.

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # static output in dist/
npm test          # checks the built HTML (run build first)
npm run verify    # build + test
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://diegoceccato.com.ar` | Public origin used for canonical URLs, sitemap, robots and structured data |
| `BASE_PATH` | `/` | Path prefix for internal links and assets (GitHub Pages project sites need `/<repo>/`) |
| `PUBLIC_PREVIEW` | unset | Set to `1` to add `noindex` and close `robots.txt` on provisional deployments |

`src/data/contacto.ts` is the single source of truth for phone, hours, service areas and the pre-filled WhatsApp message of every page.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds, tests and publishes to GitHub Pages. The workflow currently targets the provisional URL; once the domain is live, update its environment variables as noted in the file.
