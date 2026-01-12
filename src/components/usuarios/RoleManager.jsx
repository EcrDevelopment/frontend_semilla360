import React, { useState, useEffect, useMemo } from 'react';
import { 
    Table, Button, Modal, Form, Input, message, Card, Space, Tag, Tree, Divider, Row, Col, Alert 
} from 'antd';
import { 
    EditOutlined, DeleteOutlined, SafetyCertificateOutlined, 
    PlusOutlined, AppstoreOutlined, KeyOutlined 
} from '@ant-design/icons';
import { userManagementApi } from '../../api/userManagementApi';
import { permissionsApi } from '../../api/permissionsApi';

const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Datos del Árbol de Permisos
  const [permissionTreeData, setPermissionTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);

  const [form] = Form.useForm();

  useEffect(() => {
    loadRoles();
    loadPermissionsTree();
  }, []);

  // 1. CARGAR ROLES
  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await userManagementApi.roles.list();
      setRoles(res.data.results || res.data);
    } catch (error) { message.error("Error cargando roles"); } 
    finally { setLoading(false); }
  };

  // 2. CONSTRUIR ÁRBOL DE PERMISOS (Lógica Clave)
  const loadPermissionsTree = async () => {
    try {
      const res = await permissionsApi.permissions.list({ all: 'true' });
      const allPerms = res.data.results || res.data;

      // Paso A: Separar Padres (Modulares) de Hijos (Granulares)
      // Usaremos un Map para agrupar por categorías si no tienen padre definido
      const categoryMap = {};

      allPerms.forEach(perm => {
        // Validamos que tenga ID de Django
        if (!perm.django_permission_id) return;

        const catName = perm.category_name || 'Otros';
        if (!categoryMap[catName]) {
            categoryMap[catName] = {
                title: <span className="font-bold text-blue-600">{catName}</span>,
                key: `cat_${catName}`, // Clave virtual para la categoría
                checkable: false, // No se puede marcar la categoría entera, solo permisos
                children: []
            };
        }
      });

      // Paso B: Llenar el árbol
      // Primero insertamos los PADRES (Modular)
      const modularPerms = allPerms.filter(p => p.permission_type === 'modular');
      const granularPerms = allPerms.filter(p => p.permission_type !== 'modular');

      // Mapa auxiliar para encontrar nodos rápido
      const nodeMap = {};

      // 1. Insertar Modulares (Padres) en sus categorías
      modularPerms.forEach(p => {
          const node = {
              title: <span>{p.name} <Tag color="purple">Módulo</Tag></span>,
              key: p.django_permission_id, // Usamos el ID de Django como Key
              children: [] // Aquí irán los hijos
          };
          nodeMap[p.id] = node; // Guardamos referencia por ID interno
          
          const catName = p.category_name || 'Otros';
          if (categoryMap[catName]) {
              categoryMap[catName].children.push(node);
          }
      });

      // 2. Insertar Granulares (Hijos)
      granularPerms.forEach(p => {
          const node = {
              title: <span>{p.name} <span className="text-gray-400 text-xs">({p.codename})</span></span>,
              key: p.django_permission_id,
              isLeaf: true
          };

          // Si tiene padre y el padre existe en nuestro mapa, lo metemos ahí
          if (p.parent_permission && nodeMap[p.parent_permission]) {
              nodeMap[p.parent_permission].children.push(node);
          } else {
              // Si no tiene padre (o es huérfano), va directo a la categoría
              const catName = p.category_name || 'Otros';
              if (categoryMap[catName]) {
                  categoryMap[catName].children.push(node);
              }
          }
      });

      // Convertir el objeto map a array para el Tree de AntD
      const treeData = Object.values(categoryMap);
      setPermissionTreeData(treeData);

      // Expandir todas las categorías por defecto
      setExpandedKeys(treeData.map(c => c.key));

    } catch (error) { console.error("Error construyendo árbol", error); }
  };

  // 3. GUARDAR ROL
  const handleSaveRole = async (values) => {
    try {
      if (currentRole) {
        await userManagementApi.roles.update(currentRole.id, values);
        message.success("Rol actualizado");
      } else {
        await userManagementApi.roles.create(values);
        message.success("Rol creado");
      }
      setIsModalOpen(false);
      loadRoles();
    } catch (error) { message.error("Error guardando rol"); }
  };

  // 4. ABRIR ASIGNACIÓN (Cargar checkeds)
  const openPermissionModal = (role) => {
    setCurrentRole(role);
    // role.permissions trae array de IDs de Django [1, 2, 3]
    // El Tree espera strings o numbers como keys
    setCheckedKeys(role.permissions || []);
    setIsPermModalOpen(true);
  };

  // 5. MANEJAR CHECK EN EL ÁRBOL
  const onCheck = (checkedKeysValue) => {
    // checkedKeysValue puede traer claves de categorías ('cat_Importaciones') que son virtuales.
    // Debemos filtrarlas antes de enviar al backend.
    setCheckedKeys(checkedKeysValue);
  };

  // 6. GUARDAR PERMISOS
  const handleSavePermissions = async () => {
    try {
      // Filtramos las claves que sean strings (categorías virtuales) 
      // y nos quedamos solo con los números (IDs reales de Django)
      const realPermissionIds = checkedKeys.filter(k => typeof k === 'number');

      await userManagementApi.roles.update(currentRole.id, {
        permissions: realPermissionIds
      });
      
      message.success(`Permisos asignados correctamente a ${currentRole.name}`);
      setIsPermModalOpen(false);
      loadRoles();
    } catch (error) { 
        console.error(error);
        message.error("Error asignando permisos"); 
    }
  };

  const columns = [
    { title: 'Rol (Grupo)', dataIndex: 'name', key: 'name', render: t => <b className="text-lg">{t}</b> },
    { 
      title: 'Permisos Asignados', 
      key: 'count', 
      render: (_, r) => (
          <Tag color={r.permissions?.length > 0 ? "geekblue" : "default"}>
              {r.permissions?.length || 0} permisos
          </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" ghost icon={<SafetyCertificateOutlined />} onClick={() => openPermissionModal(record)}>
            Gestionar Permisos
          </Button>
          <Button icon={<EditOutlined />} onClick={() => { setCurrentRole(record); form.setFieldsValue(record); setIsModalOpen(true); }} />
          <Button danger icon={<DeleteOutlined />} onClick={() => {
              Modal.confirm({
                  title: '¿Eliminar Rol?',
                  content: 'Esta acción quitará el acceso a todos los usuarios con este rol.',
                  okType: 'danger',
                  onOk: () => userManagementApi.roles.delete(record.id).then(loadRoles)
              });
          }} />
        </Space>
      )
    }
  ];

  return (
    <Card title="Gestión de Roles y Perfiles" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentRole(null); form.resetFields(); setIsModalOpen(true); }}>Nuevo Rol</Button>}>
      <Table dataSource={roles} columns={columns} rowKey="id" loading={loading} />

      {/* MODAL CREAR/EDITAR NOMBRE ROL */}
      <Modal title={currentRole ? "Editar Nombre del Rol" : "Nuevo Rol"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={form.submit}>
        <Form form={form} layout="vertical" onFinish={handleSaveRole}>
          <Form.Item name="name" label="Nombre del Rol" rules={[{ required: true }]}><Input placeholder="Ej: Supervisor de Almacén" /></Form.Item>
        </Form>
      </Modal>

      {/* MODAL GESTIÓN PERMISOS (TREE) */}
      <Modal 
        title={
            <span>
                Permisos para: <span className="text-blue-600 font-bold">{currentRole?.name}</span>
            </span>
        } 
        open={isPermModalOpen} 
        onOk={handleSavePermissions} 
        onCancel={() => setIsPermModalOpen(false)} 
        width={800}
        okText="Guardar Cambios"
      >
        <Alert 
            message="Seleccione los permisos para este rol" 
            description="Marcar un módulo seleccionará automáticamente sus permisos dependientes si están configurados."
            type="info" 
            showIcon 
            className="mb-4"
        />
        
        <div style={{ height: '500px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '16px', borderRadius: '8px' }}>
            {permissionTreeData.length > 0 ? (
                <Tree
                    checkable
                    onExpand={setExpandedKeys}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    onCheck={onCheck}
                    checkedKeys={checkedKeys}
                    treeData={permissionTreeData}
                    blockNode
                />
            ) : (
                <div className="text-center p-10 text-gray-400">Cargando estructura de permisos...</div>
            )}
        </div>
        
        <div className="mt-2 text-right text-gray-500 text-xs">
            {checkedKeys.filter(k => typeof k === 'number').length} permisos seleccionados
        </div>
      </Modal>
    </Card>
  );
};

export default RoleManager;