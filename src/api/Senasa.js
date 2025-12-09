import axiosInstance from '../axiosConfig';

const baseURL = '/importaciones/senasa';

export const consultarRecibosSenasa = (expediente, ruc = '') => {
  return axiosInstance.post(`${baseURL}/consulta_ticket/`, { expediente, ruc });
};

// ACTUALIZADO: Ahora recibe expediente en lugar de ucmid
export const descargarReciboProxy = (expediente, nroRecibo, ruc = '') => {
  return axiosInstance.get(`${baseURL}/descargar_ticket/`, {
    params: { 
        expediente: expediente, 
        nro: nroRecibo,
        ruc: ruc
    },
    responseType: 'blob'
  });
};