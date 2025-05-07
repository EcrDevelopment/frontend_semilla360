import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Collapse, TreeSelect } from 'antd';
import { fetchRoles, createRole, updateRole, deleteRole, fetchPermissions } from '../../api/Usuarios';

const { Panel } = Collapse;

export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [groupedPerms, setGroupedPerms] = useState({});
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [current, setCurrent] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadData();
        fetchPermissions().then(res => {
            setPermissions(res.data);
            setGroupedPerms(groupPermissions(res.data));
        });
    }, []);

    const groupPermissions = (permissions) => {
        const groups = {};
    
        permissions.forEach(p => {
            const codenameParts = p.codename.split('.');
            const groupName = codenameParts.length > 1 ? codenameParts[0] : (p.content_type?.app_label || 'otros');
    
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(p);
        });
    
        return groups;
    };

    const loadData = async () => {
        setLoading(true);
        const res = await fetchRoles();
        setRoles(res.data);
        setLoading(false);
    };

    const openModal = (record) => {
        setCurrent(record || null);
        form.resetFields();
        if (record) {
            form.setFieldsValue({
                name: record.name,
                permissions: record.permissions || [],
            });
        }
        setModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            if (!current && values.name.toLowerCase().includes("importacion")) {
                const autoPerms = permissions.filter(p =>
                    p.codename.includes("importacion") || p.codename.includes("importar")
                );
                values.permissions = autoPerms.map(p => p.id);
            }

            if (current) {
                await updateRole(current.id, values);
                message.success("Rol actualizado");
            } else {
                await createRole(values);
                message.success("Rol creado");
            }

            setModalVisible(false);
            loadData();
        } catch (err) {
            console.error(err);
            message.error("Error al guardar rol");
        }
    };

    const handleDelete = async (id) => {
        await deleteRole(id);
        message.success("Rol eliminado");
        loadData();
    };

    const columns = [
        { title: 'ID', dataIndex: 'id' },
        { title: 'Nombre', dataIndex: 'name' },
        {
            title: 'Permisos',
            dataIndex: 'permissions',
            render: ps => Array.isArray(ps)
                ? ps.map(p => {
                    const found = permissions.find(perm => perm.id === p);
                    return found ? found.codename : p;
                }).join(', ')
                : ''
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button onClick={() => openModal(record)}>Editar</Button>
                    <Button danger onClick={() => handleDelete(record.id)}>Borrar</Button>
                </Space>
            )
        }
    ];

    // Convertir los permisos agrupados en formato adecuado para TreeSelect
    const permissionTreeData = Object.entries(groupedPerms).map(([module, perms]) => ({
        title: module.toUpperCase(),
        value: `group-${module}`,
        key: `group-${module}`,
        selectable: false,
        children: perms.map(p => ({
            title: p.codename,
            value: p.id,
            key: p.id,
        }))
    }));

    return (
        <>
            <Button type="primary" onClick={() => openModal(null)} style={{ marginBottom: 16 }}>
                Nuevo Rol
            </Button>
            <Table
                rowKey="id"
                dataSource={roles}
                columns={columns}
                loading={loading}
            />
            <Modal
                open={modalVisible}
                title={current ? "Editar Rol" : "Nuevo Rol"}
                onCancel={() => setModalVisible(false)}
                onOk={handleOk}
                width={700}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Nombre del rol"
                        rules={[{ required: true, message: "Nombre requerido" }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item name="permissions" label="Permisos por módulo">
                        <TreeSelect
                            treeData={permissionTreeData}
                            value={form.getFieldValue('permissions')}
                            onChange={val => form.setFieldsValue({ permissions: val })}
                            treeCheckable={true}
                            showCheckedStrategy={TreeSelect.SHOW_CHILD}
                            placeholder="Selecciona permisos"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
