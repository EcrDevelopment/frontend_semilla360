import React, { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Layout, Image, Grid, Drawer, Button } from "antd";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { useAuth } from '../context/AuthContext';

// 1. IMPORTAMOS TU NUEVA CONFIGURACIÓN Y UTILIDADES
// Asegúrate de que las rutas sean correctas según donde guardaste los archivos
import menuConfig from '../../src/config/MenuConfig';
import { getExpandedPermissions, hasPermission } from '../utils/permissionUtils';

const { Sider, Header } = Layout;
const { useBreakpoint } = Grid;

/**
 * 2. NUEVA LÓGICA DE FILTRADO RECURSIVO
 * Transforma el menuConfig estático en items de AntDesign filtrados por permisos
 */
const buildMenuTree = (items, userPermissions) => {
  return items
    .filter(item => {
      // Verifica si el usuario tiene el permiso requerido (usando la utilidad)
      return hasPermission(item.permission, userPermissions);
    })
    .map(item => {
      // Si tiene hijos, filtramos recursivamente
      if (item.children) {
        const filteredChildren = buildMenuTree(item.children, userPermissions);
        
        // Si no quedan hijos tras el filtro, ocultamos el padre (opcional)
        if (filteredChildren.length === 0) return null;

        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: filteredChildren
        };
      }

      // Si es un item final, retornamos la estructura con Link
      return {
        key: item.key,
        icon: item.icon,
        // Usamos 'to' porque así lo definiste en tu menuConfig
        label: item.to ? <Link to={item.to}>{item.label}</Link> : item.label
      };
    })
    .filter(Boolean); // Elimina los nulls generados por padres vacíos
};

// Obtener nivel de keys para control de openKeys (Mantenido de tu código original)
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
  const isMobile = !screens.md; 
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);

  // 3. MEMOIZACIÓN DEL MENÚ (OPTIMIZACIÓN)
  // Calculamos el árbol de menú solo cuando cambian los permisos
  const menuItems = useMemo(() => {
    // A. Normalizamos permisos (por seguridad, por si llega null o objeto)
    let safePermissions = [];
    if (Array.isArray(permissions)) {
      safePermissions = permissions;
    } else if (typeof permissions === 'object' && permissions !== null) {
      // Soporte legacy si tu backend aun envía objeto { permiso: true }
      safePermissions = Object.keys(permissions).filter(k => permissions[k]);
    }

    // B. Expandimos jerarquía (Manage -> View)
    const expandedPerms = getExpandedPermissions(safePermissions);

    // C. Construimos el árbol
    return buildMenuTree(menuConfig, expandedPerms);
  }, [permissions]);

  const levelKeys = useMemo(() => getLevelKeys(menuItems), [menuItems]);

  // Lógica de apertura de submenús (Tu código original)
  const onOpenChange = keys => {
    const latest = keys.find(key => !openKeys.includes(key));
    if (latest) {
      const sameLevel = keys.filter(key => levelKeys[key] === levelKeys[latest]);
      const newKeys = keys.filter(key => !sameLevel.includes(key) || key === latest);
      setOpenKeys(newKeys);
    } else {
      setOpenKeys(keys);
    }
  };

  // Determinar selectedKey por ruta (Tu código original adaptado a recursividad)
  const findSelectedKey = () => {
    // Función auxiliar para aplanar el árbol y buscar rápido
    const flatten = (data) => data.reduce((acc, item) => {
        acc.push(item);
        if(item.children) acc = acc.concat(flatten(item.children));
        return acc;
    }, []);
    
    const flatItems = flatten(menuItems);
    
    for (const item of flatItems) {
        // Verificamos si el label es un Link de React Router y coincide el 'to'
        if (item.label?.props?.to === location.pathname) {
            return item.key;
        }
    }
    return null;
  };
  
  const selectedKey = findSelectedKey();

  // --- RENDERIZADO (IDÉNTICO A TU DISEÑO) ---

  if (isMobile) {
    return (
      <>
        <Header style={{ background: "#001529", padding: "0 16px", display: "flex", alignItems: "center" }}>
          <Image src="/Logo_Semilla_Icono.png" alt="Logo" preview={false} height={40} />
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
          style={{ padding: 0, background: "#001529" }}
          // Estilo para asegurar que el cuerpo del drawer sea oscuro como el menú
          styles={{ body: { padding: 0, backgroundColor: '#001529' } }}
        >
          <Menu
            theme="dark"
            mode="inline"
            items={menuItems}
            selectedKeys={selectedKey ? [selectedKey] : []}
            onClick={() => setDrawerOpen(false)}
          />
        </Drawer>
      </>
    );
  } else {
    return (
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ overflow: 'auto', height: '100vh', position: 'fixed', insetInlineStart: 0, top: 0, bottom: 0 }}
      >
        <div className="flex items-center justify-center h-16 relative">
          <img
            src="/Logo_Semilla_Icono.png"
            alt="Logo Icono"
            className={`absolute left-1/2 -translate-x-1/2 h-16 w-auto transition-opacity duration-300 ease-in-out ${collapsed ? "opacity-100" : "opacity-0"}`}
          />
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
          items={menuItems}
          selectedKeys={selectedKey ? [selectedKey] : []}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
        />
      </Sider>
    );
  }
};

export default Sidebar;