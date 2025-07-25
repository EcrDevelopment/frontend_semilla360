import axiosInstance from '../../src/axiosConfig';


// Obtener configuración por despacho_id
export const obtenerConfiguracionDespacho = async (despachoId) => {
  return axiosInstance.get(`/importaciones/configuracion-despacho/`, {
    params: { despacho_id: despachoId },
  });
};

// Editar configuración por ID
export const editarConfiguracionDespacho = async (id, data) => {
  return axiosInstance.put(`/importaciones/configuracion-despacho/${id}/editar/`, data);
};