/**
 * Runs before every build: brings Diego's posts from the database into the site.
 *
 * It writes src/data/trabajos.generado.json and downloads the photos into public/img/publicados/,
 * so the pages are plain HTML with their own images and a visitor never touches the database.
 *
 * If anything fails, it exits with an error and the build stops. A failed read must never
 * publish an empty section over the posts that are already live.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { BALDE, SUPABASE_CLAVE, SUPABASE_URL, direccionFoto, medidasJpeg, prepararTrabajos } from "../src/data/trabajos.ts";

const ESPERA = 30_000;
const salidaDatos = new URL("../src/data/trabajos.generado.json", import.meta.url);
const salidaFotos = new URL("../public/img/publicados/", import.meta.url);

async function pedir(url, opciones = {}) {
  const respuesta = await fetch(url, { ...opciones, signal: AbortSignal.timeout(ESPERA) });
  if (!respuesta.ok) throw new Error(`${respuesta.status} ${respuesta.statusText} from ${url}`);
  return respuesta;
}

const filas = await (
  await pedir(`${SUPABASE_URL}/rest/v1/trabajos?select=id,creado,tipo,barrio,texto,fotos&order=creado.desc`, {
    headers: { apikey: SUPABASE_CLAVE, Accept: "application/json" },
  })
).json();
if (!Array.isArray(filas)) throw new Error("The database did not return a list of posts");

const pendientes = prepararTrabajos(filas);

// Start clean, so a deleted post takes its photos with it.
await rm(salidaFotos, { recursive: true, force: true });
await mkdir(salidaFotos, { recursive: true });

const trabajos = [];
for (const trabajo of pendientes) {
  const fotos = [];
  for (const { origen, archivo } of trabajo.fotos) {
    const bytes = new Uint8Array(await (await pedir(direccionFoto(origen))).arrayBuffer());
    const { ancho, alto } = medidasJpeg(bytes);
    await writeFile(new URL(archivo, salidaFotos), bytes);
    fotos.push({ archivo, ancho, alto });
  }
  trabajos.push({ ...trabajo, fotos });
}

await writeFile(salidaDatos, JSON.stringify({ trabajos }, null, 2) + "\n");
console.log(`[trabajos] ${trabajos.length} post(s), ${trabajos.reduce((n, t) => n + t.fotos.length, 0)} photo(s) from the "${BALDE}" bucket`);
