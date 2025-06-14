import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Badge,
  Button,
  Modal,
  message,
  Tooltip,
  Input,
  Space,
  Select
} from "antd";
import {
  AiOutlineCalendar,
  AiOutlineShop,
  AiOutlineDownload,
  AiOutlineEye, // Importamos el icono de visualización
} from "react-icons/ai";
import dayjs from 'dayjs';
import { SearchOutlined } from "@ant-design/icons"; // Importamos el icono de búsqueda

// Asegúrate de que las rutas de importación sean correctas para tus funciones API
import {
  listarArchivos,
  obtenerDocumentosExpedienteAgrupadosPorTipo,
  ActualizarMesAnioFiscal,
  ActualizarEmpresaDocumentoExpediente,
  descargarDocumentosExpedienteUnificados
} from "../../../api/Documentos";


const ListadoDeclaraciones = () => {
  const [declaraciones, setDeclaraciones] = useState([]);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalEmpresaVisible, setModalEmpresaVisible] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [declSeleccionada, setDeclSeleccionada] = useState(null);
  const navigate = useNavigate();
  const [mes, setMes] = useState(dayjs().month() + 1); // dayjs().month() va de 0 a 11
  const [anio, setAnio] = useState(dayjs().year());



  const meses = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 },
  ];

  const anios = Array.from({ length: 10 }, (_, i) => {
    const year = dayjs().year() - i;
    return { label: year.toString(), value: year };
  });

  // Referencia para el input de búsqueda en el filtro (para enfocarlo)
  const searchInputRef = useRef(null);

  useEffect(() => {
    cargarDeclaraciones();
  }, []);

  const cargarDeclaraciones = async () => {
    try {
      const data = await listarArchivos();
      setDeclaraciones(data);
    } catch (error) {
      console.error("Error al cargar declaraciones:", error);
      message.error("Error al cargar las declaraciones.");
    }
  };

  const handleAgregar = (declaracion) => {
    setDeclSeleccionada(declaracion);
    setModalAgregarVisible(true);
  };

  const handleMostrarModalAsignarEmpresa = (declaracion) => {
    setDeclSeleccionada(declaracion);
    setModalEmpresaVisible(true);
  }

  const handleAsignarEmpresa = async() => {
    try {
      await ActualizarEmpresaDocumentoExpediente(declSeleccionada.id,empresa);
      setModalEmpresaVisible(false)
      message.success("empresa actualizada exitosamente");
      cargarDeclaraciones(); // recarga los datos
    } catch (error) {
      console.error("Error al actualizar empresa:", error);
      message.error("Error al actualizar empresa");
    }
  }  

  const handleVerArchivo = async (declaracion) => {
    setDeclSeleccionada(declaracion);
    try {
      const data = await obtenerDocumentosExpedienteAgrupadosPorTipo(declaracion.id);
      navigate(`/importaciones/archivos-dua/${declaracion.id}/${declaracion.numero_declaracion}/${declaracion.anio_declaracion}`);
    } catch (error) {
      console.error("Error al obtener documentos por declaración:", error);
      message.error("Error al cargar los documentos de la declaración.");
    }
  };


  // Función para manejar la adición de un mes y año fiscal a una declaración
  const handleAgregarMesAnioFiscal = async () => {
    try {
      await ActualizarMesAnioFiscal(declSeleccionada.id, anio, mes);
      setModalAgregarVisible(false)
      message.success("Mes y año fiscal agregados exitosamente");
      cargarDeclaraciones(); // recarga los datos
    } catch (error) {
      console.error("Error al agregar mes y año fiscal:", error);
      message.error("Error al agregar mes y año fiscal.");
    }
  };
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
      dataIndex: "numero_declaracion",
      key: "numero_declracion",
      ...getColumnSearchProps("numero_declaracion"),
    },
    {
      title: "Año",
      dataIndex: "anio_declaracion",
      key: "anio_declaracion",
      ...getColumnSearchProps("anio_declaracion"),
    },
    {
      title: "Mes Fiscal",
      dataIndex: "mes_fiscal",
      key: "mes_fiscal",
      render: (mes) => meses.find((m) => m.value === mes)?.label || "-",
      filters: meses.map(m => ({ text: m.label, value: m.value })),
      onFilter: (value, record) => record.mes_fiscal === value,
      sorter: (a, b) => a.mes_fiscal - b.mes_fiscal,
    },
    {
      title: "Empresa",
      dataIndex: "empresa",
      key: "empresa",
      filters: [...new Set(declaraciones.map(item => item.empresa))]
        .filter(Boolean)
        .map(empresa => ({ text: empresa, value: empresa })),
      onFilter: (value, record) => record.empresa === value,
      sorter: (a, b) => (a.empresa || "").localeCompare(b.empresa || ""),
    },
    {
      title: "Documentos",
      key: "cantidad_documentos",
      render: (_, record) => (
        <Badge count={record.cantidad_documentos || 0} showZero />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Agregar Mes Fiscal" key="agregar-mes-anio-tooltip">
            <Button
              icon={<AiOutlineCalendar />}
              onClick={() => handleAgregar(record)}
              type="link"
            />
          </Tooltip>
          <Tooltip title="Asignar empresa" key="agregar-empresa-tooltip">
            <Button
              icon={<AiOutlineShop />}
              onClick={() => handleMostrarModalAsignarEmpresa(record)}
              type="link"
            />
          </Tooltip>
          <Tooltip title="Ver Archivo" key="ver-tooltip">
            <Button
              icon={<AiOutlineEye />}
              onClick={() => handleVerArchivo(record)}
              type="link"
            />
          </Tooltip>
          <Tooltip title="Descargar Archivo" key="descargar-tooltip">
            <Button
              icon={<AiOutlineDownload />}
              onClick={() => descargarDocumentosExpedienteUnificados(record.id)}
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
        <h2 className="text-2xl font-bold m-2">Listado de Archivos de DUA:</h2>
        <Table
          columns={columns}
          dataSource={declaraciones}
          rowKey="id"
          pagination={{
            position: ["bottomLeft"],
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            current: 1,
          }}
        />
        <Modal
          title={`Agregar año y mes fiscal a DUA: ${declSeleccionada?.numero_declaracion} - ${declSeleccionada?.anio_declaracion || ''}`}
          open={modalAgregarVisible}
          onCancel={() => setModalAgregarVisible(false)}
          onOk={() => handleAgregarMesAnioFiscal()}
          okText="Aceptar"
          cancelText="Cancelar"
        >
          <div className="flex gap-4 mt-4">
            <div className="w-1/2">
              <label className="block mb-1 text-sm font-medium">Mes Fiscal</label>
              <Select
                style={{ width: '100%' }}
                options={meses}
                value={mes}
                onChange={setMes}
              />
            </div>
            <div className="w-1/2">
              <label className="block mb-1 text-sm font-medium">Año Fiscal</label>
              <Select
                style={{ width: '100%' }}
                options={anios}
                value={anio}
                onChange={setAnio}
              />
            </div>
          </div>
        </Modal>

        <Modal
          title={`Asignar empresa a DUA: ${declSeleccionada?.numero_declaracion} - ${declSeleccionada?.anio_declaracion || ''}`}
          open={modalEmpresaVisible}
          onCancel={() => setModalEmpresaVisible(false)}
          onOk={() => handleAsignarEmpresa()}
          okText="Aceptar"
          cancelText="Cancelar"
        >
          <div className="flex gap-4 mt-4">
            <div className="w-full">
              <label className="block mb-1 text-sm font-medium">Empresa</label>
              <Select
                style={{ width: '100%' }}
                options={[
                  { label: "Seleccione", value: null },
                  { label: "LA SEMILLA DE ORO SAC", value: "LA SEMILLA DE ORO SAC" },
                  { label: "MAXIMILIAM INVERSIONES SA", value: "MAXIMILIAM INVERSIONES SA" },
                  { label: "TRADING SEMILLA SAC", value: "TRADING SEMILLA SAC" }
                ]}
                value={empresa}            // Asegúrate de tener este estado definido
                onChange={setEmpresa}      // Y esta función de cambio
                placeholder="Seleccione una empresa"
              />
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default ListadoDeclaraciones;
