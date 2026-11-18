import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BASE, RAIZ, leer, existe } from "./entorno.mjs";

/** What the build brought from the database, so the tests check whatever was built. */
const { trabajos } = JSON.parse(await readFile(new URL("../src/data/trabajos.generado.json", import.meta.url), "utf8"));
const hay = trabajos.length > 0;
const publicas = ["", "pintura/", "arreglos-del-hogar/"];

const scripts = (html) => [...html.matchAll(/<script([^>]*)>/gi)].map((m) => m[1]);

test("the list of jobs is built, with one h1 and no JavaScript", async () => {
  const html = await leer("trabajos/");
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  for (const attrs of scripts(html)) assert.match(attrs, /type="application\/ld\+json"/, `unexpected script: <script${attrs}>`);
});

test("every published job has its own page, linked from the list, with its photos in the HTML", async () => {
  const lista = await leer("trabajos/");
  for (const trabajo of trabajos) {
    const ruta = `trabajos/${trabajo.slug}/`;
    assert.ok(await existe(ruta), `dist/${ruta}index.html is missing`);
    assert.ok(lista.includes(`href="${BASE}${ruta}"`), `the list does not link to ${ruta}`);
    const html = await leer(ruta);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
    assert.ok(html.includes(trabajo.titulo.replaceAll("&", "&amp;")), `${ruta} does not show its title`);
    for (const attrs of scripts(html)) assert.match(attrs, /type="application\/ld\+json"/, `unexpected script: <script${attrs}>`);
    for (const foto of trabajo.fotos) {
      assert.ok(await existe(`img/publicados/${foto.archivo}`), `photo ${foto.archivo} was not downloaded into the build`);
      assert.match(html, new RegExp(`<img[^>]*src="${BASE}img/publicados/${foto.archivo}"[^>]*width="${foto.ancho}"[^>]*height="${foto.alto}"`));
    }
    assert.doesNotMatch(html, /supabase\.co/, "a visitor must never load anything from the database host");
  }
});

test("the jobs section is public only once there is a job to show", async () => {
  const lista = await leer("trabajos/");
  const mapa = await leer("sitemap-0.xml");
  const llms = await leer("llms.txt");
  if (hay) {
    assert.doesNotMatch(lista, /noindex/);
    assert.ok(mapa.includes(`<loc>${RAIZ}/trabajos/</loc>`));
    assert.ok(llms.includes(`${RAIZ}/trabajos/`));
    for (const pagina of publicas) {
      const pie = (await leer(pagina)).match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "";
      assert.ok(pie.includes(`href="${BASE}trabajos/"`), `${pagina || "home"} footer does not link to the jobs`);
    }
  } else {
    assert.match(lista, /<meta name="robots" content="noindex, nofollow">/);
    assert.ok(!mapa.includes("/trabajos/"));
    assert.ok(!llms.includes("/trabajos/"));
    for (const pagina of publicas) assert.ok(!(await leer(pagina)).includes(`href="${BASE}trabajos/"`), `${pagina || "home"} links to an empty section`);
  }
});
