import axiosInstance from '../../src/axiosConfig';

export const obtenerDetallesDespacho = (despachoId) => {
  return axiosInstance.get(`/importaciones/detalle-despacho/?despacho_id=${despachoId}`);
};

export const crearDetalleDespacho = (data) => {
  return axiosInstance.post(`/importaciones/detalle-despacho/crear/`, data);
};

export const actualizarDetalleDespacho = (id, data) => {
  return axiosInstance.put(`/importaciones/detalle-despacho/${id}/editar/`, data);
};

export const eliminarDetalleDespacho = (id) => {
  return axiosInstance.delete(`/importaciones/detalle-despacho/${id}/eliminar/`);
};