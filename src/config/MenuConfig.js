import { HomeOutlined } from "@ant-design/icons";
import { MdLock, MdOutlineTableView } from "react-icons/md";
//import { BiStore } from "react-icons/bi";
import { AiOutlineTruck} from "react-icons/ai";
import { FaWarehouse } from "react-icons/fa6";
import { GoContainer } from "react-icons/go";


const menuConfig = [
  {
    key: '1',
    icon: <HomeOutlined />,
    label: 'Inicio',
    to: '/',
    permission: null, // Público para usuarios logueados
  },
  
  // --- MÓDULO IMPORTACIONES ---
  {
    key: 'sub1',
    icon: <GoContainer />,
    label: 'Importaciones',
    permission: 'importaciones.can_manage_importaciones_module',
    children: [
      { 
        key: '3', 
        label: 'Listado Fletes', 
        to: '/importaciones/ver_fletes_internacionales', 
        permission: 'importaciones.can_view_flete', 
      },
      { 
        key: '4', 
        label: 'Reporte Estiba', 
        to: '/importaciones/reporte-estiba', 
        permission: 'importaciones.can_view_importaciones_reports', 
      },
      { 
        key: '5', 
        label: 'Documentos Prov.', 
        to: '/importaciones/gestion_documentos', 
        permission: 'importaciones.can_view_documentos_proveedor', 
      },
      { 
        key: '6', 
        label: 'Archivos DUA', 
        to: '/importaciones/listado-archivos-dua', 
        permission: 'importaciones.can_view_expediente_dua', 
      },      
    ],
  },
  
  // --- MÓDULO PROVEEDORES ---
  {
    key: 'sub2',
    icon: <AiOutlineTruck />,
    label: 'Proveedores',
    // Usamos el permiso de ver sus propios documentos como entrada al módulo
    permission: 'portal_proveedores.can_manage_doc_proveedores_importaciones', 
    children: [
      { 
        key: '8', 
        label: 'Cargar Documentos DUA', 
        to: '/proveedores/carga_docs_dua', 
        permission: 'portal_proveedores.can_upload_documents', 
      },
      { 
        key: '9', 
        label: 'Gestión de docs.', 
        to: '/proveedores/gestion_de_documentos', 
        permission: 'portal_proveedores.can_manage_own_documents', 
      },
    ],
  },

  // --- MÓDULO TABLAS MAESTRAS ---
  {
    key: 'sub3',
    icon: <MdOutlineTableView />,
    label: 'Tablas',
    // ANTES: 'usuarios.can_manage_maintenance_tables' (No existe)
    // AHORA: Usamos uno que sí tienes, por ejemplo gestionar tipos de documentos o sistema
    permission: 'sistema.can_manage_system', 
    children: [
      { 
        key: '10', 
        label: 'Tabla Tipo Doc.', 
        to: 'miscelanea/tipos_documentos', 
        // ESTE SÍ EXISTE (ID 33 en tu JSON)
        permission: 'sistema.can_manage_document_types', 
      },
      { 
        key: '11', 
        label: 'Tabla Empresas', 
        to: '/miscelanea/empresas', 
        // ANTES: 'usuarios.can_manage_companies' (No existe)
        // AHORA: Usamos el de sistema general para no complicarnos
        permission: 'sistema.can_manage_system', 
      },
      { 
        key: '12', 
        label: 'Tabla Productos', 
        to: '/miscelanea/productos', 
        // ESTE SÍ EXISTE (ID 13 en tu JSON)
        permission: 'sistema.can_manage_product_catalog', 
      },
      { 
        key: '13', 
        label: 'Tabla Almacenes', 
        to: '/miscelanea/almacenes', 
        // ESTE SÍ EXISTE (ID 18 en tu JSON)
        permission: 'almacen.can_view_warehouse', 
      },
      { 
        key: '14', 
        label: 'Tipo Estibaje', 
        to: '/tipo_estiba', 
        // ANTES: 'usuarios.can_manage_stowage_types' (No existe)
        // AHORA: Usamos sistema general
        permission: 'sistema.can_manage_system', 
      },
    ],
  },

  // --- MÓDULO ALMACÉN ---
  {
    key: 'sub4',
    icon: <FaWarehouse />,
    label: 'Almacen',
    permission: 'almacen.can_view_warehouse',
    children: [
      { 
        key: '15', 
        label: 'Ingresos/Salidas', 
        to: '/almacen/movimientos', 
        permission: 'almacen.can_manage_stock', // Requiere gestión para ver la pantalla de ops
      },
      { 
        key: '16', 
        label: 'Lector QR', 
        to: '/almacen/lectorQr', 
        permission: 'almacen.can_view_warehouse', 
      },
      { 
        key: '17', 
        label: 'Stock', 
        to: '/almacen/stock', 
        permission: 'almacen.can_view_stock', 
      },
      { 
        key: '18', 
        label: 'Transferencias', 
        to: '/almacen/transferencias', 
        permission: 'almacen.can_manage_stock', 
      },
      { 
        key: '19', 
        label: 'Registro Estiba', 
        to: '/almacen/estibaje', 
        permission: 'almacen.can_view_warehouse', 
      },
    ]
  },

  // --- MÓDULO USUARIOS ---
  /*
  {
    key: 'sub5',
    icon: <MdLock />,
    label: 'Usuarios',
    permission: 'usuarios.can_view_users',
    children: [
      { 
        key: '20', 
        label: 'Usuarios', 
        to: '/usuarios', 
        permission: 'usuarios.can_view_users', 
      },
      { 
        key: '21', 
        label: 'Roles', 
        to: '/roles', 
        permission: 'usuarios.can_view_roles', 
      },
      { 
        key: '22', 
        label: 'Permisos', 
        to: '/permisos', 
        permission: 'usuarios.can_view_roles', 
      },
    ],
  },
*/

  // --- PANEL ADMINISTRATIVO (SEGURIDAD) ---
  {
    key: 'admin_panel',
    icon: <div className="text-red-500"><MdLock /></div>,
    label: 'Seguridad (Admin)',
    // 🔒 PROTEGIDO: Solo usuarios con permiso de sistema (SystemAdmin)
    // Este permiso fue migrado desde 'sistema_gestionar_configuracion'
    permission: 'sistema.can_manage_system', 
    children: [
      { 
        key: 'admin_usuarios', 
        label: 'Administrar Usuarios', 
        to: '/admin/usuarios', 
        permission: 'usuarios.can_manage_users' 
      },
      { 
        key: 'admin_roles', 
        label: 'Administrar Roles', 
        to: '/admin/roles', 
        permission: 'usuarios.can_manage_roles' 
      },
      { 
        key: 'admin_permisos', 
        label: 'Permisos', 
        to: '/admin/permisos', 
        permission: 'usuarios.can_manage_roles' 
      },
    ],
  },
];

export default menuConfig;


/*
═══════════════════════════════════════════════════════════════════════════════
GUÍA DE USO DE PERMISOS GRANULARES EN VISTAS
═══════════════════════════════════════════════════════════════════════════════

EJEMPLO 1: Página de Usuarios con Botones Condicionales
────────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Button, Table } from 'antd';

const UsuariosPage = ({ user }) => {
  // Verificar permisos granulares
  const canCreate = user.permissions.includes('usuarios.can_manage_users') || 
                    user.permissions.includes('usuarios.can_create_users');
  
  const canEdit = user.permissions.includes('usuarios.can_manage_users') || 
                  user.permissions.includes('usuarios.can_edit_users');
  
  const canDelete = user.permissions.includes('usuarios.can_manage_users') || 
                    user.permissions.includes('usuarios.can_delete_users');

  return (
    <div>
      {canCreate && (
        <Button type="primary" onClick={handleCreate}>
          Nuevo Usuario
        </Button>
      )}
      
      <Table
        dataSource={usuarios}
        columns={[
          { title: 'Nombre', dataIndex: 'nombre' },
          {
            title: 'Acciones',
            render: (_, record) => (
              <>
                {canEdit && <Button onClick={() => handleEdit(record)}>Editar</Button>}
                {canDelete && <Button danger onClick={() => handleDelete(record)}>Eliminar</Button>}
              </>
            )
          }
        ]}
      />
    </div>
  );
};

EJEMPLO 2: Página de Almacén con Permisos Granulares
────────────────────────────────────────────────────────────────────────────────
const MovimientosPage = ({ user }) => {
  const canCreateMovement = user.permissions.includes('almacen.can_manage_warehouse') || 
                            user.permissions.includes('almacen.can_create_movements');
  
  const canEditMovement = user.permissions.includes('almacen.can_manage_warehouse') || 
                          user.permissions.includes('almacen.can_edit_movements');
  
  const canDeleteMovement = user.permissions.includes('almacen.can_manage_warehouse') || 
                            user.permissions.includes('almacen.can_delete_movements');

  return (
    <div>
      {canCreateMovement && (
        <Button onClick={handleNewMovement}>Registrar Ingreso/Salida</Button>
      )}
      
      <MovimientosList 
        onEdit={canEditMovement ? handleEdit : null}
        onDelete={canDeleteMovement ? handleDelete : null}
      />
    </div>
  );
};

EJEMPLO 3: Función Helper Reutilizable
────────────────────────────────────────────────────────────────────────────────
// utils/permissions.js
export const checkPermission = (userPermissions, requiredPermissions) => {
  if (!Array.isArray(requiredPermissions)) {
    requiredPermissions = [requiredPermissions];
  }
  
  return requiredPermissions.some(perm => userPermissions.includes(perm));
};

export const checkAnyPermission = (userPermissions, permissionsList) => {
  return permissionsList.some(perms => checkPermission(userPermissions, perms));
};

// Uso:
const canEdit = checkAnyPermission(user.permissions, [
  'usuarios.can_manage_users',
  'usuarios.can_edit_users'
]);

═══════════════════════════════════════════════════════════════════════════════
CASOS DE USO ESPECÍFICOS
═══════════════════════════════════════════════════════════════════════════════

CASO 1: Almacenero que solo registra ingresos/salidas
──────────────────────────────────────────────────────
Permisos asignados:
  ✓ almacen.can_view_warehouse (puede ver el módulo y listados)
  ✓ almacen.can_create_movements (puede registrar movimientos)
  ✗ almacen.can_edit_movements (NO puede editar)
  ✗ almacen.can_delete_movements (NO puede eliminar)

Resultado en UI:
  - Ve el menú "Almacén" y sub-opciones
  - En "Ingresos/Salidas" ve el botón "Registrar"
  - NO ve botones "Editar" ni "Eliminar" en la lista

CASO 2: Usuario Proveedor externo
──────────────────────────────────
Permisos asignados:
  ✓ usuarios.can_upload_documents (puede subir docs)
  ✓ usuarios.can_view_own_documents (puede ver sus docs)
  ✗ importaciones.can_view_importaciones (NO ve módulo Importaciones)

Resultado en UI:
  - Ve solo el menú "Proveedores"
  - NO ve menú "Importaciones"
  - Solo accede a sus propios documentos

CASO 3: Gerente de Importaciones
─────────────────────────────────
Permisos asignados:
  ✓ importaciones.can_view_importaciones (ve todo)
  ✓ importaciones.can_create_importaciones (puede crear)
  ✓ importaciones.can_edit_importaciones (puede editar)
  ✗ importaciones.can_delete_importaciones (NO puede eliminar)

Resultado en UI:
  - Ve menú completo de Importaciones
  - Puede crear y editar importaciones
  - NO ve botón "Eliminar" (solo admin puede eliminar)

CASO 4: Encargado de Mantenimiento
───────────────────────────────────
Permisos asignados:
  ✓ usuarios.can_manage_maintenance_tables (acceso completo a tablas)
  ✗ usuarios.can_manage_users (NO gestiona usuarios)
  ✗ almacen.can_manage_warehouse (NO gestiona almacén)

Resultado en UI:
  - Ve solo menú "Tablas"
  - Puede editar todas las tablas de mantenimiento
  - NO ve menús "Usuarios" ni "Almacén"

═══════════════════════════════════════════════════════════════════════════════
NOTAS IMPORTANTES
═══════════════════════════════════════════════════════════════════════════════

1. JERARQUÍA DE PERMISOS:
   - Permisos modulares (can_manage_*) incluyen TODOS los permisos granulares
   - Si das can_manage_users, automáticamente tiene can_create/edit/delete_users
   - Para restricción específica, dar SOLO permisos granulares (sin el modular)

2. PROVEEDORES SEPARADOS:
   - Los permisos usuarios.can_*_own_documents son RESTRICTIVOS
   - Solo acceden a SUS PROPIOS documentos
   - NO comparten permisos con importaciones.can_* (que es para staff)

3. TABLAS DE MANTENIMIENTO:
   - Separadas de permisos de usuarios
   - Usar usuarios.can_manage_*_catalog para tablas específicas
   - O usuarios.can_manage_maintenance_tables para acceso completo

4. BACKEND DEBE VALIDAR:
   - El frontend solo oculta opciones
   - El backend DEBE verificar permisos en cada endpoint
   - Ver HasModulePermission en usuarios/permissions.py

Para documentación completa ver: EXPANDED_PERMISSIONS.md
*/
