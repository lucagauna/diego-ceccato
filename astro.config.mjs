// @ts-check
import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import sitemap from "@astrojs/sitemap";

// Final home by default. The GitHub Pages preview sets both variables in the workflow.
const site = process.env.PUBLIC_SITE_URL ?? "https://diegoceccato.com.ar";
const base = process.env.BASE_PATH ?? "/";

/** How many posts the build brought from the database (scripts/traer-trabajos.mjs runs first). */
function trabajosPublicados() {
  try {
    return JSON.parse(readFileSync(new URL("./src/data/trabajos.generado.json", import.meta.url), "utf8")).trabajos.length;
  } catch {
    return 0;
  }
}

// Diego's own tools are not public pages, and neither is the jobs section while it is empty.
const ocultas = ["/armar-", "/publicar-trabajo/", ...(trabajosPublicados() === 0 ? ["/trabajos/"] : [])];

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [sitemap({ filter: (pagina) => !ocultas.some((oculta) => pagina.includes(oculta)) })],
});
