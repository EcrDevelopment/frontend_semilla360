import axiosInstance from '../../src/axiosConfig';

export const obtenerGastosExtraPorDespacho = (despachoId) =>
  axiosInstance.get(`/importaciones/gastos-extra/?despacho_id=${despachoId}`);

export const crearGastoExtra = (data) =>
  axiosInstance.post('/importaciones/gastos-extra/crear/', data);

export const editarGastoExtra = (id, data) =>
  axiosInstance.put(`/importaciones/gastos-extra/${id}/editar/`, data);

export const eliminarGastoExtra = (id) =>
  axiosInstance.delete(`/importaciones/gastos-extra/${id}/eliminar/`);