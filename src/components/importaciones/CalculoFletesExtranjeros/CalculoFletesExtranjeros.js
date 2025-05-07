import React, { useState, useMemo } from 'react';
import BusquedaImportacion from './BusquedaImportacion';
import TablaCalculo from './TablaCalculo';

function CalculoFletesExtranjeros() {
    const [registroSeleccionado, setRegistroSeleccionado] = useState({
        ordenCompra: '',
        producto: '',
        proveedor: '',
        dua: '',
        numRecojo: '',
        cartaPorte: '',
        numFactura: '',
        fechaNumeracion: '',
        transportista: '',
        fletePactado: '',
    });

    const [errores, setErrores] = useState({});

    // Función para manejar el registro seleccionado desde BusquedaImportacion
    const handleSeleccionRegistro = (registro) => {
        setRegistroSeleccionado({
            ordenCompra: registro.CNUMERO,
            producto: registro.CDESARTIC,
            proveedor: registro.proveedor,
        });
    };

    // Función para actualizar los campos editables
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Actualizar el estado del campo
        setRegistroSeleccionado((prevState) => ({
            ...prevState,
            [name]: value,
        }));

        // Validar el campo al momento de escribir
        setErrores((prevErrores) => {
            const nuevosErrores = { ...prevErrores };

            // Validación para el campo que se ha modificado
            if (name === 'producto' && !value) {
                nuevosErrores.producto = 'El producto es obligatorio.';
            } else if (name === 'proveedor' && !value) {
                nuevosErrores.proveedor = 'El proveedor es obligatorio.';
            } else if (name === 'dua' && !value) {
                nuevosErrores.dua = 'El N° DUA es obligatorio.';
            } else if (name === 'numRecojo' && !value) {
                nuevosErrores.numRecojo = 'El N° de recojo es obligatorio.';
            } else if (name === 'cartaPorte' && !value) {
                nuevosErrores.cartaPorte = 'El N° de carta porte es obligatorio.';
            } else if (name === 'numFactura' && !value) {
                nuevosErrores.numFactura = 'El N° de factura es obligatorio.';
            } else if (name === 'fechaNumeracion' && !value) {
                nuevosErrores.fechaNumeracion = 'La fecha de numeración es obligatoria.';
            } else if (name === 'transportista' && !value) {
                nuevosErrores.transportista = 'El nombre del transportista es obligatorio.';
            } else if (name === 'fletePactado' && (!value || value <= 0)) {
                nuevosErrores.fletePactado = 'El precio del flete es obligatorio y debe ser mayor a 0.';
            } else {
                // Si el campo está corregido, eliminamos el mensaje de error
                delete nuevosErrores[name];
            }

            return nuevosErrores;
        });
    };

    // Validación de formulario
    const validarFormulario = () => {
        let errores = {};
        if (!registroSeleccionado.producto) {
            errores.producto = 'El producto es obligatorio.';
        }
        if (!registroSeleccionado.proveedor) {
            errores.proveedor = 'El proveedor es obligatorio.';
        }
        if (!registroSeleccionado.dua) {
            errores.dua = 'El N° DUA es obligatorio.';
        }
        if (!registroSeleccionado.cartaPorte) {
            errores.cartaProte = 'El N° de carta porte es obligatorio.';
        }
        if (!registroSeleccionado.numRecojo) {
            errores.numRecojo = 'El N° de recojo es obligatorio.';
        }
        if (!registroSeleccionado.numFactura) {
            errores.numFactura = 'El N° de factura es obligatorio.';
        }
        if (!registroSeleccionado.fechaNumeracion) {
            errores.fechaNumeracion = 'La fecha de numeración es obligatoria.';
        }
        if (!registroSeleccionado.transportista) {
            errores.transportista = 'El nombre del transportista es obligatorio.';
        }
        if (!registroSeleccionado.fletePactado || registroSeleccionado.fletePactado <= 0) {
            errores.fletePactado = 'El precio del flete es obligatorio y debe ser mayor a 0.';
        }

        setErrores(errores);
        return Object.keys(errores).length === 0; // Retorna true si no hay errores
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validarFormulario()) {
            // Proceder con el envío de los datos o cualquier otra acción
            console.log('Formulario enviado');
        } else {
            console.log('Formulario con errores');
        }
    };

    // Memorizar registroSeleccionado para evitar re-renderizaciones innecesarias
    const memoizedRegistroSeleccionado = useMemo(() => registroSeleccionado, [registroSeleccionado]);

    return (
        <div className="max-w-full mx-auto rounded bg-gray-100 shadow-md p-6">
            <h1 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">Cálculo de Fletes Extranjeros</h1>

            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md space-y-1 shadow-md">
                {/* Componente de búsqueda */}
                <BusquedaImportacion onSeleccionRegistro={handleSeleccionRegistro} />

                {/* Contenedor responsive de inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Input Descripción de artículo */}
                    <div>
                        <label htmlFor="producto" className="block text-gray-700 font-medium mb-2">Producto o artículo:</label>
                        <input
                            type="text"
                            id="producto"
                            name="producto"
                            value={memoizedRegistroSeleccionado.producto || ''}
                            placeholder="Código de artículo"
                            autoComplete="off"
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errores.producto && <p className="text-red-500 text-sm">{errores.producto}</p>}
                    </div>

                    {/* Input Proveedor */}
                    <div>
                        <label htmlFor="proveedor" className="block text-gray-700 font-medium mb-2">Proveedor:</label>
                        <input
                            type="text"
                            id="proveedor"
                            name="proveedor"
                            value={memoizedRegistroSeleccionado.proveedor || ''}
                            placeholder="Proveedor"
                            autoComplete="off"
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errores.proveedor && <p className="text-red-500 text-sm">{errores.proveedor}</p>}
                    </div>

                    <div className="space-x-2 flex flex-row w-full">
                        <div className="w-1/2">
                            <label htmlFor="dua" className="block text-gray-700 font-medium mb-2">N° DUA:</label>
                            <input
                                type="text"
                                id="dua"
                                name="dua"
                                value={memoizedRegistroSeleccionado.dua || ''}
                                placeholder="Número de dua"
                                autoComplete="off"
                                onChange={handleInputChange}
                                className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {errores.dua && <p className="text-red-500 text-sm">{errores.dua}</p>}
                        </div>

                        <div className="w-1/2">
                            <label htmlFor="numRecojo" className="block text-gray-700 font-medium mb-2">N° recojo:</label>
                            <input
                                type="number"
                                id="numRecojo"
                                name="numRecojo"
                                value={memoizedRegistroSeleccionado.numRecojo || 1}
                                placeholder="N° recojo"
                                autoComplete="off"
                                onChange={handleInputChange}
                                className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {errores.numRecojo && <p className="text-red-500 text-sm">{errores.numRecojo}</p>}
                        </div>
                    </div>
                    {/* Carta Porte */}
                    <div>
                        <label htmlFor="cartaPorte" className="block text-gray-700 font-medium mb-2">Carta Porte:</label>
                        <input
                            type="text"
                            id="cartaPorte"
                            name="cartaPorte"
                            value={memoizedRegistroSeleccionado.cartaPorte || ''}
                            placeholder="Carta Porte"
                            autoComplete="off"
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errores.cartaPorte && <p className="text-red-500 text-sm">{errores.cartaPorte}</p>}
                    </div>

                    {/* N° Factura */}
                    <div>
                        <label htmlFor="numFactura" className="block text-gray-700 font-medium mb-2">N° Factura:</label>
                        <input
                            type="text"
                            id="numFactura"
                            name="numFactura"
                            value={memoizedRegistroSeleccionado.numFactura || ''}
                            placeholder="Número de factura"
                            autoComplete="off"
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errores.numFactura && <p className="text-red-500 text-sm">{errores.numFactura}</p>}
                    </div>

                    {/* Fecha de Numeración */}
                    <div>
                        <label htmlFor="fechaNumeracion" className="block text-gray-700 font-medium mb-2">Fecha Numeración:</label>
                        <input
                            type="date"
                            id="fechaNumeracion"
                            name="fechaNumeracion"
                            value={memoizedRegistroSeleccionado.fechaNumeracion || ''}
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errores.fechaNumeracion && <p className="text-red-500 text-sm">{errores.fechaNumeracion}</p>}
                    </div>

                    {/* Transportista */}
                    <div>
                        <label htmlFor="transportista" className="block text-gray-700 font-medium mb-2">Transportista:</label>
                        <input
                            type="text"
                            id="transportista"
                            name="transportista"
                            value={memoizedRegistroSeleccionado.transportista || ''}
                            placeholder="Transportista"
                            autoComplete="off"
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errores.transportista && <p className="text-red-500 text-sm">{errores.transportista}</p>}
                    </div>

                    {/* Flete Pactado */}
                    <div>
                        <label htmlFor="fletePactado" className="block text-gray-700 font-medium mb-2">Flete Pactado (USD):</label>
                        <input
                            type="number"
                            id="fletePactado"
                            name="fletePactado"
                            value={memoizedRegistroSeleccionado.fletePactado || ''}
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errores.fletePactado && <p className="text-red-500 text-sm">{errores.fletePactado}</p>}
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white  px-6 py-2 mt-8 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Guardar Registro
                        </button>
                    </div>
                </div>


            </form>

            

            {/* Tabla de Cálculos */}
            <TablaCalculo />
        </div>



    );
}

export default CalculoFletesExtranjeros;
