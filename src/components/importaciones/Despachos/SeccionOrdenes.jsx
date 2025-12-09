// OrdenesDespacho.jsx
import React, { useEffect, useState } from "react";
import { Table, Button, message } from "antd";
import {
  getOrdenesDespacho,
  updateOrdenDespacho,
  deleteOrdenDespacho,
} from "../../../api/OrdenCompraDespacho";
import ModalBusquedaOC from "./buscarOC";

const OrdenesDespacho = ({ despachoId }) => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrden, setEditingOrden] = useState(null);

  useEffect(() => {
    cargarOrdenes();
  }, [despachoId]);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const data = await getOrdenesDespacho(despachoId);
      setOrdenes(data);
    } catch {
      message.error("Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrden = async (orden) => {
    try {
      await updateOrdenDespacho(orden.id, despachoId, orden);
      message.success("Orden actualizada");
      cargarOrdenes(); // ← refresca los datos
      setEditingOrden(null); // ← cierra el modal
    } catch {
      message.error("Error al actualizar orden");
    }
  };


  return (
    <div>

      <Button type="primary" onClick={() => setModalVisible(true)}>
        Agregar Orden
      </Button>

      <Table
        dataSource={ordenes}
        rowKey="id"
        loading={loading}
        style={{ marginTop: "1rem" }}
        columns={[
          { title: "Orden de Compra", dataIndex: "orden_compra" },
          { title: "Cantidad", dataIndex: "cantidad_asignada" },
          { title: "Recojo", dataIndex: "numero_recojo" },
          {
            title: "Acciones",
            render: (_, record) => (
              <>
                <Button
                  onClick={() => setEditingOrden(record)}
                  style={{ marginRight: 8 }}
                >
                  Editar
                </Button>
                <Button
                  danger
                  onClick={async () => {
                    try {
                      await deleteOrdenDespacho(record.id, despachoId);
                      message.success("Relación eliminada");
                      cargarOrdenes();
                    } catch {
                      message.error("Error al eliminar");
                    }
                  }}
                >
                  Eliminar
                </Button>
              </>
            ),
          },
        ]}
      />

      {modalVisible && (
        <ModalBusquedaOC
          despachoId={despachoId}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={cargarOrdenes}
        />
      )}

      {editingOrden && (
        <ModalBusquedaOC
          despachoId={despachoId}
          visible={!!editingOrden}
          onClose={() => setEditingOrden(null)}
          onSuccess={handleUpdateOrden}
          ordenEditar={editingOrden} // 🔹 modo edición
        />
      )}
    </div>
  );
};

export default OrdenesDespacho;
