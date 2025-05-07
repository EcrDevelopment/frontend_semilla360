import React, { useState } from "react";
import { InboxOutlined } from "@ant-design/icons";
import { message, Upload, Form, Select, Spin, Input, Button } from "antd";
import axiosInstance from "../../../axiosConfig";

const { Dragger } = Upload;
const { Option } = Select;

function RecepcionDocumentos() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [carpetas, setCarpetas] = useState([]);
    const [damNumbers, setDamNumbers] = useState({});
    const [archivo, setArchivo] = useState(null);

    const handleUpload = async () => {
        if (!archivo) {
            message.error("Por favor, seleccione un archivo antes de procesar.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("archivo", archivo);

        try {
            const response = await axiosInstance.post('/importaciones/procesar_archivo/', formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            message.success(`Archivo procesado correctamente.`);
            setCarpetas(response.data.carpetas);
        } catch (error) {
            message.error(`Error al procesar el archivo: ${error.response?.data?.error || "Inténtelo de nuevo."}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDAMChange = (index, value) => {
        setDamNumbers(prev => ({ ...prev, [index]: value }));
    };

    const onFinish = async () => {
        setLoading(true);
        try {
            const renamedFiles = carpetas.map((nombre, index) => ({
                original: nombre,
                nuevo: `${damNumbers[index] || '0000'}-2025`
            }));

            await axiosInstance.post('/importaciones/guardar_archivo/', { archivos: renamedFiles });

            message.success("Archivos renombrados y guardados correctamente.");
            setCarpetas([]);
            setDamNumbers({});
            form.resetFields();
            setArchivo(null);
        } catch (error) {
            message.error("Error al guardar los archivos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full md:w-1/2 mx-auto mt-10 p-4 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center">Recepción de Documentos</h2>

            <Form form={form} onFinish={onFinish} layout="vertical" requiredMark={false}>
                <Form.Item
                    label="Tipo de Documento:"
                    name="tipo_documento"
                    rules={[{ required: true, message: "Por favor, seleccione un tipo de documento" }]}
                >
                    <Select placeholder="Selecciona un tipo de documento" className="w-full">
                        <Option value="nacionalizacion">Documentos de nacionalización</Option>
                        <Option value="facturas">Facturas</Option>
                        <Option value="otros">Otros</Option>
                    </Select>
                </Form.Item>

                <Form.Item name="archivo">
                    <Dragger
                        beforeUpload={(file) => {
                            if (file.size / 1024 / 1024 > 50) {
                                message.error("El archivo debe ser menor a 50MB.");
                                return Upload.LIST_IGNORE;
                            }
                            setArchivo(file);
                            return false; // Evita que Ant Design haga la subida automática
                        }}
                        onRemove={() => setArchivo(null)}
                        showUploadList={{ showRemoveIcon: true }}
                    >
                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                        <p className="ant-upload-text">Haz clic o arrastra un archivo aquí</p>
                        <p className="ant-upload-hint">Solo se permite un archivo de hasta 50MB</p>
                    </Dragger>
                </Form.Item>

                <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={!archivo || loading}
                    className="w-full mb-4"
                >
                    {loading ? <Spin size="small" /> : "Procesar Archivo"}
                </Button>

                {carpetas.length > 0 && (
                    <div className="mt-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-lg mb-2">Renombrar Carpetas</h3>
                        {carpetas.map((nombre, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <span className="text-gray-600">{nombre}</span>
                                <Input
                                    placeholder="Ingrese número de DAM"
                                    onChange={(e) => handleDAMChange(index, e.target.value)}
                                    className="w-32"
                                />
                                <span>-2025</span>
                            </div>
                        ))}
                    </div>
                )}

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full"
                        disabled={loading || carpetas.length === 0}
                    >
                        {loading ? <Spin size="small" /> : "Guardar"}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default RecepcionDocumentos;
