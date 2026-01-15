// src/api/Auth.js
import axiosInstance, { setAuthCookies, getTokenFromCookie } from '../axiosConfig';

/**
 * Centraliza el manejo de errores de autenticación de Axios.
 * @param {Error} error El objeto de error capturado.
 * @returns {string} Un mensaje de error descriptivo para el usuario.
 */
function handleAuthError(error) {
  if (error.response) {
    // El servidor respondió con un código de error (4xx, 5xx)
    if (error.response.status === 401) {
      return 'Credenciales incorrectas. Por favor, intenta nuevamente.';
    }
    // Otros errores del servidor (ej. 400, 500)
    const detail = error.response.data?.detail;
    return `Error del servidor: ${detail || error.response.statusText}`;
  
  } else if (error.request) {
    // La petición se hizo pero no se recibió respuesta (ej. sin red)
    return 'No se pudo conectar al servidor. Por favor, verifica tu conexión.';
  
  } else {
    // Error al configurar la petición
    return 'Ocurrió un error inesperado al preparar la solicitud.';
  }
}

/**
 *  Valida el token de autenticación actual.  
 * @returns {Promise<boolean>} Indica si el token es válido.  
*/
export async function validateToken() {
  try {
    // 1. Obtener el token de la fuente de verdad (tu helper de cookies)
    const currentToken = getTokenFromCookie(); 

    // 2. Si no hay token, no gastar una llamada de API
    if (!currentToken) {
      return false;
    }
    
    // 3. Usar siempre el token más reciente
    await axiosInstance.post('/accounts/auth/token/verify/', { 
      token: currentToken 
    });
    
    return true;

  } catch (error) {
    // Si la verificación falla (ej. 401), la API devuelve un error.
    return false;
  }
}
/**
 * Inicia sesión con las credenciales proporcionadas y guarda los tokens en cookies.
 * @param {*} credentials 
 * @returns  {Promise<{success: boolean, token?: {access: string, refresh: string}, userData?: object, roles?: array, permissions?: object, message?: string}>}
 */
export async function loginUser(credentials) {
  try {
    const response = await axiosInstance.post('/accounts/auth/login/', credentials);
    const { access, refresh, user, roles, permissions } = response.data;
    //console.log(roles, permissions);
    // Guarda tokens en cookies
    setAuthCookies(access, refresh);
    return {
      success: true,
      access: access,
      refresh: refresh,
      userData: user,
      roles,
      permissions
    };

  } catch (error) {
    // ¡MUCHO MÁS LIMPIO!
    return { success: false, message: handleAuthError(error) };
  }
}

/**
 * verifica las credenciales proporcionadas sin modificar el estado de autenticación.
 * @param {*} credentials 
 * @returns retorna {Promise<{success: boolean, token?: {access: string, refresh: string}, userData?: object, message?: string}>}
 */
export async function verifyCredentials(credentials) {
  try {
    const response = await axiosInstance.post('/accounts/auth/login/', credentials);
    const { access, refresh, user } = response.data;
    // No llama a setAuthCookies (diferencia clave)

    return {
      success: true,
      access: access,
      refresh: refresh,
      userData: user
      // No devuelve roles ni permisos (diferencia clave)
    };
  } catch (error) {
    // ¡MUCHO MÁS LIMPIO!
    return { success: false, message: handleAuthError(error) };
  }
}