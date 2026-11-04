// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Final home by default. The GitHub Pages preview sets both variables in the workflow.
const site = process.env.PUBLIC_SITE_URL ?? "https://diegoceccato.com.ar";
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [sitemap()],
});
