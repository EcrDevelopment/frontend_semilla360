import React, { useState, useRef } from "react";
import TablaEstibaje from "./TablaEstibaje"; // Asegúrate de la ruta correcta
import RegistroEstibaje from "./RegistroEstibaje"; // Asegúrate de la ruta correcta

const MainEstibaje = () => {
  const [view, setView] = useState("list"); // 'list' | 'form'
  const [recordToEdit, setRecordToEdit] = useState(null);
  
  // Usamos una ref para forzar recarga de la tabla sin desmontar todo
  const tableRef = useRef();

  // Acción: Ir a crear nuevo
  const handleCreate = () => {
    setRecordToEdit(null);
    setView("form");
  };

  // Acción: Ir a editar
  const handleEdit = (record) => {
    setRecordToEdit(record);
    setView("form");
  };

  // Acción: Guardado exitoso (viene del formulario)
  const handleSuccess = () => {
    setView("list");
    setRecordToEdit(null);
    // Recargar tabla si la ref existe
    if (tableRef.current) {
      tableRef.current.reload();
    }
  };

  // Acción: Cancelar (botón volver)
  const handleCancel = () => {
    setView("list");
    setRecordToEdit(null);
  };

  return (
    <div>
      {view === "list" ? (
        <TablaEstibaje 
          ref={tableRef} // Pasamos la referencia
          onCreate={handleCreate} 
          onEdit={handleEdit} 
        />
      ) : (
        <RegistroEstibaje 
          registroEdit={recordToEdit} // Pasamos el objeto a editar
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      )}
    </div>
  );
};

export default MainEstibaje;