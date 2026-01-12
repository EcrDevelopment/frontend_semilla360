import React, { useState, useEffect } from "react";
import { Table, Button, Popconfirm, message, Tag, Space, Card } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getRegistrosEstibaje, deleteRegistroEstibaje } from "../../../api/Estibaje";
import moment from "moment";

const TablaEstibaje = ({ onEdit, onCreate }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const listar = async () => {
        setLoading(true);
        try {
            const res = await getRegistrosEstibaje();
            setData(res.data.results || res.data); // Ajusta según tu paginación
        } catch (error) {
            message.error("Error cargando lista");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        listar();
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteRegistroEstibaje(id);
            message.success("Eliminado correctamente");
            listar(); // Refrescar tabla
        } catch (error) {
            message.error("No se pudo eliminar");
        }
    };

    const columns = [
        { title: 'Fecha', dataIndex: 'fecha_registro', render: (t) => moment(t).format('DD/MM/YYYY HH:mm') },
        { title: 'Empresa', dataIndex: 'empresa_nombre' }, // Asegúrate que tu serializer devuelva el nombre o usa render
        { title: 'Doc', render: (_, r) => <Tag color={r.tipo_documento === 'I' ? 'blue' : 'orange'}>{r.nro_documento}</Tag> },
        { title: 'Placa', dataIndex: 'placa_vehiculo' },
        { title: 'Producto', dataIndex: 'producto_nombre', ellipsis: true },
        { title: 'Costo', dataIndex: 'costo_total_operacion', render: (val) => `S/. ${val}` },
        {
            title: 'Acciones',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => onEdit(record)} size="small" />
                    <Popconfirm title="¿Eliminar?" onConfirm={() => handleDelete(record.id)}>
                        <Button icon={<DeleteOutlined />} danger size="small" />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Card title="Historial de Operaciones" extra={<Button type="primary" icon={<PlusOutlined/>} onClick={onCreate}>Nuevo Registro</Button>}>
            <Table 
                rowKey="id"
                dataSource={data} 
                columns={columns} 
                loading={loading} 
                size="small"
            />
        </Card>
    );
};

export default TablaEstibaje;