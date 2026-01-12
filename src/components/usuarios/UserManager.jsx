import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Select, Switch, message, Card, Space, Tag, Avatar, Tree, Alert, Tooltip, Form, Input, Divider
} from 'antd';
import {
  UserSwitchOutlined, SafetyCertificateOutlined, UserOutlined,
  EditOutlined, LockOutlined, PlusOutlined, PhoneOutlined, BankOutlined,
  ShopOutlined, EnvironmentOutlined
} from '@ant-design/icons';

// APIs
import { userManagementApi } from '../../api/userManagementApi';
import { permissionsApi } from '../../api/permissionsApi';
import { fetchEmpresas } from '../../api/Usuarios';
import { getAlmacenes } from '../../api/Almacen'; // <--- Asegúrate de tener este import o ajusta la ruta

const { Option } = Select;

const UserManager = () => {
  // --- ESTADOS DE DATOS ---
  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  // 🆕 ESTADOS PARA RLS (Almacenes y Sedes)
  const [almacenesList, setAlmacenesList] = useState([]);
  const [sedesList, setSedesList] = useState([]);

  const [loading, setLoading] = useState(false);

  // Estado de Paginación
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- ESTADOS ÁRBOL PERMISOS ---
  const [permissionTreeData, setPermissionTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  // --- MODALES ---
  const [currentUser, setCurrentUser] = useState(null);

  // Modal 1: Crear/Editar Usuario
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [formUser] = Form.useForm();

  // Modal 2: Roles
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  // Modal 3: Permisos Granulares
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);

  useEffect(() => {
    loadUsers(pagination.current, pagination.pageSize);
    loadCatalogs(); // Carga Roles, Empresas y Almacenes
    loadPermissionsTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. CARGAR USUARIOS PAGINADOS
  const loadUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await userManagementApi.users.list({
        page: page,
        page_size: pageSize
      });

      const results = res.data.results || (Array.isArray(res.data) ? res.data : []);
      const count = res.data.count || results.length;

      setUsers(results);

      setPagination({
        current: page,
        pageSize: pageSize,
        total: count,
      });

    } catch (error) {
      message.error("Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    loadUsers(newPagination.current, newPagination.pageSize);
  };

  // 2. CARGAR CATÁLOGOS (ROLES, EMPRESAS, ALMACENES)
  const loadCatalogs = async () => {
    try {
      // Ejecutamos promesas en paralelo
      const [resRoles, resEmpresas, resAlmacenes, resSedes] = await Promise.all([
        userManagementApi.roles.list(),
        fetchEmpresas ? fetchEmpresas({ all: true }) : Promise.resolve({ data: [] }),
        // Intentamos cargar almacenes. Si falla o no existe API, devolvemos array vacío.
        getAlmacenes ? getAlmacenes({ all: true }) : Promise.resolve({ data: [] }),

        userManagementApi.sedes.list ? userManagementApi.sedes.list({ all: true }) : Promise.resolve({ data: [] }),
      ]);

      setRolesList(resRoles.data.results || resRoles.data);

      const empresasData = resEmpresas.data.results || resEmpresas.data || [];
      setEmpresas(empresasData);

      const almacenesData = resAlmacenes.data.results || resAlmacenes.data || [];
      setAlmacenesList(almacenesData);

      // Si tuvieras API de sedes, iría aquí. Por ahora vacío.
      setSedesList(resSedes.data.results || resSedes.data || []);

    } catch (error) { console.error("Error cargando catálogos", error); }
  };

  // 3. CONSTRUIR ÁRBOL DE PERMISOS
  const loadPermissionsTree = async () => {
    try {
      const res = await permissionsApi.permissions.list({ all: 'true', pagination: 'off', });
      const allPerms = res.data.results || res.data;

      const categoryMap = {};
      allPerms.forEach(perm => {
        if (!perm.django_permission_id) return;
        const catName = perm.category_name || 'Otros';
        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            title: <span className="font-bold text-blue-600">{catName}</span>,
            key: `cat_${catName}`,
            checkable: false,
            children: []
          };
        }
      });

      const modularPerms = allPerms.filter(p => p.permission_type === 'modular');
      const granularPerms = allPerms.filter(p => p.permission_type !== 'modular');
      const nodeMap = {};

      modularPerms.forEach(p => {
        const node = {
          title: <span>{p.name} <Tag color="purple" style={{ fontSize: 10, marginLeft: 5 }}>Módulo</Tag></span>,
          key: p.django_permission_id,
          children: []
        };
        nodeMap[p.id] = node;
        const catName = p.category_name || 'Otros';
        if (categoryMap[catName]) categoryMap[catName].children.push(node);
      });

      granularPerms.forEach(p => {
        const node = {
          title: <span>{p.name} <span className="text-gray-400 text-xs">({p.codename})</span></span>,
          key: p.django_permission_id,
          isLeaf: true
        };
        if (p.parent_permission && nodeMap[p.parent_permission]) {
          nodeMap[p.parent_permission].children.push(node);
        } else {
          const catName = p.category_name || 'Otros';
          if (categoryMap[catName]) categoryMap[catName].children.push(node);
        }
      });

      const treeData = Object.values(categoryMap);
      setPermissionTreeData(treeData);
      setExpandedKeys(treeData.map(c => c.key));
    } catch (error) { console.error("Error construyendo árbol", error); }
  };

  // --- LÓGICA USUARIO (CREAR/EDITAR) ---
  const handleOpenUserModal = (user = null) => {
    setCurrentUser(user);
    if (user) {
      // Mapear datos para editar
      formUser.setFieldsValue({
        ...user,
        empresa_id: user.userprofile?.empresa_id || user.userprofile?.empresa,
        telefono: user.userprofile?.telefono,
        // 🆕 Campos RLS
        require_warehouse_access: user.userprofile?.require_warehouse_access || false,
        almacenes_asignados: user.userprofile?.almacenes_asignados || [],
        require_sede_access: user.userprofile?.require_sede_access || false,
        sedes_asignadas: user.userprofile?.sedes_asignadas || [],
      });
    } else {
      formUser.resetFields();
      // Valores por defecto
      formUser.setFieldsValue({
        require_warehouse_access: false,
        require_sede_access: false
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (values) => {
    try {
      const userPayload = {
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        ...(values.password && { password: values.password }), // Solo enviar pass si existe

        userprofile: {
          empresa: values.empresa_id || null, // Backend espera 'empresa' (FK)
          telefono: values.telefono || null,
          // 🆕 Campos RLS
          require_warehouse_access: values.require_warehouse_access,
          almacenes_asignados: values.almacenes_asignados || [],
          require_sede_access: values.require_sede_access,
          sedes_asignadas: values.sedes_asignadas || [],
        },
      };

      if (currentUser) {
        await userManagementApi.users.update(currentUser.id, userPayload);
        message.success("Usuario actualizado");
      } else {
        await userManagementApi.users.create(userPayload);
        message.success("Usuario creado");
      }
      setIsUserModalOpen(false);
      loadUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error("Error guardando usuario. Verifica los campos.");
    }
  };

  // --- LÓGICA ROLES ---
  const handleOpenRoleModal = (user) => {
    setCurrentUser(user);
    setSelectedRoleIds(user.roles || []);
    setIsRoleModalOpen(true);
  };

  const handleSaveRoles = async () => {
    try {
      await userManagementApi.users.update(currentUser.id, { roles: selectedRoleIds });
      message.success("Roles actualizados");
      setIsRoleModalOpen(false);
      loadUsers(pagination.current, pagination.pageSize);
    } catch (error) { message.error("Error guardando roles"); }
  };

  // --- LÓGICA PERMISOS ---
  const handleOpenPermModal = (user) => {
    setCurrentUser(user);
    setCheckedKeys(user.permissions || []);
    setIsPermModalOpen(true);
  };

  const onCheck = (checkedKeysValue) => {
    setCheckedKeys(checkedKeysValue);
  };

  const handleSavePermissions = async () => {
    try {
      const realIds = checkedKeys.filter(k => typeof k === 'number');
      await userManagementApi.users.update(currentUser.id, { permissions: realIds });
      message.success(`Permisos asignados a ${currentUser.username}`);
      setIsPermModalOpen(false);
      loadUsers(pagination.current, pagination.pageSize);
    } catch (error) { message.error("Error guardando permisos"); }
  };

  // --- UTILIDADES ---
  const toggleActive = async (user, checked) => {
    try {
      await userManagementApi.users.toggleActive(user.id, checked);
      message.success(checked ? "Activado" : "Desactivado");
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: checked } : u));
    } catch (e) { message.error("Error al cambiar estado"); }
  }

  const columns = [
    {
      title: 'Usuario',
      key: 'user',
      width: 250,
      render: (_, r) => (
        <Space>
          <Avatar style={{ backgroundColor: r.is_active ? '#87d068' : '#f56a00' }} icon={<UserOutlined />} />
          <div>
            <div className="font-bold flex items-center">
              {r.username}
              {r.is_superuser && <Tooltip title="Superusuario"><SafetyCertificateOutlined className="text-red-500 ml-2" /></Tooltip>}
            </div>
            <div className="text-xs text-gray-500">{r.email || 'Sin email'}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Empresa / Info',
      key: 'info',
      render: (_, r) => {
        // Lógica de visualización de empresa
        const empresaId = r.userprofile?.empresa_id || r.userprofile?.empresa;
        const empresaEncontrada = empresas.find(e => e.id === empresaId);
        const nombreEmpresa = empresaEncontrada
          ? (empresaEncontrada.razon_social || empresaEncontrada.nombre)
          : (empresaId ? `Empresa #${empresaId}` : null);

        return (
          <div className="text-xs">
            {nombreEmpresa ? <Tag icon={<BankOutlined />}>{nombreEmpresa}</Tag> : <span className="text-gray-300">Sin empresa</span>}
            {r.userprofile?.telefono && <div className="mt-1"><PhoneOutlined /> {r.userprofile.telefono}</div>}
          </div>
        );
      },
    },
    // 🆕 COLUMNA DE RESTRICCIONES
    {
      title: 'Acceso Físico',
      key: 'restrictions',
      render: (_, r) => {
        const whRestricted = r.userprofile?.require_warehouse_access;
        const countWh = r.userprofile?.almacenes_asignados?.length || 0;
        return (
          <div className="flex flex-col gap-1">
            {whRestricted ?
              <Tag color="orange" icon={<ShopOutlined />}>Limitado: {countWh}</Tag> :
              <Tag color="green" icon={<ShopOutlined />}>Total</Tag>
            }
          </div>
        )
      }
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_, r) => (
        <Space wrap>
          {r.roles?.map(roleId => {
            const roleObj = rolesList.find(rl => rl.id === roleId);
            return <Tag color="blue" key={roleId}>{roleObj ? roleObj.name : roleId}</Tag>;
          })}
          {(!r.roles || r.roles.length === 0) && <span className="text-gray-300 italic">N/A</span>}
        </Space>
      )
    },
    {
      title: 'Permisos',
      key: 'perms',
      width: 80,
      render: (_, r) => {
        const count = r.permissions?.length || 0;
        return count > 0 ? <Tag color="gold" icon={<LockOutlined />}>{count}</Tag> : <span className="text-gray-300">-</span>
      }
    },
    {
      title: 'Estado',
      key: 'status',
      width: 80,
      render: (_, r) => <Switch checked={r.is_active} onChange={(checked) => toggleActive(r, checked)} size="small" />
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'right',
      fixed: 'right',
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar Datos"><Button size="small" icon={<EditOutlined />} onClick={() => handleOpenUserModal(record)} /></Tooltip>
          <Tooltip title="Gestionar Roles"><Button size="small" icon={<UserSwitchOutlined />} onClick={() => handleOpenRoleModal(record)} /></Tooltip>
          <Tooltip title="Permisos Granulares"><Button size="small" icon={<SafetyCertificateOutlined />} onClick={() => handleOpenPermModal(record)} className={record.permissions?.length > 0 ? "text-yellow-600 border-yellow-600" : ""} /></Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="Directorio de Usuarios"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenUserModal(null)}>Nuevo Usuario</Button>}
    >
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}

        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          position: ["bottomLeft"],
        }}
        onChange={handleTableChange}
      />

      {/* MODAL 1: CREAR / EDITAR USUARIO */}
      <Modal
        title={currentUser ? "Editar Usuario" : "Nuevo Usuario"}
        open={isUserModalOpen}
        onCancel={() => setIsUserModalOpen(false)}
        onOk={formUser.submit}
        width={700}
      >
        <Form form={formUser} layout="vertical" onFinish={handleSaveUser}>
          {/* SECCIÓN 1: DATOS DE CUENTA */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="username" label="Usuario" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="first_name" label="Nombre"><Input /></Form.Item>
            <Form.Item name="last_name" label="Apellido"><Input /></Form.Item>
          </div>

          {!currentUser && (
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="password"
                label="Contraseña"
                hasFeedback
                tooltip="Requisitos: 8+ caracteres, 1 mayúscula, 1 minúscula y 1 número."
                rules={[
                  { required: true, message: 'La contraseña es obligatoria' },
                  { min: 8, message: 'Mínimo 8 caracteres' },
                  { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{8,}$/, message: 'Debe incluir mayúscula, minúscula y número' }
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="Confirmar"
                dependencies={['password']}
                hasFeedback
                rules={[
                  { required: true, message: 'Confirma la contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('Las contraseñas no coinciden'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="empresa_id" label="Empresa">
              <Select placeholder="Seleccionar empresa" allowClear>
                {empresas.map(e => (
                  <Option key={e.id} value={e.id}>{e.razon_social || e.nombre}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="telefono" label="Teléfono"><Input /></Form.Item>
          </div>

          {/* SECCIÓN 2: CONTROL DE ACCESO FÍSICO (NUEVO) */}
          <Divider orientation="left"><span className="text-gray-500 text-sm">Control de Acceso Físico</span></Divider>

          {/* ALMACENES */}
          <div className="bg-gray-50 p-3 rounded mb-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold flex items-center"><ShopOutlined className="mr-2" /> Acceso a Almacenes</span>
              <Form.Item name="require_warehouse_access" valuePropName="checked" noStyle>
                <Switch checkedChildren="Limitado" unCheckedChildren="Total" />
              </Form.Item>
            </div>

            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.require_warehouse_access !== curr.require_warehouse_access}>
              {({ getFieldValue }) =>
                getFieldValue('require_warehouse_access') ? (
                  <Form.Item
                    name="almacenes_asignados"
                    label="Almacenes Permitidos"
                    rules={[{ required: true, message: 'Seleccione al menos uno' }]}
                  >
                    <Select mode="multiple" placeholder="Seleccionar..." optionFilterProp="children">
                      {almacenesList.map(a => (
                        <Option key={a.id} value={a.id}>{a.almacen_nombre || a.descripcion}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                ) : <div className="text-gray-400 text-xs italic">El usuario puede ver todos los almacenes.</div>
              }
            </Form.Item>
          </div>

          {/* SEDES */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold flex items-center"><EnvironmentOutlined className="mr-2" /> Acceso a Sedes</span>
              <Form.Item name="require_sede_access" valuePropName="checked" noStyle>
                <Switch checkedChildren="Limitado" unCheckedChildren="Total" />
              </Form.Item>
            </div>

            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.require_sede_access !== curr.require_sede_access}>
              {({ getFieldValue }) =>
                getFieldValue('require_sede_access') ? (
                  <Form.Item name="sedes_asignadas" label="Sedes Permitidas">
                    <Select
                      mode="multiple"
                      placeholder="Seleccionar sedes..."
                      optionFilterProp="children"
                      // Esto permite buscar por el texto completo (ej: "Miraflores")
                      filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {sedesList.map(s => (
                        <Option key={s.id} value={s.id}>
                          {/* USA EL NUEVO CAMPO DEL SERIALIZER */}
                          {s.full_name || s.direccion}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                ) : <div className="text-gray-400 text-xs italic">El usuario tiene acceso a todas las sedes.</div>
              }
            </Form.Item>
          </div>

        </Form>
      </Modal>

      {/* MODAL 2: ROLES */}
      <Modal title={`Roles de: ${currentUser?.username}`} open={isRoleModalOpen} onOk={handleSaveRoles} onCancel={() => setIsRoleModalOpen(false)}>
        <Alert message="Los roles definen el acceso base." type="info" showIcon className="mb-4" />
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Seleccionar roles..."
          value={selectedRoleIds}
          onChange={setSelectedRoleIds}
          options={rolesList.map(r => ({ label: r.name, value: r.id }))}
        />
      </Modal>

      {/* MODAL 3: PERMISOS (TREE) */}
      <Modal
        title={<span>Permisos Extra: <span className="text-blue-600">{currentUser?.username}</span></span>}
        open={isPermModalOpen}
        onOk={handleSavePermissions}
        onCancel={() => setIsPermModalOpen(false)}
        width={750}
      >
        <Alert message="Úsalo solo para excepciones. Estos permisos se suman a los roles." type="warning" showIcon className="mb-4" />
        <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '10px', borderRadius: '6px' }}>
          {permissionTreeData.length > 0 ? (
            <Tree checkable onExpand={setExpandedKeys} expandedKeys={expandedKeys} autoExpandParent={autoExpandParent} onCheck={onCheck} checkedKeys={checkedKeys} treeData={permissionTreeData} height={380} />
          ) : <div className="p-4 text-center text-gray-400">Cargando catálogo...</div>}
        </div>
      </Modal>
    </Card>
  );
};

export default UserManager;