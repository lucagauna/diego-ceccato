import { test } from "node:test";
import assert from "node:assert/strict";
import { CENTRADO, LIENZO, PIE, ZOOM_MAX, acercar, celdas, disposicionSugerida, lienzoPara, mover, recorte } from "../src/components/Composicion.ts";

test("the canvas is Instagram's 4:5 portrait post", () => {
  assert.deepEqual(LIENZO, { ancho: 1080, alto: 1350 });
});

for (const disposicion of ["lado", "apilado"] as const) {
  test(`${disposicion}: both cells have the same size, do not overlap and leave the footer free`, () => {
    const [antes, despues] = celdas(disposicion);
    assert.equal(antes.ancho, despues.ancho);
    assert.equal(antes.alto, despues.alto);
    for (const c of [antes, despues]) {
      assert.ok(c.x >= 0 && c.x + c.ancho <= LIENZO.ancho);
      assert.ok(c.y >= 0 && c.y + c.alto <= LIENZO.alto - PIE);
    }
    const separadas = disposicion === "lado" ? antes.x + antes.ancho < despues.x : antes.y + antes.alto < despues.y;
    assert.ok(separadas, "the before cell must end before the after cell starts");
  });
}

test("a photo is cropped around its centre to the cell's proportions, never stretched", () => {
  const celda = { x: 0, y: 0, ancho: 500, alto: 1000 };
  // Landscape photo into a tall cell: full height, the sides are cut evenly.
  assert.deepEqual(recorte(4000, 3000, celda), { x: 1250, y: 0, ancho: 1500, alto: 3000 });
  // Tall photo into a wide cell: full width, top and bottom are cut evenly.
  assert.deepEqual(recorte(3000, 4000, { x: 0, y: 0, ancho: 1000, alto: 500 }), { x: 0, y: 1250, ancho: 3000, alto: 1500 });
  // Same proportions: the whole photo.
  assert.deepEqual(recorte(1000, 2000, celda), { x: 0, y: 0, ancho: 1000, alto: 2000 });
});

test("portrait photos go side by side, landscape photos one above the other", () => {
  assert.equal(disposicionSugerida(3000, 4000), "lado");
  assert.equal(disposicionSugerida(4000, 3000), "apilado");
});

/* Framing: every photo can be moved and zoomed inside its cell, as in Instagram's own editor. */

const celdaAlta = { x: 0, y: 0, ancho: 500, alto: 1000 };

test("zooming in shows a smaller part of the photo around the same centre", () => {
  assert.deepEqual(recorte(4000, 3000, celdaAlta, { zoom: 2, cx: 0.5, cy: 0.5 }), { x: 1625, y: 750, ancho: 750, alto: 1500 });
});

test("a framing that would leave the cell uncovered is pulled back to the edge of the photo", () => {
  assert.deepEqual(recorte(4000, 3000, celdaAlta, { zoom: 1, cx: 0, cy: 0.5 }), { x: 0, y: 0, ancho: 1500, alto: 3000 });
});

test("dragging moves the photo with the finger: 100 canvas pixels right uncover 300 photo pixels on the left", () => {
  const movido = mover(CENTRADO, 100, 0, 4000, 3000, celdaAlta);
  assert.equal(recorte(4000, 3000, celdaAlta, movido).x, 950);
});

test("dragging stops at the edge of the photo and keeps the stored centre inside it", () => {
  const movido = mover(CENTRADO, 10000, 500, 4000, 3000, celdaAlta);
  assert.equal(recorte(4000, 3000, celdaAlta, movido).x, 0);
  assert.equal(movido.cx, 0.1875);
  assert.equal(movido.cy, 0.5, "there is no room to move vertically when the photo already fills the height");
});

test("zoom stays between the whole cell covered and the maximum", () => {
  assert.equal(acercar(CENTRADO, 10, 4000, 3000, celdaAlta).zoom, ZOOM_MAX);
  assert.equal(acercar(CENTRADO, 0.1, 4000, 3000, celdaAlta).zoom, 1);
});

test("zooming out brings an off-centre framing back inside the photo", () => {
  assert.deepEqual(acercar({ zoom: 4, cx: 0.1, cy: 0.5 }, 0.25, 4000, 3000, celdaAlta), { zoom: 1, cx: 0.1875, cy: 0.5 });
});

/* Post formats. Instagram accepts from 3:4 to 1.91:1 and gives every slide the shape of the first one. */

test("the original format keeps a phone photo whole: 3:4 is not cut down to 4:5", () => {
  assert.deepEqual(lienzoPara("original", { ancho: 3000, alto: 4000 }), { ancho: 1080, alto: 1440 });
});

test("vertical and square are fixed formats", () => {
  assert.deepEqual(lienzoPara("vertical"), { ancho: 1080, alto: 1350 });
  assert.deepEqual(lienzoPara("cuadrado"), { ancho: 1080, alto: 1080 });
});

test("the original format keeps the proportions of the first photo", () => {
  assert.deepEqual(lienzoPara("original", { ancho: 4000, alto: 3000 }), { ancho: 1080, alto: 810 });
});

test("the original format stops at the shapes Instagram accepts", () => {
  assert.deepEqual(lienzoPara("original", { ancho: 3000, alto: 6000 }), { ancho: 1080, alto: 1440 });
  assert.deepEqual(lienzoPara("original", { ancho: 6000, alto: 2000 }), { ancho: 1080, alto: 565 });
});

test("the original format without a photo yet falls back to vertical", () => {
  assert.deepEqual(lienzoPara("original"), { ancho: 1080, alto: 1350 });
});

test("before/after cells fit any canvas, not only the vertical one", () => {
  const cuadrado = lienzoPara("cuadrado");
  for (const disposicion of ["lado", "apilado"] as const) {
    for (const c of celdas(disposicion, cuadrado, 100)) {
      assert.ok(c.x + c.ancho <= cuadrado.ancho && c.y + c.alto <= cuadrado.alto - 100);
    }
  }
});
