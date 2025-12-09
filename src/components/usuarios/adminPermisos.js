import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, TreeSelect } from 'antd';
import { fetchPermissions, createPermission, updatePermission, deletePermission, fetchContentTypes } from '../../api/Usuarios';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState([]);
    const [contentTypes, setContentTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [current, setCurrent] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadData();
        fetchContentTypes().then(res => {
            // Transformar a formato para TreeSelect
            const treeData = res.data.map(group => ({
                title: group.app_label.charAt(0).toUpperCase() + group.app_label.slice(1),
                value: group.app_label,
                selectable: false,
                children: group.models.map(model => ({
                    title: model.model.charAt(0).toUpperCase() + model.model.slice(1),
                    value: model.id,
                }))
            }));
            setContentTypes(treeData);
        });
    }, []);

    const loadData = async () => {
        setLoading(true);
        const res = await fetchPermissions();
        setPermissions(res.data);
        setLoading(false);
    };

    const openModal = (record) => {
        setCurrent(record || null);
        form.resetFields();
        if (record) {
            form.setFieldsValue({
                codename: record.codename,
                name: record.name,
                content_type: record.content_type?.id || '',
            });
        }
        setModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            if (current) {
                await updatePermission(current.id, values);
                message.success('Permiso actualizado');
            } else {
                await createPermission(values);
                message.success('Permiso creado');
            }

            setModalVisible(false);
            loadData();
        } catch (err) {
            console.error(err);
            message.error('Error al guardar permiso');
        }
    };

    const handleDelete = async (id) => {
        await deletePermission(id);
        message.success('Permiso eliminado');
        loadData();
    };

    const columns = [
        { title: 'ID', dataIndex: 'id' },
        { title: 'Codename', dataIndex: 'codename' },
        { title: 'Nombre', dataIndex: 'name' },
        {
            title: 'Módulo',
            dataIndex: 'content_type',
            render: content_type => content_type?.app_label || 'Otros',
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button onClick={() => openModal(record)}><EditOutlined /></Button>
                    <Button danger onClick={() => handleDelete(record.id)}><DeleteOutlined /></Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div className="w-full h-full p-4 bg-gray-100">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold m-2">Permisos</h2>
                    <Button type="primary" onClick={() => openModal(null)} style={{ marginBottom: 16 }}>
                        Nuevo Permiso
                    </Button>
                </div>
                <Table
                    rowKey="id"
                    dataSource={permissions}
                    columns={columns}
                    loading={loading}
                    pagination={{
                        position: ["bottomLeft"],
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50", "100"],
                    }}
                    size='small'
                    scroll={{ x: 'max-content' }}
                />
                <Modal
                    open={modalVisible}
                    title={current ? "Editar Permiso" : "Nuevo Permiso"}
                    onCancel={() => setModalVisible(false)}
                    onOk={handleOk}
                    width={700}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="codename"
                            label="Codename del permiso"
                            rules={[{ required: true, message: "Codename requerido" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="Nombre del permiso"
                            rules={[{ required: true, message: "Nombre requerido" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="content_type"
                            label="Módulo"
                            rules={[{ required: true, message: "Selecciona un módulo válido" }]}
                        >
                            <TreeSelect
                                treeData={contentTypes}
                                placeholder="Selecciona un módulo"
                                allowClear
                                treeDefaultExpandAll
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
}
