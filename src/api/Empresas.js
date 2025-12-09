import axiosInstance from '../../src/axiosConfig';

// Basado en tu almacen/urls.py, este es el endpoint
const API_URL = '/almacen/empresas/';

export const getEmpresas = () => axiosInstance.get(API_URL);
export const createEmpresa = (data) => axiosInstance.post(API_URL, data);
export const updateEmpresa = (id, data) => axiosInstance.put(`${API_URL}${id}/`, data);
export const deleteEmpresa = (id) => axiosInstance.delete(`${API_URL}${id}/`);