// src/components/Despacho/FormularioDespacho.jsx
import { useEffect, useState, useMemo } from 'react'; 
import { useParams } from 'react-router-dom';
import { Spin, message, Tabs } from 'antd'; 
import SeccionGeneral from './SeccionGeneral';
import SeccionOrdenes from './SeccionOrdenes';
import TablaDetalleDespacho from './TablaDetalleDespacho';
import TablaConfiguracion from './TablaConfiguracion';
import TablaGastosExtra from './TablaGastosExtra';
import { obtenerDataDespacho } from '../../../api/Despachos';
import { LoadingOutlined } from '@ant-design/icons';
//import PropTypes from 'prop-types'; // 8. Añadido para prop-types

// 4. Se elimina 'Option' ya que 'Select' no se usa
// const { Option } = Select;

// 5. Se elimina 'resetContent' de las props porque no se usa
export default function FormularioDespacho() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  // 6. Se elimina el estado 'baseDatos' y 'setBaseDatos' porque no se usan
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 7. Se simplifica el try/catch, el .catch() de la promesa es suficiente
    obtenerDataDespacho(id)
      .then((response) => {
        // La variable 'general' que procesaba con 'moment' no se usaba,
        // así que se elimina esa lógica y solo se guarda la data.
        setData(response);
      })
      .catch((error) => {
        console.error('Error al obtener datos:', error);
        message.error(error.message || 'Error al obtener datos del despacho');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]); // El array de dependencias [id] es correcto

  // 6. Se elimina la función 'handleBaseDatosChange' porque no se usaba

  // 8. Se memoíza el array de 'items' para las Tabs
  const tabItems = useMemo(
    () => [
      {
        key: '1',
        label: 'General',
        children: <SeccionGeneral id={id} />,
      },
      {
        key: '2',
        label: 'Órdenes de compra',
        children: <SeccionOrdenes despachoId={id} />,
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
    ],
    [id],
  ); // Depende de 'id' porque se pasa como prop a los hijos

  if (loading || !data) return <Spin indicator={<LoadingOutlined spin />} fullscreen  />;

  return (
    <div className="m-2 bg-white p-4 rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Editar Flete #{id}</h2>
      <Tabs
        defaultActiveKey="1"
        className="mt-4"
        items={tabItems} // Se usa el array memoizado
      />
    </div>
  );
}

// 9. Se añade PropTypes (aunque ahora no recibe props,
// si 'resetContent' fuera necesario, se añadiría aquí)
/*
FormularioDespacho.propTypes = {
  // resetContent: PropTypes.func, // <--- Se eliminó de la firma
};
*/