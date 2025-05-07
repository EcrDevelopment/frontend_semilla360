// src/pages/NotFoundPage.js
import React from 'react';
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return <div className="flex flex-col items-center justify-center min-h-screen text-center bg-black">
  <h1 className="text-4xl text-white font-extrabold text-cyan-300">404 - Página no encontrada</h1>
  <p className="mt-2 text-lg text-white">La página que buscas no existe.</p>
  
  {/* Agregar el GIF */}
  <img 
    src="https://media.giphy.com/media/FYUnDtud95kMKCovAY/giphy.gif?cid=ecf05e4719dngibbaecj4aojbd299i8tsmq7eedftyesmhnw&ep=v1_gifs_search&rid=giphy.gif&ct=g" 
    alt="404 gif" 
    className="mt-4 max-w-xs md:max-w-md" 
  />

  <Link to="/" className="mt-6 px-6 py-2 bg-gradient-to-r from-sky-600 to-cyan-400 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-300">
    Regresar al inicio
  </Link>
</div>
};

export default NotFoundPage;
