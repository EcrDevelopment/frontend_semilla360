import { useEffect, useState } from 'react';
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Button,
  message,
} from 'antd';
import SelectorTransportista from './SelectorTransportista';
import SelectorProveedor from './SelectorProveedor';
import { obtenerDespacho, actualizarDespacho, crearTransportista, crearProveedor } from '../../../api/Despachos';
import dayjs from 'dayjs';

export default function SeccionGeneral({ id }) {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  const fetchDespacho = async () => {
    setLoading(true);
    try {
      const response = await obtenerDespacho(id);
      //console.log("modelo despacho obtenido:", response);
      setInitialData(response);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      message.error(error.message || 'Error al obtener datos del despacho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDespacho();
    }
  }, [id]);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        fecha_numeracion: initialData.fecha_numeracion
          ? dayjs(initialData.fecha_numeracion, "DD/MM/YYYY")
          : null,
        fecha_llegada: initialData.fecha_llegada
          ? dayjs(initialData.fecha_llegada, "DD/MM/YYYY")
          : null,
      });
    }
  }, [initialData, form]);

  const handleEditClick = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      const values = await form.validateFields();

      // CREAR TRANSPORTISTA SI ES NUEVO
      let transportistaId = null;
      if (values.transportista?.isNuevo) {
        const nuevo = await crearTransportista({
          nombre_transportista: values.transportista.nombre_transportista
        });
        transportistaId = nuevo.id;
      } else if (values.transportista?.id) {
        transportistaId = values.transportista.id;
      } else if (typeof values.transportista === 'string') {
        const nuevo = await crearTransportista({ nombre_transportista: values.transportista });
        transportistaId = nuevo.id;
      } else {
        message.error('Debes seleccionar un transportista válido');
        return;
      }

      // CREAR PROVEEDOR SI ES NUEVO
      let proveedorId = null;
      if (values.proveedor?.isNuevo) {
        const nuevo = await crearProveedor({
          nombre_proveedor: values.proveedor.nombre_proveedor
        });
        proveedorId = nuevo.id;
      } else if (values.proveedor?.id) {
        proveedorId = values.proveedor.id;
      } else if (typeof values.proveedor === 'string') {
        const nuevo = await crearProveedor({ nombre_proveedor: values.proveedor });
        proveedorId = nuevo.id;
      } else {
        message.error('Debes seleccionar un proveedor válido');
        return;
      }

      const payload = {
        ...values,
        transportista: transportistaId,
        proveedor: proveedorId,
        fecha_numeracion: values.fecha_numeracion?.toISOString(),
        fecha_llegada: values.fecha_llegada?.toISOString(),
      };

      await actualizarDespacho(id, payload);
      message.success("Datos actualizados correctamente");
      setIsEditing(false);
      fetchDespacho(); // refresca datos actualizados
    } catch (err) {
      console.error('Error al guardar:', err);
      message.error('Error al guardar cambios');
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical">

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="dua" label="DUA" rules={[{ required: true }]}>
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="fecha_numeracion" label="Fecha Numeración">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="fecha_llegada" label="Fecha Llegada">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="carta_porte" label="Carta Porte">
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="num_factura" label="Número Factura">
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="flete_pactado" label="Flete Pactado">
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="peso_neto_crt" label="Peso Neto CRT">
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="transportista" label="Empresa de transporte">
              <SelectorTransportista disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="proveedor" label="Proveedor (del producto)">
              <SelectorProveedor disabled={!isEditing} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item>
              <Button type="primary" className='mt-7 w-full' onClick={handleEditClick} loading={loading}>
                {isEditing ? 'Guardar Cambios' : 'Editar'}
              </Button>
            </Form.Item>
          </Col>

        </Row>

      </Form>
    </div>
  );
}
