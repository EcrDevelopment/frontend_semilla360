import axiosInstance from '../axiosConfig';

// ===========================================================================
// RUTAS ANIDADAS (Coinciden con: despachos/<id>/ordenes/<id>/)
// ===========================================================================

// 🔹 OBTENER (GET)
// Ahora acepta 'params' para la paginación { page: 1, page_size: 5 }
export async function obtenerOrdenesDespacho(despachoId, params = {}) {
  // URL: /api/importaciones/despachos/193/ordenes/?page=1
  const response = await axiosInstance.get(`/importaciones/despachos/${despachoId}/ordenes/`, {
    params: params 
  });
  return response.data;
}

// 🔹 CREAR (POST)
export async function crearOrdenDespacho(despachoId, payload) {
  // URL: /api/importaciones/despachos/193/ordenes/
  const response = await axiosInstance.post(`/importaciones/despachos/${despachoId}/ordenes/`, payload);
  return response.data;
}

// 🔹 ACTUALIZAR (PUT / PATCH)
// Aseguramos recibir (despachoId, ordenDespachoId, payload)
export async function actualizarOrdenDespacho(despachoId, ordenDespachoId, payload) {
  // URL: /api/importaciones/despachos/193/ordenes/117/
  const response = await axiosInstance.patch(
    `/importaciones/despachos/${despachoId}/ordenes/${ordenDespachoId}/`, 
    payload
  );
  return response.data;
}

// 🔹 ELIMINAR (DELETE)
export async function eliminarOrdenDespacho(ordenDespachoId, despachoId) {
  // URL: /api/importaciones/despachos/193/ordenes/117/
  // Nota: El orden de argumentos en tu componente era (id, despachoId) o al revés.
  // Aquí asumo que tu componente envía (idOrden, idDespacho).
  const response = await axiosInstance.delete(
    `/importaciones/despachos/${despachoId}/ordenes/${ordenDespachoId}/`
  );
  return response.data;
}

// ===========================================================================
// OTROS ENDPOINTS (Búsquedas, Utilitarios)
// ===========================================================================

export const buscarOC = async (empresaBase, query) => {
  const res = await axiosInstance.get(`importaciones/buscar_oi/`, {
    params: { base_datos: empresaBase, query },
  });
  return res.data;
};

export const getOrCreateOC = async (payload) => {
  const res = await axiosInstance.post(`/importaciones/ordenes/get-or-create/`, payload);
  return res.data;
};

// ===========================================================================
// COMPATIBILIDAD (Alias por si algún componente usa los nombres en inglés)
// ===========================================================================

export const getOrdenesDespacho = obtenerOrdenesDespacho;
export const createOrdenDespacho = crearOrdenDespacho;

// Ajuste de argumentos para update si usas la versión en inglés
export const updateOrdenDespacho = async (id, despachoId, payload) => {
    return actualizarOrdenDespacho(despachoId, id, payload);
};

export const deleteOrdenDespacho = async (id, despachoId) => {
    return eliminarOrdenDespacho(id, despachoId);
};