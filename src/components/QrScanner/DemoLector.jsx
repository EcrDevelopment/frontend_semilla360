// src/components/DemoLector.jsx
import React, { useState, useCallback } from 'react';
import { Modal, Button, Input, message, Space, Descriptions, Tag, Alert } from 'antd'; // Importar Alert
import { QrcodeOutlined, LinkOutlined } from '@ant-design/icons'; // Importar LinkOutlined
import { Scanner } from '@yudiel/react-qr-scanner';

// Mapeo simple de códigos de tipo de comprobante (puedes expandirlo)
const TIPO_COMPROBANTE = {
  '01': 'Factura Electrónica',
  '03': 'Boleta de Venta Electrónica',
  '07': 'Nota de Crédito Electrónica',
  '08': 'Nota de Débito Electrónica',
  '09': 'Guía de Remisión Remitente Electrónica',
  // Añadir más códigos según necesites
};

// Mapeo simple de códigos de tipo de documento
const TIPO_DOCUMENTO_IDENTIDAD = {
  '0': 'OTROS',
  '1': 'DNI',
  '4': 'CARNET DE EXTRANJERIA',
  '6': 'RUC',
  '7': 'PASAPORTE',
  // Añadir más códigos según necesites
};

// URL base para identificar Guías de Remisión
const GUIA_SUNAT_URL_PREFIX = 'https://e-factura.sunat.gob.pe/v1/contribuyente/gre/comprobantes/descargaqr?hashqr=';

export default function DemoLector() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [parsedData, setParsedData] = useState(null);

  /**
   * Intenta parsear el texto del QR según formatos SUNAT conocidos.
   */
  const parseSunatQr = (text) => {
    if (!text || typeof text !== 'string') return null;

    // Detectar Guía de Remisión por URL
    if (text.startsWith(GUIA_SUNAT_URL_PREFIX)) {
      return {
        isGuia: true, // Indicador de que es una guía
        tipoComprobanteDesc: 'Guía de Remisión Electrónica',
        urlDescarga: text, // Guardar la URL completa
      };
    }

    // Lógica para Comprobantes de Pago (CPE)
    const fields = text.split('|');
    if (fields.length >= 10) { // Formato CPE estándar
      return {
        isGuia: false, // No es guía
        rucEmisor: fields[0],
        tipoComprobanteCod: fields[1],
        tipoComprobanteDesc: TIPO_COMPROBANTE[fields[1]] || 'Desconocido',
        serie: fields[2],
        numero: fields[3],
        igv: fields[4],
        total: fields[5],
        fechaEmision: fields[6],
        tipoDocReceptorCod: fields[7],
        tipoDocReceptorDesc: TIPO_DOCUMENTO_IDENTIDAD[fields[7]] || 'Desconocido',
        numDocReceptor: fields[8],
        hash: fields[9],
        // Puedes añadir más campos opcionales si existen
        // campoAdicional1: fields[10],
      };
    }

    // Si no coincide con formatos conocidos
    return null;
  };

  const handleScan = useCallback((detectedCodes) => {
    const firstCode = detectedCodes[0];
    if (firstCode) {
      const result = firstCode.rawValue;
      setScanResult(result); // Guardar el texto crudo
      const data = parseSunatQr(result);
      setParsedData(data); // Guardar los datos parseados (o null)

      if (data) {
        if (data.isGuia) {
          messageApi.success('Guía de Remisión Electrónica detectada.');
        } else {
          messageApi.success(`Comprobante ${data.serie}-${data.numero} detectado.`);
        }
      } else {
        messageApi.warning('QR detectado, pero no parece un formato SUNAT estándar.');
      }
      setIsModalOpen(false); // Cerrar modal
    }
  }, [messageApi]); // Dependencias: messageApi

  const handleError = useCallback((error) => {
    console.error('Error del escáner QR:', error?.message || error);
    // Evitar mostrar errores comunes de "no encontrado"
    if (!error?.message?.toLowerCase().includes('not found')) {
      messageApi.error(`Error del escáner: ${error?.message || 'Error desconocido'}`);
    }
  }, [messageApi]); // Dependencias: messageApi

  const showModal = () => {
      setParsedData(null); // Limpiar datos anteriores al abrir
      setScanResult('');
      setIsModalOpen(true);
  };
  const handleCancel = () => setIsModalOpen(false);

  // Parsear también al cambiar/pegar en el input
  const handleChange = (e) => {
      const value = e.target.value;
      setScanResult(value);
      setParsedData(parseSunatQr(value));
  };

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder} {/* Necesario para messageApi */}
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Escanea o pega el contenido del QR aquí"
          value={scanResult}
          onChange={handleChange}
        />
        <Button type="primary" icon={<QrcodeOutlined />} onClick={showModal}>
          Escanear QR
        </Button>
      </Space.Compact>

      {/* --- Mostrar Datos Parseados --- */}
      {parsedData && (
        <div style={{ marginTop: '20px' }}>
          {parsedData.isGuia ? (
            // Si es Guía de Remisión
            <Alert
              message="Guía de Remisión Electrónica Detectada"
              description={
                <a href={parsedData.urlDescarga} target="_blank" rel="noopener noreferrer">
                  <LinkOutlined /> Descargar Guía desde SUNAT
                </a>
              }
              type="info"
              showIcon
            />
          ) : (
            // Si es CPE (Factura, Boleta, etc.)
            <Descriptions bordered title="Datos del Comprobante Electrónico" size="small">
              <Descriptions.Item label="Tipo" span={2}>
                 <Tag color="blue">{parsedData.tipoComprobanteDesc || 'N/A'} ({parsedData.tipoComprobanteCod || 'N/A'})</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Número">{`${parsedData.serie || 'N/A'}-${parsedData.numero || 'N/A'}`}</Descriptions.Item>
              <Descriptions.Item label="Emisor RUC" span={3}>{parsedData.rucEmisor || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Receptor Tipo Doc" span={1}>{parsedData.tipoDocReceptorDesc || 'N/A'} ({parsedData.tipoDocReceptorCod || 'N/A'})</Descriptions.Item>
              <Descriptions.Item label="Receptor Número" span={2}>{parsedData.numDocReceptor || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Fecha Emisión">{parsedData.fechaEmision || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="IGV">{parsedData.igv !== undefined ? `S/ ${parsedData.igv}` : 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Importe Total">{parsedData.total !== undefined ? `S/ ${parsedData.total}` : 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Hash" span={3}><small style={{ wordBreak: 'break-all'}}>{parsedData.hash || 'N/A'}</small></Descriptions.Item>
            </Descriptions>
          )}
        </div>
      )}
      {/* Mensaje si hay texto pero no se reconoció el formato */}
      {!parsedData && scanResult && (
           <Alert message="Contenido QR detectado, pero no reconocido como formato SUNAT estándar." type="warning" showIcon style={{ marginTop: '10px' }}/>
       )}

      {/* --- Modal con el Scanner --- */}
      <Modal
        title="Escanear Código QR"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null} // Sin botones OK/Cancelar
        destroyOnClose // Muy importante para liberar la cámara
      >
        {/* El Scanner se monta/desmonta gracias a destroyOnClose */}
        <Scanner
          onScan={handleScan} // Prop correcta
          onError={handleError}
          // Estilos y configuración
          containerStyle={{ width: '100%', paddingTop: '75%' /* Aspect ratio 4:3 */ }}
          videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
          constraints={{ facingMode: 'environment' }} // Cámara trasera
          components={{ finder: true }} // Muestra el recuadro guía
          scanDelay={300} // Tiempo entre intentos de escaneo
          allowMultiple={false} // Detenerse después del primer éxito
        />
      </Modal>

    </div>
  );
}

