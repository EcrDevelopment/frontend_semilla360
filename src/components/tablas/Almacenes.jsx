import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Popconfirm, message, Select, Spin,
  Card, Tooltip, Tag, Space
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import {
  getAlmacenes,
  createAlmacen,
  updateAlmacen,
  deleteAlmacen
} from '../../api/Almacen';
import { getEmpresas } from '../../api/Empresas';

export default function AlmacenCRUD() {
  // Estados de datos
  const [data, setData] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresasMap, setEmpresasMap] = useState(new Map());
  
  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados de control
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);

  // 1. Estado de Paginación
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 2. Estado de Búsqueda
  const [searchText, setSearchText] = useState('');

  // --- EFECTO 1: Cargar Empresas (Solo una vez al montar) ---
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const res = await getEmpresas({ all: true });
        // Manejo flexible por si tu API devuelve array directo o paginado
        const lista = Array.isArray(res.data) ? res.data : (res.data.results || []);
        
        setEmpresas(lista);
        const eMap = new Map(
          lista.map(emp => [
            emp.id,
            emp.razon_social || emp.nombre_empresa
          ])
        );
        setEmpresasMap(eMap);
      } catch (error) {
        message.error('Error al cargar empresas');
      }
    };
    fetchEmpresas();
  }, []);

  // --- FUNCIÓN PRINCIPAL: Cargar Almacenes (Paginado + Búsqueda) ---
  const fetchAlmacenes = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true);
    try {
      const params = {
        page: page,
        page_size: pageSize,
      };

      // Solo añadimos search si tiene texto
      if (search) {
        params.search = search; 
        // NOTA: Esto asume que tu backend usa SearchFilter. 
        // Si usas filtros manuales, cambia 'search' por 'descripcion' o lo que corresponda.
      }

      const res = await getAlmacenes(params);
      
      setData(res.data.results);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.count,
      });
    } catch (error) {
      message.error('Error al obtener almacenes');
    } finally {
      setLoading(false);
    }
  };

  // --- EFECTO 2: Manejo de Búsqueda con Debounce ---
  useEffect(() => {
    // Creamos un temporizador para no llamar a la API en cada tecla
    const timer = setTimeout(() => {
      // Al buscar, siempre reseteamos a la página 1
      fetchAlmacenes(1, pagination.pageSize, searchText);
    }, 500); // Espera 500ms después de que dejes de escribir

    return () => clearTimeout(timer); // Limpia el timer si escribes rápido
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]); 
  // Nota: No incluimos pagination.pageSize aquí para evitar doble carga inicial,
  // el cambio de pageSize se maneja en handleTableChange.

  // 3. Handler de cambio de tabla (Paginación)
  const handleTableChange = (newPagination) => {
    fetchAlmacenes(newPagination.current, newPagination.pageSize, searchText);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
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
      
      // Refrescar página actual
      fetchAlmacenes(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      let errorMsg = 'Error al guardar el almacén';
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField && Array.isArray(errors[firstErrorField])) {
          errorMsg = `${firstErrorField}: ${errors[firstErrorField][0]}`;
        }
      }
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlmacen(id);
      message.success('Almacén eliminado');
      // Refrescar página actual
      fetchAlmacenes(pagination.current, pagination.pageSize, searchText);
    } catch {
      message.error('Error al eliminar');
    }
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
    },
    {
      title: 'Descripción Almacén',
      dataIndex: 'descripcion',
    },
    {
      title: 'Empresa',
      dataIndex: 'empresa',
      key: 'empresa',
      render: (empresaId) => (
        <Tag color="blue">{empresasMap.get(empresaId) || 'No asignada'}</Tag>
      ),
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
      className="m-4 shadow-lg"
    >
      {/* Barra de búsqueda Server-Side */}
      <Input
        placeholder="Buscar por código o descripción..."
        prefix={<SearchOutlined className="text-gray-400" />}
        onChange={e => setSearchText(e.target.value)}
        className="mb-4 w-full md:w-1/3"
        allowClear
      />

      <Table
        columns={columns}
        dataSource={data}
        className='text-small'
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
        title={editing ? 'Editar Almacén' : 'Nuevo Almacén'}
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
            name="empresa"
            label="Empresa"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Select
              placeholder="Seleccione una empresa"
              // Usamos las empresas cargadas en el primer useEffect
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