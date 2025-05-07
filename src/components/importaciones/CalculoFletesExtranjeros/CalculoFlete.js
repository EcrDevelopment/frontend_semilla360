import React, { useState, useEffect } from 'react';
import { Collapse, notification, Button, Dropdown, message,Modal } from 'antd';
import axiosInstance from '../../../axiosConfig';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, DownOutlined } from '@ant-design/icons';
import { MdOutlineCleaningServices } from "react-icons/md";
import { FiEye } from "react-icons/fi";
import { MdPreview } from "react-icons/md";
import { FaRegSave } from "react-icons/fa";
import TablaCalculo from './TablaCalculo';
import FormularioCalculo from './FormularioCalculo';
import FormularioExtra from './FormularioExtra';


function CalculoFlete({ resetContent }) {

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reportStatus, setReportStatus] = useState(false);
    const [dataForm, setDataForm] = useState({});
    const [dataTable, setDataTable] = useState([]);
    const [dataExtraForm, setDataExtraForm] = useState({});
    const [statuses, setStatuses] = useState({
        data1: false,
        data2: false,
        data3: false,
    });

    const [messageApi, contextHolder] = message.useMessage();

    const [activeKeys, setActiveKeys] = useState(['1']);

    const items = [
        {
            label: 'Vista prev. reporte basico.',
            key: '1',
            icon: <MdPreview />,
        },
        {
            label: 'Vista prev. reporte detallado.',
            key: '2',
            icon: <MdPreview />,
        },
    ];

    const handleReset = () => {
        messageApi.success("enviando Reset.");
        resetContent(); // Llama a resetContent para reiniciar el componente
    };

    // Cargar datos desde localStorage al inicializar el componente
    useEffect(() => {
        const savedDataForm = localStorage.getItem('importaciones_Data_Form');
        const savedDataTable = localStorage.getItem('importaciones_Data_Table');
        const savedDataExtra = localStorage.getItem('importaciones_Data_Extra');

        // Si hay datos, actualiza los estados correspondientes
        if (savedDataForm || savedDataTable || savedDataExtra) {
            setIsModalVisible(true); // Muestra el modal solo si hay datos en localStorage
        }

        // Configurar las claves activas del Collapse
        const keys = [];
        if (savedDataForm) keys.push('1');
        if (savedDataTable) keys.push('2');
        if (savedDataExtra) keys.push('3');
        setActiveKeys(keys.length > 0 ? keys : ['1']);
    }, []);

    const handleOk = () => {
        const savedDataForm = localStorage.getItem('importaciones_Data_Form');
        const savedDataTable = localStorage.getItem('importaciones_Data_Table');
        const savedDataExtra = localStorage.getItem('importaciones_Data_Extra');

        // Si hay datos, actualiza los estados correspondientes
        if (savedDataForm) {
            setDataForm(JSON.parse(savedDataForm));
            setStatuses((prev) => ({ ...prev, data1: true }));
        }
        if (savedDataTable) {
            setDataTable(JSON.parse(savedDataTable));
            setStatuses((prev) => ({ ...prev, data2: true }));
        }
        if (savedDataExtra) {
            setDataExtraForm(JSON.parse(savedDataExtra));
            setStatuses((prev) => ({ ...prev, data3: true }));
        }

        // Cierra el modal
        setIsModalVisible(false);
    };

    const handleCancelModal = () => {
        // Elimina los datos de localStorage
        localStorage.removeItem('importaciones_Data_Form');
        localStorage.removeItem('importaciones_Data_Table');
        localStorage.removeItem('importaciones_Data_Extra');
        limpiarData();
        // Cierra el modal
        setIsModalVisible(false);
    };

    // Guardar datos en localStorage y actualizar estados
    const saveAndSharedData = (data, key) => {
        switch (key) {
            case 'data1':
                localStorage.setItem('importaciones_Data_Form', JSON.stringify(data));
                setDataForm(data);
                break;
            case 'data2':
                localStorage.setItem('importaciones_Data_Table', JSON.stringify(data));
                setDataTable(data);
                break;
            case 'data3':
                localStorage.setItem('importaciones_Data_Extra', JSON.stringify(data));
                setDataExtraForm(data);
                break;
            default:
                break;
        }
    };

    const handleCancel = () => {
        localStorage.removeItem('importaciones_Data_Form');
        localStorage.removeItem('importaciones_Data_Table');
        localStorage.removeItem('importaciones_Data_Extra');
        handleReset();
    }

    function limpiarData() {
        localStorage.removeItem('importaciones_Data_Form');
        localStorage.removeItem('importaciones_Data_Table');
        localStorage.removeItem('importaciones_Data_Extra');
        handleReset();
    }

    const handleMenuClick = (e) => {
        switch (e.key) {
            case '1':
                handleDataFinal();
                break;
            case '2':
                handleDataFinalDetallada();
                break;
            default:
                console.log('Opción no reconocida');
        }
    }

    // Manejar la validación de datos
    const handleValidation = (key, data) => {
        setStatuses((prev) => ({ ...prev, [key]: true }));
        setActiveKeys([String(parseInt(key[4], 10) + 1)]);
        notification.success({
            message: `Parte ${key[4]} completada`,
            description: 'Los datos se han enviado correctamente.',
        });
        saveAndSharedData(data, key);
    };

    // Manejar el envío final
    const handleDataFinal = () => {
        setReportStatus(true);
        if (statuses.data1 && statuses.data2 && statuses.data3) {
            const data = { dataForm, dataTable, dataExtraForm };
            //console.log('data enviada',data);
            axiosInstance
                .post('/importaciones/generar_reporte/', data)
                .then((response) => {
                    const file = new Blob([response.data], { type: 'application/pdf' });
                    const fileURL = URL.createObjectURL(file);
                    setReportStatus(false);
                    window.open(fileURL, '_blank');
                    notification.success({
                        message: 'Buen trabajo',
                        description: 'Reporte generado correctamente.',
                    });
                })
                .catch((error) => {
                    setReportStatus(false);
                    notification.error({
                        message: 'OCURRIO UN ERROR',
                        description: 'error:' + error.response,
                    });
                    console.error('Error al generar el reporte:', error.response);
                });
        } else {
            setReportStatus(false);
            notification.warning({
                message: 'ADVERTENCIA',
                description: 'Los datos a enviar no son válidos, complete correctamente el formulario.',
            });
        }
    };

    const handleDataFinalDetallada = () => {
        setReportStatus(true);
        if (statuses.data1 && statuses.data2 && statuses.data3) {
            const data = { dataForm, dataTable, dataExtraForm };
            axiosInstance
                .post('/importaciones/generar_reporte_detallado/', data)
                .then((response) => {
                    const file = new Blob([response.data], { type: 'application/pdf' });
                    const fileURL = URL.createObjectURL(file);
                    setReportStatus(false);
                    window.open(fileURL, '_blank');
                    notification.success({
                        message: 'Buen trabajo',
                        description: 'Reporte generado correctamente.',
                    });
                })
                .catch((error) => {
                    setReportStatus(false);
                    notification.error({
                        message: 'ocurrio un error',
                        description: 'No fue posible generar el reporte.',
                    });
                    console.error('Error al generar el reporte:', error.response);
                });
        }
    }

    const handleDropdownClick = (e) => {
        console.log(e.key);
    }

    const handleGuardarData = async () => {

        // Verificar que todos los datos y estados estén presentes
        if (!statuses.data1 || !statuses.data2 || !statuses.data3) {
            notification.warning({
                message: 'Faltan datos',
                description: 'Por favor, complete todos los datos necesarios antes de continuar.',
            });
            return;
        }

        // Verificar estructura de datos antes de enviar
        if (!dataForm || !dataTable || !dataExtraForm) {
            notification.error({
                message: 'Error en los datos',
                description: 'Los datos no están completos o son inválidos. Verifique nuevamente.',
            });
            return;
        }

        // Datos a enviar
        const data = { dataForm, dataTable, dataExtraForm };
        //console.log('data enviada',data);
        try {
            setIsLoading(true);
            // Enviar solicitud al backend
            const response = await axiosInstance.post('/importaciones/registrar-despacho/', data);
            // Manejar respuesta exitosa
            notification.success({
                message: 'Buen trabajo',
                description: response.data.message,
            });
            limpiarData();
            //window.location.reload();
        } catch (error) {
            // Manejar errores específicos
            const statusCode = error.response?.status || 500;

            if (statusCode >= 400 && statusCode < 500) {
                //console.log(error.response.data);
                const errorMessage = error.response.data.message || 'Ocurrió un error al enviar los datos.';

                // Manejar error específico del número de recojo duplicado
                if (errorMessage.includes('número de recojo ya existe')) {
                    notification.error({
                        message: 'Número de recojo duplicado',
                        description: 'El número de recojo ingresado ya existe. Por favor, utilice un número diferente.',
                    });
                } else {
                    notification.error({
                        message: `Error ${statusCode}`,
                        description: errorMessage,
                    });
                }
            } else {
                notification.error({
                    message: 'Error desconocido',
                    description: 'Ocurrió un error inesperado. Revise la consola para más detalles.',
                });
            }
            //console.error('Error:', error.response || error);
        } finally {
            setIsLoading(false);
        }


    };

    // Manejar el cambio en Collapse
    const handleCollapseChange = (keys) => {
        setActiveKeys(keys);
    };

    // Configuración de las secciones del Collapse
    const collapseItems = [
        {
            key: '1',
            label: 'Primera parte - Datos de empresa de transporte y producto',
            content: <FormularioCalculo onDataValidate={(data) => handleValidation('data1', data)} initialData={dataForm} />,
            status: statuses.data1,
        },
        {
            key: '2',
            label: 'Segunda parte - Detalles de transporte',
            content: <TablaCalculo onDataValidate={(data) => handleValidation('data2', data)} initialData={dataTable} />,
            status: statuses.data2,
        },
        {
            key: '3',
            label: 'Otros datos',
            content: (
                <FormularioExtra
                    onDataValidate={(data) => handleValidation('data3', data)}
                    initialData={dataExtraForm}
                    precio={dataForm.precioProducto || 0}
                    cantidad={dataTable.length || 0}
                />
            ),
            status: statuses.data3,
        },
    ];

    const collapsePanels = collapseItems.map(({ key, label, content, status }) => ({
        key,
        label,
        extra: status ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined />,
        style: { backgroundColor: status ? 'rgba(16, 185, 129, 0.3)' : 'transparent' },
        children: content,
    }));

    return (
        <>
            <Modal
                title="Datos encontrados"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancelModal}
                okText="Si, Continuar"
                cancelText="No"
            >
                <p>Parece que estuviste trabajando aquí ¿quieres continuar con ese trabajo?</p>
            </Modal>
            <div className="p-2 lg:px-8 lg:py-8 m-auto w-full rounded-md shadow-md space-y-4 space-x-2">
                <h1 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">Cálculo de Fletes Exterior</h1>
                <Collapse activeKey={activeKeys} onChange={handleCollapseChange} items={collapsePanels} />
                {contextHolder}
                {statuses.data1 && statuses.data2 && statuses.data3 && (
                    <>
                        <div className=' bg-gray-200 shadow-md rounded-md m-2 p-2 block space-y-2  md:space-y-0 md:flex  md:flex-row justify-center space-x-2'>
                            <Dropdown.Button
                                type="primary"
                                icon={<DownOutlined />}
                                loading={reportStatus}
                                menu={{
                                    items,
                                    onClick: handleMenuClick,
                                }}
                                onClick={handleDropdownClick}
                            >
                                <FiEye /> Previsualización
                            </Dropdown.Button>
                            <Button color="gold" variant="solid" icon={<MdOutlineCleaningServices />} onClick={limpiarData}>
                                Limpiar
                            </Button>
                            <Button
                                color="green"
                                variant="solid"
                                loading={isLoading}
                                icon={isLoading ? <SyncOutlined spin /> : <FaRegSave />}
                                onClick={handleGuardarData}>
                                {isLoading ? 'Guardando...' : 'Finalizar'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default CalculoFlete;
