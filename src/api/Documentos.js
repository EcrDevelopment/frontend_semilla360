import axiosInstance from '../../src/axiosConfig';

// Procesar archivo ZIP/RAR
export const procesarArchivoComprimido = async (archivo) => {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return axiosInstance.post("/importaciones/procesar_comprimido/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Guardar asignaciones luego de procesar ZIP
export const guardarAsignacionesDua = async (asignaciones, archivoTemp) => {
  return axiosInstance.post("/importaciones/asignar_comprimido/", {
    archivo_temp: archivoTemp,
    asignaciones: asignaciones
  });
};

// Subir archivos individuales (directos)
export const subirArchivosIndividuales = async (numero_dua, anio, archivos) => {
  const formData = new FormData();
  formData.append("numero_dua", numero_dua);
  formData.append("anio", anio);
  archivos.forEach((archivo) => formData.append("archivos", archivo));
  return axiosInstance.post("/importaciones/carga_directa/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};


// Listar declaraciones con documentos
export const listarDeclaraciones = async (searchTerm = '') => {
  const response = await axiosInstance.get(`/importaciones/listar_declaraciones/?numero=${searchTerm}`);
  return response.data;  // <== esto es lo importante
};

// Eliminar documento
export const eliminarDocumento = async (id) => {
  return axiosInstance.delete(`/importaciones/eliminar_documento/${id}/`);
};

// Descargar todos los documentos en un ZIP
export const descargarZip = async (numero, anio) => {
  return axiosInstance.get(`/importaciones/descargar_zip/${numero}/${anio}/`, {
    responseType: 'blob',
  });
};

// Obtener documentos por declaración
export const getDocumentosPorDeclaracion = async (numero, anio) => {
  const response = await axiosInstance.get(`/importaciones/documentos_por_declaracion/${numero}/${anio}/`);
  return response.data;
};

// Descargar documento individual
export const descargarDocumentoIndividual = async (id) => {
  const response = await axiosInstance.get(`/importaciones/descargar_documento/${id}/`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  // Asumimos que el servidor devuelve el nombre del archivo en el header Content-Disposition
  const contentDisposition = response.headers['content-disposition'];
  let filename = `documento_${id}.pdf`;

  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};