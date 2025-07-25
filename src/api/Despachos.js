import axiosInstance from '../../src/axiosConfig';

export const obtenerDataDespacho = async (id) => {
  if (!id) throw new Error("ID de despacho no proporcionado");

  try {
    const response = await axiosInstance.get(`/importaciones/despacho/editar/`, {
      params: { despacho_id: id },
    });

    const data = response.data;

    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta inesperada del servidor');
    }

    if ('error' in data) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error al obtener el despacho:', error);
    throw error;
  }
};

export const obtenerDespacho = async (id) => {
  if (!id) throw new Error("ID de despacho no proporcionado");

  try {
    const response = await axiosInstance.get(`/importaciones/despachos/${id}/`);

    const data = response.data;

    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta inesperada del servidor');
    }

    if ('error' in data) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error al obtener el despacho:', error);
    throw error;
  }
};

export const actualizarDespacho = async (id, payload) => {
  if (!id) throw new Error("ID de despacho no proporcionado");

  try {
    const response = await axiosInstance.put(`/importaciones/despachos/${id}/`, payload);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el despacho:', error);
    throw error;
  }
  
};

export const buscarProveedor = async (value) => {
  if (!value) throw new Error("Consulta de proveedor no proporcionada");

  try {
    const response = await axiosInstance.get('/importaciones/buscar_proveedores/', {
      params: { query: value},
    });

    const data = response.data;

    if (!data || !Array.isArray(data)) {
      throw new Error('Respuesta inesperada del servidor');
    }

    return data;
  } catch (error) {
    console.error('Error al buscar proveedor:', error);
    throw error;
  }
};

export const buscarTransportista= async (value) => {
  if (!value) throw new Error("Consulta de transportista no proporcionada");

  try {
    const response = await axiosInstance.get('/importaciones/buscar_transportistas/', {
      params: { query: value},
    });

    const data = response.data;

    if (!data || !Array.isArray(data)) {
      throw new Error('Respuesta inesperada del servidor');
    }

    return data;
  } catch (error) {
    console.error('Error al buscar proveedor:', error);
    throw error;
  }
};

export const crearTransportista = async (data) => {
  const response = await axiosInstance.post('/importaciones/transportistas/nuevo/', data);
  return response.data;
};

export const crearProveedor = async (data) => {
  const res = await axiosInstance.post('/importaciones/proveedores/nuevo/', data);
  return res.data;
};
