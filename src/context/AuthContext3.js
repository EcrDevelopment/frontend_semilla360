import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { validateToken, loginUser } from '../api/Auth';
import { setAuthCookies } from '../axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const idleTimeout = 900000; // 10 minutos

  const logout = useCallback(() => {
    document.cookie = 'access_token=; Max-Age=0; path=/';
    document.cookie = 'refresh_token=; Max-Age=0; path=/';
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1];

    if (accessToken) {
      try {
        const isValid = await validateToken(accessToken);
        if (isValid) {
          const userData = JSON.parse(localStorage.getItem('user_data') || 'null');
          setIsAuthenticated(true);
          setUser(userData);
          return true;
        }
      } catch (error) {
        console.error('Error en verificación de autenticación:', error);
      }
    }
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

    const interval = setInterval(idleHandler, 10000); // Verifica cada 10 segundos

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        logout();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [checkAuth, logout]);

  const login = async (username, password) => {
    try {
      const result = await loginUser({ username, password });
      if (result.success) {
        const { token, userData } = result;
        setAuthCookies(token.access, token.refresh);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('lastActivity', Date.now().toString());
        return { success: true };
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: 'Ocurrió un error inesperado durante el inicio de sesión.' };
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, isLoading,checkAuth }}>
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
