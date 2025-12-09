import { useState, useEffect } from 'react';
import {
    Table, Spin, message, Button, Tag, Descriptions// <-- Asegúrate de tener Button si no estaba
} from 'antd';
import {
    LoadingOutlined, ReloadOutlined
} from '@ant-design/icons';
//import dayjs from 'dayjs';

import { consultarGuia } from '../../../api/Almacen';

// --- 1. COMPONENTE INTERNO (ACTUALIZADO CON REGEX) ---
const DetalleGuiaExpandida = ({ record }) => {
    const [loading, setLoading] = useState(true);
    const [cabecera, setCabecera] = useState(null);
    const [detalles, setDetalles] = useState([]);
    const [error, setError] = useState(null);

    const columnsGuia = [
        { title: "Código", dataIndex: "itemcodigo", key: "itemcodigo" },
        { title: "Descripción", dataIndex: "itemdescripcion", key: "itemdescripcion", ellipsis: true, width: 200 }, // Añadido ellipsis
        { title: "Cantidad", dataIndex: "itemcantidad", key: "itemcantidad" },
        { title: "U. Medida", dataIndex: "itemumedida", key: "itemumedida" },
    ];

    const fetchDetalleGuia = async () => {
    setLoading(true);
    setError(null);
    setCabecera(null);
    setDetalles([]);

    // 1. Preparamos variables
    const regexGuia = /^([A-Z0-9]{4})([0-9]{1,8})$/;
    const cod_mov = record.codigo_movimiento;

    // AQUI APLICAMOS LA LÓGICA DE SPLIT CON SEGURIDAD
    // Usamos '?.String' o '||' por si id_erp_cab viene nulo no rompa la app
    const guiaDoc = (record.id_erp_cab || '').split('-').pop(); 
    const guiaReferencia = record.referencia_documento || '';

    // 2. Determinamos qué valor vamos a validar según el tipo de movimiento
    // Creamos una variable 'valorAValidar' para unificar
    const valorAValidar = (cod_mov === 'GV') ? guiaDoc : guiaReferencia;

    const match = valorAValidar.match(regexGuia);

    // 3. Validamos si hubo un match
    if (!match) {
        // CORRECCIÓN: Ahora usamos 'valorAValidar' en lugar de la variable inexistente 'referencia'
        setError(`Referencia de guía inválida (formato esperado: "T0010001234"). Valor recibido: "${valorAValidar}"`);
        setLoading(false);
        return;
    }

    // 4. Extraemos los grupos
    const params = {
        empresa: record.empresa.nombre_empresa, 
        grenumser: match[1],     // Grupo 1: La serie
        grenumdoc: match[2],     // Grupo 2: El número
    };

    // 5. Consultamos la API
    try {
        const response = await consultarGuia(params);
        setCabecera(response.data.cabecera);
        setDetalles(response.data.detalles);
    } catch (err) {
        setError("No se encontraron resultados para esta guía o hubo un error en la consulta.");
        message.error("Error al consultar la guía: " + (err.response?.data?.detail || err.message));
    } finally {
        setLoading(false);
    }
};

    // useEffect se llama solo una vez cuando se expande la fila
    useEffect(() => {
        fetchDetalleGuia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let descriptionItems = [];
    let title = "Detalles Adicionales (Guía)"; // Título por defecto

    if (loading) {
        title = "Cargando Detalles de la Guía...";
        descriptionItems = [
            {
                key: 'loading',
                label: 'Estado',
                span: 2,
                children: (
                    <div className="text-center p-4">
                        <Spin indicator={<LoadingOutlined spin />} />
                        <p className="mt-2">Consultando...</p>
                    </div>
                )
            }
        ];
    } else if (error) {
        title = "Error al Cargar la Guía";
        descriptionItems = [
            {
                key: 'error',
                label: 'Error',
                span: 2,
                children: (
                    <div className="text-center p-4 text-red-600">
                        <p>{error}</p>
                        <Button icon={<ReloadOutlined />} onClick={fetchDetalleGuia} className="mt-2" size="small">
                            Reintentar
                        </Button>
                    </div>
                )
            }
        ];
    } else if (cabecera) {
        // Éxito: Construimos los items desde la 'cabecera'
        title = "Detalles Adicionales (Guía)";
        descriptionItems = [
            { key: 'mot', label: 'Motivo traslado', children: <Tag color="blue">{cabecera.motivo_traslado}</Tag>, span: 2 },
            { key: 'emi', label: 'Emisor', children: cabecera.emisorrazsocial },
            { key: 'dirpa', label: 'Dirección Partida', children: cabecera.partida_direccion },
            { key: 'tra', label: 'Transporte', children: cabecera.transportistarazsocial, span: 2 },
            { key: 'rec', label: 'Receptor', children: cabecera.receptorrazsocial},
            { key: 'lle', label: 'Dirección llegada', children: cabecera.llegada_direccion },
            { key: 'ubi', label: 'Ubigeo', children: cabecera.llegada_ubigeo },
            { key: 'pes', label: 'Peso', children: cabecera.pesobrutototal , span: 2 },
        ];
    }

    // --- Renderizado Unificado ---
    return (
        <div>
            {/* 1. El componente <Descriptions> que imita el estilo del "otro" expandible */}
            <Descriptions
                title={title}
                bordered
                size="small"
                column={2}
                className="bg-gray-50 p-2" // <-- Clases clave para la consistencia
            >
                {descriptionItems.map(item => (
                    <Descriptions.Item key={item.key} label={item.label} span={item.span}>
                        {item.children}
                    </Descriptions.Item>
                ))}
            </Descriptions>

            {/* 2. La tabla de detalles (si existe) se renderiza *fuera* de Descriptions */}
            {detalles.length > 0 && (
                <div className="mt-4 p-2 bg-gray-50 rounded"> {/* Contenedor opcional */}
                    <h4 className="font-semibold mb-2 text-sm ml-1">Items de la Guía</h4>
                    <Table
                        dataSource={detalles}
                        columns={columnsGuia}
                        rowKey={(r, i) => i}
                        pagination={false}
                        size="small"
                    />
                </div>
            )}
        </div>
    );
};

export default DetalleGuiaExpandida;