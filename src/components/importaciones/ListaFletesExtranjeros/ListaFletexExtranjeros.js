import { useEffect, useState, useRef } from "react";
import {
  Table,
  Dropdown,
  Space,
  Button,
  Tooltip,
  message,
  Modal,
  DatePicker,
  Input
} from "antd";
import { DownOutlined, SearchOutlined } from "@ant-design/icons";
import qs from "qs";
import axiosInstance from "../../../axiosConfig";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

function ListadoFletes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      position: ["bottomLeft"],
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
    },
  });
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [fecha, setFecha] = useState(null);
  const [fleteId, setFleteId] = useState(null);

  const items = [
    { key: "1", label: "Editar" },
    { key: "2", label: "Cambiar fecha" },
    { key: "3", label: "Ver reporte 1" },
    { key: "4", label: "Ver reporte 2" },
  ];

  const handleSearch = (selectedKeys, confirm) => {
    confirm(); // aplica el filtro
  };

  const handleReset = (clearFilters, confirm) => {
    clearFilters(); // limpia el filtro
    confirm(); // aplica sin filtro
  };

  const handleMenuClick = (e, id) => {
    switch (e.key) {
      case "1":
        handleEditarFlete(id);
        break;
      case "2":
        handleMostrarModalFechaLlegadaFlete(id);
        break;
      case "3":
        handleRecuperarData(id);
        break;
      case "4":
        handleVerReporte(id);
        break;
      default:
        console.log("Opción no reconocida");
    }
  };

  const handleEditarFlete = (id) => {
    //message.success("Editando flete con id: " + id);
    navigate(`/importaciones/editar-flete/${id}`);
  };

  const handleMostrarModalFechaLlegadaFlete = (id) => {
    setFleteId(id);
    // Buscar el despacho por ID
    const despacho = data.find((item) => item.id === id);
    if (despacho && despacho.fecha_llegada) {
      // Convertir a objeto dayjs para que funcione con DatePicker
      setFecha(dayjs(despacho.fecha_llegada));
    } else {
      setFecha(null);
    }
    setOpenModal(true);
  };

  const handleAsignarFecha = async () => {
    if (!fecha) {
      message.warning("Selecciona una fecha primero");
      return;
    }
    try {
      await axiosInstance.post(`/importaciones/despachos/${fleteId}/actualizar-fecha-llegada/`, {
        fecha_llegada: fecha.format("YYYY-MM-DD"),
      });
      message.success("Fecha de llegada actualizada correctamente");
      setOpenModal(false);
      fetchData(tableParams); // recargar datos
    } catch (error) {
      message.error("Error al actualizar la fecha");
    }
  };

  const onCancelModalFecha = () => {
    setFecha('');
    setOpenModal(false);
  }

  const handleVerReporte = async (id) => {
    try {
      const response = await axiosInstance.get(
        `/importaciones/listar-data-despacho/`,
        { params: { id }, responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
      message.success("Reporte generado correctamente");
    } catch (error) {
      message.error("Error al generar reporte");
    }
  };

  const handleRecuperarData = async (id) => {
    try {
      const response = await axiosInstance.get(`/importaciones/descargar_pdf/${id}/`, {
        responseType: "blob",
      });
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
      message.success("Reporte generado correctamente.");
    } catch (error) {
      message.error("Error al generar reporte");
    }
  };

  const confirmarEliminacion = (id) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar este despacho?",
      content: "Esta acción no se puede deshacer",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => handleEliminarDespacho(id),
    });
  };

  const handleEliminarDespacho = async (id) => {
    try {
      const response = await axiosInstance.delete(`importaciones/despachos/${id}/eliminar/`);
      message.success(response.data.message);
      fetchData(tableParams); // recargar tabla
    } catch (error) {
      message.error("Error al eliminar el despacho");
    }
  };

  const getParams = (params) => ({
    page: params.pagination?.current,
    page_size: params.pagination?.pageSize,
    sortField: params.sortField,
    sortOrder: params.sortOrder,
    dua: params.filters?.dua ? params.filters.dua[0] : undefined,
  });

  const fetchData = async (params) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/importaciones/listar-despachos/?${qs.stringify(getParams(params))}`
      );
      if (response.data.status === "success") {
        setData(response.data.data);
        setTableParams((prev) => ({
          ...prev,
          pagination: {
            ...prev.pagination,
            total: response.data.total_count,
          },
        }));
      }
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(tableParams);
  }, []);


  const handleTableChange = (pagination, filters, sorter) => {
    const newParams = {
      ...tableParams,
      pagination,
      filters,
      sortOrder: sorter.order,
      sortField: sorter.field,
    };
    setTableParams(newParams);
    fetchData(newParams);
  };

  const expandedRowRender = (record) => (
    <div style={{ padding: "10px" }}>
      <p><strong>Proveedor:</strong> {record.proveedor_nombre}</p>
      <p><strong>Transportista:</strong> {record.transportista_nombre}</p>
    </div>
  );

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInputRef}
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
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
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
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
      sorter: true,
    },
    {
      title: "Dua",
      dataIndex: "dua",
      key: "dua",
      sorter: true,
      ...getColumnSearchProps("dua", "Buscar DUA"),
    },
    {
      title: "OC",
      dataIndex: "ordenes_compra",
      key: "oc",
      render: (ordenes) => (
        <div>
          {ordenes.map((oc) => (
            <Tooltip
              key={oc.numero_oc}
              title={
                <div>
                  <p><strong>N° recojo:</strong> {oc.numero_recojo}</p>
                  <p><strong>Producto:</strong> {oc.producto}</p>
                  <p><strong>Precio:</strong> ${oc.precio_producto}</p>
                </div>
              }
            >
              <span style={{
                backgroundColor: "#e0f7fa",
                color: "#007b8f",
                padding: "5px 8px",
                margin: "3px",
                borderRadius: "5px",
                display: "inline-block",
                cursor: "pointer",
              }}>
                {oc.numero_oc}
              </span>
            </Tooltip>
          ))}
        </div>
      ),
    },
    {
      title: "Fecha Numeración",
      dataIndex: "fecha_numeracion",
      key: "fecha_numeracion",
      sorter: true,
      render: (text) => (text ? dayjs(text).format("DD/MM/YYYY") : "N/A"),
    },
    {
      title: "Carta Porte",
      dataIndex: "carta_porte",
      key: "carta_porte",
      sorter: true,
    },
    {
      title: "Factura",
      dataIndex: "num_factura",
      key: "num_factura",
      sorter: true,
    },
    {
      title: "Flete Pactado",
      dataIndex: "flete_pactado",
      key: "flete_pactado",
      className: "column-money",
      sorter: true,
    },
    {
      title: "Peso Neto CRT",
      dataIndex: "peso_neto_crt",
      key: "peso_neto_crt",
    },
    {
      title: "Acciones",
      key: "operation",
      render: (item) => (
        <Space size="middle">
          <Button danger onClick={() => confirmarEliminacion(item.id)}>
            Eliminar
          </Button>
          <Dropdown menu={{ items, onClick: (e) => handleMenuClick(e, item.id) }}>
            <Button>
              <Space>
                Opciones
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full h-full p-4 bg-gray-100">
      <h2 className="text-2xl font-bold m-3">Listado de fletes</h2>
      <Table
        columns={columns}
        rowKey="id"
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
        expandable={{ expandedRowRender }}
        size="small"
      />

      <Modal
        title="Cambiar fecha de llegada"
        open={openModal}
        onCancel={onCancelModalFecha}
        onOk={handleAsignarFecha}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <p className="text-xs text-gray-400">Esta fecha es  la que se considera para el reporte de estibas</p>
        <DatePicker
          className="w-full"
          format="DD/MM/YYYY"
          value={fecha}
          onChange={(value) => setFecha(value)}
        />
      </Modal>
    </div>
  );
}

export default ListadoFletes;
