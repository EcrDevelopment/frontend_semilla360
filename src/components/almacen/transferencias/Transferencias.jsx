import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Button,
  Row,
  Col,
  Form,
  Select,
  Input,
  DatePicker,
  Space,
  Typography,
  message,
  Card,
  Empty,
  Tooltip, Popconfirm, Spin
} from 'antd';
import { SearchOutlined, ClearOutlined, CheckCircleOutlined, RollbackOutlined, LoadingOutlined } from '@ant-design/icons';
// Tus rutas de API
import { getTransferencias, revertirTransferencia } from '../../../api/Transferencia';
import { getEmpresas } from '../../../api/Empresas';
import { getAlmacenes } from '../../../api/Almacen';
import RecepcionModal from '../transferencias/RecepcionModal'; // Asumiendo esta ruta
import moment from 'moment';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Constantes para los estados y sus colores
const ESTADOS_CHOICES = [
  { value: 'EN_TRANSITO', label: 'En Tránsito', color: 'blue' },
  { value: 'RECIBIDO', label: 'Recibido Completo', color: 'green' },
  { value: 'RECIBIDO_PARCIAL', label: 'Recibido Parcial', color: 'orange' },
  { value: 'RECIBIDO_SOBRANTE', label: 'Recibido Sobrante', color: 'purple' },
  { value: 'PERDIDO', label: 'Pérdida Total', color: 'red' },
];

const getEstadoTag = (estado) => {
  const info = ESTADOS_CHOICES.find(e => e.value === estado) || {};
  return <Tag color={info.color || 'default'}>{info.label || estado}</Tag>;
};

const TransferenciasPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [transferencias, setTransferencias] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Estados para los Selects
  const [empresas, setEmpresas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]); // Un solo estado para almacenes
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false);

  // ¡REFACTOR! No necesitamos 'selectedEmpresaId' o 'selectedAlmacenId'
  // El 'form' de AntD ya maneja esos valores.

  // Carga de datos de la tabla
  const fetchDatos = useCallback(async (page, pageSize, currentFilters) => {
    if (!currentFilters) return;

    setLoading(true);
    setDataLoaded(true);

    try {
      const params = {
        page: page,
        page_size: pageSize,
        ...currentFilters,
      };

      Object.keys(params).forEach(key =>
        (params[key] === null || params[key] === '' || params[key] === undefined) && delete params[key]
      );

      if (params.fecha_envio_range) {
        params.fecha_envio_gte = params.fecha_envio_range[0].format('YYYY-MM-DD');
        params.fecha_envio_lte = params.fecha_envio_range[1].format('YYYY-MM-DD');
        delete params.fecha_envio_range;
      }

      const { data } = await getTransferencias(params);

      setTransferencias(data || []);
      console.log('Transferencias cargadas:', data || []);
      setPagination({
        current: page,
        pageSize,
        total: data.count,
      });

    } catch (error) {
      message.error('Error al cargar transferencias.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar Empresas al montar
  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const res = await getEmpresas();
        setEmpresas(res.data.results || res.data); // Maneja paginación o lista simple
      } catch (error) {
        message.error('Error al cargar empresas');
      } finally {
        setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();
  }, []);

  // Cargar Almacenes (se dispara por el Form.onValuesChange)
  const fetchAlmacenesPorEmpresa = useCallback(async (empresaId) => {
    setLoadingAlmacenes(true);
    try {
      const res = await getAlmacenes({ empresa: empresaId });
      setAlmacenes(res.data.results || res.data); // Maneja paginación o lista simple
    } catch (error) {
      message.error('Error al cargar almacenes de la empresa');
      setAlmacenes([]);
    } finally {
      setLoadingAlmacenes(false);
    }
  }, []);

  // ¡REFACTOR! Manejador central para cambios en el formulario
  const handleFormValuesChange = (changedValues, allValues) => {
    // Si la 'empresa' cambió...
    if (changedValues.hasOwnProperty('empresa')) {
      const empresaId = changedValues.empresa;
      form.setFieldsValue({
        almacen_destino: null,
        almacen_origen: null
      });
      if (empresaId) {
        fetchAlmacenesPorEmpresa(empresaId);
      } else {
        setAlmacenes([]); // Si limpian la empresa, limpia los almacenes
      }
    }
  };

  // Manejador del cambio de página de la tabla
  const handleTableChange = (newPagination) => {
    fetchDatos(newPagination.current, newPagination.pageSize, filters);
  };

  // Manejador del botón "Filtrar"
  const handleFilterSubmit = (values) => {
    setFilters(values);
    fetchDatos(1, pagination.pageSize, values); // Resetea a página 1
  };

  // Manejador del botón "Limpiar"
  const handleFilterReset = () => {
    form.resetFields();
    setFilters(null);
    setTransferencias([]);
    setPagination({ current: 1, pageSize: 10, total: 0 });
    setDataLoaded(false);
    setAlmacenes([]); // Limpia los almacenes
  };

  // --- Manejo del Modal ---
  const [modalVisible, setModalVisible] = useState(false);
  const [transferenciaSeleccionada, setTransferenciaSeleccionada] = useState(null);

  const abrirModalRecepcion = (record) => {
    setTransferenciaSeleccionada(record);
    setModalVisible(true);
  };
  const cerrarModalRecepcion = () => setModalVisible(false);

  const handleRecepcionExitosa = (transferenciaActualizada) => {
    // Actualiza la fila en la tabla localmente
    setTransferencias(prev =>
      prev.map(t =>
        t.id === transferenciaActualizada.id ? transferenciaActualizada : t
      )
    );
    cerrarModalRecepcion();
  };

  const handleRevertirRecepcion = async (record) => {
    try {
      const { data: transferenciaActualizada } = await revertirTransferencia(record.id);

      message.success(`Transferencia ${record.id} revertida a EN TRÁNSITO.`);

      // Actualiza la fila en la tabla localmente
      setTransferencias(prev =>
        prev.map(t =>
          t.id === transferenciaActualizada.id ? transferenciaActualizada : t
        )
      );
    } catch (error) {
      message.error('Error al revertir la recepción.');
      console.error(error);
    }
  };

  // --- COLUMNAS ---  
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: getEstadoTag,
      width: 180,
    },
    {
      title: 'Dcocumento',
      dataIndex: 'id_erp_salida_cab',
      key: 'id_erp_salida_cab',
      // ¡CORREGIDO! Usar 'descripcion'
      //render: (a) => a ? a : 'N/A',
    },
    {
      title: 'Producto',
      dataIndex: 'producto',
      key: 'producto',
      ellipsis: true,
      render: (p) => (
        <Tooltip placement="topLeft" title={p ? `${p.codigo_producto} - ${p.nombre_producto}` : 'N/A'}>
          {p.nombre_producto}
        </Tooltip>
      ),

    },
    {
      title: 'Origen',
      dataIndex: 'almacen_origen',
      key: 'almacen_origen',
      // ¡CORREGIDO! Usar 'descripcion'
      render: (a) => a?.descripcion || 'N/A',
    },
    {
      title: 'Destino',
      dataIndex: 'almacen_destino',
      key: 'almacen_destino',
      // ¡CORREGIDO! Usar 'descripcion'
      render: (a) => a?.descripcion || 'N/A',
    },
    {
      title: 'Cant. Enviada',
      dataIndex: 'cantidad_enviada',
      key: 'cantidad_enviada',
      render: (val) => Number(val).toFixed(2),
    },
    {
      title: 'Cant. Recibida',
      dataIndex: 'cantidad_recibida',
      key: 'cantidad_recibida',
      render: (val) => (val !== null && val !== undefined) ? Number(val).toFixed(2) : '-',
    },
    {
      title: 'Fecha Envío',
      dataIndex: 'fecha_envio',
      key: 'fecha_envio',
      render: (val) => val ? moment(val).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          {/* Lógica condicional: Mostrar 'Recibir' o 'Revertir' */}

          {record.estado === 'EN_TRANSITO' ? (
            // 1. Botón de Recibir
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              size="small"
              onClick={() => abrirModalRecepcion(record)}
            >
              Recibir
            </Button>
          ) : (
            // 2. Botón de Revertir (¡NUEVO!)
            <Popconfirm
              title="¿Revertir esta recepción?"
              description="El stock será recalculado. Esta acción no se puede deshacer."
              onConfirm={() => handleRevertirRecepcion(record)}
              okText="Sí, Revertir"
              cancelText="No"
            >
              <Button
                danger
                icon={<RollbackOutlined />}
                size="small"
              >
                Revertir
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Gestión de Transferencias</Title>

      <Card style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilterSubmit}
          // ¡REFACTOR! Usamos onValuesChange para el dropdown en cascada
          onValuesChange={handleFormValuesChange}
        >
          <Row gutter={16}>
            {/* --- Empresa --- */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="empresa"
                label="Empresa"
                rules={[{ required: true, message: 'Seleccione una empresa' }]}
              >
                <Select
                  placeholder="Seleccione una Empresa"
                  style={{ width: '100%' }}
                  loading={loadingEmpresas}
                  showSearch
                  optionFilterProp="children"
                // ¡REFACTOR! Eliminados 'value' y 'onChange'
                >
                  {empresas.map(emp => (
                    <Select.Option key={emp.id} value={emp.id}>
                      {emp.razon_social || emp.nombre_empresa}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* --- Almacén Destino --- */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="almacen_destino"
                label="Almacén Destino"
                rules={[{ required: true, message: 'Seleccione un almacén' }]}
              >
                <Select
                  placeholder="Seleccione un Almacén"
                  style={{ width: '100%' }}
                  loading={loadingAlmacenes}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  // ¡REFACTOR! Eliminados 'value' y 'onChange'
                  disabled={loadingAlmacenes || almacenes.length === 0}
                >
                  {/* ¡CORREGIDO! Usar 'descripcion' */}
                  {almacenes.map(alm => (
                    <Select.Option key={alm.id} value={alm.id}>
                      {`${alm.codigo} - ${alm.descripcion}`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* --- Filtros Secundarios --- */}
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="estado" label="Estado">
                <Select placeholder="Por defecto: En Tránsito" allowClear>
                  {ESTADOS_CHOICES.map(e => (
                    <Select.Option key={e.value} value={e.value}>{e.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="search" label="Buscar Producto o Doc.">
                <Input placeholder="Código, descripción, ID doc..." prefix={<SearchOutlined />} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="almacen_origen" label="Almacén Origen (Opcional)">
                <Select
                  placeholder="Cualquier origen"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  disabled={loadingAlmacenes || almacenes.length === 0}
                >
                  {/* ¡CORREGIDO! Usar 'descripcion' */}
                  {almacenes.map(a => (
                    <Select.Option key={a.id} value={a.id}>
                      {`${a.codigo} - ${a.descripcion}`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="fecha_envio_range" label="Rango Fecha Envío">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<ClearOutlined />} onClick={handleFilterReset}>
                  Limpiar
                </Button>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                  Filtrar
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* --- Tabla --- */}
      {dataLoaded ? (
        <Table
          columns={columns}
          dataSource={transferencias}
          loading={{
            spinning: loading,
            indicator: <Spin indicator={<LoadingOutlined />} size="large" />,
            tip: "Cargando..."
          }}
          size='small'
          rowKey="id"
          pagination={{
            position: ["bottomLeft"],
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50", "100"],
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} movimientos`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          bordered
        />
      ) : (
        // Estado inicial
        <Card>
          <Empty description="Seleccione una empresa y un almacén de destino para comenzar la búsqueda." />
        </Card>
      )}

      {/* --- Modal --- */}
      {transferenciaSeleccionada && (
        <RecepcionModal
          visible={modalVisible}
          onClose={cerrarModalRecepcion}
          transferencia={transferenciaSeleccionada}
          onRecepcionExitosa={handleRecepcionExitosa}
        />
      )}
    </div>
  );
};

export default TransferenciasPage;