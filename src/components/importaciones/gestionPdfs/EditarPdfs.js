import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Checkbox, Space, Card, Row, Col, Affix, Spin, Divider } from 'antd';
import { MinusOutlined, FileAddOutlined } from '@ant-design/icons';
import { getDocumento, eliminarHojasPdf } from "../../../api/Documentos";

import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const EditarPdfPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPageInView, setCurrentPageInView] = useState(1);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [paginasAEliminar, setPaginasAEliminar] = useState([]);

  const pdfContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const [containerWidth, setContainerWidth] = useState(null);

  const pdfObjectUrlRef = useRef(null);

  // Load PDF
  const cargarPdf = useCallback(async () => {
    setLoadingPdf(true);
    try {
      const blobData = await getDocumento(id);
      const file = new Blob([blobData], { type: 'application/pdf' });
      const newUrl = URL.createObjectURL(file);

      if (pdfObjectUrlRef.current && pdfObjectUrlRef.current !== newUrl) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
      }
      pdfObjectUrlRef.current = newUrl;

      setPdfUrl(newUrl);
    } catch (error) {
      message.error("No se pudo cargar el PDF. Inténtalo de nuevo.");
      console.error("Error al cargar el PDF:", error);
      setPdfUrl(null);
    }
  }, [id]);

  useEffect(() => {
    cargarPdf();
    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = null;
      }
    };
  }, [id, cargarPdf]);

  // Adjust container width
  useEffect(() => {
    const handleResize = () => {
      if (pdfContainerRef.current) {
        setContainerWidth(Math.min(pdfContainerRef.current.offsetWidth * 0.9, 800));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setCurrentPageInView(1);
    setLoadingPdf(false);
    pageRefs.current = pageRefs.current.slice(0, numPages);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    message.error(`Error al cargar el documento: ${error.message}`);
    setLoadingPdf(false);
    setPdfUrl(null);
  }, []);

  // Intersection Observer to detect current page in view
  useEffect(() => {
    if (!pdfContainerRef.current || numPages === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNumber = parseInt(entry.target.dataset.pagenumber);
            setCurrentPageInView(pageNumber);
          }
        });
      },
      {
        root: pdfContainerRef.current,
        rootMargin: '0px',
        threshold: 0.5,
      }
    );

    pageRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [numPages]);

  const togglePagina = (pagina) => {
    setPaginasAEliminar(prev =>
      prev.includes(pagina)
        ? prev.filter(p => p !== pagina)
        : [...prev, pagina].sort((a, b) => a - b)
    );
  };

  const handleEliminar = async () => {
    if (paginasAEliminar.length === 0) {
      message.warning("Selecciona al menos una página para eliminar.");
      return;
    }

    const hide = message.loading('Eliminando páginas del PDF...', 0);
    try {
      const response = await eliminarHojasPdf(id, paginasAEliminar);
      hide();
      navigate(-1, { state: { successMessage: response.mensaje || "PDF editado con éxito." } });
    } catch (error) {
      hide();
      const errorMessage = error.response?.data?.error || "Error desconocido al editar el PDF.";
      message.error(errorMessage);
      console.error("Detalle del error al eliminar páginas:", error);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Row justify="center" className="mb-6">
        <Col span={24} className="text-center">
          <h1 className="text-3xl font-semibold text-gray-800">Editar PDF (ID: {id})</h1>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Sidebar */}
        <Col xs={24} md={8}>
          <Card
            title="Opciones"
            className="mb-6 shadow-md border border-gray-300 rounded-lg"
            bodyStyle={{ padding: '1rem' }}
          >
            <Space direction="vertical" size="middle" className="w-full">
              <Button
                type="primary"
                danger
                icon={<MinusOutlined />}
                onClick={handleEliminar}
                disabled={paginasAEliminar.length === 0}
                size="large"
                block
              >
                Eliminar páginas seleccionadas ({paginasAEliminar.length})
              </Button>

              <Divider />

              <p className="text-sm text-gray-600 mb-1 font-medium">
                Páginas seleccionadas para eliminar:
              </p>
              <div className="min-h-[40px] p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 select-none">
                {paginasAEliminar.length > 0 ? paginasAEliminar.join(', ') : 'Ninguna'}
              </div>
            </Space>
          </Card>

          <Card
            title="Seleccionar Páginas para Eliminar"
            className="shadow-md border border-gray-300 rounded-lg"
            bodyStyle={{ padding: '1rem', maxHeight: 440, overflowY: 'auto' }}
          >
            {numPages ? (
              <Space direction="vertical" size="small" className="w-full">
                {Array.from(new Array(numPages), (_, index) => {
                  const pageNum = index + 1;
                  const checked = paginasAEliminar.includes(pageNum);
                  return (
                    <Checkbox
                      key={`checkbox-sidebar-${pageNum}`}
                      onChange={() => togglePagina(pageNum)}
                      checked={checked}
                      className={checked ? 'text-red-600 font-semibold' : ''}
                    >
                      Página {pageNum}
                    </Checkbox>
                  );
                })}
              </Space>
            ) : (
              <p className="text-center text-gray-500">Cargando número de páginas...</p>
            )}
          </Card>
        </Col>

        {/* PDF Viewer */}
        <Col xs={24} md={16}>
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>Visor de Documento</span>
                <span className="text-sm text-gray-600">
                  Página actual: <strong>{currentPageInView}</strong> / {numPages || '-'}
                </span>
              </div>
            }
            className="shadow-md border border-gray-300 rounded-lg"
            bodyStyle={{ padding: '1rem' }}
          >
            {loadingPdf && !pdfUrl ? (
              <div className="flex flex-col justify-center items-center h-[400px] gap-3 text-gray-500">
                <Spin size="large" />
                <span>Cargando documento...</span>
              </div>
            ) : pdfUrl ? (
              <div
                ref={pdfContainerRef}
                className="border border-gray-200 rounded-md bg-white p-4 h-[calc(100vh-250px)] overflow-y-auto flex flex-col items-center gap-6"
              >
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                >
                  {Array.from(new Array(numPages), (_, index) => {
                    const pageNum = index + 1;
                    const selected = paginasAEliminar.includes(pageNum);
                    return (
                      <div
                        key={`page-${pageNum}`}
                        ref={(el) => (pageRefs.current[index] = el)}
                        data-pagenumber={pageNum}
                        style={{
                          position: 'relative',
                          marginBottom: 20,
                          boxShadow: selected ? '0 0 12px 4px rgba(255, 77, 79, 0.6)' : 'none',
                          borderRadius: 6,
                          transition: 'box-shadow 0.25s ease-in-out',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                        onClick={() => togglePagina(pageNum)}
                        title={`Página ${pageNum} - Haz click para ${selected ? 'deseleccionar' : 'seleccionar'} esta página para eliminar`}
                      >
                        <Checkbox
                          checked={selected}
                          onChange={() => togglePagina(pageNum)}
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            padding: '5px 10px',
                            borderRadius: 4,
                            border: selected ? '1.5px solid #ff4d4f' : '1px solid #d9d9d9',
                            zIndex: 15,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Eliminar
                        </Checkbox>
                        <Page
                          pageNumber={pageNum}
                          width={containerWidth}
                          loading={<Spin />}
                          onLoadError={(error) =>
                            console.error(`Error al cargar página ${pageNum}:`, error)
                          }
                        />
                      </div>
                    );
                  })}
                </Document>
              </div>
            ) : (
              <p className="text-center text-red-600">No se pudo cargar el PDF o no hay PDF disponible.</p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EditarPdfPage;
