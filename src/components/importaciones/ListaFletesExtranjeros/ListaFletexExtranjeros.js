import React, { useEffect, useState, useCallback } from "react";
import { Table, Dropdown, Space, Button, Tooltip, message, Modal } from "antd";
import { DownOutlined } from "@ant-design/icons";
import qs from "qs";
import axiosInstance from "../../../axiosConfig";
import dayjs from "dayjs";

const items = [
  {
    key: "1",
    label: "Ver Reporte",
  },
  {
    key: "2",
    label: "proximamente",
  },
];

const handleMenuClick = (e, id) => {
  switch (e.key) {
    case "1":
      handleRecuperarData(id);
      break;
    case "2":
      handleVerReporte(id);
      break;
    default:
      console.log("Opción no reconocida");
  }
};

const handleVerReporte = async (id) => {
  try {
    const response = await axiosInstance.get(
      `/importaciones/listar-data-despacho/`,
      {
        params: { id: id },
        responseType: "blob", // 👈 Importante: Indica que la respuesta es un archivo (Blob)
      }
    );

    // Crear una URL para el Blob recibido
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    // Abrir el PDF en una nueva pestaña
    window.open(url);

    // Alternativa: Forzar la descarga
    // const link = document.createElement('a');
    // link.href = url;
    // link.setAttribute('download', 'reporte.pdf');
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    message.success("Reporte generado correctamente");
  } catch (error) {
    message.error("Error al generar reporte");
    console.error(error);
  }
};

const handleRecuperarData = async (id) => {
  try {
    const response = await axiosInstance
      .get(`/importaciones/descargar_pdf/${id}/`)
      .then((response) => {
        const file = new Blob([response.data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, "_blank");
        message.success("Reporte generado correctamente.");
      });
  } catch (error) {
    message.error("Error al generar reporte");
    console.log(error);
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
    await axiosInstance
      .delete(`importaciones/despachos/${id}/eliminar/`)
      .then((response) => {
        message.success(response.data.message); // Mensaje de éxito
      });
  } catch (error) {
    message.error(
      error.response?.data?.error || "Error al eliminar el despacho"
    );
    console.log(error);
  }
};

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
                <p className="color-red-500">
                  <strong>N° recojo:</strong> {oc.numero_recojo}
                </p>
                <p>
                  <strong>Producto:</strong> {oc.producto}
                </p>
                <p>
                  <strong>Precio:</strong> ${oc.precio_producto}
                </p>
              </div>
            }
          >
            <span
              style={{
                backgroundColor: "#e0f7fa",
                color: "#007b8f",
                padding: "5px 8px",
                margin: "3px",
                borderRadius: "5px",
                display: "inline-block",
                cursor: "pointer",
              }}
            >
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
    title: "Accciones",
    key: "operation",
    render: (item) => (
      <Space size="middle">
        <Button
          color="red"
          variant="solid"
          onClick={() => confirmarEliminacion(item.id)}
        >
          Eliminar
        </Button>
        <Dropdown menu={{ items, onClick: (e) => handleMenuClick(e, item.id) }}>
          <Button color="cyan" variant="solid">
            <Space>
              Ver
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      </Space>
    ),
  },
];

const getParams = (params) => ({
  page: params.pagination?.current,
  page_size: params.pagination?.pageSize,
  sortField: params.sortField,
  sortOrder: params.sortOrder,
  filters: params.filters,
});

function ListadoFletes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      position: ["bottomLeft"],
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
      current: 1,
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/importaciones/listar-despachos/?${qs.stringify(
          getParams(tableParams)
        )}`
      );

      if (response.data.status === "success") {
        setData(response.data.data);
        setTableParams((prev) => {
          if (prev.pagination.total !== response.data.total_count) {
            return {
              ...prev,
              pagination: {
                ...prev.pagination,
                total: response.data.total_count,
              },
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    }
    setLoading(false);
  }, [tableParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams((prev) => ({
      ...prev,
      pagination,
      filters,
      sortOrder: sorter.order,
      sortField: sorter.field,
    }));

    if (pagination.pageSize !== tableParams.pagination?.pageSize) {
      setData([]);
    }
  };

  const expandedRowRender = (record) => {
    return (
      <div style={{ padding: "10px" }}>
        <p>
          <strong>Proveedor:</strong> {record.proveedor_nombre}
        </p>
        <p>
          <strong>Transportista:</strong> {record.transportista_nombre}
        </p>
      </div>
    );
  };

  return (
    <>
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
      </div>
    </>
  );
}

export default ListadoFletes;
