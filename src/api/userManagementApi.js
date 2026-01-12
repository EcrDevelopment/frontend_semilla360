import client from '../axiosConfig';

export const userManagementApi = {
  // --- ROLES (Model: Group / Serializer: RoleSerializer) ---
  roles: {
    // Usamos 'pagination=off' porque lo definiste en tu RoleViewSet
    list: () => client.get('/accounts/roles/?pagination=off'), 
    
    create: (data) => client.post('/accounts/roles/', data),
    
    // PATCH espera: { name: "Admin", permissions: [1, 2] }
    update: (id, data) => client.patch(`/accounts/roles/${id}/`, data), 
    
    delete: (id) => client.delete(`/accounts/roles/${id}/`),
  },

  // --- USUARIOS (Model: User / Serializer: UserSerializer) ---
  users: {
    list: (params) => client.get('/accounts/usuarios/', { params }),
    
    create: (data) => client.post('/accounts/usuarios/', data),
    
    // IMPORTANTE: Tu UserSerializer define el campo como 'roles', no 'groups'
    // PATCH espera: { roles: [1, 3], first_name: "..." }
    update: (id, data) => client.patch(`/accounts/usuarios/${id}/`, data),
    
    // Endpoint específico para desactivar (útil para switch rápido)
    toggleActive: (id, isActive) => client.patch(`/accounts/usuarios/${id}/`, { is_active: isActive }),
  },
  empresas: {
    // Ajusta según tu ruta real de empresas
    list: (params) => client.get('/accounts/empresas/', { params }),
  },
  sedes: {
    // Si tu urls.py está bajo el prefijo 'miscelanea':
    list: () => client.get('/accounts/direcciones/'), 
  }
};