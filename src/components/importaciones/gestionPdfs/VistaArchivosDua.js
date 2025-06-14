import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
    obtenerDocumentosExpedienteAgrupadosPorTipo,
    getDocumento,
    eliminarDocumentoExpediente,
    ActualizarFolioDocumentoExpediente
} from "../../../api/Documentos";
import {
    Card, Typography, Spin, message, Collapse, Empty, Button, Popconfirm,Modal
} from 'antd';
import {
    FilePdfOutlined, ZoomInOutlined, ZoomOutOutlined, LoadingOutlined
} from '@ant-design/icons';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const { Title, Text } = Typography;
const { Panel } = Collapse;

const VistaArchivoDua = () => {
    const { id, numero, anio } = useParams();
    const [documentosAgrupados, setDocumentosAgrupados] = useState({});
    const [selectedDocBlobUrl, setSelectedDocBlobUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [folio, setFolio] = useState('');
    const [folioGuardado, setFolioGuardado] = useState('');
    const inputRef = useRef(null);
    const visorRef = useRef(null);
    const [documentoActualId, setDocumentoActualId] = useState(null);
    const [expedienteActualId, setExpedienteActualId] = useState(null);
    const [savingFolio, setSavingFolio] = useState(false);
    const [activeCollapseKey, setActiveCollapseKey] = useState(null); // 👈 NUEVO

    useEffect(() => {
        const fetchDocumentos = async () => {
            try {
                const data = await obtenerDocumentosExpedienteAgrupadosPorTipo(id);
                setDocumentosAgrupados(data || {});
            } catch (error) {
                console.error("Error al obtener documentos:", error);
                message.error("Error al obtener documentos agrupados");
            }
        };
        fetchDocumentos();
    }, [id]);

    const handleSeleccionarDocumento = async (documento_id, expediente_id) => {
        // Si hay cambios no guardados en el folio
        if (folio && folio !== folioGuardado) {
            Modal.confirm({
                title: "Cambios no guardados",
                content: "Tienes cambios no guardados en el folio. ¿Seguro que deseas cambiar de documento?",
                okText: "Sí, cambiar",
                cancelText: "Cancelar",
                onOk: () => {
                    // Ejecutar la carga del documento si el usuario confirma
                    cargarDocumento(documento_id, expediente_id);
                },
            });
            return;
        }

        // Si no hay cambios o no hay folio, se ejecuta directamente
        cargarDocumento(documento_id, expediente_id);
    };

    // Extraemos la lógica principal aquí
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
            if (tipoEncontrado) {
                setActiveCollapseKey(tipoEncontrado[0]);
            }

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
        } catch (error) {
            message.error("Error al cargar el documento");
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarDocumento = async (expedienteId) => {
        try {
            await eliminarDocumentoExpediente(expedienteId);
            message.success("Documento eliminado correctamente");
            const data = await obtenerDocumentosExpedienteAgrupadosPorTipo(id);
            setDocumentosAgrupados(data || {});
            setSelectedDocBlobUrl(null);
        } catch (error) {
            console.error("Error al eliminar documento:", error);
            message.error("Error al eliminar el documento");
        }
    };

    const handleWheelZoom = (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            setZoomLevel((z) => e.deltaY < 0 ? Math.min(z + 0.1, 3) : Math.max(z - 0.1, 0.5));
        }
    };

    useEffect(() => {
        const ref = visorRef.current;
        if (ref) {
            ref.addEventListener("wheel", handleWheelZoom, { passive: false });
        }
        return () => {
            if (ref) {
                ref.removeEventListener("wheel", handleWheelZoom);
            }
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
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

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [documentosAgrupados, documentoActualId, folio, folioGuardado]);

    const guardarFolio = async () => {
        if (!folio.trim() || !expedienteActualId) return;
        setSavingFolio(true);
        try {
            await ActualizarFolioDocumentoExpediente(expedienteActualId, folio.trim());
            setFolioGuardado(folio.trim());
            message.success("Folio actualizado correctamente");
        } catch (error) {
            message.error("Error al actualizar folio");
        } finally {
            setSavingFolio(false);
        }
    };

    return (
        <div className="p-4">
            <Title level={3}>Archivo de DUA: {numero}-{anio}</Title>
            <div className="flex gap-4">
                <div className="w-1/3 overflow-y-auto h-[80vh] border-r pr-2">
                    <Collapse
                        accordion
                        activeKey={activeCollapseKey}
                        onChange={(key) => setActiveCollapseKey(key)}
                    >
                        {Object.entries(documentosAgrupados).map(([tipo, documentos]) => (
                            <Panel header={`${tipo} (${documentos.length})`} key={tipo}>
                                {documentos.map((doc) => {
                                    const isSelected = doc.documento_id === documentoActualId;
                                    return (
                                        <Card
                                            key={doc.id}
                                            className={`mb-2 transition-shadow cursor-pointer ${isSelected ? 'shadow-md border border-blue-500' : 'hover:shadow'
                                                }`}
                                            bodyStyle={{ padding: "12px" }}
                                            onClick={() => handleSeleccionarDocumento(doc.documento_id, doc.id)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <FilePdfOutlined className="mr-2 text-red-500" />
                                                    <Text>{doc.nombre_original}</Text><br />
                                                    <Text type="secondary" className="text-xs">{doc.usuario}</Text>
                                                </div>
                                                <Popconfirm
                                                    title="¿Estás seguro de eliminar este documento?"
                                                    onConfirm={(e) => {
                                                        e.stopPropagation();
                                                        handleEliminarDocumento(doc.id);
                                                    }}
                                                    onCancel={(e) => e.stopPropagation()}
                                                    okText="Sí"
                                                    cancelText="No"
                                                >
                                                    <Button danger size="small" onClick={(e) => e.stopPropagation()}>
                                                        Eliminar
                                                    </Button>
                                                </Popconfirm>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </Panel>
                        ))}
                    </Collapse>
                </div>

                <div ref={visorRef} className="w-2/3 h-[80vh] overflow-y-auto border-l pl-4 flex flex-col items-center">
                    {loading ? (
                        <Spin />
                    ) : selectedDocBlobUrl ? (
                        <>
                            <div className="mb-2 flex gap-2 items-center justify-between w-full pr-4">
                                <div className="flex gap-2 items-center">
                                    <Button icon={<ZoomOutOutlined />} onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))} />
                                    <Button icon={<ZoomInOutlined />} onClick={() => setZoomLevel(z => Math.min(z + 0.1, 3))} />
                                    <span className="text-sm text-gray-600">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={folio}
                                        onChange={(e) => setFolio(e.target.value)}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && folio.trim()) await guardarFolio();
                                        }}
                                        placeholder="Ingrese folio"
                                        className="border px-2 py-1 rounded w-64"
                                    />
                                    <Button
                                        type="primary"
                                        disabled={!folio.trim()}
                                        onClick={guardarFolio}
                                    >
                                        {savingFolio ? <LoadingOutlined /> : (folioGuardado ? "Actualizar" : "Guardar")}
                                    </Button>
                                </div>
                            </div>
                            <Document
                                file={selectedDocBlobUrl}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            >
                                {Array.from(new Array(numPages), (_, index) => (
                                    <Page key={index + 1} pageNumber={index + 1} scale={zoomLevel} />
                                ))}
                            </Document>
                        </>
                    ) : (
                        <Empty description="Selecciona un documento del panel izquierdo para visualizarlo" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default VistaArchivoDua;
