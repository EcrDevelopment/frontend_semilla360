// src/utils/permissionUtils.js

/**
 * Mapeo de Jerarquía:
 * Si el usuario tiene la llave (izquierda), automáticamente obtiene los valores (derecha).
 * Esto permite que el Admin solo necesite el permiso 'manage' y vea todo.
 */
export const PERMISSION_HIERARCHY = {
  // --- USUARIOS ---
  'usuarios.can_manage_users': [
    'usuarios.can_view_users', 
    'usuarios.can_create_users', 
    'usuarios.can_edit_users', 
    'usuarios.can_delete_users'
  ],
  'usuarios.can_manage_roles': ['usuarios.can_view_roles'], // + create, edit, delete implícitos si se usan

  // --- ALMACÉN ---
  'almacen.can_manage_warehouse': [
    'almacen.can_view_warehouse',
    'almacen.can_create_movements',
    'almacen.can_edit_movements',
    'almacen.can_delete_movements',
    'almacen.can_view_stock' // Generalmente el manager ve el stock
  ],
  'almacen.can_manage_stock': ['almacen.can_view_stock'],

  // --- IMPORTACIONES ---
  'importaciones.can_manage_importaciones': [
    'importaciones.can_view_importaciones',
    'importaciones.can_create_importaciones',
    'importaciones.can_edit_importaciones',
    'importaciones.can_delete_importaciones'
  ],
  'importaciones.can_manage_documents': [
    'importaciones.can_view_documents',
    'importaciones.can_create_documents', // granular si existe
    'importaciones.can_edit_documents'
  ],
  
  // --- MANTENIMIENTO (Tablas) ---
  'usuarios.can_manage_maintenance_tables': [
    'usuarios.can_view_maintenance_tables',
    'usuarios.can_manage_document_types',
    'usuarios.can_manage_companies',
    'usuarios.can_manage_product_catalog',
    'usuarios.can_manage_warehouse_catalog',
    'usuarios.can_manage_stowage_types'
  ],

  // --- PROVEEDORES (Casos especiales) ---
  // Si alguien puede subir, asumimos que puede ver sus propios docs
  'usuarios.can_upload_documents': ['usuarios.can_view_own_documents'],
  'usuarios.can_manage_own_documents': ['usuarios.can_view_own_documents', 'usuarios.can_upload_documents']
};

/**
 * Expande los permisos base del usuario usando la jerarquía.
 */
export const getExpandedPermissions = (userPermissions) => {
  if (!Array.isArray(userPermissions)) return [];
  
  const expanded = new Set(userPermissions);
  
  userPermissions.forEach(perm => {
    // 1. Añadir permisos directos de jerarquía
    const implied = PERMISSION_HIERARCHY[perm] || [];
    implied.forEach(impliedPerm => expanded.add(impliedPerm));
    
    // 2. (Opcional) Si tu backend usa el prefijo 'manage' como comodín universal por módulo
    // Ejemplo: si tiene 'almacen.can_manage_warehouse', le damos acceso a TODO lo que empiece con 'almacen.'
    // (Descomenta esto solo si quieres ser muy permisivo)
    /*
    if (perm.includes('can_manage')) {
       // lógica extra si fuera necesaria
    }
    */
  });
  
  return Array.from(expanded);
};

/**
 * Verifica si tiene el permiso requerido.
 * Soporta lógica OR si requiredPermission es un array, 
 * pero tu menuConfig actual envía Strings.
 */
export const hasPermission = (requiredPermission, userExpandedPermissions) => {
  // Si es null o undefined, es público
  if (!requiredPermission) return true;
  if (!userExpandedPermissions || userExpandedPermissions.length === 0) return false;

  return userExpandedPermissions.includes(requiredPermission);
};