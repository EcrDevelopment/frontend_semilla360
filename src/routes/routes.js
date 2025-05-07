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
import AdminUsuarios from '../components/usuarios/adminUsuarios';
import AdminRoles from '../components/usuarios/adminRoles';
import AdminPermisos  from '../components/usuarios/adminPermisos';
import CargaDocumentos  from '../components/importaciones/RecepcionDocumentos/CargaDocumentos';
import AdminDocumentos  from '../components/importaciones/gestionDocumentos/GestionDocumentos';

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

    <Route path="/importaciones/carga_docs_dua" element={<CargaDocumentos />} /> 
    <Route path="/usuarios" element={<AdminUsuarios/>} />
    <Route path="/roles" element={<AdminRoles/>} />
    <Route path="/permisos" element={<AdminPermisos/>} />
    
  </Routes>
);

export default AppRoutes;
