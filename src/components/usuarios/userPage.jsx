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

  useEffect(() => {
    loadData();
    fetchRoles().then((res) => setRoles(res.data));
    fetchPermissions().then((res) => setPermissions(res.data));
    fetchEmpresas().then((res) => setEmpresas(res.data));
  }, []);

  const roleMap = {};
  roles.forEach((role) => {
    roleMap[role.id] = role.name;
  });

  const loadData = async () => {
    setLoading(true);
    const res = await fetchUsers();
    setUsers(res.data);
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
        />
        <UserModal
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleModalOk}
          currentUser={currentUser}
          roles={roles}
          permissions={permissions}
          //onRoleChange={handleRoleChange}
          roleMap={roleMap}
          setEmpresas={setEmpresas}
          empresas={empresas}
        />
      </div>
    </>
  );
};

export default UsersPage;
