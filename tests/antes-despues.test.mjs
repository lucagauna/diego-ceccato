import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
const leer = (ruta) => readFile(new URL(`${ruta}index.html`, dist), "utf8");

const figuras = (html) => [...html.matchAll(/<figure class="antes-despues"[^>]*>([\s\S]*?)<\/figure>/g)].map((m) => m[1]);
const scriptsComparar = (html) => [...html.matchAll(/<script([^>]*data-antes-despues[^>]*)>([\s\S]*?)<\/script>/g)];

test("pintura/ shows the before/after control with both photos labelled", async () => {
  const html = await leer("pintura/");
  const [figura] = figuras(html);
  assert.ok(figura, "no before/after figure on the painting page");
  assert.match(figura, /<img[^>]*alt="Antes[^"]*"/);
  assert.match(figura, /<img[^>]*alt="Después[^"]*"/);
  assert.match(figura, /<figcaption/);
});

test("the control degrades: both images are in the HTML and the slider is a native range", async () => {
  const html = await leer("pintura/");
  const [figura] = figuras(html);
  assert.equal((figura.match(/<img /g) ?? []).length, 2);
  assert.match(figura, /<input[^>]*type="range"[^>]*aria-label="[^"]+"/);
  assert.match(figura, /<input[^>]*type="range"[^>]*min="0"[^>]*max="100"/);
});

test("exactly one small inline script powers the control, and only where it is used", async () => {
  const conControl = await leer("pintura/");
  const scripts = scriptsComparar(conControl);
  assert.equal(scripts.length, 1);
  const [, attrs, cuerpo] = scripts[0];
  assert.doesNotMatch(attrs, /src=/, "the script must be inline");
  assert.ok(cuerpo.length < 1500, `script is ${cuerpo.length} chars; keep it tiny`);
  assert.doesNotMatch(cuerpo, /fetch\(|XMLHttpRequest|import\(/, "no network or dynamic imports");

  for (const ruta of ["", "arreglos-del-hogar/", "clases-de-bateria/"]) {
    assert.equal(scriptsComparar(await leer(ruta)).length, 0, `${ruta || "home"} must not ship the compare script`);
  }
});
