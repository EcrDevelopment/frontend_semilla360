// src/api/Almancen.js
import axiosInstance from '../axiosConfig';

const API_URL = '/almacen/almacenes/';

// Consultar guía de remisión por empresa, serie y número
export const consultarGuia = async ({ empresa, grenumser, grenumdoc }) => {
  return axiosInstance.get(`/almacen/consulta-guia/`, {
    params: { empresa, grenumser, grenumdoc },
  });
};
export const getAlmacenes = (params = {}) => {  
  return axiosInstance.get(API_URL, { params }); 
};
export const createAlmacen = (data) => axiosInstance.post(API_URL, data);
export const updateAlmacen = (id, data) => axiosInstance.put(`${API_URL}${id}/`, data);
export const deleteAlmacen = (id) => axiosInstance.delete(`${API_URL}${id}/`);