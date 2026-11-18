/**
 * Diego's job posts: where they live and how a database row becomes a post on the site.
 *
 * Pure on purpose, with no Astro or browser API: the build script, the pages, the upload page
 * and the tests all import it.
 */

/** The Supabase project. Both values are public by design; the database's own rules do the protecting. */
export const SUPABASE_URL = "https://qfadhlmcuwlgpxjukanu.supabase.co";
export const SUPABASE_CLAVE = "sb_publishable_7y7E_Muep0zEmFnc1JTOtA_xgYCSZW5";

/** The storage bucket with the photos. */
export const BALDE = "trabajos";

/** Longest side of an uploaded photo, in pixels. */
export const LADO_MAXIMO = 1600;

export const MAX_FOTOS = 10;
export const MAX_TEXTO = 600;

/** The kinds of job, as the database stores them, with the words that open a post's title. */
export const TIPOS = {
  interiores: "Pintura de interiores",
  exteriores: "Pintura de exteriores y frentes",
  "hierro-madera": "Pintura de hierro y madera",
  "grietas-humedad": "Reparación de grietas y humedad",
  arreglos: "Arreglos del hogar",
} as const;

export type Tipo = keyof typeof TIPOS;

/** A row of the `trabajos` table, as the database returns it. */
export interface Fila {
  id: string;
  creado: string;
  tipo: Tipo;
  barrio: string;
  texto: string;
  /** Paths inside the bucket, in the order they are shown. */
  fotos: string[];
}

/** A photo of a post, before it is downloaded: where it comes from and the file it becomes on the site. */
export interface FotoPendiente {
  origen: string;
  archivo: string;
}

/** A post ready for the site, except for the size of its photos, which is only known once downloaded. */
export interface Trabajo<F = FotoPendiente> {
  id: string;
  slug: string;
  titulo: string;
  tipo: Tipo;
  barrio: string;
  texto: string;
  fecha: string;
  fechaLarga: string;
  fotos: F[];
}

/** A photo as the pages use it. */
export interface Foto {
  archivo: string;
  ancho: number;
  alto: number;
}

export function tituloDe(tipo: Tipo, barrio: string): string {
  return `${TIPOS[tipo]} en ${barrio}`;
}

export function limpiarBarrio(barrio: string): string {
  return barrio.trim().replace(/\s+/g, " ");
}

/** Only a place name. Digits are refused so a street number never gets published; the database checks the same. */
export function barrioValido(barrio: string): boolean {
  const limpio = limpiarBarrio(barrio);
  return limpio.length >= 2 && limpio.length <= 40 && !/[0-9]/.test(limpio);
}

const formatoFecha = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

/** "18 de noviembre de 2026", on Diego's clock rather than the server's. */
export function fechaLarga(fecha: string): string {
  return formatoFecha.format(new Date(fecha));
}

/** The size a photo is shrunk to before upload: never enlarged, never reshaped. */
export function tamanoReducido(ancho: number, alto: number, ladoMaximo: number = LADO_MAXIMO): { ancho: number; alto: number } {
  const factor = Math.min(1, ladoMaximo / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}

/** What a photo path looks like: <user id>/<photo id>.jpg. The database enforces the same shape. */
const RUTA_FOTO = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;

/** The public address of a photo in the bucket. Anything that is not a photo path is refused, never fetched. */
export function direccionFoto(ruta: string): string {
  if (!RUTA_FOTO.test(ruta)) throw new Error(`Not a photo of the bucket: ${ruta}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BALDE}/${ruta}`;
}

/** Lowercase words joined by hyphens, without accents: "Villa La Ñata" → "villa-la-nata". */
function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Turn the rows into posts, newest first. A row the site does not understand throws:
 * the build must stop rather than publish something broken.
 */
export function prepararTrabajos(filas: Fila[]): Trabajo[] {
  return [...filas]
    .sort((a, b) => b.creado.localeCompare(a.creado))
    .map((fila) => {
      if (!(fila.tipo in TIPOS)) throw new Error(`Unknown kind of job "${fila.tipo}" in post ${fila.id}`);
      if (!barrioValido(fila.barrio)) throw new Error(`Invalid neighbourhood in post ${fila.id}`);
      if (fila.fotos.length < 1 || fila.fotos.length > MAX_FOTOS) throw new Error(`Post ${fila.id} has ${fila.fotos.length} photos`);
      const barrio = limpiarBarrio(fila.barrio);
      const titulo = tituloDe(fila.tipo, barrio);
      // The start of the id keeps the address unique and stable when two posts share a title.
      const slug = `${aSlug(titulo)}-${fila.id.slice(0, 8)}`;
      return {
        id: fila.id,
        slug,
        titulo,
        tipo: fila.tipo,
        barrio,
        texto: fila.texto.trim(),
        fecha: fila.creado,
        fechaLarga: fechaLarga(fila.creado),
        fotos: fila.fotos.map((origen, i) => {
          direccionFoto(origen);
          return { origen, archivo: `${slug}-${i + 1}.jpg` };
        }),
      };
    });
}

/** Width and height of a JPEG, read from its frame header. Throws if the bytes are not a JPEG. */
export function medidasJpeg(bytes: Uint8Array): { ancho: number; alto: number } {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("Not a JPEG");
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) throw new Error("Broken JPEG");
    const marca = bytes[i + 1];
    const largo = (bytes[i + 2] << 8) | bytes[i + 3];
    // The frame headers (SOF0 to SOF15) carry the size; C4, C8 and CC are other tables in the same range.
    if (marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
      return { alto: (bytes[i + 5] << 8) | bytes[i + 6], ancho: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    i += 2 + largo;
  }
  throw new Error("JPEG without a frame header");
}
