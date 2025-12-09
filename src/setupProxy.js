// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  
  // Proxy #1: Para TODAS las llamadas a la API (incluyendo /api/accounts/)
  app.use(
    '/api', // Captura TODO lo que empiece con /api
    createProxyMiddleware({
      target: 'http://localhost:8000/api', // Apunta al ROOT de tu backend
      changeOrigin: true,
      //ws: true, // ¡Le dice que también maneje WebSockets!
      
      // NO usamos pathRewrite.
      // El proxy enviará la ruta /api/... tal cual, 
      // y tu urls.py (que espera /api/...) la recibirá.
    })
  );


  // Proxy #2: Para WebSockets
  /*
  app.use(
    '/ws', // Captura /ws/sync-status/
    createProxyMiddleware({
      target: 'ws://localhost:8000', // Apunta al root de Daphne (usando 'ws://')
      ws: true,
      changeOrigin: true,
    })
  );
  */
};