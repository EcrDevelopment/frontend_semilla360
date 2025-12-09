import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';

function ModalConfirmacionConflictos({
  open,
  oc1,
  oc2,
  onContinuar,
  onCancelar,
}) {
  // No renderizar si no hay datos (aunque 'open' debería controlarlo)
  if (!oc1 || !oc2) return null;

  const conflictoProducto = oc1.producto !== oc2.producto;
  const conflictoProveedor = oc1.proveedor !== oc2.proveedor;

  return (
    <Modal
      title="⚠️ Advertencia: Conflicto de Datos"
      open={open}
      onCancel={onCancelar}
      footer={[
        <Button key="cancelar" onClick={onCancelar}>
          Cancelar
        </Button>,
        <Button key="continuar" type="primary" onClick={onContinuar}>
          Continuar
        </Button>,
      ]}
    >
      <p>
        La segunda Orden de Compra tiene datos que no coinciden con la primera.
        ¿Desea continuar de todos modos?
      </p>

      {conflictoProducto && (
        <div style={{ marginTop: 16 }}>
          <strong>Conflicto de Producto:</strong>
          <p style={{ color: '#888', margin: 0, paddingLeft: '1em' }}>
            <b>OC 1 ({oc1.numero_oc}):</b> {oc1.producto}
          </p>
          <p style={{ color: '#d9534f', margin: 0, paddingLeft: '1em' }}>
            <b>OC 2 ({oc2.numero_oc}):</b> {oc2.producto}
          </p>
        </div>
      )}

      {conflictoProveedor && (
        <div style={{ marginTop: 16 }}>
          <strong>Conflicto de Proveedor:</strong>
          <p style={{ color: '#888', margin: 0, paddingLeft: '1em' }}>
            <b>OC 1 ({oc1.numero_oc}):</b> {oc1.proveedor}
          </p>
          <p style={{ color: '#d9534f', margin: 0, paddingLeft: '1em' }}>
            <b>OC 2 ({oc2.numero_oc}):</b> {oc2.proveedor}
          </p>
        </div>
      )}
    </Modal>
  );
}

ModalConfirmacionConflictos.propTypes = {
  open: PropTypes.bool.isRequired,
  oc1: PropTypes.object,
  oc2: PropTypes.object,
  onContinuar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};

export default ModalConfirmacionConflictos;