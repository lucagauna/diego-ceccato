# Sitio de Diego Ceccato

Static site for Diego Ceccato: house painting and repairs in Tigre and Zona Norte (Buenos Aires).

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

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds, tests and publishes to GitHub Pages at the custom domain. The same workflow runs every hour to bring in Diego's new posts.

## Diego's job posts

Diego publishes his finished jobs himself, and nobody reviews them.

| Piece | Where | What it does |
|---|---|---|
| Database | Supabase project `qfadhlmcuwlgpxjukanu`; schema and rules in `supabase/trabajos.sql` | Table `trabajos`, public bucket `trabajos`, and the list of users who may publish |
| Upload page | `/publicar-trabajo/` (hidden: never indexed, out of the sitemap, linked from nowhere) | Sign in, pick photos, kind of job, neighbourhood, publish; also lists and deletes posts |
| Build step | `scripts/traer-trabajos.mjs`, run by `npm run build` and `npm run dev` | Reads the posts, downloads the photos into `public/img/publicados/` and writes `src/data/trabajos.generado.json` (both ignored by git) |
| Public pages | `/trabajos/` and `/trabajos/<post>/` | Plain HTML built from that file; no JavaScript, and nothing is loaded from the database on a visit |

Things to know:

- **A post goes live on the next build**, at most an hour later. To publish it at once, run the workflow by hand from the Actions tab.
- **The build fails if the database cannot be read.** That is on purpose: a failed read must never publish an empty section over the posts that are live. A free Supabase project pauses after a week with too little activity; restore it from the Supabase dashboard and run the workflow again.
- **GitHub switches the hourly schedule off after 60 days without activity in the repository.** Re-enable it from the Actions tab.
- **Who may publish** is a list of user ids in `private.autores`, a table the API cannot reach. Sign-ups are off in the dashboard. To add a person: create the user in Authentication → Users, then run step 5 of `supabase/trabajos.sql` with their email.
- **Only the publishable key is in the code** (`src/data/trabajos.ts`). The secret key and the database password never enter the repository.
- The jobs section is linked from the footer, listed in the sitemap and in `llms.txt` only once there is a post to show.
