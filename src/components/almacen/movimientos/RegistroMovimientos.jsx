import { useState } from "react";
import { Form, Input, InputNumber, Button, Select, Space, Divider,message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ModalBusquedaDocumento from "./ModalBusquedaDocumento";

import { getDistritoById } from "../../../api/Localizacion";

const { Option } = Select;

const RegistroMovimiento = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Estado para guardar los datos seleccionados
    const [docSeleccionado, setDocSeleccionado] = useState({
        cabecera: null,
        detalles: [],
    });

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleDocumentoSeleccionado = (data) => {
        //console.log("Documento seleccionado:", data.cabecera);

        // Guardar en estado global del padre
        setDocSeleccionado({ data });

        // Poner en el form solo el texto de referencia
        form.setFieldsValue({
            documento_referencia: data.cabecera ? `${data.cabecera.serie}-${data.cabecera.numero}` : "",
            sacos: data.detalles.sacos ? data.detalles.sacos : 0,
            transporte: data.cabecera.transportistarazsocial ? data.cabecera.transportistarazsocial : "",
            direccion_llegada: data.cabecera.llegada_direccion ? data.cabecera.llegada_direccion : "",
            producto: data.detalles.itemdescripcion ? data.detalles.itemdescripcion : "",
            datos_vehiculo: data.detalles.marca_placa? data.detalles.marca_placa : "",
            dua: data.detalles.dua ? data.detalles.dua : "",
            ubigeo: data.cabecera.llegada_ubigeo ? data.cabecera.llegada_ubigeo : "",
        });

        handleUbigeo(data.cabecera.llegada_ubigeo);
    };

    const handleSubmit = (values) => {
        console.log("Valores del formulario:", values);
        message.success("Formulario enviado correctamente");
        //console.log("Cabecera seleccionada:", docSeleccionado.cabecera);
        //console.log("Detalles seleccionados:", docSeleccionado.detalles);
        // Aquí puedes enviar todo junto a tu backend
    };

    const handleUbigeo = async (id) => {
        console.log("Ubigeo ingresado:",id);
        //const id = e.target.value;
        if (id) {
            try {
                const distrito = await getDistritoById(id);
                // ejemplo: actualizar dirección con nombre del distrito
                if (distrito != null) {
                    console.log("Distrito encontrado:", distrito.name);
                }
                form.setFieldsValue({
                    ubigeo: distrito.name || "",
                });
            } catch (err) {
                console.error("Error obteniendo distrito:", err);
            }
        }
    };

    return (
        <div className="w-full h-full p-4 bg-sky-100">
            <div className="p-4 my-2 bg-white rounded shadow-lg lg:w-2/4 m-auto">
                <h2 className="text-2xl font-bold mb-4">Registrar Movimiento</h2>
                <Divider />
                <Form
                    form={form}
                    layout="horizontal"
                    autoComplete="off"
                    onFinish={handleSubmit}
                    requiredMark={false}
                >
                    <Form.Item
                        name="tipo"
                        label="Tipo de Movimiento:"
                        rules={[
                            { required: true, message: "Por favor seleccione el tipo de movimiento" },
                        ]}
                    >
                        <Select placeholder="Seleccione el tipo de movimiento">
                            <Option value="ingreso">Ingreso</Option>
                            <Option value="salida">Salida</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="hora"
                        label="Hora:"
                        rules={[{ required: true, message: "Por favor ingrese la hora" }]}
                    >
                        <Input type="time" />
                    </Form.Item>

                    <Form.Item
                        label="Documento de referencia:"
                        required
                    >
                        <Space.Compact style={{ width: "100%" }}>
                            <Form.Item
                                name="documento_referencia"
                                noStyle
                                rules={[{ required: true, message: "Por favor ingrese el documento de referencia" }]}
                            >
                                <Input placeholder="Documento..." />
                            </Form.Item>
                            <Button
                                icon={<SearchOutlined />}
                                type="primary"
                                onClick={showModal}
                                loading={loading}
                            />
                        </Space.Compact>
                    </Form.Item>

                    <Form.Item
                        name="transporte"
                        label="Empresa de transporte:"
                        rules={[{ required: true, message: "Por favor ingrese transporte" }]}
                    >
                        <Input placeholder="EMPRESAS PEPITO SAC" />
                    </Form.Item>

                    <Form.Item
                        name="direccion_llegada"
                        label="Direccion de  llegada:"
                        rules={[{ required: true, message: "Por favor ingrese Dirección de llegada" }]}
                    >
                        <Input placeholder="Direccion llegada" />
                    </Form.Item>

                    <Form.Item
                        name="ubigeo"
                        label="Ubigeo:"
                        rules={[{ required: true, message: "Por favor ingrese Ubigeo" }]}
                    >
                        <Input placeholder="Ubigeo" />
                    </Form.Item>

                    <Form.Item
                        name="producto"
                        label="Producto:"
                        rules={[{ required: true, message: "Por favor ingrese producto" }]}
                    >
                        <Input placeholder="Soyita pa tomar" />
                    </Form.Item>                    

                    <Form.Item
                        name="sacos"
                        label="Sacos:"
                        rules={[{ required: true, message: "Por favor ingrese la cantidad" }]}
                    >
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                        name="dua"
                        label="DUA: "
                        
                    >
                        <Input placeholder="00620484" />
                    </Form.Item>

                    <Form.Item
                        name="datos_vehiculo"
                        label="Datos del vehiculo:"
                    >
                        <Input placeholder="Placa y marca vehículo" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Registrar
                        </Button>
                    </Form.Item>
                </Form>
            </div>

            <ModalBusquedaDocumento
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectDocumento={handleDocumentoSeleccionado}
            />
        </div>
    );
};

export default RegistroMovimiento;
