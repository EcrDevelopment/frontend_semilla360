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


export const listarArchivos = async (searchTerm = '') => {
  const response = await axiosInstance.get(`/importaciones/listar_archivos/?numero=${searchTerm}`);
  return response.data;  // <== esto es lo importante
};


export const listarDeclaracionesPorUsuario = async (searchTerm = '') => {
  const response = await axiosInstance.get(`/importaciones/listar_declaraciones_por_usuario/?numero=${searchTerm}`);
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


export const obtenerDocumentosExpedienteAgrupadosPorTipo = async (declaracionId) => {
  try {
    const response = await axiosInstance.get(`/importaciones/listar_documentos_expediente_por_tipo/${declaracionId}/`);
    return response.data; // esto será un objeto agrupado por tipo
  } catch (error) {
    console.error('Error al obtener los documentos agrupados por tipo:', error);
    throw error;
  }
};


export const eliminarDocumentoExpediente = async (idDocumento) => {
  try {
    const response = await axiosInstance.delete(`/importaciones/expedientes/eliminar_documento/${idDocumento}/`);
    return response.data; // esto será un objeto agrupado por tipo
  } catch (error) {
    console.error('Error al elimnar documento de expediente:', error);
    throw error;
  }
};

export const ActualizarMesAnioFiscal = async (declaracionId,anioFiscal, mesFiscal) => {
  try {
    const response = await axiosInstance.post(`/importaciones/expedientes/${declaracionId}/actualizar_fiscal/`, {
      anio_fiscal: anioFiscal,
      mes_fiscal: mesFiscal,
    });
    return response.data;
  } catch (error) {
    console.error("Error actualizando año/mes fiscal:", error);
    throw error;
  }
};

export const ActualizarFolioDocumentoExpediente = async (idDocumento, folio) => {
  try {
    const response = await axiosInstance.patch(`/importaciones/expedientes/${idDocumento}/actualizar-folio/`, {
      folio: folio,
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar folio:", error);
    throw error;
  }
};

export const ActualizarEmpresaDocumentoExpediente = async (idDocumento, empresa) => {
  try {
    const response = await axiosInstance.post(`/importaciones/expedientes/${idDocumento}/actualizar-empresa/`, {
      empresa: empresa,
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar folio:", error);
    throw error;
  }
};


// Obtener documentos por declaración
export const getDocumentosPorDeclaracionUsuario = async (numero, anio) => {
  const response = await axiosInstance.get(`/importaciones/documentos_por_declaracion_usuario/${numero}/${anio}/`);
  return response.data;
};

export const getDocumento=async (documentoId)=>{
  try {
    // Realiza una petición GET al endpoint seguro de tu backend
    const response = await axiosInstance.get(`/importaciones/documentos/${documentoId}/`, {
      responseType: 'blob', // Esperamos una respuesta binaria (el PDF)
    });
    // Devuelve el blob de datos. El componente se encargará de crear la URL de objeto.
    return response.data;
  } catch (error) {
    console.error("Error al obtener documento para visualizar:", error);
    // Es crucial lanzar el error para que el componente que llama pueda capturarlo
    // y mostrar un mensaje al usuario.
    throw error;
  }

}

export const asignarPaginasDocumento = async (documentoId, asignaciones) => {
  const response = await axiosInstance.post(`/importaciones/documentos/asignar-paginas/`, {
    documento_id: documentoId,
    asignaciones: asignaciones
  });
  return response.data;
};

export const eliminarHojasPdf = async (documentoId, paginasAeliminar) => {
  try {
    const response = await axiosInstance.post(
      `/importaciones/documentos/${documentoId}/editar-pdf/`, // <-- URL del backend
      { paginas_a_eliminar: paginasAeliminar } // Cuerpo de la solicitud
    );
    return response.data; // Retorna los datos de la respuesta (mensaje, nuevo_documento_id, etc.)
  } catch (error) {
    console.error("Error al editar documento PDF:", error);
    throw error; // Lanza el error para que el componente que llama lo maneje
  }
};

export const getDocumentoVisualizarUrl = async (documentId) => {
  try {
    // Realiza una petición GET al endpoint seguro de tu backend
    const response = await axiosInstance.get(`/importaciones/documentos/${documentId}/visualizar/`, {
      responseType: 'blob', // Esperamos una respuesta binaria (el PDF)
    });
    // Devuelve el blob de datos. El componente se encargará de crear la URL de objeto.
    return response.data;
  } catch (error) {
    console.error("Error al obtener documento para visualizar:", error);
    // Es crucial lanzar el error para que el componente que llama pueda capturarlo
    // y mostrar un mensaje al usuario.
    throw error;
  }
};

export const descargarDocumentoIndividual = async (id) => {
  try {
    const response = await axiosInstance.get(`/importaciones/descargar_documento/${id}/`, {
      responseType: 'blob',
    });

    // Ver todos los headers
    console.log("Headers de la respuesta:", response.headers);

    // Extraer nombre del archivo desde Content-Disposition
    const disposition = response.headers['content-disposition'];
    let fileName = 'documento';

    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1]);
      }
    }

    // Usar Content-Type del servidor
    const mimeType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: mimeType });

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error al descargar el documento:', error);
  }
};



// Obtener documentos por declaración a partir de und ID de documento relacionado
export const listarDocumentos = async (id) => {
  try {
    const response = await axiosInstance.get(`/importaciones/documentos-relacionados/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error al listar documentos relacionados:', error);
    return [];
  }
};

// Ejemplo función para combinar PDFs (si tienes un endpoint así)
export const combinarPDFs = async (documentosIds, nuevoNombre) => {
  return axiosInstance.post("/importaciones/documentos/combinar-pdf/", {
    documentos: documentosIds,
    nombre_nuevo: nuevoNombre
  });
};

// Ejemplo para agregar archivo PDF existente a expediente
export const agregarArchivoExistente = async (expedienteId, documentoId) => {
  return axiosInstance.post(`/importaciones/documentos/${expedienteId}/agregar-archivo/`, {
    documento_id: documentoId
  });
};



export const descargarDocumentosExpedienteUnificados = async (declaracionId) => {
  const url = `/importaciones/expedientes/${declaracionId}/descargar_unificado/`;

  const response = await axiosInstance.get(url, {
    responseType: 'blob', // necesario para archivos binarios
  });

  // Crear un enlace para descargar
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `documentos_declaracion_${declaracionId}.pdf`;
  link.click();
};