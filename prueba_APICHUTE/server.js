const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const ext = path.parse(pathname).ext;
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  const filePath = path.join(__dirname, pathname);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found, try to serve index.html for SPA routing
      if (pathname !== '/index.html') {
        const indexPath = path.join(__dirname, 'index.html');
        fs.readFile(indexPath, (err, content) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        });
        return;
      }
      
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    // Serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }

      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Sirviendo archivos desde: ${__dirname}`);
  console.log(`🎯 VisualFlow TOON disponible en: http://localhost:${PORT}/index.html`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Servidor deteniéndose...');
  server.close(() => {
    console.log('✅ Servidor detenido');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Servidor deteniéndose...');
  server.close(() => {
    console.log('✅ Servidor detenido');
    process.exit(0);
  });
});