import React, { useState } from 'react';
import axiosInstance from '../../../axiosConfig';
import { Button, notification } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { RiFileExcel2Line } from "react-icons/ri";

const FileUpload = ({ onDataSelect }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [selectedData, setSelectedData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setPreviewData(null);
            setSelectedData(null);
        }
    };

    const handleFileUpload = async () => {
        if (!file) {
            setError('Por favor, selecciona un archivo.');
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axiosInstance.post('/importaciones/upload-file-excel/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.status === "success") {
                //console.log("respuesta: ", response)
                setPreviewData(response.data.tabla);

            }else if (response.data.status === "error") {
                // Si el estado es "warning", puedes manejarlo de forma diferente
                notification.error({
                    message: 'Error',
                    description: `ocurrio un error: ${response.data.error}`,
                });
            }else {
                //console.log("respuesta: ", response.data)
                notification.error({
                    message: 'ERROR',
                    description: `Los datos en el archivo no son válidos. Por favor, verifica el archivo y vuelve a intentarlo.`,
                });
            }

        } catch (err) {
           
            notification.error({
                message: 'Error',
                description: `${err.response.data.error}`,
            });
            console.error('Error al subir archivo:', err.response || err.message);
            setError(err.response.error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectData = (data) => {
        setSelectedData(data);
        onDataSelect(data);
        setIsModalOpen(false); // Cierra el modal
        setFile(null); // Limpiar el archivo seleccionado
        setError(''); // Limpiar el error si existiera
        setPreviewData(null); // Limpiar la vista previa si existiera   
    };
    /*
    const handleDeleteRow = (tableIndex, rowIndex) => {
        setPreviewData(prev => {
            if (!prev) return null;

            const newPreviewData = { ...prev };

            // Para tablas PDF
            if (prev.tables) {
                newPreviewData.tables = prev.tables.map((table, tIndex) => {
                    if (tIndex === tableIndex) {
                        return table.filter((_, index) => index !== rowIndex);
                    }
                    return table;
                });
            }

            // Para datos Excel
            if (prev.data) {
                const sheetNames = Object.keys(prev.data);
                newPreviewData.data = {
                    ...prev.data,
                    [sheetNames[tableIndex]]: prev.data[sheetNames[tableIndex]].filter((_, index) => index !== rowIndex)
                };
            }

            return newPreviewData;
        });
    };

    const handleDeleteColumn = (tableIndex, columnIndex) => {
        setPreviewData(prev => {
            if (!prev) return null;

            const newPreviewData = { ...prev };

            // Para tablas PDF
            if (prev.tables) {
                newPreviewData.tables = prev.tables.map((table, tIndex) => {
                    if (tIndex === tableIndex) {
                        return table.map(row => row.filter((_, index) => index !== columnIndex));
                    }
                    return table;
                });
            }

            // Para datos Excel
            if (prev.data) {
                const sheetNames = Object.keys(prev.data);
                const currentSheet = sheetNames[tableIndex];
                const headers = Object.keys(prev.data[currentSheet][0]);
                const headerToRemove = headers[columnIndex];

                newPreviewData.data = {
                    ...prev.data,
                    [currentSheet]: prev.data[currentSheet].map(row => {
                        const newRow = { ...row };
                        delete newRow[headerToRemove];
                        return newRow;
                    })
                };
            }

            return newPreviewData;
        });
    };
    */

    const handleDeleteColumn = (columnIndex) => {
        const updatedData = previewData.map((row) => {
            const updatedRow = { ...row };
            delete updatedRow[Object.keys(row)[columnIndex]];
            return updatedRow;
        });
        setPreviewData(updatedData);
    };

    const handleDeleteRow = (rowIndex) => {
        const updatedData = previewData.filter((_, index) => index !== rowIndex);
        setPreviewData(updatedData);
    };


    return (
        <div>
            <Button
                color="green" variant="solid"
                icon={<RiFileExcel2Line />}
                onClick={() => setIsModalOpen(true)}
            >
                Cargar Plantilla excel
            </Button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-11/12 max-w-4xl p-6 rounded-lg shadow-lg relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            ✖
                        </button>

                        <h2 className="text-xl font-bold mb-4">Cargar Data desde plantilla Excel</h2>
                        <input type="file" onChange={handleFileChange} className="mb-4 block" />
                        <button
                            onClick={handleFileUpload}
                            disabled={loading}
                            className={`px-4 py-2 rounded-md ${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
                                } text-white font-semibold`}
                        >
                            {loading ? 'Cargando...' : 'Procesar archivo'}
                        </button>
                        {error && <p className="text-red-500 mt-2">{error}</p>}

                        {previewData && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Datos Extraídos de Excel:</h3>
                                {previewData.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto max-w-full">
                                            <table className="table-auto w-full border border-gray-300 rounded-md shadow-md">
                                                <thead>
                                                    <tr className="bg-gray-100 text-left">
                                                        {Object.keys(previewData[0]).map((header, columnIndex) => (
                                                            <th key={columnIndex} className="px-4 py-2 border-b font-semibold text-gray-700 relative group">
                                                                {header}
                                                                <button
                                                                    onClick={() => handleDeleteColumn(columnIndex)}
                                                                    className="absolute top-1/2 right-2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ease-in-out hover:bg-gray-200 rounded-full p-1"
                                                                >
                                                                    <DeleteOutlined className="text-lg text-gray-500 hover:text-red-500" />
                                                                </button>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewData.map((row, rowIndex) => (
                                                        <tr key={rowIndex} className="relative group hover:bg-gray-50">
                                                            {Object.values(row).map((cell, cellIndex) => {
                                                                const isLastColumn = cellIndex === Object.values(row).length - 1;
                                                                return (
                                                                    <td key={cellIndex} className="px-4 py-2 border-b text-gray-600">
                                                                        {cell}
                                                                        {isLastColumn && (
                                                                            <div className="absolute mr-2 right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ease-in-out hover:bg-gray-200 p-1 rounded-full">
                                                                                <button
                                                                                    onClick={() => handleDeleteRow(rowIndex)}
                                                                                    className="text-base text-gray-500 hover:text-red-500 p-0.5 transition-all duration-300 ease-in-out"
                                                                                >
                                                                                    <DeleteOutlined className="text-base" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => handleSelectData(previewData)}
                                                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                                            >
                                                Enviar datos
                                            </button>
                                        </div>
                                    </>



                                ) : (
                                    <p>No hay datos disponibles para mostrar.</p>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;

