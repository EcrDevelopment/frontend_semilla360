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

      // ✅ Convertir todos los valores a number si no son nulos
      const datosNumericos = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value !== null && value !== undefined ? Number(value) : value,
        ])
      );

      form.setFieldsValue(datosNumericos);
    } catch (err) {
      console.error("Error al cargar configuración:", err);
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
    const cambios = JSON.stringify({ ...valoresIniciales, ...allValues }) !== JSON.stringify(valoresIniciales);
    setHayCambios(cambios);
  };

  const onFinish = async (values) => {
    console.log("✅ onFinish ejecutado con:", values);
    try {
      await editarConfiguracionDespacho(idConfiguracion, values);
      message.success("Configuración actualizada");
      setModoEdicion(false);
      setHayCambios(false);
      setValoresIniciales(values);
    } catch (err) {
      console.error("❌ Error en onFinish:", err);
      message.error("Error al guardar");
    }
  };

  const guardarConfiguracion = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      console.log("✅ Valores validados:", values);
      await onFinish(values);
    } catch (error) {
      console.error("❌ Error en validación:", error);
      message.error("Corrige los errores antes de guardar.");
    }
  };

  const cancelarEdicion = () => {
    form.setFieldsValue(valoresIniciales);
    setModoEdicion(false);
    setHayCambios(false);
  };

  const renderItem = (name, label, precision = 2) => (
    <Col xs={24} sm={12} md={8} key={name}>
      <Form.Item
        name={name}
        label={label}
        rules={[
          {
            required: true,
            message: "Este campo es obligatorio",
          },
          {
            validator: (_, value) => {
              if (value === undefined || value === null || value === '') {
                return Promise.reject("Este campo es obligatorio");
              }
              const numero = Number(value);
              if (isNaN(numero)) {
                return Promise.reject("Debe ser un número válido");
              }
              if (numero < 0) {
                return Promise.reject("Debe ser un número positivo");
              }
              return Promise.resolve();
            },
          },
        ]}
        validateTrigger="onChange"
      >
        <InputNumber
          className="w-full"
          min={0}
          precision={precision}
          disabled={!modoEdicion}
          onKeyDown={(e) => {
            if (!/[0-9.]|\./.test(e.key)) e.preventDefault();
          }}
        />
      </Form.Item>
    </Col>
  );

  return (
    <div>
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
          {renderItem("precio_estiba", "Precio Estiba x TM")}
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
