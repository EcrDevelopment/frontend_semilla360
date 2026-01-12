import axiosInstance from '../../src/axiosConfig';

// Prefijo de la URL según cómo hayas configurado tu urls.py principal
// Ejemplo: si en urls.py pusiste path('api/estibaje/', include('apps.estibaje.urls'))
const BASE_URL = "almacen"; 



/**
 * Guarda un nuevo registro de estibaje (Cabecera + Detalles)
 * Endpoint: POST /api/estibaje/registros-estibaje/
 */
export const createRegistroEstibaje = async (payload) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/registros-estibaje/`, payload);
    return response;
  } catch (error) {
    console.error("Error al crear registro de estibaje:", error);
    throw error;
  }
};

/**
 * (Opcional) Verifica si un documento ya existe para evitar duplicados antes de enviar
 * Endpoint: GET /api/estibaje/registros-estibaje/?empresa=X&tipo_documento=Y&nro_documento=Z
 */
export const checkEstibajeExiste = async (empresaId, tipoDoc, nroDoc) => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/registros-estibaje/`, {
      params: {
        empresa: empresaId,
        tipo_documento: tipoDoc,
        nro_documento: nroDoc
      }
    });
    // Si la lista retorna elementos, es que ya existe
    return response.data.length > 0;
  } catch (error) {
    console.error("Error validando existencia:", error);
    return false; // Asumimos false para no bloquear en caso de error de red
  }
};

// LISTAR (GET)
export const getRegistrosEstibaje = (params = {}) => {
    // Axios convierte automáticamente el objeto params a ?key=value
    return axiosInstance.get(`${BASE_URL}/registros-estibaje/`, { params });
};

// ELIMINAR (DELETE)
export const deleteRegistroEstibaje = (id) => {
    return axiosInstance.delete(`${BASE_URL}/registros-estibaje/${id}/`);
};

// EDITAR (PUT)
export const updateRegistroEstibaje = (id, data) => {
    return axiosInstance.put(`${BASE_URL}/registros-estibaje/${id}/`, data);
};

// OBTENER UNO SOLO (Para cargar el form)
export const getRegistroEstibajeById = (id) => {
    return axiosInstance.get(`${BASE_URL}/registros-estibaje/${id}/`);
};