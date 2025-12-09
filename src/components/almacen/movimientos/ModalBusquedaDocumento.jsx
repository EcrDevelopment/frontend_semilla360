import { useState } from "react";
import {
    Modal,
    Form,
    Select,
    Input,
    message,
    Button,
    Card,
    Row,
    Col,
    Tag,
    Divider,
} from "antd";
import { consultarGuia } from "../../../api/Almacen";
import {
    CheckCircleOutlined,
    EnvironmentOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Option } = Select;

const ModalBusquedaDocumento = ({ visible, onClose, onSelectDocumento }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [cabecera, setCabecera] = useState(null);
    const [detalles, setDetalles] = useState([]);
    const [showDetalles, setShowDetalles] = useState(false);

    const consultarGuiaDocumento = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const response = await consultarGuia(values);
            setCabecera(response.data.cabecera);
            setDetalles(response.data.detalles);
            message.success("Documento encontrado");
        } catch (error) {
            setCabecera(null);
            setDetalles([]);
            if (error.response) {
                message.error(error.response.data.error || "Error en la consulta");
            } else if (error.request) {
                message.error("No se pudo conectar con el servidor");
            } else {
                message.error("Error desconocido: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const buildDetalleDTO = (detalles) => {
        let detalleDTO = {};      
        detalles.forEach((det) => {
          if (det.itemcodigo === "TEXTO") {
            // si es TEXTO → solo agregamos las claves que realmente existan en parsed
            if (det.parsed) {
              Object.entries(det.parsed).forEach(([key, value]) => {
                if (value) {
                  detalleDTO[key] = value;
                }
              });
            }
          } else {
            // si es producto normal → agregamos solo los campos de producto
            detalleDTO = {
              ...detalleDTO,
              itemcodigo: det.itemcodigo,
              itemdescripcion: det.itemdescripcion,
              itemcantidad: det.itemcantidad,
              itemumedida_origen: det.itemumedida_origen,
            };
          }
        });      
        return detalleDTO;
      };

    const handleSeleccionarDocumento = () => {

        const cabeceraDTO = cabecera;
        const detalleDTO = buildDetalleDTO(detallesProcesados);        

        const data = { cabecera: cabeceraDTO, detalles: detalleDTO };
        onSelectDocumento(data);

        // Resetear modal
        onClose();
        setCabecera(null);
        setDetalles([]);
        form.resetFields();
        setShowDetalles(false);
    };

    function parseTextoDescripcion(texto) {
        const result = {};
        const lineas = texto
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l);

        lineas.forEach((linea) => {
            if (/(\d+)\s+SACOS/i.test(linea)) {
                const match = linea.match(/(\d+)\s+SACOS/i);
                if (match) result.sacos = parseInt(match[1], 10);
            }
            if (/^DUA:/i.test(linea)) {
                result.dua = linea.replace(/^DUA:\s*/i, "").trim();
            }
            if (/^MARCA Y PLACA:/i.test(linea)) {
                result.marca_placa = linea.replace(/^MARCA Y PLACA:\s*/i, "").trim();
            }
            if (/^CERT\. DE INSCRIPCION:/i.test(linea)) {
                result.certificado = linea
                    .replace(/^CERT\. DE INSCRIPCION:\s*/i, "")
                    .trim();
            }
            if (/^CONFIG\. VEHICULAR:/i.test(linea)) {
                result.configuracion = linea
                    .replace(/^CONFIG\. VEHICULAR:\s*/i, "")
                    .trim();
            }
            if (/^CONDUCTOR:/i.test(linea)) {
                result.conductor = linea.replace(/^CONDUCTOR:\s*/i, "").trim();
            }
            if (/^LICENCIA:/i.test(linea)) {
                result.licencia = linea.replace(/^LICENCIA:\s*/i, "").trim();
            }
        });

        return result;
    }


    const detallesProcesados = detalles.map((det) => {
        if (det.itemcodigo === "TEXTO") {
            return {
                ...det,
                parsed: parseTextoDescripcion(det.itemdescripcion),
            };
        }
        return det;
    });

    return (
        <Modal
            open={visible}
            centered
            title="Consulta de Documentos"
            confirmLoading={loading}
            onCancel={onClose}
            footer={<Button onClick={onClose}>Cancelar</Button>}
            width="100%"
            style={{ maxWidth: 900 }}
        >
            {/* Formulario */}
            <Form form={form} layout="horizontal" requiredMark={false}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item
                            label="Empresa"
                            name="empresa"
                            rules={[{ required: true, message: "Seleccione la empresa" }]}
                        >
                            <Select placeholder="Seleccione empresa">
                                <Option value="semilla">Semilla</Option>
                                <Option value="maxi">Maxi</Option>
                                <Option value="trading">Trading</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Form.Item
                            label="Serie"
                            name="grenumser"
                            rules={[{ required: true, message: "Seleccione Serie" }]}
                        >
                            <Select placeholder="Seleccione serie">
                                <Option value="T001">T001</Option>
                                <Option value="T002">T002</Option>
                                <Option value="T003">T003</Option>
                                <Option value="T004">T004</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Form.Item
                            label="Número"
                            name="grenumdoc"
                            rules={[{ required: true, message: "Ingrese el número" }]}
                        >
                            <Input placeholder="Ej: 2618 o 0002618" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Button
                            type="primary"
                            onClick={consultarGuiaDocumento}
                            loading={loading}
                            block
                        >
                            Consultar
                        </Button>
                    </Col>
                </Row>
            </Form>

            <Divider />

            {/* Card de resultados */}
            {(cabecera || detallesProcesados.length > 0) && (
                <Card
                    loading={loading}
                    className="mt-4"
                    actions={[
                        <EyeOutlined
                            key="ver"
                            onClick={() => setShowDetalles((prev) => !prev)}
                        />,
                        <CheckCircleOutlined
                            key="seleccionar"
                            onClick={handleSeleccionarDocumento}
                        />,
                    ]}
                >
                    <Card.Meta
                        title={
                            <div className="flex flex-col lg:flex-row justify-between gap-2 ">
                                <div className="font-bold text-fuchsia-600 text-sm">
                                    {cabecera?.serie}-{cabecera?.numero}
                                </div>
                                <div className="text-sky-600 text-sm flex flex-row items-center gap-2">
                                    {cabecera?.fecha_emision
                                        ? moment(cabecera.fecha_emision).format("DD/MM/YYYY")
                                        : ""}
                                    <Tag color="green">{cabecera?.motivo_traslado}</Tag>
                                </div>
                            </div>
                        }
                        description={
                            <div className="text-sm text-gray-700 space-y-1">
                                <p>
                                    <strong>Emisor:</strong> {cabecera?.emisorrazsocial}
                                </p>
                                <p className="text-xs">
                                    <EnvironmentOutlined className="text-sky-500" />{" "}
                                    {cabecera?.partida_direccion}
                                </p>
                                <p>
                                    <strong>Receptor:</strong> {cabecera?.receptorrazsocial}
                                </p>
                                <p className="text-xs">
                                    <EnvironmentOutlined className="text-sky-500" />{" "}
                                    {cabecera?.llegada_direccion}
                                </p>
                                <p>
                                    <strong>Transporte:</strong> {cabecera?.transportistarazsocial}
                                </p>
                            </div>
                        }
                    />

                    {/* Sección de detalles (toggle con EyeOutlined) */}
                    {showDetalles && (
                        <div className="mt-4 text-xs">
                            <h4 className="font-semibold text-gray-700 mb-2 bg-blue-200 rounded-md px-2 items-center">
                                🚚 Detalles del Traslado
                            </h4>

                            {detallesProcesados.map((det, idx) => (
                                <div
                                    key={idx}
                                    className="p-1 rounded-md bg-gray-50"
                                >
                                    {det.itemcodigo === "TEXTO" ? (
                                        <>
                                            {Object.entries(det.parsed || {}).map(([key, value]) => (
                                                <p key={key} className="text-sm ">
                                                    <Tag color="blue">{key.toUpperCase()}</Tag> {value}
                                                </p>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm">
                                                <strong>Código:</strong> {det.itemcodigo}
                                            </p>
                                            <p className="text-sm">
                                                <strong>Producto:</strong> {det.itemdescripcion}
                                            </p>
                                            <p className="text-sm">
                                                <strong>Cantidad:</strong>{" "}
                                                {parseFloat(det.itemcantidad).toLocaleString()}{" "}
                                                {det.itemumedida_origen}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </Modal>
    );
};

export default ModalBusquedaDocumento;
