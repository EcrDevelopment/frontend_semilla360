import React, { useState } from "react";
import { Form, DatePicker, Button, message, Table,Select,Option } from 'antd';
import axiosInstance from '../../../axiosConfig';
import dayjs from "dayjs";




function ReporteEstiba() {
    const { Option } = Select;
    const { RangePicker } = DatePicker;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    //const [fechaInicio, setFechaInicio] = useState(null); // Estado para fechaInicio
    const getYearMonth = (date) => date.year() * 12 + date.month();

    // Disabled 7 days from the selected date
    const disabled15DaysDate = (current, { from, type }) => {
        if (from) {
            const minDate = from.add(-15, 'days');
            const maxDate = from.add(17, 'days');
            switch (type) {
                case 'year':
                    return current.year() < minDate.year() || current.year() > maxDate.year();
                case 'month':
                    return (
                        getYearMonth(current) < getYearMonth(minDate) ||
                        getYearMonth(current) > getYearMonth(maxDate)
                    );
                default:
                    return Math.abs(current.diff(from, 'days')) >= 17;
            }
        }
        return false;
    };

    const handleOnFinish = async (values) => {
        console.log(values);
        setLoading(true);
        const fechaInicio = values.rangoFechas ? dayjs(values.rangoFechas[0]).format("YYYY-MM-DD") : "";
        const fechaFin = values.rangoFechas ? dayjs(values.rangoFechas[1]).format("YYYY-MM-DD") : "";
        const empresa = values.empresa ? values.empresa : "";

        try {
            const response = await axiosInstance.get("/importaciones/generar-reporte-estiba/", {
                params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin,empresa:empresa },
            });

            if (response.data.status === "success") {
                setReportData(response.data.data);
                message.success("Reporte generado correctamente");
            } else {
                message.warning(response.data.message || "No se encontraron datos");
                setReportData([]);
            }
        } catch (error) {
            console.error("Error al obtener el reporte:", error);
            message.error("Hubo un error al generar el reporte");
        } finally {
            setLoading(false);
        }
    };

    /*
    const disabledFechaFin = (current) => {
        return fechaInicio ? current && current.isBefore(fechaInicio, 'day') : false;
    };
    */

    const columns = [
        { title: "Estado", dataIndex: "pago_estiba", key: "pago_estiba" },
        { title: "Placa", dataIndex: "placa_llegada", key: "placa" },
        { title: "DUA", dataIndex: "despacho__dua", key: "dua" },
        { title: "Transportista", dataIndex: "despacho__transportista__nombre_transportista", key: "transportista" },        
        { title: "Total sacos", dataIndex: "sacos_descargados", key: "sacos_descargados", align: 'center' },  
        { title: "Sacos Pend. Pago", dataIndex: "cant_desc", key: "cant_desc", align: 'center' },      
        { title: "Total a pagar", dataIndex: "total_a_pagar", key: "total_a_pagar", align: 'right', className: 'column-money' },
    ];

    return (
        <div className="w-full h-full p-4">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Reporte de Estiba</h2>
            <div className="flex flex-col w-full m-auto justify-items-center p-4 rounded-md shadow-md bg-gray-300">
                <Form form={form} onFinish={handleOnFinish} requiredMark={false} layout="inline">
                    <Form.Item
                        label="Empresa"
                        name="empresa"
                        rules={[{ required: true, message: 'Por favor, selecciona una empresa' }]} >
                        <Select                           
                            placeholder="Selecciona una empresa"
                            className="w-full"
                        >
                            <Option value="bd_semilla_starsoft">LA SEMILLA DE ORO SAC</Option>
                            <Option value="bd_maxi_starsoft">MAXIMILIAN INVERSIONES SA</Option>
                            <Option value="bd_trading_starsoft">TRADING SEMILLA SAC</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item 
                    name="rangoFechas"
                    rules={[{ required: true, message: 'Por favor selecciona un rango de fechas' }]} 
                    >
                        <RangePicker format={"DD/MM/YYYY"} disabledDate={disabled15DaysDate} />
                    </Form.Item>                   
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Generar
                    </Button>
                </Form>
            </div>

            <div className="w-full mt-4">
                <Table
                    dataSource={reportData}
                    columns={columns}
                    rowKey="id"
                    pagination={{ position:['bottomLeft'] , pageSize: 10 }}
                    loading={loading}
                />
            </div>
        </div>
    );
}

export default ReporteEstiba;
