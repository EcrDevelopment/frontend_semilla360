import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configura un temporizador para actualizar el valor "debounced"
    // después del 'delay' especificado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Función de limpieza:
    // Esto cancela el temporizador si 'value' o 'delay' cambian
    // antes de que el temporizador se cumpla.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se re-ejecuta si 'value' o 'delay' cambian

  return debouncedValue;
}

export default useDebounce;