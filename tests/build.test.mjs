import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
const html = await readFile(new URL("index.html", dist), "utf8");
const cssFiles = (await readdir(new URL("_astro/", dist))).filter((f) => f.endsWith(".css"));
const css = (await Promise.all(cssFiles.map((f) => readFile(new URL(`_astro/${f}`, dist), "utf8")))).join("\n");

test("page is served in Argentine Spanish", () => {
  assert.match(html, /<html[^>]*lang="es-AR"/);
});

test("no JavaScript ships: all content must be in the HTML for AI crawlers", () => {
  const scripts = [...html.matchAll(/<script([^>]*)>/gi)].map((m) => m[1]);
  for (const attrs of scripts) assert.match(attrs, /type="application\/ld\+json"|data-antes-despues/, `unexpected script: <script${attrs}>`);
});

test("exactly one h1", () => {
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
});

test("WhatsApp links carry the home-page message", () => {
  assert.match(html, /https:\/\/wa\.me\/5491134883317\?text=Hola%20Diego%2C%20te%20escribo%20desde%20tu%20p%C3%A1gina/);
});

test("no external font request: Archivo is self-hosted", () => {
  assert.doesNotMatch(html + css, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(css, /archivo-latin-wdth-normal[^"')]*\.woff2/);
});
