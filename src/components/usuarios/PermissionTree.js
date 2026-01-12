import React, { useMemo, useState } from "react";
import { Tree, Input, Empty } from "antd";

const { Search } = Input;

// Diccionario para traducir las acciones de Django al español
const ACTION_TRANSLATIONS = {
  add: "Crear",
  change: "Editar",
  delete: "Eliminar",
  view: "Ver",
};

const PermissionTree = ({ 
  permissions = [], 
  value = [],   // Ahora recibe 'value' (propiedad estándar de formularios)
  onChange      // Ahora recibe 'onChange'
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  // 1. Transformar y Agrupar Datos
  const treeData = useMemo(() => {
    const groups = {};

    permissions.forEach((perm) => {
      // Parseo más seguro usando Regex
      // Busca: "Can " + (acción) + " " + (resto del nombre)
      const match = perm.name.match(/^Can (\w+) (.+)$/);
      
      let action = "Other";
      let modelName = perm.name;

      if (match) {
        action = match[1]; // ej: "add"
        modelName = match[2]; // ej: "historical movimiento almacen"
      }

      // Capitalizar nombre del módulo (Ej: "detalle estibaje" -> "Detalle Estibaje")
      // Opción A: Usar el nombre tal cual viene
      // Opción B: Formatearlo un poco (usamos el nombre tal cual viene pero con Mayúscula inicial)
      const groupTitle = modelName.charAt(0).toUpperCase() + modelName.slice(1);
      const groupKey = `group-${groupTitle}`;

      if (!groups[groupTitle]) {
        groups[groupTitle] = {
          title: groupTitle,
          key: groupKey,
          children: [],
          isGroup: true, // Flag interno para identificar grupos
        };
      }

      // Traducir la acción (add -> Crear)
      const actionLabel = ACTION_TRANSLATIONS[action] || action;

      groups[groupTitle].children.push({
        title: actionLabel, 
        key: perm.id, // El ID numérico real
        isLeaf: true,
        // Guardamos el nombre completo original para poder buscar
        filterStr: `${groupTitle} ${actionLabel}`.toLowerCase()
      });
    });

    // Ordenar grupos alfabéticamente
    return Object.values(groups).sort((a, b) => a.title.localeCompare(b.title));
  }, [permissions]);

  // 2. Lógica de Filtrado (Buscador)
  const filteredTreeData = useMemo(() => {
    if (!searchValue) return treeData;

    const lowerSearch = searchValue.toLowerCase();

    // Filtramos los grupos que tengan hijos que coincidan con la búsqueda
    return treeData.map(group => {
      const matchingChildren = group.children.filter(child => 
        child.filterStr.includes(lowerSearch)
      );

      if (matchingChildren.length > 0) {
        return { ...group, children: matchingChildren };
      }
      return null;
    }).filter(group => group !== null);

  }, [treeData, searchValue]);

  // Manejador del cambio en el buscador
  const onSearch = (e) => {
    const { value } = e.target;
    setSearchValue(value);
    
    // Si hay búsqueda, expandimos todos los grupos encontrados
    if (value) {
        const allGroupKeys = filteredTreeData.map(g => g.key);
        setExpandedKeys(allGroupKeys);
        setAutoExpandParent(true);
    } else {
        setExpandedKeys([]);
        setAutoExpandParent(false);
    }
  };

  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  // Manejador de selección (Checkboxes)
  const handleCheck = (checkedKeysValue) => {
    // AntD devuelve todas las keys marcadas (incluyendo las de grupos "group-xyz")
    // Filtramos para devolver SOLO los IDs numéricos al formulario
    const realPermissionIds = checkedKeysValue.filter(k => typeof k === 'number');
    
    if (onChange) {
      onChange(realPermissionIds);
    }
  };

  return (
    <div className="border rounded-md bg-white">
      <div className="p-2 border-b">
        <Search 
            style={{ marginBottom: 8 }} 
            placeholder="Buscar permiso (ej: Almacén, Ver...)" 
            onChange={onSearch}
            allowClear
        />
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: '400px', minHeight: '100px' }}>
        {filteredTreeData.length > 0 ? (
            <Tree
            checkable
            onExpand={onExpand}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            checkedKeys={value} // Vinculado al prop value (Form)
            onCheck={handleCheck}
            treeData={filteredTreeData}
            height={400} // Virtual scroll optimization
            blockNode // Hace que toda la fila sea clickeable
            />
        ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No se encontraron permisos" />
        )}
      </div>
      
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
         <span>{value.length} permisos seleccionados</span>
         <span>Total disponibles: {permissions.length}</span>
      </div>
    </div>
  );
};

export default PermissionTree;