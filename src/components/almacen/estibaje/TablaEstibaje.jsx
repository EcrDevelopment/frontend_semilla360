import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  Table, Button, Popconfirm, message, Tag, Space, Card, Row, Col, Select, DatePicker,
  Typography, Spin, Collapse, Grid, Input
} from "antd";
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, SyncOutlined, 
  SearchOutlined, FilterOutlined, LoadingOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs"; // <--- CAMBIO: Usamos dayjs por consistencia

import { getRegistrosEstibaje, deleteRegistroEstibaje } from "../../../api/Estibaje";
import { getEmpresas } from "../../../api/Empresas";

// Hooks
const { useBreakpoint } = Grid; // Forma estándar de importar en AntD moderno
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;

// --- DICCIONARIOS PARA MOSTRAR DATOS LINDOS ---
const TIPO_DOC_LABELS = {
    'GS': 'GUIA',
    'FT': 'FACTURA',
    'BV': 'BOLETA',
    'NC': 'NOTA CRED.',
    'OT': 'OTRO'
};

const TIPO_DOC_COLORS = {
    'GS': 'green',     // Guía = Verde (Común)
    'FT': 'blue',      // Factura = Azul
    'BV': 'cyan',      // Boleta = Celeste
    'NC': 'volcano',   // Nota Credito = Rojo/Naranja
    'OT': 'default'
};

const TablaEstibaje = forwardRef(({ onEdit, onCreate }, ref) => {
  const screens = useBreakpoint();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA FILTROS ---
  const [listaEmpresas, setListaEmpresas] = useState([]);
  const [filtros, setFiltros] = useState({
    empresa: undefined,
    tipo_documento: undefined,
    search: '',
    fechas: []
  });

  const [filtrosAbiertos, setFiltrosAbiertos] = useState([]);

  // Cargar Maestros
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const res = await getEmpresas();
        setListaEmpresas(res.data.results || res.data || []);
      } catch (e) { console.error("Error empresas", e); }
    };
    cargarEmpresas();
    listar(); 
  }, []);

  const listar = async (filtrosActivos = filtros) => {
    setLoading(true);
    try {
      const params = {}; 
      if (filtrosActivos.empresa) params.empresa = filtrosActivos.empresa;
      if (filtrosActivos.tipo_documento) params.tipo_documento = filtrosActivos.tipo_documento;
      if (filtrosActivos.search) params.search = filtrosActivos.search;

      // --- CAMBIO AQUÍ: Parametros apuntando a fecha_operacion ---
      if (filtrosActivos.fechas && filtrosActivos.fechas.length === 2) {
        // Dayjs format YYYY-MM-DD
        params.fecha_operacion__gte = filtrosActivos.fechas[0].format('YYYY-MM-DD'); 
        params.fecha_operacion__lte = filtrosActivos.fechas[1].format('YYYY-MM-DD');
      }

      const res = await getRegistrosEstibaje(params);
      setData(res.data.results || res.data || []);
    } catch (error) {
      console.error(error);
      message.error("Error cargando historial");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    reload: () => listar(filtros)
  }));

  const handleFilterChange = (key, val) => {
    const nuevosFiltros = { ...filtros, [key]: val };
    setFiltros(nuevosFiltros);
    // Auto-search al cambiar selects
    if (key !== 'search') {
      listar(nuevosFiltros);
    }
  };

  const limpiarFiltros = () => {
    const reset = { empresa: undefined, tipo_documento: undefined, search: '', fechas: [] };
    setFiltros(reset);
    listar(reset);
  };

  const handleDelete = async (id) => {
    try {
      await deleteRegistroEstibaje(id);
      message.success("Registro eliminado");
      listar(filtros);
    } catch (error) {
      message.error("No se pudo eliminar.");
    }
  };

  // --- COLUMNAS ---
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      align: 'center'
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_proceso',
      width: 100,
      fixed: screens.xs ? false : 'left',
      render: (t) => (
        <div style={{ lineHeight: '1.2em' }}>
          <div style={{ fontWeight: 'bold' }}>{dayjs(t).format('DD/MM/YYYY')}</div>          
        </div>
      )
    },
    {
      title: 'Empresa / Documento',
      width: 220,
      render: (_, r) => (
        <div>
          <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>
            {r.empresa_nombre}
          </Typography.Text>
          
          {/* LÓGICA DE VISUALIZACIÓN NUEVA */}
          <Tag 
            style={{ marginTop: 4 }} 
            color={TIPO_DOC_COLORS[r.tipo_documento] || 'default'}
          >
            {TIPO_DOC_LABELS[r.tipo_documento] || r.tipo_documento}: {r.nro_documento}
          </Tag>
        </div>
      )
    },
    { title: 'Placa', dataIndex: 'placa_vehiculo', width: 90 },
    { title: 'Producto', dataIndex: 'producto_nombre', ellipsis: true, width: 150 },
    {
      title: 'Costo',
      dataIndex: 'costo_total_operacion',
      align: 'right',
      width: 100,
      render: (val) => <b style={{ color: '#3f8600' }}>S/. {parseFloat(val).toFixed(2)}</b>
    },
    {
      title: 'Acción',
      align: 'center',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)} size="small" type="text" style={{ color: '#1890ff' }} />
          <Popconfirm title="¿Eliminar?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" type="text" danger />
          </Popconfirm>
        </>
      )
    }
  ];

  const renderFiltros = () => (
    <Row gutter={[12, 12]}>
      <Col xs={24} md={6}>
        <RangePicker 
            style={{ width: '100%' }} 
            placeholder={['Desde', 'Hasta']} 
            value={filtros.fechas} 
            onChange={(d) => handleFilterChange('fechas', d)} 
            format="DD/MM/YYYY"
        />
      </Col>
      <Col xs={24} md={6}>
        <Select placeholder="Empresa" style={{ width: '100%' }} allowClear value={filtros.empresa} onChange={(v) => handleFilterChange('empresa', v)}>
          {listaEmpresas.map(e => <Option key={e.id} value={e.id}>{e.razon_social}</Option>)}
        </Select>
      </Col>
      <Col xs={12} md={5}>
        <Select placeholder="Tipo Doc." style={{ width: '100%' }} allowClear value={filtros.tipo_documento} onChange={(v) => handleFilterChange('tipo_documento', v)}>
            <Option value="GS">GUIA</Option>
            <Option value="FT">FACTURA</Option>
            <Option value="BV">BOLETA</Option>
            <Option value="NC">NOTA CRED.</Option>
            <Option value="OT">OTRO</Option>
        </Select>
      </Col>
      <Col xs={12} md={4}>
        <Input placeholder="Buscar doc..." prefix={<SearchOutlined />} value={filtros.search} onChange={(e) => handleFilterChange('search', e.target.value)} onPressEnter={() => listar(filtros)} />
      </Col>
      <Col xs={24} md={3} style={{ textAlign: 'right' }}>
        <Button type="primary" icon={<SearchOutlined />} onClick={() => listar(filtros)} block={screens.xs}>Buscar</Button>
        {(filtros.empresa || filtros.search || filtros.tipo_documento || (filtros.fechas && filtros.fechas.length > 0)) && (
          <Button type="link" size="small" onClick={limpiarFiltros} style={{ marginTop: 5 }}>Limpiar</Button>
        )}
      </Col>
    </Row>
  );

  return (
    <Card
      title={<span style={{ fontSize: 18 }}>Registro de estibaje</span>}
      styles={{ padding: '10px 10px 0 10px' }} // Sintaxis AntD v5 para quitar padding al body
      extra={
        <Space>
          {!screens.xs && <Button icon={<SyncOutlined />} onClick={() => listar(filtros)} />}
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Nuevo</Button>
        </Space>
      }
    >
      {screens.xs ? (
        <Collapse ghost activeKey={filtrosAbiertos} onChange={setFiltrosAbiertos} style={{ marginBottom: 15 }}>
          <Panel header={<Space><FilterOutlined /> Filtros de Búsqueda</Space>} key="1">
            {renderFiltros()}
          </Panel>
        </Collapse>
      ) : (
        <div style={{ marginBottom: 20 }}>{renderFiltros()}</div>
      )}

      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={{
          spinning: loading,
          indicator: <Spin indicator={<LoadingOutlined />} size="large" />,
          tip: "Cargando..."
        }}
        size="middle"
        scroll={{ x: 800, y: 500 }}
        pagination={{ pageSize: 10, simple: screens.xs, position: ["bottomRight"] }}
      />
    </Card>
  );
});

export default TablaEstibaje;