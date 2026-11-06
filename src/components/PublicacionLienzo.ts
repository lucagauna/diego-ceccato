/**
 * Draws one slide of an Instagram post on a canvas, in Diego's brand.
 * The geometry and the text breaking live in Composicion.ts and Renglones.ts; this file only paints.
 */
import { PIE, celdas, recorte, type Disposicion, type Encuadre, type Lienzo, type Rect } from "./Composicion";
import { marcar, partir, type Palabra } from "./Renglones";

export interface Foto {
  fuente: CanvasImageSource;
  ancho: number;
  alto: number;
  encuadre: Encuadre;
}

export type Fondo = "negro" | "blanco" | "azul" | "naranja";

export type Placa =
  | { tipo: "foto"; foto?: Foto; titulo: string; texto: string }
  | { tipo: "antes-despues"; antes?: Foto; despues?: Foto; disposicion: Disposicion }
  | { tipo: "texto"; etiqueta: string; titulo: string; texto: string; fondo: Fondo }
  | { tipo: "cierre"; titulo: string };

export type Tipo = Placa["tipo"];

/** Which photo of a slide: the only one, or one of the before/after pair. */
export type Clave = "foto" | "antes" | "despues";

/** What every slide signs with. It comes from the site's contact data, never typed in the tool. */
export interface Marca {
  logo: HTMLImageElement | null;
  nombre: string;
  usuario: string;
  telefono: string;
  horario: string;
  zonas: string;
}

/* The site's design tokens (src/styles/global.css). A canvas cannot read CSS variables. */
const ESCENARIO = "#101010";
const ESCENARIO_2 = "#1c1c1c";
const ESCENARIO_LINEA = "#303030";
const TIZA = "#e8e6df";
const TIZA_SUAVE = "#aeb4bf";
const NARANJA = "#ee7106";
const NARANJA_TEXTO = "#a84b00";
const TINTA_NARANJA = "#1a1405";
const AZUL = "#1b4b86";
const PARED = "#ffffff";
const TINTA = "#23282d";
const TINTA_SUAVE = "#5a6168";
const WA_TIZA = "#4cc77a";

const TITULO = '"Barlow Condensed", "Arial Narrow", Arial, sans-serif';
const TEXTO = '"Barlow", "Helvetica Neue", Arial, sans-serif';

/** Side margin of every slide. */
const MARGEN = 72;

interface Colores {
  fondo: string;
  texto: string;
  suave: string;
  resaltado: string;
  /** On a colour fill no second colour passes contrast, so the highlight is an underline. */
  subrayado: boolean;
}

const FONDOS: Record<Fondo, Colores> = {
  negro: { fondo: ESCENARIO, texto: TIZA, suave: TIZA_SUAVE, resaltado: NARANJA, subrayado: false },
  blanco: { fondo: PARED, texto: TINTA, suave: TINTA_SUAVE, resaltado: NARANJA_TEXTO, subrayado: false },
  azul: { fondo: AZUL, texto: TIZA, suave: TIZA, resaltado: TIZA, subrayado: true },
  naranja: { fondo: NARANJA, texto: TINTA_NARANJA, suave: TINTA_NARANJA, resaltado: TINTA_NARANJA, subrayado: true },
};

/** Sizes are drawn for the vertical post and shrink on shorter formats. */
const escala = (lienzo: Lienzo) => Math.min(1, lienzo.alto / 1200);

/** The photo cells of a slide, in the order the tool lists them. */
export function huecos(placa: Placa, lienzo: Lienzo): { clave: Clave; celda: Rect }[] {
  if (placa.tipo === "foto") return [{ clave: "foto", celda: { x: 0, y: 0, ancho: lienzo.ancho, alto: lienzo.alto } }];
  if (placa.tipo === "antes-despues") {
    // No band is reserved: the photos run to the bottom edge and the signature sits over them.
    const [antes, despues] = celdas(placa.disposicion, lienzo, 0);
    return [
      { clave: "antes", celda: antes },
      { clave: "despues", celda: despues },
    ];
  }
  return [];
}

/** The photo in a cell of a slide, if it has been chosen. */
export function fotoDe(placa: Placa, clave: Clave): Foto | undefined {
  if (placa.tipo === "foto") return placa.foto;
  if (placa.tipo === "antes-despues" && clave !== "foto") return placa[clave];
  return undefined;
}

const altoBanda = (lienzo: Lienzo) => Math.max(84, Math.round(PIE * escala(lienzo)));

/* ---------- text ---------- */

interface Estilo {
  familia: string;
  peso: number;
  tamano: number;
  /** Smallest size the text may shrink to before it is cut. */
  minimo: number;
  interlinea: number;
  maxRenglones: number;
  color: string;
  resaltado: string;
  subrayado: boolean;
}

interface Bloque {
  renglones: Palabra[][];
  estilo: Estilo;
  tamano: number;
  alto: number;
}

const fuente = (estilo: Estilo, tamano: number) => `${estilo.peso} ${tamano}px ${estilo.familia}`;

/** Break a text to a width, shrinking it until it fits its allowed lines. */
function componer(ctx: CanvasRenderingContext2D, texto: string, estilo: Estilo, ancho: number): Bloque {
  const parrafos = marcar(texto);
  let tamano = estilo.tamano;
  let renglones: Palabra[][] = [];
  for (;;) {
    ctx.font = fuente(estilo, tamano);
    renglones = parrafos.flatMap((parrafo) => partir(parrafo, (t) => ctx.measureText(t).width, ancho));
    if (renglones.length <= estilo.maxRenglones || tamano <= estilo.minimo) break;
    tamano = Math.max(estilo.minimo, tamano - 4);
  }
  renglones = renglones.slice(0, estilo.maxRenglones);
  return { renglones, estilo, tamano, alto: renglones.length * tamano * estilo.interlinea };
}

/** Draw a composed text with its top at `y`. `ancho` is only needed to centre it. */
function escribir(ctx: CanvasRenderingContext2D, bloque: Bloque, x: number, y: number, centrado?: { ancho: number }) {
  const { estilo, tamano } = bloque;
  ctx.font = fuente(estilo, tamano);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const espacio = ctx.measureText(" ").width;
  const altoRenglon = tamano * estilo.interlinea;
  bloque.renglones.forEach((renglon, i) => {
    const anchos = renglon.map((p) => ctx.measureText(p.texto).width);
    const total = anchos.reduce((suma, a) => suma + a, 0) + espacio * (renglon.length - 1);
    let cursor = centrado ? x + (centrado.ancho - total) / 2 : x;
    const base = y + i * altoRenglon + (altoRenglon - tamano) / 2 + tamano * 0.82;
    renglon.forEach((palabra, j) => {
      ctx.fillStyle = palabra.resaltada ? estilo.resaltado : estilo.color;
      ctx.fillText(palabra.texto, cursor, base);
      if (palabra.resaltada && estilo.subrayado) {
        // The underline runs under the space too when the next word is also highlighted.
        const sigue = renglon[j + 1]?.resaltada ? espacio : 0;
        ctx.fillRect(cursor, base + tamano * 0.1, anchos[j] + sigue, Math.max(3, tamano * 0.07));
      }
      cursor += anchos[j] + espacio;
    });
  });
}

/* ---------- pieces shared by the slides ---------- */

function dibujarFoto(ctx: CanvasRenderingContext2D, foto: Foto, celda: Rect) {
  const parte = recorte(foto.ancho, foto.alto, celda, foto.encuadre);
  ctx.drawImage(foto.fuente, parte.x, parte.y, parte.ancho, parte.alto, celda.x, celda.y, celda.ancho, celda.alto);
}

/** A cell still waiting for its photo. The tool refuses to export while one of these is showing. */
function dibujarVacia(ctx: CanvasRenderingContext2D, celda: Rect, leyenda: string, k: number) {
  ctx.fillStyle = ESCENARIO_2;
  ctx.fillRect(celda.x, celda.y, celda.ancho, celda.alto);
  ctx.strokeStyle = ESCENARIO_LINEA;
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 14]);
  ctx.strokeRect(celda.x + 24, celda.y + 24, celda.ancho - 48, celda.alto - 48);
  ctx.setLineDash([]);
  ctx.fillStyle = TIZA_SUAVE;
  ctx.font = `600 ${Math.round(34 * k)}px ${TEXTO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(leyenda, celda.x + celda.ancho / 2, celda.y + celda.alto / 2);
  ctx.textAlign = "left";
}

/**
 * The handle at the bottom left and, unless it is the last slide, the cue to keep swiping.
 * `conMarca` puts the DC mark before the handle; the mark is drawn for dark surfaces, so only ask for it there.
 */
function firmar(ctx: CanvasRenderingContext2D, lienzo: Lienzo, marca: Marca, color: string, ultima: boolean, conMarca = false) {
  const k = escala(lienzo);
  const tamano = Math.round(28 * k);
  const y = lienzo.alto - Math.round(56 * k);
  let x = MARGEN;
  if (conMarca && marca.logo) {
    const alto = Math.round(56 * k);
    const ancho = (alto * marca.logo.naturalWidth) / marca.logo.naturalHeight;
    // Centred on the handle's lowercase letters, so mark and handle read as one line.
    ctx.drawImage(marca.logo, x, y - tamano * 0.36 - alto / 2, ancho, alto);
    x += ancho + Math.round(16 * k);
  }
  ctx.font = `600 ${tamano}px ${TEXTO}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText(marca.usuario, x, y);
  if (!ultima) {
    ctx.textAlign = "right";
    ctx.fillText("Deslizá →", lienzo.ancho - MARGEN, y);
    ctx.textAlign = "left";
  }
}

/* ---------- the four slides ---------- */

function pintarFoto(ctx: CanvasRenderingContext2D, placa: Extract<Placa, { tipo: "foto" }>, lienzo: Lienzo, marca: Marca, ultima: boolean) {
  const k = escala(lienzo);
  const todo = { x: 0, y: 0, ancho: lienzo.ancho, alto: lienzo.alto };
  if (placa.foto) dibujarFoto(ctx, placa.foto, todo);
  else dibujarVacia(ctx, todo, "Elegí una foto", k);

  const ancho = lienzo.ancho - MARGEN * 2;
  const titulo = componer(ctx, placa.titulo, { familia: TITULO, peso: 700, tamano: Math.round(88 * k), minimo: Math.round(52 * k), interlinea: 1.04, maxRenglones: 4, color: TIZA, resaltado: NARANJA, subrayado: false }, ancho);
  const texto = componer(ctx, placa.texto, { familia: TEXTO, peso: 400, tamano: Math.round(34 * k), minimo: Math.round(28 * k), interlinea: 1.35, maxRenglones: 4, color: TIZA, resaltado: NARANJA, subrayado: false }, ancho);
  const separacion = titulo.alto && texto.alto ? Math.round(20 * k) : 0;
  const altoTexto = titulo.alto + separacion + texto.alto;
  const fin = lienzo.alto - Math.round(128 * k);
  const inicio = fin - altoTexto;

  // The only gradient the brand allows: the one that melts a photo into the text below it.
  const sombra = ctx.createLinearGradient(0, 0, 0, lienzo.alto);
  const desde = Math.max(0, (altoTexto ? inicio - 200 * k : lienzo.alto - 260 * k) / lienzo.alto);
  sombra.addColorStop(desde, "rgba(16,16,16,0)");
  if (altoTexto) sombra.addColorStop(Math.min(0.98, Math.max(desde + 0.01, inicio / lienzo.alto)), "rgba(16,16,16,.84)");
  sombra.addColorStop(1, altoTexto ? "rgba(16,16,16,.96)" : "rgba(16,16,16,.78)");
  ctx.fillStyle = sombra;
  ctx.fillRect(0, 0, lienzo.ancho, lienzo.alto);

  escribir(ctx, titulo, MARGEN, inicio);
  escribir(ctx, texto, MARGEN, inicio + titulo.alto + separacion);
  // The gradient leaves the bottom of the photo dark, so the mark for dark surfaces fits here.
  firmar(ctx, lienzo, marca, TIZA, ultima, true);
}

function pintarAntesDespues(ctx: CanvasRenderingContext2D, placa: Extract<Placa, { tipo: "antes-despues" }>, lienzo: Lienzo, marca: Marca) {
  const k = escala(lienzo);
  ctx.fillStyle = PARED;
  ctx.fillRect(0, 0, lienzo.ancho, lienzo.alto);

  const etiquetas = {
    antes: { texto: "ANTES", fondo: ESCENARIO, color: TIZA, vacia: "Foto de antes" },
    despues: { texto: "DESPUÉS", fondo: NARANJA, color: TINTA_NARANJA, vacia: "Foto de después" },
  };
  for (const { clave, celda } of huecos(placa, lienzo)) {
    if (clave === "foto") continue;
    const foto = placa[clave];
    const etiqueta = etiquetas[clave];
    if (foto) dibujarFoto(ctx, foto, celda);
    else dibujarVacia(ctx, celda, etiqueta.vacia, k);
    const tamano = Math.round(54 * k);
    ctx.font = `700 ${tamano}px ${TITULO}`;
    ctx.textBaseline = "middle";
    const anchoEtiqueta = ctx.measureText(etiqueta.texto).width + tamano * 0.8;
    ctx.fillStyle = etiqueta.fondo;
    ctx.fillRect(celda.x + 28, celda.y + 28, anchoEtiqueta, tamano * 1.4);
    ctx.fillStyle = etiqueta.color;
    ctx.fillText(etiqueta.texto, celda.x + 28 + tamano * 0.4, celda.y + 28 + tamano * 0.74);
  }

  // The signature: the mark is never alone, it sits next to the name. It lies over the photos,
  // on a soft shade instead of a solid band, so the before and after are seen as whole as possible.
  const banda = altoBanda(lienzo);
  const y = lienzo.alto - banda;
  const b = banda / PIE;
  const sombra = ctx.createLinearGradient(0, lienzo.alto - banda * 2.2, 0, lienzo.alto);
  sombra.addColorStop(0, "rgba(16,16,16,0)");
  sombra.addColorStop(1, "rgba(16,16,16,.72)");
  ctx.fillStyle = sombra;
  ctx.fillRect(0, lienzo.alto - banda * 2.2, lienzo.ancho, banda * 2.2);
  const altoMarca = 60 * b;
  const anchoMarca = marca.logo ? (altoMarca * marca.logo.naturalWidth) / marca.logo.naturalHeight : 0;
  if (marca.logo) ctx.drawImage(marca.logo, 36, y + (banda - altoMarca) / 2, anchoMarca, altoMarca);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = TIZA;
  ctx.font = `700 ${Math.round(46 * b)}px ${TITULO}`;
  ctx.fillText(marca.nombre.toUpperCase(), 36 + anchoMarca + (marca.logo ? 24 * b : 0), y + banda / 2 + 2);
  // Over a photo the soft chalk gets lost on light areas, so the handle takes the full chalk.
  ctx.fillStyle = TIZA;
  ctx.font = `600 ${Math.round(30 * b)}px ${TEXTO}`;
  ctx.textAlign = "right";
  ctx.fillText(marca.usuario, lienzo.ancho - 36, y + banda / 2 + 2);
  ctx.textAlign = "left";
}

function pintarTexto(ctx: CanvasRenderingContext2D, placa: Extract<Placa, { tipo: "texto" }>, lienzo: Lienzo, marca: Marca, ultima: boolean) {
  const k = escala(lienzo);
  const colores = FONDOS[placa.fondo];
  ctx.fillStyle = colores.fondo;
  ctx.fillRect(0, 0, lienzo.ancho, lienzo.alto);

  const ancho = lienzo.ancho - MARGEN * 2;
  const comun = { color: colores.texto, resaltado: colores.resaltado, subrayado: colores.subrayado };
  const etiqueta = componer(ctx, placa.etiqueta.toUpperCase(), { ...comun, familia: TEXTO, peso: 600, tamano: Math.round(26 * k), minimo: Math.round(26 * k), interlinea: 1.3, maxRenglones: 1, color: colores.resaltado }, ancho);
  const titulo = componer(ctx, placa.titulo, { ...comun, familia: TITULO, peso: 700, tamano: Math.round(104 * k), minimo: Math.round(56 * k), interlinea: 1.02, maxRenglones: 6 }, ancho);
  const texto = componer(ctx, placa.texto, { ...comun, familia: TEXTO, peso: 400, tamano: Math.round(38 * k), minimo: Math.round(30 * k), interlinea: 1.4, maxRenglones: 8, color: colores.suave }, ancho);

  if (etiqueta.alto) {
    ctx.letterSpacing = "2px";
    escribir(ctx, etiqueta, MARGEN, Math.round(72 * k));
    ctx.letterSpacing = "0px";
  }
  const separacion = titulo.alto && texto.alto ? Math.round(32 * k) : 0;
  const alto = titulo.alto + separacion + texto.alto;
  const arriba = Math.round(150 * k);
  const abajo = lienzo.alto - Math.round(130 * k);
  const y = Math.max(arriba, arriba + (abajo - arriba - alto) / 2);
  escribir(ctx, titulo, MARGEN, y);
  escribir(ctx, texto, MARGEN, y + titulo.alto + separacion);
  firmar(ctx, lienzo, marca, colores.suave, ultima);
}

function pintarCierre(ctx: CanvasRenderingContext2D, placa: Extract<Placa, { tipo: "cierre" }>, lienzo: Lienzo, marca: Marca, ultima: boolean) {
  const k = escala(lienzo);
  ctx.fillStyle = ESCENARIO;
  ctx.fillRect(0, 0, lienzo.ancho, lienzo.alto);

  const ancho = lienzo.ancho - MARGEN * 2;
  const estilo = (familia: string, peso: number, tamano: number, color: string, maxRenglones = 1): Estilo => ({ familia, peso, tamano: Math.round(tamano * k), minimo: Math.round(tamano * k * 0.6), interlinea: 1.12, maxRenglones, color, resaltado: NARANJA, subrayado: false });
  const piezas: { bloque: Bloque; antes: number }[] = [
    { bloque: componer(ctx, marca.nombre.toUpperCase(), estilo(TITULO, 700, 44, TIZA), ancho), antes: 18 },
    { bloque: componer(ctx, placa.titulo, estilo(TITULO, 700, 104, TIZA, 3), ancho), antes: 56 },
    { bloque: componer(ctx, "Escribime por WhatsApp", estilo(TITULO, 700, 60, WA_TIZA), ancho), antes: 44 },
    { bloque: componer(ctx, marca.telefono, estilo(TITULO, 700, 128, TIZA), ancho), antes: 4 },
    { bloque: componer(ctx, marca.horario, estilo(TEXTO, 600, 32, TIZA_SUAVE), ancho), antes: 26 },
    { bloque: componer(ctx, marca.zonas, estilo(TEXTO, 400, 28, TIZA_SUAVE, 3), ancho), antes: 14 },
  ].filter((pieza) => pieza.bloque.alto > 0);

  const altoMarca = marca.logo ? Math.round(104 * k) : 0;
  const alto = altoMarca + piezas.reduce((suma, pieza) => suma + pieza.antes * k + pieza.bloque.alto, 0);
  let y = Math.max(Math.round(40 * k), (lienzo.alto - Math.round(70 * k) - alto) / 2);
  if (marca.logo) {
    const anchoMarca = (altoMarca * marca.logo.naturalWidth) / marca.logo.naturalHeight;
    ctx.drawImage(marca.logo, (lienzo.ancho - anchoMarca) / 2, y, anchoMarca, altoMarca);
    y += altoMarca;
  }
  for (const pieza of piezas) {
    y += pieza.antes * k;
    escribir(ctx, pieza.bloque, MARGEN, y, { ancho });
    y += pieza.bloque.alto;
  }
  firmar(ctx, lienzo, marca, TIZA_SUAVE, ultima);
}

/** Paint a slide. `ultima` is true for the last slide of the post, which has nothing to swipe to. */
export function pintar(ctx: CanvasRenderingContext2D, placa: Placa, lienzo: Lienzo, marca: Marca, ultima: boolean) {
  ctx.save();
  ctx.clearRect(0, 0, lienzo.ancho, lienzo.alto);
  if (placa.tipo === "foto") pintarFoto(ctx, placa, lienzo, marca, ultima);
  else if (placa.tipo === "antes-despues") pintarAntesDespues(ctx, placa, lienzo, marca);
  else if (placa.tipo === "texto") pintarTexto(ctx, placa, lienzo, marca, ultima);
  else pintarCierre(ctx, placa, lienzo, marca, ultima);
  ctx.restore();
}
