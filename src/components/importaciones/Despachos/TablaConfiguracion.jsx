import { useEffect, useState } from 'react';
import { Form, InputNumber, Button, message, Row, Col } from 'antd';
import { obtenerConfiguracionDespacho, editarConfiguracionDespacho } from '../../../api/ConfiguracionDespacho';

export default function FormularioConfiguracion({ despachoId }) {
  const [form] = Form.useForm();
  const [cargando, setCargando] = useState(false);
  const [idConfiguracion, setIdConfiguracion] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [valoresIniciales, setValoresIniciales] = useState(null);
  const [hayCambios, setHayCambios] = useState(false);

  const cargarConfiguracion = async () => {
    setCargando(true);
    try {
      const res = await obtenerConfiguracionDespacho(despachoId);
      const data = res.data;
      setIdConfiguracion(data.id);
      setValoresIniciales(data);
      form.setFieldsValue(data);
    } catch (err) {
      message.error("Error al cargar configuración");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (despachoId) {
      cargarConfiguracion();
    }
  }, [despachoId]);

  const onValuesChange = (_, allValues) => {
    const cambios = JSON.stringify(allValues) !== JSON.stringify(valoresIniciales);
    setHayCambios(cambios);
  };

  const onFinish = async (values) => {
    try {
      await editarConfiguracionDespacho(idConfiguracion, values);
      message.success("Configuración actualizada");
      setModoEdicion(false);
      setHayCambios(false);
      setValoresIniciales(values);
    } catch (err) {
      message.error("Error al guardar");
    }
  };

  const guardarConfiguracion = async () => {
    try {
      const values = await form.validateFields();
      await onFinish(values);
    } catch (error) {
      message.error("Corrige los errores antes de guardar.");
    }
  };

  const cancelarEdicion = () => {
    form.setFieldsValue(valoresIniciales);
    setModoEdicion(false);
    setHayCambios(false);
  };

  const renderItem = (name, label, precision = 2) => (
    <Col xs={24} sm={12} md={8}>
      <Form.Item
        name={name}
        label={label}
        rules={[
          { required: true, message: "Este campo es obligatorio" },
          { type: 'number', message: "Debe ser un número válido" },
          { validator: (_, value) => value >= 0 ? Promise.resolve() : Promise.reject("Debe ser un número positivo") }
        ]}
        validateTrigger="onChange"
      >
        <InputNumber
          className="w-full"
          min={0}
          precision={precision}
          disabled={!modoEdicion}
          onKeyPress={(e) => {
            if (!/[0-9.]|\./.test(e.key)) e.preventDefault();
          }}
        />
      </Form.Item>
    </Col>
  );

  return (
    <div className=''>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
      >
        <Row gutter={16}>
          {renderItem("merma_permitida", "Merma Permitida")}
          {renderItem("precio_prod", "Precio Producto", 3)}
          {renderItem("gastos_nacionalizacion", "Gastos Nacionalización")}
          {renderItem("margen_financiero", "Margen Financiero")}
          {renderItem("precio_sacos_rotos", "Precio Sacos Rotos")}
          {renderItem("precio_sacos_humedos", "Precio Sacos Húmedos")}
          {renderItem("precio_sacos_mojados", "Precio Sacos Mojados")}
          {renderItem("tipo_cambio_desc_ext", "Tipo Cambio Desc. Ext.", 3)}
        </Row>

        <div className="text-right space-x-2 mt-4">
          {!modoEdicion && (
            <Button type="primary" onClick={() => setModoEdicion(true)}>
              Editar
            </Button>
          )}
          {modoEdicion && hayCambios && (
            <>
              <Button type="primary" onClick={guardarConfiguracion} loading={cargando}>
                Guardar
              </Button>
              <Button onClick={cancelarEdicion}>
                Cancelar
              </Button>
            </>
          )}
          {modoEdicion && !hayCambios && (
            <Button onClick={cancelarEdicion}>
              Cancelar
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
