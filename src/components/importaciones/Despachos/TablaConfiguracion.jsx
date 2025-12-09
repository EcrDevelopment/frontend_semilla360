import { useEffect, useState, useCallback } from 'react'; // 1. Importar useCallback
import PropTypes from 'prop-types'; // 2. Importar PropTypes
import { Form, InputNumber, Button, message, Row, Col } from 'antd';
import {
  obtenerConfiguracionDespacho,
  editarConfiguracionDespacho,
} from '../../../api/ConfiguracionDespacho';

export default function FormularioConfiguracion({ despachoId }) {
  const [form] = Form.useForm();
  const [cargando, setCargando] = useState(false);
  const [idConfiguracion, setIdConfiguracion] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [valoresIniciales, setValoresIniciales] = useState(null);
  const [hayCambios, setHayCambios] = useState(false);

  // 3. Memoizar todas las funciones
  const cargarConfiguracion = useCallback(async () => {
    setCargando(true);
    try {
      const res = await obtenerConfiguracionDespacho(despachoId);
      const data = res.data;
      setIdConfiguracion(data.id);
      setValoresIniciales(data);

      const datosNumericos = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value !== null && value !== undefined ? Number(value) : value,
        ]),
      );

      form.setFieldsValue(datosNumericos);
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      message.error('Error al cargar configuración');
    } finally {
      setCargando(false);
    }
  }, [despachoId, form]); // Dependencias: despachoId y form

  // 4. Corregir el array de dependencias del useEffect
  useEffect(() => {
    if (despachoId) {
      cargarConfiguracion();
    }
  }, [despachoId, cargarConfiguracion]); // Añadir la función memoizada

  const onValuesChange = useCallback(
    (_, allValues) => {
      // Usamos los valores iniciales del estado para comparar
      const cambios =
        JSON.stringify({ ...valoresIniciales, ...allValues }) !==
        JSON.stringify(valoresIniciales);
      setHayCambios(cambios);
    },
    [valoresIniciales], // Depende del estado 'valoresIniciales'
  );

  const onFinish = useCallback(
    async (values) => {
      console.log('✅ onFinish ejecutado con:', values);
      try {
        await editarConfiguracionDespacho(idConfiguracion, values);
        message.success('Configuración actualizada');
        setModoEdicion(false);
        setHayCambios(false);
        setValoresIniciales(values); // Actualizar los valores iniciales post-guardado
      } catch (err) {
        console.error('❌ Error en onFinish:', err);
        message.error('Error al guardar');
      }
    },
    [idConfiguracion], // Depende del idConfiguracion
  );

  const guardarConfiguracion = useCallback(async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      console.log('✅ Valores validados:', values);
      await onFinish(values); // Llama a la función memoizada
    } catch (error) {
      console.error('❌ Error en validación:', error);
      message.error('Corrige los errores antes de guardar.');
    }
  }, [form, onFinish]); // Depende de form y onFinish

  const cancelarEdicion = useCallback(() => {
    form.setFieldsValue(valoresIniciales); // Restaura los valores
    setModoEdicion(false);
    setHayCambios(false);
  }, [form, valoresIniciales]); // Depende de form y valoresIniciales

  const iniciarEdicion = useCallback(() => {
    setModoEdicion(true);
  }, []); // Sin dependencias

  // 5. Extraer y memoizar helpers para renderItem
  const handleInputKeyDown = useCallback((e) => {
    // Previene la entrada de teclas no numéricas, pero permite control (Backspace, Tab, Arrows)
    if (
      !/[0-9.]/.test(e.key) &&
      !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', 'Enter'].includes(
        e.key,
      )
    ) {
      e.preventDefault();
    }
  }, []); // Sin dependencias

  const validatePositiveNumber = useCallback((_, value) => {
    if (value === undefined || value === null || value === '') {
      return Promise.reject('Este campo es obligatorio');
    }
    const numero = Number(value);
    if (isNaN(numero)) {
      return Promise.reject('Debe ser un número válido');
    }
    if (numero < 0) {
      return Promise.reject('Debe ser un número positivo');
    }
    return Promise.resolve();
  }, []); // Sin dependencias

  // 6. Memoizar la función de renderizado 'renderItem'
  const renderItem = useCallback(
    (name, label, precision = 2) => (
      <Col xs={24} sm={12} md={8} key={name}>
        <Form.Item
          name={name}
          label={label}
          rules={[
            {
              required: true,
              message: 'Este campo es obligatorio',
            },
            {
              validator: validatePositiveNumber, // Usar helper memoizado
            },
          ]}
          validateTrigger="onChange"
        >
          <InputNumber
            className="w-full"
            min={0}
            precision={precision}
            disabled={!modoEdicion}
            onKeyDown={handleInputKeyDown} // Usar helper memoizado
          />
        </Form.Item>
      </Col>
    ),
    [modoEdicion, handleInputKeyDown, validatePositiveNumber], // Depende de modoEdicion y los helpers
  );

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish} // Usar función memoizada
        onValuesChange={onValuesChange} // Usar función memoizada
      >
        <Row gutter={16}>
          {renderItem('merma_permitida', 'Merma Permitida')}
          {renderItem('precio_prod', 'Precio Producto', 5)}
          {renderItem('gastos_nacionalizacion', 'Gastos Nacionalización')}
          {renderItem('margen_financiero', 'Margen Financiero')}
          {renderItem('precio_sacos_rotos', 'Precio Sacos Rotos')}
          {renderItem('precio_sacos_humedos', 'Precio Sacos Húmedos')}
          {renderItem('precio_sacos_mojados', 'Precio Sacos Mojados')}
          {renderItem('tipo_cambio_desc_ext', 'Tipo Cambio Desc. Ext.', 3)}
          {renderItem('precio_estiba', 'Precio Estiba x TM')}
        </Row>

        <div className="text-right space-x-2 mt-4">
          {/* 7. Usar los handlers memoizados en los botones */}
          {!modoEdicion && (
            <Button type="primary" onClick={iniciarEdicion}>
              Editar
            </Button>
          )}
          {modoEdicion && hayCambios && (
            <>
              <Button
                type="primary"
                onClick={guardarConfiguracion}
                loading={cargando}
              >
                Guardar
              </Button>
              <Button onClick={cancelarEdicion}>Cancelar</Button>
            </>
          )}
          {modoEdicion && !hayCambios && (
            <Button onClick={cancelarEdicion}>Cancelar</Button>
          )}
        </div>
      </Form>
    </div>
  );
}

// 8. Añadir PropTypes
FormularioConfiguracion.propTypes = {
  despachoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};