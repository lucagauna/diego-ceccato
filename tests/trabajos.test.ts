import { test } from "node:test";
import assert from "node:assert/strict";
import { barrioValido, direccionFoto, fechaLarga, limpiarBarrio, medidasJpeg, prepararTrabajos, tamanoReducido, tituloDe, type Fila } from "../src/data/trabajos.ts";

const fila = (cambios: Partial<Fila> = {}): Fila => ({
  id: "a1b2c3d4-0000-4000-8000-000000000001",
  creado: "2026-11-18T22:30:00+00:00",
  tipo: "interiores",
  barrio: "Benavídez",
  texto: "",
  fotos: ["11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg"],
  ...cambios,
});

test("the title of a post names the kind of job and the neighbourhood", () => {
  assert.equal(tituloDe("interiores", "Benavídez"), "Pintura de interiores en Benavídez");
  assert.equal(tituloDe("exteriores", "Tigre"), "Pintura de exteriores y frentes en Tigre");
  assert.equal(tituloDe("hierro-madera", "Villa La Ñata"), "Pintura de hierro y madera en Villa La Ñata");
  assert.equal(tituloDe("grietas-humedad", "Rincón de Milberg"), "Reparación de grietas y humedad en Rincón de Milberg");
  assert.equal(tituloDe("arreglos", "San Isidro"), "Arreglos del hogar en San Isidro");
});

test("a neighbourhood is only a place name: digits, which would be a street number, are refused", () => {
  assert.equal(barrioValido("Tigre"), true);
  assert.equal(barrioValido("Villa La Ñata"), true);
  assert.equal(barrioValido("Av. Cazón 1234"), false);
  assert.equal(barrioValido(""), false);
  assert.equal(barrioValido("T"), false);
  assert.equal(barrioValido("x".repeat(41)), false);
});

test("a typed neighbourhood loses the spaces around and inside it", () => {
  assert.equal(limpiarBarrio("  San   Fernando "), "San Fernando");
});

test("the date is written out in Spanish, on Buenos Aires time", () => {
  assert.equal(fechaLarga("2026-11-18T22:30:00+00:00"), "18 de noviembre de 2026");
  // 01:30 UTC is still the evening before in Buenos Aires.
  assert.equal(fechaLarga("2026-11-19T01:30:00+00:00"), "18 de noviembre de 2026");
});

test("a photo is shrunk to the longest side allowed, keeping its shape, and never enlarged", () => {
  assert.deepEqual(tamanoReducido(4000, 3000, 1600), { ancho: 1600, alto: 1200 });
  assert.deepEqual(tamanoReducido(3000, 4000, 1600), { ancho: 1200, alto: 1600 });
  assert.deepEqual(tamanoReducido(800, 600, 1600), { ancho: 800, alto: 600 });
});

test("the public address of a photo is built from its path in the bucket", () => {
  assert.equal(
    direccionFoto("11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg"),
    "https://qfadhlmcuwlgpxjukanu.supabase.co/storage/v1/object/public/trabajos/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg",
  );
});

test("a path that is not a photo of the bucket is refused instead of being fetched", () => {
  assert.throws(() => direccionFoto("../../otro/archivo.jpg"));
  assert.throws(() => direccionFoto("https://example.com/foto.jpg"));
});

test("posts come out newest first, each with a stable address and numbered photo files", () => {
  const [nuevo, viejo] = prepararTrabajos([
    fila({ id: "bbbbbbbb-0000-4000-8000-000000000002", creado: "2026-10-01T12:00:00+00:00", barrio: "Villa La Ñata", tipo: "hierro-madera" }),
    fila({ fotos: [fila().fotos[0], "11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333.jpg"], texto: "  Dos manos de látex.  " }),
  ]);
  assert.equal(nuevo.slug, "pintura-de-interiores-en-benavidez-a1b2c3d4");
  assert.equal(nuevo.titulo, "Pintura de interiores en Benavídez");
  assert.equal(nuevo.fechaLarga, "18 de noviembre de 2026");
  assert.equal(nuevo.texto, "Dos manos de látex.");
  assert.deepEqual(nuevo.fotos.map((f) => f.archivo), ["pintura-de-interiores-en-benavidez-a1b2c3d4-1.jpg", "pintura-de-interiores-en-benavidez-a1b2c3d4-2.jpg"]);
  assert.equal(nuevo.fotos[1].origen, "11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333.jpg");
  assert.equal(viejo.slug, "pintura-de-hierro-y-madera-en-villa-la-nata-bbbbbbbb");
});

test("a row the site does not understand stops the build instead of publishing something broken", () => {
  assert.throws(() => prepararTrabajos([fila({ tipo: "albanileria" as Fila["tipo"] })]));
  assert.throws(() => prepararTrabajos([fila({ fotos: [] })]));
  assert.throws(() => prepararTrabajos([fila({ barrio: "Calle Falsa 123" })]));
});

test("the size of a JPEG is read from its header", () => {
  // SOI, an APP0 segment to skip, then a baseline frame header: height 1200, width 1600.
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0xb0, 0x06, 0x40, 0x03]);
  assert.deepEqual(medidasJpeg(jpeg), { ancho: 1600, alto: 1200 });
});

test("a file that is not a JPEG is refused", () => {
  assert.throws(() => medidasJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47])));
  assert.throws(() => medidasJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00])));
});
