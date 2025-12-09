import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Table, message, Space, Typography, Row, Col, Select, Form, Tooltip, Tag } from 'antd';
import { SearchOutlined, CloudDownloadOutlined, DownloadOutlined, BuildOutlined, FilePdfOutlined, CloudUploadOutlined, ExportOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';

// Asegúrate de que estas rutas coincidan con tu estructura real
import { consultarRecibosSenasa, descargarReciboProxy } from '../../../api/Senasa';
import { getEmpresas } from '../../../api/Empresas';
import { subirArchivosIndividuales } from '../../../api/Documentos';

const { Text, Link } = Typography;

const SenasaImporterModal = ({ open, onClose, numeroDua, anioDua, onImportSuccess }) => {
    const [form] = Form.useForm();

    // Estados de datos
    const [empresas, setEmpresas] = useState([]);
    const [data, setData] = useState([]);

    // Estados de UI/Loading
    const [loadingEmpresas, setLoadingEmpresas] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingDownloadId, setLoadingDownloadId] = useState(null);
    const [loadingImportId, setLoadingImportId] = useState(null);

    // Estado visual auxiliar para mostrar el RUC seleccionado debajo del Select
    const [ruc, setRuc] = useState('');

    // Estados para Draggable
    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const draggleRef = useRef(null);

    useEffect(() => {
        cargarEmpresas();
    }, []);

    // Limpieza al cerrar el modal
    useEffect(() => {
        if (!open) {
            setData([]);
            setRuc(''); // CORRECCIÓN: Limpiar también el estado visual del RUC
            form.resetFields();
        }
    }, [open, form]);

    const cargarEmpresas = async () => {
        setLoadingEmpresas(true);
        try {
            const response = await getEmpresas();
            const lista = Array.isArray(response.data) ? response.data : response.data.results || [];
            setEmpresas(lista);
        } catch (error) {
            console.error("Error cargando empresas:", error);
        } finally {
            setLoadingEmpresas(false);
        }
    };

    // --- IMPORTAR A SISTEMA ---
    const handleImportToSystem = async (record) => {
        // CORRECCIÓN: Validación de seguridad
        if (!numeroDua || !anioDua) {
            message.error("Error interno: No se ha especificado la DUA de destino.");
            return;
        }

        setLoadingImportId(record.nro);
        const key = `import-${record.nro}`;
        message.loading({ content: 'Descargando y subiendo documento...', key });

        try {
            // 1. Descargar (Usamos los datos del RECORD, no del form, para consistencia)
            const response = await descargarReciboProxy(record.expediente, record.nro, record.ruc);

            // Verificamos si es JSON (Error) en lugar de Blob (PDF)
            if (response.data.type === 'application/json') {
                throw new Error("El servidor no devolvió un PDF válido.");
            }

            // 2. Convertir Blob a File
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const fileName = `SENASA_TICKET_${record.nro}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });

            // 3. Subir
            const res = await subirArchivosIndividuales(numeroDua, anioDua, [file]);

            // 4. Validar respuesta
            if (res && res.data && res.data.archivos_omitidos && res.data.archivos_omitidos.length > 0) {
                message.warning({ content: `El archivo ${fileName} ya existe en esta DUA.`, key });
            } else {
                message.success({ content: 'Documento importado correctamente.', key });
                if (onImportSuccess) onImportSuccess();
            }

        } catch (error) {
            console.error("Error importando:", error);
            const errMsg = error.message === "El servidor no devolvió un PDF válido."
                ? error.message
                : "Error al importar el documento.";
            message.error({ content: errMsg, key });
        } finally {
            setLoadingImportId(null);
        }
    };

    const handleDownload = async (record) => {
        // CORRECCIÓN CRÍTICA:
        // No usamos form.getFieldsValue() aquí. 
        // Usamos 'record' porque contiene el expediente y ruc exactos que generaron esa fila.
        // Esto evita errores si el usuario cambia el input texto pero no le da a "Buscar".

        const { expediente, ruc, nro } = record;

        setLoadingDownloadId(nro);
        const key = `descarga-${nro}`;
        message.loading({ content: 'Procesando descarga...', key });

        try {
            const response = await descargarReciboProxy(expediente, nro, ruc);

            // Validación extra por si devuelve JSON de error
            if (response.data.type === 'application/json') {
                throw new Error("No es un PDF");
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${nro}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success({ content: 'Descarga exitosa', key });
        } catch (error) {
            console.error(error);
            message.error({ content: 'Error al descargar el archivo.', key });
        } finally {
            setLoadingDownloadId(null);
        }
    };

    const handleSearch = async () => {
        const values = await form.validateFields().catch(() => null);
        if (!values) return;

        setLoadingSearch(true);
        setData([]);

        // Mensaje de feedback para esperas largas
        const loadingMsg = message.loading('Consultando a SENASA (puede tardar)...', 0);

        try {
            const response = await consultarRecibosSenasa(values.expediente, values.ruc);
            loadingMsg(); // Cerrar mensaje

            const { detalles, msg } = response.data;

            if (detalles && detalles.length > 0) {
                message.success(msg);
                // INYECCIÓN DE CONTEXTO: Guardamos qué expediente generó este resultado
                const dataWithContext = detalles.map(d => ({
                    ...d,
                    expediente: values.expediente,
                    ruc: values.ruc
                }));
                setData(dataWithContext);
            } else {
                message.info('No se encontraron recibos.');
            }
        } catch (error) {
            loadingMsg(); // Cerrar mensaje
            console.error(error);
            if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
                message.error('Tiempo de espera agotado. SENASA está muy lento.');
            } else {
                message.error('Error al consultar SENASA.');
            }
        } finally {
            setLoadingSearch(false);
        }
    };

    const onStart = (_event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) return;
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    const columns = [
        {
            title: 'Nro. Recibo',
            dataIndex: 'nro',
            key: 'nro',
            width: 140,
            render: (text) => <Space><FilePdfOutlined style={{ color: '#ff4d4f' }} /><Text strong>{text}</Text></Space>,
        },
        {
            title: 'Fecha',
            dataIndex: 'fecha',
            key: 'fecha',
            width: 100,
        },
        {
            title: 'Monto',
            dataIndex: 'monto',
            key: 'monto',
            align: 'right',
            width: 100,
            render: (val) => val ? <Tag color="blue">S/. {val}</Tag> : '-'
        },
        {
            title: 'Acciones',
            key: 'action',
            align: 'center',
            width: 220,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Descargar a mi PC">
                        <Button
                            icon={<DownloadOutlined />}
                            size="small"
                            shape="circle"
                            loading={loadingDownloadId === record.nro}
                            // CORRECCIÓN: Pasamos todo el record, no solo el nro
                            onClick={() => handleDownload(record)}
                        />
                    </Tooltip>

                    <Tooltip title="Importar directo a la DUA">
                        <Button
                            type="primary"
                            icon={<CloudUploadOutlined />}
                            size="small"
                            shape="round"
                            loading={loadingImportId === record.nro}
                            onClick={() => handleImportToSystem(record)}
                        >
                            Importar
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title={
                <div
                    style={{ width: '100%', cursor: 'move' }}
                    onMouseOver={() => { if (disabled) setDisabled(false); }}
                    onMouseOut={() => { setDisabled(true); }}
                    onFocus={() => { }} onBlur={() => { }}

                >
                    <Space>
                        <CloudDownloadOutlined style={{ color: '#1890ff' }} /> Consulta e Importación de tickets SENASA

                    </Space>


                </div>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={850}
            destroyOnClose
            maskClosable={false}
            modalRender={(modal) => (
                <Draggable disabled={disabled} bounds={bounds} nodeRef={draggleRef} onStart={(event, uiData) => onStart(event, uiData)}>
                    <div ref={draggleRef}>{modal}</div>
                </Draggable>
            )}
        >
            <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={{ expediente: '', ruc: undefined }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="expediente" label="N° Expediente" rules={[{ required: true, message: 'Ingrese expediente' }]}>
                            <Input placeholder="Ej: 251180006342" size="large" prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} allowClear />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="ruc" label="Empresa" rules={[{ required: true, message: 'Ingrese empresa' }]}>
                            <Select
                                style={{ width: '100%' }} size="large" placeholder="Buscar empresa..." showSearch loading={loadingEmpresas} allowClear
                                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                                onChange={(value) => setRuc(value)}
                                suffixIcon={<BuildOutlined />}
                            >
                                {empresas.map((empresa) => (
                                    <Select.Option key={empresa.id} value={empresa.ruc}>{empresa.razon_social}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        {/* Mostramos el RUC seleccionado con el estado visual */}
                        {ruc && <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '-10px' }}>RUC: {ruc}</Text>}
                    </Col>
                </Row>
                <Form.Item style={{ marginBottom: '24px' }}>
                    <Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loadingSearch} block size="large">
                        Consultar Recibos
                    </Button>
                </Form.Item>
            </Form>

            <Table
                columns={columns} dataSource={data} rowKey="nro" pagination={false} size="small" bordered
                scroll={{ y: 350, x: 'max-content' }}
                locale={{ emptyText: 'Ingrese expediente para buscar resultados' }}
            />

            <br />
            <Link href="https://servicios.senasa.gob.pe/ConsultaRecibos/" target="_blank" className="text-xs"> 
               <ExportOutlined /> data extraida desde la web oficial de SENASA
            </Link>
        </Modal>
    );
};

export default SenasaImporterModal;