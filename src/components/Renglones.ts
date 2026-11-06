/**
 * Text for the slides: which words are highlighted and where the lines break.
 * Pure: the caller passes the function that measures text, so the tests need no canvas.
 */

export interface Palabra {
  texto: string;
  /** Typed between asterisks: *like this*. */
  resaltada: boolean;
}

/**
 * Split what the person typed into lines of words. Asterisks switch the highlight on and off
 * and are never printed; a word takes the highlight that was on at its first letter.
 */
export function marcar(texto: string): Palabra[][] {
  const renglones: Palabra[][] = [];
  let resaltando = false;
  for (const linea of texto.split("\n")) {
    const palabras: Palabra[] = [];
    for (const trozo of linea.split(/\s+/)) {
      let letras = "";
      let resaltada = false;
      for (const letra of trozo) {
        if (letra === "*") {
          resaltando = !resaltando;
          continue;
        }
        if (letras === "") resaltada = resaltando;
        letras += letra;
      }
      if (letras) palabras.push({ texto: letras, resaltada });
    }
    if (palabras.length) renglones.push(palabras);
  }
  return renglones;
}

/** Break one line of words so that no line is wider than `anchoMax`. A single word is never split. */
export function partir(palabras: Palabra[], medir: (texto: string) => number, anchoMax: number): Palabra[][] {
  const espacio = medir(" ");
  const renglones: Palabra[][] = [];
  let actual: Palabra[] = [];
  let ancho = 0;
  for (const palabra of palabras) {
    const anchoPalabra = medir(palabra.texto);
    if (actual.length && ancho + espacio + anchoPalabra > anchoMax) {
      renglones.push(actual);
      actual = [];
      ancho = 0;
    }
    ancho += (actual.length ? espacio : 0) + anchoPalabra;
    actual.push(palabra);
  }
  if (actual.length) renglones.push(actual);
  return renglones;
}
