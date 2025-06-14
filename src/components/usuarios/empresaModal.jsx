import React from "react";
import { Modal, Form, Input, message } from "antd";
import { createEmpresa } from "../../api/Usuarios";

const EmpresaModal = ({ Open, onCancel, onCreate }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const response = await createEmpresa(values);
      message.success("Empresa registrada correctamente");
      onCreate(response.data); // pasa nueva empresa al padre
      form.resetFields();
    } catch (error) {
      console.error("Error al crear empresa:", error);
      if (error.response) {
        message.error(
          error.response.data?.detail || "No se pudo registrar la empresa"
        );
      } else {
        message.error("Ocurrió un error inesperado");
      }
      return Promise.reject(error);
    }
  };

  return (
    <Modal
      open={Open}
      title="Registrar nueva empresa"
      onCancel={onCancel}
      onOk={handleOk}
      okText="Crear"
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="nombre"
          label="Nombre de la empresa"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="ruc"
          label="RUC"
          rules={[
            { required: true },
            {
              pattern: /^\d{11}$/,
              message: "El RUC debe tener 11 dígitos",
            },
          ]}
        >
          <Input maxLength={11} />
        </Form.Item>
        <Form.Item name="direccion" label="Dirección (opcional)">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmpresaModal;
