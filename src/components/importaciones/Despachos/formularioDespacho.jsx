// src/components/Despacho/FormularioDespacho.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, message, Select, Tabs } from 'antd';
import moment from 'moment';
import SeccionGeneral from './SeccionGeneral';
import SeccionOrdenes from './SeccionOrdenes';
import TablaDetalleDespacho from './TablaDetalleDespacho';
import TablaConfiguracion from './TablaConfiguracion';
import TablaGastosExtra from './TablaGastosExtra';
import { obtenerDataDespacho } from '../../../api/Despachos';

const { Option } = Select;

export default function FormularioDespacho({ resetContent }) {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [baseDatos, setBaseDatos] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            obtenerDataDespacho(id)
                .then((response) => {
                    const general = {
                        ...response.general,
                        fecha_numeracion: response.general.fecha_numeracion
                            ? moment(response.general.fecha_numeracion, "DD/MM/YYYY")
                            : null,
                        fecha_llegada: response.general.fecha_llegada
                            ? moment(response.general.fecha_llegada, "DD/MM/YYYY")
                            : null,
                    };

                    setData(response);
                })
                .catch((error) => {
                    console.error("Error al obtener datos:", error);
                    message.error(error.message || 'Error al obtener datos del despacho');
                })
                .finally(() => {
                    setLoading(false);
                });
        } catch (error) {
            console.error("Error en try/catch:", error);
            setLoading(false);
        }
    }, [id]);

    const handleBaseDatosChange = (value) => {
        setBaseDatos(value);
    };

    if (loading || !data) return <Spin size="large" />;

    return (
        <div className='m-2 bg-white p-4 rounded shadow'>
            <h2 className='text-2xl font-semibold mb-4'>Editar Flete #{id}</h2>
            {/*
            <div className="mb-4 flex items-center space-x-4 flex-row">
                <label className="block mb-1 font-semibold">Empresa</label>
                <Select
                    value={baseDatos}
                    onChange={handleBaseDatosChange}
                    placeholder="Selecciona una empresa"
                    className="w-60"
                >
                    <Option value="bd_semilla_starsoft">LA SEMILLA DE ORO SAC</Option>
                    <Option value="bd_maxi_starsoft">MAXIMILIAN INVERSIONES SA</Option>
                    <Option value="bd_trading_starsoft">TRADING SEMILLA SAC</Option>
                </Select>
            </div>
            */}
            <Tabs
                defaultActiveKey="1"                
                className="mt-4"
                items={[
                    {
                        key: '1',
                        label: 'General',
                        children: <SeccionGeneral id={id} />,
                    },
                    {
                        key: '2',
                        label: 'Órdenes de compra',
                        children: 
                        <SeccionOrdenes
                            despachoId={id} />
                        
                        ,
                    },
                    {
                        key: '3',
                        label: 'Detalle despacho',
                        children: <TablaDetalleDespacho despachoId={id} />,
                    },
                    {
                        key: '4',
                        label: 'Configuración de despacho',
                        children: <TablaConfiguracion despachoId={id} />,
                    },
                    {
                        key: '5',
                        label: 'Gastos extra',
                        children: <TablaGastosExtra despachoId={id} />,
                    },
                ]}
            />

        </div>
    );
}
