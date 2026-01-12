import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser } from '../api/Auth';
import { setAuthCookies, getAccessTokenFromCookie, getRefreshTokenFromCookie, clearAuthCookies } from '../axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const idleTimeout = 900000; // 15 minutos

  const logout = useCallback(() => {
    clearAuthCookies();
    localStorage.removeItem('user_data');
    localStorage.removeItem('roles');
    localStorage.removeItem('permissions');
    localStorage.removeItem('lastActivity');
    setIsAuthenticated(false);
    setUser(null);
    setRoles([]);
    setPermissions({});
  }, []);

  const checkAuth = useCallback(() => {
    // 1. Carga síncrona desde el almacenamiento
    const storedUser = JSON.parse(localStorage.getItem('user_data') || 'null');
    const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
    const storedPermissions = JSON.parse(localStorage.getItem('permissions') || '{}');

    // 2. Comprueba si tenemos *algún* token de sesión
    const accessToken = getAccessTokenFromCookie();
    const refreshToken = getRefreshTokenFromCookie();

    // 3. Si tenemos datos Y al menos un token, confiamos en la sesión
    if (storedUser && (accessToken || refreshToken)) {
      setIsAuthenticated(true);
      setUser(storedUser);
      setRoles(storedRoles);
      setPermissions(storedPermissions);
      return true; // ¡Estamos autenticados (aparentemente)!
    }

    // 4. Si no, no lo estamos
    return false;
  }, []);

  // Manejo de tiempo de inactividad
  useEffect(() => {
    const idleHandler = () => {
      const now = Date.now();
      const lastActivity = parseInt(localStorage.getItem('lastActivity'), 10) || now;
      if (now - lastActivity >= idleTimeout) {
        logout();
      }
    };

    const updateActivity = () => localStorage.setItem('lastActivity', Date.now().toString());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    const interval = setInterval(idleHandler, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, [logout]);

  // Inicialización de la autenticación al montar
  useEffect(() => {
    const initAuth = () => {
      const isAuth = checkAuth();
      if (!isAuth) {
        logout(); // Limpia cualquier resto (ej. solo localStorage pero no cookies)
      }
      setIsLoading(false); // ¡Esto ahora es casi instantáneo!
    };

    initAuth();
  }, [checkAuth, logout]);

  // Manejo global de errores de autenticación
  useEffect(() => {
    const handleAuthError = (e) => {
      console.warn('Fallo de autenticación global detectado. Deslogueando...');
      // Usamos el 'logout' del contexto para limpiar todo
      logout();
    };

    window.addEventListener('auth-error', handleAuthError);

    // Limpia el listener al desmontar
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [logout]);

  // Sincronización de logout entre pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Si la 'key' que cambió es 'user_data' (o 'roles', o 'permissions')
      // Y el nuevo valor es 'null' (lo que significa que se borró)
      if (e.key === 'user_data' && e.newValue === null) {
        // Este evento solo se dispara en las *otras* pestañas, no en la
        // que originó el cambio.
        console.log('Detectado logout en otra pestaña. Sincronizando...');

        // Simplemente llamamos a logout() aquí también para limpiar
        // el estado de React en *esta* pestaña.
        logout();
      }
    };

    // Añadimos el listener
    window.addEventListener('storage', handleStorageChange);

    // Limpiamos el listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]); 

  const login = async (username, password) => {
    try {
      const result = await loginUser({ username, password });
      if (result.success) {
        //const { token, userData, roles: userRoles, permissions: userPermissions } = result;
       // console.log('Resultado del login:', result);
        const { access, refresh, userData, roles, permissions } = result;

        
        setAuthCookies(access, refresh);
        // Guarda datos en localStorage
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('roles', JSON.stringify(roles));
        localStorage.setItem('permissions', JSON.stringify(permissions));
        localStorage.setItem('lastActivity', Date.now().toString());

        setIsAuthenticated(true);
        setUser(userData);
        setRoles(roles);
        setPermissions(permissions);
        return { success: true };
      } else {
        logout();
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: 'Ocurrió un error inesperado durante el inicio de sesión.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      user,
      roles,
      permissions,
      isLoading,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};