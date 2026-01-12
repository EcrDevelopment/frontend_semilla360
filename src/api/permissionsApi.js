// src/api/permissionsApi.js
import client from '../axiosConfig'; // <--- IMPORTANTE: Usamos tu cliente configurado, no uno nuevo

// No necesitamos interceptores aquí porque 'client' ya los tiene en axiosConfig.js

export const permissionsApi = {
  // --- Categorías ---
  categories: {
    list: () => client.get('/accounts/permission-categories/'),
    get: (id) => client.get(`/accounts/permission-categories/${id}/`),
    create: (data) => client.post('/accounts/permission-categories/', data),
    update: (id, data) => client.patch(`/accounts/permission-categories/${id}/`, data),
    delete: (id) => client.delete(`/accounts/permission-categories/${id}/`),
  },
  
  // --- Permisos Custom ---
  permissions: {
    list: (params = {}) => client.get('/accounts/custom-permissions/', { params }),
    get: (id) => client.get(`/accounts/custom-permissions/${id}/`),
    create: (data) => client.post('/accounts/custom-permissions/', data),
    update: (id, data) => client.patch(`/accounts/custom-permissions/${id}/`, data),
    delete: (id) => client.delete(`/accounts/custom-permissions/${id}/`),
    
    // Estos endpoints son clave para tu admin panel
    getHistory: (id) => client.get(`/accounts/custom-permissions/${id}/history/`),
    getHierarchy: (id) => client.get(`/accounts/custom-permissions/${id}/hierarchy/`),
    assign: (data) => client.post('/accounts/custom-permissions/assign/', data),
  },
  
  // --- Auditoría ---
  audits: {
    list: (params = {}) => client.get('/accounts/permission-audits/', { params }),
    recent: () => client.get('/accounts/permission-audits/recent/'),
    byUser: (userId) => client.get('/accounts/permission-audits/by_user/', {
      params: { user_id: userId }
    }),
  },
};

export default permissionsApi;