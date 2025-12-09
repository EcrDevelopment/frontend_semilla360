import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, InputNumber, Alert } from 'antd';

function ModalProrrateo({ open, oc1, oc2, onCancel, onCalcular }) {
  const [modalForm] = Form.useForm();
  const [modalMessage, setModalMessage] = useState('');

  const closeMessage = useCallback(() => {
    setModalMessage('');
  }, []);

  const handleModalOk = useCallback(async () => {
    try {
      const values = await modalForm.validateFields();
      const peso1T = values.peso1 / 1000;
      const peso2T = values.peso2 / 1000;
      const precio1 = oc1.precio_unitario * 1000;
      const precio2 = oc2.precio_unitario * 1000;
      const sumaPesos = peso1T + peso2T;

      if (sumaPesos === 0) {
        setModalMessage('La suma de los pesos no puede ser cero.');
        return;
      }

      let precioFinal = (precio1 * peso1T + precio2 * peso2T) / sumaPesos;
      precioFinal = (precioFinal / 1000).toFixed(5);

      setModalMessage('');
      modalForm.resetFields();
      
      // ¡¡CAMBIO AQUÍ!!
      // Añadimos values.peso1 y values.peso2 al callback
      onCalcular(
        parseFloat(precioFinal),
        values.recojo1,
        values.recojo2,
        values.peso1,
        values.peso2
      );

    } catch (errorInfo) {
      console.error('Error en validación de modal:', errorInfo);
      setModalMessage('Por favor ingrese todos los valores correctamente.');
    }
  }, [modalForm, oc1, oc2, onCalcular]);

  const handleInternalCancel = useCallback(() => {
    modalForm.resetFields();
    setModalMessage('');
    onCancel();
  }, [modalForm, onCancel]);

  return (
    <Modal
      title="Prorrateo de precio"
      open={open}
      onOk={handleModalOk}
      onCancel={handleInternalCancel}
      okText="Calcular"
      cancelText="Cancelar"
    >
      {/* ... (Alert y Form sin cambios) ... */}
      {modalMessage && ( <Alert /*...*/ /> )}
      <Form form={modalForm} layout="vertical">
        {/* ... (Inputs de OC 1 y OC 2 sin cambios) ... */}
         <div className="pt-3 px-3 mt-3 border rounded rounded-md shadow-md bg-gray-200">
          <p>{oc1 ? `${oc1.numero_oc} - ${oc1.producto}` : ''}</p>
          <div className="flex gap-4">
            <Form.Item name="peso1" label="Peso (KG)" rules={[{ required: true, message: 'Requerido' }]} className="flex-1">
              <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="recojo1" label="N° de recojo" rules={[{ required: true, message: 'Requerido' }]} className="flex-1">
              <InputNumber min={1} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </div>
        <div className="pt-3 px-3 mt-3 border rounded rounded-md shadow-md bg-gray-200">
          <p>{oc2 ? `${oc2.numero_oc} - ${oc2.producto}` : ''}</p>
          <div className="flex gap-4">
            <Form.Item name="peso2" label="Peso (KG)" rules={[{ required: true, message: 'Requerido' }]} className="flex-1">
              <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="recojo2" label="N° de recojo" rules={[{ required: true, message: 'Requerido' }]} className="flex-1">
              <InputNumber min={1} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
}

ModalProrrateo.propTypes = {
  open: PropTypes.bool.isRequired,
  oc1: PropTypes.object,
  oc2: PropTypes.object,
  onCancel: PropTypes.func.isRequired,
  onCalcular: PropTypes.func.isRequired, // (precio, recojo1, recojo2, peso1, peso2)
};

export default ModalProrrateo;