/**
 * The paint chips of the "Muestrario" home: one per page. Drum lessons left the
 * site on 2026-11-04 (Diego no longer teaches), so there are two chips.
 * Shared by the K variations under pages/variantes/ so only the layout and the
 * motion differ between them.
 */
import { ruta } from "../data/sitio";

export interface Muestra {
  href: string;
  /** Colour class suffix: azul or naranja. */
  clase: "azul" | "naranja";
  codigo: string;
  nombre: string;
  texto: string;
  /** Paint-catalogue name for the colour, as printed on a chip. */
  tono: string;
}

export const muestras: Muestra[] = [
  {
    href: ruta("/pintura/"),
    clase: "azul",
    codigo: "01",
    nombre: "Pintura",
    texto: "Interiores, exteriores y frentes, hierro y madera. 30 años de oficio.",
    tono: "Látex azul",
  },
  {
    href: ruta("/arreglos-del-hogar/"),
    clase: "naranja",
    codigo: "02",
    nombre: "Arreglos del hogar",
    texto: "Plomería, carpintería, herrería y colocaciones.",
    tono: "Naranja",
  },
];
