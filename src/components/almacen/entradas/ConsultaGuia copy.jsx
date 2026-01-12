import React, { useState, useEffect } from "react";
import {
  Form, Input, Button, Card, message, Select, Row, Col,
  InputNumber, Divider, Statistic, Typography, Space,
  Tag // <--- USAMOS TAG EN LUGAR DE BADGE PARA TEXTO
} from "antd";
import { SearchOutlined, SaveOutlined, DeleteOutlined, PlusOutlined, ThunderboltOutlined, InfoCircleOutlined } from "@ant-design/icons";

// Tus APIs
import { consultarGuia } from "../../../api/Almacen";
import { getEmpresas } from "../../../api/Empresas";
import { createRegistroEstibaje } from "../../../api/Estibaje";
import { getTiposEstibaje } from "../../../api/TipoEstibaje";
import { getAlmacenes } from "../../../api/Almacen";

const { Title } = Typography;

const { Option } = Select;

const RegistroEstibaje = () => {
  const [form] = Form.useForm();

  // Estados
  const [loadingGuia, setLoadingGuia] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [tiposEstibaje, setTiposEstibaje] = useState([]);
  const [totalCosto, setTotalCosto] = useState(0);
  const [almacenes, setAlmacenes] = useState([]);

  // --- NUEVO ESTADO PARA EL MOTIVO ---
  const [motivoTraslado, setMotivoTraslado] = useState(null);

  // --- Carga Inicial ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // AGREGAMOS getAlmacenes AL PROMISE.ALL
        const [empRes, tiposData, almRes] = await Promise.all([
          getEmpresas(),
          getTiposEstibaje(),
          getAlmacenes({all:true,catalog:false})
        ]);

        const listaEmpresas = empRes.data.results || empRes.data || [];
        setEmpresas(listaEmpresas);

        // Manejo de Almacenes
        const listaAlmacenes = almRes.data.results || almRes.data || [];
        setAlmacenes(listaAlmacenes);

        setTiposEstibaje(tiposData);

        // Pre-selecciones
        const valoresIniciales = {};
        if (listaEmpresas.length > 0) valoresIniciales.empresa = listaEmpresas[0].id;

        // Si hay almacenes, preselecciona el primero (opcional)
        if (listaAlmacenes.length > 0) valoresIniciales.almacen = listaAlmacenes[0].id;

        form.setFieldsValue(valoresIniciales);

      } catch (error) {
        console.error(error);
        message.error("Error inicializando datos");
      }
    };
    fetchData();
  }, []);

  // --- LÓGICA DE BÚSQUEDA INTELIGENTE ---
  const handleBuscarGuia = async () => {
    const docInput = form.getFieldValue('nro_documento');
    const empresaId = form.getFieldValue('empresa');

    // Limpiamos el motivo anterior al buscar uno nuevo
    setMotivoTraslado(null);

    if (!docInput || !empresaId) return message.warning("Faltan datos de búsqueda");

    let serie = "";
    let numero = docInput;
    if (docInput.includes("-")) {
      const partes = docInput.split("-");
      serie = partes[0];
      numero = partes[1];
    }

    setLoadingGuia(true);
    try {
      const response = await consultarGuia({ empresa: empresaId, grenumser: serie, grenumdoc: numero });
      const data = response.data;

      if (data && data.cabecera) {
        message.success("Datos cargados del ERP");

        // --- CAPTURAR MOTIVO PARA EL BADGE/TAG ---
        setMotivoTraslado(data.cabecera.motivo_traslado);

        // --- LÓGICA DE EXTRACCIÓN MEJORADA ---
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

  // --- Cálculos de Totales ---
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
    // 1. Buscar el objeto completo en el array usando el ID seleccionado
    const servicio = tiposEstibaje.find(t => t.id === val);

    if (servicio) {
      console.log("Servicio seleccionado:", servicio); // Para depurar

      // 2. Obtenemos la lista actual de detalles del formulario
      const detalles = form.getFieldValue('detalles');

      // 3. Actualizamos el precio de la fila específica
      // ASEGÚRATE que tu modelo backend tenga el campo 'tarifa_por_saco'
      // Si en tu backend se llama 'precio', cámbialo aquí.
      const precio = parseFloat(servicio.tarifa_por_saco || 0);

      detalles[index].precio_unitario = precio;

      // 4. Si quieres calcular el subtotal ahí mismo (opcional visualmente)
      const cantidad = detalles[index].cantidad_sacos || 0;
      // detalles[index].subtotal = cantidad * precio; // Si tuvieras campo subtotal

      // 5. Impactamos los cambios en el formulario
      form.setFieldsValue({ detalles });

      // 6. Recalculamos el total general
      handleValuesChange(null, form.getFieldsValue());
    }
  };

  const onFinish = async (values) => {
    setLoadingGuardar(true);
    try {
      const payload = {
        ...values,
        costo_total_operacion: parseFloat(totalCosto.toFixed(2)), 
        
        // CORRECCIÓN OPCIONAL: Asegurar que el total de sacos sea entero
        total_sacos_procesados: parseInt(values.detalles.reduce((acc, curr) => acc + (curr.cantidad_sacos || 0), 0)),
        
        detalles: values.detalles.map(d => ({
          tipo_estibaje: d.tipo_estibaje,
          cantidad_sacos: d.cantidad_sacos,
          precio_unitario: d.precio_unitario,
          // Validar subtotal también por si acaso
          subtotal: parseFloat((d.cantidad_sacos * d.precio_unitario).toFixed(2))
        }))
      };

      await createRegistroEstibaje(payload);
      message.success("Registro Guardado");
      form.resetFields();
      setTotalCosto(0);
      setMotivoTraslado(null); // Limpiar motivo al guardar
    } catch (error) {
      message.error("Error al guardar");
    } finally {
      setLoadingGuardar(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: "20px" }}>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        initialValues={{ tipo_documento: 'I', detalles: [{}] }}
      >

        <Card
          title={<Space><ThunderboltOutlined /> Registro Operativo de Estibaje</Space>}
          extra={<Statistic title="Costo Total" value={totalCosto} precision={2} prefix="S/." valueStyle={{ fontSize: 18, color: '#3f8600' }} />}
        >
          {/* FILA 1: BÚSQUEDA */}
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="empresa" label="Empresa" rules={[{ required: true }]}>
                <Select placeholder="Seleccione" options={empresas.map(e => ({ value: e.id, label: e.razon_social }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={18}>
              <Form.Item label="Tipo Mov." rules={[{ required: true }]}>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="tipo_documento" noStyle rules={[{ required: true }]}>
                    <Select style={{ width: '20%' }} options={[{ value: 'S', label: 'Salida' }, { value: 'I', label: 'Ingreso' }]} />
                  </Form.Item>
                  <Form.Item name="nro_documento" noStyle rules={[{ required: true }]}>
                    <Input placeholder="Serie-Número (Ej: T001-2168)" onPressEnter={handleBuscarGuia} />
                  </Form.Item>
                  <Button type="primary" icon={<SearchOutlined />} loading={loadingGuia} onClick={handleBuscarGuia}>Buscar</Button>
                </Space.Compact>
              </Form.Item>
            </Col>
          </Row>

          <Col xs={24} md={12}>
            <Form.Item name="almacen" label="Almacén Operación" rules={[{ required: true, message: 'Requerido' }]}>
              <Select
                placeholder="¿Dónde se realiza?"
                options={almacenes.map(a => ({ value: a.id, label: a.almacen_nombre}))}
              />
            </Form.Item>
          </Col>

          <Divider orientation="left" style={{ margin: '10px 0' }}>Detalle de la Carga</Divider>

          {/* --- SECCIÓN DEL MOTIVO (TAG) --- */}
          {motivoTraslado && (
            <div style={{ marginBottom: 20 }}>
              <Space align="center">

                <Tag icon={<InfoCircleOutlined />} color="green" style={{ fontSize: 14, padding: '4px 10px' }}>
                  {motivoTraslado.toUpperCase()}
                </Tag>
              </Space>
            </div>
          )}

          {/* FILA 2: PRODUCTO */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="producto_nombre" label="Producto / Mercadería" rules={[{ required: true }]}>
                <Input.TextArea
                  rows={1}
                  placeholder="Descripción del producto..."
                  style={{ fontWeight: 'bold', color: '#1890ff' }}
                />
              </Form.Item>
            </Col>
          </Row>



          {/* FILA 3: ACTORES Y VEHICULO */}
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item name="proveedor_cliente" label="Cliente / Proveedor">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="transportista_nombre" label="Transportista">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="placa_vehiculo" label="Placa Vehículo">
                <Input style={{ backgroundColor: '#fff7e6', borderColor: '#ffa940' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* --- TARJETA DE SERVICIOS --- */}
        <Card style={{ marginTop: 15 }} styles={{ paddingTop: 10 }}>
          <Form.List name="detalles">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row key={key} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                    <Col flex="auto">
                      <Form.Item {...restField} name={[name, 'tipo_estibaje']} rules={[{ required: true, message: '!' }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="Actividad realizada..." onChange={(val) => handleServicioChange(val, index)}>
                          {tiposEstibaje.map(t => <Option key={t.id} value={t.id}>{t.nombre}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col flex="100px">
                      <Form.Item {...restField} name={[name, 'cantidad_sacos']} style={{ marginBottom: 0 }}>
                        <InputNumber placeholder="Sacos" style={{ width: '100%' }} min={1} />
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
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 5 }}>
                  Agregar otra actividad
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Form.Item style={{ marginTop: 20 }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" block loading={loadingGuardar} style={{ height: 50, fontSize: 18 }}>
            GUARDAR OPERACIÓN
          </Button>
        </Form.Item>

      </Form>
    </div>
  );
};

export default RegistroEstibaje;