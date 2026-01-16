import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Table, Select, Card, Spin, message, Tooltip,
  Row, Col, DatePicker, Button, Input, Tag, Descriptions, Typography,
  Popconfirm, Progress
} from 'antd';
import { LoadingOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import moment from 'moment';

// --- SERVICIOS ---
import { getEmpresas } from '../../../api/Empresas';
import { getAlmacenes } from '../../../api/Almacen';
import { getMovimientos, triggerSync, checkSyncStatus } from '../../../api/Movimientos';
import { getProductos } from '../../../api/Productos';


import DetalleGuiaExpandida from './DetalleDocMovimiento';
import useDebounce from '../../../hooks/useDebounce';
import { useWebSocket } from '../../../context/WebSocketContext';

const { RangePicker } = DatePicker;
const { Text } = Typography;

dayjs.extend(utc);

export default function MovimientoAlmacenList() {
  // --- ESTADOS PRINCIPALES ---
  const [empresas, setEmpresas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  
  // --- ESTADO TIPO "OFFICIAL DOCS" (TableParams) ---
  // Unificamos paginación y ordenamiento para evitar conflictos de estado
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    field: null,    // Campo activo (ej: 'fecha_documento')
    order: null,    // Orden activo (ej: 'descend')
  });

  const [movimientos, setMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // --- ESTADOS DE FILTROS ---
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(null);
  const [selectedAlmacenId, setSelectedAlmacenId] = useState(null);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(1, 'weeks'), dayjs()]);
  const [searchText, setSearchText] = useState('');

  // --- WEBSOCKET ---
  const [syncStatusText, setSyncStatusText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 400);
  const [isSyncing, setIsSyncing] = useState(false);
  const { lastMessage, sendMessage, isConnected, clearLastMessage } = useWebSocket();
  const currentStreamRef = useRef(null);
  const [progressPercent, setProgressPercent] = useState(0);

  const lastUpdateRef = useRef(Date.now());


  // -----------------------------------------------------------------------
  // 1. CARGA DE MAESTROS
  // -----------------------------------------------------------------------
  useEffect(() => {

    // A. Recuperación INMEDIATA visual (para que el usuario vea que carga al dar F5)
    const wasSyncing = localStorage.getItem('is_syncing_movimientos') === 'true'; // <--- CAMBIO
    if (wasSyncing) {
        setIsSyncing(true);
        setSyncStatusText('Recuperando sincronización...');
    }

    // B. Verificación REAL con el Backend
    const fetchInitialStatus = async () => {
      try {
        const res = await checkSyncStatus();
        if (res.data.is_syncing) {
          setIsSyncing(true);
          localStorage.setItem('is_syncing_movimientos', 'true'); // <--- CAMBIO
          if (res.data.message) setSyncStatusText(res.data.message);
          if (res.data.percent !== undefined) setProgressPercent(res.data.percent);
          // Actualizamos el reloj del watchdog
          lastUpdateRef.current = Date.now(); 
        } else {
          // Si el backend dice que NO está sincronizando, corregimos al frontend
          setIsSyncing(false);
          localStorage.removeItem('is_syncing_movimientos'); // <--- CAMBIO
          setProgressPercent(0);
        }
      } catch (error) { 
        console.error("Error status:", error); 
        // Si falla la verificación y llevábamos mucho tiempo, apagamos
        if (wasSyncing) {
            message.warning("No se pudo verificar el estado de la sincronización.");
            setIsSyncing(false);
            localStorage.removeItem('is_syncing_movimientos');
        }
      }
    };

    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const res = await getEmpresas();
        setEmpresas(res.data.results || res.data);
      } catch (error) {
        message.error('Error al cargar empresas');
      } finally {
        setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();

    fetchInitialStatus();
  }, []);

  useEffect(() => {
    if (!selectedEmpresaId) {
      setAlmacenes([]);
      setProductos([]);
      setSelectedAlmacenId(null);
      setSelectedProductos([]);
      return;
    }

    const fetchDataPorEmpresa = async () => {
      setLoadingAlmacenes(true);
      setLoadingProductos(true);
      try {
        const [resAlmacenes, resProductos] = await Promise.all([
          getAlmacenes({ empresa: selectedEmpresaId }),
          getProductos({ empresa: selectedEmpresaId })
        ]);
        setAlmacenes(resAlmacenes.data.results || resAlmacenes.data);
        setProductos(resProductos.data.results || resProductos.data);
      } catch (error) {
        console.error(error);
        message.warning('No se pudieron cargar todos los datos.');
      } finally {
        setLoadingAlmacenes(false);
        setLoadingProductos(false);
      }
    };
    fetchDataPorEmpresa();
  }, [selectedEmpresaId]);


  // -----------------------------------------------------------------------
  // 2. DEFINICIÓN DE COLUMNAS (ESTÁTICA / MEMOIZADA)
  // -----------------------------------------------------------------------
  // IMPORTANTE: El array de dependencias VACÍO [] es vital.
  // Evita que las columnas se regeneren al hacer clic, solucionando el error "undefined".
  const columns = useMemo(() => [
    { 
      title: 'T. Mov.', 
      dataIndex: 'es_ingreso', 
      key: 'es_ingreso', 
      sorter: true,
      width: 70, 
      render: (esIngreso) => esIngreso ? <Tag color="green">Ingreso</Tag> : <Tag color="red">Salida</Tag> 
    },
    { 
      title: 'Fecha', 
      dataIndex: 'fecha_documento', 
      key: 'fecha_documento', 
      width: 100, 
      sorter: true, // Solo activamos sorter, la lógica la maneja tableParams
      render: (val) => val ? moment(val).format('DD/MM/YYYY HH:mm') : '-',
    },
    { 
      title: 'Nro Doc.', 
      dataIndex: 'numero_documento_erp', 
      key: 'numero_documento_erp', 
      width: 80,
      sorter: true,
    },
    { title: 'T. Doc', dataIndex: 'tipo_documento_erp', key: 'tipo_documento_erp', width: 60 },
    { 
      title:'Estado', 
      dataIndex: 'estado_erp', 
      key: 'estado_erp', 
      width: 80, 
      sorter: true,
      render: (estado) => {
        let color = 'default';
        if (estado === 'V') color = 'green';
        if (estado === 'F') color = 'blue';
        return <Tag color={color}>{estado}</Tag>;
      }
    },
    {
      title: 'Producto',
      dataIndex: ['producto', 'nombre_producto'],
      key: 'nombre_producto', 
      width: 200,
      sorter: true,
      ellipsis: true,
      render: (nombre) => <Tooltip title={nombre}><div className="truncate w-full">{nombre}</div></Tooltip>
    },
    { title: 'Cant.', dataIndex: 'cantidad', key: 'cantidad', width: 90, align: 'right', render: (num) => parseFloat(num).toFixed(2) },
    { title: 'Und', dataIndex: 'unidad_medida_erp', key: 'unidad_medida_erp', width: 60 },
  ], []); // <--- NO CAMBIAR ESTE ARRAY VACÍO


  // -----------------------------------------------------------------------
  // 3. FETCH MOVIMIENTOS (Principal)
  // -----------------------------------------------------------------------
  const fetchMovimientos = useCallback(async () => {
    if (!selectedEmpresaId || !selectedAlmacenId) {
      setMovimientos([]);
      return;
    }
    setLoadingMovimientos(true);

    // Lógica de Ordenamiento para Django
    // Por defecto ordenamos por fecha descendente
    let orderingParam = '-fecha_documento'; 
    
    if (tableParams.field && tableParams.order) {
      const field = Array.isArray(tableParams.field) ? tableParams.field.join('__') : tableParams.field;
      const prefix = tableParams.order === 'ascend' ? '' : '-';
      orderingParam = `${prefix}${field}`;
    }

    const productosString = selectedProductos.length > 0 ? selectedProductos.join(',') : undefined;

    const params = {
      // Paginación
      page: tableParams.pagination.current,
      page_size: tableParams.pagination.pageSize,

      // Filtros
      empresa: selectedEmpresaId,
      almacen: selectedAlmacenId,
      ...(dateRange && dateRange[0] && { fecha_documento_desde: dateRange[0].format('YYYY-MM-DD') }),
      ...(dateRange && dateRange[1] && { fecha_documento_hasta: dateRange[1].format('YYYY-MM-DD') }),
      ...(debouncedSearchText && { search: debouncedSearchText }),
      ...(productosString && { producto__in: productosString }),

      // Ordenamiento calculado
      ordering: orderingParam, 
    };

    try {
      const res = await getMovimientos(params);
      
      setMovimientos(res.data.results || res.data);
      
      // Actualizamos total para la paginación
      setTableParams((prev) => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          total: res.data.count || 0, 
        },
      }));

    } catch (error) {
      message.error('Error al cargar movimientos');
    } finally {
      setLoadingMovimientos(false);
    }
  }, [
    selectedEmpresaId, 
    selectedAlmacenId, 
    dateRange, 
    debouncedSearchText, 
    selectedProductos,
    // Dependencias del TableParams (Esto hace que el useEffect se dispare al cambiar orden/pagina)
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.field,
    tableParams.order
  ]);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);


  // -----------------------------------------------------------------------
  // 4. HANDLER DE CAMBIOS EN LA TABLA
  // -----------------------------------------------------------------------
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      // Actualizamos el estado de ordenamiento basado en lo que envía AntD
      order: Array.isArray(sorter) ? undefined : sorter.order,
      field: Array.isArray(sorter) ? undefined : sorter.field,
    });

    // Si cambió el pageSize, volvemos a la página 1 (opcional)
    if (pagination.pageSize !== tableParams.pagination.pageSize) {
      setMovimientos([]);
    }
  };


  // -----------------------------------------------------------------------
  // WEBSOCKET LOGIC
  // -----------------------------------------------------------------------
  const handleSocketMessage = useCallback((data) => {
    const { status, message: msg, result } = data;
    lastUpdateRef.current = Date.now();
    if (msg) setSyncStatusText(msg);
    if (status === 'progress') {
      setIsSyncing(true);
      if (result && result.percent !== undefined) setProgressPercent(Number(result.percent));
    }
    else if (status === 'finished') {
      setIsSyncing(false);
      setProgressPercent(100);
      message.success('Sincronización finalizada');
      fetchMovimientos();
    }
  }, [fetchMovimientos]);

  useEffect(() => {
    if (!isConnected) return;
    if (currentStreamRef.current) {
      sendMessage({ type: 'unsubscribe', stream: currentStreamRef.current });
      currentStreamRef.current = null;
    }
    if (selectedEmpresaId != null) {
      const newStream = `sync_movimientos_empresa_${selectedEmpresaId}`;
      sendMessage({ type: 'subscribe', stream: newStream });
      currentStreamRef.current = newStream;
    }
    return () => {
      if (isConnected && currentStreamRef.current) {
        sendMessage({ type: 'unsubscribe', stream: currentStreamRef.current });
        currentStreamRef.current = null;
      }
    };
  }, [isConnected, selectedEmpresaId, sendMessage]);

  useEffect(() => {
    
    const fetchInitialStatus = async () => {
      try {
        const res = await checkSyncStatus();
        if (res.data.is_syncing) {
          setIsSyncing(true);
          if (res.data.message) setSyncStatusText(res.data.message);
          if (res.data.percent !== undefined) setProgressPercent(res.data.percent);
        }
      } catch (error) { console.error("Error status:", error); }
    };
    fetchInitialStatus();
  }, []);
  

  useEffect(() => {
    if (!lastMessage) return;
    const tipo = lastMessage.type;
    if (tipo === 'sync_update' || tipo === 'sync.update') {
      handleSocketMessage(lastMessage);
      clearLastMessage();
    }
  }, [lastMessage, handleSocketMessage, clearLastMessage]);


  // -----------------------------------------------------------------------
  // ACTIONS
  // -----------------------------------------------------------------------
  const handleSync = async () => {
    if (!selectedEmpresaId) {
      message.error('Seleccione una Empresa.');
      return;
    }
    const empresaObj = empresas.find(e => e.id === selectedEmpresaId);
    if (!empresaObj) return;

    setIsSyncing(true);
    message.loading({ content: 'Iniciando sincronización...', key: 'syncStatus', duration: 1 });
    try {
      await triggerSync({ empresa_alias: empresaObj.nombre_empresa });
    } catch (error) {
      message.error({ content: 'Error al iniciar.', key: 'syncStatus' });
      setIsSyncing(false);
    }
  };


  // -----------------------------------------------------------------------
  // EXPANDABLE RENDER
  // -----------------------------------------------------------------------
  const expandedRowRender = (record) => {    
    const esConsultaGuia = (
      record.codigo_movimiento === 'TD' &&
      record.tipo_documento_erp === 'NI'
    );

    if (esConsultaGuia) {
      return <DetalleGuiaExpandida record={record} />;
    }

    let items = [];
    if (record.es_ingreso) {
      if (record.codigo_movimiento === 'CI') {
        items = [
          { key: '1', label: 'Proveedor', children: record.nombre_proveedor || 'N/A' },
          { key: '2', label: 'Cod. Proveedor', children: record.proveedor_erp_id || 'N/A' },
          { key: '3', label: 'OC', children: <Tag color='orange'>{record.id_importacion}</Tag> || 'N/A', span: 2 },
        ];
      }
      if (record.codigo_movimiento === 'FT') {
        items = [
          { key: '1', label: 'Cliente', children: record.cliente_erp_nombre || 'N/A' },
        ];
      }
      else {
        items = [
          { key: '1', label: 'detalle', children: record.glosa_cabecera || 'N/A', span: 2 },
        ];
      }
    } else { // Si es Salida
      items = [
        { key: '1', label: 'RUC D.', children: record.cliente_erp_id || 'N/A', span: 2 },
        { key: '2', label: 'Razón Social D.', children: record.cliente_erp_nombre || (record.cliente_erp_id || 'N/A'), span: 2 },
        { key: '3', label: 'Dirección D.', children: record.direccion_envio_erp || 'N/A', span: 2 },
        { key: '4', label: 'Motivo', children: record.motivo_tras || 'N/A', span: 2 },
      ];
    }

    const notas = record.notas || [];
    if (notas.length > 0) {
      items.push({
        key: '99',
        label: 'Texto',
        span: 2,
        children: (
          <div className="flex flex-wrap gap-1">
            {notas.map((nota, index) => (
              <p key={index}>
                {nota.texto_detalle || 'N/A'}
              </p>
            ))}
          </div>
        )
      });
    }

    if (items.length === 0) return null;

    return (
      <Descriptions
        title="Detalles Adicionales"
        bordered
        size="small"
        column={2}
        className="bg-gray-50 p-2"
      >
        {items.map(item => (
          <Descriptions.Item key={item.key} label={item.label} span={item.span}>
            {item.label === 'Motivo' ? (
              <Tag color="green">{item.children}</Tag>
            ) : (
              item.children
            )}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };  

  const rowExpandable = (record) => {
    const esConsultaGuia = (
      record.codigo_movimiento === 'TD' &&
      record.tipo_documento_erp === 'NI'
    );
    if (esConsultaGuia) return true;

    const tieneDetallesAntiguos = (
      record.glosa_cabecera ||
      record.glosa_detalle ||
      record.cliente_erp_nombre ||
      record.cliente_erp_id ||
      record.nombre_proveedor ||
      record.serie ||
      record.numero_orden_compra ||
      (record.notas && record.notas.length > 0)
    );
    return tieneDetallesAntiguos;
  };

  // -----------------------------------------------------------------------
  // RENDERIZADO (VIEW)
  // -----------------------------------------------------------------------
  return (
    <Card title="Consulta de Movimientos" className="m-4 shadow-lg">

      {/* --- SECCIÓN DE FILTROS --- */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} sm={12} md={5}>
          <Select
            placeholder="Seleccione Empresa"
            style={{ width: '100%' }}
            loading={loadingEmpresas}
            value={selectedEmpresaId}
            onChange={(value) => {
              setSelectedEmpresaId(value);
              setSelectedAlmacenId(null);
              setSelectedProductos([]);
            }}
            options={empresas.map(emp => ({
              value: emp.id,
              label: emp.razon_social || emp.nombre_empresa
            }))}
          />
        </Col>

        <Col xs={24} sm={12} md={5}>
          <Select
            placeholder="Seleccione Almacén"
            style={{ width: '100%' }}
            loading={loadingAlmacenes}
            value={selectedAlmacenId}
            onChange={setSelectedAlmacenId}
            allowClear
            disabled={!selectedEmpresaId}
            options={almacenes.map(alm => ({
              value: alm.id,
              label: `${alm.codigo} - ${alm.descripcion}`
            }))}
          />
        </Col>

        <Col xs={24} sm={24} md={8}>
          <Select
            mode="multiple"
            allowClear
            placeholder="Filtrar por Productos"
            style={{ width: '100%' }}
            loading={loadingProductos}
            value={selectedProductos}
            onChange={setSelectedProductos}
            disabled={!selectedEmpresaId}
            maxTagCount="responsive"
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={productos.map(prod => ({
              value: prod.id,
              label: `${prod.codigo_producto || ''} - ${prod.nombre_producto}`
            }))}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: '100%' }}
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
          />
        </Col>
      </Row>

      {/* --- SECCIÓN FILTROS SECUNDARIOS --- */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} sm={16} md={20}>
          <Input
            placeholder="Buscar global (Nro Doc, Glosa, OC...)"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </Col>

        <Col xs={24} sm={8} md={4}>
          <Popconfirm
            title="¿Sincronizar ahora?"
            description="La tarea correrá en segundo plano."
            onConfirm={handleSync}
            okText="Sí"
            cancelText="No"
            disabled={isSyncing || !selectedEmpresaId}
          >
            <Button
              type="primary"
              icon={<SyncOutlined spin={isSyncing} />}
              loading={isSyncing}
              disabled={isSyncing || !selectedEmpresaId}
              style={{ width: '100%' }}
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </Popconfirm>
        </Col>
      </Row>

      {/* --- BARRA DE PROGRESO --- */}
      {isSyncing && (
        <Row className="mb-4">
          <Col span={24}>
            <Text type="secondary" strong>{syncStatusText}</Text>
            <Progress percent={progressPercent} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
          </Col>
        </Row>
      )}

      {/* --- TABLA --- */}
      <Table
        columns={columns}
        dataSource={movimientos}
        rowKey={(record) => record.id || record.numero_documento_erp}        
        // Paginación conectada al tableParams
        pagination={{
          ...tableParams.pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "25", "50"],
          position: ["bottomCenter"]
        }}
        onChange={handleTableChange}        
        loading={{
          spinning: loadingMovimientos,
          indicator: <Spin indicator={<LoadingOutlined />} size="large" />,
          tip: "Cargando..."
        }}
        scroll={{ x: 1300 }}
        size='small'
        expandable={{
          expandedRowRender: expandedRowRender,
          rowExpandable: rowExpandable,
        }}
        locale={{ emptyText: !selectedEmpresaId ? 'Seleccione una Empresa.' : 'Sin datos.' }}
      />
    </Card>
  );
}