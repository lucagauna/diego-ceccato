/**
 * schema.org structured data. Only facts Diego confirmed go here.
 * The home address is never published: the business is service-area only.
 */
import { NOMBRE, TELEFONO, ZONAS } from "./contacto";

const SITIO = "https://diegoceccato.com.ar";

const areaServed = ZONAS.map((nombre) => ({
  "@type": "Place",
  name: nombre,
  address: { "@type": "PostalAddress", addressRegion: "Buenos Aires", addressCountry: "AR" },
}));

/** The home-services business, used by /pintura/ and /arreglos-del-hogar/. */
export function negocioHogar() {
  return {
    "@context": "https://schema.org",
    "@type": "HousePainter",
    "@id": `${SITIO}/#hogar`,
    name: NOMBRE,
    url: `${SITIO}/pintura/`,
    telephone: `+${TELEFONO.e164}`,
    description:
      "Pintura de interiores, exteriores y frentes, hierro y madera, y arreglos para la casa en Tigre y Zona Norte. 30 años de oficio.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tigre",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    areaServed,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "17:00",
    },
    founder: { "@id": `${SITIO}/#diego` },
  };
}

/** Drum lessons: a service provided by Diego, at home in Zona Norte or online anywhere. */
export function clasesBateria() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITIO}/#bateria`,
    serviceType: "Clases de batería",
    name: "Clases de batería con Diego Ceccato",
    url: `${SITIO}/clases-de-bateria/`,
    description:
      "Clases individuales de batería de una hora, a domicilio en Zona Norte u online. Rock, pop, funk, jazz y blues. Adolescentes desde 15 años y adultos.",
    provider: { "@id": `${SITIO}/#diego` },
    areaServed,
    availableChannel: [
      {
        "@type": "ServiceChannel",
        name: "A domicilio",
        availableLanguage: "es",
        servicePhone: `+${TELEFONO.e164}`,
      },
      {
        "@type": "ServiceChannel",
        name: "Online",
        serviceUrl: `${SITIO}/clases-de-bateria/`,
        availableLanguage: "es",
      },
    ],
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: 15,
    },
  };
}

/** Diego as a person, used by the home page. */
export function personaDiego() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITIO}/#diego`,
    name: NOMBRE,
    url: `${SITIO}/`,
    telephone: `+${TELEFONO.e164}`,
    jobTitle: ["Pintor", "Profesor de batería"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tigre",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
  };
}
