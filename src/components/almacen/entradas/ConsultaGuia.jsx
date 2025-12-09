import React, { useState } from "react";
import { Form, Input, Button, Card, Table, message, Select } from "antd";
import {
    consultarGuia 
  } from "../../../api/Almacen";

const { Option } = Select;

const ConsultaGuia = () => {
  const [loading, setLoading] = useState(false);
  const [cabecera, setCabecera] = useState(null);
  const [detalles, setDetalles] = useState([]);

  const onFinish = async (values) => {
    setLoading(true);
    setCabecera(null);
    setDetalles([]);

    try {
      const response = await consultarGuia(values);
      setCabecera(response.data.cabecera);
      setDetalles(response.data.detalles);
    } catch (error) {
      message.error("No se encontraron resultados o hubo un error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Código", dataIndex: "itemcodigo", key: "itemcodigo" },
    { title: "Descripción", dataIndex: "itemdescripcion", key: "itemdescripcion" },
    { title: "Cantidad", dataIndex: "itemcantidad", key: "itemcantidad" },
    { title: "U. Medida", dataIndex: "itemumedida", key: "itemumedida" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <Card title="Consulta de Guía de Remisión">
        <Form layout="inline" onFinish={onFinish}>
          <Form.Item
            label="Empresa"
            name="empresa"
            rules={[{ required: true, message: "Seleccione la empresa" }]}
          >
            <Select placeholder="Seleccione empresa" style={{ width: 180 }}>
              <Option value="semilla">Semilla</Option>
              <Option value="maxi">Maxi</Option>
              <Option value="trading">Trading</Option>
            </Select>
          </Form.Item>          

          <Form.Item
            label="Serie"
            name="grenumser"
            rules={[{ required: true, message: "Seleccione Serie" }]}
          >
            <Select placeholder="Seleccione empresa" style={{ width: 180 }}>
              <Option value="T001">T001</Option>
              <Option value="T002">T002</Option>
              <Option value="T003">T003</Option>
              <Option value="T004">T004</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Número"
            name="grenumdoc"
            rules={[{ required: true, message: "Ingrese el número" }]}
          >
            <Input placeholder="Ej: 2618 o 0002618" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Consultar
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {cabecera && (
        <Card title="Datos generales de la Guia" style={{ marginTop: 20 }}>
          <p><b>Motivo traslado:</b> <span className="p-1 rounded-md bg-green-300">{cabecera.motivo_traslado}</span></p>
          <p><b>Emisor:</b> {cabecera.emisorrazsocial}</p>
          <p><b>Receptor:</b> {cabecera.receptorrazsocial}</p>
          <p><b>Transporte:</b> {cabecera.transportistarazsocial}</p>
            <p><b>Dirección de llegada:</b> {cabecera.llegada_direccion}        <b>Ubigeo :</b> {cabecera.llegadaubigeo}</p>
          <p></p>
          <p><b>Peso:</b> {cabecera.pesobrutototal}</p>
        </Card>
      )}

      {detalles.length > 0 && (
        <Card title="Detalles" style={{ marginTop: 20 }}>
          <Table
            dataSource={detalles}
            columns={columns}
            rowKey={(record, index) => index}
            pagination={false}
          />
        </Card>
      )}
    </div>
  );
};

export default ConsultaGuia;
