import axiosInstance from '../../src/axiosConfig';

// NOTA: He añadido el argumento (params) a todas las funciones de tipo "listar" (GET sin ID).
// Axios convertirá automáticamente el objeto { params } en query string.

// Users
export const fetchUsers = (params) => axiosInstance.get('/accounts/usuarios', { params });
export const fetchUser = (id) => axiosInstance.get(`/accounts/usuarios/${id}`);
export const createUser = (data) => axiosInstance.post('/accounts/usuarios', data);
export const updateUser = (id, data) => axiosInstance.put(`/accounts/usuarios/${id}`, data);
export const deleteUser = (id) => axiosInstance.delete(`/accounts/usuarios/${id}`);

// Roles
export const fetchRoles = (params) => axiosInstance.get('/accounts/roles', { params });
export const fetchRole = (id) => axiosInstance.get(`/accounts/roles/${id}`);
export const createRole = (data) => axiosInstance.post('/accounts/roles', data);
export const updateRole = (id, data) => axiosInstance.put(`/accounts/roles/${id}`, data);
export const deleteRole = (id) => axiosInstance.delete(`/accounts/roles/${id}`);

// Permissions
export const fetchPermissions = (params) => axiosInstance.get('/accounts/permisos', { params });
export const fetchPermission = (id) => axiosInstance.get(`/accounts/permisos/${id}`);
export const createPermission = (data) => axiosInstance.post('/accounts/permisos', data);
export const updatePermission = (id, data) => axiosInstance.put(`/accounts/permisos/${id}/`, data);
export const deletePermission = (id) => axiosInstance.delete(`/accounts/permisos/${id}/`);
export const fetchContentTypes = () => axiosInstance.get('/accounts/content_types/');

// Empresas
// Asumo que querrás lo mismo aquí para selectores de empresas
export const fetchEmpresas = (params) => axiosInstance.get('/accounts/empresas/', { params });
export const fetchEmpresa = (id) => axiosInstance.get(`/accounts/empresas/${id}/`);
export const createEmpresa = (data) => axiosInstance.post('/accounts/empresas/', data);

// Direcciones
export const fetchDirecciones = (params) => axiosInstance.get('/accounts/direcciones/', { params });
export const fetchDireccion = (id) => axiosInstance.get(`/accounts/direcciones/${id}/`);
export const createDireccion = (data) => axiosInstance.post('/accounts/direcciones/', data);
export const updateDireccion = (id, data) => axiosInstance.put(`/accounts/direcciones/${id}/`, data);
export const deleteDireccion = (id) => axiosInstance.delete(`/accounts/direcciones/${id}/`);
export const fetchDireccionesByEmpresa = (empresaId) => axiosInstance.get(`/accounts/empresas/${empresaId}/direcciones/`);

// Ubigeo (Generalmente estos siempre se quieren todos, pero no estorba dejar el params)
export const fetchDepartamentos = (params) => axiosInstance.get('/accounts/departamentos/', { params });
export const fetchProvincias = (params) => axiosInstance.get('/accounts/provincias/', { params });
export const fetchDistritos = (params) => axiosInstance.get('/accounts/distritos/', { params });