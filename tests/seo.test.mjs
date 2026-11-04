import { test } from "node:test";
import assert from "node:assert/strict";
import { RAIZ as SITIO, PREVIEW, leer } from "./entorno.mjs";

const paginas = ["", "pintura/", "arreglos-del-hogar/", "clases-de-bateria/"];

/** Every <script> must be JSON-LD; anything else is JavaScript we promised not to ship. */
const scripts = (html) => [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const jsonLd = (html) =>
  scripts(html)
    .filter(([, attrs]) => /type="application\/ld\+json"/.test(attrs))
    .map(([, , cuerpo]) => JSON.parse(cuerpo));

for (const ruta of paginas) {
  const nombre = ruta || "home";

  test(`${nombre}: the only scripts are JSON-LD`, async () => {
    const html = await leer(`${ruta}index.html`);
    for (const [, attrs] of scripts(html)) assert.match(attrs, /type="application\/ld\+json"|data-antes-despues/);
  });

  test(`${nombre}: Open Graph tags and canonical are present`, async () => {
    const html = await leer(`${ruta}index.html`);
    if (PREVIEW) assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    else assert.doesNotMatch(html, /noindex/);
    assert.match(html, /<meta property="og:title" content="[^"]+"/);
    assert.match(html, /<meta property="og:description" content="[^"]+"/);
    assert.match(html, new RegExp(`<meta property="og:url" content="${SITIO}/${ruta}"`));
    assert.match(html, /<meta property="og:locale" content="es_AR"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="${SITIO}/${ruta}"`));
  });
}

for (const ruta of ["pintura/", "arreglos-del-hogar/"]) {
  test(`${ruta}: one HousePainter JSON-LD with phone, hours and service area`, async () => {
    const datos = jsonLd(await leer(`${ruta}index.html`));
    assert.equal(datos.length, 1);
    const negocio = datos[0];
    assert.equal(negocio["@context"], "https://schema.org");
    assert.equal(negocio["@type"], "HousePainter");
    assert.equal(negocio.name, "Diego Ceccato");
    assert.equal(negocio.telephone, "+5491134883317");
    assert.equal(negocio.url, `${SITIO}/pintura/`);
    assert.ok(Array.isArray(negocio.areaServed) && negocio.areaServed.length >= 7);
    const horario = negocio.openingHoursSpecification;
    assert.deepEqual(horario.dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    assert.equal(horario.opens, "08:00");
    assert.equal(horario.closes, "17:00");
    assert.equal(negocio.address.addressLocality, "Tigre");
    assert.equal(negocio.address.addressCountry, "AR");
    assert.ok(!("streetAddress" in negocio.address), "home address must never be published");
  });
}

test("clases-de-bateria/: Service JSON-LD provided by Diego, online and at home", async () => {
  const datos = jsonLd(await leer("clases-de-bateria/index.html"));
  assert.equal(datos.length, 1);
  const servicio = datos[0];
  assert.equal(servicio["@type"], "Service");
  assert.equal(servicio.serviceType, "Clases de batería");
  assert.equal(servicio.provider["@id"], `${SITIO}/#diego`);
  assert.equal(servicio.url, `${SITIO}/clases-de-bateria/`);
  assert.ok(Array.isArray(servicio.areaServed) && servicio.areaServed.length >= 7);
  assert.ok(servicio.availableChannel.some((c) => c.serviceUrl === `${SITIO}/clases-de-bateria/`), "online channel must be declared");
});

test("home: Person JSON-LD for Diego", async () => {
  const datos = jsonLd(await leer("index.html"));
  assert.equal(datos.length, 1);
  assert.equal(datos[0]["@type"], "Person");
  assert.equal(datos[0].name, "Diego Ceccato");
});

test("robots.txt allows search and AI crawlers and points to the sitemap", { skip: PREVIEW && "preview builds close robots.txt" }, async () => {
  const robots = await leer("robots.txt");
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
    assert.match(robots, new RegExp(`User-agent: ${bot}\\s+Allow: /`), `${bot} must be allowed`);
  }
  assert.doesNotMatch(robots, /Disallow: \/\s*$/m);
  assert.match(robots, new RegExp(`Sitemap: ${SITIO}/sitemap-index\\.xml`));
});

test("preview builds close robots.txt to every crawler", { skip: !PREVIEW && "only on preview builds" }, async () => {
  const robots = await leer("robots.txt");
  assert.match(robots, /User-agent: \*\s+Disallow: \//);
});

test("sitemap lists every built page with its canonical URL", async () => {
  const indice = await leer("sitemap-index.xml");
  assert.match(indice, new RegExp(`${SITIO}/sitemap-0\\.xml`));
  const mapa = await leer("sitemap-0.xml");
  for (const ruta of paginas) assert.match(mapa, new RegExp(`<loc>${SITIO}/${ruta}</loc>`));
});

test("llms.txt describes both businesses and links the service pages", async () => {
  const llms = await leer("llms.txt");
  assert.match(llms, /^# Diego Ceccato/m);
  assert.match(llms, /pintura/i);
  assert.match(llms, /batería/i);
  assert.match(llms, new RegExp(`${SITIO}/pintura/`));
  assert.match(llms, /5491134883317|11 3488 3317/);
});
