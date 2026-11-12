/* ================================================================
   04 · Bühne: Materialien, Wand, Licht und progressive Bildberechnung
   Das Bild wird über viele Einzelbilder gemittelt: jedes mit leicht
   versetzter Lichtquelle und Kamera. So entstehen weiche Schatten,
   Umgebungsverschattung und saubere Kanten wie auf einem Foto.
   ================================================================ */

function halton(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
/* kachelbares Werterauschen, Zellgrösse cx × cy Pixel */
function vnoise(S, cx, cy, rnd) {
  const nx = Math.max(1, Math.round(S / cx)), ny = Math.max(1, Math.round(S / cy)), g = new Float32Array(nx * ny), out = new Float32Array(S * S);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  for (let y = 0; y < S; y++) {
    const fy = y / S * ny, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), ya = (y0 % ny) * nx, yb = ((y0 + 1) % ny) * nx;
    for (let x = 0; x < S; x++) {
      const fx = x / S * nx, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % nx, xb = (x0 + 1) % nx;
      const a = g[ya + xa], b = g[ya + xb], c = g[yb + xa], d = g[yb + xb];
      out[y * S + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  }
  return out;
}
function canvasOf(S) { const cv = document.createElement('canvas'); cv.width = cv.height = S; return cv; }
function repeatTex(cv, srgb) {
  const t = new T.CanvasTexture(cv);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  return t;
}
function heightToNormal(h, S, k) {
  const cv = canvasOf(S), ctx = cv.getContext('2d'), im = ctx.createImageData(S, S), d = im.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const l = h[y * S + (x + S - 1) % S], r = h[y * S + (x + 1) % S], u = h[((y + S - 1) % S) * S + x], dn = h[((y + 1) % S) * S + x];
    const nx = (l - r) * k, ny = (dn - u) * k, il = 1 / Math.hypot(nx, ny, 1), i = (y * S + x) * 4;
    d[i] = (nx * il * 0.5 + 0.5) * 255; d[i + 1] = (ny * il * 0.5 + 0.5) * 255; d[i + 2] = (il * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  return repeatTex(cv, false);
}
function grayTex(h, S) {
  const cv = canvasOf(S), ctx = cv.getContext('2d'), im = ctx.createImageData(S, S), d = im.data;
  for (let i = 0; i < S * S; i++) { const v = Math.max(0, Math.min(255, h[i] * 255)); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  ctx.putImageData(im, 0, 0);
  return repeatTex(cv, false);
}

/* ---------- Wandoberflächen ---------- */
const WALLS = [['abrieb', 'Abrieb 1 mm'], ['glatt', 'Glattputz'], ['beton', 'Sichtbeton'], ['holz', 'Eichentäfer']];
const PAINTS = [['#f2f0ea', 'Weiss'], ['#e2dccf', 'Greige'], ['#c8d1c3', 'Salbei'], ['#b7c5d1', 'Taubenblau'], ['#d8b8a0', 'Terrakotta hell'], ['#4b4e51', 'Anthrazit'], ['#2f3a46', 'Nachtblau']];
const LIGHTS = [['tag', 'Tageslicht'], ['abend', 'Abendlicht'], ['studio', 'Studio']];
const LIGHT_SET = {
  tag: { key: [-0.5, 0.62, 0.84], keyCol: '#fff5e8', keyI: 2.3, domeCol: '#edf3ff', domeI: 1.25, env: 1.0, soft: 0.1, exposure: 1.18 },
  abend: { key: [0.66, 0.3, 0.8], keyCol: '#ffd6a6', keyI: 1.9, domeCol: '#ffead6', domeI: 0.95, env: 0.5, soft: 0.2, exposure: 1.15 },
  studio: { key: [-0.22, 0.5, 1.0], keyCol: '#ffffff', keyI: 1.3, domeCol: '#ffffff', domeI: 2.1, env: 1.1, soft: 0.34, exposure: 1.1 }
};
const WALL_CACHE = {};
function wallSpec(kind) {
  if (WALL_CACHE[kind]) return WALL_CACHE[kind];
  const r = mulberry(kind.length * 977 + kind.charCodeAt(0) * 13);
  let o;
  if (kind === 'abrieb') {
    const S = 512, a = vnoise(S, 4, 4, r), b = vnoise(S, 2, 2, r), c = vnoise(S, 8, 8, r), d = vnoise(S, 64, 64, r), h = new Float32Array(S * S);
    for (let i = 0; i < h.length; i++) { const v = 0.5 * a[i] + 0.25 * b[i] + 0.35 * c[i]; h[i] = v * v + d[i] * 0.12; }
    o = { normalMap: heightToNormal(h, S, 1.5), nScale: 0.6, tile: 125, rough: 0.94, paint: true };
  } else if (kind === 'glatt') {
    const S = 512, a = vnoise(S, 128, 128, r), b = vnoise(S, 8, 8, r), c = vnoise(S, 2, 2, r), h = new Float32Array(S * S);
    for (let i = 0; i < h.length; i++) h[i] = a[i] * 1.6 + b[i] * 0.1 + c[i] * 0.045;
    o = { normalMap: heightToNormal(h, S, 1.4), nScale: 0.4, tile: 300, rough: 0.86, paint: true };
  } else if (kind === 'beton') {
    const S = 1024, a = vnoise(S, 256, 256, r), b = vnoise(S, 64, 64, r), c = vnoise(S, 16, 16, r), d = vnoise(S, 2, 2, r);
    const al = new Float32Array(S * S), h = new Float32Array(S * S);
    for (let i = 0; i < al.length; i++) { al[i] = 0.62 + 0.17 * (a[i] - 0.5) + 0.1 * (b[i] - 0.5) + 0.05 * (c[i] - 0.5) + 0.035 * (d[i] - 0.5); h[i] = d[i] * 0.05 + c[i] * 0.03; }
    for (let k = 0; k < 760; k++) {
      const px = r() * S, py = r() * S, pr = 0.5 + r() * r() * 1.9, dep = 0.35 + r() * 0.4, R = Math.ceil(pr);
      for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
        if (x * x + y * y > pr * pr) continue;
        const i = (((py + y) | 0) + S) % S * S + (((px + x) | 0) + S) % S;
        al[i] *= 0.62; h[i] -= dep;
      }
    }
    const cv = canvasOf(S), ctx = cv.getContext('2d'), im = ctx.createImageData(S, S), dd = im.data;
    for (let i = 0; i < al.length; i++) { const v = Math.max(0, Math.min(1, al[i])) * 255; dd[i * 4] = v; dd[i * 4 + 1] = v * 0.992; dd[i * 4 + 2] = v * 0.965; dd[i * 4 + 3] = 255; }
    ctx.putImageData(im, 0, 0);
    o = { map: repeatTex(cv, true), normalMap: heightToNormal(h, S, 1.6), nScale: 0.7, tile: 950, rough: 0.78, paint: false };
  } else {
    const S = 1024, PW = 128, warp = vnoise(S, 64, 256, r), fine = vnoise(S, 2, 96, r), tone = vnoise(S, 16, 512, r);
    const ph = [], tn = [], h = new Float32Array(S * S);
    for (let p = 0; p < S / PW; p++) { ph.push(r() * 10); tn.push(0.9 + r() * 0.18); }
    const cv = canvasOf(S), ctx = cv.getContext('2d'), im = ctx.createImageData(S, S), dd = im.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = y * S + x, p = Math.floor(x / PW), xl = x - p * PW;
      const t = xl * 0.035 + ph[p] + 3.4 * warp[(y * S + ((x + p * 37) % S))];
      let g = 0.5 + 0.5 * Math.sin(t * 2 * PI * 1.7);
      g = 0.55 * g * g + 0.3 * fine[i] + 0.15 * tone[i];
      let k = tn[p] * (1 - 0.34 * g);
      const joint = xl < 1.6 || xl > PW - 1.6;
      if (joint) k *= 0.42;
      dd[i * 4] = Math.min(255, 214 * k); dd[i * 4 + 1] = Math.min(255, 172 * k); dd[i * 4 + 2] = Math.min(255, 120 * k); dd[i * 4 + 3] = 255;
      h[i] = (joint ? -1.6 : 0) + g * 0.16 + fine[i] * 0.1;
    }
    ctx.putImageData(im, 0, 0);
    o = { map: repeatTex(cv, true), normalMap: heightToNormal(h, S, 1.8), nScale: 0.7, tile: 960, rough: 0.56, paint: false };
  }
  return WALL_CACHE[kind] = o;
}

/* ---------- Materialien ---------- */
const MAT = {};
let ENV_K = 1;
function setEnv(m, k) { m.userData.env = k; m.envMapIntensity = k * ENV_K; return m; }
function lum(hex) { const c = new T.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }
function plastic(hex, finish) {
  const id = 'p|' + hex + '|' + finish;
  if (MAT[id]) return MAT[id];
  let m;
  if (finish === 'metallic') m = new T.MeshPhysicalMaterial({ color: hex, roughness: 0.38, metalness: 0.75, clearcoat: 0.3, clearcoatRoughness: 0.2 });
  else {
    const f = finish === 'lacquer' ? [0.14, 1, 0.04] : finish === 'gloss' ? [0.24, 0.6, 0.08] : finish === 'matte' ? [0.6, 0, 0] : [0.4, 0.25, 0.25];
    m = new T.MeshPhysicalMaterial({ color: hex, roughness: f[0], metalness: 0, clearcoat: f[1], clearcoatRoughness: f[2] });
  }
  return MAT[id] = setEnv(m, 1);
}
let _bump = {};
function bumpTex(kind) {
  if (_bump[kind]) return _bump[kind];
  const S = 256, r = mulberry(kind === 'slate' ? 71 : 29), h = new Float32Array(S * S);
  if (kind === 'slate') {
    const a = vnoise(S, 32, 32, r), b = vnoise(S, 8, 8, r), c = vnoise(S, 2, 2, r);
    for (let i = 0; i < h.length; i++) h[i] = 0.55 * a[i] + 0.3 * b[i] + 0.15 * c[i];
  } else {
    const a = vnoise(S, 128, 1, r), b = vnoise(S, 32, 2, r);
    for (let i = 0; i < h.length; i++) h[i] = 0.6 * a[i] + 0.4 * b[i];
  }
  return _bump[kind] = grayTex(h, S);
}
function frameMat(fc, finish) {
  if (!fc.mat) return plastic(fc.hex, fc.finish || finish);
  const id = 'f|' + fc.id;
  if (MAT[id]) return MAT[id];
  let m;
  if (fc.mat === 'glass') m = new T.MeshPhysicalMaterial({ color: fc.hex, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02 });
  else if (fc.mat === 'slate') m = new T.MeshStandardMaterial({ color: fc.hex, roughness: 0.82, metalness: 0, bumpMap: bumpTex('slate'), bumpScale: 1.2 });
  else {
    const P = { steel: [0.34, 0.5], alu: [0.46, 0.35], brass: [0.3, 0.45] }[fc.mat];
    m = new T.MeshStandardMaterial({ color: fc.hex, roughness: P[0], metalness: 1, bumpMap: bumpTex('brush'), bumpScale: P[1] });
  }
  return MAT[id] = setEnv(m, 1);
}
/* Kragen-Innenseiten: etwas Eigenhelligkeit ersetzt das Licht, das im Kragen hin und her geworfen wird */
function wellOf(body) {
  const id = 'w|' + body.uuid;
  if (MAT[id]) return MAT[id];
  const m = body.clone();
  m.emissive = body.color.clone(); m.emissiveIntensity = 0.1;
  return MAT[id] = setEnv(m, 1);
}
function staticMat(name) {
  if (MAT[name]) return MAT[name];
  let m;
  switch (name) {
    case 'dark': m = setEnv(new T.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 }), 0.2); break;
    case 'slot': m = setEnv(new T.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 0.2); break;
    case 'metal': m = setEnv(new T.MeshStandardMaterial({ color: 0xc9cdd1, roughness: 0.3, metalness: 1 }), 1.2); break;
    case 'gold': m = setEnv(new T.MeshStandardMaterial({ color: 0xd9b45a, roughness: 0.28, metalness: 1 }), 1.2); break;
    case 'ivory': m = plastic('#e8e5dc', 'satin'); break;
    case 'key2d': m = plastic('#34373b', 'satin'); break;
    case 'key2l': m = plastic('#5b6065', 'satin'); break;
    case 'gasket': m = setEnv(new T.MeshStandardMaterial({ color: 0xc42a22, roughness: 0.7 }), 0.6); break;
    case 'lidclear': m = setEnv(new T.MeshPhysicalMaterial({ color: 0xe6edf1, transparent: true, opacity: 0.3, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false }), 1.3); break;
    case 'jack': m = plastic('#26282b', 'satin'); break;
    case 'glass': m = setEnv(new T.MeshPhysicalMaterial({ color: 0x07090b, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 }), 1); break;
    case 'lens': m = setEnv(new T.MeshPhysicalMaterial({ color: 0xeef0ed, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.3 }), 1); break;
    case 'glow': m = setEnv(new T.MeshStandardMaterial({ color: 0xfff6e6, emissive: 0xffdcae, emissiveIntensity: 1.5, roughness: 0.4 }), 0.6); break;
    case 'lensR': m = setEnv(new T.MeshPhysicalMaterial({ color: 0x8a0d10, emissive: 0xff2a1e, emissiveIntensity: 1.3, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35 }), 1); break;
    case 'lensG': m = setEnv(new T.MeshPhysicalMaterial({ color: 0x0c5a2a, emissive: 0x0a6a2c, emissiveIntensity: 0.25, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35 }), 1); break;
    default:
      if (name.indexOf('led:') === 0) {
        const k = name.slice(4), c = { orange: 0xff7a1c, red: 0xff2a1e, white: 0xf3f6ff, green: 0x35e06a }[k];
        m = setEnv(new T.MeshStandardMaterial({ color: c === undefined ? 0x3a0d0d : 0x202020, emissive: c === undefined ? 0x000000 : c, emissiveIntensity: c === undefined ? 0 : 2.4, roughness: 0.3 }), 0.8);
      } else m = plastic('#888888', 'satin');
  }
  return MAT[name] = m;
}

/* ---------- Symbol-Atlas für Aufdrucke ---------- */
function makeAtlas() {
  const N = 128, COLS = 8, ROWS = 4, cv = document.createElement('canvas');
  cv.width = N * COLS; cv.height = N * ROWS;
  const c = cv.getContext('2d');
  c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineCap = 'round'; c.lineJoin = 'round'; c.textAlign = 'center'; c.textBaseline = 'middle';
  let slot = 0;
  const cell = function (name, span, draw) {
    const cx = slot % COLS, cy = Math.floor(slot / COLS), px = 3 / cv.width, py = 3 / cv.height;
    c.save(); c.translate(cx * N, cy * N); draw(N * span, N); c.restore();
    SYMUV[name] = [cx / COLS + px, 1 - (cy + 1) / ROWS + py, (cx + span) / COLS - px, 1 - cy / ROWS - py];
    slot += span;
  };
  const text = function (s, size) { return function (w, h) { c.font = '600 ' + size + 'px "Barlow Semi Condensed", "Arial Narrow", Arial, sans-serif'; c.fillText(s, w / 2, h / 2 + size * 0.04); }; };
  cell('solid', 1, function (w, h) { c.fillRect(0, 0, w, h); });
  cell('up', 1, function () { c.beginPath(); c.moveTo(64, 30); c.lineTo(106, 96); c.lineTo(22, 96); c.closePath(); c.fill(); });
  cell('down', 1, function () { c.beginPath(); c.moveTo(64, 98); c.lineTo(106, 32); c.lineTo(22, 32); c.closePath(); c.fill(); });
  cell('light', 1, function () {
    c.lineWidth = 8; c.beginPath(); c.arc(64, 54, 25, 0, 2 * PI); c.stroke();
    c.fillRect(51, 86, 26, 7); c.fillRect(54, 98, 20, 7);
    c.lineWidth = 6; c.beginPath(); c.moveTo(56, 62); c.lineTo(64, 50); c.lineTo(72, 62); c.stroke();
  });
  cell('bell', 1, function () {
    c.beginPath(); c.moveTo(24, 92); c.quadraticCurveTo(38, 84, 38, 62); c.bezierCurveTo(38, 26, 90, 26, 90, 62); c.quadraticCurveTo(90, 84, 104, 92); c.closePath(); c.fill();
    c.beginPath(); c.arc(64, 102, 9, 0, 2 * PI); c.fill(); c.beginPath(); c.arc(64, 27, 6, 0, 2 * PI); c.fill();
  });
  cell('key', 1, function () {
    c.lineWidth = 11; c.beginPath(); c.arc(38, 64, 18, 0, 2 * PI); c.stroke();
    c.fillRect(56, 58, 54, 12); c.fillRect(86, 68, 9, 16); c.fillRect(100, 68, 9, 11);
  });
  cell('plus', 1, function () { c.fillRect(22, 56, 84, 16); c.fillRect(56, 22, 16, 84); });
  cell('minus', 1, function () { c.fillRect(22, 56, 84, 16); });
  cell('d0', 1, text('0', 100)); cell('d1', 1, text('1', 100)); cell('d2', 1, text('2', 100)); cell('d3', 1, text('3', 100));
  cell('R', 1, text('R', 100)); cell('TV', 1, text('TV', 86)); cell('SAT', 2, text('SAT', 92));
  cell('temp', 2, text('21.5°', 92)); cell('time', 2, text('07:30', 92));
  const t = new T.CanvasTexture(cv);
  t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/* ---------- Umgebung für Spiegelungen ---------- */
function makeEnv(renderer) {
  const s = new T.Scene();
  const add = function (w, h, hex, k, x, y, z) {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(k), side: T.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  s.add(new T.Mesh(new T.BoxGeometry(60, 60, 60), new T.MeshBasicMaterial({ color: new T.Color(0.4, 0.42, 0.45), side: T.BackSide })));
  add(60, 60, '#ffffff', 1.2, 0, 29.5, 0);
  add(60, 60, '#9a8c7a', 0.5, 0, -29.5, 0);
  add(22, 26, '#f4f8ff', 10, -27, 8, 16);
  add(16, 18, '#fff1dc', 2.4, 26, 2, 18);
  add(40, 10, '#ffffff', 3.2, 0, 26, 22);
  const pm = new T.PMREMGenerator(renderer), tex = pm.fromScene(s, 0.03).texture;
  pm.dispose();
  s.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return tex;
}

/* ---------- Shader-Anpassungen ---------- */
const NEUTRAL_GLSL = [
  'vec3 kNeutral( vec3 color ) {',
  '  const float startCompression = 0.76;',
  '  const float desaturation = 0.15;',
  '  float x = min( color.r, min( color.g, color.b ) );',
  '  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;',
  '  color -= offset;',
  '  float peak = max( color.r, max( color.g, color.b ) );',
  '  if ( peak < startCompression ) return color;',
  '  float d = 1.0 - startCompression;',
  '  float newPeak = 1.0 - d * d / ( peak + d - startCompression );',
  '  color *= newPeak / peak;',
  '  float g = 1.0 - 1.0 / ( desaturation * ( peak - newPeak ) + 1.0 );',
  '  return mix( color, vec3( newPeak ), g );',
  '}'].join('\n');
let PATCHED = false, HAS_NEUTRAL = false;
function patchShaders() {
  if (PATCHED) return; PATCHED = true;
  const SC = T.ShaderChunk;
  try {
    /* diffuses Umgebungslicht dämpfen: die Verschattung kommt aus dem gemittelten Himmelslicht */
    SC.lights_fragment_maps = SC.lights_fragment_maps.replace(/iblIrradiance \+= getIBLIrradiance\( ([\w.]+) \);/, 'iblIrradiance += getIBLIrradiance( $1 ) * 0.22;');
    const before = SC.tonemapping_pars_fragment;
    SC.tonemapping_pars_fragment = before.replace(/vec3 CustomToneMapping\( vec3 color \) \{ return color; \}/,
      NEUTRAL_GLSL + '\nvec3 CustomToneMapping( vec3 color ) { return kNeutral( color * toneMappingExposure ); }');
    HAS_NEUTRAL = SC.tonemapping_pars_fragment !== before;
  } catch (e) { /* Standard-Shader bleiben aktiv */ }
}

/* ================================================================ */
function createStage(stageEl, canvas, svg, hooks) {
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  if (!renderer || !renderer.getContext()) return null;
  patchShaders();
  const caps = renderer.capabilities, ext = renderer.extensions;
  const canAcc = !!caps.isWebGL2 && (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'));
  const ACC_MAX = canAcc ? 80 : 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = HAS_NEUTRAL ? T.CustomToneMapping : T.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  const atlas = makeAtlas(), envTex = makeEnv(renderer);
  const inkOpt = { map: atlas, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 };
  MAT['ink:d'] = setEnv(new T.MeshStandardMaterial(Object.assign({ color: 0x6f757a }, inkOpt)), 0.5);
  MAT['ink:l'] = setEnv(new T.MeshStandardMaterial(Object.assign({ color: 0xd4d8db }, inkOpt)), 0.5);
  MAT.lcd = new T.MeshBasicMaterial({ map: atlas, color: 0x9fdcf5, transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });

  /* Szene */
  const scene = new T.Scene(); scene.environment = envTex;
  const WALL_W = 5200, WALL_H = 3800;
  const wallMat = MAT.wall = setEnv(new T.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.92 }), 1);
  const wall = new T.Mesh(new T.PlaneGeometry(WALL_W, WALL_H), wallMat);
  /* Wand mit Ausschnitt für den Einlasskasten, damit die Kragen der Steckdosen in die Wand reichen */
  function wallGeo(holes) { const gb = new GB(null); gb.cap(cRRect(WALL_W, WALL_H, 0), holes.map(function (o) { return cXf(cRRect(o.w, o.h, 0), o.x, 0, 0); }), 0, 1); return gb.geometry(); }
  wall.receiveShadow = true; scene.add(wall);
  const key = new T.DirectionalLight(0xffffff, 2), dome = new T.DirectionalLight(0xffffff, 1.5);
  [key, dome].forEach(function (l, i) {
    l.castShadow = true; l.shadow.mapSize.set(i ? 1024 : 2048, i ? 1024 : 2048);
    l.shadow.bias = -0.00025; l.shadow.normalBias = 0.1;
    scene.add(l); scene.add(l.target);
  });
  const group = new T.Group(); scene.add(group);
  const camera = new T.PerspectiveCamera(24, 1, 30, 9000);

  /* Zwischenspeicher für die Mittelung */
  let rtScene = null, rtA = null, rtB = null, accMat = null, dispMat = null, fsScene = null, fsCam = null, fsMesh = null;
  if (canAcc) {
    const o = { type: T.HalfFloatType, format: T.RGBAFormat, minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: false };
    rtScene = new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, format: T.RGBAFormat, minFilter: T.NearestFilter, magFilter: T.NearestFilter, samples: 4, depthBuffer: true });
    rtA = new T.WebGLRenderTarget(4, 4, o); rtB = new T.WebGLRenderTarget(4, 4, o);
    const vs = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }';
    accMat = new T.ShaderMaterial({
      uniforms: { tNew: { value: null }, tAcc: { value: null }, w: { value: 1 } }, vertexShader: vs, depthTest: false, depthWrite: false, toneMapped: false,
      fragmentShader: 'uniform sampler2D tNew; uniform sampler2D tAcc; uniform float w; varying vec2 vUv; void main() { gl_FragColor = mix( texture2D( tAcc, vUv ), min( texture2D( tNew, vUv ), vec4( 2.4 ) ), w ); }'
    });
    dispMat = new T.ShaderMaterial({
      uniforms: { tAcc: { value: null }, exposure: { value: 1 }, vig: { value: 0.34 } }, vertexShader: vs, depthTest: false, depthWrite: false, toneMapped: false,
      fragmentShader: NEUTRAL_GLSL + '\nuniform sampler2D tAcc; uniform float exposure; uniform float vig; varying vec2 vUv;\n' +
        'float hash( vec2 p ) { return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }\n' +
        'void main() { vec3 c = texture2D( tAcc, vUv ).rgb * exposure; vec2 q = vUv - 0.5; c *= 1.0 - vig * dot( q, q );\n' +
        '  c = kNeutral( max( c, vec3( 0.0 ) ) ); c = clamp( c, 0.0, 1.0 );\n' +
        '  c = mix( c * 12.92, 1.055 * pow( c, vec3( 1.0 / 2.4 ) ) - 0.055, step( vec3( 0.0031308 ), c ) );\n' +
        '  c += ( hash( gl_FragCoord.xy ) - 0.5 ) / 255.0; gl_FragColor = vec4( c, 1.0 ); }'
    });
    fsCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    fsMesh = new T.Mesh(new T.PlaneGeometry(2, 2), accMat); fsMesh.frustumCulled = false;
    fsScene = new T.Scene(); fsScene.add(fsMesh);
  }

  /* Zustand */
  const LD = 700, tgt = new T.Vector3(0, 0, 4), tmp = new T.Vector3();
  const keyDir = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3(), skyDir = new T.Vector3(-0.3, 0.75, 0.6).normalize();
  let light = LIGHT_SET.tag, domeMean = 0.5;
  let dims = { W: 88, H: 88, top: 9, pitch: PITCH }, layout = [], total = 1, layoutKey = '';
  let vw = 300, vh = 200, bufW = 300, bufH = 200;
  let az = -0.36, el = 0.13, zoom = 1, fitDist = 600;
  let frame = 0, pending = false, sel = -1, hov = -1, exportRT = null;
  (function () {
    let s = 0;
    for (let f = 1; f <= 512; f++) {
      const z = 0.08 + 0.92 * halton(f, 5), ph = 2 * PI * halton(f, 7), sn = Math.sqrt(1 - z * z);
      s += z * (0.6 + 0.8 * Math.max(0, sn * Math.cos(ph) * skyDir.x + sn * Math.sin(ph) * skyDir.y + z * skyDir.z));
    }
    domeMean = s / 512;
  })();

  function resolver(c) {
    const body = plastic(c.ic.hex, c.ic.finish || c.L.finish), fr = frameMat(c.fc, c.L.finish), light = lum(c.ic.hex) > 0.25;
    const ink = light ? MAT['ink:d'] : MAT['ink:l'];
    return function (name) {
      return name === 'body' ? body : name === 'well' ? wellOf(body) : name === 'frame' ? fr : name === 'ink' ? ink : name === 'inkKey' ? MAT['ink:l']
        : name === 'key2' ? staticMat(light ? 'key2d' : 'key2l') : name === 'lcd' ? MAT.lcd : staticMat(name);
    };
  }
  function addMeshes(parent, kit, res) {
    for (const name in kit.g) {
      const gb = kit.g[name];
      if (gb.empty) continue;
      const mesh = new T.Mesh(gb.geometry(), res(name)), flat = name === 'ink' || name === 'inkKey' || name === 'lcd' || name === 'slot', clear = name === 'lidclear';
      mesh.castShadow = !flat && !clear; mesh.receiveShadow = name !== 'lcd';
      if (flat) mesh.renderOrder = 2;
      if (clear) mesh.renderOrder = 3;
      parent.add(mesh);
    }
  }
  function clearGroup(g) { g.children.slice().forEach(function (m) { g.remove(m); m.geometry.dispose(); }); }

  /* Kamera */
  function computeFit() {
    const th = Math.tan(camera.fov * PI / 360);
    const mw = dims.W * 0.62 + 36, mh = dims.H * 0.62 + 36;
    fitDist = Math.max(mh / th, mw / (th * camera.aspect));
  }
  function applyCam() {
    const d = fitDist * zoom, ce = Math.cos(el);
    camera.clearViewOffset();
    camera.position.set(tgt.x + d * Math.sin(az) * ce, tgt.y + d * Math.sin(el), tgt.z + d * Math.cos(az) * ce);
    camera.lookAt(tgt); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    drawOverlay();
  }
  function fitShadow() {
    const e = Math.hypot(dims.W, dims.H) / 2 + 28;
    [key, dome].forEach(function (l) {
      const c = l.shadow.camera;
      c.left = -e; c.right = e; c.top = e; c.bottom = -e; c.near = LD - e - 30; c.far = LD + e + 30;
      c.updateProjectionMatrix(); l.target.position.set(0, 0, 0); l.target.updateMatrixWorld();
    });
  }

  /* Auswahlrahmen als SVG über dem Bild */
  const ovSel = svg.querySelector('#ovSel'), ovHov = svg.querySelector('#ovHover');
  function proj(x, y, z) { tmp.set(x, y, z).project(camera); return ((tmp.x * 0.5 + 0.5) * vw).toFixed(1) + ',' + ((-tmp.y * 0.5 + 0.5) * vh).toFixed(1); }
  /* Mitte und halbe Kantenlänge eines Feldes; die Felder zählen über alle Rahmen der Reihe */
  function slotCell(i) {
    const P = dims.pitch || PITCH;
    for (let k = 0; k < layout.length; k++) {
      const f = layout[k], j = i - f.base;
      if (j >= 0 && j < f.cols * f.rows) { const c = j % f.cols, r = Math.floor(j / f.cols); return { x: f.cx + (c - (f.cols - 1) / 2) * P, y: ((f.rows - 1) / 2 - r) * P, h: P / 2 - 1 }; }
    }
    return null;
  }
  function slotPoly(i) {
    const s = slotCell(i);
    if (!s) return '';
    const x = s.x, y = s.y, h = s.h, z = dims.top + 0.6;
    return [proj(x - h, y - h, z), proj(x + h, y - h, z), proj(x + h, y + h, z), proj(x - h, y + h, z)].join(' ');
  }
  let over = false, idleT = 0;
  function wake(ms) {
    svg.classList.remove('idle'); clearTimeout(idleT);
    if (ms) idleT = setTimeout(function () { svg.classList.add('idle'); }, ms);
  }
  function drawOverlay() {
    if (sel >= 0 && sel < total) { ovSel.setAttribute('points', slotPoly(sel)); ovSel.style.display = ''; } else ovSel.style.display = 'none';
    if (hov >= 0 && hov < total && hov !== sel) { ovHov.setAttribute('points', slotPoly(hov)); ovHov.style.display = ''; } else ovHov.style.display = 'none';
  }
  function slotAt(e) {
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width * 2 - 1, ny = -((e.clientY - r.top) / r.height * 2 - 1);
    const o = camera.position, p = new T.Vector3(nx, ny, 0.5).unproject(camera).sub(o), t = (dims.top - o.z) / p.z;
    if (!(t > 0)) return -1;
    const P = dims.pitch || PITCH, X = o.x + p.x * t, Y = o.y + p.y * t;
    for (let k = 0; k < layout.length; k++) {
      const f = layout[k], c = Math.floor((X - f.cx) / P + f.cols / 2), rr = Math.floor(f.rows / 2 - Y / P);
      if (c >= 0 && c < f.cols && rr >= 0 && rr < f.rows) return f.base + rr * f.cols + c;
    }
    return -1;
  }

  /* Bildberechnung */
  function present() {
    if (!canAcc) return;
    fsMesh.material = dispMat; dispMat.uniforms.tAcc.value = rtA.texture;
    renderer.setRenderTarget(null); renderer.render(fsScene, fsCam);
  }
  function renderFrame() {
    const f = frame;
    if (f === 0) {
      key.position.copy(keyDir).multiplyScalar(LD);
      tmp.set(0.12, 0.28, 1).normalize(); dome.position.copy(tmp).multiplyScalar(LD);
      dome.intensity = light.domeI * domeMean / tmp.z;
      camera.clearViewOffset();
    } else {
      const rr = Math.sqrt(halton(f, 2)) * light.soft, an = 2 * PI * halton(f, 3);
      tmp.copy(keyDir).addScaledVector(e1, rr * Math.cos(an)).addScaledVector(e2, rr * Math.sin(an)).normalize();
      key.position.copy(tmp).multiplyScalar(LD);
      const z = 0.08 + 0.92 * halton(f, 5), ph = 2 * PI * halton(f, 7), sn = Math.sqrt(1 - z * z);
      tmp.set(sn * Math.cos(ph), sn * Math.sin(ph), z);
      dome.intensity = light.domeI * (0.6 + 0.8 * Math.max(0, tmp.dot(skyDir)));
      dome.position.copy(tmp).multiplyScalar(LD);
      camera.setViewOffset(bufW, bufH, halton(f, 11) - 0.5, halton(f, 13) - 0.5, bufW, bufH);
    }
    if (!canAcc) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
    const target = exportRT || rtScene;
    renderer.setRenderTarget(target); renderer.render(scene, camera);
    camera.clearViewOffset();
    fsMesh.material = accMat;
    accMat.uniforms.tNew.value = target.texture; accMat.uniforms.tAcc.value = rtA.texture; accMat.uniforms.w.value = 1 / (f + 1);
    renderer.setRenderTarget(rtB); renderer.render(fsScene, fsCam);
    const s = rtA; rtA = rtB; rtB = s;
  }
  let perTick = 1, lastTick = 0;
  function tick() {
    if (frame >= ACC_MAX) return;
    const now = performance.now(), dt = now - lastTick;
    lastTick = now;
    if (frame === 0) perTick = 1; else if (dt < 22) perTick = Math.min(4, perTick + 1); else if (dt > 40) perTick = Math.max(1, perTick - 1);
    for (let k = 0; k < perTick && frame < ACC_MAX; k++) { renderFrame(); frame++; }
    present();
    if (hooks.onProgress) hooks.onProgress(frame / ACC_MAX);
    if (frame < ACC_MAX) kick();
  }
  function kick() {
    if (pending) return;
    pending = true;
    let done = false;
    const run = function () { if (done) return; done = true; pending = false; tick(); };
    requestAnimationFrame(run); setTimeout(run, 140);
  }
  function reset() { frame = 0; kick(); }

  function size() {
    const w = Math.max(60, stageEl.clientWidth), h = Math.max(60, stageEl.clientHeight);
    let pr = Math.min(window.devicePixelRatio || 1, 2);
    const budget = 2.3e6;
    if (w * h * pr * pr > budget) pr = Math.sqrt(budget / (w * h));
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    vw = w; vh = h; bufW = canvas.width; bufH = canvas.height;
    if (canAcc) { rtScene.setSize(bufW, bufH); rtA.setSize(bufW, bufH); rtB.setSize(bufW, bufH); }
    camera.aspect = w / h; camera.updateProjectionMatrix();
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    computeFit(); applyCam(); reset();
  }

  /* Bedienung: ziehen = drehen, Rad/Pinch = zoomen, Klick = Feld wählen */
  const ptrs = new Map();
  let drag = null, pinch = null, anim = 0;
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const pdist = function () { const a = Array.from(ptrs.values()); return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
  canvas.addEventListener('pointerdown', function (e) {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ohne Capture weiter */ }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    cancelAnimationFrame(anim);
    if (ptrs.size === 1) { drag = { x: e.clientX, y: e.clientY, az: az, el: el, moved: 0 }; pinch = null; }
    else if (ptrs.size === 2) { pinch = { d: pdist(), zoom: zoom }; drag = null; }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag && ptrs.size === 1) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
      if (drag.moved > 4) {
        az = clamp(drag.az - dx * 0.006, -1.2, 1.2); el = clamp(drag.el + dy * 0.006, -0.75, 0.85);
        applyCam(); reset();
      }
    } else if (pinch && ptrs.size === 2) {
      zoom = clamp(pinch.zoom * pinch.d / pdist(), 0.3, 2.4); applyCam(); reset();
    } else if (!ptrs.size && e.pointerType === 'mouse') {
      const h = slotAt(e);
      if (h !== hov) { hov = h; drawOverlay(); canvas.style.cursor = h >= 0 ? 'pointer' : 'grab'; }
    }
  });
  const up = function (e) {
    const had = ptrs.has(e.pointerId);
    ptrs.delete(e.pointerId);
    if (had && drag && drag.moved <= 4 && e.type === 'pointerup') { const s = slotAt(e); if (s >= 0 && hooks.onPick) hooks.onPick(s); }
    drag = null; if (ptrs.size < 2) pinch = null;
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerenter', function () { over = true; wake(0); });
  canvas.addEventListener('pointerleave', function () { over = false; wake(1500); if (hov !== -1) { hov = -1; drawOverlay(); } });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault(); cancelAnimationFrame(anim);
    zoom = clamp(zoom * Math.exp(e.deltaY * 0.0012), 0.3, 2.4); applyCam(); reset();
  }, { passive: false });
  function view(t) {
    cancelAnimationFrame(anim);
    const a0 = az, e0 = el, z0 = zoom, t0 = performance.now();
    const step = function () {
      const k = Math.min(1, (performance.now() - t0) / 420), s = k * k * (3 - 2 * k);
      az = a0 + (t.az - a0) * s; el = e0 + (t.el - e0) * s; zoom = z0 + (t.zoom - z0) * s;
      applyCam(); reset();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { az = t.az; el = t.el; zoom = t.zoom; applyCam(); reset(); }
    else step();
  }

  /* Vorschaubilder einzelner Einsätze */
  const tScene = new T.Scene(); tScene.environment = envTex;
  const tKey = new T.DirectionalLight(0xffffff, 2.6), tFill = new T.DirectionalLight(0xffffff, 0.8), tGroup = new T.Group();
  tKey.position.set(-70, 95, 150); tKey.castShadow = true; tKey.shadow.mapSize.set(512, 512); tKey.shadow.bias = -0.0005; tKey.shadow.normalBias = 0.12;
  (function () { const c = tKey.shadow.camera; c.left = -45; c.right = 45; c.top = 45; c.bottom = -45; c.near = 60; c.far = 330; c.updateProjectionMatrix(); })();
  tFill.position.set(40, -20, 200);
  tScene.add(tKey); tScene.add(tKey.target); tScene.add(tFill); tScene.add(tGroup);
  const tCam = new T.OrthographicCamera(-33, 33, 33, -33, 1, 700);
  tCam.position.set(0, 0, 300); tCam.lookAt(0, 0, 0);
  function thumb(cv2d, L, itemId, ic, opt) {
    const kit = new Kit(), I = L.insert, half = (I.shape === 'circle' ? I.dBig : I.size) / 2 + 3.4;
    tCam.left = -half; tCam.right = half; tCam.top = half; tCam.bottom = -half; tCam.updateProjectionMatrix();
    clearGroup(tGroup);
    buildSingle(kit, L, itemId, opt);
    addMeshes(tGroup, kit, resolver({ L: L, ic: ic, fc: ic }));
    const S = cv2d.width, pr = renderer.getPixelRatio(), v = (S + 0.01) / pr;
    if (canvas.width < S || canvas.height < S) { clearGroup(tGroup); return false; }
    renderer.setRenderTarget(null); renderer.setScissorTest(true);
    renderer.setViewport(0, 0, v, v); renderer.setScissor(0, 0, v, v);
    renderer.render(tScene, tCam);
    const ctx = cv2d.getContext('2d');
    ctx.clearRect(0, 0, S, S); ctx.drawImage(canvas, 0, canvas.height - S, S, S, 0, 0, S, S);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, vw, vh);
    clearGroup(tGroup);
    return true;
  }
  function afterThumbs() { if (canAcc && frame > 0) present(); else reset(); }

  const api = {
    accumulate: canAcc,
    setConfig: function (cfg) {
      const key = JSON.stringify([cfg.L.id, cfg.mount, cfg.F, cfg.frames.map(function (f) { return [f.cols, f.rows]; })]), sizeChanged = key !== layoutKey;
      layoutKey = key;
      clearGroup(group);
      const kit = new Kit();
      dims = buildRow(kit, cfg); layout = dims.frames; total = 0;
      layout.forEach(function (f) { f.base = total; total += f.cols * f.rows; });
      addMeshes(group, kit, resolver(cfg));
      if (sizeChanged) {
        computeFit(); fitShadow(); wall.geometry.dispose();
        wall.geometry = wallGeo(dims.hole ? layout.map(function (f) { return { x: f.cx, w: Math.min(f.ow + 4, f.W - 8), h: Math.min(f.oh + 4, f.H - 8) }; }) : []);
      }
      applyCam(); reset();
    },
    setWall: function (kind, paint) {
      const w = wallSpec(kind);
      wallMat.map = w.map || null; wallMat.normalMap = w.normalMap; wallMat.normalScale.set(w.nScale, w.nScale);
      wallMat.roughness = w.rough; wallMat.color.set(w.paint ? paint : '#ffffff');
      [w.map, w.normalMap].forEach(function (t) { if (t) t.repeat.set(50 / w.tile, 50 / w.tile); });
      wallMat.needsUpdate = true; reset();
    },
    setLight: function (name) {
      light = LIGHT_SET[name] || LIGHT_SET.tag;
      keyDir.set(light.key[0], light.key[1], light.key[2]).normalize();
      e1.set(0, 1, 0).cross(keyDir).normalize(); e2.copy(keyDir).cross(e1).normalize();
      key.color.set(light.keyCol); key.intensity = light.keyI; dome.color.set(light.domeCol);
      ENV_K = light.env;
      for (const id in MAT) { const m = MAT[id]; if (m.userData && m.userData.env !== undefined) m.envMapIntensity = m.userData.env * ENV_K; }
      if (dispMat) dispMat.uniforms.exposure.value = light.exposure;
      renderer.toneMappingExposure = light.exposure;
      reset();
    },
    select: function (i) { sel = i; drawOverlay(); wake(over ? 0 : 2800); },
    view: view,
    viewNow: function () { return { az: az, el: el, zoom: zoom }; },
    thumb: thumb, afterThumbs: afterThumbs,
    firstFrameOnly: function () { frame = 0; renderFrame(); present(); frame = ACC_MAX; },
    finishNow: function () { while (frame < ACC_MAX) { renderFrame(); frame++; } present(); if (hooks.onProgress) hooks.onProgress(1); },
    resize: size,
    /* Bild zum Speichern: rund 3 Megapixel, vollständig gemittelt */
    snapshot: function (done) {
      const pr0 = renderer.getPixelRatio(), pr = Math.min(4, Math.sqrt(3.0e6 / (vw * vh)));
      const big = canAcc && pr > pr0 * 1.05;
      const setBuf = function (p) {
        renderer.setPixelRatio(p); renderer.setSize(vw, vh, false);
        bufW = canvas.width; bufH = canvas.height; rtA.setSize(bufW, bufH); rtB.setSize(bufW, bufH);
      };
      try {
        if (big) {
          setBuf(pr);
          exportRT = new T.WebGLRenderTarget(bufW, bufH, { type: T.HalfFloatType, format: T.RGBAFormat, minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true });
        }
        frame = 0;
        while (frame < ACC_MAX) { renderFrame(); frame++; }
        present();
        canvas.toBlob(done, 'image/png');
      } catch (e) { done(null); }
      if (big) {
        if (exportRT) { exportRT.dispose(); exportRT = null; }
        setBuf(pr0);
        frame = 0; renderFrame(); frame = 1; present(); kick();
      }
      if (hooks.onProgress) hooks.onProgress(frame / ACC_MAX);
    }
  };
  if (window.ResizeObserver) new ResizeObserver(function () { size(); }).observe(stageEl);
  else window.addEventListener('resize', size);
  canvas.style.cursor = 'grab';
  return api;
}
