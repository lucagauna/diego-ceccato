/** Single source of truth for how people reach Diego. Every page and profile must match these values. */

export const NOMBRE = "Diego Ceccato";

export const TELEFONO = {
  /** How the number is written on screen. */
  visible: "11 3488 3317",
  /** International format without "+", as wa.me and tel: links expect it. */
  e164: "5491134883317",
} as const;

export const HORARIO = "Lunes a viernes de 8 a 17";

export const ZONAS = [
  "Vicente López",
  "San Isidro",
  "San Fernando",
  "Tigre",
  "Nordelta",
  "Benavídez",
  "Malvinas Argentinas",
] as const;

/** The service areas as a sentence: "A, B y C" or "A, B o C". */
export function listarZonas(conector: "y" | "o" = "y"): string {
  return ZONAS.join(", ").replace(/, ([^,]*)$/, ` ${conector} $1`);
}

/**
 * Pre-filled WhatsApp message per origin.
 * Each one is different on purpose: it tells Diego where the chat came from.
 */
export const MENSAJES = {
  inicio: "Hola Diego, te escribo desde tu página",
  pintura: "Hola Diego, quiero pedirte un presupuesto de pintura",
  arreglos: "Hola Diego, quiero pedirte un presupuesto para un arreglo en casa",
  trabajos: "Hola Diego, vi tus trabajos y quiero pedirte un presupuesto",
  bateria: "Hola Diego, quiero info sobre las clases de batería",
  google: "Hola Diego, te encontré en Google",
} as const;

export type Origen = keyof typeof MENSAJES;

export function linkWhatsApp(origen: Origen): string {
  return `https://wa.me/${TELEFONO.e164}?text=${encodeURIComponent(MENSAJES[origen])}`;
}

export function linkTelefono(): string {
  return `tel:+${TELEFONO.e164}`;
}
