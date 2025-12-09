import React from "react";
import { Table, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const UserTable = ({ users, loading, openModal, handleDelete, roleMap, }) => {
  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Usuario", dataIndex: "username" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Roles",
      dataIndex: "roles",
      render: (roles) => {
        // roles puede ser array de IDs o array de objetos; aquí asumimos IDs
        if (!roles) return "";
        // si roles son objetos con id, haz:
        const roleIds = roles.map((r) => (typeof r === "object" ? r.id : r));
        return roleIds.map((id) => roleMap[id] || id).join(", ");
      },
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button onClick={() => openModal(record)} icon={<EditOutlined />} />
          <Button
            danger
            onClick={() => handleDelete(record.id)}
            icon={<DeleteOutlined />}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold m-2">Usuarios</h2>
        <Button
          type="primary"
          onClick={() => openModal(null)}
        >
          Nuevo Usuario
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={users}
        columns={columns}
        loading={loading}
        pagination={{
          position: ["bottomLeft"],
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        scroll={{ x: 'max-content' }}
        size="small"
      />
    </>
  );
};

export default UserTable;
