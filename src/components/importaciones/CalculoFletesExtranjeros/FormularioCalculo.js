import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Select,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Button,
    AutoComplete,
    message,
    Tag,
    Space,
    Modal, // Importar Modal si pones el componente de conflictos en el mismo archivo
} from 'antd';
import axiosInstance from '../../../axiosConfig';
import dayjs from 'dayjs';
import ModalProrrateo from './ModalProrrateo';
import ModalConfirmacionConflictos from './ModalConfirmacionConflictos';

const { Option } = Select;
const initialFormValues = {
    // ... (sin cambios)
    producto: '',
    proveedor: '',
    dua: '',
    ordenRecojo: [],
    numRecojo: '',
    cartaPorte: '',
    numFactura: '',
    transportista: '',
    fletePactado: '',
    presoNetoCrt: 0,
    precioProducto: 0,
};

function FormularioCalculo({ onDataValidate, initialData }) {
    const [baseDatos, setBaseDatos] = useState('');
    const [resultadosOC, setResultadosOC] = useState([]);
    const [resultadosTransportista, setResultadosTransportista] = useState([]);
    const [searchTermOC, setSearchTermOC] = useState('');
    const [modalProrrateoVisible, setModalProrrateoVisible] = useState(false);
    const [ocSeleccionada1, setOcSeleccionada1] = useState(null);
    const [ocSeleccionada2, setOcSeleccionada2] = useState(null);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [modalConflictosVisible, setModalConflictosVisible] = useState(false);
    const [ocPendiente, setOcPendiente] = useState(null);
    const [pesosAsignados, setPesosAsignados] = useState({ peso1: null, peso2: null });


    useEffect(() => {
        if (initialData) {
            const formattedData = {
                ...initialData,
                fechaNumeracion: initialData.fechaNumeracion
                    ? dayjs(initialData.fechaNumeracion)
                    : null,
            };
            form.setFieldsValue(formattedData);
            const [rec1, rec2] = initialData.ordenRecojo || [];
            if (rec1?.oc) setOcSeleccionada1(rec1.oc);
            if (rec2?.oc) setOcSeleccionada2(rec2.oc);
        }
    }, [initialData, form]);

    // --- Búsquedas ---
    const buscarTransportista = useCallback(async (termino) => {
        if (!baseDatos) return;
        try {
            const response = await axiosInstance.get('/importaciones/buscar_prov/', {
                params: { base_datos: baseDatos, query: termino },
            });
            setResultadosTransportista(response.data);
        } catch (error) { console.error('Error al buscar proveedor:', error); }
    }, [baseDatos]);

    const handleSearchTransportista = useCallback((value) => {
        if (value.length > 1 && baseDatos) buscarTransportista(value);
        else setResultadosTransportista([]);
    }, [baseDatos, buscarTransportista]);

    const handleSelectTransportista = useCallback(
        (value) => {
            const prov = resultadosTransportista.find((p) => p.nombre === value);
            if (prov) form.setFieldsValue({ transportista: prov.nombre });
        },
        [resultadosTransportista, form],
    );

    const handleBaseDatosChange = useCallback((value) => {
        setBaseDatos(value);
        setResultadosOC([]);
        setOcSeleccionada1(null);
        setOcSeleccionada2(null);
        form.resetFields(Object.keys(initialFormValues));
    }, [form]);

    const buscarImportaciones = useCallback(async (termino) => {
        if (!baseDatos) return;
        try {
            const response = await axiosInstance.get('/importaciones/buscar_oi/', {
                params: { base_datos: baseDatos, query: termino },
            });
            setResultadosOC(response.data);
        } catch (error) { console.error('Error al buscar importaciones:', error); }
    }, [baseDatos]);

    const handleSearchOC = useCallback((value) => {
        setSearchTermOC(value);
        if (value.length > 2 && baseDatos) buscarImportaciones(value);
        else setResultadosOC([]);
    }, [baseDatos, buscarImportaciones]);


    // --- LÓGICA DE SELECCIÓN DE OC (MODIFICADA) ---
    const handleSelectOC = useCallback((value) => {
        const ocObject = resultadosOC.find((r) => r.numero_oc === value);
        if (!ocObject) return;

        if (ocSeleccionada1?.numero_oc === value || ocSeleccionada2?.numero_oc === value) {
            messageApi.warning('Esta OC ya ha sido agregada.');
            setSearchTermOC('');
            setResultadosOC([]);
            return;
        }

        // Caso 1: Añadir la primera OC
        if (!ocSeleccionada1) {
            setOcSeleccionada1(ocObject);
            form.setFieldsValue({
                proveedor: ocObject.proveedor,
                producto: ocObject.producto,
                precioProducto: ocObject.precio_unitario,
                numRecojo: '',
            });
        }
        // Caso 2: Añadir la segunda OC
        else if (!ocSeleccionada2) {
            // *** AQUÍ ESTÁ LA VALIDACIÓN ***
            const conflictoProducto = ocSeleccionada1.producto !== ocObject.producto;
            const conflictoProveedor = ocSeleccionada1.proveedor !== ocObject.proveedor;

            if (conflictoProducto || conflictoProveedor) {
                // Hay conflicto: Mostrar modal de advertencia
                setOcPendiente(ocObject); // Guardar OC en espera
                setModalConflictosVisible(true);
            } else {
                // No hay conflicto: Proceder como antes
                setOcSeleccionada2(ocObject);
                form.setFieldsValue({
                    proveedor: ocSeleccionada1.proveedor,
                    producto: ocSeleccionada1.producto,
                });
                setModalProrrateoVisible(true); // Abrir modal de prorrateo
            }
        }
        // Caso 3: Límite
        else {
            messageApi.error('Solo puede seleccionar un máximo de 2 Órdenes de Compra.');
        }

        setSearchTermOC('');
        setResultadosOC([]);
    }, [resultadosOC, ocSeleccionada1, ocSeleccionada2, form, messageApi]);

    const handleRemoveOC = useCallback((ocNumero) => {
        let newOC1 = ocSeleccionada1;
        let newOC2 = ocSeleccionada2;

        if (ocSeleccionada1?.numero_oc === ocNumero) {
            newOC1 = ocSeleccionada2;
            newOC2 = null;
        } else if (ocSeleccionada2?.numero_oc === ocNumero) {
            newOC2 = null;
        }

        setOcSeleccionada1(newOC1);
        setOcSeleccionada2(newOC2);

        if (newOC1 && !newOC2) {
            form.setFieldsValue({
                proveedor: newOC1.proveedor,
                producto: newOC1.producto,
                precioProducto: newOC1.precio_unitario,
                numRecojo: '',
            });
        } else if (!newOC1) {
            form.resetFields(['proveedor', 'producto', 'precioProducto', 'numRecojo']);
        }

        // Si el usuario quita una OC, cancelar cualquier conflicto pendiente
        if (ocPendiente) {
            setOcPendiente(null);
            setModalConflictosVisible(false);
        }

    }, [ocSeleccionada1, ocSeleccionada2, ocPendiente, form]);


    const handleProrrateoCalculado = useCallback(
        (precioCalculado, recojo1, recojo2, peso1, peso2) => {
            form.setFieldsValue({
                precioProducto: precioCalculado,
                numRecojo: `${recojo1},${recojo2}`,
            });
            setPesosAsignados({ peso1, peso2 }); // Guardar los pesos
            setModalProrrateoVisible(false);
        },
        [form],
    );

    const handleModalCancel = useCallback(() => {
        setModalProrrateoVisible(false);
        setOcSeleccionada2(null);
        setPesosAsignados({ peso1: null, peso2: null }); // Limpiar pesos
        messageApi.info('Se canceló el prorrateo. Se eliminó la segunda OC.');
    }, [messageApi]);

    // --- NUEVOS HANDLERS PARA MODAL DE CONFLICTOS ---
    const handleConflictoContinuar = useCallback(() => {
        setModalConflictosVisible(false);
        setOcSeleccionada2(ocPendiente); // Confirmar la OC 2

        // Autocompletar (usando datos de OC1)
        form.setFieldsValue({
            proveedor: ocSeleccionada1.proveedor,
            producto: ocSeleccionada1.producto,
        });

        setModalProrrateoVisible(true); // Abrir el modal de prorrateo
        setOcPendiente(null); // Limpiar OC pendiente
    }, [ocPendiente, ocSeleccionada1, form]);

    const handleConflictoCancelar = useCallback(() => {
        setModalConflictosVisible(false);
        setOcPendiente(null); // Descartar la OC 2
        messageApi.info('Se canceló la selección de la segunda OC.');
    }, [messageApi]);

    // --- Submit del Formulario (sin cambios) ---
    const onFinish = useCallback((values) => {
        let { numRecojo } = values;
        if (typeof numRecojo !== 'string') numRecojo = String(numRecojo || '');

        if (!/^\d+(,\d+)*$/.test(numRecojo.trim()) || numRecojo.trim() === '') {
            messageApi.error("El campo 'Número de Recojo' debe ser un número o números separados por comas (ej: 1 o 1,2).");
            return;
        }
        const numerosArray = numRecojo.split(',').map((num) => parseInt(num.trim(), 10)).filter((num) => !isNaN(num));
        const numOCSeleccionadas = [ocSeleccionada1, ocSeleccionada2].filter(Boolean).length;

        if (numOCSeleccionadas === 0) {
            messageApi.error("Debe seleccionar al menos una Orden de Compra.");
            return;
        }
        if (numerosArray.length !== numOCSeleccionadas) {
            messageApi.error(`La cantidad de números de recojo (${numerosArray.length}) no coincide con la cantidad de OC seleccionadas (${numOCSeleccionadas}).`);
            return;
        }

        // --- Lógica de asignación de peso ---
        const asignaciones = [];
        if (ocSeleccionada1 && !ocSeleccionada2) {
            // Caso 1: Solo una OC
            // Asumimos que el peso de la única OC es el "pesoNetoCrt" del formulario
            asignaciones.push({
                oc: ocSeleccionada1,
                numeroRecojo: numerosArray[0],
                peso: values.pesoNetoCrt,
            });
        } else if (ocSeleccionada1 && ocSeleccionada2) {
            // Caso 2: Dos OCs (prorrateo)
            asignaciones.push({
                oc: ocSeleccionada1,
                numeroRecojo: numerosArray[0],
                peso_asignado: pesosAsignados.peso1, // Usar el peso 1 del modal
            });
            asignaciones.push({
                oc: ocSeleccionada2,
                numeroRecojo: numerosArray[1],
                peso_asignado: pesosAsignados.peso2, // Usar el peso 2 del modal
            });
        }
        // --- Fin de la lógica de asignación ---

        values.ordenRecojo = asignaciones;
        onDataValidate(values);
    }, [messageApi, ocSeleccionada1, ocSeleccionada2, onDataValidate, pesosAsignados]);

    const opcionesOC = resultadosOC.map((reg) => ({
        value: reg.numero_oc,
        label: `${reg.numero_oc} - ${reg.producto}`,
    }));

    return (
        <div className="w-full">
            {contextHolder}
            <Form
                requiredMark={false}
                form={form}
                onFinish={onFinish}
                layout="vertical"
                initialValues={initialFormValues}
            >
                {/* --- Grid de Formulario (sin cambios en el layout) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                    {/* ... (Empresa) ... */}
                    <Form.Item label="Empresa" name="empresa" rules={[{ required: true, message: 'Selecciona una empresa' }]}>
                        <Select onChange={handleBaseDatosChange} placeholder="Selecciona una empresa" className="w-full">
                            <Option value="bd_semilla_starsoft">LA SEMILLA DE ORO SAC</Option>
                            <Option value="bd_maxi_starsoft">MAXIMILIAN INVERSIONES SA</Option>
                            <Option value="bd_trading_starsoft">TRADING SEMILLA SAC</Option>
                        </Select>
                    </Form.Item>

                    {/* --- Selección de OC (UI sin cambios) --- */}
                    <div className="lg:col-span-2">
                        <Form.Item
                            label="Orden de compra"
                            rules={[() => ({
                                validator() {
                                    if (ocSeleccionada1) return Promise.resolve();
                                    return Promise.reject(new Error('Selecciona al menos una OC'));
                                },
                            })]}
                        >
                            <AutoComplete
                                options={opcionesOC}
                                value={searchTermOC}
                                onSelect={handleSelectOC}
                                onSearch={handleSearchOC}
                                onChange={setSearchTermOC}
                                placeholder="Escribe al menos 3 caracteres para buscar OC"
                                className="w-full"
                                disabled={!baseDatos}
                            />
                        </Form.Item>
                        <Space size={[0, 8]} wrap>
                            {ocSeleccionada1 && (
                                <Tag closable color="blue" onClose={() => handleRemoveOC(ocSeleccionada1.numero_oc)}>
                                    {ocSeleccionada1.numero_oc}
                                </Tag>
                            )}
                            {ocSeleccionada2 && (
                                <Tag closable color="blue" onClose={() => handleRemoveOC(ocSeleccionada2.numero_oc)}>
                                    {ocSeleccionada2.numero_oc}
                                </Tag>
                            )}
                        </Space>
                    </div>

                    {/* ... (Producto) ... */}
                    <Form.Item label="Producto" name="producto" rules={[{ required: true, message: 'Ingresa el producto' }]}>
                        <Input disabled />
                    </Form.Item>

                    {/* ... (Proveedor) ... */}
                    <Form.Item label="Proveedor" name="proveedor" rules={[{ required: true, message: 'Ingresa el proveedor' }]}>
                        <Input disabled />
                    </Form.Item>

                    {/* ... (Campos Ocultos) ... */}
                    <Form.Item name="precioProducto" hidden><Input /></Form.Item>
                    <Form.Item name="ordenRecojo" hidden><Input /></Form.Item>

                    {/* ... (Resto de campos: DUA, Num Recojo, Fecha, Carta Porte, Factura, Transportista, Flete, Peso, Botón) ... */}
                    <Form.Item label="DUA" name="dua" rules={[{ required: true, message: 'Ingresa el DUA' }]}><Input /></Form.Item>
                    <Form.Item label="Número de Recojo" name="numRecojo" rules={[{ required: true, message: 'Ingresa el N° de recojo' }]} tooltip="Si hay 2 OCs, ingrese ambos N° separados por coma (ej: 1,2)">
                        <Input placeholder="Ej: 1 (o 1,2 si hay prorrateo)" />
                    </Form.Item>
                    <Form.Item label="Fecha de Numeración" name="fechaNumeracion" rules={[{ required: true, message: 'Ingresa la fecha' }]}>
                        <DatePicker format={'DD/MM/YYYY'} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Carte porte" name="cartaPorte" rules={[{ required: true, message: 'Ingresa carta porte' }]}><Input /></Form.Item>
                    <Form.Item label="N° Factura" name="numFactura" rules={[{ required: true, message: 'Ingresa el N° de factura' }]}><Input /></Form.Item>
                    <Form.Item label="Empresa de Transporte" name="transportista" rules={[{ required: true, message: 'Ingresa Emp. de transporte' }]}>
                        <AutoComplete
                            options={resultadosTransportista.map((prov) => ({ value: prov.nombre }))}
                            onSelect={handleSelectTransportista}
                            onSearch={handleSearchTransportista}
                            placeholder="Buscar proveedor"
                            disabled={!baseDatos}
                        />
                    </Form.Item>
                    <Form.Item label="Flete Pactado" name="fletePactado" rules={[{ required: true, message: 'Ingresa el flete' }, { type: 'number', transform: (v) => (v ? parseFloat(v) : 0), message: 'Debe ser un número' }]}>
                        <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="$" />
                    </Form.Item>
                    <Form.Item label="Peso neto CRT (kg)" name="pesoNetoCrt" rules={[{ required: true, message: 'Ingresa el peso' }, { type: 'number', transform: (v) => (v ? parseFloat(v) : 0), message: 'Debe ser un número' }]}>
                        <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                    </Form.Item>
                    <div className="md:mt-7 lg:mt-7">
                        <Button type="primary" htmlType="submit" className="w-full">Enviar</Button>
                    </div>

                </div>
            </Form>

            {/* --- Modales --- */}
            <ModalProrrateo
                open={modalProrrateoVisible}
                oc1={ocSeleccionada1}
                oc2={ocSeleccionada2}
                onCancel={handleModalCancel}
                onCalcular={handleProrrateoCalculado}
            />

            
            <ModalConfirmacionConflictos
                open={modalConflictosVisible}
                oc1={ocSeleccionada1}
                oc2={ocPendiente} // Usar la OC pendiente
                onContinuar={handleConflictoContinuar}
                onCancelar={handleConflictoCancelar}
            />
        </div>
    );
}

FormularioCalculo.propTypes = {
    onDataValidate: PropTypes.func.isRequired,
    initialData: PropTypes.object,
};

export default FormularioCalculo;
