import { test } from "node:test";
import assert from "node:assert/strict";
import { marcar, partir } from "../src/components/Renglones.ts";

/** Ten units per character, so widths are easy to read in the tests. */
const medir = (texto: string) => texto.length * 10;
const frase = (renglon: { texto: string }[]) => renglon.map((p) => p.texto).join(" ");

test("words between asterisks are highlighted and the asterisks disappear", () => {
  assert.deepEqual(marcar("Pintá *sin manchas* la casa"), [
    [
      { texto: "Pintá", resaltada: false },
      { texto: "sin", resaltada: true },
      { texto: "manchas", resaltada: true },
      { texto: "la", resaltada: false },
      { texto: "casa", resaltada: false },
    ],
  ]);
});

test("punctuation stuck to a highlighted word stays with it", () => {
  assert.deepEqual(marcar("*hola*, mundo"), [
    [
      { texto: "hola,", resaltada: true },
      { texto: "mundo", resaltada: false },
    ],
  ]);
});

test("every line the person typed starts a new line; blank ones are dropped", () => {
  assert.deepEqual(marcar("uno\n\n  \ndos").map(frase), ["uno", "dos"]);
  assert.deepEqual(marcar("   "), []);
});

test("an asterisk that is never closed highlights to the end instead of printing", () => {
  assert.deepEqual(marcar("uno *dos tres"), [
    [
      { texto: "uno", resaltada: false },
      { texto: "dos", resaltada: true },
      { texto: "tres", resaltada: true },
    ],
  ]);
});

test("a line breaks before the word that would not fit", () => {
  const [renglon] = marcar("aaa bbb ccc");
  assert.deepEqual(partir(renglon, medir, 70).map(frase), ["aaa bbb", "ccc"]);
  assert.deepEqual(partir(renglon, medir, 110).map(frase), ["aaa bbb ccc"]);
});

test("a word wider than the line gets a line of its own instead of vanishing", () => {
  const [renglon] = marcar("a larguísima b");
  assert.deepEqual(partir(renglon, medir, 50).map(frase), ["a", "larguísima", "b"]);
});
