import { useEffect, useState, useCallback } from 'react';
import {
  Table, Select, Card, Spin, message, Tooltip,
  Row, Col, DatePicker, Button, Space, Input, Tag, Descriptions, Typography,
  Dropdown, Popconfirm
} from 'antd';
import { LoadingOutlined, SearchOutlined, SettingOutlined, DownOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Importar servicios
import { getEmpresas } from '../../../api/Empresas';
import { getAlmacenes } from '../../../api/Almacen';
import { getMovimientos, triggerSync } from '../../../api/Movimientos';
import DetalleGuiaExpandida from './DetalleDocMovimiento';
import useDebounce from '../../../hooks/useDebounce';
import { useWebSocket } from '../../../context/WebSocketContext';

// --- (Pega el hook 'useDebounce' aquí si no lo importas de otro archivo) ---
// function useDebounce(value, delay) { ... }

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function MovimientoAlmacenList() {
  // Estados para datos
  const [empresas, setEmpresas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]); // <-- Este estado ahora es dinámico
  const [movimientos, setMovimientos] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Estados para filtros seleccionados
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(null);
  const [selectedAlmacenId, setSelectedAlmacenId] = useState(null);
  const hoy = dayjs();
  const haceUnMes = dayjs().subtract(1, 'weeks');
  const [dateRange, setDateRange] = useState([haceUnMes, hoy]);

  // ---  DEBOUNCING ---
  const [searchText, setSearchText] = useState(''); // Valor inmediato del input
  const debouncedSearchText = useDebounce(searchText, 400); // Valor "retrasado" (400ms)

  const [isSyncing, setIsSyncing] = useState(false);
  const { lastMessage } = useWebSocket();

  const fetchMovimientos = useCallback(async () => {
    if (!selectedEmpresaId || !selectedAlmacenId) {
      setMovimientos([]);
      return;
    }

    setLoadingMovimientos(true);
    const params = {
      empresa: selectedEmpresaId,
      almacen: selectedAlmacenId,
      ...(dateRange && dateRange[0] && { fecha_documento_desde: dateRange[0].format('YYYY-MM-DD') }),
      ...(dateRange && dateRange[1] && { fecha_documento_hasta: dateRange[1].format('YYYY-MM-DD') }),
      ...(debouncedSearchText && { search: debouncedSearchText }),
      ordering: '-fecha-documento',
    };

    try {
      const res = await getMovimientos(params);
      setMovimientos(res.data.results || res.data);
    } catch (error) {
      message.error('Error al cargar movimientos de almacén');
      setMovimientos([]);
    } finally {
      setLoadingMovimientos(false);
    }
  }, [
    // Dependencias de la función:
    selectedEmpresaId,
    selectedAlmacenId,
    dateRange,
    debouncedSearchText
  ]);


  const handleSocketMessage = useCallback((data) => {
    const { status, message: msg, result } = data;
    const messageKey = 'syncStatus';

    if (status === 'started') {
      setIsSyncing(true);
      message.loading({ content: msg, key: messageKey });
    }
    else if (status === 'finished') {
      setIsSyncing(false);
      message.success({ content: msg, key: messageKey, duration: 4 });
      fetchMovimientos(); // ¡CRÍTICO! Refresca la tabla
    }
    else if (status === 'failed') {
      setIsSyncing(false);
      message.error({ content: `Error: ${msg}`, key: messageKey, duration: 6 });
    }
  }, [fetchMovimientos]);


  useEffect(() => {
    // Si no hay mensaje, o si no es un mensaje de 'sync_update', ignorarlo.
    if (!lastMessage || lastMessage.type !== 'sync_update') {
      return;
    }

    // ¡Mensaje recibido! Llamar a nuestro handler
    handleSocketMessage(lastMessage);

  }, [lastMessage, handleSocketMessage]);

  // Cargar Empresas al montar el componente (sin cambios)
  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const res = await getEmpresas();
        setEmpresas(res.data);
      } catch (error) {
        message.error('Error al cargar empresas');
      } finally {
        setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();
  }, []);

  // Cargar Almacenes SÓLO SI cambia la empresa seleccionada
  useEffect(() => {
    // 1. Si no hay empresa, limpiar los almacenes y no hacer nada
    if (!selectedEmpresaId) {
      setAlmacenes([]);
      setSelectedAlmacenId(null); // Asegura que el selector de almacén se reinicie
      return;
    }

    // 2. Si hay empresa, buscar SÓLO sus almacenes
    const fetchAlmacenesPorEmpresa = async () => {
      setLoadingAlmacenes(true);
      try {
        const res = await getAlmacenes({ empresa: selectedEmpresaId }); // Pasa el filtro al API
        //console.log('Almacenes cargados:', res.data);
        setAlmacenes(res.data);
      } catch (error) {
        message.error('Error al cargar almacenes de la empresa');
        setAlmacenes([]); // Limpiar en caso de error
      } finally {
        setLoadingAlmacenes(false);
      }
    };




    fetchAlmacenesPorEmpresa();
  }, [selectedEmpresaId]); // <-- Dependencia clave


  // --- Disparar la carga de movimientos ---
  useEffect(() => {
    fetchMovimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [    
    fetchMovimientos // <-- Depende de la función memoizada
  ]);


  const handleSync = async () => {
    if (!selectedEmpresaId) {
      message.error('Por favor, seleccione una Empresa para sincronizar.');
      return;
    }

    const empresaObj = empresas.find(e => e.id === selectedEmpresaId);
    if (!empresaObj || !empresaObj.nombre_empresa) {
      message.error('No se pudo encontrar el alias de la empresa seleccionada.');
      return;
    }

    setIsSyncing(true); // Pone a girar el botón INMEDIATAMENTE
    message.loading({ content: 'Enviando orden de sincronización...', key: 'syncStatus' });

    try {
      // 1. LLAMA A LA API (con tu Axios)
      // Ya no necesitamos el 'job_id', solo la lanzamos.
      // El backend pasa el request.user.id automáticamente.
      await triggerSync({ empresa_alias: empresaObj.nombre_empresa });

      // 2. ¡NO HAGAS NADA MÁS!
      // El WebSocket recibirá el mensaje 'started' 
      // y actualizará el 'message' de Antd.

    } catch (error) {
      // Si la API *falla* (ej. 500), el WebSocket nunca se activará.
      message.error({ content: 'Error al *iniciar* la tarea.', key: 'syncStatus', duration: 4 });
      setIsSyncing(false);
    }
  };



  const items = [
    { key: "1", label: "Validar" },
    { key: "2", label: "Cambiar val" },
    { key: "3", label: "Agregar gasto" },
  ];

  const handleMenuClick = (e, item) => {
    switch (e.key) {
      case "1":
        //console.log('item: ', item);
        handleValidarMovimiento(item);
        break;
      case "2":
        //console.log('item: ', item);
        handleEditarValidacion(item);
        break;
      case "3":
        message.info(`Agregar gasto para el movimiento ID: ${item.id}`);
        break;
      default:
        console.log("Opción no reconocida");
    }
  };




  // --- Definición de Columnas  ---
  const columns = [
    { title: 'Tipo Mov.', dataIndex: 'es_ingreso', key: 'es_ingreso', render: (esIngreso) => esIngreso ? <Tag color="green">Ingreso</Tag> : <Tag color="red">Salida</Tag> },
    { title: 'Fecha Doc.', dataIndex: 'fecha_documento', key: 'fecha_documento', render: (text) => dayjs(text).format('DD/MM/YYYY'), sorter: (a, b) => dayjs(a.fecha_documento).unix() - dayjs(b.fecha_documento).unix() },
    { title: 'Tipo Doc.', dataIndex: 'tipo_documento_erp', key: 'tipo_documento_erp' },
    { title: 'Número Doc.', dataIndex: 'numero_documento_erp', key: 'numero_documento_erp' },
    {
      title: 'Estado',
      dataIndex: 'estado_erp',
      key: 'estado_erp',
      render: (estado) => {
        let color = 'default';
        if (estado === 'F') color = 'blue';
        else if (estado === 'V') color = 'orange';
        else if (estado === 'A') color = 'red';
        return estado ? <Tag color={color}>{estado}</Tag> : 'N/A';
      }
    },
    {
      title: 'Documento Ref.', dataIndex: 'referencia_documento', key: 'referencia_documento', ellipsis: {
        showTitle: false,
      },
    },
    //{ title: 'Almacén', dataIndex: ['almacen', 'codigo'], key: 'almacen_codigo' },
    {
      title: 'Producto', dataIndex: ['producto', 'nombre_producto'], key: 'nombre_producto', ellipsis: {
        showTitle: false,
      },
      render: (nombreProducto) => (
        <Tooltip placement="topLeft" title={nombreProducto}>
          {nombreProducto}
        </Tooltip>
      ),
    },
    { title: 'Lote', dataIndex: 'lote', key: 'lote' },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad', render: (num) => parseFloat(num).toFixed(2), ellipsis: true },
    { title: 'Unidad', dataIndex: 'unidad_medida_erp', key: 'unidad_medida_erp' },
    /*
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Agregar">
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleValidarMovimiento(record)}
              type="link"
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditarValidacion(record)}
              type="link"
            />
          </Tooltip>
        </Space>
      ),
    },
    */
    {
      title: "Acciones",
      key: "operation",
      fixed: 'right',
      render: (record) => (
        <Space size="middle">
          <Dropdown menu={{ items, onClick: (e) => handleMenuClick(e, record) }}>
            <Button>
              <Space>
                <SettingOutlined />
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];


  // funcion editar validacion
  const handleEditarValidacion = (record) => {
    message.info(`Editar validación para el movimiento ID: ${record.id}`);
    // Aquí puedes abrir un modal o redirigir a otra página para editar la validación
  }

  // funcion validar movimiento
  const handleValidarMovimiento = (record) => {
    message.info(`Validar movimiento ID: ${record.id}`);
    // Aquí puedes abrir un modal o redirigir a otra página para validar el movimiento
  }


  const expandedRowRender = (record) => {

    // --- Condición Nueva y Exclusiva ---
    const esConsultaGuia = (
      record.codigo_movimiento === 'TD' &&
      record.tipo_documento_erp === 'NI'
    );

    // --- CASO 1: Es una NI por Traspaso (TD) ---
    if (esConsultaGuia) {
      // Renderiza SÓLO el componente de consulta
      return <DetalleGuiaExpandida record={record} />;
    }

    // --- CASO 2: Es cualquier otro movimiento (Lógica Antigua) ---
    let items = [];
    if (record.es_ingreso) {
      if (record.codigo_movimiento === 'CI') {
        items = [
          { key: '1', label: 'Proveedor', children: record.nombre_proveedor || 'N/A' },
          { key: '2', label: 'Cod. Proveedor', children: record.proveedor_erp_id || 'N/A' },
          { key: '3', label: 'OC', children: <Tag color='orange'>{record.id_importacion}</Tag> || 'N/A', span: 2 },
        ];
      } else {
        items = [
          { key: '1', label: 'Almacen Origen', children: record.almacen_ref || 'N/A', span: 2 },
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
        label: 'Notas Adicionales',
        span: 2,
        children: (
          <div className="flex flex-wrap gap-1">
            {notas.map((nota, index) => (
              <p>
                {nota.texto_detalle || nota.texto_descripcion || 'N/A'}
              </p>
            ))}
          </div>
        )
      });
    }

    // Si no hay items, no se muestra nada
    if (items.length === 0) {
      return null;
    }

    // Renderiza las Descripciones
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

  // --- 3. MODIFICAR rowExpandable (Lógica if/else) ---
  const rowExpandable = (record) => {

    // --- Condición Nueva ---
    const esConsultaGuia = (
      record.codigo_movimiento === 'TD' &&
      record.tipo_documento_erp === 'NI'
    );

    if (esConsultaGuia) {
      return true; // Siempre es expandible
    }

    // --- Condición Antigua ---
    const tieneDetallesAntiguos = (
      record.glosa_cabecera ||
      record.glosa_detalle ||
      record.cliente_erp_nombre ||
      record.cliente_erp_id ||
      record.proveedor_erp_id ||
      record.serie ||
      record.numero_orden_compra ||
      (record.notas && record.notas.length > 0)
    );

    return tieneDetallesAntiguos; // Es expandible si tiene detalles antiguos
  };


  return (
    <Card title="Consulta de Movimientos de Almacén" className="m-4 shadow-lg">
      {/* --- FILTROS --- */}
      <Row gutter={[16, 16]} className="mb-4">
        {/* Selector de Empresa */}
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Seleccione una Empresa"
            style={{ width: '100%' }}
            loading={loadingEmpresas}
            value={selectedEmpresaId}
            onChange={(value) => {
              setSelectedEmpresaId(value);
              setSelectedAlmacenId(null);
            }}
            options={empresas.map(emp => ({
              value: emp.id,
              label: emp.razon_social || emp.nombre_empresa
            }))}
          />
        </Col>

        {/* Selector de Almacén */}
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Seleccione un Almacén" // <-- Texto actualizado
            style={{ width: '100%' }}
            loading={loadingAlmacenes}
            value={selectedAlmacenId}
            onChange={(value) => setSelectedAlmacenId(value)}
            allowClear
            disabled={!selectedEmpresaId || loadingAlmacenes} // <-- Deshabilitado si no hay empresa

            // --- OPTIMIZACIÓN 1: Usar 'almacenes' directamente ---
            options={almacenes.map(alm => ({
              value: alm.id,
              label: `${alm.codigo} - ${alm.descripcion}`
            }))}
          />
        </Col>

        {/* Selector de Rango de Fechas */}
        <Col xs={24} sm={12} md={5}>
          <RangePicker
            style={{ width: '100%' }}
            onChange={(dates) => setDateRange(dates)}
            value={dateRange}
            format="DD/MM/YYYY"
          />
        </Col>

        {/* Input de Búsqueda */}
        <Col xs={24} sm={12} md={5}>
          <Input
            placeholder="Buscar en Nro Doc/Glosas..."
            prefix={<SearchOutlined />}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            value={searchText}
          />
        </Col>

        {/* Botón de Sincronizar */}
        <Col xs={24} sm={12} md={2}>
          <Popconfirm
            title="¿Sincronizar ahora?"
            description="La tarea correrá en segundo plano."
            onConfirm={handleSync}
            okText="Sí, Sincronizar"
            cancelText="No"
            disabled={isSyncing || !selectedEmpresaId}
          >
            <Button
              type="primary"
              icon={<SyncOutlined spin={isSyncing} />}
              loading={isSyncing} // 'loading' es más simple que 'spin'
              disabled={!selectedEmpresaId} // Deshabilitado si no hay empresa
              style={{ width: '100%' }}
            >
              {isSyncing ? 'Sinc...' : 'Sincronizar'}
            </Button>
          </Popconfirm>
        </Col>
      </Row>

      {/* --- TABLA DE RESULTADOS --- */}
      <Table
        columns={columns}
        dataSource={movimientos}
        rowKey="id"
        loading={{
          spinning: loadingMovimientos,
          indicator: <Spin indicator={<LoadingOutlined />} size="large" />,
          tip: "Cargando movimientos..."
        }}
        scroll={{ x: 1200 }}
        pagination={{
          position: ["bottomCenter"],
          showSizeChanger: true,
          pageSizeOptions: ["10", "25", "50", "100"],
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} movimientos`
        }}
        size='small'
        locale={{ emptyText: (!selectedEmpresaId || !selectedAlmacenId) ? 'Por favor, seleccione una Empresa y un Almacén.' : 'No se encontraron movimientos con los filtros aplicados.' }}
        expandable={{
          expandedRowRender: expandedRowRender,
          rowExpandable: rowExpandable,
        }}
      />
    </Card>
  );
}