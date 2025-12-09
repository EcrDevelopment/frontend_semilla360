import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Select } from 'antd';

const opcionesEstiba = [
  "Seleccione",
  "Transbordo",
  "Pago estiba",
  "No pago estiba",
  "Pago parcial",
];

export default function FormularioDetalle({ despachoId, detalle, onGuardado }) {
  const [form] = Form.useForm();
  const [habilitarCantDesc, setHabilitarCantDesc] = useState(false);

  useEffect(() => {
    if (detalle) {
      form.setFieldsValue(detalle);
      setHabilitarCantDesc(detalle.pago_estiba === "Pago parcial");
    } else {
      form.resetFields();
      setHabilitarCantDesc(false);
    }
  }, [detalle]);

  const calcularMerma = () => {
    const { peso_salida, peso_llegada } = form.getFieldsValue();
    if (peso_salida !== undefined && peso_llegada !== undefined) {
      const merma = parseFloat(peso_llegada) - parseFloat(peso_salida);
      form.setFieldsValue({ merma: merma.toFixed(2) });
    }
  };

  const onValuesChange = (changedValues) => {
    if (changedValues.peso_salida !== undefined || changedValues.peso_llegada !== undefined) {
      calcularMerma();
    }

    if (changedValues.pago_estiba !== undefined) {
      const esParcial = changedValues.pago_estiba === "Pago parcial";
      setHabilitarCantDesc(esParcial);
      if (!esParcial) {
        form.setFieldsValue({ cant_desc: 0 });
      }
    }
  };

  const onFinish = (values) => {
    const payload = {
      ...values,
      despacho: despachoId,
    };
    onGuardado(payload, detalle?.id);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={onValuesChange}
      initialValues={{ cant_desc: 0 }}
    >
      <Form.Item name="placa_salida" label="Placa Salida" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="sacos_cargados" label="Sacos Cargados" rules={[{ required: true }]}>
        <InputNumber min={0} className="w-full" />
      </Form.Item>
      <Form.Item name="peso_salida" label="Peso Salida" rules={[{ required: true }]}>
        <InputNumber min={0} className="w-full" />
      </Form.Item>
      <Form.Item name="placa_llegada" label="Placa Llegada" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="sacos_descargados" label="Sacos Descargados" rules={[{ required: true }]}>
        <InputNumber min={0} className="w-full" />
      </Form.Item>
      <Form.Item name="peso_llegada" label="Peso Llegada" rules={[{ required: true }]}>
        <InputNumber min={0} className="w-full" />
      </Form.Item>

      <Form.Item name="merma" label="Merma">
        <Input disabled />
      </Form.Item>

      <Form.Item name="sacos_faltantes" label="Sacos Faltantes">
        <InputNumber min={0} className="w-full" />
      </Form.Item>
      <Form.Item name="sacos_rotos" label="Sacos Rotos">
        <InputNumber min={0} className="w-full" />
      </Form.Item>
      <Form.Item name="sacos_humedos" label="Sacos Húmedos">
        <InputNumber min={0} className="w-full" />
      </Form.Item>
      <Form.Item name="sacos_mojados" label="Sacos Mojados">
        <InputNumber min={0} className="w-full" />
      </Form.Item>

      <Form.Item name="pago_estiba" label="Pago Estiba">
        <Select>
          {opcionesEstiba.map((opcion) => (
            <Select.Option key={opcion} value={opcion === "Seleccione" ? "" : opcion}>
              {opcion}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="cant_desc" label="Sacos x pagar">
        <InputNumber min={0} disabled={!habilitarCantDesc} className="w-full" />
      </Form.Item>

      <div className="text-right">
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </div>
    </Form>
  );
}
