import axiosInstance from '../axiosConfig';

// Basado en tu almacen/urls.py
const API_URL = '/almacen/productos/';

export const getProductos = (filters = {}) => {
  return axiosInstance.get(API_URL, { params: filters });
};
export const createProducto = (data) => axiosInstance.post(API_URL, data);
export const updateProducto = (id, data) => axiosInstance.put(`${API_URL}${id}/`, data);
export const deleteProducto = (id) => axiosInstance.delete(`${API_URL}${id}/`);