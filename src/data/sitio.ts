/**
 * Where the site lives. Defaults to the final domain; the GitHub Pages preview
 * overrides these through environment variables (see .github/workflows/deploy.yml).
 */

/** Public origin, no trailing slash. */
export const ORIGEN = (import.meta.env.PUBLIC_SITE_URL ?? "https://diegoceccato.com.ar").replace(/\/$/, "");

/** True on the provisional GitHub Pages build: adds noindex and closes robots.txt. */
export const PREVIEW = import.meta.env.PUBLIC_PREVIEW === "1";

/** Prefix every internal link and asset with the configured base path. */
export function ruta(path: `/${string}`): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

/** Absolute URL for a site-relative path, including the base path. */
export function urlAbsoluta(path: `/${string}`): string {
  return `${ORIGEN}${ruta(path)}`;
}
