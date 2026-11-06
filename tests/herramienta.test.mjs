import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE, leer, existe } from "./entorno.mjs";

/** Diego's own tools for building Instagram posts. They are not part of the public site. */
const herramientas = ["armar-antes-despues/", "armar-publicacion/"];

for (const ruta of herramientas) {
  test(`${ruta} is built`, async () => {
    assert.ok(await existe(ruta), `dist/${ruta}index.html is missing`);
  });

  test(`${ruta} is never indexed, on any build`, async () => {
    assert.match(await leer(ruta), /<meta name="robots" content="noindex, nofollow">/);
    assert.ok(!(await leer("sitemap-0.xml")).includes(ruta));
  });

  test(`no public page links to ${ruta}`, async () => {
    for (const pagina of ["", "pintura/", "arreglos-del-hogar/"]) {
      assert.ok(!(await leer(pagina)).includes(`${BASE}${ruta}`), `${pagina || "home"} links to the tool`);
    }
    assert.ok(!(await leer("llms.txt")).includes(ruta));
  });
}

test("the before/after tool asks for the two photos and offers both layouts", async () => {
  const html = await leer("armar-antes-despues/");
  const fotos = html.match(/<input[^>]*type="file"[^>]*>/g) ?? [];
  assert.equal(fotos.length, 2);
  for (const foto of fotos) assert.match(foto, /accept="image\/\*"/);
  assert.match(html, /name="disposicion"[^>]*value="lado"|value="lado"[^>]*name="disposicion"/);
  assert.match(html, /name="disposicion"[^>]*value="apilado"|value="apilado"[^>]*name="disposicion"/);
  assert.match(html, /<canvas/);
});

test("the post builder offers the four kinds of slide", async () => {
  const html = await leer("armar-publicacion/");
  for (const tipo of ["foto", "antes-despues", "texto", "cierre"]) {
    assert.match(html, new RegExp(`<button[^>]*data-agregar="${tipo}"`), `no button to add a ${tipo} slide`);
  }
});

test("the post builder offers the formats Instagram takes, vertical first", async () => {
  const html = await leer("armar-publicacion/");
  const formatos = [...html.matchAll(/<input[^>]*name="formato"[^>]*>/g)].map(([campo]) => campo);
  assert.deepEqual(formatos.map((campo) => campo.match(/value="([^"]+)"/)[1]), ["vertical", "cuadrado", "original"]);
  assert.match(formatos[0], /checked/);
  assert.match(html, /value="original"[^>]*>\s*<span[^>]*>Original</, "the format that keeps the photo's own shape is named as Instagram names it");
});

test("the post builder takes the contact data from the single source, never typed by hand", async () => {
  const html = await leer("armar-publicacion/");
  assert.match(html, /data-telefono="11 3488 3317"/);
  assert.match(html, /data-horario="Lunes a viernes de 8 a 17"/);
  assert.match(html, /data-usuario="@diegoceccato\.pintura"/);
});
