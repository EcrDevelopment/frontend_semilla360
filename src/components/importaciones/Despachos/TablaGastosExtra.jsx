import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Popconfirm
} from 'antd';
import {
  obtenerGastosExtraPorDespacho,
  crearGastoExtra,
  editarGastoExtra,
  eliminarGastoExtra
} from '../../../api/GastosExtra';

export default function TablaGastosExtra({ despachoId }) {
  const [gastos, setGastos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargarGastos = async () => {
    try {
      const res = await obtenerGastosExtraPorDespacho(despachoId);
      setGastos(res.data);
    } catch {
      message.error('Error al cargar gastos');
    }
  };

  useEffect(() => {
    if (despachoId) cargarGastos();
  }, [despachoId]);

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setGastoEditando(null);
    form.resetFields();
    setModalVisible(true);
  };

  const abrirModalEditar = (gasto) => {
    setModoEdicion(true);
    setGastoEditando(gasto);
    form.setFieldsValue(gasto);
    setModalVisible(true);
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarGastoExtra(id);
      message.success('Gasto eliminado');
      cargarGastos();
    } catch {
      message.error('Error al eliminar');
    }
  };

  const handleGuardar = async () => {
    try {
      const values = await form.validateFields();
      setCargando(true);
      if (modoEdicion) {
        await editarGastoExtra(gastoEditando.id, values);
        message.success('Gasto actualizado');
      } else {
        await crearGastoExtra({ ...values, despacho: despachoId });
        message.success('Gasto creado');
      }
      setModalVisible(false);
      cargarGastos();
    } catch (err) {
      if (err.errorFields) return; // validación fallida
      message.error('Error al guardar');
    } finally {
      setCargando(false);
    }
  };

  const columnas = [
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      render: (monto) => `$ ${parseFloat(monto).toFixed(2)}`
    },
    {
      title: 'Acciones',
      render: (_, gasto) => (
        <Space>
          <Button size="small" onClick={() => abrirModalEditar(gasto)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar gasto?"
            onConfirm={() => handleEliminar(gasto.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button size="small" danger>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="">
      
       <Button type="primary" className="mb-2 " onClick={abrirModalNuevo}>Nuevo Gasto</Button>

      <Table
        dataSource={gastos}
        columns={columnas}
        rowKey="id"
        pagination={false}
        size="small"
      />

      

      <Modal
        title={modoEdicion ? 'Editar Gasto' : 'Nuevo Gasto'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleGuardar}
        confirmLoading={cargando}
        okText="Guardar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Descripción"
            name="descripcion"
            rules={[{ required: true, message: 'Ingrese descripción' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Monto"
            name="monto"
            rules={[{ required: true, message: 'Ingrese monto' }]}
          >
            <InputNumber
              min={0}
              className="w-full"
              precision={2}
              stringMode
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
