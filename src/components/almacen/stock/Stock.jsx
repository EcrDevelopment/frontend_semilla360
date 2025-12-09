import { useEffect, useState } from 'react';
import {
  Table, Select, Card, Spin, message, Row, Col, Input, Checkbox,Tooltip
} from 'antd';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs'; // Para formatear fechas

// Importar servicios
import { getEmpresas } from '../../../api/Empresas';
import { getAlmacenes } from '../../../api/Almacen';
import { getStock } from '../../../api/Stock';

export default function StockView() {
  // Estados para datos maestros
  const [empresas, setEmpresas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  
  // Estados para datos de stock
  const [stockData, setStockData] = useState([]);
  
  // Estados de carga
  const [loadingMaestros, setLoadingMaestros] = useState(true); // Para empresas y almacenes
  const [loadingStock, setLoadingStock] = useState(false);
  
  // Estados de filtros
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(null);
  const [selectedAlmacenId, setSelectedAlmacenId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(true); // Default a true

  // Cargar datos maestros (Empresas y Almacenes) al inicio
  useEffect(() => {
    const fetchMaestros = async () => {
      setLoadingMaestros(true);
      try {
        const [resEmpresas, resAlmacenes] = await Promise.all([
          getEmpresas(),
          getAlmacenes() // Cargar todos los almacenes una vez
        ]);
        setEmpresas(resEmpresas.data.results || resEmpresas.data);
        setAlmacenes(resAlmacenes.data.results || resAlmacenes.data);
      } catch (error) {
        message.error('Error al cargar datos maestros (empresas/almacenes)');
      } finally {
        setLoadingMaestros(false);
      }
    };
    fetchMaestros();
  }, []);

  // Función para Cargar el Stock (condicional)
  const fetchStock = async () => {
    // Solo cargar si hay EMPRESA Y ALMACÉN seleccionados
    if (!selectedEmpresaId || !selectedAlmacenId) {
      setStockData([]); // Limpiar tabla
      return;
    }

    setLoadingStock(true);
    const params = {
      empresa: selectedEmpresaId,
      almacen: selectedAlmacenId,
      solo_con_stock: showOnlyWithStock,
      ...(searchText && { search: searchText }),
      ordering: 'producto__nombre_producto', // Ordenar por nombre
    };

    try {
      const res = await getStock(params);
      setStockData(res.data.results || res.data);
    } catch (error) {
      message.error('Error al cargar el stock');
      setStockData([]);
    } finally {
      setLoadingStock(false);
    }
  };

  // Disparar la carga de stock cuando cambien los filtros
  useEffect(() => {
    fetchStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpresaId, selectedAlmacenId, searchText, showOnlyWithStock]);

  // Almacenes filtrados para el selector
  const almacenesFiltrados = almacenes.filter(
    (alm) => alm.empresa === selectedEmpresaId
  );

  // Columnas de la tabla de Stock
  const columns = [
    {
      title: 'Código Producto',
      dataIndex: ['producto', 'codigo_producto'],
      key: 'codigo',
      sorter: (a, b) => a.producto.codigo_producto.localeCompare(b.producto.codigo_producto),
    },
    {
      title: 'Nombre Producto',
      dataIndex: ['producto', 'nombre_producto'],
      key: 'nombre',
      sorter: (a, b) => a.producto.nombre_producto.localeCompare(b.producto.nombre_producto),
      ellipsis: true,
      render: (text) => (<Tooltip placement="topLeft" title={text}>{text}</Tooltip>),
    },
    {
      title: 'Stock Actual(KG)',
      dataIndex: 'cantidad_actual',
      key: 'cantidad',
      align: 'right',
      sorter: (a, b) => a.cantidad_actual - b.cantidad_actual,
      render: (qty) => <span className="font-bold text-green-600">{parseFloat(qty).toFixed(2)}</span>
    },{
      title: 'Sacos',
      dataIndex: 'cantidad_actual',
      key: 'cantidad',
      align: 'right',
      sorter: (a, b) => a.cantidad_actual - b.cantidad_actual,
      render: (qty) => <span className="font-bold text-green-600">{parseFloat(qty/50).toFixed(2)}</span>
    },
    {
      title: 'Carros',
      dataIndex: 'cantidad_actual',
      key: 'cantidad',
      align: 'right',
      sorter: (a, b) => a.cantidad_actual - b.cantidad_actual,
      render: (qty) => <span className="font-bold text-green-600">{parseFloat(qty/30000).toFixed(2)}</span>
    },
    {
      title: 'Último Movimiento',
      dataIndex: 'fecha_ultimo_movimiento',
      key: 'fecha_mov',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A',
      sorter: (a, b) => dayjs(a.fecha_ultimo_movimiento).unix() - dayjs(b.fecha_ultimo_movimiento).unix(),
    },
  ];

  return (
    <Card title="Consulta de Stock Actual" className="m-4 shadow-lg">
      {/* --- FILTROS --- */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="1. Seleccione una Empresa"
            style={{ width: '100%' }}
            loading={loadingMaestros}
            value={selectedEmpresaId}
            onChange={(value) => {
              setSelectedEmpresaId(value);
              setSelectedAlmacenId(null); // Resetear almacén
            }}
            options={empresas.map(emp => ({
              value: emp.id,
              label: emp.razon_social || emp.nombre_empresa
            }))}
          />
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="2. Seleccione un Almacén"
            style={{ width: '100%' }}
            loading={loadingMaestros}
            value={selectedAlmacenId}
            onChange={(value) => setSelectedAlmacenId(value)}
            disabled={!selectedEmpresaId} // Deshabilitado si no hay empresa
            options={almacenesFiltrados.map(alm => ({
              value: alm.id,
              label: `${alm.codigo} - ${alm.descripcion}`
            }))}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={12}>
           <Input
              placeholder="Buscar por código o nombre de producto..."
              prefix={<SearchOutlined />}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              disabled={!selectedAlmacenId} // Deshabilitado si no hay almacén
            />
        </Col>
        <Col xs={24} md={12}>
            <Checkbox
                checked={showOnlyWithStock}
                onChange={e => setShowOnlyWithStock(e.target.checked)}
            >
                Mostrar solo con stock positivo
            </Checkbox>
        </Col>
      </Row>
      
      {/* --- TABLA DE STOCK --- */}
      <Table
        columns={columns}
        dataSource={stockData}
        rowKey="id"
        loading={{
          spinning: loadingStock,
          indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />,
          tip: "Cargando stock..."
        }}
        scroll={{ x: '1000' }}
        pagination={{
          position: ["bottomCenter"],
          showSizeChanger: true,
          pageSizeOptions: ["10", "25", "50", "100"],
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} productos`
        }}
        size='small'
        locale={{ emptyText: (!selectedEmpresaId || !selectedAlmacenId) ? 'Por favor, seleccione una Empresa y un Almacén.' : 'No se encontró stock con los filtros aplicados.' }}
      />
    </Card>
  );
}