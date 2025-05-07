import axiosInstance from '../axiosConfig';
import { setAuthCookies } from '../axiosConfig';

export async function validateToken(token) {
  try {
    // Obtener el token más reciente de las cookies
    const currentToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1] || token;
    
    // Usar siempre el token más reciente
    const response = await axiosInstance.post('/accounts/auth/token/verify/', { 
      token: currentToken 
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function loginUser(credentials) {
  try {
    const response = await axiosInstance.post('/accounts/auth/login/', credentials);
    const { access, refresh, user, roles, permissions } = response.data;

    // Guarda tokens en cookies
    setAuthCookies(access, refresh);

    return {
      success: true,
      token: { access, refresh },
      userData: user,
      roles,
      permissions
    };
  } catch (error) {
    let errorMessage = 'Ocurrió un error inesperado.';
    if (error.response) {
      // Error con respuesta del servidor
      if (error.response.status === 401) {
        errorMessage = 'Credenciales incorrectas. Por favor, intenta nuevamente.';
      } else {
        errorMessage = `Error del servidor: ${error.response.data.detail || error.response.statusText}`;
      }
    } else if (error.request) {
      // Error sin respuesta del servidor
      errorMessage = 'No se pudo conectar al servidor. Por favor, verifica tu conexión.';
    }
    return { success: false, message: errorMessage };
  }
}

export async function login3User(credentials) {
  try {
    const response = await axiosInstance.post('/accounts/auth/login/', credentials);
    return {
      success: true,
      token: {
        access: response.data.access,
        refresh: response.data.refresh,
      },
      userData: response.data.user,
    };
  } catch (error) {
    let errorMessage = 'Ocurrió un error inesperado.';
    if (error.response) {
      // Error con respuesta del servidor
      if (error.response.status === 401) {
        errorMessage = 'Credenciales incorrectas. Por favor, intenta nuevamente.';
      } else {
        errorMessage = `Error del servidor: ${error.response.data.detail || error.response.statusText}`;
      }
    } else if (error.request) {
      // Error sin respuesta del servidor
      errorMessage = 'No se pudo conectar al servidor. Por favor, verifica tu conexión.';
    }
    return { success: false, message: errorMessage };
  }
}

