import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.js';
import { getTokenFromCookie } from '../axiosConfig.js';

// 3. La URL absoluta del backend
const WS_URL = 'ws://10.168.0.5:8000/ws/notifications/';

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

    // 1. Recuperación de Token (Cookie -> LocalStorage)
    let token = getTokenFromCookie('access_token');
    if (!token) token = localStorage.getItem('access_token');

    if (!token) {
      console.error('[WebSocket] No se encontró token en Cookies ni LocalStorage. Abortando.');
      return;
    }

    const fullWsUrl = `${WS_URL}?token=${token}`;
    console.log(`[WebSocket] Intentando conectar...`); 
    
    const socket = new WebSocket(fullWsUrl);
    socketRef.current = socket;

    // --- EVENT HANDLERS (¡ESTO ES LO QUE FALTABA!) ---

    socket.onopen = () => {
      console.log('✅ [WebSocket] Conectado exitosamente.');
      setIsConnected(true);
    };

    // ¡ESTA ES LA PIEZA CLAVE QUE FALTABA!
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Este log confirmará que React ya tiene el dato en la mano
        //console.log('🔥 [Context] MENSAJE RECIBIDO:', data); 
        
        setLastMessage(data); // <--- Esto dispara la actualización en tu componente
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

  // Efecto para conectar al iniciar o al loguearse
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
    
    // Limpieza al desmontar
    return () => {
      if (socketRef.current) {
        // Solo cerramos si el componente se desmonta realmente (ej: cerrar app)
        // socketRef.current.close(1000, 'Unmount');
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