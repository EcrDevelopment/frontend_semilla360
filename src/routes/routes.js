// src/routes/index.js
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute'

import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AbuoutPage';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/Unauthorized';
import CalculoFlete from '../components/importaciones/CalculoFletesExtranjeros/CalculoFlete';
import ReporteEstiba from '../components/importaciones/PagoEstibas/FormReporteEstiba';
import ListadoFletes from '../components/importaciones/ListaFletesExtranjeros/ListaFletexExtranjeros';
import AdminUsuarios from '../components/usuarios/userPage';
import AdminRoles from '../components/usuarios/adminRoles';
import AdminPermisos  from '../components/usuarios/adminPermisos';
import CargaDocumentos  from '../components/importaciones/RecepcionDocumentos/CargaDocumentos';
import AdminDocumentos  from '../components/importaciones/gestionDocumentos/GestionDocumentos';
import GestDocumentos  from '../components/importaciones/gestionDocumentos/GestionDocumentosPorUsuario';
import EditarPdfPage from '../components/importaciones/gestionPdfs/EditarPdfs';
import CrearArchivoDua from '../components/importaciones/gestionPdfs/CrearArchivoDua';
import ListarArchivos from '../components/importaciones/gestionPdfs/ListarArchivosDua';
import VistaArchivoDua from '../components/importaciones/gestionPdfs/VistaArchivosDua';
import CrudTipoDocumentos from '../components/tipoDocumentos/TipoDocumentos';

const AppRoutes = ({ resetContent }) => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage/>} />
    <Route path="*" element={<NotFoundPage />} />
    

    {/* Rutas de importaciones */}    
    <Route path="/importaciones/registrar_flete_internacional" element={
      <ProtectedRoute requiredPermission="importaciones.registrar_flete_internacional">
        <CalculoFlete resetContent={resetContent}/>
      </ProtectedRoute>     
    } />   
    <Route path="/importaciones/reporte-estiba" element={
      <ProtectedRoute requiredPermission="importaciones.ver_reporte_estibas">
        <ReporteEstiba resetContent={resetContent}/>
      </ProtectedRoute>      
      } />  
    <Route path="/importaciones/ver_fletes_internacionales" element={
      <ProtectedRoute requiredPermission="importaciones.ver_fletes_internacionales">
        <ListadoFletes resetContent={resetContent}/>
      </ProtectedRoute>        
    } /> 

    <Route path="/importaciones/gestion_documentos" element={<AdminDocumentos/>} />
    <Route path="/editar-pdf/:id" element={<EditarPdfPage />} />
    <Route path="/importaciones/crear-archivo-dua/:id/:numero/:anio" element={<CrearArchivoDua/>} />

    <Route path="importaciones/archivos-dua/:id/:numero/:anio" element={<VistaArchivoDua/>} />

    <Route path="importaciones/listado-archivos-dua/" element={<ListarArchivos/>} />

    <Route path="/proveedores/carga_docs_dua" element={<CargaDocumentos />} /> 
    <Route path="/proveedores/gestion_de_documentos" element={<GestDocumentos/>} />
    <Route path="/usuarios" element={<AdminUsuarios/>} />
    <Route path="/roles" element={<AdminRoles/>} />
    <Route path="/permisos" element={<AdminPermisos/>} />

    <Route path="/tipos_documentos" element={<CrudTipoDocumentos/>} />
    
  </Routes>
);

export default AppRoutes;
