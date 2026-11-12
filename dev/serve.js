/* Kleiner lokaler Testserver.
   /        kombi-planer.html im selben Gerüst, in das die Seite beim Veröffentlichen gesetzt wird
   /site/   die eigenständige Website aus docs/index.html */
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), port = 4173;
const head = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
http.createServer(function (req, res) {
  const url = req.url.split('?')[0];
  const send = function (file, wrap, type) {
    fs.readFile(path.join(root, file), 'utf8', function (err, txt) {
      if (err) { res.writeHead(500); res.end('Zuerst "node build.js" ausführen.'); return; }
      res.writeHead(200, { 'Content-Type': type || 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(wrap ? head + txt + '</body></html>' : txt);
    });
  };
  if (url === '/' || url === '/index.html') return send('kombi-planer.html', true);
  if (url === '/site' || url === '/site/' || url === '/site/index.html') return send('docs/index.html', false);
  if (url === '/site/robots.txt') return send('docs/robots.txt', false, 'text/plain; charset=utf-8');
  res.writeHead(404); res.end('not found');
}).listen(port, function () { console.log('http://localhost:' + port); });
