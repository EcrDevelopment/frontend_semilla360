// src/components/Despacho/TablaOrdenesDespacho.jsx
import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  AutoComplete,
} from 'antd';
import {
  obtenerOrdenesDespacho,
  actualizarOrdenDespacho,
  eliminarOrdenDespacho,
  crearOrdenDespacho,
} from '../../../api/OrdenCompraDespacho';
import { listarEmpresas } from '../../../api/EmpresasInternas';
import axiosInstance from '../../../axiosConfig';

const { Option } = Select;

export default function TablaOrdenesDespacho({ despachoId }) {
  const [ordenes, setOrdenes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);
  const [opcionesOC, setOpcionesOC] = useState([]);

  const nombreComercialEmpresas = {
    bd_maxi_starsoft: 'MAXIMILIAN INVERSIONES SA',
    bd_trading_starsoft: 'TRADING SEMILLA SAC',
    bd_semilla_starsoft: 'LA SEMILLA DE ORO SAC',
  };

  useEffect(() => {
    if (despachoId) {
      cargarOrdenes();
      cargarEmpresas();
    }
  }, [despachoId]);

  const cargarEmpresas = async () => {
    try {
      const data = await listarEmpresas();
      setEmpresas(data);
    } catch (error) {
      message.error('Error al cargar empresas');
    }
  };

  const cargarOrdenes = async () => {
    try {
      const data = await obtenerOrdenesDespacho(despachoId);
      setOrdenes(data);
    } catch {
      message.error('Error al cargar órdenes');
    }
  };

  const abrirModalCrear = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const abrirModalEditar = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    form.resetFields();
    setModalVisible(false);
    setEditing(null);
    setOpcionesOC([]);
  };

  const onFinish = async (values) => {
    try {
      if (editing) {
        const updated = await actualizarOrdenDespacho(despachoId, editing.id, values);
        setOrdenes((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        message.success('Orden actualizada');
      } else {
        const nueva = await crearOrdenDespacho(despachoId, values);
        setOrdenes((prev) => [...prev, nueva]);
        message.success('Orden creada');
      }
      cerrarModal();
    } catch (error) {
      const data = error.response?.data;

      if (data?.non_field_errors) {
        message.error(data.non_field_errors[0]);
      } else if (data?.numero_oc) {
        message.error(`Error en N° OC: ${data.numero_oc[0]}`);
      } else if (data?.numero_recojo) {
        message.error(`Error en N° Recojo: ${data.numero_recojo[0]}`);
      } else {
        message.error('Error al guardar la orden');
      }
    }
  };

  const handleSearchOC = async (termino) => {
    if (termino.length < 2) {
      setOpcionesOC([]);
      return;
    }

    const empresa_id = form.getFieldValue('empresa_id');
    const empresaSeleccionada = empresas.find((e) => e.id === empresa_id);

    if (!empresaSeleccionada) {
      message.warning('Selecciona una empresa primero');
      return;
    }

    try {
      const baseDatos = empresaSeleccionada.nombre_empresa;
      const response = await axiosInstance.get('/importaciones/buscar_oi/', {
        params: {
          base_datos: baseDatos,
          query: termino,
        },
      });

      setOpcionesOC(response.data); // [{ numero_oc, producto_nombre }]
    } catch (error) {
      console.error('Error al buscar OC:', error);
      setOpcionesOC([]);
    }
  };

  const handleSelectOC = (value) => {
    const seleccionada = opcionesOC.find((item) => item.numero_oc === value);
    if (seleccionada) {
      form.setFieldsValue({
        producto_nombre: seleccionada.producto,
        precio_producto: seleccionada.precio_unitario,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await eliminarOrdenDespacho(despachoId, id);
      setOrdenes((prev) => prev.filter((item) => item.id !== id));
      message.success('Orden eliminada');
    } catch {
      message.error('Error al eliminar la orden');
    }
  };

  const columns = [
    { title: 'N° OC', dataIndex: 'numero_oc' },
    {
      title: 'Empresa',
      dataIndex: 'empresa_id',
      render: (id) => {
        const empresa = empresas.find((e) => e.id === id);
        if (!empresa) return id;
        return nombreComercialEmpresas[empresa.nombre_empresa] || empresa.nombre_empresa;
      },
    },
    { title: 'Producto', dataIndex: 'producto_nombre' },
    { title: 'Precio', dataIndex: 'precio_producto' },
    { title: 'Cantidad', dataIndex: 'cantidad' },
    { title: 'Asignada', dataIndex: 'cantidad_asignada' },
    { title: 'N° Recojo', dataIndex: 'numero_recojo' },
    {
      title: 'Acciones',
      render: (_, record) => (
        <Space>
          <Button onClick={() => abrirModalEditar(record)}>Editar</Button>
          <Popconfirm
            title="¿Eliminar esta orden?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" onClick={abrirModalCrear} style={{ marginBottom: 16 }}>
        Nueva Orden
      </Button>

      <Table
        rowKey="id"
        dataSource={ordenes}
        columns={columns}
        pagination={{ pageSize: 5 }}
      />

      <Modal
        open={modalVisible}
        title={editing ? 'Editar Orden' : 'Nueva Orden'}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="empresa_id" label="Empresa" rules={[{ required: true }]}>
            <Select placeholder="Selecciona empresa">
              {empresas.map((empresa) => (
                <Option key={empresa.id} value={empresa.id}>
                  {nombreComercialEmpresas[empresa.nombre_empresa] || empresa.nombre_empresa}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="numero_oc" label="N° OC" rules={[{ required: true }]}>
            <AutoComplete
              options={opcionesOC.map((item) => ({
                label: item.numero_oc,
                value: item.numero_oc,
              }))}
              onSearch={handleSearchOC}
              onSelect={handleSelectOC}
              placeholder="Escribe al menos 2 caracteres"
              className="w-full"
            />
          </Form.Item>

          <Form.Item name="producto_nombre" label="Producto">
            <Input disabled />
          </Form.Item>

          <Form.Item name="precio_producto" label="Precio" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="cantidad" label="Cantidad" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="cantidad_asignada"
            label="Cantidad Asignada"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="numero_recojo" label="N° Recojo">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
