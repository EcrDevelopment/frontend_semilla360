// src/components/Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import { Menu, Layout, Avatar } from "antd";
import {HomeOutlined} from "@ant-design/icons";
import { GoContainer } from "react-icons/go";
import { useAuth } from '../context/AuthContext';

// Desestructura Sider de Layout
const { Sider } = Layout;
const { permissions } = useAuth();

const Sidebar = ({ collapsed, setCollapsed }) => {
  const items = [
    { key: "1", icon: <HomeOutlined />, label: <Link to={"/"}>{"Inicio"}</Link> },
    // { key: "2", icon: <DesktopOutlined />, label: "Option 2", to: "/option2" },
    {
      key: "sub1", icon: <GoContainer />, label: "Importaciones", children: [
        { key: "3", label: <Link to={"/importaciones/lista-viajes"}>{"Listado Fletes"}</Link>, },
        { key: "4", label: <Link to={"/importaciones/calculo-fletes-ext"}>{"Fletes Extranjeros"}</Link>, },
        { key: "5", label: <Link to={"/importaciones/reporte-estiba"}>{"Reporte Estiba"}</Link>, },
        { key: "6", label: <Link to={"/importaciones/carga_docs_dua"}>{"Recepcion Docs."}</Link>, }
      ]
    },   
    
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div className="flex items-center px-2 py-6 m-auto w-full space-x-4">
        <Avatar src={"/Logo_Semilla.png"} size={60} shape="square" />        
          <div className={`flex items-center ${collapsed ? 'hidden' : 'block'}`}>
            <span className="text-5xl text-white font-extrabold text-[#F6AF33]">360°</span>
          </div>        
      </div>

      <Menu theme="dark" defaultSelectedKeys={["1"]} mode="inline" items={items}>
        
      </Menu>        
    </Sider>
  );
};

export default Sidebar;
