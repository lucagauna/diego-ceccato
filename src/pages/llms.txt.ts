import type { APIRoute } from "astro";
import { HORARIO, INSTAGRAM, TELEFONO, ZONAS } from "../data/contacto";
import { urlAbsoluta } from "../data/sitio";

export const GET: APIRoute = () => {
  const texto = `# Diego Ceccato

> Pintor con 30 años de oficio en Tigre y Zona Norte del Gran Buenos Aires. Trabaja solo: el que presupuesta hace el trabajo. Atiende por WhatsApp al ${TELEFONO.visible} (https://wa.me/${TELEFONO.e164}), ${HORARIO.toLowerCase()}.

## Pintura y arreglos para la casa

- [Pintura](${urlAbsoluta("/pintura/")}): interiores, exteriores y frentes, rejas, portones y aberturas de hierro y madera. Repara grietas y humedad antes de pintar.
- [Arreglos del hogar](${urlAbsoluta("/arreglos-del-hogar/")}): plomería, carpintería, herrería, puertas y cerraduras, colocaciones, quinchos y parrillas.
- Zonas: ${ZONAS.join(", ")}.
- Presupuesto: mandar una foto por WhatsApp. No publica precios.

## Datos de contacto

- WhatsApp: +54 9 11 3488-3317
- Horario: ${HORARIO}
- Instagram: ${INSTAGRAM}
- Sitio: ${urlAbsoluta("/")}
`;
  return new Response(texto, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
