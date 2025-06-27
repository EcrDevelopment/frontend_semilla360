import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { getDocumentosPorDeclaracion, getDocumento, asignarPaginasDocumento } from "../../../api/Documentos";
import { Card, Typography, Layout, Spin, message, Select, Button, Modal, List } from 'antd';
import { FilePdfOutlined, ExclamationCircleOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Document, Page, pdfjs } from 'react-pdf';
import { getTipoDocumentos } from '../../../api/TipoDocumentos';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;





const CrearArchivoDua = () => {
    const { numero, anio } = useParams();
    const [documentos, setDocumentos] = useState([]);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [selectedDocBlobUrl, setSelectedDocBlobUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [siderCollapsed, setSiderCollapsed] = useState(false);
    const [guardandoSeleccion, setGuardandoSeleccion] = useState(false);


    const [pageSelections, setPageSelections] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1.0);


    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(800);

    const handleSelectDoc = (newDocId) => {
        if (hasUnsavedChanges) {
            confirm({
                title: "Cambiar documento",
                icon: <ExclamationCircleOutlined />,
                content: "Tienes cambios sin guardar. ¿Estás seguro de que quieres cambiar de documento y perder los cambios?",
                okText: "Sí, cambiar",
                cancelText: "No",
                onOk() {
                    setPageSelections({});
                    setHasUnsavedChanges(false);
                    setSelectedDocId(newDocId);
                }
            });
        } else {
            setSelectedDocId(newDocId);
            setPageSelections({});
        }
    };

    useEffect(() => {
        const fetchTipos = async () => {
            try {
                const response = await getTipoDocumentos();
                //console.log(response.data);
                setTiposDocumento(response.data);
            } catch (error) {
                console.error("Error al obtener tipos de documento:", error);
                message.error("No se pudieron cargar los tipos de documento");
            }
        };

        fetchTipos();
    }, []);

    useEffect(() => {
        const fetchDocumentos = async () => {
            try {
                const data = await getDocumentosPorDeclaracion(numero, anio);
                setDocumentos(data);

                if (data.length > 0) {
                    setSelectedDocId(data[0].id);
                }
            } catch (error) {
                console.error('Error al obtener documentos:', error);
                message.error("Error al obtener documentos");
            }
        };

        fetchDocumentos();
    }, [numero, anio]);

    useEffect(() => {
        if (!selectedDocId) {
            setSelectedDocBlobUrl(null);
            return;
        }

        setLoading(true);
        let isMounted = true;
        let currentUrl = null;

        getDocumento(selectedDocId)
            .then(blob => {
                if (isMounted) {
                    currentUrl = URL.createObjectURL(blob);
                    setSelectedDocBlobUrl(currentUrl);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error("Error al cargar PDF:", err);
                message.error("No se pudo cargar el archivo PDF");
                setSelectedDocBlobUrl(null);
                setLoading(false);
            });

        return () => {
            isMounted = false;
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [selectedDocId]);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(Math.min(containerRef.current.offsetWidth * 0.95, 800));
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    // Cambiar la selección para una página
    const handlePageSelectChange = (pageNumber, value) => {
        setPageSelections(prev => {
            const newSelections = { ...prev };
            if (value === undefined || value === null) {
                // Eliminar la página si no hay selección
                delete newSelections[pageNumber];
            } else {
                newSelections[pageNumber] = value;
            }
            setHasUnsavedChanges(Object.keys(newSelections).length > 0);
            return newSelections;
        });
    };

    // Botón guardar: enviar pageSelections al backend
    const handleGuardarSeleccion = async () => {
        setGuardandoSeleccion(true);
        const asignaciones = Object.entries(pageSelections).map(([page, tipo]) => ({
            page: parseInt(page),
            tipo
        }));
        try {
            await asignarPaginasDocumento(selectedDocId, asignaciones);
            setGuardandoSeleccion(false);
            setPageSelections({});
            message.success("Selección guardada correctamente");
            setHasUnsavedChanges(false);
        } catch (error) {
            setGuardandoSeleccion(false);
            console.error("Error al guardar selección:", error);
            message.error("Ocurrió un error al guardar la selección");
        }
    };

    return (

        <div>
            <Layout className="bg-white overflow-hidden" style={{ height: '100vh', maxHeight: '100vh' }}>

                <div style={{ position: 'relative' }}>                   
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 16,
                            left: siderCollapsed ? 0 : 300,
                            zIndex: 1000,
                            transition: 'left 0.3s ease',
                        }}
                    >
                        <Button
                            type="default"
                            icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setSiderCollapsed(!siderCollapsed)}
                            style={{
                                padding: '8px 16px',
                                fontSize: '16px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            }}
                            className='border-2 border-blue-500'
                        />
                    </div>
                    <Sider
                        width={300}
                        collapsed={siderCollapsed}
                        collapsedWidth={0}
                        className="bg-gray-50 border-r border-gray-200 overflow-auto"
                        style={{ height: '100%', overflowY: 'auto' }} // Ocupa toda la altura y scroll si necesario
                    >
                        <div className='p-4'>
                            <Title level={5}>Documentos DUA: {numero}-{anio}</Title>
                            {documentos.map(doc => (
                                <Card
                                    key={doc.id}
                                    size="small"
                                    className={`mb-3 cursor-pointer border ${selectedDocId === doc.id ? 'border-blue-500' : 'border-gray-200'} hover:shadow`}
                                    onClick={() => handleSelectDoc(doc.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <FilePdfOutlined className="text-red-500" />
                                        <div>
                                            <Text strong className="block">{doc.nombre_original}</Text>
                                            <Text type="secondary" className="text-xs block">{doc.usuario?.first_name} {doc.usuario?.last_name}</Text>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {/* Opciones seleccionadas por página */}
                            {Object.keys(pageSelections).length > 0 && (
                                <>
                                    <Title level={5}>Opciones seleccionadas por página</Title>
                                    <List
                                        size="small"
                                        bordered
                                        dataSource={Object.entries(pageSelections).map(([page, sel]) => {
                                            const tipoNombre = tiposDocumento.find(tipo => tipo.id === sel)?.nombre || sel;
                                            return `Página ${page}: ${tipoNombre}`;
                                        })}
                                        renderItem={item => <List.Item>{item}</List.Item>}
                                        className="mb-4"
                                    />
                                </>
                            )}


                            <div className='bottom-0 position-fixed  p-2 text-center items-center'>
                                <Button
                                    type="primary"
                                    disabled={Object.keys(pageSelections).length === 0}
                                    onClick={handleGuardarSeleccion}
                                    loading={guardandoSeleccion}
                                >
                                    Guardar selección
                                </Button>
                            </div>
                        </div>
                    </Sider>
                </div>

                <Content
                    className="p-6 relative flex flex-col"
                    ref={containerRef}
                    style={{
                        height: '100%', // Ocupa toda la altura del layout
                        overflowY: 'auto', // Scroll vertical independiente
                    }}
                >
                    {loading && <Spin size="large" />}

                    {selectedDocBlobUrl && !loading ? (
                        <div
                            className="flex flex-col items-center gap-4"
                            style={{
                                width: containerWidth,
                                margin: '0 auto',
                            }}
                        >
                            <div className="flex gap-4 justify-center items-center mb-4">
                                <Button onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))}>-</Button>
                                <span className="text-sm text-gray-700">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
                                <Button onClick={() => setZoomLevel(z => Math.min(z + 0.1, 3))}>+</Button>
                            </div>
                            <Document
                                file={selectedDocBlobUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={(err) => {
                                    console.error("Error al cargar PDF:", err);
                                    message.error("Este archivo no es un PDF válido o está dañado.");
                                    setSelectedDocBlobUrl(null);
                                }}
                            >
                                {Array.from(new Array(numPages), (el, index) => {
                                    const pageNumber = index + 1;
                                    return (
                                        <div
                                            key={`page_${pageNumber}`}
                                            style={{ position: 'relative', width: containerWidth, marginBottom: 16 }}
                                        >
                                            <Page pageNumber={pageNumber} width={containerWidth} scale={zoomLevel} />

                                            {/* Select para esta página */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 10,
                                                    right: 10,
                                                    width: 280,
                                                    background: 'rgba(255,255,255,0.9)',
                                                    padding: 8,
                                                    borderRadius: 4,
                                                    boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                                                    zIndex: 10,
                                                }}
                                            >
                                                <Select
                                                    placeholder={`Tipo para página ${pageNumber}`}
                                                    value={pageSelections[pageNumber] || undefined}
                                                    onChange={(val) => handlePageSelectChange(pageNumber, val)}
                                                    options={tiposDocumento.map((tipo) => ({
                                                        label: tipo.nombre,
                                                        value: tipo.id
                                                    }))}
                                                    allowClear
                                                    className='border-2 border-blue-400 rounded-lg w-full'
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </Document>
                        </div>
                    ) : (
                        !loading && (
                            <div className="text-center text-gray-500">
                                <p>Selecciona un documento para visualizarlo.</p>
                            </div>
                        )
                    )}
                </Content>
            </Layout>
        </div>
    );
};

export default CrearArchivoDua;
