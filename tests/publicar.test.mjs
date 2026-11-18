import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE, leer } from "./entorno.mjs";

/** The page where Diego publishes a job. That it stays hidden is checked with the other tools, in herramienta.test.mjs. */

test("the upload page asks for an email and a password the browser can remember", async () => {
  const html = await leer("publicar-trabajo/");
  assert.match(html, /<input[^>]*type="email"[^>]*autocomplete="username"/);
  assert.match(html, /<input[^>]*type="password"[^>]*autocomplete="current-password"/);
});

test("the upload page takes several photos, the five kinds of job and the neighbourhood", async () => {
  const html = await leer("publicar-trabajo/");
  assert.match(html, /<input[^>]*type="file"[^>]*accept="image\/\*"[^>]*multiple/);
  for (const tipo of ["interiores", "exteriores", "hierro-madera", "grietas-humedad", "arreglos"]) {
    assert.match(html, new RegExp(`<input[^>]*name="tipo"[^>]*value="${tipo}"`), `no choice for ${tipo}`);
  }
  for (const zona of ["Vicente López", "San Isidro", "San Fernando", "Tigre", "Nordelta", "Benavídez", "Malvinas Argentinas"]) {
    assert.match(html, new RegExp(`<input[^>]*name="barrio"[^>]*value="${zona}"`), `no choice for ${zona}`);
  }
});

test("nothing is published without ticking the privacy reminder", async () => {
  const html = await leer("publicar-trabajo/");
  const casilla = html.match(/<input[^>]*name="privacidad"[^>]*>/)?.[0] ?? "";
  assert.match(casilla, /type="checkbox"/);
  assert.match(casilla, /required/);
  assert.match(html, /caras/);
  assert.match(html, /números de casa/);
  assert.match(html, /dueño/);
});

test("the secret key of the database never reaches the site", async () => {
  const html = await leer("publicar-trabajo/");
  const archivos = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1].slice(BASE.length));
  const codigo = (await Promise.all(archivos.map((a) => leer(a)))).join("\n") + html;
  // assert.ok instead of assert.match: a failure must not print the whole bundle.
  assert.ok(/sb_publishable_[A-Za-z0-9_-]{20,}/.test(codigo), "the page needs the publishable key to talk to the database");
  // The client library names these keys in its own messages; what must never appear is a key itself.
  assert.ok(!/sb_secret_[A-Za-z0-9_-]{8,}/.test(codigo), "a secret key is in the page");
  assert.ok(!/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\./.test(codigo), "a signed token is in the page");
});
