import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.js';
import { getTokenFromCookie } from '../axiosConfig.js';

// BORRAMOS LA URL FIJA. La calcularemos dinámicamente abajo.
// const WS_URL = 'ws://10.168.0.5:8000/ws/notifications/'; 

const WebSocketContext = createContext({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
  clearLastMessage: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const { isAuthenticated } = useAuth();

  const connect = useCallback(() => {
    // Evitar reconexiones si ya está conectado o conectando
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // 1. Recuperación de Token
    let token = getTokenFromCookie('access_token');
    if (!token) token = localStorage.getItem('access_token');

    if (!token) {
      console.error('[WebSocket] No se encontró token en Cookies ni LocalStorage. Abortando.');
      return;
    }

    // --- LÓGICA DINÁMICA DE URL (AQUÍ ESTÁ LA SOLUCIÓN) ---
    
    // 1. Detectar protocolo: Si es HTTPS, usar WSS. Si es HTTP, usar WS.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // 2. Detectar Host: Usamos el dominio actual (ej: beta.semilla360.online)
    let host = window.location.host; 

    // OJO: Si estás en desarrollo (localhost), el frontend suele estar en puerto 3000
    // pero el backend en el 8000. Hacemos un ajuste manual solo para local.
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // Ajusta esto a tu IP de desarrollo si es necesario
        host = '10.168.0.5:8000'; 
        // O si usas localhost:
        //host = 'localhost:8000';
    }

    // Construimos la URL final
    // En producción quedará: wss://beta.semilla360.online/ws/notifications/?token=...
    const fullWsUrl = `${protocol}//${host}/ws/notifications/?token=${token}`;
    
    console.log(`Intentando conectar`); 
    // -------------------------------------------------------
    
    const socket = new WebSocket(fullWsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ Conectado exitosamente.');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data); 
      } catch (e) {
        console.error('❌ [WebSocket] Error al parsear JSON:', e);
      }
    };

    socket.onclose = (event) => {
      console.log(`[WebSocket] Desconectado (Código: ${event.code})`);
      setIsConnected(false);
      socketRef.current = null;
      
      // Reintentar conexión si no fue un logout voluntario
      if (isAuthenticated && event.code !== 1000) {
        setTimeout(connect, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('[WebSocket] Error de conexión:', error);
    };

  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
    return () => {
      if (socketRef.current) {
        // socketRef.current.close(); // Opcional según tu lógica
      }
    };
  }, [isAuthenticated, connect]);

  const sendMessage = useCallback((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(data));
      } catch(e) { console.error(e); }
    } else {
      console.warn("[WebSocket] No se pudo enviar mensaje (Desconectado).");
    }
  }, []);

  const clearLastMessage = useCallback(() => {
    setLastMessage(null);
  }, []);

  const contextValue = useMemo(() => ({
      isConnected,
      lastMessage,
      sendMessage,
      clearLastMessage,
  }), [isConnected, lastMessage, sendMessage, clearLastMessage]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};