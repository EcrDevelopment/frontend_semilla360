import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Button,
  message,
  Space, // Importar Space para los botones
} from 'antd';
import SelectorTransportista from './SelectorTransportista';
import SelectorProveedor from './SelectorProveedor';
import {
  obtenerDespacho,
  actualizarDespacho,
  crearTransportista,
  crearProveedor,
} from '../../../api/Despachos';
import dayjs from 'dayjs';

// Helper para formatear los datos que se cargarán en el formulario
const formatDataForForm = (data) => ({
  ...data,
  fecha_numeracion: data.fecha_numeracion
    ? dayjs(data.fecha_numeracion, 'DD/MM/YYYY')
    : null,
  fecha_llegada: data.fecha_llegada
    ? dayjs(data.fecha_llegada, 'DD/MM/YYYY')
    : null,
});

export default function SeccionGeneral({ id }) {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(true); // Carga de datos
  const [loadingSave, setLoadingSave] = useState(false); // Guardado de datos
  const [initialData, setInitialData] = useState(null);
  const [isDirty, setIsDirty] = useState(false); // Estado para rastrear cambios

  // 1. Carga de datos memoizada
  const fetchDespacho = useCallback(async () => {
    setLoadingFetch(true);
    try {
      const response = await obtenerDespacho(id);
      setInitialData(response);
    } catch (error) {
      console.error('Error al obtener datos:', error);
      message.error(error.message || 'Error al obtener datos del despacho');
    } finally {
      setLoadingFetch(false);
    }
  }, [id]); // Depende solo de 'id'

  // 2. Efecto para cargar datos (con dependencia correcta)
  useEffect(() => {
    if (id) {
      fetchDespacho();
    }
  }, [id, fetchDespacho]); // Ahora incluye fetchDespacho

  // 3. Efecto para rellenar el formulario cuando los datos iniciales cambian
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(formatDataForForm(initialData));
      setIsDirty(false); // Resetea el estado 'dirty' al cargar datos
    }
  }, [initialData, form]);

  // 4. Handler para guardar/editar
  const handleEditSave = useCallback(async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // Si está en modo edición pero no hay cambios, solo salir del modo edición
    if (!isDirty) {
      setIsEditing(false);
      message.info('No hay cambios para guardar');
      return;
    }

    setLoadingSave(true);
    try {
      const values = await form.validateFields();

      // --- Lógica de creación de Transportista ---
      let transportistaId = null;
      if (values.transportista?.isNuevo) {
        const nuevo = await crearTransportista({
          nombre_transportista: values.transportista.nombre_transportista,
        });
        transportistaId = nuevo.id;
      } else if (values.transportista?.id) {
        transportistaId = values.transportista.id;
      } else if (typeof values.transportista === 'string') {
        const nuevo = await crearTransportista({
          nombre_transportista: values.transportista,
        });
        transportistaId = nuevo.id;
      } else {
        message.error('Debes seleccionar un transportista válido');
        setLoadingSave(false);
        return;
      }

      // --- Lógica de creación de Proveedor ---
      let proveedorId = null;
      if (values.proveedor?.isNuevo) {
        const nuevo = await crearProveedor({
          nombre_proveedor: values.proveedor.nombre_proveedor,
        });
        proveedorId = nuevo.id;
      } else if (values.proveedor?.id) {
        proveedorId = values.proveedor.id;
      } else if (typeof values.proveedor === 'string') {
        const nuevo = await crearProveedor({
          nombre_proveedor: values.proveedor,
        });
        proveedorId = nuevo.id;
      } else {
        message.error('Debes seleccionar un proveedor válido');
        setLoadingSave(false);
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
      message.success('Datos actualizados correctamente');
      setIsEditing(false);
      setIsDirty(false);
      fetchDespacho(); // Refresca datos actualizados
    } catch (err) {
      console.error('Error al guardar:', err);
      message.error('Error al guardar cambios');
    } finally {
      setLoadingSave(false);
    }
  }, [isEditing, isDirty, form, id, fetchDespacho]);

  // 5. Handler para cancelar la edición
  const handleCancel = useCallback(() => {
    if (initialData) {
      form.setFieldsValue(formatDataForForm(initialData)); // Restaura el formulario
    }
    setIsEditing(false);
    setIsDirty(false);
  }, [form, initialData]);

  // 6. Handler para detectar cambios en el formulario
  const handleValuesChange = useCallback(() => {
    setIsDirty(true);
  }, []); // Solo necesita establecer 'isDirty' a true

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange} // 7. Conectar el handler de cambios
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="dua" label="DUA" rules={[{ required: true }]}>
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="fecha_numeracion" label="Fecha Numeración">
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                disabled={!isEditing}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="fecha_llegada" label="Fecha Llegada">
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                disabled={!isEditing}
              />
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
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: '100%' }}
                disabled={!isEditing}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="peso_neto_crt" label="Peso Neto CRT">
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: '100%' }}
                disabled={!isEditing}
              />
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

          {/* 8. Lógica de botones actualizada */}
          <Col xs={24}>
            <Form.Item>
              <Space>
                {!isEditing && (
                  <Button
                    type="primary"
                    onClick={handleEditSave}
                    loading={loadingFetch} // Muestra carga si los datos aún no llegan
                  >
                    Editar
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button
                      type="primary"
                      onClick={handleEditSave}
                      loading={loadingSave} // Muestra carga al guardar
                      disabled={!isDirty} // Deshabilitado si no hay cambios
                    >
                      Guardar Cambios
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={loadingSave} // Deshabilitado mientras se guarda
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

// 9. Añadir PropTypes
SeccionGeneral.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};