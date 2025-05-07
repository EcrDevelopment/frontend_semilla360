import React, { useState } from 'react';

import { BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout, theme, ConfigProvider } from 'antd';
import { FloatButton } from 'antd';
import { IoSettingsOutline } from "react-icons/io5";
import { LiaUserCogSolid } from "react-icons/lia";
import { BiPowerOff } from "react-icons/bi";
import Sidebar from './components/Sidebar';
import AppRoutes from './routes/routes';
import Spinner from './components/Spinner';
import locale from 'antd/locale/es_ES'; // Usamos el locale español base
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';


dayjs.locale('es');

const { Content } = Layout;

// Componente para verificar si el usuario está autenticado
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const LayoutComponent = () => {
  const { isLoading,logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [contentKey, setContentKey] = useState(0); // Clave dinámica para resetear contenido
  const {
    token: {  colorBgContainer, borderRadiusLG} ,
  } = theme.useToken();

  const location = useLocation();

  const hideSidebar = location.pathname === '/login' || 
                      location.pathname === '/reset-password' || 
                      location.pathname === '/reset-password/confirm' || 
                      location.pathname === '/404';

  if (isLoading) return <Spinner />;

  // Función para restablecer el contenido
  const resetContent = () => {
    setContentKey(prevKey => prevKey + 1);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!hideSidebar && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
      <Layout style={{ marginLeft: hideSidebar ? 0 : (collapsed ? 80 : 200) }}>
        <Content
          key={contentKey} 
          style={{
            margin: '0 2px',
            padding: 0,
            minHeight: 360,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {location.pathname === '/login' ? (
            <Login />
          ) : location.pathname === '/reset-password' ? (
            <ResetPassword />
          ) : location.pathname === '/reset-password/confirm' ? (
            <ResetPasswordConfirm />
          ) : (
            <PrivateRoute>
              <AppRoutes resetContent={resetContent}/>
            </PrivateRoute>
          )}
        </Content>
        
        {/* Botón flotante */}        
        {!hideSidebar && (
          <FloatButton.Group
          trigger="click"
          type="primary"
          style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
          }}
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

// Componente principal App
function App() {
  return (
    <AuthProvider>
      <ConfigProvider locale={locale}>
        <Router>
          <LayoutComponent />
        </Router>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
