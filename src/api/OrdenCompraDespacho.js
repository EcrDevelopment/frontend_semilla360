// src/api/ordenesDespacho.js
import axiosInstance from '../axiosConfig';

export async function obtenerOrdenesDespacho(despachoId) {
  const response = await axiosInstance.get(`/importaciones/despachos/${despachoId}/ordenes/`);
  return response.data;
}

export async function actualizarOrdenDespacho(despachoId, ordenDespachoId, payload) {
  const response = await axiosInstance.put(`/importaciones/despachos/${despachoId}/ordenes/${ordenDespachoId}/`, payload);
  return response.data;
}

export async function eliminarOrdenDespacho(despachoId, ordenDespachoId) {
  const response = await axiosInstance.delete(`/importaciones/despachos/${despachoId}/ordenes/${ordenDespachoId}/`);
  return response.data;
}

export async function crearOrdenDespacho(despachoId, payload) {
  const response = await axiosInstance.post(`/importaciones/despachos/${despachoId}/ordenes/`, payload);
  return response.data;
}


// pruebas

// 🔹 Obtener todas las relaciones de un despacho
export const getOrdenesDespacho = async (despachoId) => {
  const res = await axiosInstance.get(
    `/importaciones/ordenes-despacho-prueba/?despacho_id=${despachoId}`
  );
  return res.data;
};

// 🔹 Crear nueva relación
export const createOrdenDespacho = async (payload) => {
  const res = await axiosInstance.post(`/importaciones/ordenes-despacho-prueba/`, payload);
  return res.data;
};

// 🔹 Actualizar relación
export const updateOrdenDespacho = async (id, payload) => {
  console.log("Updating OrdenDespacho with ID:", id, "and payload:", payload);
  const res = await axiosInstance.patch(`/importaciones/ordenes-despacho-prueba/${id}/`, payload);
  return res.data;
};

// 🔹 Eliminar relación
export const deleteOrdenDespacho = async (id, despachoId) => {
  const res = await axiosInstance.delete(
    `/importaciones/ordenes-despacho-prueba/${id}/?despacho_id=${despachoId}`
  );
  return res.data;
};

// 🔹 Cambiar orden_compra de una relación (endpoint custom)
export const cambiarOrdenDespacho = async (id, payload) => {
  const res = await axiosInstance.patch(
    `/importaciones/ordenes-despacho-prueba/${id}/cambiar-orden/`,
    payload
  );
  return res.data;
};

// 🔹 Buscar Orden de Compra (endpoint ya existente en tu backend)
export const buscarOC = async (empresaBase, query) => {
  const res = await axiosInstance.get(`importaciones/buscar_oi/`, {
    params: { base_datos: empresaBase, query },
  });
  return res.data; // [{ numero_oc, producto, proveedor, precio_unitario, cantidad }]
};

export const getOrCreateOC = async (payload) => {
  const res = await axiosInstance.post(`/importaciones/ordenes/get-or-create/`, payload);
  return res.data;
};



