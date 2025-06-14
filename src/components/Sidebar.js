import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Layout, Avatar } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { MdLock,MdOutlineTableView } from "react-icons/md";
import { AiOutlineTruck } from "react-icons/ai";
import { GoContainer } from "react-icons/go";
import { useAuth } from '../context/AuthContext';

const { Sider } = Layout;

// Configuración modular del menú
const menuConfig = [
  {
    key: '1',
    icon: <HomeOutlined />, 
    label: 'Inicio',
    to: '/',
    permission: null,
  },
  {
    key: 'sub1',
    icon: <GoContainer />,
    label: 'Importaciones',
    permission: 'importaciones',
    children: [
      { key: '3', label: 'Listado Fletes', to: '/importaciones/ver_fletes_internacionales', permission: 'importaciones.ver_fletes_internacionales' },
      { key: '4', label: 'Fletes Extranjeros', to: '/importaciones/registrar_flete_internacional', permission:'importaciones.registrar_flete_internacional' },
      { key: '5', label: 'Reporte Estiba', to: '/importaciones/reporte-estiba', permission: 'importaciones.ver_reporte_estibas' },
      { key: '6', label: 'Documentos DUA', to: '/importaciones/gestion_documentos', permission: 'importaciones.administrar_documentos_dua' }, 
      { key: '7', label: 'Archivos DUA', to: '/importaciones/listado-archivos-dua', permission: 'importaciones.administrar_expedientes_dua' }, 
    ],
  },
  {
    key: 'sub2',
    icon: <AiOutlineTruck />,
    label: 'Proveedores',
    permission: null,
    children: [
      { key: '8', label: 'Cargar Documentos DUA', to: '/proveedores/carga_docs_dua', permission: 'proveedor.cargar_documentos' },
      { key: '9', label: 'Gestión de docs.', to: '/proveedores/gestion_de_documentos', permission: 'proveedor.administrar_documentos' },  
    ],
  },
  
  {
    key: 'sub3',
    icon: <MdOutlineTableView />,
    label: 'Tablas',
    permission: 'mantenimiento.tabla_tipo_documentos',
    children: [
      { key: '10', label: 'Tabla Tipo Doc.', to: '/tipos_documentos', permission: 'mantenimiento.tabla_tipo_documentos'},  
    ],
  },
  
  {
    key: 'sub4',
    icon: <MdLock />,
    label: 'Usuarios',
    permission: null,
    children: [
      { key: '11', label: 'Usuarios', to: '/usuarios', permission: 'user.listar_usuarios' },   
      { key: '12', label: 'Roles', to: '/roles', permission: 'user.listar_usuarios' },
      { key: '13', label: 'Permisos', to: '/permisos', permission: 'user.listar_usuarios' },   
    ],
  },
];

// Construir items según permisos
const buildMenuItems = (permissions) => {
  return menuConfig.reduce((acc, item) => {
    if (item.children) {
      const children = item.children
        .filter(child => !child.permission || permissions[child.permission])
        .map(child => ({
          key: child.key,
          label: <Link to={child.to}>{child.label}</Link>
        }));
      if (children.length) {
        acc.push({ key: item.key, icon: item.icon, label: item.label, children });
      }
    } else if (!item.permission || permissions[item.permission]) {
      acc.push({ key: item.key, icon: item.icon, label: <Link to={item.to}>{item.label}</Link> });
    }
    return acc;
  }, []);
};

// Obtener nivel de keys para control de openKeys
const getLevelKeys = (items, level = 1, map = {}) => {
  items.forEach(item => {
    map[item.key] = level;
    if (item.children) getLevelKeys(item.children, level + 1, map);
  });
  return map;
};

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { permissions } = useAuth();
  const location = useLocation();

  const items = buildMenuItems(permissions);
  const levelKeys = getLevelKeys(items);

  // Estado de submenus abiertos
  const [openKeys, setOpenKeys] = useState([]);
  const onOpenChange = keys => {
    const latest = keys.find(key => !openKeys.includes(key));
    if (latest) {
      // abrir, cerrando otros del mismo nivel
      const sameLevel = keys.filter(key => levelKeys[key] === levelKeys[latest]);
      const newKeys = keys.filter(key => !sameLevel.includes(key) || key === latest);
      setOpenKeys(newKeys);
    } else {
      setOpenKeys(keys);
    }
  };

  // Determinar selectedKey por ruta
  const findSelectedKey = () => {
    for (const item of items) {
      if (item.children) {
        for (const child of item.children) {
          if (child.label.props.to === location.pathname) {
            return child.key;
          }
        }
      } else if (item.label.props.to === location.pathname) {
        return item.key;
      }
    }
    return null;
  };
  const selectedKey = findSelectedKey();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      style={{ overflow: 'auto', height: '100vh', position: 'fixed', insetInlineStart: 0, top: 0, bottom: 0 }}
    >
      <div className="flex items-center px-2 py-6 m-auto w-full space-x-4">
        <Avatar src="/Logo_Semilla.png" size={60} shape="square" />
        <div className={`flex items-center ${collapsed ? 'hidden' : 'block'}`}>
          <span className="text-5xl text-white font-extrabold text-[#F6AF33]">360°</span>
        </div>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        items={items}
        selectedKeys={selectedKey ? [selectedKey] : []}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
      />
    </Sider>
  );
};

export default Sidebar;
