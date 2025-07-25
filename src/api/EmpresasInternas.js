import axiosInstance from '../../src/axiosConfig';


export async function listarEmpresas() {
  const response = await axiosInstance.get(`/importaciones/empresas/`);
  return response.data;
}