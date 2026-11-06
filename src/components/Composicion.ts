/**
 * Geometry of the images Diego posts on Instagram: canvas formats, where each photo goes,
 * and how a photo is framed inside its cell.
 * Pure numbers, no canvas: the tool pages draw with these and the tests check them.
 */

export interface Lienzo {
  ancho: number;
  alto: number;
}

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Instagram's 4:5 portrait post, the tallest a feed post can be. */
export const LIENZO: Lienzo = { ancho: 1080, alto: 1350 };

/** Height of the signature band at the bottom of a before/after image. */
export const PIE = 120;

/** White rule between the two photos. */
const SEPARACION = 6;

/** "original" follows the first photo; Instagram gives every slide of a post that same shape. */
export type Formato = "vertical" | "cuadrado" | "original";

/**
 * The tallest and the widest shapes Instagram accepts, as width / height.
 * 3:4 is what phone cameras shoot; Instagram takes it uncropped since May 2025.
 */
const PROPORCION = { minima: 3 / 4, maxima: 1.91 };

/** Canvas size for a format. Without a photo yet, "original" starts as the vertical post. */
export function lienzoPara(formato: Formato, primeraFoto?: Lienzo): Lienzo {
  if (formato === "cuadrado") return { ancho: LIENZO.ancho, alto: LIENZO.ancho };
  if (formato === "vertical" || !primeraFoto) return { ...LIENZO };
  const proporcion = Math.min(PROPORCION.maxima, Math.max(PROPORCION.minima, primeraFoto.ancho / primeraFoto.alto));
  return { ancho: LIENZO.ancho, alto: Math.round(LIENZO.ancho / proporcion) };
}

/** "lado": side by side, for portrait photos. "apilado": one above the other, for landscape photos. */
export type Disposicion = "lado" | "apilado";

/** Where the before photo and the after photo go, in that order. */
export function celdas(disposicion: Disposicion, lienzo: Lienzo = LIENZO, pie: number = PIE): [Rect, Rect] {
  const alto = lienzo.alto - pie;
  if (disposicion === "lado") {
    const ancho = (lienzo.ancho - SEPARACION) / 2;
    return [
      { x: 0, y: 0, ancho, alto },
      { x: ancho + SEPARACION, y: 0, ancho, alto },
    ];
  }
  const mitad = (alto - SEPARACION) / 2;
  return [
    { x: 0, y: 0, ancho: lienzo.ancho, alto: mitad },
    { x: 0, y: mitad + SEPARACION, ancho: lienzo.ancho, alto: mitad },
  ];
}

/** Portrait photos lose the least side by side; landscape photos, stacked. */
export function disposicionSugerida(anchoFoto: number, altoFoto: number): Disposicion {
  return altoFoto >= anchoFoto ? "lado" : "apilado";
}

/**
 * How a photo sits in its cell. `zoom` 1 fills the cell with as much photo as possible;
 * `cx`, `cy` are the point of the photo at the centre of the cell, from 0 to 1.
 */
export interface Encuadre {
  zoom: number;
  cx: number;
  cy: number;
}

export const CENTRADO: Encuadre = { zoom: 1, cx: 0.5, cy: 0.5 };

export const ZOOM_MAX = 4;

const entre = (valor: number, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, valor));

/** The part of the photo, in photo pixels, that is visible in the cell at this zoom. */
function visible(anchoFoto: number, altoFoto: number, celda: Rect, zoom: number): Lienzo {
  return {
    ancho: Math.min(anchoFoto, (celda.ancho * altoFoto) / celda.alto) / zoom,
    alto: Math.min(altoFoto, (celda.alto * anchoFoto) / celda.ancho) / zoom,
  };
}

/** The same framing, corrected so the photo always covers the whole cell. */
function ajustar(encuadre: Encuadre, anchoFoto: number, altoFoto: number, celda: Rect): Encuadre {
  const zoom = entre(encuadre.zoom, 1, ZOOM_MAX);
  const v = visible(anchoFoto, altoFoto, celda, zoom);
  const mitadX = v.ancho / anchoFoto / 2;
  const mitadY = v.alto / altoFoto / 2;
  return { zoom, cx: entre(encuadre.cx, mitadX, 1 - mitadX), cy: entre(encuadre.cy, mitadY, 1 - mitadY) };
}

/** The part of a photo that fills the cell without stretching it. Centred unless a framing is given. */
export function recorte(anchoFoto: number, altoFoto: number, celda: Rect, encuadre: Encuadre = CENTRADO): Rect {
  const e = ajustar(encuadre, anchoFoto, altoFoto, celda);
  const v = visible(anchoFoto, altoFoto, celda, e.zoom);
  const ancho = Math.min(anchoFoto, Math.round(v.ancho));
  const alto = Math.min(altoFoto, Math.round(v.alto));
  return {
    x: entre(Math.round(e.cx * anchoFoto - v.ancho / 2), 0, anchoFoto - ancho),
    y: entre(Math.round(e.cy * altoFoto - v.alto / 2), 0, altoFoto - alto),
    ancho,
    alto,
  };
}

/** Drag the photo by a distance in canvas pixels: the photo follows the finger. */
export function mover(encuadre: Encuadre, dx: number, dy: number, anchoFoto: number, altoFoto: number, celda: Rect): Encuadre {
  const e = ajustar(encuadre, anchoFoto, altoFoto, celda);
  const v = visible(anchoFoto, altoFoto, celda, e.zoom);
  const cx = e.cx - (dx * v.ancho) / celda.ancho / anchoFoto;
  const cy = e.cy - (dy * v.alto) / celda.alto / altoFoto;
  return ajustar({ zoom: e.zoom, cx, cy }, anchoFoto, altoFoto, celda);
}

/** Multiply the zoom by a factor, keeping the photo inside the cell. */
export function acercar(encuadre: Encuadre, factor: number, anchoFoto: number, altoFoto: number, celda: Rect): Encuadre {
  return ajustar({ ...encuadre, zoom: encuadre.zoom * factor }, anchoFoto, altoFoto, celda);
}
