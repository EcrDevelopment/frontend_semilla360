import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  InputNumber,
  Input,
  DatePicker,
  message,
  Alert,
  Typography,
  Space,
  Tag,
  Descriptions,
  Statistic,
  Row,
  Col,
  Divider,
  Button,
  Card
} from 'antd';
import {
  BoxPlotOutlined,
  DeliveredProcedureOutlined,
  RocketOutlined,
  FlagOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { recibirTransferencia } from '../../../api/Transferencia';
import moment from 'moment';

const { TextArea } = Input;
const { Title, Text } = Typography;

const RecepcionModal = ({ visible, onClose, transferencia, onRecepcionExitosa }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && transferencia) {
      form.setFieldsValue({
        cantidad_recibida: Number(transferencia.cantidad_enviada),
        fecha_recepcion: moment(),
        notas_recepcion: '',
      });
    } else if (!visible) {
      form.resetFields();
      setError(null);
    }
  }, [visible, transferencia, form]);

  if (!transferencia) return null;

  const { id, producto, cantidad_enviada, almacen_origen, almacen_destino } = transferencia;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      const payload = {
        cantidad_recibida: values.cantidad_recibida,
        notas: values.notas_recepcion || '',
      };

      const { data: transferenciaActualizada } = await recibirTransferencia(id, payload);

      message.success(`Transferencia ${id} recibida exitosamente`);
      setLoading(false);
      onRecepcionExitosa(transferenciaActualizada);
    } catch (err) {
      setLoading(false);
      if (err?.response?.data) {
        const apiErrors = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        setError(apiErrors || 'Error del servidor.');
      } else {
        setError('Ocurrió un error inesperado. Intente de nuevo.');
      }
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={720}
      maskClosable={false}
      destroyOnClose
      footer={null}
      centered
      //bodyStyle={{ backgroundColor: '#fafafa', padding: '24px 32px' }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <Space direction="vertical" align="center">
          <BoxPlotOutlined style={{ fontSize: 40, color: '#1677ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            Recepción de Transferencia <Text type="secondary">ID: {id}</Text>
          </Title>
          
        </Space>
      </div>

      {/* INFO PRINCIPAL */}
      <Card style={{ marginBottom: 20 }}>
        <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label={<Space><RocketOutlined />Origen</Space>} span={1}>
          <Tag color='orange'>{almacen_origen?.descripcion}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={<Space><FlagOutlined />Destino</Space>} span={1}>
          <Tag color='blue'>{almacen_destino?.descripcion}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Producto" span={2}>
          {producto?.codigo_producto} - {producto?.nombre_producto}
        </Descriptions.Item>
      </Descriptions>
      </Card>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 6 }}
        />
      )}

      {/* FORMULARIO */}
      <Form form={form} layout="vertical">
        <Card  style={{ marginBottom: 20 }}>
          <Row gutter={24} align="middle">
            <Col span={12}>
              <Statistic
                title={<Text strong>Cantidad Enviada</Text>}
                value={cantidad_enviada}
                precision={6}
                valueStyle={{ color: '#1677ff', fontWeight: 600 }}
                prefix={<RocketOutlined />}
              />
            </Col>
            <Col span={12}>
              <Form.Item
                name="cantidad_recibida"
                label="Cantidad Recibida"
                rules={[{ required: true, message: 'La cantidad es obligatoria' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Ingrese cantidad recibida"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="fecha_recepcion"
                label={<Space><CalendarOutlined /> Fecha de Recepción</Space>}
                rules={[{ required: true, message: 'La fecha es obligatoria' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="notas_recepcion"
                label={<Space><FileTextOutlined /> Notas de Recepción</Space>}
              >
                <TextArea
                  rows={3}
                  placeholder="Ej. Observaciones, daños, diferencias..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }} className="mt-4">
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={loading}
            onClick={handleOk}
          >
            Confirmar Recepción
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RecepcionModal;
