// src/pages/HomePage.js
import { useState } from 'react';

const obtenerUsuario = () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData).nombre : null;
  };

const HomePage = () => {

  const [usuario, setUsuario] = useState(obtenerUsuario()); 



  return (
    <>
      <div className='p-3'>
        <div className='bg-gray-200 rounded rounded-md p-3'>
          <p className='text-xl'>Bienvenido {usuario} 👋</p>
        </div>        
      </div>
    </>
  );
};

export default HomePage;
