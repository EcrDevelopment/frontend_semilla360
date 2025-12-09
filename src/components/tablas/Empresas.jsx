import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Popconfirm, message, Spin,Tag
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa
} from '../../api/Empresas'; // <-- Servicio actualizado

export default function EmpresaCRUD() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getEmpresas();
      setData(res.data);
    } catch (error) {
      message.error('Error al obtener las empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await updateEmpresa(editing.id, values);
        message.success('Empresa actualizada');
      } else {
        await createEmpresa(values);
        message.success('Empresa creada');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      fetchData();
    } catch (error) {
      message.error('Error al guardar la empresa');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmpresa(id);
      message.success('Empresa eliminada (soft-delete)');
      fetchData(); // El backend (BaseModelManager) ya no la mostrará
    } catch {
      message.error('Error al eliminar');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: 'Razón Social / Nombre',
      dataIndex: 'razon_social',
      // Usamos el __str__ que definimos en Django
      //render: (text, record) => record.razon_social || record.nombre_empresa,
      render: (text,record) => (
        // --- MEJORA 3: Usar <Tag> para mejor UI ---
        <Tag color="blue">{record.razon_social || record.nombre_empresa}</Tag>
      ),
    },
    {
      title: 'Nombre BD',
      dataIndex: 'nombre_empresa',
    },
    {
      title: 'RUC',
      dataIndex: 'ruc',
    },
    {
      title: 'Acciones',
      fixed: 'right',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
          />
          <Popconfirm
            title="¿Seguro que deseas eliminar?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Gestión de Empresas</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Nueva Empresa
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={{
          spinning: loading,
          indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />,
        }}
        scroll={{ x: 'max-content' }}
        pagination={{
          position: ["bottomLeft"],
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        size='small'

      />

      <Modal
        title={editing ? 'Editar Empresa' : 'Nueva Empresa'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditing(null);
        }}
        onOk={() => form.submit()}
        okText="Guardar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="nombre_empresa"
            label="Nombre BD"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="razon_social"
            label="Razón Social"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="ruc"
            label="RUC"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}