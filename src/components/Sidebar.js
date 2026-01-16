import React, { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Layout, Image, Grid, Drawer, Button } from "antd";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { useAuth } from '../context/AuthContext';

import menuConfig from '../../src/config/MenuConfig';
import { getExpandedPermissions, hasPermission } from '../utils/permissionUtils';

const { Sider, Header } = Layout;
const { useBreakpoint } = Grid;

// --- FUNCIONES AUXILIARES (Sin cambios) ---
const buildMenuTree = (items, userPermissions) => {
  return items
    .filter(item => hasPermission(item.permission, userPermissions))
    .map(item => {
      if (item.children) {
        const filteredChildren = buildMenuTree(item.children, userPermissions);
        if (filteredChildren.length === 0) return null;
        return { key: item.key, icon: item.icon, label: item.label, children: filteredChildren };
      }
      return {
        key: item.key,
        icon: item.icon,
        label: item.to ? <Link to={item.to}>{item.label}</Link> : item.label
      };
    })
    .filter(Boolean);
};

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

  // --- MEMOIZACIÓN ---
  const menuItems = useMemo(() => {
    let safePermissions = [];
    if (Array.isArray(permissions)) {
      safePermissions = permissions;
    } else if (typeof permissions === 'object' && permissions !== null) {
      safePermissions = Object.keys(permissions).filter(k => permissions[k]);
    }
    const expandedPerms = getExpandedPermissions(safePermissions);
    return buildMenuTree(menuConfig, expandedPerms);
  }, [permissions]);

  const levelKeys = useMemo(() => getLevelKeys(menuItems), [menuItems]);

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

  const findSelectedKey = () => {
    const flatten = (data) => data.reduce((acc, item) => {
      acc.push(item);
      if (item.children) acc = acc.concat(flatten(item.children));
      return acc;
    }, []);
    const flatItems = flatten(menuItems);
    for (const item of flatItems) {
      if (item.label?.props?.to === location.pathname) {
        return item.key;
      }
    }
    return null;
  };

  const selectedKey = findSelectedKey();

  // --- RENDERIZADO ---

  if (isMobile) {
    return (
      <>
        <Header style={{ background: "#001529", padding: "0 16px", display: "flex", alignItems: "center" }}>
          <Image src="/logo_icono.png" alt="Logo" preview={false} height={40} />
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: "white", fontSize: 20 }} />}
            onClick={() => setDrawerOpen(true)}
            style={{ marginLeft: "auto" }}
          />
        </Header>
        <Drawer
          title={<Image src="/logo_icono.png" alt="Logo Semilla" preview={false} height={40} />}
          placement="left"
          closeIcon={<CloseOutlined style={{ color: "white", fontSize: 20 }} />}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          style={{ padding: 0, background: "#001529" }}
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
    // --- VERSIÓN DE ESCRITORIO ---
    return (
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        // CAMBIO CLAVE: Volvemos a 200px (estándar) para no empujar tu contenido
        width={200} 
        collapsedWidth={80}
        style={{ 
          overflow: 'hidden', // Oculta barras de desplazamiento del menú si sobran
          height: '100vh', 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          bottom: 0,
          zIndex: 100 // Asegura que esté por encima si hay solapamiento
        }}
      >
        {/* MÁSCARA DEL LOGO */}
        <div 
            style={{ 
                height: "64px",
                overflow: "hidden", // CORTA la imagen si es más ancha que el menú
                transition: "all 0.2s",
                background: "#001529",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start" // Alinea siempre a la izquierda
            }}
        >
            <img
              // Usamos la imagen que creaste de 220px
              src="/logo_completo.png"
              alt="Semilla 360"
              style={{
                height: "64px",
                // Mantenemos minWidth en 220px para preservar la geometría del diseño
                // aunque el contenedor padre solo muestre 200px.
                minWidth: "220px", 
                width: "220px",
                maxWidth: "none",
                display: "block"
              }}
            />
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