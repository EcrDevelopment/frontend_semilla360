import { useState } from "react";
import { Table, Button, Modal} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { red } from "@ant-design/colors";


const ListaMovimientos = () => {
    const navigate = useNavigate();
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(false);
       

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Tipo',  
            dataIndex: 'tipo',
            key: 'tipo',
        },
        {
            title: 'Cantidad',
            dataIndex: 'cantidad',
            key: 'cantidad',
        },
        {
            title: 'Fecha',
            dataIndex: 'fecha', 
            key: 'fecha',
        }
        ]
    
    const redirectToRegistro = () => {
        navigate('/almacen/registrar-movimientos');
    }

    


    return (
        <>
            <div className="w-full h-full p-4 bg-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold m-3">Movimientos</h2>
                    <Button 
                    color="primary" 
                    variant="solid" 
                    loading={loading} 
                    icon={<PlusOutlined />}
                    onClick={redirectToRegistro}>
                    Agregar
                    </Button>
                </div>
                
                <Table
                    columns={columns}
                    //rowKey="id"
                    //dataSource={data}
                    //pagination={tableParams.pagination}
                    loading={loading}
                    //onChange={handleTableChange}
                    //expandable={{ expandedRowRender }}
                    size="small"
                />               


            </div>
        </>
    );
}

export default ListaMovimientos;