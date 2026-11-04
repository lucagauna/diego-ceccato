import type { APIRoute } from "astro";
import { HORARIO, TELEFONO, ZONAS } from "../data/contacto";
import { urlAbsoluta } from "../data/sitio";

export const GET: APIRoute = () => {
  const texto = `# Diego Ceccato

> Pintor con 30 años de oficio en Tigre y Zona Norte del Gran Buenos Aires, y profesor de batería con 25 años enseñando. Trabaja solo. Atiende por WhatsApp al ${TELEFONO.visible} (https://wa.me/${TELEFONO.e164}), ${HORARIO.toLowerCase()}.

Dos negocios separados, una sola persona:

## Pintura y arreglos para la casa

- [Pintura](${urlAbsoluta("/pintura/")}): interiores, exteriores y frentes, rejas, portones y aberturas de hierro y madera. Repara grietas y humedad antes de pintar.
- [Arreglos del hogar](${urlAbsoluta("/arreglos-del-hogar/")}): plomería, carpintería, herrería, puertas y cerraduras, colocaciones, quinchos y parrillas.
- Zonas: ${ZONAS.join(", ")}.
- Presupuesto: mandar una foto por WhatsApp. No publica precios.

## Clases de batería

- [Clases de batería](${urlAbsoluta("/clases-de-bateria/")}): individuales, de una hora, a domicilio en Zona Norte u online desde cualquier lugar. Rock, pop, funk, jazz y blues. Adolescentes desde 15 años y adultos.
- Trayectoria: 30 años tocando, 12 con Rinaldo Rafanelli y 3 con Omar Mollo. Escenarios como Cosquín Rock y Cemento.

## Datos de contacto

- WhatsApp: +54 9 11 3488-3317
- Horario: ${HORARIO}
- Sitio: ${urlAbsoluta("/")}
`;
  return new Response(texto, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
