import axiosInstance from '../axiosConfig'; // Usamos nuestra instancia configurada

const baseURL='/almacen';

/**
 * Obtiene la lista de transferencias filtrada y paginada.
 * @param {object} params - Objeto de parámetros para DRF (ej. { page: 1, estado: 'EN_TRANSITO', search: '...' })
 */
export const getTransferencias = (params) => {
  return axiosInstance.get(`${baseURL}/transferencias/`, { params });
};

/**
 * Obtiene el detalle de una sola transferencia (útil si se necesita).
 * @param {number} id - ID de la transferencia
 */
export const getTransferenciaById = (id) => {
  return axiosInstance.get(`${baseURL}/transferencias/${id}/`);
};

/**
 * Envía los datos de una recepción manual.
 * @param {number} id - ID de la transferencia a recibir
 * @param {object} data - { cantidad_recibida, notas } (según tu RecepcionSerializer)
 */
export const recibirTransferencia = (id, data) => {
  // El endpoint es /api/transferencias/<id>/recibir/
  return axiosInstance.post(`${baseURL}/transferencias/${id}/recibir/`, data);
};

/**
 * Revierte una recepción completada.
 * @param {number} id - ID de la transferencia a revertir
 */
export const revertirTransferencia = (id) => {
  return axiosInstance.post(`${baseURL}/transferencias/${id}/revertir_recepcion/`);
};