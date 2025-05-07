import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import FileUpload from '../../FileUpload';
import UploadFileExcel from './UploadFileExcel';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button, notification } from 'antd';
import { DeliveredProcedureOutlined, SyncOutlined } from '@ant-design/icons';

const TablaCalculo = ({ onDataValidate }) => {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('importaciones_Data_Table')); // Leer los datos del localStorage
    if (storedData) {
      setRowData(storedData); // Si hay datos en el localStorage, actualizamos el estado de rowData
    }
  }, []); // El segundo parámetro vacío asegura que este efecto se ejecute solo una vez al montar el componente


  const procesarTabla = () => {
    setLoading(true);
    // Variable para almacenar las filas válidas
    const validRows = [];
    const validRowsProccessd = [];
    const DEFAULT_VALUES = ['', 0, null, undefined];

    // Validación: verificar que no haya campos vacíos o incorrectos
    const hasErrors = rowData.some((row) => {
      // Verificar si la fila está vacía
      const isRowEmpty = !row || Object.values(row).every(value => DEFAULT_VALUES.includes(value));
      if (isRowEmpty) {
        return true; // Una fila vacía es considerada un error
      }

      // Verificar si hay datos válidos en las columnas clave
      const hasDataInColumns = [
        row.placa,
        row.sacosCargados,
        row.pesoSalida,
        row.placaLlegada,
        row.sacosDescargados,
        row.pesoLlegada,
      ].some(value => value !== 0 && value !== '');

      if (hasDataInColumns) {
        const hasError = (
          !row.placa ||
          row.sacosCargados <= 0 ||
          row.pesoSalida <= 0 ||
          !row.placaLlegada ||
          row.sacosDescargados <= 0 ||
          row.pesoLlegada <= 0 ||
          row.pagoEstiba === "Seleccione" ||
          (row.pagoEstiba === "Pago parcial" && (row.cantDesc === undefined || row.cantDesc <= 0))
        );

        if (!hasError) {
          validRows.push(row);
        }
        
        return hasError; // Retorna verdadero si hay un error
      }      
      return false; // Si no hay datos válidos, no es un error
    });


    if (hasErrors) {
      notification.warning({
        message: 'ADVERTENCIA',
        description: 'Completar los campos requeridos en cada fila.',
      });
      setLoading(false);
      return;
    }

    if (validRows.length < 1) {
      notification.warning({
        message: 'ADVERTENCIA',
        description: 'Se debe completar al menos una fila para poder realizar el calculo.',
      });      
      setLoading(false);    
      return;
    }

    // Solo calculamos la merma y sacos para las filas válidas
    const processedRows = rowData.map((row) => {
      // Revisamos si la fila actual está en validRows
      const isRowValid = validRows.includes(row);

      if (isRowValid && row?.pesoSalida != null && row?.pesoLlegada != null && row?.sacosCargados != null && row?.sacosDescargados != null) {
        // Asegurarse de que pesoSalida y pesoLlegada sean números
        let pesoSalida = row.pesoSalida || 0;
        let pesoLlegada = row.pesoLlegada || 0;
        let sacosCargados = row.sacosCargados || 0;
        let sacosDescargados = row.sacosDescargados || 0;

        const merma = calcularMerma(pesoSalida, pesoLlegada);
        const sacosFaltantes = calcularSacosFaltantes(sacosCargados, sacosDescargados);

        // Agregar la fila válida a validRowsProccessd
        validRowsProccessd.push({
          ...row,
          merma,
          sacosFaltantes,
        });

        return {
          ...row,
          merma: merma,
          sacosFaltantes: sacosFaltantes,
        };
      }

      return row; // Deja las filas inválidas sin cambios
    });


    
    setLoading(false); // Desactivar el estado de carga después de 3 segundos
    
    setRowData(processedRows); // Actualizar el estado con los nuevos datos
    onDataValidate(validRowsProccessd);

  };

  const calcularMerma = (pesoSalida, pesoLlegada) => {
    pesoSalida = typeof pesoSalida === 'string' ? parseFloat(pesoSalida.replace(/,/g, '')) : pesoSalida;
    pesoLlegada = typeof pesoLlegada === 'string' ? parseFloat(pesoLlegada.replace(/,/g, '')) : pesoLlegada;

    return (isNaN(pesoLlegada) ? 0 : pesoLlegada) - (isNaN(pesoSalida) ? 0 : pesoSalida);
  };

  const calcularSacosFaltantes = (sacosCargados, sacosDescargados) => {
    sacosCargados = typeof sacosCargados === 'string' ? parseInt(sacosCargados) : sacosCargados;
    sacosDescargados = typeof sacosDescargados === 'string' ? parseInt(sacosDescargados) : sacosDescargados;

    return (isNaN(sacosCargados) ? 0 : sacosCargados) - (isNaN(sacosDescargados) ? 0 : sacosDescargados);
  };

  const handleDataFromChild = (data) => {
    // Limpiar las filas (restablecer los valores a su estado inicial)
    setRowData((prevData) => {
      // Mapear las filas previas y restablecer todos los valores a los iniciales
      const resetRows = prevData.map((row) => ({
        numero: row.numero, // Mantener el número de la fila
        placa: '', // Limpiar placa
        sacosCargados: 0, // Limpiar sacos cargados
        pesoSalida: 0, // Limpiar peso de salida
        placaLlegada: '', // Limpiar placa llegada
        sacosDescargados: 0, // Limpiar sacos descargados
        pesoLlegada: 0, // Limpiar peso llegada
        merma: 0, // Limpiar merma
        sacosFaltantes: 0, // Limpiar sacos faltantes
        sacosRotos: 0, // Limpiar sacos rotos
        sacosHumedos: 0, // Limpiar sacos humedos
        sacosMojados: 0, // Limpiar sacos mojados
        pagoEstiba: "Seleccione", // Limpiar pagoEstiba
        cantDesc: 0 // Limpiar cantidad descargada
      }));

      // Ahora, llenamos las filas con los nuevos datos recibidos
      data.forEach((item, index) => {
        if (resetRows[index]) {
          resetRows[index] = {
            ...resetRows[index], // Mantener los valores reseteados
            placa: item.PLACA,  // Actualizamos la columna PLACA
            sacosCargados: item.BULTOS, // Actualizamos la columna SACOS CARGADOS
            pesoSalida: item["PESO NETO"].replace(/,/g, ''), // Actualizamos la columna PESO SALIDA
          };
        }
      });

      return resetRows; // Retornamos las filas actualizadas
    });
  };

  const handleDataFromFileExcel = (data) => {
    // Limpiar las filas (restablecer los valores a su estado inicial)
    setRowData((prevData) => {
      // Mapear las filas previas y restablecer todos los valores a los iniciales
      const resetRows = prevData.map((row) => ({
        numero: row.numero, // Mantener el número de la fila
        placa: '', // Limpiar placa
        sacosCargados: 0, // Limpiar sacos cargados
        pesoSalida: 0, // Limpiar peso de salida
        placaLlegada: '', // Limpiar placa llegada
        sacosDescargados: 0, // Limpiar sacos descargados
        pesoLlegada: 0, // Limpiar peso llegada
        merma: 0, // Limpiar merma
        sacosFaltantes: 0, // Limpiar sacos faltantes
        sacosRotos: 0, // Limpiar sacos rotos
        sacosHumedos: 0, // Limpiar sacos humedos
        sacosMojados: 0, // Limpiar sacos mojados
        pagoEstiba: "Seleccione", // Limpiar pagoEstiba
        cantDesc: 0 // Limpiar cantidad descargada
      }));

      // Ahora, llenamos las filas con los nuevos datos recibidos
      data.forEach((item, index) => {
        if (resetRows[index]) {
          resetRows[index] = {
            ...resetRows[index], // Mantener los valores reseteados
            placa: item.placa_salida,
            sacosCargados: item.sacos_cargados,
            pesoSalida: item.peso_salida,
            placaLlegada: item.placa_llegada,
            sacosDescargados: item.sacos_descargados,
            pesoLlegada: item.peso_llegada,
            sacosRotos: item.sacos_rotos,
            sacosHumedos: item.sacos_humedos,
            sacosMojados: item.sacos_mojados,
            pagoEstiba: item.pago_estiba,
          };
        }
      });

      return resetRows; // Retornamos las filas actualizadas
    });
  }

  // Definir las columnas, solo las columnas a partir de "PLACA" serán editables
  const columnDefs = [
    { headerName: 'N°', field: 'numero', sortable: false },
    { headerName: 'PLACA SALIDA', field: 'placa', editable: true, sortable: false }, // Editable
    { headerName: 'SACOS CARGADOS', field: 'sacosCargados', editable: true, sortable: false }, // Editable
    { headerName: 'PESO SALIDA (kg)', field: 'pesoSalida', editable: true, sortable: false }, // Editable
    { headerName: 'PLACA LLEGADA', field: 'placaLlegada', editable: true, sortable: false }, // Editable
    { headerName: 'SACOS DESCARGADOS', field: 'sacosDescargados', editable: true, sortable: false }, // Editable
    { headerName: 'PESO LLEGADA (kg)', field: 'pesoLlegada', editable: true, sortable: false }, // Editable
    { headerName: 'MERMA (kg)', field: 'merma', editable: false, sortable: false }, // Editable
    { headerName: 'SACOS FALTANTES', field: 'sacosFaltantes', editable: false, sortable: false }, // Editable
    { headerName: 'SACOS ROTOS', field: 'sacosRotos', editable: true, sortable: false }, // Editable
    { headerName: 'SACOS HUMEDOS', field: 'sacosHumedos', editable: true, sortable: false }, // Editable
    { headerName: 'SACOS MOJADOS', field: 'sacosMojados', editable: true, sortable: false }, // Editable
    {
      headerName: "PAGO ESTIBA",
      field: "pagoEstiba",
      editable: true, // Habilitar la celda para ser editable
      sortable: false,
      cellEditor: "agSelectCellEditor", // Usar el editor select de AgGrid
      cellEditorParams: {
        values: ["Seleccione", "Transbordo", "Pago estiba", "No pago estiba", "Pago parcial"], // Las opciones del select
      },
    },
    { headerName: 'CANT. DESC', field: 'cantDesc', editable: true, sortable: false }, // Edi
  ];

  // Datos iniciales
  const [rowData, setRowData] = useState([
    { numero: 1, placa: '', sacosCargados: 0, pesoSalida: 0, placaLlegada: '', sacosDescargados: 0, pesoLlegada: 0, merma: 0, sacosFaltantes: 0, sacosRotos: 0, sacosHumedos: 0, sacosMojados: 0, pagoEstiba: "Seleccione", cantDesc: 0 },
    { numero: 2, placa: '', sacosCargados: 0, pesoSalida: 0, placaLlegada: '', sacosDescargados: 0, pesoLlegada: 0, merma: 0, sacosFaltantes: 0, sacosRotos: 0, sacosHumedos: 0, sacosMojados: 0, pagoEstiba: "Seleccione", cantDesc: 0 },
    { numero: 3, placa: '', sacosCargados: 0, pesoSalida: 0, placaLlegada: '', sacosDescargados: 0, pesoLlegada: 0, merma: 0, sacosFaltantes: 0, sacosRotos: 0, sacosHumedos: 0, sacosMojados: 0, pagoEstiba: "Seleccione", cantDesc: 0 },
    { numero: 4, placa: '', sacosCargados: 0, pesoSalida: 0, placaLlegada: '', sacosDescargados: 0, pesoLlegada: 0, merma: 0, sacosFaltantes: 0, sacosRotos: 0, sacosHumedos: 0, sacosMojados: 0, pagoEstiba: "Seleccione", cantDesc: 0 },
    { numero: 5, placa: '', sacosCargados: 0, pesoSalida: 0, placaLlegada: '', sacosDescargados: 0, pesoLlegada: 0, merma: 0, sacosFaltantes: 0, sacosRotos: 0, sacosHumedos: 0, sacosMojados: 0, pagoEstiba: "Seleccione", cantDesc: 0 },
    { numero: 6, placa: '', sacosCargados: 0, pesoSalida: 0, placaLlegada: '', sacosDescargados: 0, pesoLlegada: 0, merma: 0, sacosFaltantes: 0, sacosRotos: 0, sacosHumedos: 0, sacosMojados: 0, pagoEstiba: "Seleccione", cantDesc: 0 },
    { numero: 7, placa: '', sacosCargados: 0, pesoSalida: 0, placaLlegada: '', sacosDescargados: 0, pesoLlegada: 0, merma: 0, sacosFaltantes: 0, sacosRotos: 0, sacosHumedos: 0, sacosMojados: 0, pagoEstiba: "Seleccione", cantDesc: 0 },
    { numero: 8, placa: '', sacosCargados: 0, pesoSalida: 0, placaLlegada: '', sacosDescargados: 0, pesoLlegada: 0, merma: 0, sacosFaltantes: 0, sacosRotos: 0, sacosHumedos: 0, sacosMojados: 0, pagoEstiba: "Seleccione", cantDesc: 0 },
  ]);

  return (
    <div className="ag-theme-alpine" style={{ width: '100%' }}>
      <div className='bd-gray-200 p-2 flex space-x-2 flex-row w-full rounded-md' >
        <FileUpload onDataSelect={handleDataFromChild} />
        <UploadFileExcel onDataSelect={handleDataFromFileExcel} />
      </div>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={rowData}
        domLayout="autoHeight"
      />
      <div className='my-2 rounded-md p-3 flex felx-row items-center w-1/4'>
        <Button
          block
          color="primary"
          variant="solid"
          size="large"
          icon={loading ? <SyncOutlined spin /> : <DeliveredProcedureOutlined />}
          loading={loading}
          onClick={procesarTabla}
          danger
        >
          {loading ? 'Procesando...' : 'Enviar'}
        </Button>
      </div>
    </div>
  );
};

export default TablaCalculo;
