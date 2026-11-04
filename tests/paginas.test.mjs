import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { BASE, rutaEnDist } from "./entorno.mjs";

const dist = new URL("../dist/", import.meta.url);
const leer = (ruta) => readFile(new URL(`${ruta}index.html`, dist), "utf8");
const existe = (ruta) => access(new URL(ruta.endsWith("/") || ruta === "" ? `${ruta}index.html` : ruta, dist)).then(() => true, () => false);

/** Pages linked from shared chrome that a later task still has to build. Empty means every link resolves. */
const todaviaNoConstruidas = new Set([]);

const paginas = {
  "pintura/": {
    origen: "Hola%20Diego%2C%20quiero%20pedirte%20un%20presupuesto%20de%20pintura",
    h1: /Pint/,
  },
  "arreglos-del-hogar/": {
    origen: "Hola%20Diego%2C%20quiero%20pedirte%20un%20presupuesto%20para%20un%20arreglo%20en%20casa",
    h1: /Arreglos/,
  },
  "clases-de-bateria/": {
    origen: "Hola%20Diego%2C%20quiero%20info%20sobre%20las%20clases%20de%20bater%C3%ADa",
    h1: /batería/,
  },
};

for (const [ruta, esperado] of Object.entries(paginas)) {
  test(`${ruta} is built as a directory index`, async () => {
    assert.ok(await existe(ruta), `dist/${ruta}index.html is missing`);
  });

  test(`${ruta} has one h1 naming the service and the zone`, async () => {
    const html = await leer(ruta);
    const h1s = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/g) ?? [];
    assert.equal(h1s.length, 1);
    assert.match(h1s[0], esperado.h1);
    assert.match(h1s[0], /Tigre|Zona Norte/);
  });

  test(`${ruta} WhatsApp buttons carry this page's own message`, async () => {
    const html = await leer(ruta);
    const links = html.match(/https:\/\/wa\.me\/5491134883317\?text=[^"']+/g) ?? [];
    assert.ok(links.length >= 2, "expected a hero button and a closing button at least");
    for (const link of links) assert.ok(link.endsWith(esperado.origen), `unexpected origin in ${link}`);
  });

  test(`${ruta} ships no JavaScript and no empty marketing phrases`, async () => {
    const html = await leer(ruta);
    for (const [, attrs] of html.matchAll(/<script([^>]*)>/gi)) assert.match(attrs, /type="application\/ld\+json"/);
    assert.doesNotMatch(html, /soluciones integrales|calidad garantizada|los mejores|de confianza|sin vueltas|jerarquía y excelencia/i);
  });

  test(`${ruta} internal links point to pages that exist in dist`, async () => {
    const html = await leer(ruta);
    const internos = [...html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]).filter((h) => !h.includes("/_astro/") && !h.endsWith(".svg"));
    for (const h of new Set(internos)) {
      assert.ok(h.startsWith(BASE), `${ruta} links to ${h}, outside the base path ${BASE}`);
      const local = rutaEnDist(h);
      if (todaviaNoConstruidas.has(local)) continue;
      assert.ok(await existe(local), `${ruta} links to ${h}, which is not built`);
    }
  });
}

test("the home page links to both businesses", async () => {
  const html = await leer("");
  assert.ok(html.includes(`href="${BASE}pintura/"`));
  assert.ok(html.includes(`href="${BASE}clases-de-bateria/"`));
});

test("clases-de-bateria/ uses the dark theme and names the real stages", async () => {
  const html = await leer("clases-de-bateria/");
  assert.ok(/<body class="[^"]*(^| )tema-oscuro( |")/.test(html), "body must carry the tema-oscuro class");
  for (const dato of ["Rinaldo Rafanelli", "Omar Mollo", "Cosquín Rock", "Cemento", "25 enseñando"]) {
    assert.ok(html.includes(dato), `missing confirmed fact: ${dato}`);
  }
  assert.match(html, /No hace falta para arrancar/);
});

test("clases-de-bateria/ links to the service pages of the other business", async () => {
  const html = await leer("clases-de-bateria/");
  assert.ok(html.includes(`href="${BASE}pintura/"`));
});

test("provisional content is marked visibly so nothing invented slips through", async () => {
  const html = await leer("pintura/");
  assert.match(html, /data-pendiente/);
});

test("every page carries the phone-only WhatsApp bar with its own origin", async () => {
  const esperados = {
    "": "Hola%20Diego%2C%20te%20escribo%20desde%20tu%20p%C3%A1gina",
    "pintura/": paginas["pintura/"].origen,
    "arreglos-del-hogar/": paginas["arreglos-del-hogar/"].origen,
    "clases-de-bateria/": paginas["clases-de-bateria/"].origen,
  };
  for (const [ruta, origen] of Object.entries(esperados)) {
    const html = await leer(ruta);
    const barra = html.match(/<div class="barra[^"]*"[^>]*data-barra-whatsapp[^>]*>[\s\S]*?<\/div>/);
    assert.ok(barra, `${ruta || "home"} has no WhatsApp bar`);
    assert.ok(barra[0].includes(`?text=${origen}"`), `${ruta || "home"} bar uses the wrong origin`);
  }
});

test("the favicon is ours, not the Astro default", async () => {
  const svg = await readFile(new URL("favicon.svg", dist), "utf8");
  assert.match(svg, /<title>Diego Ceccato<\/title>/);
  assert.doesNotMatch(svg, /astro/i);
  assert.equal(await existe("favicon.ico").catch(() => false), false, "the default favicon.ico must be gone");
});

test("service pages show the trust facts before the photo placeholder", async () => {
  for (const ruta of ["pintura/", "clases-de-bateria/"]) {
    const cuerpo = (await leer(ruta)).split("<body")[1];
    const hechos = cuerpo.indexOf('class="hechos"');
    const placeholder = cuerpo.indexOf('class="pendiente pendiente--bloque"');
    const retrato = cuerpo.indexOf('class="retrato"');
    const foto = placeholder === -1 ? retrato : placeholder;
    assert.ok(hechos !== -1 && foto !== -1, `${ruta} is missing facts or photo block`);
    assert.ok(hechos < foto, `${ruta}: facts (${hechos}) must come before the photo block (${foto}) in the DOM`);
  }
});
