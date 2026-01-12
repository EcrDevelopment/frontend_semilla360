import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Layout, Image , Grid , Drawer,Button} from "antd";
import { HomeOutlined , MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { MdLock, MdOutlineTableView } from "react-icons/md";
import { BiStore } from "react-icons/bi";
import { AiOutlineTruck} from "react-icons/ai";
import { GoContainer } from "react-icons/go";
import { useAuth } from '../context/AuthContext';

const { Sider } = Layout;
const { useBreakpoint } = Grid;
const {Header} = Layout;

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
      //{ key: '4', label: 'Fletes Extranjeros', to: '/importaciones/registrar_flete_internacional', permission: 'importaciones.registrar_flete_internacional' },
      { key: '4', label: 'Reporte Estiba', to: '/importaciones/reporte-estiba', permission: 'importaciones.ver_reporte_estibas' },
      { key: '5', label: 'Documentos Prov.', to: '/importaciones/gestion_documentos', permission: 'importaciones.administrar_documentos_dua' },
      { key: '6', label: 'Archivos DUA', to: '/importaciones/listado-archivos-dua', permission: 'importaciones.administrar_expedientes_dua' },
      { key: '7', label: 'Ticket Senasa', to: '/consulta-ticket-senasa', permission: null },
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
      { key: '10', label: 'Tabla Tipo Doc.', to: '/tipos_documentos', permission: 'mantenimiento.tabla_tipo_documentos' },
      { key: '11', label: 'Tabla Empresas', to: '/miscelanea/empresas', permission: null },
      { key: '12', label: 'Tabla Productos', to: '/miscelanea/productos', permission: null },
      { key: '13', label: 'Tabla Almacenes', to: '/miscelanea/almacenes', permission: null },
      { key: '14', label: 'Tipo Estibaje', to: '/tipo_estiba', permission: null },
    ],
  },

   {
    key: 'sub4',
    icon: <BiStore />,
    label: 'Almacen',
    permission: null,
    children: [
      { key: '15', label: 'Ingresos/Salidas', to: '/almacen/movimientos', permission: null },
      { key: '16', label: 'Lector QR', to: '/almacen/lectorQr', permission: null },
      { key: '17', label: 'Stock', to: '/almacen/stock', permission: null },
      { key: '18', label: 'Transferencias', to: '/almacen/transferencias', permission: null },
      { key: '19', label: 'Consulta Guía', to: '/consulta-guia', permission: null },
    ]
  },

  {
    key: 'sub5',
    icon: <MdLock />,
    label: 'Usuarios',
    permission: null,
    children: [
      { key: '20', label: 'Usuarios', to: '/usuarios', permission: 'user.listar_usuarios' },
      { key: '21', label: 'Roles', to: '/roles', permission: 'user.listar_usuarios' },
      { key: '22', label: 'Permisos', to: '/permisos', permission: 'user.listar_usuarios' },
      
      
      
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
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md = breakpoint >= 768px

  const items = buildMenuItems(permissions);
  const levelKeys = getLevelKeys(items);
   const [drawerOpen, setDrawerOpen] = useState(false);


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

 if (isMobile) {
    return (
      <>
        <Header style={{ background: "#001529", padding: "0 16px", display: "flex", alignItems: "center" }}>
          {/* Logo */}
          <Image src="/Logo_Semilla_Icono.png" alt="Logo" preview={false} height={40} />

          {/* Botón Hamburguesa */}
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: "white", fontSize: 20 }} />}
            onClick={() => setDrawerOpen(true)}
            style={{ marginLeft: "auto" }}
          />
        </Header>

        <Drawer
          title={<Image src="/Logo_Semilla_Icono.png" alt="Logo Semilla" preview={false} height={40} />}
          placement="left"
          closeIcon={<CloseOutlined style={{ color: "white", fontSize: 20 }} />}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          style={{ padding: 0 ,background: "#001529"}}
        >
          <Menu
            theme="dark"
            mode="inline"
            items={items}
            selectedKeys={selectedKey ? [selectedKey] : []}
            onClick={() => setDrawerOpen(false)} // cerrar al navegar
          />
        </Drawer>
      </>
    ); 
 }else {
   return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      style={{ overflow: 'auto', height: '100vh', position: 'fixed', insetInlineStart: 0, top: 0, bottom: 0 }}
    >
      <div className="flex items-center justify-center h-16 relative">
        {/* Ícono hoja */}
        <img
          src="/Logo_Semilla_Icono.png"
          alt="Logo Icono"
          className={`absolute left-1/2 -translate-x-1/2 h-16 w-auto 
      transition-opacity duration-300 ease-in-out
      ${collapsed ? "opacity-100" : "opacity-0"}`}
        />

        {/* Logo completo */}
        <div className={`flex items-center h-16 transition-all duration-300 ease-in-out origin-left ${collapsed ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"}`}>
          <Image
            src="/Logo_Semilla.png"
            alt="Logo Semilla"
            preview={false}
            className="h-16 object-fit"
          />
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
 }
};

export default Sidebar;
