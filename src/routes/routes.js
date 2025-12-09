import React from 'react';
// --- 👇 Importa los componentes de Ruteo y Autenticación ---
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

// --- Tu 'ProtectedRoute' de PERMISOS (sin cambios) ---
import ProtectedRoute from './ProtectedRoute'; 

// --- 👇 1. Importa TODAS las páginas (públicas y privadas) ---
// Públicas
import Login from '../pages/Login';
import ResetPassword from '../pages/ResetPassword';
import ResetPasswordConfirm from '../pages/ResetPasswordConfirm';

// Privadas (las que ya tenías)
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AbuoutPage';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/Unauthorized';
// ... (todos tus otros imports de componentes)
import CalculoFlete from '../components/importaciones/CalculoFletesExtranjeros/CalculoFlete';
import ReporteEstiba from '../components/importaciones/PagoEstibas/FormReporteEstiba';
import ListadoFletes from '../components/importaciones/ListaFletesExtranjeros/ListaFletexExtranjeros';
import AdminUsuarios from '../components/usuarios/userPage';
import AdminRoles from '../components/usuarios/adminRoles';
import AdminPermisos from '../components/usuarios/adminPermisos';
import CargaDocumentos from '../components/importaciones/RecepcionDocumentos/CargaDocumentos';
import AdminDocumentos from '../components/importaciones/gestionDocumentos/GestionDocumentos';
import GestDocumentos from '../components/importaciones/gestionDocumentos/GestionDocumentosPorUsuario';
import EditarPdfPage from '../components/importaciones/gestionPdfs/EditarPdfs';
import CrearArchivoDua from '../components/importaciones/gestionPdfs/CrearArchivoDua';
import ListarArchivos from '../components/importaciones/gestionPdfs/ListarArchivosDua';
import VistaArchivoDua from '../components/importaciones/gestionPdfs/VistaArchivosDua';
import CrudTipoDocumentos from '../components/tipoDocumentos/TipoDocumentos';
import EditarFlete from '../components/importaciones/Despachos/formularioDespacho';
import LectorQr from '../components/QrScanner/DemoLector';
import Movimientos from '../components/almacen/movimientos/movimientoAlmacen';
import RegistroMovimiento from '../components/almacen/movimientos/RegistroMovimientos';
import EmpresaCRUD from '../components/tablas/Empresas';
import ProductosCRUD from '../components/tablas/Productos';
import AlmacenCRUD from '../components/tablas/Almacenes';
import StockVista from '../components/almacen/stock/StocKardex';
import Transferencias from '../components/almacen/transferencias/Transferencias';
import ConsultaTicket from '../components/importaciones/gestionPdfs/SenasaImporter';
import ConsultaGuia from '../components/almacen/entradas/ConsultaGuia';


// --- 👇 2. Define el "Guardián de AUTENTICACIÓN" ---
// (Este es el 'PrivateRoute' que estaba en App.js.
// Lo llamo 'AuthGuard' para no confundirlo con tu 'ProtectedRoute' de permisos)
const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};



const AppRoutes = ({ resetContent }) => (
  <Routes>
    {/* --- A. RUTAS PÚBLICAS --- */}
    {/* No tienen ningún guardián */}
    <Route path="/login" element={<Login />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />

    
    {/* --- B. RUTAS PRIVADAS (Protegidas por Autenticación) --- */}
    {/* Todas envueltas en AuthGuard.
        Las que necesitan permisos, anidan tu ProtectedRoute. */}
    
    <Route path="/" element={<AuthGuard><HomePage /></AuthGuard>} />
    <Route path="/about" element={<AuthGuard><AboutPage /></AuthGuard>} />
    <Route path="/unauthorized" element={<AuthGuard><UnauthorizedPage/></AuthGuard>} />
    
    {/* Rutas de importaciones */}    
    <Route path="/importaciones/registrar_flete_internacional" element={
      <AuthGuard> {/* 1. ¿Logueado? */}
        <ProtectedRoute requiredPermission="importaciones.registrar_flete_internacional"> {/* 2. ¿Permiso? */}
          <CalculoFlete resetContent={resetContent}/>
        </ProtectedRoute>      
      </AuthGuard>
    } />  

    <Route 
      path="importaciones/editar-flete/:id" 
      element={<AuthGuard><EditarFlete resetContent={resetContent} /></AuthGuard>} 
    />

    <Route path="/importaciones/reporte-estiba" element={
      <AuthGuard>
        <ProtectedRoute requiredPermission="importaciones.ver_reporte_estibas">
          <ReporteEstiba resetContent={resetContent}/>
        </ProtectedRoute>      
      </AuthGuard>
    } />  
    <Route path="/importaciones/ver_fletes_internacionales" element={
      <AuthGuard>
        <ProtectedRoute requiredPermission="importaciones.ver_fletes_internacionales">
          <ListadoFletes resetContent={resetContent}/>
        </ProtectedRoute>      
      </AuthGuard>
    } /> 

    {/* --- C. ENVUELVE TODAS TUS OTRAS RUTAS EN AuthGuard --- */}
    <Route path="/importaciones/gestion_documentos" element={<AuthGuard><AdminDocumentos/></AuthGuard>} />
    <Route path="/editar-pdf/:id" element={<AuthGuard><EditarPdfPage /></AuthGuard>} />
    <Route path="/importaciones/crear-archivo-dua/:id/:numero/:anio" element={<AuthGuard><CrearArchivoDua/></AuthGuard>} />
    <Route path="importaciones/archivos-dua/:id/:numero/:anio" element={<AuthGuard><VistaArchivoDua/></AuthGuard>} />
    <Route path="importaciones/listado-archivos-dua/" element={<AuthGuard><ListarArchivos/></AuthGuard>} />
    <Route path="/proveedores/carga_docs_dua" element={<AuthGuard><CargaDocumentos /></AuthGuard>} /> 
    <Route path="/proveedores/gestion_de_documentos" element={<AuthGuard><GestDocumentos/></AuthGuard>} />
    <Route path="/usuarios" element={<AuthGuard><AdminUsuarios/></AuthGuard>} />
    <Route path="/roles" element={<AuthGuard><AdminRoles/></AuthGuard>} />
    <Route path="/permisos" element={<AuthGuard><AdminPermisos/></AuthGuard>} />
    <Route path="/tipos_documentos" element={<AuthGuard><CrudTipoDocumentos/></AuthGuard>} />
    <Route path="/almacen/movimientos" element={<AuthGuard><Movimientos/></AuthGuard>} />
    <Route path="/almacen/transferencias" element={<AuthGuard><Transferencias/></AuthGuard>} />
    <Route path="/almacen/stock" element={<AuthGuard><StockVista/></AuthGuard>} />
    <Route path="/almacen/lectorQr" element={<AuthGuard><LectorQr/></AuthGuard>} />
    <Route path="/almacen/registrar-movimientos" element={<AuthGuard><RegistroMovimiento/></AuthGuard>} />
    <Route path="/miscelanea/empresas" element={<AuthGuard><EmpresaCRUD/></AuthGuard>} />
    <Route path="/miscelanea/productos" element={<AuthGuard><ProductosCRUD/></AuthGuard>} />
    <Route path="/miscelanea/almacenes" element={<AuthGuard><AlmacenCRUD/></AuthGuard>} />
    <Route path="/consulta-ticket-senasa" element={<AuthGuard><ConsultaTicket/></AuthGuard>} />
    <Route path="/consulta-guia" element={<AuthGuard><ConsultaGuia/></AuthGuard>} />
    
    {/* --- D. RUTA 404 (Al final) --- */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;