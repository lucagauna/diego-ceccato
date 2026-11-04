import { test } from "node:test";
import assert from "node:assert/strict";
import { linkWhatsApp, MENSAJES, TELEFONO } from "../src/data/contacto.ts";

test("every origin builds a wa.me link with the phone and its encoded message", () => {
  for (const origen of Object.keys(MENSAJES) as (keyof typeof MENSAJES)[]) {
    const url = new URL(linkWhatsApp(origen));
    assert.equal(url.origin + url.pathname, `https://wa.me/${TELEFONO.e164}`);
    assert.equal(url.searchParams.get("text"), MENSAJES[origen]);
  }
});

test("messages are distinct per origin so Diego can tell where a chat came from", () => {
  const textos = Object.values(MENSAJES);
  assert.equal(new Set(textos).size, textos.length);
});

test("accents and spaces survive the round trip", () => {
  const url = linkWhatsApp("bateria");
  assert.ok(url.includes("%20"), "spaces must be percent-encoded");
  assert.ok(!/[áéíóúñ ]/.test(url), "raw accents or spaces would break on some clients");
  assert.equal(decodeURIComponent(url.split("text=")[1]), MENSAJES.bateria);
});
