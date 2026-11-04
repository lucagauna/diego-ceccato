/**
 * The example conversations shown on each service page. The visitor's first
 * line is the real pre-filled WhatsApp message; Diego's lines are his own words
 * from the form.
 */
import { MENSAJES } from "../data/contacto";

export const chatPintura = [
  { de: "vos" as const, texto: MENSAJES.pintura },
  { de: "diego" as const, texto: "Hola. Mandame una foto de lo que hay que pintar y te paso presupuesto." },
  { de: "vos" as const, foto: true },
  { de: "diego" as const, texto: "Listo, te paso presupuesto." },
];

export const chatArreglos = [
  { de: "vos" as const, texto: MENSAJES.arreglos },
  { de: "diego" as const, texto: "Hola. Mandame una foto y te digo si lo hago y cuánto sale." },
  { de: "vos" as const, foto: true },
];
