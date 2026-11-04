/** The same environment the build read, so tests check whatever variant was built. */
export const ORIGEN = (process.env.PUBLIC_SITE_URL ?? "https://diegoceccato.com.ar").replace(/\/$/, "");
export const BASE = process.env.BASE_PATH ?? "/";
export const PREVIEW = process.env.PUBLIC_PREVIEW === "1";

/** Absolute URL prefix without trailing slash, e.g. https://host/diego-ceccato */
export const RAIZ = `${ORIGEN}${BASE}`.replace(/\/$/, "");

/** Turn an internal href like /diego-ceccato/pintura/ into the dist-relative path pintura/ */
export function rutaEnDist(href) {
  const sinBase = href.startsWith(BASE) ? href.slice(BASE.length) : href.replace(/^\//, "");
  return sinBase;
}
