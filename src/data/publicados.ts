/**
 * Diego's posts as the pages use them. The file is written before every build by
 * scripts/traer-trabajos.mjs, from the database; it is not in the repository.
 */
import datos from "./trabajos.generado.json";
import type { Foto, Trabajo } from "./trabajos";

export const trabajos = datos.trabajos as Trabajo<Foto>[];

/** The jobs section is public only once there is a job to show. */
export const hayTrabajos = trabajos.length > 0;
