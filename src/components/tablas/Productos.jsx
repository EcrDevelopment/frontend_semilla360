import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Popconfirm, message, Select, Spin, Tag,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto
} from '../../api/Productos';
import { getEmpresas } from '../../api/Empresas';

export default function ProductoCRUD() {
  const [data, setData] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresasMap, setEmpresasMap] = useState(new Map());
  
  const [tableLoading, setTableLoading] = useState(false);
  const [empresaLoading, setEmpresaLoading] = useState(false);

  // 1. Estado para manejar la paginación
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  // Estado para guardar los valores de los filtros
  const [filters, setFilters] = useState({
    nombre_producto: null,
    codigo_producto: null,
    proveedor_marca: null,
    empresa: null,
  });

  // Cargar EMPRESAS (solo 1 vez)
  useEffect(() => {
    const fetchEmpresas = async () => {
      setEmpresaLoading(true);
      try {
        const empresasRes = await getEmpresas({ all: true }); // Asegura traer todas para el select
        setEmpresas(empresasRes.data.results || empresasRes.data);
        
        const listaEmpresas = empresasRes.data.results || empresasRes.data;
        const eMap = new Map(
          listaEmpresas.map(emp => [
            emp.id,
            emp.razon_social || emp.nombre_empresa
          ])
        );
        setEmpresasMap(eMap);
      } catch (error) {
        message.error('Error al obtener empresas');
      } finally {
        setEmpresaLoading(false);
      }
    };
    fetchEmpresas();
  }, []);

  // 2. Función centralizada para cargar PRODUCTOS
  const fetchProductos = async (page = 1, pageSize = 10, currentFilters = filters) => {
    setTableLoading(true);
    try {
      // Limpiamos filtros nulos o vacíos
      const cleanFilters = {};
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key] !== '' && currentFilters[key] !== null && currentFilters[key] !== undefined) {
          cleanFilters[key] = currentFilters[key];
        }
      });

      // Añadimos parámetros de paginación
      const params = {
        ...cleanFilters,
        page: page,
        page_size: pageSize
      };

      const productosRes = await getProductos(params);
      
      // DRF devuelve: { count: 100, results: [...] }
      setData(productosRes.data.results);
      
      // Actualizamos paginación con el total real
      setPagination({
        current: page,
        pageSize: pageSize,
        total: productosRes.data.count,
      });

    } catch (error) {
      console.error(error);
      message.error('Error al obtener productos');
    } finally {
      setTableLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchProductos(pagination.current, pagination.pageSize, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 3. Handler para cambio de página en la Tabla
  const handleTableChange = (newPagination) => {
    fetchProductos(newPagination.current, newPagination.pageSize, filters);
  };

  // 4. Handler para cambio en los Filtros
  const handleFilterChange = (_, allValues) => {
    setFilters(allValues);
    // Al filtrar, siempre volvemos a la página 1
    fetchProductos(1, pagination.pageSize, allValues);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await updateProducto(editing.id, values);
        message.success('Producto actualizado');
      } else {
        await createProducto(values);
        message.success('Producto creado');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      
      // Refrescar manteniendo la página actual
      fetchProductos(pagination.current, pagination.pageSize, filters);

    } catch (error) {
      message.error('Error al guardar el producto');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProducto(id);
      message.success('Producto eliminado');
      // Refrescar manteniendo la página actual
      fetchProductos(pagination.current, pagination.pageSize, filters);
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
      title: 'Nombre Producto',
      dataIndex: 'nombre_producto',
      ellipsis: true,
      render: (text) => (<Tooltip placement="topLeft" title={text}>{text}</Tooltip>),
    },
    {
      title: 'Código',
      dataIndex: 'codigo_producto',
    },
    {
      title: 'Proveedor / Marca',
      dataIndex: 'proveedor_marca',
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
        <h2 className="text-xl font-semibold">Gestión de Productos</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Nuevo Producto
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Form
        form={filterForm}
        layout="inline"
        onValuesChange={handleFilterChange}
        className="mb-4 p-4 bg-gray-50 rounded-lg gap-y-4"
      >
        <Form.Item name="nombre_producto" label="Nombre">
          <Input 
            placeholder="Buscar..." 
            allowClear 
            prefix={<SearchOutlined style={{ color: '#aaa' }} />} 
          />
        </Form.Item>
        <Form.Item name="codigo_producto" label="Código">
          <Input placeholder="Buscar..." allowClear />
        </Form.Item>
        <Form.Item name="proveedor_marca" label="Marca">
          <Input placeholder="Buscar..." allowClear />
        </Form.Item>
        <Form.Item name="empresa" label="Empresa">
          <Select
            placeholder="Todas"
            allowClear
            style={{ width: 200 }}
            loading={empresaLoading}
            options={empresas.map(emp => ({
              value: emp.id,
              label: emp.razon_social || emp.nombre_empresa
            }))}
          />
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={{
          spinning: tableLoading,
          indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />,
        }}
        scroll={{ x: 1000 }}
        size='small'
        
        // 5. Conectar paginación y evento onChange
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
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
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
            name="empresa"
            label="Empresa"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Select
              placeholder="Seleccione una empresa"
              loading={empresaLoading}
              options={empresas.map(emp => ({
                value: emp.id,
                label: emp.razon_social || emp.nombre_empresa
              }))}
            />
          </Form.Item>

          <Form.Item
            name="nombre_producto"
            label="Nombre del Producto"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="codigo_producto"
            label="Código de Producto"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="proveedor_marca"
            label="Proveedor / Marca"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}