import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Badge,
  Button,
  Modal,
  Upload,
  message,
  List,
  Popconfirm,
  Tooltip,
  Input, // Importamos Input para el filtro personalizado
  Space, 
  Spin,
} from "antd";
import {
  AiOutlinePlus,
  AiOutlineEdit,
  AiOutlineDownload,
  AiOutlineDelete,
  AiOutlineEye, 
  // Importamos el icono de visualización
} from "react-icons/ai";
import { SearchOutlined, InboxOutlined, SnippetsOutlined, LoadingOutlined } from "@ant-design/icons"; // Importamos el icono de búsqueda

// Asegúrate de que las rutas de importación sean correctas para tus funciones API
import {
  listarDeclaraciones,
  subirArchivosIndividuales,
  eliminarDocumento,
  descargarZip,
  getDocumentosPorDeclaracion,
  descargarDocumentoIndividual,
  getDocumentoVisualizarUrl, // ¡Importamos la función para visualizar el documento de forma segura!
} from "../../../api/Documentos";

const ListadoDeclaraciones = () => {
  const [declaraciones, setDeclaraciones] = useState([]);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [declSeleccionada, setDeclSeleccionada] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Referencia para el input de búsqueda en el filtro (para enfocarlo)
  const searchInputRef = useRef(null);

  useEffect(() => {
    cargarDeclaraciones();
  }, []);

  const cargarDeclaraciones = async () => {
    setLoading(true);
    try {      
      const data = await listarDeclaraciones();
      setDeclaraciones(data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar declaraciones:", error);
      message.error("Error al cargar las declaraciones.");
      setLoading(false);
    }
  };

  const handleAgregar = (declaracion) => {
    setDeclSeleccionada(declaracion);
    setFileList([]);
    setModalAgregarVisible(true);
  };

  const handleEditar = async (declaracion) => {
    setDeclSeleccionada(declaracion);
    try {
      const data = await getDocumentosPorDeclaracion(
        declaracion.numero,
        declaracion.anio
      );
      setDocumentos(data);
      setModalEditarVisible(true);
    } catch (error) {
      console.error("Error al obtener documentos por declaración:", error);
      message.error("Error al cargar los documentos de la declaración.");
    }
  };

  const handleEditarPdf = (id) => {
    navigate(`/editar-pdf/${id}`);
  }

  const handleCrearExpediente = (id, numero, anio) => {
    navigate(`/importaciones/crear-archivo-dua/${id}/${numero}/${anio}`);
  }

  const handleSubirArchivos = async () => {
    try {
      if (fileList.length === 0) {
        message.warning("Por favor, selecciona al menos un archivo para subir.");
        return;
      }

      const archivos = fileList.map((file) => file.originFileObj);

      // CAPTURAMOS EL RESULTADO AQUÍ 👇
      const res = await subirArchivosIndividuales(
        declSeleccionada.numero,
        declSeleccionada.anio,
        archivos
      );

      // Validamos si hubo archivos omitidos
      if (res?.data?.archivos_omitidos?.length > 0) {
        Modal.warning({
          title: "Carga completada con advertencias",
          content: (
            <div>
              <p>
                Los siguientes archivos ya están registrados en otras declaraciones:
              </p>
              <ul>
                {res.data.archivos_omitidos.map((item, index) => (
                  <li key={index}>
                    <strong>{item.archivo}</strong> ya está en la DUA{" "}
                    <strong>{item.registrado_en}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ),
          width: 600,
        });
        setModalAgregarVisible(false);
      } else {
        message.success("Archivos cargados correctamente.");
        setModalAgregarVisible(false);
        cargarDeclaraciones();
      }

    } catch (err) {
      console.error("Error al subir archivos:", err);
      message.error("Error al subir archivos.");
    }
  };


  const handleEliminar = async (idDoc) => {
    try {
      await eliminarDocumento(idDoc);
      const actualizados = documentos.filter((d) => d.id !== idDoc);
      setDocumentos(actualizados);
      message.success("Documento eliminado");
    } catch (err) {
      console.error("Error al eliminar documento:", err);
      message.error("Error al eliminar documento.");
    }
  };

  const handleDescargarZIP = async (declaracion) => {
    try {
      // Hacer la petición al backend
      const response = await descargarZip(declaracion.numero, declaracion.anio);

      // Verificar que la respuesta sea un blob
      const blob = response.data;

      // Crear un objeto URL a partir del blob recibido
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace para iniciar la descarga
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${declaracion.numero}-${declaracion.anio}.zip`
      ); // Nombre del archivo
      document.body.appendChild(link);

      // Hacer clic en el enlace para iniciar la descarga
      link.click();

      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(url); // Liberar memoria
      message.success("Descarga iniciada.");
    } catch (error) {
      console.error("Error al descargar el archivo ZIP:", error);
      message.error("Error al descargar el archivo ZIP.");
    }
  };

  // Función para visualizar el documento en una nueva pestaña (AHORA CON MANEJO DE ERRORES)
  const handleViewDocument = async (documentId) => {
    try {
      // Llama a la función de la API para obtener el blob del documento
      const documentBlob = await getDocumentoVisualizarUrl(documentId);

      // Crea una URL de objeto a partir del blob
      const url = window.URL.createObjectURL(documentBlob);

      // Abre la URL en una nueva pestaña
      window.open(url, '_blank');

      // Libera la URL de objeto después de un breve tiempo (o cuando la pestaña se cierra, si pudieras detectarlo)
      // Esto es importante para liberar memoria.
      setTimeout(() => window.URL.revokeObjectURL(url), 60000); // Revocar después de 1 minuto

    } catch (error) {
      console.error("Error al visualizar documento:", error);
      let errorMessage = "Error al visualizar el documento.";

      // Manejo de errores específicos de Axios
      if (error.response) {
        // El servidor respondió con un status code fuera del rango 2xx
        if (error.response.status === 403) {
          errorMessage = "No tienes permiso para visualizar este documento.";
        } else if (error.response.status === 404) {
          errorMessage = "El documento no fue encontrado.";
        } else if (error.response.status === 400) {
          errorMessage = "Solicitud inválida para visualizar el documento. Asegúrate que sea un PDF.";
        } else {
          errorMessage = `Error del servidor (${error.response.status}): ${error.response.statusText}`;
        }
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta (ej. red caída)
        errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión.";
      } else {
        // Algo más ocurrió al configurar la solicitud
        errorMessage = `Error: ${error.message}`;
      }
      message.error(errorMessage);
    }
  };

  // --- Lógica para el filtro personalizado de la tabla ---

  // Función para manejar la búsqueda (cuando se presiona "Buscar" o "Enter")
  const handleSearch = (selectedKeys, confirm) => {
    confirm(); // Confirma el filtro en la tabla
  };

  // Función para manejar el reseteo del filtro
  const handleReset = (clearFilters, confirm) => {
    clearFilters(); // Limpia los filtros de la tabla de Ant Design
    confirm(); // Importante: Confirma el filtro vacío para resetear la tabla
  };

  // Función que retorna las props necesarias para un filtro de búsqueda en una columna
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInputRef} // Asocia la referencia al input
          placeholder={`Buscar ${dataIndex === "numero" ? "Número DUA" : dataIndex
            }`}
          value={selectedKeys[0]} // El valor del input está controlado por selectedKeys
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          // Al presionar Enter, se confirma el filtro
          onPressEnter={() => handleSearch(selectedKeys, confirm)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
          <Button
            // Pasa 'confirm' a handleReset para que pueda aplicar el filtro vacío
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    // La función onFilter se encarga de la lógica de filtrado real
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase())
        : "",
    // Propiedad actualizada para manejar la apertura del dropdown (para evitar la advertencia de deprecación)
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          // Enfoca el input de búsqueda cuando el dropdown se abre
          setTimeout(() => searchInputRef.current?.select(), 100);
        }
      },
    },
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Número DUA",
      dataIndex: "numero",
      key: "numero",
      ...getColumnSearchProps("numero"),
    },
    {
      title: "Año",
      dataIndex: "anio",
      key: "anio",
    },
    {
      title: "Documentos",
      key: "documentos_count",
      render: (_, record) => (
        <Badge count={record.documentos_count || 0} showZero />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Agregar">
            <Button
              icon={<AiOutlinePlus />}
              onClick={() => handleAgregar(record)}
              type="link"
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              icon={<AiOutlineEdit />}
              onClick={() => handleEditar(record)}
              type="link"
            />
          </Tooltip>
          <Tooltip title="Asignar Archivo" key="asignar-archivo-tooltip">
            <Button
              icon={<SnippetsOutlined />}
              onClick={() => handleCrearExpediente(record.id, record.numero, record.anio)} // ¡Aquí le pasamos el Id de la declaración!
              type="link"
              key="expediente-button"
            />
          </Tooltip>
          <Tooltip title="Descargar ZIP">
            <Button
              icon={<AiOutlineDownload />}
              onClick={() => handleDescargarZIP(record)}
              type="link"
            />
          </Tooltip>

        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="w-full h-full p-4 bg-gray-100">
        <h2 className="text-2xl font-bold m-2">Documentos de proveedor:</h2>
        <Table
          columns={columns}
          dataSource={declaraciones}
          loading={{
            spinning: loading,
            indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />,
          }}
          rowKey="id"
          pagination={{
            position: ["bottomLeft"],
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          size="small"
          scroll={{ x: 'max-content' }}
        />

        <Modal
          title={`Agregar documentos a ${declSeleccionada?.numero}-${declSeleccionada?.anio}`}
          open={modalAgregarVisible}
          onCancel={() => setModalAgregarVisible(false)}
          onOk={handleSubirArchivos}
        >
          <Upload.Dragger
            multiple
            beforeUpload={() => false}
            onChange={(info) => setFileList(info.fileList)}
            fileList={fileList}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Haz clic o arrastra los archivos aquí
            </p>
          </Upload.Dragger>
        </Modal>

        <Modal
          title={`Documentos de ${declSeleccionada?.numero}-${declSeleccionada?.anio}`}
          open={modalEditarVisible}
          onCancel={() => setModalEditarVisible(false)}
          footer={null}
        >
          <List
            itemLayout="horizontal"
            dataSource={documentos}
            renderItem={(item) => (
              <List.Item
                actions={[
                  // Botón de Visualizar (solo si es PDF)
                  item.nombre_original.toLowerCase().endsWith('.pdf') && (
                    <Tooltip title="Visualizar" key="view-tooltip">
                      <Button
                        icon={<AiOutlineEye />}
                        onClick={() => handleViewDocument(item.id)} // ¡Aquí le pasamos el ID del documento!
                        type="link"
                        key="view-button"
                      />
                    </Tooltip>

                  ),
                  <Tooltip title="Descargar" key="download-tooltip">
                    <Button
                      icon={<AiOutlineDownload />}
                      onClick={() => descargarDocumentoIndividual(item.id)}
                      type="link"
                      key="download-button"
                    />
                  </Tooltip>,
                  <Popconfirm
                    title="¿Eliminar?"
                    onConfirm={() => handleEliminar(item.id)}
                    key="delete-confirm"
                  >
                    <Tooltip title="Eliminar" key="delete-tooltip">
                      <Button icon={<AiOutlineDelete />} type="link" danger key="delete-button" />
                    </Tooltip>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta title={item.nombre_original} />
              </List.Item>
            )}
          />
        </Modal>
      </div>
    </>
  );
};

export default ListadoDeclaraciones;
