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
