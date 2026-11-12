/* Setzt die Quelldateien aus src/ zusammen:
   - kombi-planer.html   Seite für die eingebettete Ansicht (ohne eigenes HTML-Gerüst)
   - docs/index.html     eigenständige Website zum Hochladen auf einen Webspace */
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src');
const read = function (f) { return fs.readFileSync(path.join(src, f), 'utf8'); };
const js = fs.readdirSync(src).filter(function (f) { return /^\d\d-.*\.js$/.test(f); }).sort().map(read).join('\n');
const bundle = "(function () {\n'use strict';\n" + js + '\n})();\n';
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Semi+Condensed:wght@500;600&display=swap">';
const three = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"></script>';
const css = read('style.css'), body = read('body.html');

const fragment = [
  '<title>Kombi-Planer</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  fonts, '<style>', css, '</style>', body, three, '<script>', bundle, '</script>', ''
].join('\n');
fs.writeFileSync(path.join(__dirname, 'kombi-planer.html'), fragment);

const desc = 'Kostenloser 3D-Konfigurator für Schweizer Schalter- und Steckdosen-Kombinationen: Feller EDIZIOdue, EDIZIO.liv, STANDARDdue und NEVO, Hager kallysto und robusto, ABB Sidus. Unterputz, Aufputz, NUP und NAP, Steckdosen T13 bis T25, als fotorealistisches Bild mit Stückliste.';
const icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230e63cc'/%3E%3Cpath d='M4.5 16l5.5-7h12l5.5 7-5.5 7H10z' fill='%23fff'/%3E%3Ccircle cx='12' cy='15' r='1.8' fill='%230e63cc'/%3E%3Ccircle cx='20' cy='15' r='1.8' fill='%230e63cc'/%3E%3Ccircle cx='16' cy='19.2' r='1.8' fill='%230e63cc'/%3E%3C/svg%3E";
const page = [
  '<!doctype html>',
  '<html lang="de-CH">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
  '<title>Kombi-Planer – Schweizer Schalter und Steckdosen in 3D zusammenstellen</title>',
  '<meta name="description" content="' + desc + '">',
  '<meta name="theme-color" content="#f5f6f6" media="(prefers-color-scheme: light)">',
  '<meta name="theme-color" content="#171b1e" media="(prefers-color-scheme: dark)">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Kombi-Planer">',
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="Kombi-Planer – Schweizer Schalter und Steckdosen in 3D">',
  '<meta property="og:description" content="' + desc + '">',
  '<link rel="icon" href="' + icon + '">',
  '<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>',
  fonts, '<style>', css, '</style>',
  '</head>',
  '<body>',
  body,
  '<noscript><p style="padding:16px">Der Kombi-Planer braucht JavaScript: Schalter und Steckdosen von Feller, Hager und ABB im Schweizer Raster zusammenstellen und als 3D-Bild ansehen.</p></noscript>',
  three, '<script>', bundle, '</script>',
  '</body>',
  '</html>', ''
].join('\n');
fs.mkdirSync(path.join(__dirname, 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'docs', 'index.html'), page);
fs.writeFileSync(path.join(__dirname, 'docs', 'robots.txt'), 'User-agent: *\nAllow: /\n');
fs.writeFileSync(path.join(__dirname, 'docs', '.nojekyll'), '');
fs.mkdirSync(path.join(__dirname, 'dev'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dev', 'bundle.js'), bundle);
console.log('kombi-planer.html', (fragment.length / 1024).toFixed(1) + ' kB · docs/index.html', (page.length / 1024).toFixed(1) + ' kB');
