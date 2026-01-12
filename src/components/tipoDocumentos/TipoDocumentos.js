import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Popconfirm, message, Spin, Card, Space, Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined
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
  const [submitting, setSubmitting] = useState(false); // Loading para guardar
  
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);

  // 1. Estado de Paginación
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 2. Función de carga paginada
  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      // Enviamos parámetros a DRF
      const res = await getTipoDocumentos({ 
        page: page, 
        page_size: pageSize 
      });
      
      // DRF devuelve { count: N, results: [...] }
      setData(res.data.results);
      
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.count,
      });

    } catch (error) {
      message.error('Error al obtener los tipos de documento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Manejador de cambio de tabla
  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
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
      // Recargar página actual
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTipoDocumento(id);
      message.success('Documento eliminado');
      // Recargar página actual
      fetchData(pagination.current, pagination.pageSize);
    } catch {
      message.error('Error al eliminar');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
    },
    {
      title: 'Acciones',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(record);
                form.setFieldsValue(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Popconfirm
              title="¿Seguro que deseas eliminar?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<h2 className="text-xl font-semibold">Tipos de Documento</h2>}
      extra={
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
      }
      className="m-4 shadow-lg"
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={{
          spinning: loading,
          indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />,
        }}
        scroll={{ x: 'max-content' }}
        size='small'
        // Configuración de Paginación
        pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            position: ["bottomLeft"],
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editing ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditing(null);
        }}
        okButtonProps={{ loading: submitting }}
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
    </Card>
  );
}