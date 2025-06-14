import React, { useState, useEffect } from "react";
import { Modal, Form, Input, message, Progress, Button, Select } from "antd";
import PermissionsSelect from "./permissionSelect";
import EmpresaModal from "./empresaModal";
import RoleSelect from "./roleSelect";

const { Option } = Select;

const UserModal = ({
  visible,
  onCancel,
  onOk,
  currentUser,
  roles,
  permissions,
  empresas,
  setEmpresas,
}) => {
  const [form] = Form.useForm();
  const [empresaModalVisible, setEmpresaModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [showEmpresa, setShowEmpresa] = useState(false);
  const [selectedRolesInModal, setSelectedRolesInModal] = useState([]);

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        username: currentUser.username || "",
        email: currentUser.email || "",
        first_name: currentUser.first_name || "",
        last_name: currentUser.last_name || "",
        roles: Array.isArray(currentUser.roles) ? currentUser.roles : [], // Cargar directamente los IDs
        permissions: Array.isArray(currentUser.permissions)
          ? currentUser.permissions
          : [],
        empresa_id: currentUser.userprofile?.empresa_id || null, // Cargar el ID de la empresa
      });
      // Inicializar el estado de roles
      setSelectedRolesInModal(
        Array.isArray(currentUser.roles) ? currentUser.roles : []
      );
      // Mostrar la empresa si el usuario ya tiene el rol de proveedor al cargar
      const isProveedorInitially =
        currentUser.roles?.some(
          (roleId) => roles.find((r) => r.id === roleId)?.name === "proveedor"
        ) || false;
      setShowEmpresa(isProveedorInitially);
    } else {
      form.resetFields();
      setShowEmpresa(false);
      setSelectedRolesInModal([]);
    }
  }, [currentUser, form, roles]);

  const calcularFuerza = (password) => {
    let fuerza = 0;
    if (password.length >= 8) fuerza += 1;
    if (/[A-Z]/.test(password)) fuerza += 1;
    if (/[a-z]/.test(password)) fuerza += 1;
    if (/\d/.test(password)) fuerza += 1;
    if (/[\W_]/.test(password)) fuerza += 1;
    return fuerza;
  };

  const fuerzaToColor = (fuerza) => {
    switch (fuerza) {
      case 0:
      case 1:
        return "exception";
      case 2:
      case 3:
        return "normal";
      case 4:
      case 5:
        return "success";
      default:
        return "normal";
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({ ...values, roles: selectedRolesInModal }); // Enviar los roles gestionados localmente
    } catch (error) {
      console.error(error);
      message.error("Error al guardar usuario");
    }
  };

  const handleEmpresaCreada = (nuevaEmpresa) => {
    setEmpresas((prev) => [...prev, nuevaEmpresa]);
    form.setFieldsValue({ empresa_id: nuevaEmpresa.id });
    setEmpresaModalVisible(false);
  };

  const handleRoleChangeInModal = (newRoles) => {
    setSelectedRolesInModal(newRoles);
    setShowEmpresa(
      newRoles.includes(roles.find((r) => r.name === "proveedor")?.id)
    );
  };

  return (
    <>
      <Modal
        open={visible}
        title={currentUser ? "Editar Usuario" : "Nuevo Usuario"}
        onCancel={onCancel}
        onOk={handleOk}
        width={500}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Usuario"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true },
              { type: "email", message: "Ingrese un correo válido" },
            ]}
          >
            <Input />
          </Form.Item>

          {!currentUser && (
            <>
              <Form.Item
                name="password"
                label="Contraseña"
                rules={[
                  { required: true, message: "La contraseña es obligatoria" },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
                    message:
                      "Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo",
                  },
                ]}
              >
                <Input.Password
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
              </Form.Item>

              {password && (
                <div style={{ marginBottom: 16 }}>
                  <Progress
                    percent={(calcularFuerza(password) / 5) * 100}
                    status={fuerzaToColor(calcularFuerza(password))}
                    showInfo={false}
                  />
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    {["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"][
                      calcularFuerza(password) - 1
                    ] || "Muy débil"}
                  </div>
                </div>
              )}
            </>
          )}

          <Form.Item
            name="first_name"
            label="Nombre"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="last_name"
            label="Apellido"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <RoleSelect
            roles={roles}
            onChange={handleRoleChangeInModal}
            value={selectedRolesInModal}
          />

          {showEmpresa && (
            <Form.Item name="empresa_id" label="Empresa">
              <Select
                placeholder="Selecciona una empresa"
                allowClear
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: "8px", textAlign: "center" }}>
                      <Button
                        type="link"
                        onClick={() => setEmpresaModalVisible(true)}
                      >
                        + Crear nueva empresa
                      </Button>
                    </div>
                  </>
                )}
              >
                {empresas.map((empresa) => (
                  <Option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <PermissionsSelect permissions={permissions} />
        </Form>
      </Modal>

      <EmpresaModal
        Open={empresaModalVisible}
        onCancel={() => setEmpresaModalVisible(false)}
        onCreate={handleEmpresaCreada}
      />
    </>
  );
};

export default UserModal;
