import React, { useState } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout, theme, ConfigProvider, Grid } from 'antd';
import { WebSocketProvider } from './context/WebSocketContext';
import { FloatButton } from 'antd';
import { IoSettingsOutline } from "react-icons/io5";
import { LiaUserCogSolid } from "react-icons/lia";
import { BiPowerOff } from "react-icons/bi";
import Sidebar from './components/Sidebar';
import AppRoutes from './routes/routes'; // <-- Esto se encarga de todo ahora
import Spinner from './components/Spinner';
import locale from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useLocalStorageState } from './hooks/useLocalStorageState';

dayjs.locale('es');

const { Content } = Layout;
const { useBreakpoint } = Grid;



const LayoutComponent = () => {
  const { isLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = useLocalStorageState('sidebarCollapsed', false);
  const [contentKey, setContentKey] = useState(0);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  

  
  // LayoutComponent NECESITA saber esto para ocultar la UI.
  // (Actualizado para ser más robusto con .some y .startsWith)
  const hideSidebar = ["/login", "/reset-password", "/reset-password/confirm", "/404"].some(path => 
    location.pathname.startsWith(path)
  );

  if (isLoading) return <Spinner />;

  const resetContent = () => setContentKey(prevKey => prevKey + 1);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar (esta lógica está perfecta) */}
      {!hideSidebar && (
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      )}

      <Layout
        style={{
          // Esta lógica de marginLeft también está perfecta
          marginLeft: hideSidebar
            ? 0
            : isMobile
              ? 0
              : (collapsed ? 80 : 200),
        }}
      >
        <Content
          key={contentKey}
          style={{
            margin: '0 2px',
            padding: 0,
            minHeight: 360,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflowX: 'auto',
            overflowY: 'auto',
          }}
        >
          {/* --- 👇 AQUÍ EL CAMBIO PRINCIPAL --- */}
          {/* Ya no hay if/else. Solo renderizamos AppRoutes. */}
          {/* AppRoutes decidirá internamente si mostrar Login, Dashboard, etc. */}
          <AppRoutes resetContent={resetContent} />
          
        </Content>

        {/* Botón flotante (esta lógica está perfecta) */}
        {!hideSidebar && (
          <FloatButton.Group
            trigger="click"
            type="primary"
            style={{ position: 'fixed', bottom: 10, right: 10 }}
            icon={<LiaUserCogSolid />}
          >
            <FloatButton tooltip={<div>Configuración</div>} icon={<IoSettingsOutline />} />
            <FloatButton tooltip={<div>Salir</div>} icon={<BiPowerOff />} onClick={logout} />
          </FloatButton.Group>
        )}
      </Layout>
    </Layout>
  );
};

// App principal
function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <ConfigProvider locale={locale}>
          <Router>
            <LayoutComponent />
          </Router>
        </ConfigProvider>
      </WebSocketProvider>      
    </AuthProvider>
  );
}

export default App;