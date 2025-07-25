import { useEffect, useState } from 'react';
import { Table, Button, Modal, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { obtenerDetallesDespacho, eliminarDetalleDespacho, actualizarDetalleDespacho ,crearDetalleDespacho } from '../../../api/DetalleDespacho';
import FormularioDetalle from './FormularioDetalle';

export default function TablaDetalleDespacho({ despachoId }) {
    const [detalles, setDetalles] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [detalleEditando, setDetalleEditando] = useState(null);

    const cargarDetalles = async () => {
        try {
            const res = await obtenerDetallesDespacho(despachoId);
            //console.log("Detalles obtenidos:", res.data);
            setDetalles(res.data);
        } catch (err) {
            message.error('Error al cargar detalles');
        }
    };

    useEffect(() => {
        if (despachoId) cargarDetalles();
    }, [despachoId]);

    const handleEliminar = async (id) => {
        try {
            await eliminarDetalleDespacho(id);
            message.success('Detalle eliminado');
            cargarDetalles();
        } catch {
            message.error('Error al eliminar');
        }
    };

    const handleEditar = (detalle) => {
        setDetalleEditando(detalle);
        setModalVisible(true);
    };

    const handleNuevo = () => {
        setDetalleEditando(null);
        setModalVisible(true);
    };

    const handleGuardado = async (data, idDetalle) => {
        try {
            if (idDetalle) {
                const res = await actualizarDetalleDespacho(idDetalle, data);
                setDetalles((prev) =>
                    prev.map((item) => (item.id === idDetalle ? res.data : item))
                );
                message.success("Detalle actualizado");
            } else {
                const res = await crearDetalleDespacho(data);
                setDetalles((prev) => [...prev, res.data]);
                message.success("Detalle creado");
            }

            setModalVisible(false);
            setDetalleEditando(null);
        } catch (err) {
            console.error(err);
            message.error("Error al guardar detalle");
        }
    };

    const columnas = [
        { title: 'Placa Salida', dataIndex: 'placa_salida' },
        { title: 'Sacos Cargados', dataIndex: 'sacos_cargados' },
        { title: 'Peso Salida', dataIndex: 'peso_salida' },
        { title: 'Placa Llegada', dataIndex: 'placa_llegada' },
        { title: 'Sacos Descargados', dataIndex: 'sacos_descargados' },
        { title: 'Peso Llegada', dataIndex: 'peso_llegada' },
        { title: 'Merma', dataIndex: 'merma' },
        { title: 'Sacos Faltantes', dataIndex: 'sacos_faltantes' },
        { title: 'Sacos Rotos', dataIndex: 'sacos_rotos' },
        { title: 'Sacos Húmedos', dataIndex: 'sacos_humedos' },
        { title: 'Sacos Mojados', dataIndex: 'sacos_mojados' },
        { title: 'Pago Estiba', dataIndex: 'pago_estiba' },
        { title: 'Sacos x pagar', dataIndex: 'cant_desc' },
        {
            title: 'Acciones',
            fixed: 'right',
            render: (_, record) => (
                <>
                    <Button onClick={() => handleEditar(record)} type="link"><EditOutlined /></Button>
                    <Popconfirm
                        title="¿Seguro que deseas eliminar?"
                        onConfirm={() => handleEliminar(record.id)}
                    >
                        <Button danger type="link"><DeleteOutlined /></Button>
                    </Popconfirm>
                </>
            ),
        },
    ];

    return (
        <>            
            <div className="">
                <Button type="primary" onClick={handleNuevo} style={{ marginBottom: 10 }}>
                    Nuevo Detalle
                </Button>
                <Table
                    dataSource={detalles}
                    columns={columnas}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                />
                <Modal
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={null}
                    title={detalleEditando ? "Editar Detalle" : "Nuevo Detalle"}
                >
                    <FormularioDetalle
                        despachoId={despachoId}
                        detalle={detalleEditando}
                        onGuardado={handleGuardado}
                    />
                </Modal>
            </div>
        </>
    );
}
