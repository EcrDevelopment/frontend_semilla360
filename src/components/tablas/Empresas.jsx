import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Popconfirm, message, Spin, Tag
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
} from '../../api/Empresas';

export default function EmpresaCRUD() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 1. Estado para manejar la paginación
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10, // Debe coincidir con tu PAGE_SIZE de Django
    total: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);

  // 2. fetchData ahora acepta página y tamaño
  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      // Enviamos los params que DRF espera (page y page_size)
      const res = await getEmpresas({ 
        page: page, 
        page_size: pageSize 
      });
      
      // DRF devuelve: { count: 50, next: '...', results: [...] }
      setData(res.data.results); 
      
      // Actualizamos el estado de la paginación con el total real
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.count, 
      });

    } catch (error) {
      console.error(error);
      message.error('Error al obtener las empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar la primera página al montar
    fetchData(pagination.current, pagination.pageSize);
  }, []);

  // 3. Manejador de eventos de la tabla (cambio de página/filtros)
  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize);
  };

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
      // Recargar la página actual
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Error al guardar la empresa');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmpresa(id);
      message.success('Empresa eliminada');
      // Recargar la página actual
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
      title: 'Razón Social / Nombre',
      dataIndex: 'razon_social',
      render: (text, record) => (
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
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<EditOutlined />}
            size="small"
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
            <Button icon={<DeleteOutlined />} danger size="small" />
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
        size='small'
        
        // 4. Conectar la paginación y el evento onChange
        pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            position: ["bottomLeft"],
        }}
        onChange={handleTableChange} 
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