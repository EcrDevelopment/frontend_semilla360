import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

// Componente de protección de permisos
import ProtectedRoute from './ProtectedRoute'; 

// --- PÁGINAS PÚBLICAS ---
import Login from '../pages/Login';
import ResetPassword from '../pages/ResetPassword';
import ResetPasswordConfirm from '../pages/ResetPasswordConfirm';

// --- PÁGINAS GENERALES ---
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AbuoutPage';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/Unauthorized';

// --- COMPONENTES IMPORTACIONES ---
import CalculoFlete from '../components/importaciones/CalculoFletesExtranjeros/CalculoFlete';
import ReporteEstiba from '../components/importaciones/PagoEstibas/FormReporteEstiba';
import ListadoFletes from '../components/importaciones/ListaFletesExtranjeros/ListaFletexExtranjeros';
import EditarFlete from '../components/importaciones/Despachos/formularioDespacho';
import CargaDocumentos from '../components/importaciones/RecepcionDocumentos/CargaDocumentos';
import AdminDocumentos from '../components/importaciones/gestionDocumentos/GestionDocumentos';
import GestDocumentos from '../components/importaciones/gestionDocumentos/GestionDocumentosPorUsuario';
import CrearArchivoDua from '../components/importaciones/gestionPdfs/CrearArchivoDua';
import ListarArchivos from '../components/importaciones/gestionPdfs/ListarArchivosDua';
import VistaArchivoDua from '../components/importaciones/gestionPdfs/VistaArchivosDua';
import ConsultaTicket from '../components/importaciones/gestionPdfs/SenasaImporter';

// --- COMPONENTES ALMACÉN ---
import Movimientos from '../components/almacen/movimientos/movimientoAlmacen';
import RegistroMovimiento from '../components/almacen/movimientos/RegistroMovimientos';
import StockVista from '../components/almacen/stock/StocKardex';
import Transferencias from '../components/almacen/transferencias/Transferencias';
import LectorQr from '../components/QrScanner/DemoLector';
import MainEstibaje from '../components/almacen/estibaje/MainEstibaje';

// --- COMPONENTES TABLAS / MANTENIMIENTO ---
import CrudTipoDocumentos from '../components/tipoDocumentos/TipoDocumentos';
import EmpresaCRUD from '../components/tablas/Empresas';
import ProductosCRUD from '../components/tablas/Productos';
import AlmacenCRUD from '../components/tablas/Almacenes';
import CrudTipoEstibaje from '../components/tablas/TipoEstibaje';

// --- COMPONENTES ADMINISTRACIÓN (NUEVOS) ---
import PermissionList from '../components/usuarios/PermissionList';
import UserManager from '../components/usuarios/UserManager';
import RoleManager from '../components/usuarios/RoleManager';

// --- COMPONENTES LEGACY (Si aun los usas, sino eliminar) ---
import AdminUsuarios from '../components/usuarios/userPage';
import AdminRoles from '../components/usuarios/adminRoles';
import AdminPermisos from '../components/usuarios/adminPermisos';


// --- GUARDIA DE AUTENTICACIÓN ---
const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = ({ resetContent }) => (
  <Routes>
    {/* ===================================================================
        A. RUTAS PÚBLICAS
       =================================================================== */}
    <Route path="/login" element={<Login />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />

    {/* ===================================================================
        B. RUTAS PRIVADAS (AuthGuard)
       =================================================================== */}
    
    {/* GENERALES */}
    <Route path="/" element={<AuthGuard><HomePage /></AuthGuard>} />
    <Route path="/about" element={<AuthGuard><AboutPage /></AuthGuard>} />
    <Route path="/unauthorized" element={<AuthGuard><UnauthorizedPage/></AuthGuard>} />
    
    {/* -------------------------------------------------------------------
        MÓDULO IMPORTACIONES
       ------------------------------------------------------------------- */}
    
    {/* Listado de Fletes (Ver) */}
    <Route path="/importaciones/ver_fletes_internacionales" element={
      <AuthGuard>
        <ProtectedRoute requiredPermission="importaciones.can_view_importaciones">
          <ListadoFletes resetContent={resetContent}/>
        </ProtectedRoute>      
      </AuthGuard>
    } /> 

    {/* Registrar Flete (Crear) - ACTUALIZADO A NUEVO PERMISO */}
    <Route path="/importaciones/registrar_flete_internacional" element={
      <AuthGuard>
        <ProtectedRoute requiredPermission="importaciones.can_create_importaciones">
          <CalculoFlete resetContent={resetContent}/>
        </ProtectedRoute>      
      </AuthGuard>
    } />  

    {/* Editar Flete (Editar) - ACTUALIZADO A NUEVO PERMISO */}
    <Route path="importaciones/editar-flete/:id" element={
      <AuthGuard>
        <ProtectedRoute requiredPermission="importaciones.can_edit_importaciones">
            <EditarFlete resetContent={resetContent} />
        </ProtectedRoute>
      </AuthGuard>
    } />

    {/* Reportes */}
    <Route path="/importaciones/reporte-estiba" element={
      <AuthGuard>
        <ProtectedRoute requiredPermission="importaciones.can_view_importaciones_reports">
          <ReporteEstiba resetContent={resetContent}/>
        </ProtectedRoute>      
      </AuthGuard>
    } />  

    {/* Gestión Documentos (Staff Importaciones) */}
    <Route path="/importaciones/gestion_documentos" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="importaciones.can_manage_documents">
                <AdminDocumentos/>
            </ProtectedRoute>
        </AuthGuard>
    } />

    {/* Archivos DUA */}
    <Route path="importaciones/listado-archivos-dua/" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="importaciones.can_manage_documents">
                <ListarArchivos/>
            </ProtectedRoute>
        </AuthGuard>
    } />
    <Route path="/importaciones/crear-archivo-dua/:id/:numero/:anio" element={<AuthGuard><CrearArchivoDua/></AuthGuard>} />
    <Route path="importaciones/archivos-dua/:id/:numero/:anio" element={<AuthGuard><VistaArchivoDua/></AuthGuard>} />
    
    {/* Consultas Públicas (dentro del sistema) */}
    <Route path="/consulta-ticket-senasa" element={<AuthGuard><ConsultaTicket/></AuthGuard>} />


    {/* -------------------------------------------------------------------
        MÓDULO PROVEEDORES
       ------------------------------------------------------------------- */}
    <Route path="/proveedores/carga_docs_dua" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_upload_documents">
                <CargaDocumentos />
            </ProtectedRoute>
        </AuthGuard>
    } /> 
    
    <Route path="/proveedores/gestion_de_documentos" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_manage_own_documents">
                <GestDocumentos/>
            </ProtectedRoute>
        </AuthGuard>
    } />


    {/* -------------------------------------------------------------------
        MÓDULO ALMACÉN
       ------------------------------------------------------------------- */}
    <Route path="/almacen/movimientos" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="almacen.can_view_warehouse">
                <Movimientos/>
            </ProtectedRoute>
        </AuthGuard>
    } />
    
    <Route path="/almacen/registrar-movimientos" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="almacen.can_create_movements">
                <RegistroMovimiento/>
            </ProtectedRoute>
        </AuthGuard>
    } />

    <Route path="/almacen/stock" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="almacen.can_view_stock">
                <StockVista/>
            </ProtectedRoute>
        </AuthGuard>
    } />

    <Route path="/almacen/transferencias" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="almacen.can_manage_stock">
                <Transferencias/>
            </ProtectedRoute>
        </AuthGuard>
    } />

    <Route path="/almacen/lectorQr" element={<AuthGuard><LectorQr/></AuthGuard>} />
    <Route path="/almacen/estibaje" element={<AuthGuard><MainEstibaje/></AuthGuard>} />


    {/* -------------------------------------------------------------------
        MÓDULO TABLAS MAESTRAS (Mantenimiento)
       ------------------------------------------------------------------- */}
    <Route path="miscelanea/tipos_documentos" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_manage_document_types">
                <CrudTipoDocumentos/>
            </ProtectedRoute>
        </AuthGuard>
    } />
    
    <Route path="/miscelanea/empresas" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_manage_companies">
                <EmpresaCRUD/>
            </ProtectedRoute>
        </AuthGuard>
    } />
    
    <Route path="/miscelanea/productos" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_manage_product_catalog">
                <ProductosCRUD/>
            </ProtectedRoute>
        </AuthGuard>
    } />
    
    <Route path="/miscelanea/almacenes" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="almacen.can_view_warehouse">
                <AlmacenCRUD/>
            </ProtectedRoute>
        </AuthGuard>
    } />
    
    <Route path="/tipo_estiba" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_manage_stowage_types">
                <CrudTipoEstibaje/>
            </ProtectedRoute>
        </AuthGuard>
    } />


    {/* -------------------------------------------------------------------
        MÓDULO USUARIOS (Vistas Legacy - Para usuarios normales)
       ------------------------------------------------------------------- */}
    <Route path="/usuarios" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_view_users">
                <AdminUsuarios/>
            </ProtectedRoute>
        </AuthGuard>
    } />
    <Route path="/roles" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_view_roles">
                <AdminRoles/>
            </ProtectedRoute>
        </AuthGuard>
    } />
    <Route path="/permisos" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_view_roles">
                <AdminPermisos/>
            </ProtectedRoute>
        </AuthGuard>
    } />


    {/* -------------------------------------------------------------------
        MÓDULO ADMINISTRACIÓN AVANZADA (Los nuevos componentes)
       ------------------------------------------------------------------- */}
    <Route path="/admin/permisos" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_manage_system"> {/* Protegido Fuerte */}
                <PermissionList />
            </ProtectedRoute>
        </AuthGuard>
    } />
    
    <Route path="/admin/roles" element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_manage_roles">
                <RoleManager />
            </ProtectedRoute>
        </AuthGuard>
    } />
    
    <Route path='/admin/usuarios' element={
        <AuthGuard>
            <ProtectedRoute requiredPermission="usuarios.can_manage_users">
                <UserManager />
            </ProtectedRoute>
        </AuthGuard>
    } />
    
    
    {/* --- RUTA 404 --- */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;