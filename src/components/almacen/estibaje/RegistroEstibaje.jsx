import React, { useState, useEffect } from "react";
import {
  Form, Input, Button, Card, message, Select, Row, Col,
  InputNumber, Divider, Statistic, Typography, Space, Tag
} from "antd";
import { SearchOutlined, SaveOutlined, DeleteOutlined, PlusOutlined, ThunderboltOutlined, InfoCircleOutlined, RollbackOutlined } from "@ant-design/icons";

// Tus APIs
import { consultarGuia } from "../../../api/Almacen";
import { getEmpresas } from "../../../api/Empresas";
import { createRegistroEstibaje, updateRegistroEstibaje } from "../../../api/Estibaje"; // <--- IMPORTA UPDATE
import { getTiposEstibaje } from "../../../api/TipoEstibaje";
import { getAlmacenes } from "../../../api/Almacen";

const { Option } = Select;

// PROPS NUEVAS: registroEdit, onCancel, onSuccess
const RegistroEstibaje = ({ registroEdit, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  
  // Modos
  const isEditMode = !!registroEdit;

  // Estados
  const [loadingGuia, setLoadingGuia] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [tiposEstibaje, setTiposEstibaje] = useState([]);
  const [totalCosto, setTotalCosto] = useState(0);
  const [almacenes, setAlmacenes] = useState([]);
  const [motivoTraslado, setMotivoTraslado] = useState(null);

  // --- Carga Inicial de Maestros ---
  useEffect(() => {
    const loadMaestros = async () => {
      try {
        const [empRes, tiposData, almRes] = await Promise.all([
            getEmpresas(),
            getTiposEstibaje(),
            getAlmacenes({all:true, catalog:false})
        ]);
        setEmpresas(empRes.data.results || empRes.data || []);
        setAlmacenes(almRes.data.results || almRes.data || []);
        setTiposEstibaje(tiposData);

        // -- Lógica de llenado si es EDICIÓN --
        if (isEditMode) {
            console.log("Editando:", registroEdit);
            form.setFieldsValue({
                ...registroEdit,
                // Aseguramos que empresa y almacen sean IDs
                empresa: registroEdit.empresa, 
                almacen: registroEdit.almacen,
                // Mapeamos detalles para asegurar que tengan Key y ID
                detalles: registroEdit.detalles.map(d => ({
                    ...d,
                    id: d.id, // IMPORTANTE: El backend necesita esto para UPDATE
                    subtotal: d.cantidad_sacos * d.precio_unitario
                }))
            });
            setTotalCosto(registroEdit.costo_total_operacion);
            // Extraer motivo de observaciones si existe (opcional)
            if(registroEdit.observaciones && registroEdit.observaciones.includes("Motivo:")) {
                 setMotivoTraslado(registroEdit.observaciones.split("Motivo:")[1]);
            }
        } else {
            // -- Valores por defecto si es CREACIÓN --
            // Solo si las listas tienen datos
            const defEmpresa = (empRes.data.results || [])[0]?.id;
            const defAlmacen = (almRes.data.results || [])[0]?.id;
            
            form.setFieldsValue({
                tipo_documento: 'I',
                detalles: [{}],
                empresa: defEmpresa,
                almacen: defAlmacen
            });
        }

      } catch (error) {
        console.error(error);
        message.error("Error cargando datos maestros");
      }
    };
    loadMaestros();
  }, [registroEdit, form, isEditMode]); // Dependencias clave

  
  // --- LÓGICA DE BÚSQUEDA INTELIGENTE (CORREGIDA) ---
  const handleBuscarGuia = async () => {
    // 1. Obtenemos los valores del formulario (Aquí 'empresa' es el ID, ej: 15)
    const docInput = form.getFieldValue('nro_documento');
    const empresaId = form.getFieldValue('empresa');

    // Limpiamos estados previos
    setMotivoTraslado(null);

    // Validaciones básicas
    if (!docInput || !empresaId) return message.warning("Faltan datos de búsqueda");

    // 2. --- EL TRUCO: Buscar el nombre usando el ID seleccionado ---
    // Buscamos en el array de empresas la que coincida con el ID
    const empresaObj = empresas.find(e => e.id === empresaId);

    if (!empresaObj) {
      return message.error("No se pudo identificar la empresa seleccionada.");
    }

    // Extraemos el nombre que necesita la API de consulta (ej: "MAXIMILIAN_SAC")
    const nombreEmpresaParaApi = empresaObj.nombre_empresa; 
    // ----------------------------------------------------------------

    // 3. Preparamos Serie y Número
    let serie = "";
    let numero = docInput;
    if (docInput.includes("-")) {
      const partes = docInput.split("-");
      serie = partes[0];
      numero = partes[1];
    }

    setLoadingGuia(true);
    try {
      // 4. Llamamos a la API usando el NOMBRE, no el ID
      const response = await consultarGuia({ 
          empresa: nombreEmpresaParaApi, // <--- Aquí va el nombre
          grenumser: serie, 
          grenumdoc: numero 
      });
      
      const data = response.data;

      if (data && data.cabecera) {
        message.success("Datos cargados del ERP");
        setMotivoTraslado(data.cabecera.motivo_traslado);

        // Lógica para extraer placa del texto
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

        // 5. Llenamos el formulario (Mantenemos empresa/almacen como estaban)
        form.setFieldsValue({
          nro_documento: `${data.cabecera.serie}-${data.cabecera.numero}`,
          proveedor_cliente: data.cabecera.receptorrazsocial || data.cabecera.emisorrazsocial,
          transportista_nombre: data.cabecera.transportistarazsocial,
          transportista_ruc: data.cabecera.ruc_transportista,
          placa_vehiculo: placa || data.cabecera.ruc_transportista,
          producto_nombre: productoStr,
          observaciones: `Motivo: ${data.cabecera.motivo_traslado}`,
          detalles: [{ cantidad_sacos: sacosEstimados, precio_unitario: 0 }]
        });
        
        // Recalculamos totales visuales
        handleValuesChange(null, form.getFieldsValue());

      } else {
        message.info("No encontrado, ingrese manual.");
      }
    } catch (error) {
      console.log(error);
      message.warning("Error consultando ERP");
    } finally {
      setLoadingGuia(false);
    }
  };

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
      const precio = parseFloat(servicio.tarifa_por_saco || 0); 
      detalles[index].precio_unitario = precio;
      form.setFieldsValue({ detalles });
      handleValuesChange(null, form.getFieldsValue());
    }
  };

  const onFinish = async (values) => {
    setLoadingGuardar(true);
    try {
      // Validar totales
      const totalSacos = values.detalles.reduce((acc, curr) => acc + (curr.cantidad_sacos || 0), 0);
      
      const payload = {
        ...values,
        total_sacos_procesados: totalSacos,
        costo_total_operacion: parseFloat(totalCosto.toFixed(2)),
        detalles: values.detalles.map(d => ({
          id: d.id, // IMPORTANTE: Enviar ID si existe (para edición)
          tipo_estibaje: d.tipo_estibaje,
          cantidad_sacos: d.cantidad_sacos,
          precio_unitario: d.precio_unitario,
          subtotal: parseFloat((d.cantidad_sacos * d.precio_unitario).toFixed(2))
        }))
      };

      if (isEditMode) {
          // --- MODO EDICIÓN ---
          await updateRegistroEstibaje(registroEdit.id, payload);
          message.success("Operación Actualizada");
      } else {
          // --- MODO CREACIÓN ---
          await createRegistroEstibaje(payload);
          message.success("Operación Registrada");
      }

      form.resetFields();
      if (onSuccess) onSuccess(); // Volver a la tabla

    } catch (error) {
      console.error(error);
      message.error("Error al guardar. Revise los campos.");
    } finally {
      setLoadingGuardar(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: "10px" }}>
      <Space style={{marginBottom: 15}}>
        <Button icon={<RollbackOutlined />} onClick={onCancel}>Volver a la lista</Button>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        // initialValues se maneja en useEffect
      >
        <Card 
            title={
                <Space>
                    <ThunderboltOutlined /> 
                    {isEditMode ? `Editando Operación #${registroEdit.id}` : "Nueva Operación de Estibaje"}
                </Space>
            } 
            extra={<Statistic title="Costo Total" value={totalCosto} precision={2} prefix="S/." valueStyle={{ fontSize: 18, color: '#3f8600' }} />}
        >
            {/* FILA 1 */}
            <Row gutter={16}>
                <Col xs={24} md={6}>
                    <Form.Item name="empresa" label="Empresa" rules={[{required: true}]}>
                        <Select placeholder="Seleccione" options={empresas.map(e => ({ value: e.id, label: e.razon_social}))} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                    <Form.Item name="almacen" label="Almacén Operación" rules={[{required: true}]}>
                        <Select placeholder="Ubicación" options={almacenes.map(a => ({ value: a.id, label: a.almacen_nombre }))} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Movimiento" required>
                        <Space.Compact style={{ width: '100%' }}>
                            <Form.Item name="tipo_documento" noStyle rules={[{ required: true }]}>
                                <Select style={{ width: '30%' }}>
                                    <Option value="I">INGRESO</Option>
                                    <Option value="S">SALIDA</Option>
                                    <Option value="O">OTRO</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="nro_documento" noStyle rules={[{ required: true }]}>
                                <Input placeholder="Serie-Número" onPressEnter={handleBuscarGuia} suffix={<SearchOutlined onClick={handleBuscarGuia}/>} />
                            </Form.Item>
                        </Space.Compact>
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left" style={{ margin: '10px 0' }}>Detalles</Divider>

            {motivoTraslado && (
               <div style={{ marginBottom: 15 }}>
                  <Tag icon={<InfoCircleOutlined />} color="green">{motivoTraslado}</Tag>
               </div>
            )}

            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item name="producto_nombre" label="Producto" rules={[{required:true}]}>
                        <Input.TextArea rows={1} style={{ fontWeight: 'bold', color: '#1890ff' }} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={10}><Form.Item name="proveedor_cliente" label="Cliente/Prov"><Input /></Form.Item></Col>
                <Col xs={24} md={8}><Form.Item name="transportista_nombre" label="Transportista"><Input /></Form.Item></Col>
                <Col xs={12} md={6}><Form.Item name="placa_vehiculo" label="Placa"><Input style={{ backgroundColor: '#fff7e6', borderColor: '#ffa940' }} /></Form.Item></Col>
            </Row>
        </Card>

        {/* DETALLE SERVICIOS */}
        <Card style={{ marginTop: 15 }} styles={{body: {paddingTop: 10}}}>
          <Form.List name="detalles">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row key={key} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                    {/* Campos ocultos como ID para edición */}
                    <Form.Item name={[name, 'id']} hidden><Input /></Form.Item> 

                    <Col flex="auto">
                      <Form.Item {...restField} name={[name, 'tipo_estibaje']} rules={[{ required: true, message: '!' }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="Servicio..." onChange={(val) => handleServicioChange(val, index)}>
                          {tiposEstibaje.map(t => <Option key={t.id} value={t.id}>{t.nombre}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col flex="100px">
                      <Form.Item {...restField} name={[name, 'cantidad_sacos']} style={{ marginBottom: 0 }}>
                        <InputNumber placeholder="Cant." style={{ width: '100%' }} min={1} />
                      </Form.Item>
                    </Col>
                    <Col flex="120px">
                      <Form.Item {...restField} name={[name, 'precio_unitario']} style={{ marginBottom: 0 }}>
                        <InputNumber formatter={v => `S/. ${v}`} parser={v => v.replace(/S\/\.\s?|(,*)/g, '')} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col flex="none">
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Agregar Item</Button>
              </>
            )}
          </Form.List>
        </Card>

        <Form.Item style={{ marginTop: 20 }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" block loading={loadingGuardar} style={{ height: 50 }}>
            {isEditMode ? "ACTUALIZAR DATOS" : "GUARDAR OPERACIÓN"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegistroEstibaje;