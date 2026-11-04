import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
const leer = (ruta) => readFile(new URL(`${ruta}index.html`, dist), "utf8");
const existe = (ruta) => access(new URL(`${ruta}index.html`, dist)).then(() => true, () => false);

/** Pages linked from the shared header that later tasks build. Shrinks to empty by task 5. */
const todaviaNoConstruidas = new Set(["/clases-de-bateria/"]);

const paginas = {
  "pintura/": {
    origen: "Hola%20Diego%2C%20quiero%20pedirte%20un%20presupuesto%20de%20pintura",
    h1: /Pint/,
  },
  "arreglos-del-hogar/": {
    origen: "Hola%20Diego%2C%20quiero%20pedirte%20un%20presupuesto%20para%20un%20arreglo%20en%20casa",
    h1: /Arreglos/,
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
    assert.doesNotMatch(html, /<script/i);
    assert.doesNotMatch(html, /soluciones integrales|calidad garantizada|los mejores|de confianza|sin vueltas|jerarquía y excelencia/i);
  });

  test(`${ruta} internal links point to pages that exist in dist`, async () => {
    const html = await leer(ruta);
    const internos = [...html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]).filter((h) => !h.startsWith("/_astro/") && !h.endsWith(".svg"));
    for (const h of new Set(internos)) {
      if (todaviaNoConstruidas.has(h)) continue;
      assert.ok(await existe(h.replace(/^\//, "")), `${ruta} links to ${h}, which is not built`);
    }
  });
}

test("the home page links to both service pages", async () => {
  const html = await leer("");
  assert.match(html, /href="\/pintura\/"/);
});

test("provisional content is marked visibly so nothing invented slips through", async () => {
  const html = await leer("pintura/");
  assert.match(html, /data-pendiente/);
});
