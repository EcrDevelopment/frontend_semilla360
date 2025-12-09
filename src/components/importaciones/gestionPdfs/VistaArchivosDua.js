import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
    obtenerDocumentosExpedienteAgrupadosPorTipo,
    getDocumento,
    eliminarDocumentoExpediente,
    ActualizarFolioDocumentoExpediente,
} from '../../../api/Documentos';
import {
    Layout,
    Typography,
    Spin,
    message,
    Collapse,
    Empty,
    Button,
    Popconfirm,
    Modal,
    Card,
    Tooltip,
    Tag,
    Splitter,
    Grid,
    Flex
} from 'antd';
import {
    FilePdfOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    LoadingOutlined,
    DeleteOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { Document, Page, pdfjs } from 'react-pdf';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Content } = Layout;
const { useBreakpoint } = Grid;

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const VistaArchivoDua = () => {
    const { id, numero, anio } = useParams();
    const [documentosAgrupados, setDocumentosAgrupados] = useState({});
    const [selectedDocBlobUrl, setSelectedDocBlobUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [folio, setFolio] = useState('');
    const [folioGuardado, setFolioGuardado] = useState('');
    const [documentoActualId, setDocumentoActualId] = useState(null);
    const [expedienteActualId, setExpedienteActualId] = useState(null);
    const [savingFolio, setSavingFolio] = useState(false);
    const [activeCollapseKey, setActiveCollapseKey] = useState(null);
    //const [siderCollapsed, setSiderCollapsed] = useState(false);
    const screens = useBreakpoint();
    const isMobile = !screens.md; // < 768px
    const splitDirection = isMobile ? "horizontal" : "vertical";

    const inputRef = useRef(null);
    const visorRef = useRef(null);

    useEffect(() => {
        const fetchDocumentos = async () => {
            try {
                const data = await obtenerDocumentosExpedienteAgrupadosPorTipo(id);
                setDocumentosAgrupados(data || {});
            } catch (error) {
                message.error('Error al obtener documentos agrupados');
            }
        };
        fetchDocumentos();
    }, [id]);

    const handleSeleccionarDocumento = async (documento_id, expediente_id) => {
        if (folio && folio !== folioGuardado) {
            Modal.confirm({
                title: 'Cambios no guardados',
                content: '¿Seguro que deseas cambiar de documento?',
                okText: 'Sí',
                cancelText: 'Cancelar',
                onOk: () => cargarDocumento(documento_id, expediente_id),
            });
            return;
        }
        cargarDocumento(documento_id, expediente_id);
    };

    const cargarDocumento = async (documento_id, expediente_id) => {
        setLoading(true);
        try {
            const blob = await getDocumento(documento_id);
            const url = URL.createObjectURL(blob);
            setSelectedDocBlobUrl(url);
            setZoomLevel(1.0);
            setNumPages(null);
            setDocumentoActualId(documento_id);
            setExpedienteActualId(expediente_id);

            const tipoEncontrado = Object.entries(documentosAgrupados).find(([tipo, docs]) =>
                docs.some(doc => doc.documento_id === documento_id)
            );
            if (tipoEncontrado) setActiveCollapseKey(tipoEncontrado[0]);

            let folioEncontrado = '';
            Object.values(documentosAgrupados).forEach(group => {
                group.forEach(doc => {
                    if (doc.documento_id === documento_id) {
                        folioEncontrado = doc.folio || '';
                    }
                });
            });
            setFolio(folioEncontrado);
            setFolioGuardado(folioEncontrado);
        } catch {
            message.error('Error al cargar el documento');
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarDocumento = async expedienteId => {
        try {
            await eliminarDocumentoExpediente(expedienteId);
            message.success('Documento eliminado correctamente');
            const data = await obtenerDocumentosExpedienteAgrupadosPorTipo(id);
            setDocumentosAgrupados(data || {});
            setSelectedDocBlobUrl(null);
        } catch {
            message.error('Error al eliminar el documento');
        }
    };

    const handleWheelZoom = e => {
        if (e.ctrlKey) {
            e.preventDefault();
            setZoomLevel(z => (e.deltaY < 0 ? Math.min(z + 0.1, 3) : Math.max(z - 0.1, 0.5)));
        }
    };

    useEffect(() => {
        const ref = visorRef.current;
        if (ref) {
            ref.addEventListener('wheel', handleWheelZoom, { passive: false });
        }
        return () => {
            if (ref) {
                ref.removeEventListener('wheel', handleWheelZoom);
            }
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = e => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const grupos = Object.entries(documentosAgrupados);
                let actualGrupoIndex = -1;
                let actualDocIndex = -1;

                grupos.forEach(([_, documentos], i) => {
                    const index = documentos.findIndex(doc => doc.documento_id === documentoActualId);
                    if (index !== -1) {
                        actualGrupoIndex = i;
                        actualDocIndex = index;
                    }
                });

                if (actualGrupoIndex === -1) return;

                const grupoActual = grupos[actualGrupoIndex][1];
                if (actualDocIndex + 1 < grupoActual.length) {
                    const siguienteDoc = grupoActual[actualDocIndex + 1];
                    handleSeleccionarDocumento(siguienteDoc.documento_id, siguienteDoc.id);
                } else if (actualGrupoIndex + 1 < grupos.length) {
                    const siguienteGrupo = grupos[actualGrupoIndex + 1][1];
                    if (siguienteGrupo.length > 0) {
                        handleSeleccionarDocumento(siguienteGrupo[0].documento_id, siguienteGrupo[0].id);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [documentosAgrupados, documentoActualId, folio, folioGuardado]);

    const guardarFolio = async () => {
        if (!folio.trim() || !expedienteActualId) return;
        setSavingFolio(true);
        try {
            await ActualizarFolioDocumentoExpediente(expedienteActualId, folio.trim());
            setFolioGuardado(folio.trim());
            message.success('Folio actualizado correctamente');
        } catch {
            message.error('Error al actualizar folio');
        } finally {
            setSavingFolio(false);
        }
    };


    const sidebarContent = (
        <div className="p-4 pt-4">
            <Title level={5}>Archivo de DUA: {numero}-{anio}</Title>
            <Collapse
                accordion
                activeKey={activeCollapseKey}
                onChange={(key) => setActiveCollapseKey(key)}
                items={Object.entries(documentosAgrupados).map(([tipo, documentos]) => ({
                    key: tipo,
                    label: `${tipo} (${documentos.length})`,
                    children: (
                        <>
                            {documentos.map((doc) => {
                                const isSelected = doc.documento_id === documentoActualId;
                                return (
                                    <Card
                                        key={doc.id}
                                        size="small"
                                        className={`mb-2 p-2 transition-shadow cursor-pointer ${isSelected ? 'shadow-md border border-blue-500' : 'hover:shadow'} rounded-lg`}
                                        onClick={() => handleSeleccionarDocumento(doc.documento_id, doc.id)}
                                    >
                                        <div className="flex justify-between items-center gap-2">
                                            {/* Sección del ícono y texto */}
                                            <div className="flex flex-col overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <FilePdfOutlined className="text-red-500 text-lg shrink-0" />
                                                    {/* Nombre truncado con tooltip */}
                                                    <Tooltip title={doc.nombre_original}>
                                                        <Text
                                                            className="truncate max-w-[180px] text-sm font-medium"
                                                            ellipsis
                                                        >
                                                            {doc.nombre_original}
                                                        </Text>
                                                    </Tooltip>
                                                </div>
                                                <div className="flex gap-2 mt-1 flex-wrap">
                                                    {doc.nota_ingreso && (
                                                        <Tag color="green" className="text-xs">
                                                            NI: {doc.nota_ingreso}
                                                        </Tag>
                                                    )}
                                                    {doc.orden_compra && (
                                                        <Tag color="orange" className="text-xs">
                                                            OC: {doc.orden_compra}
                                                        </Tag>
                                                    )}
                                                </div>
                                                <Text type="secondary" className="text-xs mt-1 truncate max-w-[180px]">
                                                    {doc.usuario}
                                                </Text>
                                            </div>

                                            {/* Botón eliminar con ícono */}
                                            <Popconfirm
                                                title="¿Eliminar documento?"
                                                onConfirm={(e) => {
                                                    e.stopPropagation();
                                                    handleEliminarDocumento(doc.id);
                                                }}
                                                onCancel={(e) => e.stopPropagation()}
                                                okText="Sí"
                                                cancelText="No"
                                            >
                                                <Button
                                                    danger
                                                    shape="circle"
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Popconfirm>
                                        </div>
                                    </Card>
                                );
                            })}
                        </>
                    ),
                }))}
            >


            </Collapse>
        </div>

    );

    const visorContent = (
        <Content ref={visorRef} className="p-2 h-full overflow-y-auto">
            {loading ? (
                <Spin indicator={<LoadingOutlined spin />} size="large" fullscreen />
            ) : selectedDocBlobUrl ? (
                <>
                    <div className="sticky top-0 z-10 bg-gray-300/35 rounded-md p-2 border-b mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
                        {/* Controles de Zoom */}
                        <div className="flex gap-2 items-center flex-shrink-0">
                            <Button icon={<ZoomOutOutlined />} onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))} />
                            <Button icon={<ZoomInOutlined />} onClick={() => setZoomLevel(z => Math.min(z + 0.1, 3))} />
                            <span className="text-sm text-gray-700 whitespace-nowrap">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
                        </div>

                        {/* Campo de Folio y Botón */}
                        <div className="flex gap-2 items-center flex-shrink-0">
                            <input
                                ref={inputRef}
                                type="text"
                                value={folio}
                                onChange={(e) => setFolio(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && folio.trim()) await guardarFolio();
                                }}
                                placeholder="Ingrese folio"
                                className="border border-gray-300 px-3 py-1.5 rounded-md w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button
                                type="primary"
                                disabled={!folio.trim()}
                                onClick={guardarFolio}
                                className="whitespace-nowrap"
                            >
                                {savingFolio ? <LoadingOutlined /> : <SaveOutlined />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div className="w-fit">
                            <Document file={selectedDocBlobUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                                {Array.from(new Array(numPages), (_, index) => (
                                    <Page key={index + 1} pageNumber={index + 1} scale={zoomLevel} />
                                ))}
                            </Document>
                        </div>
                    </div>

                </>
            ) : (
                <Empty description="Selecciona un documento para visualizarlo" className='my-auto' />
            )}
        </Content>
    );

    return (
        <Flex style={{ height: "100vh" }} vertical={isMobile}>
            {isMobile ? (
                <Splitter                    
                    style={{ height: "100vh", width: "100%" }}
                    layout="vertical"
                >
                    {/* Panel izquierdo (antes Sidebar) */}
                    <Splitter.Panel
                        min="20%"
                        max="30%"
                        defaultSize="25%"
                        collapsible={{ start: true, end: true, showCollapsibleIcon: true }}                        
                    >
                        {sidebarContent}
                    </Splitter.Panel>

                    {/* Panel derecho (antes Content) */}
                    <Splitter.Panel>
                        {visorContent}
                    </Splitter.Panel>
                </Splitter>) : (
                <Splitter
                    split={splitDirection}
                    style={{ height: "100vh", width: "100%" }}

                >
                    {/* Panel izquierdo (antes Sidebar) */}
                    <Splitter.Panel
                        min="20%"
                        max="30%"
                        defaultSize="25%"
                        collapsible={{ start: true, end: true, showCollapsibleIcon: true }}
                    >
                        {sidebarContent}
                    </Splitter.Panel>

                    {/* Panel derecho (antes Content) */}
                    <Splitter.Panel>
                        {visorContent}
                    </Splitter.Panel>
                </Splitter>
            )
            }
        </Flex>
    );
};

export default VistaArchivoDua;
