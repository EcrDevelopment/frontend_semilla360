import axios from 'axios';

const baseURL = '/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});



// --- Helpers de Cookies ---

/**
 * Función genérica para leer un valor de cookie específico.
 * @param {string} cookieName El nombre de la cookie a leer.
 * @returns {string|null} El valor de la cookie o null si no se encuentra.
 */
export const getTokenFromCookie = (cookieName) => {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${cookieName}=`));
  return cookie ? cookie.split('=')[1] : null;
};

/**
 * Abstracción específica para obtener el token de acceso.
 */
export const getAccessTokenFromCookie = () => getTokenFromCookie('access_token');

/**
 * Abstracción específica para obtener el token de refresco.
 */
export const getRefreshTokenFromCookie = () => getTokenFromCookie('refresh_token');

/**
 * NOTA DE SEGURIDAD: Idealmente, el backend debería establecer estas cookies
 * como HttpOnly. Al establecerlas con document.cookie, son vulnerables
 * a ataques XSS si tu app tiene alguna vulnerabilidad.
 */
export const setAuthCookies = (access, refresh) => {
  document.cookie = `access_token=${access}; path=/; max-age=900`; // 15 minutos
  document.cookie = `refresh_token=${refresh}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 días
};

/**
 * Limpia las cookies de autenticación.
 */
export const clearAuthCookies = () => {
  document.cookie = 'access_token=; Max-Age=0; path=/';
  document.cookie = 'refresh_token=; Max-Age=0; path=/';
}

/**
 * Obtiene el token CSRF del backend.
 * Debería ser llamado durante la inicialización de la app.
 */
export const fetchCsrfToken = async () => {
  try {
    const response = await axiosInstance.get('/accounts/get-csrf-token/');
    const csrfToken = response.data.csrf_Token;

    if (csrfToken) {
      // Django espera el token CSRF en una cookie 'csrftoken'
      document.cookie = `csrftoken=${csrfToken}; path=/; max-age=3600`; // 1 hora
    }
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

// --- Lógica de Refresh (Tu código es excelente) ---

let isRefreshing = false;
let refreshSubscribers = [];

const notifySubscribers = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const refreshAuthToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push(resolve);
    });
  }

  const refreshTokenCookie = getRefreshTokenFromCookie(); // Usando el nuevo helper
  if (!refreshTokenCookie) {
    throw new Error('No refresh token available');
  }

  isRefreshing = true;

  try {
    const response = await axiosInstance.post(`/accounts/auth/token/refresh/`, { refresh: refreshTokenCookie });
    const newToken = response.data.access;
    const newRefreshToken = response.data.refresh;

    setAuthCookies(newToken, newRefreshToken); // Actualiza ambas cookies

    notifySubscribers(newToken);
    return newToken;
  } catch (error) {
    // Si el refresh falla, disparamos el evento para desloguear
    window.dispatchEvent(
      new CustomEvent('auth-error', { detail: { message: 'Token refresh failed' } })
    );
    throw error;
  } finally {
    isRefreshing = false;
  }
};


// --- Interceptores ---

/**
 * INTERCEPTOR DE PETICIÓN (REQUEST)
 * * Tareas:
 * 1. Añade el 'Authorization' Bearer token a todas las peticiones.
 * 2. Añade el 'X-CSRFToken' a peticiones de mutación (POST, PUT, etc.)
 */
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessTokenFromCookie(); // Usando helper
  const csrfToken = getTokenFromCookie('csrftoken'); // Cookie de Django/DRF

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ¡ESTA ES LA PARTE QUE FALTABA!
  // Añade CSRF a métodos "inseguros"
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (csrfToken && unsafeMethods.includes(config.method.toUpperCase())) {
    config.headers['X-CSRFToken'] = csrfToken;
  }

  return config;
});

// Rutas públicas que no deben disparar un refresh de token
const publicEndpoints = [
  '/accounts/auth/login/',
  '/accounts/auth/password/reset/',
  '/accounts/auth/password/reset/confirm/',
  '/accounts/auth/token/verify/',
  '/accounts/get-csrf-token/',
];

/**
 * INTERCEPTOR DE RESPUESTA (RESPONSE)
 * * Tareas:
 * 1. Si la respuesta es 401 (expirado) y no es una ruta pública:
 * 2. Intenta renovar el token usando refreshAuthToken.
 * 3. Reintenta la petición original con el nuevo token.
 * 4. Si el refresh falla, emite 'auth-error' para desloguear.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Evita interferir con rutas públicas
    if (publicEndpoints.some(endpoint => originalRequest.url.includes(endpoint))) {
      return Promise.reject(error);
    }

    // Si es 401 y no se ha reintentado
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAuthToken();

        // Actualiza el header
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // NOTA: Este bloque es para APIs (como /token/verify/) que
        // envían el token en el *cuerpo* de la petición.
        // Si solo usas el header, podrías quitar este bloque.
        if (typeof originalRequest.data === 'string') {
          const parsedData = JSON.parse(originalRequest.data);
          if (parsedData.token) {
            parsedData.token = newToken;
            originalRequest.data = JSON.stringify(parsedData);
          }
        } else if (typeof originalRequest.data === 'object' && originalRequest.data?.token) {
          originalRequest.data.token = newToken;
        }

        // Reintenta la solicitud original
        return axiosInstance(originalRequest); // Usa axiosInstance para re-aplicar interceptores

      } catch (refreshError) {
        // El refresh falló, el evento 'auth-error' ya se disparó
        // en refreshAuthToken()
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;