import React, {useState, useParams}from "react";
import { Button, Modal } from 'antd';


const ModalGastoMovimiento = ({record}) => {
    const { record } = useParams();
    const {open, setOpen} = useState(false);
  
  
  
    return(
    <>
        <Modal
            title={record?.codigo_movimiento ? `Gastos del Movimiento: ${record.numero_documento_erp}` : 'Gastos del Movimiento'}
            open={open}
            footer={null}
        >
            {record?.gastos_movimiento?.map((gasto, index) => (
                <div key={index} style={{marginBottom: '16px', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px'}}>
                    <p><strong>Tipo de Gasto:</strong> {gasto.tipo_gasto || 'N/A'}</p>
                    <p><strong>Descripción:</strong> {gasto.descripcion || 'N/A'}</p>
                    <p><strong>Monto:</strong> {gasto.monto ? `$${gasto.monto.toFixed(2)}` : 'N/A'}</p>
                </div>
            ))}
        </Modal>
    </>
  );
}       

export default ModalGastoMovimiento;