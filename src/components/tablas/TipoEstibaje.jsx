import React, { useState, useEffect } from "react";
import { 
  Table, Button, Modal, Form, Input, InputNumber, 
  Select, message, Card, Row, Col, Tag, Popconfirm 
} from "antd";
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  DollarOutlined, AppstoreAddOutlined 
} from "@ant-design/icons";

// IMPORTAMOS SOLO LOS SERVICIOS NECESARIOS
import { 
  getTiposEstibaje, 
  createTipoEstibaje, 
  updateTipoEstibaje, 
  deleteTipoEstibaje 
} from "../../api/TipoEstibaje";

const { Option } = Select;

const GestionTiposEstibaje = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  
  const EMPRESA_ID_DEFAULT = 1; // Ajustar según tu contexto de usuario real

  // --- 1. CARGAR DATOS (Ahora usa el servicio) ---
  const fetchTipos = async () => {
    setLoading(true);
    try {
      const data = await getTiposEstibaje();
      setTipos(data);
    } catch (error) {
      message.error("Error al cargar el catálogo de servicios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  // --- 2. MANEJO DEL MODAL ---
  const showModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
      form.setFieldsValue({ 
        empresa: EMPRESA_ID_DEFAULT, 
        accion: 'DESCARGA', 
        tarifa_por_saco: 0 
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingItem(null);
    form.resetFields();
  };

  // --- 3. GUARDAR (Usa create o update del servicio) ---
  const onFinish = async (values) => {
    try {
      if (editingItem) {
        await updateTipoEstibaje(editingItem.id, values);
        message.success("Servicio actualizado correctamente");
      } else {
        await createTipoEstibaje(values);
        message.success("Servicio creado correctamente");
      }
      setIsModalVisible(false);
      fetchTipos(); // Recargar tabla
    } catch (error) {
      // El error ya se loguea en el servicio, aquí solo mostramos feedback visual
      message.error("Error al guardar la operación.");
    }
  };

  // --- 4. ELIMINAR (Usa delete del servicio) ---
  const handleDelete = async (id) => {
    try {
      await deleteTipoEstibaje(id);
      message.success("Servicio eliminado");
      fetchTipos();
    } catch (error) {
      message.error("No se pudo eliminar el servicio.");
    }
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      render: text => <Tag color="geekblue">{text}</Tag>
    },
    {
      title: 'Nombre del Servicio',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Acción (Sistema)',
      dataIndex: 'accion',
      key: 'accion',
      width: 150,
      render: (text) => {
        const colors = {
            'DESCARGA': 'green',
            'CARGA': 'orange',
            'TRASBORDO': 'purple',
            'REESTIBA': 'cyan'
        };
        return <Tag color={colors[text] || 'default'}>{text}</Tag>;
      }
    },
    {
      title: 'Tarifa (Saco)',
      dataIndex: 'tarifa_por_saco',
      key: 'tarifa_por_saco',
      width: 120,
      align: 'right',
      render: (val) => <span style={{fontWeight:'bold'}}>S/. {parseFloat(val).toFixed(2)}</span>
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <>
          <Button 
            icon={<EditOutlined />} 
            type="text" 
            onClick={() => showModal(record)} 
            style={{ color: '#1890ff' }}
          />
          <Popconfirm 
            title="¿Eliminar este servicio?" 
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} type="text" danger />
          </Popconfirm>
        </>
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Card 
        title={<><AppstoreAddOutlined /> Catálogo de Servicios de Estibaje</>}
        extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(null)}>
                Nuevo Servicio
            </Button>
        }
        bordered={false}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        <Table 
            columns={columns} 
            dataSource={tipos} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 8 }}
            size="middle"
        />
      </Card>

      <Modal
        title={editingItem ? "Editar Servicio" : "Nuevo Servicio de Estiba"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
            
            <Form.Item name="empresa" hidden><Input /></Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item 
                        name="codigo" 
                        label="Código Interno" 
                        rules={[{ required: true, message: 'Requerido' }]}
                    >
                        <Input placeholder="Ej: DSC-PISO" disabled={!!editingItem} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item 
                        name="accion" 
                        label="Tipo de Acción" 
                        rules={[{ required: true }]}
                    >
                        <Select placeholder="Seleccione lógica">
                            <Option value="DESCARGA">Descarga (Entrada)</Option>
                            <Option value="CARGA">Carga (Salida)</Option>
                            <Option value="TRASBORDO">Trasbordo</Option>
                            <Option value="REESTIBA">Reestiba / Otros</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item 
                name="nombre" 
                label="Nombre Visible" 
                rules={[{ required: true, message: 'Requerido' }]}
            >
                <Input placeholder="Ej: Descarga Soya 50kg" />
            </Form.Item>

            <Form.Item 
                name="tarifa_por_saco" 
                label="Tarifa Base (S/.)" 
                rules={[{ required: true }]}
            >
                <InputNumber 
                    style={{ width: '100%' }} 
                    step={0.10} 
                    min={0} 
                    prefix={<DollarOutlined />} 
                />
            </Form.Item>

            <Row justify="end" style={{ marginTop: 24 }}>
                <Button onClick={handleCancel} style={{ marginRight: 12 }}>Cancelar</Button>
                <Button type="primary" htmlType="submit">Guardar</Button>
            </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default GestionTiposEstibaje;