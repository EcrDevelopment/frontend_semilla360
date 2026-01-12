import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, permissions, isLoading } = useAuth();

  if (isLoading) return <div>Cargando...</div>;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // CORRECCIÓN: Validar permisos correctamente
  if (requiredPermission) {
    // 1. Verificamos si permissions es un array válido
    const permsArray = Array.isArray(permissions) ? permissions : [];
    
    // 2. Usamos .includes() para buscar el string exacto
    // También permitimos acceso si tiene permiso de SuperAdmin ('sistema.superuser_access')
    const hasAccess = permsArray.includes(requiredPermission) || 
                      permsArray.includes('sistema.superuser_access') ||
                      permsArray.includes('usuarios.can_manage_system');

    if (!hasAccess) {
      console.warn(`Acceso denegado. Requiere: ${requiredPermission}. Usuario tiene:`, permsArray);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}