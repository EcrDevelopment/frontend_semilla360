import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react'; // <--- Agregamos useCallback
import { getDocumentosPorDeclaracion, getDocumento, asignarPaginasDocumento } from "../../../api/Documentos";
import { Card, Typography, Spin, message, Select, Button, Modal, List, Splitter, Flex, Empty, Tooltip } from 'antd';
import { FilePdfOutlined, ExclamationCircleOutlined, CloudDownloadOutlined } from '@ant-design/icons'; // <--- Agregamos CloudDownloadOutlined
import { Document, Page, pdfjs } from 'react-pdf';
import { getTipoDocumentos } from '../../../api/TipoDocumentos';

// --- IMPORTA TU COMPONENTE MODAL AQUÍ ---
// Ajusta la ruta según dónde hayas guardado el archivo anterior
import SenasaImporterModal from './SenasaImporter'; 

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const { Title, Text } = Typography;
const { confirm } = Modal;

const CrearArchivoDua = () => {
  const { numero, anio } = useParams();
  const [documentos, setDocumentos] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDocBlobUrl, setSelectedDocBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [guardandoSeleccion, setGuardandoSeleccion] = useState(false);

  const [pageSelections, setPageSelections] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // --- NUEVO: ESTADO PARA EL MODAL SENASA ---
  const [isSenasaModalOpen, setIsSenasaModalOpen] = useState(false);

  // --- Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- NUEVO: LISTENER PARA LA TECLA F4 ---
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'F4') {
      event.preventDefault(); // Evita que el navegador abra barras de dirección, etc.
      setIsSenasaModalOpen((prev) => !prev);
      console.log("F4 presionado: Toggle Modal SENASA");
    }
  }, []);

  useEffect(() => {
    // Agregamos el listener global
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      // Limpiamos el listener al desmontar
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (containerRef.current) {
        setContainerWidth(Math.min(containerRef.current.offsetWidth * 0.95, 800));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        const response = await getTipoDocumentos({all:true});
        setTiposDocumento(response.data.results||[]);
      } catch (error) {
        console.error("Error al obtener tipos de documento:", error);
        message.error("No se pudieron cargar los tipos de documento");
      }
    };
    fetchTipos();
  }, []);

  // Función extraída para poder recargar documentos tras importar de SENASA si fuera necesario
 const fetchDocumentos = useCallback(async () => {
    try {
      const data = await getDocumentosPorDeclaracion(numero, anio);
      setDocumentos(data);

      // TRUCO: Usamos la forma funcional del setter (prev => ...)
      // Esto nos permite verificar si ya hay un seleccionado sin agregar 
      // 'selectedDocId' a las dependencias de este useCallback.
      setSelectedDocId(prevSelected => {
        if (data.length > 0 && !prevSelected) {
          return data[0].id;
        }
        return prevSelected;
      });
      
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      message.error("Error al obtener documentos");
    }
  }, [numero, anio]); // <--- Ahora esta función es estable

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const handlePageSelectChange = (pageNumber, value) => {
    setPageSelections(prev => {
      const newSelections = { ...prev };
      if (value === undefined || value === null) {
        delete newSelections[pageNumber];
      } else {
        newSelections[pageNumber] = value;
      }
      setHasUnsavedChanges(Object.keys(newSelections).length > 0);
      return newSelections;
    });
  };

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

  // --- Panel izquierdo (lista de documentos + guardar selección)
  const LeftPanel = (
    <div className='p-4 h-full overflow-y-auto bg-gray-50 border-r border-gray-200'>
      
      {/* --- CABECERA MEJORADA CON BOTÓN DE SENASA --- */}
      <div className="flex justify-between items-center mb-4">
        <Title level={5} style={{margin: 0}}>Docs DUA: {numero}-{anio}</Title>
        <Tooltip title="Importar recibos SENASA (F4)">
            <Button 
                type="text" 
                icon={<CloudDownloadOutlined style={{ fontSize: '18px', color: '#1890ff' }} />} 
                onClick={() => setIsSenasaModalOpen(true)}
            />
        </Tooltip>
      </div>

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
              <Text type="secondary" className="text-xs block">
                {doc.usuario?.first_name} {doc.usuario?.last_name}
              </Text>
            </div>
          </div>
        </Card>
      ))}

      {Object.keys(pageSelections).length > 0 && (
        <>
          <Title level={5}>Opciones seleccionadas</Title>
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

      <div className="p-2 text-center">
        <Button
          type="primary"
          disabled={Object.keys(pageSelections).length === 0}
          onClick={handleGuardarSeleccion}
          loading={guardandoSeleccion}
          block={isMobile} 
        >
          Guardar selección
        </Button>
      </div>
    </div>
  );

  // --- Panel derecho (visor PDF)
  const RightPanel = (
    <div
      ref={containerRef}
      className="p-4 h-full overflow-y-auto flex flex-col items-center"
    >
      {loading && <Spin size="large" />}

      {selectedDocBlobUrl && !loading ? (
        <div
          className="flex flex-col items-center gap-4 w-full"
          style={{ maxWidth: 800, margin: '0 auto' }}
        >
          <div className="flex gap-4 justify-center items-center mb-4 flex-wrap">
            <Button onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))}>-</Button>
            <span className="text-sm text-gray-700">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
            <Button onClick={() => setZoomLevel(z => Math.min(z + 0.1, 3))}>+</Button>
          </div>
          <Document
            file={selectedDocBlobUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => {
              console.error("Error al cargar PDF");
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
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: isMobile ? "90%" : 280,
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
                      className='w-full'
                    />
                  </div>
                </div>
              );
            })}
          </Document>
        </div>
      ) : (
        !loading && (
          <Empty description="Selecciona un documento para previsualizar" />
        )
      )}
    </div>
  );

  return (
    <Flex style={{ height: "100vh" }} vertical={isMobile}>
      {isMobile ? (
        <Splitter style={{ width: "100%", height: "100%" }} layout='vertical'>
          <Splitter.Panel collapsible min="20%" max="30%">
            {LeftPanel}
          </Splitter.Panel>
          <Splitter.Panel>
            {RightPanel}
          </Splitter.Panel>
        </Splitter>
      ) : (
        <Splitter style={{ width: "100%", height: "100%" }}>
          <Splitter.Panel 
            collapsible
            min="20%"  
            max="30%"
            defaultSize="25%">
            {LeftPanel}
          </Splitter.Panel>
          <Splitter.Panel>
            {RightPanel}
          </Splitter.Panel>
        </Splitter>
      )}

      {/* --- AQUÍ AGREGAMOS EL MODAL --- */}
      <SenasaImporterModal 
        open={isSenasaModalOpen} 
        onClose={() => setIsSenasaModalOpen(false)}
        
        // Pasamos los datos de la URL (useParams)
        numeroDua={numero} 
        anioDua={anio}
        
        // Cuando se importe exitosamente, recargamos la lista de documentos de la izquierda
        onImportSuccess={() => {
            fetchDocumentos(); // Esta es la función que ya tenías para cargar la lista
        }}
      />

    </Flex>
  );
};

export default CrearArchivoDua;