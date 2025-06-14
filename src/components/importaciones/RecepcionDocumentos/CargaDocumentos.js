import React, { useState } from "react";
import { Tabs, Form, Input, Upload, Button, message, Spin, Modal } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import {
  procesarArchivoComprimido,
  guardarAsignacionesDua,
  subirArchivosIndividuales,
} from "../../../api/Documentos";

const { TabPane } = Tabs;
const { Dragger } = Upload;

const RecepcionDocumentos = () => {
  const [formDirecta] = Form.useForm();
  const [formZip] = Form.useForm();
  const [archivoZip, setArchivoZip] = useState(null);
  const [archivoTemp, setArchivoTemp] = useState(null);
  const [carpetas, setCarpetas] = useState([]);
  const [duasPorCarpeta, setDuasPorCarpeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [archivosOmitidos, setArchivosOmitidos] = useState([]);

  const anioActual = new Date().getFullYear();

  const handleDirectSubmit = async (values) => {
    const archivos = fileList || [];
    if (archivos.length === 0) {
      message.error("Debe seleccionar al menos un archivo.");
      return;
    }

    try {
      const res = await subirArchivosIndividuales(
        values.numero_dua,
        values.anio,
        archivos.map((f) => f.originFileObj)
      );

      if (res.data.archivos_omitidos && res.data.archivos_omitidos.length > 0) {
        Modal.warning({
          title: "Carga completada con advertencias",
          content: (
            <div>
              <p>
                Los siguientes archivos ya están registrados en otras
                declaraciones:
              </p>
              <ul>
                {res.data.archivos_omitidos.map((item, index) => (
                  <li key={index}>
                    <strong>{item.archivo}</strong> ya está en la DUA{" "}
                    <strong>{item.registrado_en}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ),
          width: 600,
        });
      } else {
        message.success("Archivos cargados correctamente.");
      }

      formDirecta.resetFields();
      formDirecta.setFieldsValue({ anio: anioActual });
      setFileList([]);
    } catch (error) {
      message.error("Error al subir archivos.");
    }
  };

  const handleZipProcesar = async () => {
    if (!archivoZip) {
      message.error("Seleccione un archivo comprimido.");
      return;
    }

    setLoading(true);
    try {
      const res = await procesarArchivoComprimido(archivoZip);
      setCarpetas(res.data.carpetas || []);
      setArchivoTemp(res.data.archivo_temp);

      const nuevasAsignaciones = {};
      res.data.carpetas.forEach((carpeta) => {
        nuevasAsignaciones[carpeta] = {
          numero_dua: "",
          anio: anioActual.toString(),
        };
      });
      setDuasPorCarpeta(nuevasAsignaciones);
      message.success("Archivo procesado correctamente.");
    } catch (error) {
      message.error("Error al procesar el archivo ZIP.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarZip = async () => {
    const asignaciones = carpetas.map((nombre) => ({
      carpeta: nombre,
      numero_dua: duasPorCarpeta[nombre]?.numero_dua,
      anio: duasPorCarpeta[nombre]?.anio,
    }));

    if (asignaciones.some((a) => !a.numero_dua || !a.anio)) {
      message.error("Todos los campos de DUA y año deben estar completos.");
      return;
    }

    if (!archivoTemp) {
      message.error("No se encontró el archivo temporal.");
      return;
    }

    setLoading(true);
    try {
      const res = await guardarAsignacionesDua(asignaciones, archivoTemp);

      if (res.data.archivos_omitidos && res.data.archivos_omitidos.length > 0) {
        setArchivosOmitidos(res.data.archivos_omitidos);
        Modal.warning({
          title: "Carga completada con advertencias",
          content: (
            <div>
              <p>
                Algunos archivos ya están registrados en las siguientes
                declaraciones:
              </p>
              <ul>
                {res.data.archivos_omitidos.map((item, index) => (
                  <li key={index}>
                    <strong>{item.archivo}</strong> ya está en la DUA{" "}
                    <strong>{item.registrado_en}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ),
          width: 600,
        });
      } else {
        message.success("Documentos registrados correctamente.");
      }

      formZip.resetFields();
      setArchivoZip(null);
      setArchivoTemp(null);
      setCarpetas([]);
      setDuasPorCarpeta({});
    } catch (error) {
      message.error("Error al guardar las asignaciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  return (
    <div className="w-full md:w-2/3 mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Carga de Documentos DUA
      </h2>
      <Tabs defaultActiveKey="directa">
        <TabPane tab="Carga directa" key="directa">
          <Form
            form={formDirecta}
            onFinish={handleDirectSubmit}
            layout="vertical"
            initialValues={{ anio: anioActual }}
          >
            <Form.Item
              label="Número de DUA"
              name="numero_dua"
              rules={[{ required: true, message: "Ingrese un número de DUA" }]}
            >
              <Input placeholder="Ejemplo: 123456789" />
            </Form.Item>

            <Form.Item
              label="Año"
              name="anio"
              rules={[{ required: true, message: "Ingrese el año de la DUA" }]}
            >
              <Input placeholder="Ejemplo: 2025" />
            </Form.Item>

            <Form.Item
              label="Archivos"
              name="archivos"
              valuePropName="fileList"
              getValueFromEvent={(e) =>
                Array.isArray(e) ? e : e && e.fileList
              }
              rules={[
                { required: true, message: "Seleccione al menos un archivo" },
              ]}
            >
              <Upload.Dragger
                multiple
                beforeUpload={() => false}
                onChange={handleFileChange}
                fileList={fileList}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Haz clic o arrastra los archivos aquí
                </p>
              </Upload.Dragger>
            </Form.Item>

            <Button type="primary" htmlType="submit" disabled={loading} block>
              {loading ? <Spin size="small" /> : "Subir Documentos"}
            </Button>
          </Form>
        </TabPane>

        <TabPane tab="Carga ZIP/RAR" key="zip">
          <Form form={formZip} layout="vertical">
            <Form.Item label="Archivo ZIP o RAR">
              <Dragger
                accept=".zip,.rar"
                multiple={false} // ← Esto es clave
                beforeUpload={(file) => {
                  setArchivoZip(file);
                  return false; // Evita el upload automático
                }}
                onRemove={() => {
                  setArchivoZip(null);
                  setArchivoTemp(null);
                }}
                showUploadList={{ showRemoveIcon: true }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Arrastra o selecciona un archivo comprimido
                </p>
              </Dragger>
            </Form.Item>

            <Button
              onClick={handleZipProcesar}
              disabled={!archivoZip || loading}
              block
              className="mb-4"
            >
              {loading ? <Spin size="small" /> : "Procesar Archivo"}
            </Button>

            {carpetas.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-4">
                  Asignar número de DUA y año por carpeta:
                </h3>
                {carpetas.map((carpeta, index) => (
                  <div key={index} className="flex gap-2 items-center mb-2">
                    <span className="w-1/3">{carpeta}</span>
                    <Input
                      placeholder="Número de DUA"
                      className="w-1/3"
                      value={duasPorCarpeta[carpeta]?.numero_dua || ""}
                      onChange={(e) =>
                        setDuasPorCarpeta((prev) => ({
                          ...prev,
                          [carpeta]: {
                            ...(prev[carpeta] || {}),
                            numero_dua: e.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      placeholder="Año"
                      className="w-1/3"
                      value={duasPorCarpeta[carpeta]?.anio || ""}
                      onChange={(e) =>
                        setDuasPorCarpeta((prev) => ({
                          ...prev,
                          [carpeta]: {
                            ...(prev[carpeta] || {}),
                            anio: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                ))}

                <Button
                  type="primary"
                  onClick={handleGuardarZip}
                  disabled={loading}
                  block
                >
                  {loading ? <Spin size="small" /> : "Guardar Asignaciones"}
                </Button>
              </>
            )}
          </Form>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RecepcionDocumentos;
