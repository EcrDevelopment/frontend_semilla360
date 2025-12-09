// src/hooks/useLocalStorageState.js
import { useState, useEffect } from 'react';
/**
 * Un hook personalizado que se comporta como `useState` pero sincroniza
 * el estado con el `localStorage` del navegador.
 *
 * @param {string} key La clave única para guardar en localStorage.
 * @param {*} initialValue El valor inicial a usar si no hay nada en localStorage.
 * @returns [value, setValue] - Un array similar a useState.
 */
export function useLocalStorageState(key, initialValue) {
  // 1. Obtenemos el valor inicial desde localStorage o usamos el 'initialValue'
  const [value, setValue] = useState(() => {
    // Verificamos si window está definido (para evitar errores en SSR)
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      // Si hay algo guardado, lo parseamos. Si no, usamos el valor inicial.
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // En caso de error (ej. JSON mal formado), usamos el valor inicial.
      console.warn(`Error parsing localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // 2. Usamos useEffect para actualizar localStorage CADA VEZ que 'value' cambie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Guardamos el valor en localStorage, convirtiéndolo a string JSON.
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    }
  }, [key, value]); // <-- El efecto se ejecuta si 'key' o 'value' cambian

  return [value, setValue];
}