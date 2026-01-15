import axiosInstance from '../../src/axiosConfig';


export async function listarEmpresas() {
  const response = await axiosInstance.get(`/importaciones/empresas/`);
  //console.log(response.data);
  return response.data;
}