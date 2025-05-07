import React, { useState } from 'react';
import { Select } from 'antd';
import axiosInstance from '../../../axiosConfig';

const { Option } = Select;

function BusquedaImportacion({ onSeleccionRegistro }) {
    const [baseDatos, setBaseDatos] = useState('');
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState([]);

    // Función para manejar el cambio en el select de base de datos
    const handleBaseDatosChange = (value) => {
        setBaseDatos(value);
        setResultados([]); // Reiniciar sugerencias cuando cambia la base de datos
        setQuery(''); // Limpiar el campo de búsqueda
    };

    // Función para realizar la búsqueda en la API
    const buscarImportaciones = async (termino) => {
        try {
            const response = await axiosInstance.get('/importaciones/buscar_oi/', {
                params: {
                    base_datos: baseDatos,
                    query: termino,
                },
            });
            setResultados(response.data);
        } catch (error) {
            console.error('Error al buscar importaciones:', error);
        }
    };

    // Función para manejar la entrada del usuario
    const handleSearch = (value) => {
        setQuery(value);

        if (value.length > 2 && baseDatos) {
            buscarImportaciones(value);
        } else {
            setResultados([]);
        }
    };

    // Función para manejar la selección de un registro
    const handleSelect = (value) => {
        const registroSeleccionado = resultados.find(registro => registro.CNUMERO === value);
        onSeleccionRegistro(registroSeleccionado); // Llamar a la función del componente padre
        setQuery(value); // Mostrar el número seleccionado en el campo
    };

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div className="mb-1">
                <label htmlFor="empresa" className="block text-gray-700 font-medium mb-2">Empresa:</label>
                <Select
                    id="empresa"
                    value={baseDatos}
                    onChange={handleBaseDatosChange}
                    placeholder="Selecciona una empresa"
                    className="w-full"
                >
                    <Option value="bd_semilla_starsoft">LA SEMILLA DE ORO SAC</Option>
                    <Option value="bd_maxi_starsoft">MAXIMILIAN INVERSIONES SA</Option>
                    <Option value="bd_trading_starsoft">TRADING SEMILLA SAC</Option>
                </Select>
            </div>

            <div className="mb-4">
                <label htmlFor="busqueda" className="block text-gray-700 font-medium mb-2">OC:</label>
                <Select
                    id="busqueda"
                    value={query}
                    showSearch
                    onSearch={handleSearch}
                    onSelect={handleSelect}
                    placeholder="Escribe al menos 3 caracteres"
                    className="w-full"
                    filterOption={false} // Evita que el filtro interno de Select interfiera
                    notFoundContent={null} // Evita el mensaje cuando no se encuentra contenido
                >
                    {resultados.map((registro) => (
                        <Option key={registro.CNUMERO} value={registro.CNUMERO}>
                            {registro.CNUMERO}
                        </Option>
                    ))}
                </Select>
            </div>
        </div>
    );
}

export default BusquedaImportacion;
