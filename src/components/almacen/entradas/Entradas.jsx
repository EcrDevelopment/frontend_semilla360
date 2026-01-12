import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, DatePicker } from 'antd';
//import DynamicFields from './OtrosGastosFields';


function FormularioIngresos() {

    const [form] = Form.useForm();
    
    const onFinish = (values) => {
        console.log('Formulario enviado:', values);
    };


    return (
        <div className="w-full">
            <Form
                requiredMark={false}
                form={form}
                onFinish={onFinish}
                layout="vertical"
                initialValues={{
                    //dua: '',
                    //precioProd: precio,
                    
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">


                    <div className="">
                        <Form.Item
                            label="Merma permitida (kg)"
                            name="mermaPermitida"

                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el peso de merma permitida',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseInt(value, 10) : 0,
                                message: 'El valor de la merma permitida debe ser un número entero',
                            }]} >
                            <InputNumber min={1.00} style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="Precio del producto"
                            name="precioProd"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el precio del producto',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseFloat(value) : 0,
                                message: 'El Precio del producto debe ser un número decimal',
                            }]} >
                            <InputNumber
                                min={0.01}
                                step={0.01}
                                style={{ width: '100%' }}
                                prefix="$"
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="Gastos de nacionalizacion"
                            name="gastosNacionalizacion"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el monto',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseFloat(value) : 0,
                                message: 'El monto debe ser un número decimal',
                            }]}>
                            <InputNumber
                                min={1.0}
                                step={0.01}
                                style={{ width: '100%' }}
                                prefix="$"
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="Margen Financiero"
                            name="margenFinanciero"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el monto',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseFloat(value) : 0,
                                message: 'El monto debe ser un número decimal',
                            }]}>
                            <InputNumber
                                min={1.0}
                                step={0.01}
                                style={{ width: '100%' }}
                                prefix="$"
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="Monto dsct. por saco roto"
                            name="precioSacosRotos"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el monto',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseFloat(value) : 0,
                                message: 'El monto debe ser un número decimal',
                            }]}>
                            <InputNumber
                                min={1.0}
                                step={0.01}
                                style={{ width: '100%' }}
                                prefix="$"
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="Monto dsct. por saco humedo"
                            name="precioSacosHumedos"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el monto',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseFloat(value) : 0,
                                message: 'El monto debe ser un número decimal',
                            }]}>
                            <InputNumber
                                step={0.01}
                                style={{ width: '100%' }}
                                prefix="$"
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="Monto dsct. por saco mojado"
                            name="precioSacosMojados"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el monto',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseFloat(value) : 0,
                                message: 'El monto debe ser un número decimal',
                            }]}>
                            <InputNumber
                                min={1.0}
                                step={0.01}
                                style={{ width: '100%' }}
                                prefix="$"
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="T/C dsct. estiba transportista"
                            name="tipoCambioDescExt"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el monto',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseFloat(value) : 0,
                                message: 'El monto debe ser un número decimal',
                            }]}>
                            <InputNumber
                                min={1.0}
                                step={0.01}
                                style={{ width: '100%' }}
                                prefix="$"
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="Precio estiba x TM "
                            name="precioEstibaTonelada"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa el monto',
                            }, {
                                type: 'number',
                                transform: (value) => value ? parseFloat(value) : 0,
                                message: 'El monto debe ser un número decimal',
                            }]}>
                            <InputNumber
                                min={1.0}
                                step={0.01}
                                style={{ width: '100%' }}
                                prefix="S/"
                            />
                        </Form.Item>
                    </div>

                    <div className="">
                        <Form.Item
                            label="Fecha de llegada"
                            name="fechaLlegada"
                            rules={[{
                                required: true,
                                message: 'Por favor, ingresa la fecha de llegada',
                            }, {
                                type: 'date',
                                message: 'Por favor, ingresa una fecha válida',
                            }]} >
                            <DatePicker format={"DD/MM/YYYY"} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                </div>
                    <hr></hr>   
                    <h3 className='w-full p-2 font-semibold text-xl'> Otros gastos:</h3>    
               


                {/* Botón de enviar */}
                <div className="md:mt-7 lg:mt-7">
                    <Button type="primary" htmlType="submit" className="w-full">
                        Registrar
                    </Button>
                </div>
            </Form>

        </div>
    );
}

export default FormularioIngresos;
