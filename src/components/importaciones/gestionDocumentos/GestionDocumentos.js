import React, { useEffect, useState } from 'react';
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
} from 'antd';
import {
  AiOutlinePlus,
  AiOutlineEdit,
  AiOutlineDownload,
  AiOutlineDelete,
} from 'react-icons/ai';
import {
  listarDeclaraciones,
  subirArchivosIndividuales,
  eliminarDocumento,
  descargarZip,
  getDocumentosPorDeclaracion,
  descargarDocumentoIndividual,
} from "../../../api/Documentos";

const ListadoDeclaraciones = () => {
  const [declaraciones, setDeclaraciones] = useState([]);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [declSeleccionada, setDeclSeleccionada] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    cargarDeclaraciones();
  }, []);

  const cargarDeclaraciones = async () => {
    const data = await listarDeclaraciones();
    setDeclaraciones(data);
  };

  const handleAgregar = (declaracion) => {
    setDeclSeleccionada(declaracion);
    setFileList([]);
    setModalAgregarVisible(true);
  };

  const handleEditar = async (declaracion) => {
    setDeclSeleccionada(declaracion);
    const data = await getDocumentosPorDeclaracion(declaracion.numero, declaracion.anio);
    setDocumentos(data);
    setModalEditarVisible(true);
  };

  const handleSubirArchivos = async () => {
    try {
      const archivos = fileList.map((file) => file.originFileObj);
      await subirArchivosIndividuales(declSeleccionada.numero, declSeleccionada.anio, archivos);
      message.success("Archivos cargados exitosamente");
      setModalAgregarVisible(false);
      cargarDeclaraciones();
    } catch (err) {
      message.error("Error al subir archivos");
    }
  };

  const handleEliminar = async (idDoc) => {
    await eliminarDocumento(idDoc);
    const actualizados = documentos.filter((d) => d.id !== idDoc);
    setDocumentos(actualizados);
    message.success("Documento eliminado");
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
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${declaracion.numero}-${declaracion.anio}.zip`); // Nombre del archivo
      document.body.appendChild(link);
      
      // Hacer clic en el enlace para iniciar la descarga
      link.click();
      
      // Limpiar
      link.remove();
      window.URL.revokeObjectURL(url); // Liberar memoria
    } catch (error) {
      message.error("Error al descargar el archivo ZIP.");
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: 'Número DUA',
      dataIndex: 'numero',
      filterSearch: true,
      onFilter: (value, record) => record.numero.startsWith(value),
      filters: [...new Set(declaraciones.map((d) => ({ text: d.numero, value: d.numero })))],
    },
    {
      title: 'Año',
      dataIndex: 'anio',
    },
    {
      title: 'Documentos',
      render: (_, record) => (
        <Badge count={record.documentos_count || 0} showZero />
      ),
    },
    {
      title: 'Acciones',
      render: (_, record) => (
        <>
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
          <Tooltip title="Descargar ZIP">
            <Button
              icon={<AiOutlineDownload />}
              onClick={() => handleDescargarZIP(record)}
              type="link"
            />
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <>
      <Table columns={columns} dataSource={declaraciones} rowKey="id" />

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
          <p>Arrastra o haz clic para subir</p>
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
                <Button
                  icon={<AiOutlineDownload />}
                  onClick={() => descargarDocumentoIndividual(item.id)}
                  type="link"
                />,
                <Popconfirm title="¿Eliminar?" onConfirm={() => handleEliminar(item.id)}>
                  <Button icon={<AiOutlineDelete />} type="link" danger />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta title={item.nombre_original} />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default ListadoDeclaraciones;
