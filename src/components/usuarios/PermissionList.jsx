import React, { useState, useEffect } from 'react';
import { 
    Table, Button, Tag, Space, message, Card, Tooltip, Tabs, 
    Modal, Form, Input, Select, Popconfirm
} from 'antd';
import { 
    PlusOutlined, EditOutlined, DeleteOutlined, 
    FormOutlined, ScissorOutlined, 
    ToolOutlined, LockOutlined,
    ApartmentOutlined, AppstoreOutlined, KeyOutlined, EyeOutlined
} from '@ant-design/icons';
import { permissionsApi } from '../../api/permissionsApi';

const { Option } = Select;

const PermissionManager = () => {
  const [flatPermissions, setFlatPermissions] = useState([]); 
  const [treePermissions, setTreePermissions] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modales
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [currentPerm, setCurrentPerm] = useState(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [currentCat, setCurrentCat] = useState(null);

  const [formPerm] = Form.useForm();
  const [formCat] = Form.useForm();

  const actionConfig = {
    view: { icon: <EyeOutlined />, color: 'default', label: 'Ver' },
    create: { icon: <PlusOutlined />, color: 'success', label: 'Crear' },
    edit: { icon: <FormOutlined />, color: 'warning', label: 'Editar' },
    delete: { icon: <ScissorOutlined />, color: 'error', label: 'Eliminar' },
    manage: { icon: <ToolOutlined />, color: 'geekblue', label: 'Gestionar' },
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [permRes, catRes] = await Promise.all([
        permissionsApi.permissions.list({ all: 'true' }),
        permissionsApi.categories.list()
      ]);
      
      const rawPerms = permRes.data.results || permRes.data;
      setFlatPermissions(rawPerms);
      setCategories(catRes.data.results || catRes.data);
      
      setTreePermissions(buildPermissionTree(rawPerms));

    } catch (error) {
      console.error(error);
      message.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const buildPermissionTree = (permissions) => {
    const permMap = {};
    const tree = [];

    permissions.forEach(p => {
        permMap[p.id] = { ...p, key: p.id, children: [] };
    });

    permissions.forEach(p => {
        if (p.parent_permission) {
            if (permMap[p.parent_permission]) {
                permMap[p.parent_permission].children.push(permMap[p.id]);
            } else {
                tree.push(permMap[p.id]);
            }
        } else {
            tree.push(permMap[p.id]);
        }
    });

    const cleanChildren = (nodes) => {
        nodes.forEach(node => {
            if (node.children.length === 0) {
                delete node.children;
            } else {
                cleanChildren(node.children);
            }
        });
    };
    cleanChildren(tree);

    return tree;
  };

  // --- ACTIONS ---
  const handleSavePermission = async (values) => {
    try {
      if (currentPerm) {
        await permissionsApi.permissions.update(currentPerm.id, values);
        message.success('Permiso actualizado');
      } else {
        if (!values.codename.startsWith('can_')) {
            message.error("El código debe empezar con 'can_'");
            return;
        }
        await permissionsApi.permissions.create(values);
        message.success('Permiso creado');
      }
      setIsPermModalOpen(false);
      loadData();
    } catch (error) { message.error('Error al guardar'); }
  };

  const handleDeletePermission = async (id) => {
    try {
      await permissionsApi.permissions.delete(id);
      message.success('Eliminado');
      loadData();
    } catch (error) { message.error('Error al eliminar (¿Es de sistema?)'); }
  };

  // --- TABLA PERMISOS ---
  const columnsPerms = [
    { 
        title: 'Jerarquía / Nombre', 
        dataIndex: 'name', 
        key: 'name',
        render: (text, r) => (
            <div className="flex flex-col">
                <span className="font-semibold text-gray-700">
                    {r.is_system && <LockOutlined className="text-yellow-500 mr-1"/>}
                    {text}
                </span>
                <span className="text-xs text-gray-400 font-mono">{r.codename}</span>
            </div>
        )
    },
    {
      title: 'Categoría',
      dataIndex: 'category_name',
      key: 'cat',
      render: (text) => <Tag color="cyan">{text || 'Global'}</Tag>,
    },
    {
        title: 'Tipo',
        dataIndex: 'permission_type',
        key: 'type',
        width: 100,
        render: (type) => (
            <Tag color={type === 'modular' ? 'purple' : 'blue'}>
                {type === 'modular' ? 'Módulo' : 'Acción'}
            </Tag>
        )
    },
    {
        title: 'Acción',
        dataIndex: 'action_type',
        key: 'action',
        width: 100,
        render: (action) => {
            const conf = actionConfig[action] || { icon: null, color: 'default', label: action };
            return <Tag icon={conf.icon} color={conf.color}>{conf.label}</Tag>;
        }
    },
    {
      title: 'Opciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar"><Button size="small" icon={<EditOutlined />} onClick={() => { setCurrentPerm(record); formPerm.setFieldsValue(record); setIsPermModalOpen(true); }} /></Tooltip>
          <Popconfirm title="¿Eliminar?" onConfirm={() => handleDeletePermission(record.id)} disabled={record.is_system}>
             <Button size="small" icon={<DeleteOutlined />} danger disabled={record.is_system} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // =========================================================================
  // GESTIÓN DE CATEGORÍAS
  // =========================================================================
  const openCatModal = (record = null) => {
    setCurrentCat(record);
    if (record) formCat.setFieldsValue(record);
    else formCat.resetFields();
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (values) => {
    try {
      if (currentCat) {
        await permissionsApi.categories.update(currentCat.id, values);
        message.success('Categoría actualizada');
      } else {
        await permissionsApi.categories.create(values);
        message.success('Categoría creada');
      }
      setIsCatModalOpen(false);
      loadData();
    } catch (error) { message.error('Error al guardar categoría'); }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await permissionsApi.categories.delete(id);
      message.success('Categoría eliminada');
      loadData();
    } catch (error) { message.error('No se puede eliminar la categoría'); }
  };

  const columnsCats = [
    { title: 'Slug', dataIndex: 'name', key: 'slug' },
    { title: 'Nombre Visible', dataIndex: 'display_name', key: 'disp', render: t => <b>{t}</b> },
    { title: 'Descripción', dataIndex: 'description', key: 'desc' },
    { title: 'Orden', dataIndex: 'order', key: 'order', width: 80 },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openCatModal(record)} />
            <Popconfirm title="¿Eliminar?" onConfirm={() => handleDeleteCategory(record.id)}>
                <Button size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
        </Space>
      )
    }
  ];

  // --- TABS ---
  const tabItems = [
    {
      key: '1',
      label: <span><ApartmentOutlined /> Jerarquía de Permisos</span>,
      children: (
        <>
          <div className="text-right mb-4">
             <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentPerm(null); formPerm.resetFields(); setIsPermModalOpen(true); }}>Nuevo Permiso</Button>
          </div>
          
          {/* TABLA DE PERMISOS (ÁRBOL) */}
          <Table 
            columns={columnsPerms} 
            dataSource={treePermissions} 
            rowKey="id" 
            loading={loading} 
            // CAMBIO AQUÍ: Eliminado pagination={false} y agregado config
            pagination={{ 
                pageSize: 10, 
                showSizeChanger: true, 
                pageSizeOptions: ['10', '20', '50']
            }} 
            expandable={{ defaultExpandAllRows: true }}
            size="middle"
          />
        </>
      ),
    },
    {
      key: '2',
      label: <span><AppstoreOutlined /> Categorías ({categories.length})</span>,
      children: (
        <>
          <div className="flex justify-end mb-4">
             <Button type="primary" icon={<PlusOutlined />} onClick={() => openCatModal(null)}>
                Nueva Categoría
             </Button>
          </div>
          
          {/* TABLA DE CATEGORÍAS */}
          <Table 
            columns={columnsCats} 
            dataSource={categories} 
            rowKey="id" 
            loading={loading}
            // Agregada paginación también aquí
            pagination={{ pageSize: 5 }} 
          />
        </>
      ),
    }
  ];

  return (
    <Card title="Gestión Jerárquica de Permisos" className="shadow-md">
      <Tabs defaultActiveKey="1" items={tabItems} />

      {/* MODAL PERMISO */}
      <Modal 
        title={currentPerm ? "Editar Permiso" : "Nuevo Permiso"} 
        open={isPermModalOpen} 
        onCancel={() => setIsPermModalOpen(false)} 
        onOk={formPerm.submit}
        width={700}
      >
        <Form form={formPerm} layout="vertical" onFinish={handleSavePermission} initialValues={{ permission_type: 'granular', action_type: 'view' }}>
           
           <div className="grid grid-cols-2 gap-4">
               <Form.Item name="category" label="Categoría" rules={[{ required: true }]}>
                 <Select placeholder="Seleccionar módulo...">
                    {categories.map(c => <Option key={c.id} value={c.id}>{c.display_name}</Option>)}
                 </Select>
               </Form.Item>

               <Form.Item name="parent_permission" label="Permiso Padre (Jerarquía)" help="Ej: 'Crear usuario' es hijo de 'Gestionar Usuarios'">
                 <Select allowClear placeholder="Seleccionar padre (opcional)...">
                    {flatPermissions
                        .filter(p => p.permission_type === 'modular' && p.id !== currentPerm?.id)
                        .map(p => (
                            <Option key={p.id} value={p.id}>{p.name} ({p.codename})</Option>
                        ))
                    }
                 </Select>
               </Form.Item>
           </div>

           <div className="grid grid-cols-2 gap-4">
               <Form.Item name="permission_type" label="Tipo de Permiso">
                 <Select>
                    <Option value="granular">Granular (Hijo/Acción)</Option>
                    <Option value="modular">Modular (Padre/Contenedor)</Option>
                 </Select>
               </Form.Item>
               <Form.Item name="action_type" label="Tipo de Acción">
                 <Select>
                    <Option value="view">Ver</Option>
                    <Option value="create">Crear</Option>
                    <Option value="edit">Editar</Option>
                    <Option value="delete">Eliminar</Option>
                    <Option value="manage">Gestionar</Option>
                 </Select>
               </Form.Item>
           </div>

           <Form.Item name="codename" label="Código (Codename)" rules={[{ required: true }, { pattern: /^can_/, message: "Debe empezar con 'can_'" }]}>
             <Input prefix={<KeyOutlined className="text-gray-400"/>} disabled={!!currentPerm} />
           </Form.Item>
           <Form.Item name="name" label="Nombre Descriptivo" rules={[{ required: true }]}><Input /></Form.Item>
           <Form.Item name="description" label="Descripción"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* MODAL CATEGORÍA */}
       <Modal 
        title={currentCat ? "Editar Categoría" : "Nueva Categoría"} 
        open={isCatModalOpen} 
        onCancel={() => setIsCatModalOpen(false)} 
        onOk={formCat.submit}
      >
        <Form form={formCat} layout="vertical" onFinish={handleSaveCategory}>
           <Form.Item name="name" label="Slug (ID texto)" rules={[{ required: true }]} help="Identificador único, ej: importaciones"><Input /></Form.Item>
           <Form.Item name="display_name" label="Nombre Visible" rules={[{ required: true }]}><Input /></Form.Item>
           <Form.Item name="description" label="Descripción"><Input.TextArea /></Form.Item>
           <Form.Item name="order" label="Orden Visual"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PermissionManager;