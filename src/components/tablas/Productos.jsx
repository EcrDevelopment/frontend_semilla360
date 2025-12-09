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
  SearchOutlined // NUEVO: Para inputs de filtro
} from '@ant-design/icons';
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto
} from '../../api/Productos'; // MODIFICADO: getProductos ahora acepta filtros
import { getEmpresas } from '../../api/Empresas';

export default function ProductoCRUD() {
  const [data, setData] = useState([]); // Almacena los productos (ya filtrados por el backend)
  const [empresas, setEmpresas] = useState([]);
  const [empresasMap, setEmpresasMap] = useState(new Map());
  
  // NUEVO: Estados de carga separados
  const [tableLoading, setTableLoading] = useState(false);
  const [empresaLoading, setEmpresaLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Instancias de formularios separadas
  const [form] = Form.useForm(); // Formulario del Modal
  const [filterForm] = Form.useForm(); // NUEVO: Formulario para los filtros

  // NUEVO: Estado para guardar los valores de los filtros
  const [filters, setFilters] = useState({
    nombre_producto: null,
    codigo_producto: null,
    proveedor_marca: null,
    empresa: null,
  });

  // NUEVO: useEffect para cargar EMPRESAS (solo 1 vez)
  useEffect(() => {
    const fetchEmpresas = async () => {
      setEmpresaLoading(true);
      try {
        const empresasRes = await getEmpresas();
        setEmpresas(empresasRes.data);
        const eMap = new Map(
          empresasRes.data.map(emp => [
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
  }, []); // Dependencia vacía = solo se ejecuta al montar

  // NUEVO: useEffect para cargar PRODUCTOS (se ejecuta al montar y si 'filters' cambia)
  useEffect(() => {
    const fetchProductos = async () => {
      setTableLoading(true);
      try {
        // Limpiamos filtros nulos o vacíos para no enviar params vacíos
        const cleanFilters = {};
        Object.keys(filters).forEach(key => {
          if (filters[key] !== '' && filters[key] !== null) {
            cleanFilters[key] = filters[key];
          }
        });

        // ¡Llamamos a la API con los filtros!
        const productosRes = await getProductos(cleanFilters);
        setData(productosRes.data);
      } catch (error) {
        message.error('Error al obtener productos');
      } finally {
        setTableLoading(false);
      }
    };

    fetchProductos();

  }, [filters]); // <--- Se re-ejecuta cada vez que 'filters' cambia

  // MODIFICADO: handleSubmit
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
      
      // NUEVO: Refrescar la tabla
      // Forzamos un re-fetch creando una nueva referencia del objeto filters
      setFilters(currentFilters => ({ ...currentFilters }));

    } catch (error) {
      message.error('Error al guardar el producto');
    }
  };

  // MODIFICADO: handleDelete
  const handleDelete = async (id) => {
    try {
      await deleteProducto(id);
      message.success('Producto eliminado (soft-delete)');
      
      // NUEVO: Refrescar la tabla
      setFilters(currentFilters => ({ ...currentFilters }));

    } catch {
      message.error('Error al eliminar');
    }
  };

  // NUEVO: Handler para cuando cambian los filtros del formulario
  const handleFilterChange = (changedValues, allValues) => {
    setFilters(allValues);
  };

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id',
      sorter: (a, b) => a.id - b.id, // Sorter (client-side sobre la data recibida)
    },
    {
      title: 'Nombre Producto',
      dataIndex: 'nombre_producto',
      sorter: (a, b) => a.nombre_producto.localeCompare(b.nombre_producto),
      ellipsis: true,
      render: (text) => (<Tooltip placement="topLeft" title={text}>{text}</Tooltip>),
    },
    {
      title: 'Código',
      dataIndex: 'codigo_producto',
      sorter: (a, b) => a.codigo_producto.localeCompare(b.codigo_producto),
    },
    {
      title: 'Proveedor / Marca',
      dataIndex: 'proveedor_marca',
      sorter: (a, b) => a.proveedor_marca.localeCompare(b.proveedor_marca),
    },
    {
      title: 'Empresa',
      dataIndex: 'empresa',
      key: 'empresa',
      render: (empresaId) => (
        <Tag color="blue">{empresasMap.get(empresaId) || 'No asignada'}</Tag>
      ),
      // Sorter para un campo renderizado
      sorter: (a, b) => {
        const nameA = empresasMap.get(a.empresa) || '';
        const nameB = empresasMap.get(b.empresa) || '';
        return nameA.localeCompare(nameB);
      },
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

      {/* NUEVO: Barra de Filtros */}
      <Form
        form={filterForm}
        layout="inline"
        onValuesChange={handleFilterChange} // Se llama al cambiar cualquier campo
        className="mb-4 p-4 bg-gray-50 rounded-lg"
      >
        <Form.Item name="nombre_producto" label="Nombre">
          <Input 
            placeholder="Buscar por nombre" 
            allowClear 
            prefix={<SearchOutlined style={{ color: '#aaa' }} />} 
          />
        </Form.Item>
        <Form.Item name="codigo_producto" label="Código">
          <Input placeholder="Buscar por código" allowClear />
        </Form.Item>
        <Form.Item name="proveedor_marca" label="Marca">
          <Input placeholder="Buscar por marca" allowClear />
        </Form.Item>
        <Form.Item name="empresa" label="Empresa">
          <Select
            placeholder="Todas las empresas"
            allowClear
            style={{ width: 200 }}
            loading={empresaLoading} // Carga de empresas
            options={empresas.map(emp => ({
              value: emp.id,
              label: emp.razon_social || emp.nombre_empresa
            }))}
          />
        </Form.Item>
      </Form>
      {/* FIN: Barra de Filtros */}

      <Table
        columns={columns}
        dataSource={data} // MODIFICADO: 'data' ya viene filtrada del backend
        rowKey="id"
        loading={{
          spinning: tableLoading, // MODIFICADO: usa 'tableLoading'
          indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />,
        }}
        scroll={{ x: 1000 }}
        pagination={{
          position: ["bottomLeft"],
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        size='small'
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
              loading={empresaLoading} // MODIFICADO: usa 'empresaLoading'
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