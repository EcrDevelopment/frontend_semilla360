import axios from 'axios';

const baseURL = 'http://127.0.0.1:8000/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});


let isRefreshing = false;
let refreshSubscribers = [];


const fetchCsrfToken = async () => {
  try {
    const response = await axios.get(`${baseURL}/accounts/get-csrf-token/`, {
      withCredentials: true, // Incluye las cookies en la solicitud
    });

    const csrfToken = response.data.csrf_Token;    

    // Opcional: Almacena el token CSRF en las cookies manualmente (si no se hace automáticamente)
    if (csrfToken) {
      document.cookie = `csrftoken=${csrfToken}; path=/; max-age=3600`; // 1 hora
    }

    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

(async () => {
  const csrfToken = await fetchCsrfToken();
  if (csrfToken) {
    
  } else {
    console.error('No se pudo inicializar el Token CSRF');
  }
})();

const notifySubscribers = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const getTokenFromCookie = (cookieName) => {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${cookieName}=`));
  return cookie ? cookie.split('=')[1] : null;
};

export const setAuthCookies = (access, refresh) => {
  document.cookie = `access_token=${access}; path=/; max-age=900`; // 15 minutos
  document.cookie = `refresh_token=${refresh}; path=/; max-age=${7 * 24 * 60 * 60}`; // 24 horas
};

const refreshAuthToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push(resolve);
    });
  }

  const refreshTokenCookie = getTokenFromCookie('refresh_token');
  if (!refreshTokenCookie) {
    throw new Error('No refresh token available');
  }

  isRefreshing = true;
  //console.log('Iniciando refresh de token...');

  try {
    const response = await axios.post(`${baseURL}/accounts/auth/token/refresh/`, { refresh: refreshTokenCookie }, { withCredentials: true });
    const newToken = response.data.access;
    const newRefreshToken = response.data.refresh;
    //console.log('Nuevo Token generado:', newToken);

    // Actualizar las cookies con el nuevo token
    setAuthCookies(newToken, newRefreshToken);
    //console.log('Cookies actualizadas');

    notifySubscribers(newToken);
    return newToken;
  } catch (error) {
    //console.error('Error en refresh de token:', error);
    throw error;
  } finally {
    isRefreshing = false;
  }
};



// Request interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = getTokenFromCookie('access_token');  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;    
  }  
  
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response, // Responder normalmente si no hay errores
  async (error) => {
    const originalRequest = error.config;

    // Verificar si es el endpoint de login
    if (originalRequest.url === '/accounts/auth/login/') {
      // Devolver el error directamente sin intentar renovar tokens
      return Promise.reject(error);
    }

    // Si el error es 401 y la solicitud no ha sido marcada para reintentar
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAuthToken();

        // Actualizamos solo el header de Authorization con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Actualizamos el token dentro del cuerpo si existe
        if (typeof originalRequest.data === 'string') {
          const parsedData = JSON.parse(originalRequest.data);
          parsedData.token = newToken;
          originalRequest.data = JSON.stringify(parsedData);
        } else if (typeof originalRequest.data === 'object' && originalRequest.data !== null) {
          originalRequest.data.token = newToken;
        } else {
          originalRequest.data = JSON.stringify({ token: newToken });
        }

        // Reintentar la solicitud original con el nuevo token
        return axios(originalRequest);
      } catch (refreshError) {
        // Emitir un evento para notificar que la renovación del token falló
        window.dispatchEvent(
          new CustomEvent('auth-error', {
            detail: { message: 'Token refresh failed' },
          })
        );
        return Promise.reject(refreshError);
      }
    }

    // Devolver otros errores
    return Promise.reject(error);
  }
);


export default axiosInstance;
