import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
    Table, Button, Popconfirm, message, Tag, Space, Card, Row, Col, Select, DatePicker,
    Input, Collapse, Typography,Spin
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SyncOutlined, SearchOutlined, FilterOutlined , LoadingOutlined} from "@ant-design/icons";
import { getRegistrosEstibaje, deleteRegistroEstibaje } from "../../../api/Estibaje";
import { getEmpresas } from "../../../api/Empresas";
import moment from "moment";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;

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

    //const [filtros, setFiltros] = useState({ empresa: undefined, tipo_documento: undefined, search: '', fechas: [] });
    // Controlar si el panel de filtros está abierto
    const [filtrosAbiertos, setFiltrosAbiertos] = useState([]);

    // Cargar Maestros (Empresas)
    useEffect(() => {
        const cargarEmpresas = async () => {
            try {
                const res = await getEmpresas();
                setListaEmpresas(res.data.results || res.data || []);
            } catch (e) { console.error("Error empresas", e); }
        };
        cargarEmpresas();
        listar(); // Carga inicial de datos
    }, []);

    const listar = async (filtrosActivos = filtros) => {
        setLoading(true);
        try {
            // Preparamos los parámetros para Django Filter
            const params = {};

            if (filtrosActivos.empresa) params.empresa = filtrosActivos.empresa;
            if (filtrosActivos.tipo_documento) params.tipo_documento = filtrosActivos.tipo_documento;
            if (filtrosActivos.search) params.search = filtrosActivos.search;

            // Manejo de Fechas (Django espera YYYY-MM-DD)
            if (filtrosActivos.fechas && filtrosActivos.fechas.length === 2) {
                params.fecha_registro__gte = filtrosActivos.fechas[0].format('YYYY-MM-DD 00:00:00');
                params.fecha_registro__lte = filtrosActivos.fechas[1].format('YYYY-MM-DD 23:59:59');
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

    // --- MANEJO DE CAMBIOS EN FILTROS ---
    const handleFilterChange = (key, val) => {
        const nuevosFiltros = { ...filtros, [key]: val };
        setFiltros(nuevosFiltros);
        // Opcional: Buscar automáticamente al cambiar selects, pero esperar enter en inputs
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

    const columns = [
        {
            title: 'Fecha',
            dataIndex: 'fecha_registro',
            width: 100,
            fixed: screens.xs ? false : 'left', // Fijo a la izquierda solo en PC
            render: (t) => (
                <div style={{ lineHeight: '1.2em' }}>
                    <div style={{ fontWeight: 'bold' }}>{moment(t).format('DD/MM/YYYY')}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{moment(t).format('HH:mm')}</div>
                </div>
            )
        },
        {
            title: 'Empresa / Doc',
            width: 200,
            render: (_, r) => (
                <div>
                    <Typography.Text strong style={{ fontSize: 13 }}>{r.empresa_nombre}</Typography.Text>
                    <br />
                    <Tag style={{ marginTop: 4 }} color={r.tipo_documento === 'I' ? 'geekblue' : 'volcano'}>
                        {r.nro_documento}
                    </Tag>
                </div>
            )
        },
        // Ocultamos columnas menos relevantes en móviles muy pequeños si queremos, 
        // pero con scroll horizontal es mejor dejarlas.
        { title: 'Placa', dataIndex: 'placa_vehiculo', width: 90 },
        { title: 'Producto', dataIndex: 'producto_nombre', ellipsis: true, width: 150 },
        {
            title: 'Costo',
            dataIndex: 'costo_total_operacion',
            align: 'right',
            width: 100,
            render: (val) => <b style={{ color: '#3f8600' }}>S/. {val}</b>
        },
        {
            title: 'Acción',
            align: 'center',
            width: 80,
            fixed: 'right', // Acciones siempre visibles a la derecha
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
                <RangePicker style={{ width: '100%' }} placeholder={['Desde', 'Hasta']} value={filtros.fechas} onChange={(d) => handleFilterChange('fechas', d)} />
            </Col>
            <Col xs={24} md={6}>
                <Select placeholder="Empresa" style={{ width: '100%' }} allowClear value={filtros.empresa} onChange={(v) => handleFilterChange('empresa', v)}>
                    {listaEmpresas.map(e => <Option key={e.id} value={e.id}>{e.razon_social}</Option>)}
                </Select>
            </Col>
            <Col xs={12} md={4}>
                <Select placeholder="Movimiento" style={{ width: '100%' }} allowClear value={filtros.tipo_documento} onChange={(v) => handleFilterChange('tipo_documento', v)}>
                    <Option value="I">Ingreso</Option>
                    <Option value="S">Salida</Option>
                </Select>
            </Col>
            <Col xs={12} md={5}>
                <Input placeholder="Buscar..." prefix={<SearchOutlined />} value={filtros.search} onChange={(e) => handleFilterChange('search', e.target.value)} onPressEnter={() => listar(filtros)} />
            </Col>
            <Col xs={24} md={3} style={{ textAlign: 'right' }}>
                <Button type="primary" icon={<SearchOutlined />} onClick={() => listar(filtros)} block={screens.xs}>Buscar</Button>
                {/* Botón limpiar solo visible si hay filtros */}
                {(filtros.empresa || filtros.search || filtros.tipo_documento) && (
                    <Button type="link" size="small" onClick={limpiarFiltros} style={{ marginTop: 5 }}>Limpiar</Button>
                )}
            </Col>
        </Row>
    );

    return (
        <Card
            title={<span style={{ fontSize: 18 }}>Registro de estibaje</span>}
            styles={{ padding: '10px 10px 0 10px' }} // Menos padding para aprovechar espacio
            extra={
                <Space>
                    {!screens.xs && <Button icon={<SyncOutlined />} onClick={() => listar(filtros)} />}
                    <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Nuevo</Button>
                </Space>
            }
        >
            {/* EN MÓVIL: Filtros colapsables / EN PC: Filtros siempre visibles */}
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
                // HABILITAR SCROLL: X para horizontal, Y para altura máxima
                scroll={{ x: 750, y: 500 }}
                pagination={{ pageSize: 10, simple: screens.xs ,position: ["bottomLeft"] }} // Paginación simple en móvil
            />
        </Card>
    );
});

export default TablaEstibaje;