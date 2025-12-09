import axiosInstance from '../axiosConfig';

// Endpoint del backend para stock
const API_URL = '/almacen/stock/';

/**
 * Obtiene los registros de stock filtrados.
 * @param {object} params - Objeto de filtros (ej: { empresa: 1, almacen: 2, search: 'soya', solo_con_stock: true })
 * @returns Promise
 */
export const getStock = (params = {}) => {
  return axiosInstance.get(API_URL, { params });
};


// Define la URL base de tu API de almacén
const BASE_URL = '/almacen';

/**
 * Llama al endpoint de reporte de Kárdex detallado.
 * * @param {object} params - Los parámetros de filtro.
 * @param {number} params.empresa_id - ID de la Empresa.
 * @param {number} params.almacen_id - ID del Almacén.
 * @param {Array<number>} params.producto_ids - Lista de IDs de productos [123, 124].
 * @param {string} params.fecha_inicio - Fecha en formato 'YYYY-MM-DD'.
 * @param {string} params.fecha_fin - Fecha en formato 'YYYY-MM-DD'.
 * @returns {Promise<object>} La respuesta de la API (el objeto con los Kárdex por producto).
 */
export const fetchKardexReport = async ({ empresa_id, almacen_id, producto_ids, fecha_inicio, fecha_fin }) => {
  
  // URLSearchParams es la forma correcta de pasar listas en un GET
  const searchParams = new URLSearchParams();
  searchParams.append('empresa_id', empresa_id);
  searchParams.append('almacen_id', almacen_id);
  searchParams.append('fecha_inicio', fecha_inicio);
  searchParams.append('fecha_fin', fecha_fin);

  // ¡Magia! Añade cada ID de producto como un parámetro 'producto_id'
  producto_ids.forEach(id => {
    searchParams.append('producto_id', id);
  });

  try {
    // Realiza la llamada GET
    // ej: /api/almacen/reporte-kardex/?empresa_id=1&producto_id=10&producto_id=11...
    const response = await axiosInstance.get(`${BASE_URL}/reporte-kardex/`, {
      params: searchParams
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el reporte de Kárdex:", error.response?.data || error.message);
    // Propaga el error para que el componente lo pueda manejar
    throw error;
  }
};




export const downloadKardexExport = async (filtros, formato) => {
  // Mapeamos los filtros para asegurarnos que coincidan con lo que espera el Backend
  // Nota: Cambiamos 'productoIds' (frontend) a 'producto_id' (backend key para getlist)
  const params = {
    empresa_id: filtros.empresaId,
    almacen_id: filtros.almacenId,
    producto_id: filtros.productoIds, // Pasamos el array directo aquí
    fecha_inicio: filtros.rangeFechas[0].format('YYYY-MM-DD'),
    fecha_fin: filtros.rangeFechas[1].format('YYYY-MM-DD'),
    export_format: formato, // 'excel' o 'pdf'
  };

  return axiosInstance.get(`${BASE_URL}/reporte-kardex/`, { 
    params: params,
    responseType: 'blob', // CRUCIAL: Esperamos un archivo binario
    
    // ESTO ES LO MÁS IMPORTANTE PARA ARRAYS EN DRF:
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (Array.isArray(value)) {
          // Si es array, agregamos 'key=val' por cada elemento
          // Esto genera: producto_id=1&producto_id=2
          value.forEach(val => searchParams.append(key, val));
        } else if (value !== null && value !== undefined) {
          searchParams.append(key, value);
        }
      });
      return searchParams.toString();
    }
  });
};