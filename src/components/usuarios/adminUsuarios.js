import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space } from 'antd';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../api/Usuarios';
import { fetchRoles, fetchPermissions } from '../../api/Usuarios';

const { Option } = Select;

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [current, setCurrent] = useState(null);

    const [form] = Form.useForm();

    useEffect(() => {
        loadData();
        fetchRoles().then(res => setRoles(res.data));
        fetchPermissions().then(res => setPermissions(res.data));
    }, []);

    const loadData = async () => {
        setLoading(true);
        const res = await fetchUsers();
        setUsers(res.data);        
        setLoading(false);
    };

    const openModal = (record) => {
        setCurrent(record || null);
        form.resetFields();
        if (record) {
            form.setFieldsValue({
                username: record.username,
                email: record.email,
                first_name: record.first_name,
                last_name: record.last_name,
                roles: Array.isArray(record.roles) ? record.roles.map(r => typeof r === 'object' ? r.id : r) : [],
                permissions: Array.isArray(record.permissions) ? record.permissions.map(p => typeof p === 'object' ? p.id : p) : [],
                password: '',
            });
        }
        setModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (current) {
                const payload = { ...values };
                if (!payload.password) delete payload.password;
                await updateUser(current.id, payload);
                message.success('Usuario actualizado');
            } else {
                await createUser(values);
                message.success('Usuario creado');
            }
            setModalVisible(false);
            loadData();
        } catch (err) {
            console.error(err);
            message.error('Error al guardar usuario');
        }
    };

    const handleDelete = async (id) => {
        await deleteUser(id);
        message.success('Usuario eliminado');
        loadData();
    };

    const columns = [
        { title: 'ID', dataIndex: 'id' },
        { title: 'Usuario', dataIndex: 'username' },
        { title: 'Email', dataIndex: 'email' },
        {
            title: 'Roles',
            dataIndex: 'roles',
            render: rs => Array.isArray(rs)
                ? rs.map(r => {
                    if (r && typeof r === 'object' && r.name) return r.name;
                    const found = roles.find(role => role.id === r);
                    return found ? found.name : r;
                }).join(', ')
                : ''
        },
        {
            title: 'Permisos',
            dataIndex: 'permissions',
            render: ps => Array.isArray(ps)
                ? ps.map(p => {
                    if (p && typeof p === 'object' && p.codename) return p.codename;
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
            ),
        },
    ];

    return (
        <>
            <Button type="primary" onClick={() => openModal(null)} style={{ marginBottom: 16 }}>
                Nuevo Usuario
            </Button>
            <Table
                rowKey="id"
                dataSource={users}
                columns={columns}
                loading={loading}
                
                pagination={{ position: ['bottomLeft'], pageSize: 10 }}
                scroll={{ x: 'max-content' }}
            />

            <Modal
                open={modalVisible}
                title={current ? 'Editar Usuario' : 'Nuevo Usuario'}
                onCancel={() => setModalVisible(false)}
                centered
                onOk={handleOk}
                width={700}
                bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
            >
                <Form form={form} requiredMark={false} layout="vertical">

                    <Form.Item
                        name="username" label="Usuario"
                        rules={[{ required: true, message: 'Por favor, ingresa el usuario' }]} >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Contraseña"
                        rules={[
                            { required: !current, message: 'La contraseña es obligatoria' },
                            { min: 6, message: 'Mínimo 6 caracteres' },
                        ]}
                        hasFeedback
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="email" label="Email"
                        rules={[{ required: true, message: 'Por favor, ingresa el email' }]} >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="first_name" label="Nombre"
                        rules={[{ required: true, message: 'Por favor, ingresa el nombre' }]} >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="last_name" label="Apellido"
                        rules={[{ required: true, message: 'Por favor, ingresa el apellido' }]} >
                        <Input />
                    </Form.Item>
                    <Form.Item name="roles" label="Roles">
                        <Select mode="multiple" placeholder="Selecciona roles">
                            {roles.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="permissions" label="Permisos">
                        <Select mode="multiple" placeholder="Selecciona permisos">
                            {permissions.map(p => <Option key={p.id} value={p.id}>{p.codename}</Option>)}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
