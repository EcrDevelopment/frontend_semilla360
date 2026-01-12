import React, { useEffect, useState } from "react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles,
  fetchPermissions,
  fetchEmpresas,
} from "../../api/Usuarios";
import UserTable from "./userTable";
import UserModal from "./userModal";
import { message } from "antd";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estado opcional para manejar la paginación de la tabla en el futuro
  const [totalUsers, setTotalUsers] = useState(0); 

  useEffect(() => {
    loadData();
    
    // ROLES
    fetchRoles({ all: true }).then((res) => {
        // Lógica Híbrida: Si es array úsalo, si es objeto paginado usa .results
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setRoles(data);
    });

    // PERMISOS - AQUÍ ESTABA EL ERROR PRINCIPAL
    fetchPermissions({ all: true }).then((res) => {
        // Tu backend con ?all=true devuelve un array directo, no un objeto con .results
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setPermissions(data);
    });

    // EMPRESAS
    fetchEmpresas({ all: true }).then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setEmpresas(data);
    });
  }, []);

  const roleMap = {};
  roles.forEach((role) => {
    roleMap[role.id] = role.name;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers();
      // CORRECCIÓN: Acceder a res.data.results para Usuarios
      setUsers(res.data.results || []);
      setTotalUsers(res.data.count); // Guardamos el total por si lo necesitas para la tabla
    } catch (error) {
      message.error("Error cargando usuarios");
    }
    setLoading(false);
  };

  const openModal = (record) => {
    setCurrentUser(record || null);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    await deleteUser(id);
    message.success("Usuario eliminado");
    loadData();
  };

  const handleModalOk = async (values) => {
    const userPayload = {
      ...values,
      userprofile: {
        empresa_id: values.empresa_id || null,
        telefono: values.telefono || null,
      },
    };    
    
    delete userPayload.empresa_id;
    delete userPayload.telefono;

    if (currentUser) {
      await updateUser(currentUser.id, userPayload);
      message.success("Usuario actualizado");
    } else {
      await createUser(userPayload);
      message.success("Usuario creado");
    }

    setModalVisible(false);
    loadData();
  };

  return (
    <>
      <div className="w-full h-full p-4 bg-gray-100">
        <UserTable
          users={users}
          loading={loading}
          openModal={openModal}
          handleDelete={handleDelete}
          roleMap={roleMap}
          // Si tu UserTable soporta paginación, pásale el totalUsers aquí
        />
        <UserModal
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleModalOk}
          currentUser={currentUser}
          roles={roles}
          permissions={permissions}
          roleMap={roleMap}
          setEmpresas={setEmpresas}
          empresas={empresas}
        />
      </div>
    </>
  );
};

export default UsersPage;