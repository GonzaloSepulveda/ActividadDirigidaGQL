import type { vueloModel } from "./types.ts";



export const fromModelToVuelo = (vuelo:vueloModel) =>({
    id:vuelo._id!.toString(),
    origen:vuelo.origen,
    destino:vuelo.destino,
    fecha:vuelo.fecha
})