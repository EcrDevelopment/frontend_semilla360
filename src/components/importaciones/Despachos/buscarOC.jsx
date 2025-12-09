// src/components/ModalBusquedaOC.jsx
import React, { useState } from "react";
import { Modal, Table, Input, Select, Button, Form, message } from "antd";
import { nombreComercialEmpresas } from "./utils/nombreEmpresas";
import {
  buscarOC,
  createOrdenDespacho,
  updateOrdenDespacho,
  getOrCreateOC,
} from "../../../api/OrdenCompraDespacho";
import { empresaIds } from "./utils/empresaIds";


const ModalBusquedaOC = ({ despachoId, visible, onClose, onSuccess, ordenEditar }) => {
  const [step, setStep] = useState(ordenEditar ? "form" : "search");
  const [empresa, setEmpresa] = useState(Object.keys(nombreComercialEmpresas)[0]);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleBuscar = async () => {
    try {
      setLoading(true);
      const data = await buscarOC(empresa, busqueda);
      setResultados(data || []);
    } catch (err) {
      console.error(err);
      message.error("Error al buscar órdenes");
    } finally {
      setLoading(false);
    }
  };

  // función separada que llamas desde el botón "Agregar"
  const handleAgregarOC = async (record) => {
    console.log("empresa", empresa);
    try {
      // Ajusta los nombres de campos según lo que devuelve `buscarOC`
      // record debe contener al menos: numero_oc, (opcional) empresa_id, producto_id, precio_unitario, cantidad
      const payload = {
        numero_oc: record.numero_oc,
        empresa_id: empresaIds[empresa],
        producto_id: record.producto_id ?? null,
        precio_producto: record.precio_unitario ?? record.precio_unitario_unit ?? null,
        cantidad: record.cantidad ?? record.cantidad_total ?? null,
      };

      // Llamada al backend que obtiene o crea la OC en tu BD principal
      const oc = await getOrCreateOC(payload);

      console.log("OC obtenida/creada:", oc);
      // Setear el id real de la OC en la BD principal para que el form lo use
      form.setFieldsValue({
        orden_compra_id: oc.id,
        //cantidad_asignada: record.cantidad ?? 0,
      });

      setStep("form");
    } catch (err) {
      console.error(err);
      message.error("No se pudo crear/obtener la OC");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (ordenEditar) {
        // Nota: tu versión llamaba updateOrdenDespacho(ordenEditar.id, despachoId, values)
        // Asegúrate que la firma del servicio coincide. Aquí la uso tal cual en tu componente.
        await updateOrdenDespacho(ordenEditar.id, despachoId, values);
        message.success("Orden actualizada");
      } else {
        // createOrdenDespacho espera payload; en tu componente lo usabas así
        await createOrdenDespacho({ despacho: despachoId, ...values });
        message.success("Orden vinculada");
      }
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      // Validación específica: campo numero_recojo desde backend
      if (error.response?.data?.numero_recojo) {
        form.setFields([
          {
            name: "numero_recojo",
            errors: ["Ya existe una orden con ese número de recojo"],
          },
        ]);
      } else if (error.response?.data) {
        // Mostrar mensaje general con detalle del backend si existe
        const backendMsg =
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data);
        message.error(backendMsg);
      } else {
        message.error("Error en la operación");
      }
    }
  };

  return (
    <Modal
      title={ordenEditar ? "Editar Orden" : "Agregar Orden"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {step === "search" && (
        <>
          <Select
            value={empresa}
            onChange={setEmpresa}
            style={{ width: "100%", marginBottom: 8 }}
            placeholder="Seleccione empresa"
          >
            {Object.entries(nombreComercialEmpresas).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>

          <Input.Search
            placeholder="Número OC"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onSearch={handleBuscar}
            enterButton
            allowClear
          />

          <Table
            rowKey="numero_oc"
            dataSource={resultados}
            loading={loading}
            style={{ marginTop: 12 }}
            pagination={{ pageSize: 5 }}
            columns={[
              { title: "Número OC", dataIndex: "numero_oc" },
              { title: "Producto", dataIndex: "producto" },
              { title: "Proveedor", dataIndex: "proveedor" },
              {
                title: "Acción",
                render: (_, record) => (
                  <Button type="primary" onClick={() => handleAgregarOC(record)}>
                    Agregar
                  </Button>
                ),
              },
            ]}
          />
        </>
      )}

      {step === "form" && (
        <Form
          form={form}
          layout="vertical"
          initialValues={ordenEditar || { cantidad_asignada: "", numero_recojo: "" }}
          onFinish={handleSubmit}
        >
          {!ordenEditar && (
            <Form.Item name="orden_compra_id" hidden>
              <Input />
            </Form.Item>
          )}

          <Form.Item
            name="cantidad_asignada"
            label="Cantidad asignada"
            rules={[{ required: true, message: "Ingrese la cantidad" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="numero_recojo"
            label="Número de recojo"
            rules={[{ required: true, message: "Ingrese el número de recojo" }]}
          >
            <Input type="number" />
          </Form.Item>

          <div style={{ textAlign: "right" }}>
            <Button onClick={() => (ordenEditar ? onClose() : setStep("search"))}>
              Volver
            </Button>
            <Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>
              Confirmar
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default ModalBusquedaOC;
