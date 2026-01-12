import axiosInstance from '../../src/axiosConfig';

// Asegúrate de que este BASE_URL coincida con tu urls.py
const BASE_URL = "almacen"; 



/**
 * Obtiene el catálogo de tipos de servicios (Carga, Descarga, Trasbordo, etc.)
 * Endpoint: GET /api/estibaje/tipos-estibaje/
 */
export const getTiposEstibaje = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/tipos-estibaje/`);
    
    // 1. Intentamos sacar la lista de 'results' (si hay paginación)
    // 2. Si no hay 'results', usamos response.data completo
    let data = response.data.results || response.data;

    // 3. SEGURIDAD TOTAL: Si por alguna razón 'data' no es un array (es null o un objeto),
    // devolvemos un array vacío [] para que React no explote.
    return Array.isArray(data) ? data : []; 
    
  } catch (error) {
    console.error("Error cargando tipos:", error);
    return []; // En caso de error de red, devolvemos lista vacía
  }
};


// CREAR (POST)
export const createTipoEstibaje = async (payload) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/tipos-estibaje/`, payload);
    return response.data;
  } catch (error) {
    console.error("Error creando tipo de estibaje:", error);
    throw error;
  }
};

// EDITAR (PUT/PATCH)
export const updateTipoEstibaje = async (id, payload) => {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/tipos-estibaje/${id}/`, payload);
    return response.data;
  } catch (error) {
    console.error("Error actualizando tipo de estibaje:", error);
    throw error;
  }
};

// ELIMINAR (DELETE)
export const deleteTipoEstibaje = async (id) => {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/tipos-estibaje/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error eliminando tipo de estibaje:", error);
    throw error;
  }
};

/**
 * --- SECCIÓN: REGISTRO OPERATIVO ---
 */
// (Aquí siguen tus funciones de createRegistroEstibaje, checkEstibajeExiste, etc.)
export const createRegistroEstibaje = async (payload) => {
    // ... (código existente)
    const response = await axiosInstance.post(`${BASE_URL}/registros-estibaje/`, payload);
    return response;
};