import axiosInstance from '../../src/axiosConfig';
// Users
export const fetchUsers = () => axiosInstance.get('/accounts/usuarios');
export const fetchUser = (id) => axiosInstance.get(`/accounts/usuarios/${id}`);
export const createUser = (data) => axiosInstance.post('/accounts/usuarios', data);
export const updateUser = (id, data) => axiosInstance.put(`/accounts/usuarios/${id}`, data);
export const deleteUser = (id) => axiosInstance.delete(`/accounts/usuarios/${id}`);

// Roles
export const fetchRoles = () => axiosInstance.get('/accounts/roles');
export const fetchRole = (id) => axiosInstance.get(`/accounts/roles/${id}`);
export const createRole = (data) => axiosInstance.post('/accounts/roles', data);
export const updateRole = (id, data) => axiosInstance.put(`/accounts/roles/${id}`, data);
export const deleteRole = (id) => axiosInstance.delete(`/accounts/roles/${id}`);

// Permissions
export const fetchPermissions = () => axiosInstance.get('/accounts/permisos');
export const fetchPermission = (id) => axiosInstance.get(`/accounts/permisos/${id}`);
export const createPermission = (data) => axiosInstance.post('/accounts/permisos', data);
export const updatePermission = (id, data) => axiosInstance.put(`/accounts/permisos/${id}/`, data);
export const deletePermission = (id) => axiosInstance.delete(`/accounts/permisos/${id}/`);
export const fetchContentTypes = () => axiosInstance.get('/accounts/content_types/');