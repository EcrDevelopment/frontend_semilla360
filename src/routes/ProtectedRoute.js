import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, permissions, isLoading } = useAuth();

  if (isLoading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}