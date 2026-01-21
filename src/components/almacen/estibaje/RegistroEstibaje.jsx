import React, { useState, useEffect } from "react";
import {
  Form, Input, Button, Card, message, Select, Row, Col,
  InputNumber, Divider, Statistic, Space, Tag, DatePicker, Tooltip
} from "antd";
import { 
  SearchOutlined, SaveOutlined, LoadingOutlined, 
  DeleteOutlined, PlusOutlined, ThunderboltOutlined, 
  InfoCircleOutlined, RollbackOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";

// Tus APIs
import { consultarGuia } from "../../../api/Almacen";
import { getEmpresas } from "../../../api/Empresas";
import { createRegistroEstibaje, updateRegistroEstibaje } from "../../../api/Estibaje";
import { getTiposEstibaje } from "../../../api/TipoEstibaje";
import { getAlmacenes } from "../../../api/Almacen";

const { Option } = Select;
const { TextArea } = Input;

const RegistroEstibaje = ({ registroEdit, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const isEditMode = !!registroEdit;

  // Estados
  const [loadingGuia, setLoadingGuia] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [tiposEstibaje, setTiposEstibaje] = useState([]);
  const [totalCosto, setTotalCosto] = useState(0);
  const [almacenes, setAlmacenes] = useState([]);
  const [motivoTraslado, setMotivoTraslado] = useState(null);
  
  // --- NUEVO ESTADO: Controla si el documento seleccionado es consultable ---
  const [esGuia, setEsGuia] = useState(true); 

  // --- 1. Carga Inicial ---
  useEffect(() => {
    const loadMaestros = async () => {
      try {
        const [empRes, tiposData, almRes] = await Promise.all([
          getEmpresas(),
          getTiposEstibaje(),
          getAlmacenes({ all: true, catalog: false })
        ]);
        setEmpresas(empRes.data.results || empRes.data || []);
        setAlmacenes(almRes.data.results || almRes.data || []);
        setTiposEstibaje(tiposData);

        if (isEditMode) {
          // Detectar si es guía al cargar edición
          setEsGuia(registroEdit.tipo_documento === 'GS');
          
          form.setFieldsValue({
            ...registroEdit,
            fecha_operacion: registroEdit.fecha_operacion ? dayjs(registroEdit.fecha_operacion) : null,
            empresa: registroEdit.empresa,
            almacen: registroEdit.almacen,
            detalles: registroEdit.detalles.map(d => ({
              ...d,
              id: d.id,
              subtotal_visual: (d.cantidad_sacos * d.precio_unitario).toFixed(2)
            }))
          });
          setTotalCosto(registroEdit.costo_total_operacion);
          
          if (registroEdit.observaciones && registroEdit.observaciones.includes("Motivo:")) {
            const partes = registroEdit.observaciones.split("Motivo:");
            if (partes[1]) setMotivoTraslado(partes[1].trim());
          }
        } else {
          const defEmpresa = (empRes.data.results || [])[0]?.id;
          const defAlmacen = (almRes.data.results || [])[0]?.id;

          form.setFieldsValue({
            tipo_documento: 'GS', // GUIA por defecto
            fecha_operacion: dayjs(),
            detalles: [{}],
            empresa: defEmpresa,
            almacen: defAlmacen
          });
          setEsGuia(true);
        }
      } catch (error) {
        console.error(error);
        message.error("Error cargando datos maestros");
      }
    };
    loadMaestros();
  }, [registroEdit, form, isEditMode]);

  // --- Manejo del cambio de Tipo de Documento ---
  const handleTipoDocChange = (valor) => {
    const esTipoGuia = valor === 'GS';
    setEsGuia(esTipoGuia);
    
    // Opcional: Limpiar campos si cambia el tipo para evitar mezclar datos
    // form.setFieldsValue({ nro_documento: '', transportista_nombre: '', ... });
    
    if (!esTipoGuia) {
        setMotivoTraslado(null); // Limpiar etiquetas de guía
    }
  };

  // --- 2. Lógica Búsqueda ERP (Solo para Guías) ---
  const handleBuscarGuia = async () => {
    // Si NO es guía, no hacemos nada (o mostramos alerta)
    if (!esGuia) return;

    const docInput = form.getFieldValue('nro_documento');
    const empresaId = form.getFieldValue('empresa');

    setMotivoTraslado(null);
    if (!docInput || !empresaId) return message.warning("Seleccione Empresa e ingrese Serie-Número");

    const empresaObj = empresas.find(e => e.id === empresaId);
    if (!empresaObj) return message.error("Empresa no válida");

    let serie = "";
    let numero = docInput;
    if (docInput.includes("-")) {
      const partes = docInput.split("-");
      serie = partes[0];
      numero = partes[1];
    } else {
        return message.warning("Formato incorrecto. Use SERIE-NUMERO (Ej: T001-000123)");
    }

    setLoadingGuia(true);
    try {
      const response = await consultarGuia({
        empresa: empresaObj.nombre_empresa,
        grenumser: serie,
        grenumdoc: numero
      });
      const data = response.data;

      if (data && data.cabecera) {
        message.success("Datos ERP cargados");
        setMotivoTraslado(data.cabecera.motivo_traslado);

        let placa = "";
        const itemTexto = data.detalles.find(d => d.itemcodigo === "TEXTO");
        if (itemTexto?.itemdescripcion) {
          const match = itemTexto.itemdescripcion.match(/[A-Z0-9]{3}-[A-Z0-9]{3}/);
          if (match) placa = match[0];
        }

        const prodItem = data.detalles.find(d => d.itemcodigo !== 'TEXTO');
        const productoStr = prodItem ? prodItem.itemdescripcion : '';
        const pesoTotal = parseFloat(data.cabecera.pesobrutototal || 0);
        const sacosEstimados = pesoTotal > 0 ? Math.round(pesoTotal / 50) : 0;

        const rawFecha = data.cabecera.fecha_emision_simple;
        let fechaERP = dayjs(); 

        if (rawFecha) {
          const fechaSoloTexto = String(rawFecha).substring(0, 10);
          fechaERP = dayjs(fechaSoloTexto);
        }

        form.setFieldsValue({
          nro_documento: `${data.cabecera.serie}-${data.cabecera.numero}`,
          fecha_operacion: fechaERP,
          proveedor_cliente: data.cabecera.receptorrazsocial || data.cabecera.emisorrazsocial,
          transportista_nombre: data.cabecera.transportistarazsocial,
          transportista_ruc: data.cabecera.ruc_transportista,
          placa_vehiculo: placa || data.cabecera.ruc_transportista || '',
          producto_nombre: productoStr,
          detalles: [{
            cantidad_sacos: sacosEstimados,
            precio_unitario: 0,
            tipo_estibaje: null
          }]
        });

        handleValuesChange(null, form.getFieldsValue());

      } else {
        message.info("Guía no encontrada en ERP. Verifique o ingrese manualmente.");
      }
    } catch (error) {
      console.log(error);
      message.warning("Error consultando ERP o servicio no disponible.");
    } finally {
      setLoadingGuia(false);
    }
  };

  // ... (handleValuesChange y handleServicioChange IGUAL QUE ANTES) ...
  const handleValuesChange = (_, allValues) => {
    const detalles = allValues.detalles || [];
    let costo = 0;
    detalles.forEach(d => {
      if (d && d.cantidad_sacos && d.precio_unitario) {
        costo += (d.cantidad_sacos * d.precio_unitario);
      }
    });
    setTotalCosto(costo);
  };

  const handleServicioChange = (val, index) => {
    const servicio = tiposEstibaje.find(t => t.id === val);
    if (servicio) {
      const detalles = form.getFieldValue('detalles');
      detalles[index].precio_unitario = parseFloat(servicio.tarifa_por_saco || 0);
      form.setFieldsValue({ detalles });
      handleValuesChange(null, form.getFieldsValue());
    }
  };

  // ... (onFinish IGUAL QUE ANTES, con el try/catch robusto) ...
  const onFinish = async (values) => {
    setLoadingGuardar(true);
    try {
      const fechaOp = values.fecha_operacion ? values.fecha_operacion.format('YYYY-MM-DD') : null;
      const payload = {
        ...values,
        fecha_operacion: fechaOp,
        total_sacos_procesados: 0, 
        costo_total_operacion: 0,
        detalles: values.detalles.map(d => ({
          id: d.id,
          tipo_estibaje: d.tipo_estibaje,
          cantidad_sacos: d.cantidad_sacos,
          precio_unitario: d.precio_unitario,
          subtotal: d.cantidad_sacos * d.precio_unitario
        }))
      };

      if (isEditMode) {
        await updateRegistroEstibaje(registroEdit.id, payload);
        message.success("Registro actualizado");
      } else {
        await createRegistroEstibaje(payload);
        message.success("Registro creado");
      }
      form.resetFields();
      if (onSuccess) onSuccess(); 
    } catch (error) {
       // ... tu lógica de errores robusta de la respuesta anterior ...
       if (error.response?.data?.non_field_errors) {
            message.error(error.response.data.non_field_errors[0]);
       } else {
            message.error("Error al procesar la solicitud.");
       }
    } finally {
      setLoadingGuardar(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: "10px" }}>
      <Space style={{ marginBottom: 15 }}>
        <Button icon={<RollbackOutlined />} onClick={onCancel}>Cancelar</Button>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
      >
        <Card
          title={
            <Space>
              <ThunderboltOutlined style={{ color: '#faad14' }} />
              {isEditMode ? `Editando registro #${registroEdit.id}` : "Nuevo Registro de Estibaje"}
            </Space>
          }
          extra={
            <Statistic
              title="Costo Estimado"
              value={totalCosto}
              precision={2}
              prefix="S/."
              valueStyle={{ fontSize: 18, color: '#3f8600', fontWeight: 'bold' }}
            />
          }
        >
          {/* --- CABECERA --- */}
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="empresa" label="Empresa" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" placeholder="Seleccione" options={empresas.map(e => ({ value: e.id, label: e.razon_social }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="almacen" label="Almacén" rules={[{ required: true }]}>
                <Select placeholder="Ubicación" options={almacenes.map(a => ({ value: a.id, label: a.almacen_nombre }))} />
              </Form.Item>
            </Col>

            {/* COMPACTO PARA TIPO Y DOCUMENTO */}
            <Col xs={24} md={8}>
              <Form.Item label="Documento Referencia" required style={{ marginBottom: 0 }}>
                <Space.Compact style={{ width: '100%' }}>
                  
                  {/* SELECTOR DE TIPO */}
                  <Form.Item name="tipo_documento" noStyle rules={[{ required: true }]}>
                    <Select style={{ width: '40%' }} onChange={handleTipoDocChange}>
                      <Option value="GS">GUIA</Option>
                      <Option value="FT">FACTURA</Option>
                      <Option value="BV">BOLETA</Option>
                      <Option value="NC">NOTA CRED.</Option>
                      <Option value="OT">OTRO</Option>
                    </Select>
                  </Form.Item>

                  {/* INPUT DE NÚMERO CON/SIN LUPA */}
                  <Form.Item name="nro_documento" noStyle rules={[{ required: true, message: 'Ingrese el N°' }]}>
                    <Input
                      placeholder="Serie-Número"
                      onPressEnter={handleBuscarGuia}
                      disabled={loadingGuia} // Se bloquea si carga
                      suffix={
                        loadingGuia ? <LoadingOutlined /> : (
                            // Solo mostramos la lupa si es GUIA ('GS')
                            esGuia ? (
                                <Tooltip title="Consultar ERP">
                                    <SearchOutlined onClick={handleBuscarGuia} style={{ cursor: 'pointer', color: '#1890ff' }} />
                                </Tooltip>
                            ) : null
                        )
                      }
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                {esGuia ? "Presiona la lupa para buscar en ERP" : "Ingrese los datos manualmente"}
              </div>
            </Col>

            <Col xs={24} md={4}>
              <Form.Item name="fecha_operacion" label="Fecha Operación" rules={[{ required: true }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          {/* --- DATOS INFORMATIVOS --- */}
          {motivoTraslado && (
            <Tag icon={<InfoCircleOutlined />} color="processing" style={{ marginBottom: 15, padding: '5px 10px' }}>
              Motivo traslado: {motivoTraslado}
            </Tag>
          )}

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="producto_nombre" label="Producto" rules={[{ required: true }]}>
                <Input style={{ fontWeight: '500', color: '#10239e' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={10}><Form.Item name="proveedor_cliente" label="Cliente/Proveedor"><Input /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="transportista_nombre" label="Transportista"><Input /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="transportista_ruc" label="RUC Transportista"><Input /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item name="placa_vehiculo" label="Placa Vehículo"><Input /></Form.Item></Col>
          </Row>

          <Row>
            <Col span={24}>
              <Form.Item name="observaciones" label="Observaciones">
                <TextArea rows={2} placeholder="Notas adicionales..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* --- DETALLES (ITEMS) --- */}
        <Card style={{ marginTop: 15 }} title="Detalle de Servicios" size="small">
          <Form.List name="detalles">
            {(fields, { add, remove }) => (
              <>
                {/* Cabecera visual de la tabla */}
                <Row gutter={12} style={{ fontWeight: 'bold', marginBottom: 5, paddingLeft: 10 }}>
                  <Col flex="auto">Tipo de Servicio</Col>
                  <Col flex="100px">Cant. Sacos</Col>
                  <Col flex="100px">P. Unit (S/)</Col>
                  <Col flex="100px" style={{ textAlign: 'right' }}>Subtotal</Col>
                  <Col flex="40px"></Col>
                </Row>

                {fields.map(({ key, name, ...restField }, index) => {
                  // Cálculo visual por fila (usando watch o getFieldValue)
                  const rowVals = form.getFieldValue(['detalles', name]) || {};
                  const subVisual = (rowVals.cantidad_sacos || 0) * (rowVals.precio_unitario || 0);

                  return (
                    <Row key={key} gutter={12} align="middle" style={{ marginBottom: 8, background: '#fafafa', padding: 5, borderRadius: 6, border: '1px solid #f0f0f0' }}>
                      <Form.Item name={[name, 'id']} hidden><Input /></Form.Item>

                      <Col flex="auto">
                        <Form.Item {...restField} name={[name, 'tipo_estibaje']} rules={[{ required: true, message: 'Requerido' }]} style={{ marginBottom: 0 }}>
                          <Select placeholder="Seleccione servicio..." onChange={(val) => handleServicioChange(val, index)}>
                            {tiposEstibaje.map(t => <Option key={t.id} value={t.id}>{t.nombre}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col flex="100px">
                        <Form.Item {...restField} name={[name, 'cantidad_sacos']} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="0" min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>

                      <Col flex="100px">
                        <Form.Item {...restField} name={[name, 'precio_unitario']} style={{ marginBottom: 0 }}>
                          <InputNumber min={0} step={0.10} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>

                      <Col flex="100px" style={{ textAlign: 'right', fontWeight: 'bold', color: '#555' }}>
                        {/* Columna visual de Subtotal */}
                        S/. {subVisual.toFixed(2)}
                      </Col>

                      <Col flex="40px" style={{ textAlign: 'center' }}>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      </Col>
                    </Row>
                  );
                })}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>
                  Agregar Servicio
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Form.Item style={{ marginTop: 20 }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" block loading={loadingGuardar} style={{ height: 50, fontSize: 16 }}>
            {isEditMode ? "GUARDAR CAMBIOS" : "REGISTRAR OPERACIÓN"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegistroEstibaje;