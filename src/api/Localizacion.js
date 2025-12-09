// src/api/Almancen.js
import axiosInstance from '../axiosConfig';

export const getDistritoById = async (id) => {
  try {
    const response = await axiosInstance.get(`/localizacion/distritos/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el distrito:", error);
    throw error;
  }
};