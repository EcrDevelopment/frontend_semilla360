import React, { useState, useEffect } from 'react';
import {
  Select,
  DatePicker,
  Button,
  Table,
  Collapse,
  Spin,
  message,
  Empty,
  Typography,
  Space,
  Card, Dropdown
} from 'antd';
import { SearchOutlined, LoadingOutlined, FileExcelOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// --- ¡Importamos tus servicios REALES! ---
import { getEmpresas } from '../../../api/Empresas';
import { getAlmacenes } from '../../../api/Almacen';
// Asumiendo que creaste los nuevos servicios
import { getProductos } from '../../../api/Productos';
import { fetchKardexReport, downloadKardexExport } from '../../../api/Stock';

const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Title, Text } = Typography;

// Columnas de la tabla interna (Kárdex)
const kardexColumns = [
  {
    title: 'Fecha',
    dataIndex: 'fecha',
    key: 'fecha',
    render: (text) => text ? dayjs.utc(text).format('DD/MM/YYYY') : '',
    width: 150,
  },
  {
    title: 'Documento',
    dataIndex: 'doc',
    key: 'doc',
    width: 180,
  },
  {
    title: 'Detalle / Entidad',
    dataIndex: 'detalle',
    key: 'detalle',
  },
  {
    title: 'Entrada',
    dataIndex: 'entrada',
    key: 'entrada',
    align: 'right',
    width: 120,
    render: (val) => val > 0 ? <Text className="font-bold text-green-600">{parseFloat(val).toFixed(2)}</Text> : <Text type="secondary">0.00</Text>,
  },
  {
    title: 'Salida',
    dataIndex: 'salida',
    key: 'salida',
    align: 'right',
    width: 120,
    render: (val) => val > 0 ? <Text className="font-bold text-red-600">{parseFloat(val).toFixed(2)}</Text> : <Text type="secondary">0.00</Text>,
  },
  {
    title: 'Saldo',
    dataIndex: 'saldo',
    key: 'saldo',
    align: 'right',
    width: 120,
    render: (val) => <Text strong>{parseFloat(val).toFixed(2)}</Text>,
  },
];

dayjs.extend(utc);

export default function ReporteKardex() {
  // --- Estados de Datos Maestros ---
  const [empresas, setEmpresas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);

  // --- Estados de Listas Filtradas ---
  const [almacenesFiltrados, setAlmacenesFiltrados] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  // --- Estados de Filtros ---
  const [empresaId, setEmpresaId] = useState(null);
  const [almacenId, setAlmacenId] = useState(null);
  const [productoIds, setProductoIds] = useState([]);
  const [rangeFechas, setRangeFechas] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ]);

  // --- Estados de Carga y Datos ---
  const [loadingMaestros, setLoadingMaestros] = useState(true);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loadingExport, setLoadingExport] = useState(false);

  // --- Carga de Datos Maestros (como en tu StockView) ---
  useEffect(() => {
    const fetchMaestros = async () => {
      setLoadingMaestros(true);
      try {
        // Carga todo en paralelo
        const [resEmpresas, resAlmacenes, resProductos] = await Promise.all([
          getEmpresas(),
          getAlmacenes(),
          getProductos() // ¡Nuevo servicio!
        ]);

        setEmpresas(resEmpresas.data.results || resEmpresas.data);
        setAlmacenes(resAlmacenes.data.results || resAlmacenes.data);
        setProductos(resProductos.data.results || resProductos.data);

      } catch (error) {
        message.error('Error al cargar datos maestros (empresas/almacenes/productos)');
      } finally {
        setLoadingMaestros(false);
      }
    };
    fetchMaestros();
  }, []);

  // --- Filtrado local (como en tu StockView) ---
  useEffect(() => {
    if (empresaId) {
      // Filtra almacenes y productos cuando la empresa cambia
      setAlmacenesFiltrados(almacenes.filter(a => a.empresa === empresaId));
      setProductosFiltrados(productos.filter(p => p.empresa === empresaId));

      // Resetea selecciones
      setAlmacenId(null);
      setProductoIds([]);
    } else {
      setAlmacenesFiltrados([]);
      setProductosFiltrados([]);
    }
  }, [empresaId, almacenes, productos]); // Depende de los datos maestros cargados


  // --- Manejador de la Búsqueda ---
  const handleGenerateReport = async () => {
    if (!empresaId || !almacenId || !productoIds.length || !rangeFechas) {
      message.warning('Por favor, complete todos los filtros requeridos.');
      return;
    }

    setLoadingReporte(true);
    setReportData(null);

    try {
      const params = {
        empresa_id: empresaId,
        almacen_id: almacenId,
        producto_ids: productoIds,
        fecha_inicio: rangeFechas[0].format('YYYY-MM-DD'),
        fecha_fin: rangeFechas[1].format('YYYY-MM-DD'),
      };

      const data = await fetchKardexReport(params); // Llama al servicio que diseñamos

      if (Object.keys(data).length === 0) {
        message.info('No se encontraron movimientos para los productos seleccionados.');
      }
      setReportData(data);

    } catch (error) {
      message.error('Hubo un error al generar el reporte.');
    } finally {
      setLoadingReporte(false);
    }
  };

  const handleExport = async (format) => {
    if (!empresaId || !almacenId || !productoIds.length || !rangeFechas) {
      message.warning('Complete los filtros antes de exportar.');
      return;
    }

    setLoadingExport(true);
    message.loading({ content: `Generando ${format.toUpperCase()}...`, key: 'exporting' });

    try {
      // Preparamos los filtros actuales del estado
      const filtros = { empresaId, almacenId, productoIds, rangeFechas };

      const response = await downloadKardexExport(filtros, format);

      // Crear enlace de descarga invisible
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Nombre del archivo dinámico
      const fecha = rangeFechas[0].format('YYYYMMDD');
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `Kardex_Report_${fecha}.${ext}`);

      document.body.appendChild(link);
      link.click();

      // Limpieza
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: 'Reporte descargado correctamente', key: 'exporting' });
    } catch (error) {
      console.error(error);
      message.error({ content: 'Error al descargar el reporte', key: 'exporting' });
    } finally {
      setLoadingExport(false);
    }
  };

  const itemsExport = [
    {
      key: 'pdf', // Esta key es la que usaremos en el switch
      label: 'Descargar PDF',
      icon: <FilePdfOutlined style={{ color: 'red' }} />,
    },
    {
      key: 'excel',
      label: 'Descargar Excel',
      icon: <FileExcelOutlined style={{ color: 'green' }} />,
    },
  ];

  const handleMenuClick = (e) => {
    // e.key vendrá como 'pdf' o 'excel' según el item definido arriba
    if (e.key) {
      handleExport(e.key);
    }
  };

  // --- Renderizado ---
  return (
    <Card title="Reporte de Kárdex por Producto" className="m-4 shadow-lg">
      <Spin spinning={loadingMaestros} tip="Cargando maestros...">
        <Space direction="vertical" className="w-full" size="middle">
          {/* --- Barra de Filtros --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              placeholder="1. Seleccione Empresa"
              value={empresaId}
              onChange={setEmpresaId}
              className="w-full"
              options={empresas.map(emp => ({
                value: emp.id,
                label: emp.razon_social || emp.nombre_empresa
              }))}
            />
            <Select
              placeholder="2. Seleccione Almacén"
              value={almacenId}
              onChange={setAlmacenId}
              disabled={!empresaId}
              className="w-full"
              options={almacenesFiltrados.map(alm => ({
                value: alm.id,
                label: `${alm.codigo} - ${alm.descripcion}`
              }))}
            />
            <Select
              mode="multiple"
              allowClear
              placeholder="3. Seleccione Productos"
              options={productosFiltrados.map(prod => ({
                value: prod.id,
                label: `${prod.codigo_producto} - ${prod.nombre_producto}`
              }))}
              value={productoIds}
              onChange={setProductoIds}
              disabled={!empresaId}
              className="w-full"
              maxTagCount="responsive"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
            <RangePicker
              value={rangeFechas}
              onChange={setRangeFechas}
              className="w-full"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 justify-end">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleGenerateReport}
              loading={loadingReporte}
              disabled={loadingMaestros || loadingExport}
              className="w-full md:w-auto"
            >
              Generar Vista Previa
            </Button>

            {/* BOTÓN NUEVO DE EXPORTAR */}
            <Dropdown
              menu={{
                items: itemsExport,
                onClick: handleMenuClick
              }}
              trigger={['click']}
              disabled={loadingReporte || !reportData}
            >
              <Button
                icon={loadingExport ? <LoadingOutlined /> : <DownloadOutlined />}
                className="w-full md:w-auto"
              >
                Exportar
              </Button>
            </Dropdown>
          </div>
        </Space>
      </Spin>

      {/* --- Sección de Resultados --- */}
      <div className="mt-6">
        <Spin
          spinning={loadingReporte}
          indicator={<Spin indicator={<LoadingOutlined spin />} size="large" />}
          tip="Calculando Kárdex..."
        >
          {/* Estado inicial o sin datos */}
          {!reportData && !loadingReporte && (
            <Empty description="Seleccione los filtros y genere el reporte." className="py-10" />
          )}

          {/* Con datos, mostramos el acordeón */}
          {reportData && Object.keys(reportData).length > 0 && (
            <Collapse
              accordion
              defaultActiveKey={[Object.keys(reportData)[0]]}
              items={Object.keys(reportData).map(productoId => {
                const productoInfo = reportData[productoId];

                // Retornamos el objeto con la estructura que pide AntD v5
                return {
                  key: productoId,
                  label: (
                    <Title level={5} className="!m-0">
                      {productoInfo.codigo_producto} - {productoInfo.nombre_producto}
                    </Title>
                  ),
                  children: (
                    <Table
                      columns={kardexColumns}
                      dataSource={productoInfo.kardex.map((item, index) => ({ ...item, key: index }))}
                      size="small"
                      bordered
                      pagination={{
                        pageSize: 50,
                        showSizeChanger: true,
                        position: ["bottomCenter"],
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} movimientos`
                      }}
                      scroll={{ x: 1000 }}
                    />
                  )
                };
              })}
            />
          )}

          {/* Reporte vacío (sin error) */}
          {reportData && Object.keys(reportData).length === 0 && !loadingReporte && (
            <Empty description="No se encontraron movimientos para los filtros seleccionados." className="py-10" />
          )}
        </Spin>
      </div>
    </Card>
  );
}