import React from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Space } from 'antd';

const DynamicFields = () => {
  return (
    <Form.List name="otrosGastos">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <Space
              key={key}
              style={{ display: 'flex', marginBottom: 8 }}
              align="baseline"
            >
              {/* Campo de descripción */}
              <Form.Item
                {...restField}
                name={[name, 'descripcion']}
                rules={[{ required: true, message: 'Ingrese la descripción' }]}
              >
                <Input placeholder="Descripción" />
              </Form.Item>

              {/* Campo de monto (float) */}
              <Form.Item
                {...restField}
                name={[name, 'monto']}
                rules={[{ required: true, message: 'Ingrese un monto válido' }]}
              >
                <InputNumber placeholder="Monto" style={{ width: 120 }} />
              </Form.Item>

              {/* Botón para eliminar */}
              <MinusCircleOutlined onClick={() => remove(name)} />
            </Space>
          ))}

          {/* Botón para agregar un nuevo campo */}
          <div className='w-4/12'>
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Agregar Gasto
              </Button>
            </Form.Item>
          </div>
        </>
      )}
    </Form.List>
  );
};

export default DynamicFields;
