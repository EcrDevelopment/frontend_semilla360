// src/hooks/useSyncSocket.js
import { useEffect, useRef } from 'react';
import { message } from 'antd';

/**
 * Función helper para leer un valor de cookie específico.
 * (La necesitamos aquí porque este hook es independiente de axiosConfig)
 */
const getTokenFromCookie = (cookieName) => {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${cookieName}=`));
  return cookie ? cookie.split('=')[1] : null;
};

/**
 * Hook personalizado para manejar la conexión WebSocket de estado de sincronización.
 * @param {function} onMessageCallback - Función a llamar cuando se recibe un mensaje.
 */
function useSyncSocket(onMessageCallback) {
  // Usamos useRef para mantener la referencia del socket
  // sin causar re-renders.
  const socketRef = useRef(null);

  useEffect(() => {
    // --- LÓGICA DE CONEXIÓN MODIFICADA ---
    
    // 1. Obtener el token de la cookie (el mismo que usa tu axios)
    const token = getTokenFromCookie('access_token');
    
    if (!token) {
      console.log('useSyncSocket: No hay token de acceso, no se conectará.');
      // No intentes conectar si no hay token (ej. el usuario no está logueado)
      return; 
    }

    // 2. Construir la URL del WebSocket
    // Determina el protocolo: wss: (seguro) o ws: (inseguro)
   // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
   const protocol =  'ws:';
    
    // --- CORRECCIÓN 2: ASEGURAR LA RUTA COMPLETA ---
    // Esta es la ruta que tu backend (routing.py) espera
    const socketURL = `${protocol}//${window.location.host}/api/ws/sync-status/?token=${token}`;

    // 3. Crear la instancia del WebSocket
    const ws = new WebSocket(socketURL);

    // Guardar la referencia
    socketRef.current = ws;

    // --- Manejadores de eventos del WebSocket ---

    ws.onopen = () => {
      console.log('Socket de Sincronización Conectado.');
      // Opcional: Notificar al usuario
      // message.success('Conectado al estado del servidor.', 0.5);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Solo reaccionar a los mensajes de nuestro 'sync_update'
        if (data.type === 'sync_update') {
          // Llama a la función que nos pasaron desde el componente
          onMessageCallback(data);
        }
      } catch (e) {
        console.error('Error al parsear mensaje de WebSocket:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('Error en WebSocket:', error);
      // Si el middleware JWT falla (token expirado), el backend cerrará la conexión
      // y verás un error aquí.
      message.error('Fallo al conectar con el servicio de tiempo real.', 3);
    };

    ws.onclose = () => {
      console.log('Socket de Sincronización Desconectado.');
      // Aquí podrías implementar lógica de reconexión si el token expiró,
      // pidiendo al usuario que refresque la página.
    };

    // --- Limpieza ---
    // Esta función se llama cuando el componente (MovimientoAlmacenList)
    // se "desmonta" (ej. el usuario cambia de página).
    return () => {
      if (socketRef.current) {
        console.log('Cerrando socket...');
        socketRef.current.close();
      }
    };

  }, [onMessageCallback]); // Volver a correr si la función callback cambia
}

export default useSyncSocket;