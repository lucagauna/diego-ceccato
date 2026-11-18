/**
 * The page where Diego publishes a job: sign in, pick photos, say what and where, publish.
 * Runs only in the browser and talks straight to the database, whose own rules decide
 * who may write. What is published here goes live on the next build of the site.
 */
import { createClient } from "@supabase/supabase-js";
import { BALDE, MAX_FOTOS, SUPABASE_CLAVE, SUPABASE_URL, barrioValido, direccionFoto, fechaLarga, limpiarBarrio, tamanoReducido, tituloDe, type Fila } from "../data/trabajos";

/** JPEG quality of the uploaded photos: sharp on a phone, a few hundred kilobytes each. */
const CALIDAD = 0.85;

/** The bucket refuses anything larger. */
const PESO_MAXIMO = 2 * 1024 * 1024;

/** A photo ready to upload, and the address of its preview. */
interface Elegida {
  blob: Blob;
  vista: string;
}

type Hijo = Node | string | null | undefined | false;

function h<K extends keyof HTMLElementTagNameMap>(etiqueta: K, propiedades: Partial<HTMLElementTagNameMap[K]> = {}, ...hijos: Hijo[]): HTMLElementTagNameMap[K] {
  const el = Object.assign(document.createElement(etiqueta), propiedades);
  el.append(...hijos.filter((hijo): hijo is Node | string => Boolean(hijo)));
  return el;
}

/**
 * Shrink a photo and encode it again as JPEG. Drawing it on a canvas also drops everything
 * the camera wrote into the file, the place where it was taken included.
 */
async function reducir(archivo: File): Promise<Blob> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const { ancho, alto } = tamanoReducido(img.naturalWidth, img.naturalHeight);
    const lienzo = h("canvas", { width: ancho, height: alto });
    const ctx = lienzo.getContext("2d")!;
    // A transparent PNG would turn black as a JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0, ancho, alto);
    const codificar = (calidad: number) => new Promise<Blob>((ok, mal) => lienzo.toBlob((blob) => (blob ? ok(blob) : mal(new Error("empty canvas"))), "image/jpeg", calidad));
    const blob = await codificar(CALIDAD);
    return blob.size <= PESO_MAXIMO ? blob : codificar(0.6);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function iniciar(raiz: HTMLElement) {
  const base = createClient(SUPABASE_URL, SUPABASE_CLAVE);
  const $ = <T extends HTMLElement>(selector: string) => raiz.querySelector<T>(selector)!;

  const entrar = $<HTMLFormElement>("[data-entrar]");
  const avisoEntrar = $("[data-entrar-aviso]");
  const panel = $("[data-panel]");
  const nuevo = $<HTMLFormElement>("[data-nuevo]");
  const campoFotos = $<HTMLInputElement>("[data-fotos]");
  const miniaturas = $<HTMLUListElement>("[data-miniaturas]");
  const otroBarrio = $("[data-otro]");
  const publicar = $<HTMLButtonElement>("[data-publicar]");
  const estado = $("[data-estado]");
  const lista = $<HTMLUListElement>("[data-lista]");
  const listaVacia = $("[data-lista-vacia]");
  const avisoLista = $("[data-lista-aviso]");

  const elegidas: Elegida[] = [];
  let usuario: string | null = null;

  /** One message at a time; an empty one hides the line. */
  function decir(donde: HTMLElement, mensaje: string, tono: "normal" | "bien" | "mal" = "normal") {
    donde.textContent = mensaje;
    donde.hidden = mensaje === "";
    donde.dataset.tono = tono;
  }

  /** What to tell Diego when the database says no. */
  function explicar(error: { message?: string; code?: string; statusCode?: string } | null): string {
    const texto = `${error?.code ?? ""} ${error?.statusCode ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (/42501|row-level security|403|unauthorized/.test(texto)) return "Tu usuario no tiene permiso para publicar. Avisale a Luca.";
    return "No se pudo. Revisá la conexión y probá de nuevo.";
  }

  /* ---------- signing in ---------- */

  function mostrar(conSesion: boolean) {
    entrar.hidden = conSesion;
    panel.hidden = !conSesion;
  }

  entrar.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const datos = new FormData(entrar);
    decir(avisoEntrar, "Entrando…");
    const { error } = await base.auth.signInWithPassword({ email: String(datos.get("email")).trim(), password: String(datos.get("clave")) });
    decir(avisoEntrar, error ? "El mail o la contraseña no coinciden." : "", "mal");
  });

  $("[data-salir]").addEventListener("click", () => base.auth.signOut());

  base.auth.onAuthStateChange((_evento, sesion) => {
    const antes = usuario;
    usuario = sesion?.user.id ?? null;
    mostrar(usuario !== null);
    // The client must not be called from inside this callback, so the list loads right after it.
    if (usuario && usuario !== antes) setTimeout(cargarLista, 0);
  });

  /* ---------- picking photos ---------- */

  function pintarMiniaturas() {
    miniaturas.replaceChildren(
      ...elegidas.map((elegida, i) => {
        const primera = h("button", { type: "button", className: "mini__accion" }, "Poner primera");
        primera.addEventListener("click", () => {
          elegidas.unshift(...elegidas.splice(i, 1));
          pintarMiniaturas();
        });
        const quitar = h("button", { type: "button", className: "mini__accion" }, "Quitar");
        quitar.addEventListener("click", () => {
          URL.revokeObjectURL(elegidas.splice(i, 1)[0].vista);
          pintarMiniaturas();
        });
        return h("li", { className: "mini" }, h("img", { src: elegida.vista, alt: `Foto ${i + 1}` }), i === 0 ? h("span", { className: "mini__portada" }, "Portada") : primera, quitar);
      }),
    );
  }

  campoFotos.addEventListener("change", async () => {
    const archivos = [...(campoFotos.files ?? [])];
    campoFotos.value = "";
    const lugar = MAX_FOTOS - elegidas.length;
    let falladas = 0;
    decir(estado, archivos.length ? "Preparando las fotos…" : "");
    for (const archivo of archivos.slice(0, lugar)) {
      try {
        const blob = await reducir(archivo);
        elegidas.push({ blob, vista: URL.createObjectURL(blob) });
        pintarMiniaturas();
      } catch {
        falladas++;
      }
    }
    if (falladas) decir(estado, falladas === 1 ? "Una foto no se pudo abrir. Probá con otra." : `${falladas} fotos no se pudieron abrir. Probá con otras.`, "mal");
    else if (archivos.length > lugar) decir(estado, `Entran hasta ${MAX_FOTOS} fotos por trabajo. Quedaron las primeras.`, "mal");
    else decir(estado, "");
  });

  /* ---------- where ---------- */

  nuevo.addEventListener("change", () => {
    otroBarrio.hidden = new FormData(nuevo).get("barrio") !== "otro";
  });

  /* ---------- publishing ---------- */

  nuevo.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!usuario) return;
    const datos = new FormData(nuevo);
    const elegido = String(datos.get("barrio") ?? "");
    const barrio = limpiarBarrio(elegido === "otro" ? String(datos.get("otro-barrio") ?? "") : elegido);

    if (elegidas.length === 0) return decir(estado, "Elegí al menos una foto.", "mal");
    if (!barrioValido(barrio)) return decir(estado, "Escribí solo el nombre del barrio o la localidad, sin calle ni número.", "mal");

    publicar.disabled = true;
    const subidas: string[] = [];
    try {
      for (const [i, { blob }] of elegidas.entries()) {
        decir(estado, `Subiendo foto ${i + 1} de ${elegidas.length}…`);
        const ruta = `${usuario}/${crypto.randomUUID()}.jpg`;
        const { error } = await base.storage.from(BALDE).upload(ruta, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        subidas.push(ruta);
      }
      decir(estado, "Publicando…");
      const { error } = await base.from("trabajos").insert({ tipo: datos.get("tipo"), barrio, texto: String(datos.get("texto") ?? "").trim(), fotos: subidas });
      if (error) throw error;

      for (const { vista } of elegidas) URL.revokeObjectURL(vista);
      elegidas.length = 0;
      pintarMiniaturas();
      nuevo.reset();
      otroBarrio.hidden = true;
      decir(estado, "Publicado. Aparece en la web dentro de la hora.", "bien");
      cargarLista();
    } catch (error) {
      // Nothing half-published: the photos of a post that did not get saved are removed.
      if (subidas.length) await base.storage.from(BALDE).remove(subidas);
      decir(estado, explicar(error as { message?: string }), "mal");
    } finally {
      publicar.disabled = false;
    }
  });

  /* ---------- what is already published ---------- */

  async function cargarLista() {
    const { data, error } = await base.from("trabajos").select("id,creado,tipo,barrio,texto,fotos").order("creado", { ascending: false });
    if (error) return decir(avisoLista, "No se pudo cargar la lista. Revisá la conexión.", "mal");
    const filas = data as Fila[];
    listaVacia.hidden = filas.length > 0;
    lista.replaceChildren(
      ...filas.map((fila) => {
        const titulo = tituloDe(fila.tipo, fila.barrio);
        const borrar = h("button", { type: "button", className: "boton boton--chico" }, "Borrar");
        borrar.addEventListener("click", () => borrarTrabajo(fila, titulo, borrar));
        return h(
          "li",
          { className: "hecho" },
          h("img", { src: direccionFoto(fila.fotos[0]), alt: "", loading: "lazy" }),
          h("div", { className: "hecho__datos" }, h("strong", {}, titulo), h("span", {}, `${fechaLarga(fila.creado)}, ${fila.fotos.length} ${fila.fotos.length === 1 ? "foto" : "fotos"}`)),
          borrar,
        );
      }),
    );
  }

  async function borrarTrabajo(fila: Fila, titulo: string, boton: HTMLButtonElement) {
    if (!confirm(`¿Borrar "${titulo}"? No se puede deshacer.`)) return;
    boton.disabled = true;
    // The database deletes nothing, without an error, when the rules say no; so ask what was deleted.
    const { data, error } = await base.from("trabajos").delete().eq("id", fila.id).select("id");
    if (error || !data?.length) {
      boton.disabled = false;
      return decir(avisoLista, error ? explicar(error) : "No se pudo borrar. Avisale a Luca.", "mal");
    }
    await base.storage.from(BALDE).remove(fila.fotos);
    decir(avisoLista, "Borrado. Desaparece de la web dentro de la hora.", "bien");
    cargarLista();
  }
}
