import axiosInstance from '../../src/axiosConfig';

const API_URL = '/importaciones/tipo-documentos/';

export const getTipoDocumentos = () => axiosInstance.get(API_URL);
export const createTipoDocumento = (data) => axiosInstance.post(API_URL, data);
export const updateTipoDocumento = (id, data) => axiosInstance.put(`${API_URL}${id}/`, data);
export const deleteTipoDocumento = (id) => axiosInstance.delete(`${API_URL}${id}/`);