/**
 * The post builder: a list of slides Diego fills in, each drawn live on its own canvas.
 * Runs only in the browser. The photos never leave the phone.
 */
import { CENTRADO, ZOOM_MAX, acercar, disposicionSugerida, lienzoPara, mover, type Disposicion, type Formato, type Lienzo } from "./Composicion";
import { fotoDe, huecos, pintar, type Clave, type Fondo, type Foto, type Marca, type Placa, type Tipo } from "./PublicacionLienzo";

/** Each slide keeps a full-size canvas in memory; ten is what a phone handles comfortably. */
const MAX_PLACAS = 10;

/** Photos are stored at twice the canvas width at most: sharp up to 2x zoom, light on memory. */
const LADO_MAXIMO = 2160;

const NOMBRES: Record<Tipo, string> = {
  foto: "Foto con título",
  "antes-despues": "Antes y después",
  texto: "Texto",
  cierre: "Cierre con WhatsApp",
};

const FONDOS: [Fondo, string][] = [
  ["negro", "Negro"],
  ["blanco", "Blanco"],
  ["azul", "Azul"],
  ["naranja", "Naranja"],
];

/** A slide and the controls that edit it. */
interface Ficha {
  placa: Placa;
  el: HTMLLIElement;
  lienzo: HTMLCanvasElement;
  encabezado: HTMLElement;
  subir: HTMLButtonElement;
  bajar: HTMLButtonElement;
  /** Zoom sliders by photo, kept in step with pinching and the mouse wheel. */
  zooms: Partial<Record<Clave, HTMLInputElement>>;
  /** On a touch screen the photo only moves in this mode; otherwise a swipe scrolls the page. */
  moviendo: boolean;
  /** Once the layout of a before/after is picked by hand, new photos stop changing it. */
  disposicionElegida: boolean;
}

type Hijo = Node | string | null | undefined | false;

function h<K extends keyof HTMLElementTagNameMap>(etiqueta: K, propiedades: Partial<HTMLElementTagNameMap[K]> = {}, ...hijos: Hijo[]): HTMLElementTagNameMap[K] {
  const el = Object.assign(document.createElement(etiqueta), propiedades);
  el.append(...hijos.filter((hijo): hijo is Node | string => Boolean(hijo)));
  return el;
}

const nueva = (tipo: Tipo): Placa => {
  if (tipo === "foto") return { tipo, titulo: "", texto: "" };
  if (tipo === "antes-despues") return { tipo, disposicion: "lado" };
  if (tipo === "texto") return { tipo, etiqueta: "", titulo: "", texto: "", fondo: "negro" };
  return { tipo, titulo: "Pedí presupuesto" };
};

/** Decode a photo and keep a copy no larger than the tool needs. The copy also bakes in the camera's rotation. */
async function cargarFoto(archivo: File): Promise<Foto> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const factor = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
    const copia = h("canvas", { width: Math.round(img.naturalWidth * factor), height: Math.round(img.naturalHeight * factor) });
    copia.getContext("2d")!.drawImage(img, 0, 0, copia.width, copia.height);
    return { fuente: copia, ancho: copia.width, alto: copia.height, encuadre: CENTRADO };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function iniciar(raiz: HTMLElement) {
  const lista = raiz.querySelector<HTMLOListElement>("[data-placas]")!;
  const vacio = raiz.querySelector<HTMLElement>("[data-vacio]")!;
  const aviso = raiz.querySelector<HTMLElement>("[data-error]")!;
  const compartir = raiz.querySelector<HTMLButtonElement>("[data-compartir]")!;
  const guardar = raiz.querySelector<HTMLButtonElement>("[data-guardar]")!;
  const agregadores = [...raiz.querySelectorAll<HTMLButtonElement>("[data-agregar]")];
  const formatos = [...raiz.querySelectorAll<HTMLInputElement>('input[name="formato"]')];

  const marca: Marca = {
    logo: null,
    nombre: raiz.dataset.nombre!,
    usuario: raiz.dataset.usuario!,
    telefono: raiz.dataset.telefono!,
    horario: raiz.dataset.horario!,
    zonas: raiz.dataset.zonas!,
  };

  const fichas: Ficha[] = [];
  let numero = 0;

  const formato = () => formatos.find((f) => f.checked)!.value as Formato;

  /** The first photo of the post decides the shape of the "original" format. */
  function primeraFoto(): Foto | undefined {
    for (const { placa } of fichas) {
      const foto = placa.tipo === "foto" ? placa.foto : placa.tipo === "antes-despues" ? (placa.antes ?? placa.despues) : undefined;
      if (foto) return foto;
    }
    return undefined;
  }

  const lienzoActual = (): Lienzo => lienzoPara(formato(), primeraFoto());

  function avisar(mensaje: string) {
    aviso.textContent = mensaje;
    aviso.hidden = mensaje === "";
  }

  /* ---------- painting ---------- */

  function pintarYa(ficha: Ficha) {
    const lienzo = lienzoActual();
    if (ficha.lienzo.width !== lienzo.ancho) ficha.lienzo.width = lienzo.ancho;
    if (ficha.lienzo.height !== lienzo.alto) ficha.lienzo.height = lienzo.alto;
    pintar(ficha.lienzo.getContext("2d")!, ficha.placa, lienzo, marca, fichas.at(-1) === ficha);
  }

  const pendientes = new Set<Ficha>();

  /** Paint on the next frame, once, however many changes arrive before it. */
  function repintar(ficha: Ficha) {
    if (pendientes.size === 0) {
      requestAnimationFrame(() => {
        for (const pendiente of pendientes) if (fichas.includes(pendiente)) pintarYa(pendiente);
        pendientes.clear();
      });
    }
    pendientes.add(ficha);
  }

  /** After the list or the format changes: renumber, re-enable the controls and repaint everything. */
  function actualizar() {
    fichas.forEach((ficha, i) => {
      ficha.encabezado.textContent = `Placa ${i + 1}: ${NOMBRES[ficha.placa.tipo]}`;
      ficha.subir.disabled = i === 0;
      ficha.bajar.disabled = i === fichas.length - 1;
      lista.append(ficha.el);
      repintar(ficha);
    });
    vacio.hidden = fichas.length > 0;
    for (const boton of agregadores) boton.disabled = fichas.length >= MAX_PLACAS;
  }

  /* ---------- moving and zooming a photo ---------- */

  function conectarLienzo(ficha: Ficha) {
    const { lienzo } = ficha;
    const dedos = new Map<number, { x: number; y: number }>();
    let activa: Clave | null = null;

    const punto = (evento: MouseEvent) => {
      const caja = lienzo.getBoundingClientRect();
      return { x: ((evento.clientX - caja.left) * lienzo.width) / caja.width, y: ((evento.clientY - caja.top) * lienzo.height) / caja.height };
    };

    /** The photo cell under a point, if a photo is already there. */
    const celdaEn = (p: { x: number; y: number }) =>
      huecos(ficha.placa, lienzoActual()).find(({ clave, celda }) => fotoDe(ficha.placa, clave) && p.x >= celda.x && p.x <= celda.x + celda.ancho && p.y >= celda.y && p.y <= celda.y + celda.alto);

    function encuadrar(clave: Clave, cambio: (foto: Foto, celda: ReturnType<typeof huecos>[number]["celda"]) => Foto["encuadre"]) {
      const foto = fotoDe(ficha.placa, clave);
      const hueco = huecos(ficha.placa, lienzoActual()).find((candidato) => candidato.clave === clave);
      if (!foto || !hueco) return;
      foto.encuadre = cambio(foto, hueco.celda);
      const zoom = ficha.zooms[clave];
      if (zoom) zoom.value = String(foto.encuadre.zoom);
      repintar(ficha);
    }

    lienzo.addEventListener("pointerdown", (evento) => {
      if (evento.pointerType === "touch" && !ficha.moviendo) return;
      const p = punto(evento);
      if (dedos.size === 0) activa = celdaEn(p)?.clave ?? null;
      if (!activa) return;
      lienzo.setPointerCapture(evento.pointerId);
      dedos.set(evento.pointerId, p);
    });

    lienzo.addEventListener("pointermove", (evento) => {
      const antes = dedos.get(evento.pointerId);
      if (!antes || !activa) return;
      const ahora = punto(evento);
      if (dedos.size === 1) {
        encuadrar(activa, (foto, celda) => mover(foto.encuadre, ahora.x - antes.x, ahora.y - antes.y, foto.ancho, foto.alto, celda));
      } else {
        const otro = [...dedos].find(([id]) => id !== evento.pointerId)![1];
        const distancia = (a: { x: number; y: number }) => Math.hypot(a.x - otro.x, a.y - otro.y);
        const factor = distancia(ahora) / Math.max(1, distancia(antes));
        encuadrar(activa, (foto, celda) => acercar(foto.encuadre, factor, foto.ancho, foto.alto, celda));
      }
      dedos.set(evento.pointerId, ahora);
    });

    const soltar = (evento: PointerEvent) => {
      dedos.delete(evento.pointerId);
      if (dedos.size === 0) activa = null;
    };
    lienzo.addEventListener("pointerup", soltar);
    lienzo.addEventListener("pointercancel", soltar);

    lienzo.addEventListener(
      "wheel",
      (evento) => {
        const clave = celdaEn(punto(evento))?.clave;
        if (!clave) return;
        evento.preventDefault();
        encuadrar(clave, (foto, celda) => acercar(foto.encuadre, Math.exp(-evento.deltaY * 0.0015), foto.ancho, foto.alto, celda));
      },
      { passive: false },
    );
  }

  /* ---------- controls ---------- */

  function campoTexto(ficha: Ficha, rotulo: string, valor: string, renglones: number, guardarValor: (valor: string) => void) {
    const campo = renglones > 1 ? h("textarea", { rows: renglones, value: valor }) : h("input", { type: "text", value: valor });
    campo.addEventListener("input", () => {
      guardarValor(campo.value);
      repintar(ficha);
    });
    return h("label", { className: "campo" }, h("span", { className: "campo__rotulo" }, rotulo), campo);
  }

  function opciones<T extends string>(ficha: Ficha, leyenda: string, pares: [T, string][], valor: T, guardarValor: (valor: T) => void) {
    const nombre = `opcion-${++numero}`;
    const botones = pares.map(([clave, rotulo]) => {
      const radio = h("input", { type: "radio", name: nombre, value: clave, checked: clave === valor });
      radio.addEventListener("change", () => {
        guardarValor(clave);
        repintar(ficha);
      });
      return h("label", { className: `opcion opcion--${clave}` }, radio, h("span", {}, rotulo));
    });
    return { grupo: h("fieldset", { className: "opciones" }, h("legend", {}, leyenda), ...botones), radios: botones.map((b) => b.querySelector("input")!) };
  }

  function campoFoto(ficha: Ficha, clave: Clave, rotulo: string, alCargar: (foto: Foto) => void) {
    const estado = h("span", { className: "foto__estado" }, "Elegir foto");
    const entrada = h("input", { type: "file", accept: "image/*" });
    const zoom = h("input", { type: "range", min: "1", max: String(ZOOM_MAX), step: "0.01", value: "1" });
    const acercarse = h("label", { className: "campo campo--zoom", hidden: true }, h("span", { className: "campo__rotulo" }, "Acercar"), zoom);
    ficha.zooms[clave] = zoom;

    entrada.addEventListener("change", async () => {
      const archivo = entrada.files?.[0];
      if (!archivo) return;
      avisar("");
      try {
        alCargar(await cargarFoto(archivo));
        estado.textContent = "Cambiar foto";
        zoom.value = "1";
        acercarse.hidden = false;
        actualizar();
      } catch {
        avisar("No se pudo abrir esa foto. Probá con otra.");
      }
      entrada.value = "";
    });

    zoom.addEventListener("input", () => {
      const foto = fotoDe(ficha.placa, clave);
      const hueco = huecos(ficha.placa, lienzoActual()).find((candidato) => candidato.clave === clave);
      if (!foto || !hueco) return;
      foto.encuadre = acercar(foto.encuadre, Number(zoom.value) / foto.encuadre.zoom, foto.ancho, foto.alto, hueco.celda);
      repintar(ficha);
    });

    return h("div", { className: "foto" }, h("label", { className: "foto__boton" }, entrada, h("span", { className: "foto__rotulo" }, rotulo), estado), acercarse);
  }

  /** The switch that lets a finger move the photo instead of scrolling the page. */
  function botonMover(ficha: Ficha) {
    const boton = h("button", { type: "button", className: "mover" }, "Mover la foto con el dedo");
    boton.setAttribute("aria-pressed", "false");
    boton.addEventListener("click", () => {
      ficha.moviendo = !ficha.moviendo;
      boton.setAttribute("aria-pressed", String(ficha.moviendo));
      boton.textContent = ficha.moviendo ? "Listo, dejar de mover" : "Mover la foto con el dedo";
      ficha.lienzo.classList.toggle("placa__lienzo--moviendo", ficha.moviendo);
    });
    return boton;
  }

  const AYUDA_RESALTADO = "Para resaltar una parte, escribila entre asteriscos: *así*.";

  function controles(ficha: Ficha): Hijo[] {
    const { placa } = ficha;
    if (placa.tipo === "foto") {
      return [
        campoFoto(ficha, "foto", "Foto", (foto) => (placa.foto = foto)),
        botonMover(ficha),
        campoTexto(ficha, "Título (opcional)", placa.titulo, 2, (valor) => (placa.titulo = valor)),
        campoTexto(ficha, "Texto (opcional)", placa.texto, 2, (valor) => (placa.texto = valor)),
        h("p", { className: "ayuda" }, AYUDA_RESALTADO),
      ];
    }
    if (placa.tipo === "antes-despues") {
      const disposicion = opciones<Disposicion>(
        ficha,
        "Cómo van las fotos",
        [
          ["lado", "Lado a lado"],
          ["apilado", "Una arriba de la otra"],
        ],
        placa.disposicion,
        (valor) => {
          placa.disposicion = valor;
          ficha.disposicionElegida = true;
        },
      );
      const alCargar = (clave: "antes" | "despues") => (foto: Foto) => {
        placa[clave] = foto;
        if (ficha.disposicionElegida) return;
        placa.disposicion = disposicionSugerida(foto.ancho, foto.alto);
        for (const radio of disposicion.radios) radio.checked = radio.value === placa.disposicion;
      };
      return [campoFoto(ficha, "antes", "Foto de antes", alCargar("antes")), campoFoto(ficha, "despues", "Foto de después", alCargar("despues")), botonMover(ficha), disposicion.grupo];
    }
    if (placa.tipo === "texto") {
      return [
        campoTexto(ficha, "Etiqueta arriba (opcional)", placa.etiqueta, 1, (valor) => (placa.etiqueta = valor)),
        campoTexto(ficha, "Título", placa.titulo, 2, (valor) => (placa.titulo = valor)),
        campoTexto(ficha, "Texto (opcional)", placa.texto, 3, (valor) => (placa.texto = valor)),
        h("p", { className: "ayuda" }, AYUDA_RESALTADO),
        opciones<Fondo>(ficha, "Color de fondo", FONDOS, placa.fondo, (valor) => (placa.fondo = valor)).grupo,
      ];
    }
    return [
      campoTexto(ficha, "Título", placa.titulo, 2, (valor) => (placa.titulo = valor)),
      h("p", { className: "ayuda" }, `El WhatsApp, el horario y las zonas salen solos: ${marca.telefono}, ${marca.horario.toLowerCase()}.`),
    ];
  }

  /* ---------- the list ---------- */

  function agregar(tipo: Tipo) {
    if (fichas.length >= MAX_PLACAS) return;
    const lienzo = h("canvas", { className: "placa__lienzo" });
    lienzo.setAttribute("aria-label", `Vista previa: ${NOMBRES[tipo]}`);
    const encabezado = h("h2", { className: "placa__titulo" });
    const subir = h("button", { type: "button", className: "placa__orden", title: "Subir" }, "↑");
    const bajar = h("button", { type: "button", className: "placa__orden", title: "Bajar" }, "↓");
    const quitar = h("button", { type: "button", className: "placa__orden placa__orden--quitar" }, "Quitar");
    subir.setAttribute("aria-label", "Subir esta placa");
    bajar.setAttribute("aria-label", "Bajar esta placa");

    const el = h("li", { className: `placa placa--${tipo}` });
    const ficha: Ficha = { placa: nueva(tipo), el, lienzo, encabezado, subir, bajar, zooms: {}, moviendo: false, disposicionElegida: false };
    el.append(h("header", { className: "placa__cabecera" }, encabezado, h("div", { className: "placa__botones" }, subir, bajar, quitar)), h("div", { className: "placa__cuerpo" }, lienzo, h("div", { className: "placa__controles" }, ...controles(ficha))));

    const cambiarLugar = (salto: number) => {
      const i = fichas.indexOf(ficha);
      const destino = i + salto;
      if (destino < 0 || destino >= fichas.length) return;
      [fichas[i], fichas[destino]] = [fichas[destino], fichas[i]];
      actualizar();
    };
    subir.addEventListener("click", () => cambiarLugar(-1));
    bajar.addEventListener("click", () => cambiarLugar(1));
    quitar.addEventListener("click", () => {
      fichas.splice(fichas.indexOf(ficha), 1);
      el.remove();
      avisar("");
      actualizar();
    });

    conectarLienzo(ficha);
    fichas.push(ficha);
    actualizar();
    return ficha;
  }

  for (const boton of agregadores) {
    boton.addEventListener("click", () => {
      avisar("");
      agregar(boton.dataset.agregar as Tipo)?.el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  for (const radio of formatos) radio.addEventListener("change", actualizar);

  /* ---------- export ---------- */

  /** The finished images, or nothing (and a message) while something is missing. */
  async function imagenes(): Promise<File[] | null> {
    if (fichas.length === 0) {
      avisar("Agregá al menos una placa.");
      return null;
    }
    const incompleta = fichas.findIndex(({ placa }) => huecos(placa, lienzoActual()).some(({ clave }) => !fotoDe(placa, clave)));
    if (incompleta >= 0) {
      avisar(`A la placa ${incompleta + 1} le falta una foto.`);
      fichas[incompleta].el.scrollIntoView({ behavior: "smooth", block: "start" });
      return null;
    }
    avisar("");
    return Promise.all(
      fichas.map((ficha, i) => {
        pintarYa(ficha);
        return new Promise<File>((resolver, rechazar) =>
          ficha.lienzo.toBlob((blob) => (blob ? resolver(new File([blob], `placa-${i + 1}.jpg`, { type: "image/jpeg" })) : rechazar(new Error("empty canvas"))), "image/jpeg", 0.92),
        );
      }),
    );
  }

  // Sharing files only exists on phones; there it opens Instagram directly.
  if (navigator.canShare?.({ files: [new File([], "placa-1.jpg", { type: "image/jpeg" })] })) {
    compartir.hidden = false;
    compartir.addEventListener("click", async () => {
      try {
        const archivos = await imagenes();
        if (archivos) await navigator.share({ files: archivos });
      } catch (motivo) {
        // Closing the share sheet is not an error.
        if ((motivo as DOMException).name !== "AbortError") avisar("No se pudo compartir. Guardá las imágenes y subilas desde Instagram.");
      }
    });
  } else {
    guardar.classList.add("boton--principal");
  }

  guardar.addEventListener("click", async () => {
    const archivos = await imagenes().catch(() => null);
    if (!archivos) return;
    // One download at a time: browsers drop downloads that start all at once.
    for (const archivo of archivos) {
      const url = URL.createObjectURL(archivo);
      h("a", { href: url, download: archivo.name }).click();
      await new Promise((seguir) => setTimeout(seguir, 350));
      URL.revokeObjectURL(url);
    }
  });

  /* ---------- start ---------- */

  agregar("foto");

  // The first paint may fall back to system fonts; repaint when the brand's own arrive.
  Promise.all(['700 80px "Barlow Condensed"', '600 28px "Barlow"', '400 34px "Barlow"'].map((f) => document.fonts.load(f))).then(actualizar, () => undefined);

  const logo = new Image();
  logo.src = raiz.dataset.logo!;
  logo.decode().then(
    () => {
      marca.logo = logo;
      actualizar();
    },
    () => undefined,
  );
}
