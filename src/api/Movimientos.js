import axiosInstance from '../axiosConfig'; // Tu instancia de Axios

const MOVIMIENTOS_URL = '/almacen/movimientos/';
const SYNC_URL = '/almacen/trigger-sync/'; // La URL de tu TriggerSyncAPIView

/**
 * Obtiene los movimientos de almacén paginados y filtrados.
 * @param {object} params - Objeto con parámetros de filtro y paginación.
 */
export const getMovimientos = (params) => {
  return axiosInstance.get(MOVIMIENTOS_URL, { params });
};

/**
 * Dispara la tarea de sincronización en el backend.
 * @param {object} data - Objeto con el alias de la empresa.
 * Ejemplo: { empresa_alias: 'semilla' }
 */
export const triggerSync = (data) => {
  return axiosInstance.post(SYNC_URL, data);
};

/*
* Verifica el estado de la sincronización.
*/
export const checkSyncStatus = () => {  
  return axiosInstance.get('/almacen/check-sync-status/');
};