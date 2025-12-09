// src/components/Despacho/TablaOrdenesDespacho.jsx
import React, {
  useEffect,
  useState,
  useCallback, // Importar useCallback
  useMemo, // Importar useMemo
} from 'react';
import PropTypes from 'prop-types'; // Importar PropTypes
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Space,
  Tooltip,
  Popconfirm,
  message,
  AutoComplete,
} from 'antd';
import {
  obtenerOrdenesDespacho,
  actualizarOrdenDespacho,
  eliminarOrdenDespacho,
  crearOrdenDespacho,
} from '../../../api/OrdenCompraDespacho';
import {
  obtenerConfiguracionDespacho,
  editarConfiguracionDespacho,
} from '../../../api/ConfiguracionDespacho';
import { listarEmpresas } from '../../../api/EmpresasInternas';
import axiosInstance from '../../../axiosConfig';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

// 1. Mover la constante fuera del componente
// Esto evita que se re-declare en cada render
const nombreComercialEmpresas = {
  bd_maxi_starsoft: 'MAXIMILIAN INVERSIONES SA',
  bd_trading_starsoft: 'TRADING SEMILLA SAC',
  bd_semilla_starsoft: 'LA SEMILLA DE ORO SAC',
};

export default function TablaOrdenesDespacho({ despachoId }) {
  const [ordenes, setOrdenes] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);
  const [opcionesOC, setOpcionesOC] = useState([]);
  const [productosDuplicados, setProductosDuplicados] = useState([]);
  const [modalDuplicadosVisible, setModalDuplicadosVisible] = useState(false);
  const [payloadPendiente, setPayloadPendiente] = useState(null);
  const [modalProrrateoVisible, setModalProrrateoVisible] = useState(false);
  const [precioProrrateado, setPrecioProrrateado] = useState(null);

  // 2. Envolver todas las funciones en useCallback

  const cargarEmpresas = useCallback(async () => {
    try {
      const data = await listarEmpresas();
      setEmpresas(data);
    } catch (error) {
      message.error('Error al cargar empresas');
    }
  }, []); // Sin dependencias, ya que no usa props/estado

  const cargarOrdenes = useCallback(async () => {
    try {
      const data = await obtenerOrdenesDespacho(despachoId);
      setOrdenes(data);
    } catch {
      message.error('Error al cargar órdenes');
    }
  }, [despachoId]); // Depende de despachoId

  // 3. Actualizar el array de dependencias del useEffect
  useEffect(() => {
    if (despachoId) {
      cargarOrdenes();
      cargarEmpresas();
    }
  }, [despachoId, cargarOrdenes, cargarEmpresas]); // Añadir funciones memoizadas

  // Este useEffect para sincronizar precios ya estaba mayormente correcto
  // porque define su lógica async/await *dentro* del efecto.
  useEffect(() => {
    const sincronizarPrecioConfiguracion = async () => {
      if (!despachoId) return;
      if (ordenes === null) {
        return;
      }

      try {
        const res = await obtenerConfiguracionDespacho(despachoId);
        const configActual = res.data;
        const configId = configActual.id;
        const precioGuardado = Number(configActual.precio_prod).toFixed(5);

        let nuevoPrecio = null;
        let motivoActualizacion = '';
        let payload = null;

        if (ordenes.length === 0) {
          nuevoPrecio = 0;
          motivoActualizacion = 'Precio reiniciado a 0 (sin órdenes).';
        } else if (ordenes.length === 1) {
          const o1 = ordenes[0];
          nuevoPrecio = Number(o1.precio_producto);
          motivoActualizacion = `Precio actualizado a ${nuevoPrecio.toFixed(
            5,
          )} (1 orden).`;
          setModalProrrateoVisible(false);
        } else if (ordenes.length === 2) {
          const [o1, o2] = ordenes;
          if (
            o1.precio_producto &&
            o2.precio_producto &&
            o1.cantidad_asignada &&
            o2.cantidad_asignada
          ) {
            const peso1T = o1.cantidad_asignada / 1000;
            const peso2T = o2.cantidad_asignada / 1000;
            const precio1 = o1.precio_producto * 1000;
            const precio2 = o2.precio_producto * 1000;
            const sumaPesos = peso1T + peso2T;

            if (sumaPesos > 0) {
              let precioFinal =
                (precio1 * peso1T + precio2 * peso2T) / sumaPesos;
              const precioCalculado = Number((precioFinal / 1000).toFixed(5));

              if (precioCalculado.toFixed(5) !== precioGuardado) {
                setPrecioProrrateado(precioCalculado);
                setModalProrrateoVisible(true);
              }
            }
          }
          return;
        }

        if (nuevoPrecio !== null && nuevoPrecio.toFixed(5) !== precioGuardado) {
          payload = { ...configActual, precio_prod: nuevoPrecio };
          delete payload.id;
          await editarConfiguracionDespacho(configId, payload);
          message.info(motivoActualizacion);
        }
      } catch (e) {
        console.error('Error sincronizando precio en config', e);
        message.warning('No se pudo sincronizar el precio con la configuración.');
      }
    };

    sincronizarPrecioConfiguracion();
  }, [ordenes, despachoId]); // Dependencias correctas

  // 2. Continuación: Envolver todas las funciones en useCallback

  const abrirModalCrear = useCallback(() => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]); // Depende de 'form'

  const abrirModalEditar = useCallback(
    (record) => {
      setEditing(record);
      form.setFieldsValue(record);
      setModalVisible(true);
    },
    [form],
  ); // Depende de 'form'

  const cerrarModal = useCallback(() => {
    form.resetFields();
    setModalVisible(false);
    setEditing(null);
    setOpcionesOC([]);
  }, [form]); // Depende de 'form'

  const onFinish = useCallback(
    async (values) => {
      try {
        if (editing) {
          const updated = await actualizarOrdenDespacho(
            despachoId,
            editing.id,
            values,
          );
          setOrdenes((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          );
          message.success('Orden actualizada');
        } else {
          const nueva = await crearOrdenDespacho(despachoId, values);
          setOrdenes((prev) => [...prev, nueva]);
          message.success('Orden agregada');
        }
        cerrarModal();
      } catch (error) {
        const data = error.response?.data;
        if (data?.conflicto && data?.tipo_error === 'duplicado') {
          message.warning(data.detalle || 'Ya existe un registro duplicado');
          return;
        }
        if (data?.conflicto && data?.productos) {
          setProductosDuplicados(data.productos);
          setPayloadPendiente(values);
          setModalDuplicadosVisible(true);
          message.warning(
            data.detalle || 'Conflicto detectado: varios productos coinciden',
          );
          return;
        }
        if (data?.non_field_errors) {
          message.error(data.non_field_errors[0]);
        } else if (data?.numero_oc) {
          message.error(`Error en N° OC: ${data.numero_oc[0]}`);
        } else if (data?.numero_recojo) {
          message.error(`Error en N° Recojo: ${data.numero_recojo[0]}`);
        } else {
          message.error('Error al guardar la orden');
        }
      }
    },
    [editing, despachoId, cerrarModal],
  ); // Depende de 'editing', 'despachoId' y 'cerrarModal'

  const handleSearchOC = useCallback(
    async (termino) => {
      if (termino.length < 2) {
        setOpcionesOC([]);
        return;
      }
      const empresa_id = form.getFieldValue('empresa_id');
      const empresaSeleccionada = empresas.find((e) => e.id === empresa_id);
      if (!empresaSeleccionada) {
        message.warning('Selecciona una empresa primero');
        return;
      }
      try {
        const baseDatos = empresaSeleccionada.nombre_empresa;
        const response = await axiosInstance.get('/importaciones/buscar_oi/', {
          params: { base_datos: baseDatos, query: termino },
        });
        setOpcionesOC(response.data);
      } catch (error) {
        console.error('Error al buscar OC:', error);
        setOpcionesOC([]);
      }
    },
    [form, empresas],
  ); // Depende de 'form' y 'empresas'

  const handleSelectOC = useCallback(
    (value) => {
      const seleccionada = opcionesOC.find((item) => item.numero_oc === value);
      if (seleccionada) {
        form.setFieldsValue({
          producto_nombre: seleccionada.producto,
          precio_producto: seleccionada.precio_unitario,
          proveedor_marca: seleccionada.proveedor,
          cantidad: seleccionada.cantidad,
        });
      }
    },
    [form, opcionesOC],
  ); // Depende de 'form' y 'opcionesOC'

  const handleAplicarProrrateo = useCallback(async () => {
    try {
      const res = await obtenerConfiguracionDespacho(despachoId);
      const configActual = res.data;
      const configId = configActual.id;
      const payload = {
        ...configActual,
        precio_prod: precioProrrateado,
      };
      delete payload.id;
      await editarConfiguracionDespacho(configId, payload);
      message.success('Precio prorrateado aplicado a la configuración del despacho');
      setModalProrrateoVisible(false);
    } catch (e) {
      message.error('Error al aplicar prorrateo en la configuración');
      console.error(e);
    }
  }, [despachoId, precioProrrateado]); // Depende de 'despachoId' y 'precioProrrateado'

  const handleDelete = useCallback(
    async (id) => {
      try {
        await eliminarOrdenDespacho(despachoId, id);
        setOrdenes((prev) => prev.filter((item) => item.id !== id));
        message.success('Orden eliminada');
      } catch {
        message.error('Error al eliminar la orden');
      }
    },
    [despachoId],
  ); // Depende de 'despachoId'

  // 4. Extraer la función para el modal de duplicados
  const handleSelectProductoDuplicado = useCallback(
    async (record) => {
      try {
        const payloadConId = { ...payloadPendiente, producto_id: record.id };
        if (editing) {
          const updated = await actualizarOrdenDespacho(
            despachoId,
            editing.id,
            payloadConId,
          );
          setOrdenes((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          );
          message.success('Orden actualizada correctamente');
        } else {
          const nueva = await crearOrdenDespacho(despachoId, payloadConId);
          setOrdenes((prev) => [...prev, nueva]);
          message.success('Orden creada correctamente');
        }
        setModalDuplicadosVisible(false);
        cerrarModal();
      } catch (e) {
        console.error('Error al registrar con producto seleccionado', e);
        const errData = e?.response?.data;
        message.error(
          errData?.detail || 'Error al registrar con producto seleccionado',
        );
      }
    },
    [payloadPendiente, editing, despachoId, cerrarModal],
  );

  // 5. Memoizar el array 'columns' con useMemo
  const columns = useMemo(
    () => [
      { title: 'N° OC', dataIndex: 'numero_oc' },
      {
        title: 'Empresa',
        dataIndex: 'empresa_id',
        render: (id) => {
          const empresa = empresas.find((e) => e.id === id);
          if (!empresa) return id;
          // Usa la constante 'nombreComercialEmpresas' definida fuera
          return (
            nombreComercialEmpresas[empresa.nombre_empresa] ||
            empresa.nombre_empresa
          );
        },
      },
      { title: 'Producto', dataIndex: 'producto_nombre' },
      { title: 'Precio', dataIndex: 'precio_producto' },
      { title: 'Cantidad', dataIndex: 'cantidad_asignada' },
      { title: 'N° Recojo', dataIndex: 'numero_recojo' },
      {
        title: 'Acciones',
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <Button
              onClick={() => abrirModalEditar(record)} // onClick usa la función memoizada
              type="link"
            >
              <EditOutlined />
            </Button>
            <Popconfirm
              title="¿Eliminar esta orden?"
              onConfirm={() => handleDelete(record.id)} // onConfirm usa la función memoizada
            >
              <Button danger type="link">
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [empresas, abrirModalEditar, handleDelete], // Depende de 'empresas' y las funciones memoizadas
  );

  // 6. Memoizar el footer del modal de prorrateo
  const handleCancelProrrateo = useCallback(() => {
    setModalProrrateoVisible(false);
  }, []);

  const modalProrrateoFooter = useMemo(
    () => [
      <Button key="cancel" onClick={handleCancelProrrateo}>
        Cancelar
      </Button>,
      <Button key="ok" type="primary" onClick={handleAplicarProrrateo}>
        Aplicar nuevo precio
      </Button>,
    ],
    [handleCancelProrrateo, handleAplicarProrrateo],
  );

  // El JSX permanece casi igual, solo se actualizan las referencias
  // a las funciones memoizadas y al footer del modal
  return (
    <div>
      <Tooltip
        title={
          ordenes?.length >= 2 ? 'Solo se permiten 2 órdenes por despacho' : ''
        }
      >
        <Button
          type="primary"
          onClick={abrirModalCrear} // Usa la función memoizada
          style={{ marginBottom: 16 }}
          disabled={!ordenes || ordenes.length >= 2}
        >
          Nueva Orden
        </Button>
      </Tooltip>

      <Table
        rowKey="id"
        dataSource={ordenes || []}
        columns={columns} // Usa las columnas memoizadas
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={modalVisible}
        title={editing ? 'Editar Orden' : 'Nueva Orden'}
        onCancel={cerrarModal} // Usa la función memoizada
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish} // Usa la función memoizada
          initialValues={{ cantidad: 0 }}
        >
          <Form.Item
            name="empresa_id"
            label="Empresa"
            rules={[{ required: true }]}
            
          >
            <Select placeholder="Selecciona empresa" disabled={!!editing}>
              {empresas.map((empresa) => (
                <Option key={empresa.id} value={empresa.id}>
                  {nombreComercialEmpresas[empresa.nombre_empresa] ||
                    empresa.nombre_empresa}
                </Option>
              ))}
            </Select >
          </Form.Item>

          <Form.Item
            name="numero_oc"
            label="N° OC"
            rules={[{ required: true }]}
          >
            <AutoComplete
              options={opcionesOC.map((item) => ({
                label: item.numero_oc,
                value: item.numero_oc,
              }))}
              onSearch={handleSearchOC} // Usa la función memoizada
              onSelect={handleSelectOC} // Usa la función memoizada
              placeholder="Escribe al menos 2 caracteres"
              className="w-full"
              disabled={!!editing}
            />
          </Form.Item>

          <Form.Item name="producto_nombre" label="Producto">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="proveedor_marca"
            label="Proveedor"
            className="hidden"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="precio_producto"
            label="Precio"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} disabled={!!editing} />
          </Form.Item>

          <Form.Item
            name="cantidad_asignada"
            label="Cantidad Asignada (KG)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="cantidad" label="Cantidad(KG)" className="hidden">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="numero_recojo" label="N° Recojo">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={modalDuplicadosVisible}
        title="Selecciona el producto correcto"
        onCancel={() => setModalDuplicadosVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          rowKey="id"
          size="small"
          dataSource={productosDuplicados}
          pagination={false}
          bordered
        >
          <Table.Column title="ID" dataIndex="id" width={70} />
          <Table.Column
            title="Nombre del producto"
            dataIndex="nombre_producto"
          />
          <Table.Column title="Proveedor" dataIndex="proveedor" />
          <Table.Column
            title="Acción"
            width={120}
            render={(text, record) => (
              <Button
                type="primary"
                size="small"
                onClick={() => handleSelectProductoDuplicado(record)} // Usa la función memoizada
              >
                Seleccionar
              </Button>
            )}
          />
        </Table>
      </Modal>

      <Modal
        open={modalProrrateoVisible}
        title="Prorrateo de Precio Detectado"
        onCancel={handleCancelProrrateo} // Usa la función memoizada
        footer={modalProrrateoFooter} // Usa el footer memoizado
      >
        <p>Se detectaron 2 órdenes en este despacho.</p>
        <p>
          <b>Nuevo precio prorrateado:</b>{' '}
          <span style={{ fontSize: '1.2em', color: '#1890ff' }}>
            {precioProrrateado} (por KG)
          </span>
        </p>
        <p>
          Este precio se calculó a partir de la combinación de los precios y
          cantidades de ambas órdenes actuales.
        </p>
      </Modal>
    </div>
  );
}

// 7. Añadir PropTypes al final del archivo
TablaOrdenesDespacho.propTypes = {
  despachoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};