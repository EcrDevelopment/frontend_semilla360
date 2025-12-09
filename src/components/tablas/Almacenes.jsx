import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Popconfirm, message, Select, Spin,
  Card, // <-- 1. Importar Card
  Tooltip, // <-- 2. Importar Tooltip
  Tag, // <-- 3. Importar Tag
  Space // <-- 4. Importar Space
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined,
  SearchOutlined // <-- 5. Importar ícono de búsqueda
} from '@ant-design/icons';
import {
  getAlmacenes,
  createAlmacen,
  updateAlmacen,
  deleteAlmacen
} from '../../api/Almacen';
import { getEmpresas } from '../../api/Empresas';

export default function AlmacenCRUD() {
  const [data, setData] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresasMap, setEmpresasMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);

  // --- MEJORA 1: Estado para el botón de "Guardar" ---
  const [submitting, setSubmitting] = useState(false);

  // --- MEJORA 2: Estado para el filtro de búsqueda ---
  const [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [almacenesRes, empresasRes] = await Promise.all([
        getAlmacenes(),
        getEmpresas()
      ]);
      setData(almacenesRes.data);
      setEmpresas(empresasRes.data);
      const eMap = new Map(
        empresasRes.data.map(emp => [
          emp.id,
          emp.razon_social || emp.nombre_empresa
        ])
      );
      setEmpresasMap(eMap);
    } catch (error) {
      message.error('Error al obtener datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true); // <-- MEJORA 1: Activar loading del botón
    try {
      if (editing) {
        await updateAlmacen(editing.id, values);
        message.success('Almacén actualizado');
      } else {
        await createAlmacen(values);
        message.success('Almacén creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      fetchData();
    } catch (error) {
      // --- MEJORA 4: Manejo de errores específico ---
      let errorMsg = 'Error al guardar el almacén';
      if (error.response && error.response.data) {
        // Captura el primer error de validación de DRF
        const errors = error.response.data;
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField && Array.isArray(errors[firstErrorField])) {
          errorMsg = `${firstErrorField}: ${errors[firstErrorField][0]}`;
        }
      }
      message.error(errorMsg);
      // --- Fin Mejora 4 ---
    } finally {
      setSubmitting(false); // <-- MEJORA 1: Desactivar loading del botón
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlmacen(id);
      message.success('Almacén eliminado');
      fetchData();
    } catch {
      message.error('Error al eliminar');
    }
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      sorter: (a, b) => a.codigo.localeCompare(b.codigo), // <-- Pequeña mejora: ordenar
    },
    {
      title: 'Descripción Almacén',
      dataIndex: 'descripcion',
      sorter: (a, b) => a.descripcion.localeCompare(b.descripcion),
    },
    {
      title: 'Empresa',
      dataIndex: 'empresa',
      key: 'empresa',
      render: (empresaId) => (
        // --- MEJORA 3: Usar <Tag> para mejor UI ---
        <Tag color="blue">{empresasMap.get(empresaId) || 'No asignada'}</Tag>
      ),
      // Permitir filtrar por empresa
      filters: Array.from(empresasMap.entries()).map(([id, name]) => ({
        text: name,
        value: id,
      })),
      onFilter: (value, record) => record.empresa === value,
    },
    {
      title: 'Distrito',
      dataIndex: 'distrito',
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
    },
    {
      title: 'Acciones',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        // --- MEJORA 3: Usar <Space> y <Tooltip> ---
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

  // --- MEJORA 2: Lógica de filtrado ---
  const filteredData = data.filter(item =>
    item.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
    item.codigo.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    // --- MEJORA 3: Usar <Card> para el layout ---
    <Card
      title={<h2 className="text-xl font-semibold">Gestión de Almacenes</h2>}
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
          Nuevo Almacén
        </Button>
      }
      className="m-4 shadow-lg" // <-- Tailwind: Sombra y margen
    >
      {/* --- MEJORA 2: Barra de búsqueda --- */}
      <Input
        placeholder="Buscar por código o descripción..."
        prefix={<SearchOutlined className="text-gray-400" />}
        onChange={e => setSearchText(e.target.value)}
        className="mb-4 w-full md:w-1/3" // <-- Tailwind: Ancho
      />

      <Table
        columns={columns}
        dataSource={filteredData} // <-- Usar datos filtrados
        className='text-small'
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
        title={editing ? 'Editar Almacén' : 'Nuevo Almacén'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditing(null);
        }}
        // --- MEJORA 1: Loading en el botón OK ---
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
            name="empresa"
            label="Empresa"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Select
              placeholder="Seleccione una empresa"
              loading={loading} // Se activa mientras se cargan las empresas
              options={empresas.map(emp => ({
                value: emp.id,
                label: emp.razon_social || emp.nombre_empresa
              }))}
            />
          </Form.Item>

          <Form.Item
            name="codigo"
            label="Código"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción Almacén"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="distrito"
            label="Distrito"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="direccion"
            label="Dirección"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}