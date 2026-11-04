/** The same environment the build read, so tests check whatever variant was built. */
import { readFile, access } from "node:fs/promises";

export const ORIGEN = (process.env.PUBLIC_SITE_URL ?? "https://diegoceccato.com.ar").replace(/\/$/, "");
export const BASE = process.env.BASE_PATH ?? "/";
export const PREVIEW = process.env.PUBLIC_PREVIEW === "1";

/** Absolute URL prefix without trailing slash, e.g. https://host/diego-ceccato */
export const RAIZ = `${ORIGEN}${BASE}`.replace(/\/$/, "");

/** Turn an internal href like /diego-ceccato/pintura/ into the dist-relative path pintura/ */
export function rutaEnDist(href) {
  return href.startsWith(BASE) ? href.slice(BASE.length) : href.replace(/^\//, "");
}

export const dist = new URL("../dist/", import.meta.url);

/** Read a built page by its route ("" for home, "pintura/"), or any file by path. */
export const leer = (ruta) => readFile(new URL(ruta === "" || ruta.endsWith("/") ? `${ruta}index.html` : ruta, dist), "utf8");

/** Whether a built page or file exists. */
export const existe = (ruta) => access(new URL(ruta === "" || ruta.endsWith("/") ? `${ruta}index.html` : ruta, dist)).then(() => true, () => false);
