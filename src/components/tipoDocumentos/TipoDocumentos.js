import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Popconfirm, message
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import {
  getTipoDocumentos,
  createTipoDocumento,
  updateTipoDocumento,
  deleteTipoDocumento
} from '../../api/TipoDocumentos';

export default function TipoDocumentos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getTipoDocumentos();
      setData(res.data);
    } catch (error) {
      message.error('Error al obtener los tipos de documento');
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
        await updateTipoDocumento(editing.id, values);
        message.success('Documento actualizado');
      } else {
        await createTipoDocumento(values);
        message.success('Documento creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      fetchData();
    } catch (error) {
      message.error('Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTipoDocumento(id);
      message.success('Documento eliminado');
      fetchData();
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
      title: 'Nombre',
      dataIndex: 'nombre',
    },
    {
      title: 'Acciones',
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
        <h2 className="text-xl font-semibold">Tipos de Documento</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Nuevo
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editing ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
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
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
