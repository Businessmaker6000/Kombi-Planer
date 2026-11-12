/* ================================================================
   05 · Oberfläche und Zustand
   ================================================================ */
const $ = function (s, r) { return (r || document).querySelector(s); };
function h(tag, attrs, kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  if (kids) kids.forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}
function byId(list, id) { for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function lumHex(hex) { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; }
/* Rahmen: Aufputz und Nass nur in Kunststofffarben, Unterputz zusätzlich in Echtmaterial */
function frameOpts(L, mount) {
  if (L.wet || mount === 'ap') return L.colors;
  return (L.frame ? L.colors : []).concat(L.mats.map(function (id) { return FRAME_MATS[id]; }));
}
function nearestIn(list, hex) {
  const l = lumHex(hex); let best = null, bd = 9;
  list.forEach(function (c) { if (c.old || c.mat) return; const d = Math.abs(lumHex(c.hex) - l); if (d < bd) { bd = d; best = c; } });
  return best || list[0];
}
function nearestColor(L, hex) { return nearestIn(L.colors, hex); }
function pairColor(L, mat) { return byId(L.colors, mat.pair) || nearestColor(L, mat.pair === 'weiss' ? '#ffffff' : '#000000'); }
const isNarrow = function () { return window.innerWidth <= 900; };

/* ---------- Zustand ---------- */
const STORE_KEY = 'kombi-planer-v2', TABS = ['secLine', 'secColor', 'secSize', 'secFill', 'secEnv', 'secList'];
/* höchstens so viele Rahmen nebeneinander in einer Reihe */
const MAX_FRAMES = 6;
function defaults() {
  return {
    mount: 'up', line: 'ediziodue', fc: 'weiss', ic: 'weiss', link: true,
    frames: [{ cols: 2, rows: 1, slots: [{ item: 's3', rot: 0, flip: false }, { item: 't13x3', rot: 0, flip: false }] }],
    act: 0, sel: 0, op: 'druck', lid: 'auf', wall: 'abrieb', paint: '#f2f0ea', light: 'tag', cat: 'all', tab: 'secLine'
  };
}
function load() { try { const s = JSON.parse(localStorage.getItem(STORE_KEY)); return s && typeof s === 'object' ? s : null; } catch (e) { return null; } }
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ohne Speicher weiter */ } }
/* ein Rahmen der Reihe: Grösse prüfen, fehlende Einsätze ergänzen */
function sanitizeFrame(q, L, mount) {
  let c = (q && q.cols) | 0, r = (q && q.rows) | 0;
  if (!sizeAllowed(c, r, mount)) { c = 2; r = 1; }
  const src = q && Array.isArray(q.slots) ? q.slots : [], slots = [];
  for (let i = 0; i < c * r; i++) {
    const x = src[i] || {}, it = ITEM[x.item];
    slots.push({ item: it && itemAllowed(it, L) ? it.id : 't13', rot: ((x.rot | 0) % 4 + 4) % 4, flip: !!x.flip });
  }
  return { cols: c, rows: r, slots: slots };
}
function sanitize(s) {
  const d = defaults();
  if (!s) return d;
  const o = Object.assign({}, d, s);
  if (!MOUNTS.some(function (m) { return m[0] === o.mount; })) o.mount = d.mount;
  if (!LINE[o.line] || LINE[o.line].mounts.indexOf(o.mount) < 0) o.line = linesFor(o.mount)[0].id;
  const L = LINE[o.line], fo = frameOpts(L, o.mount);
  if (!byId(fo, o.fc)) o.fc = fo[0].id;
  if (!byId(L.colors, o.ic)) o.ic = L.colors[0].id;
  /* ältere Fassung ohne Reihe: die einzelne Kombination wird der erste Rahmen */
  const list = Array.isArray(s.frames) && s.frames.length ? s.frames : [{ cols: s.cols, rows: s.rows, slots: s.slots }];
  o.frames = list.slice(0, MAX_FRAMES).map(function (q) { return sanitizeFrame(q, L, o.mount); });
  delete o.cols; delete o.rows; delete o.slots;
  o.act = Math.max(0, Math.min(o.frames.length - 1, o.act | 0));
  o.sel = Math.max(0, Math.min(o.frames[o.act].slots.length - 1, o.sel | 0));
  if (!OPS.some(function (x) { return x[0] === o.op; })) o.op = d.op;
  if (o.lid !== 'zu') o.lid = 'auf';
  if (!WALLS.some(function (w) { return w[0] === o.wall; })) o.wall = d.wall;
  if (typeof o.paint !== 'string' || !/^#[0-9a-f]{6}$/i.test(o.paint)) o.paint = d.paint;
  if (!LIGHT_SET[o.light]) o.light = d.light;
  if (o.cat !== 'all' && !CATS.some(function (c) { return c[0] === o.cat; })) o.cat = 'all';
  if (TABS.indexOf(o.tab) < 0) o.tab = d.tab;
  o.link = !!o.link;
  return o;
}

let state = sanitize(load());
let stage = null, downloads = null, thumbKey = '', thumbToken = 0, toastT = 0, modalUrl = null;
const thumbs = {}, cards = {};

function curL() { return LINE[state.line]; }
function curFc() { return byId(frameOpts(curL(), state.mount), state.fc); }
function curIc() { return byId(curL().colors, state.ic); }
/* der aktive Rahmen wird in Grösse und Bestückung bearbeitet */
function af() { return state.frames[state.act]; }
/* Nummer des gewählten Feldes über alle Rahmen der Reihe */
function gidx() {
  let b = 0;
  for (let k = 0; k < state.act; k++) b += state.frames[k].cols * state.frames[k].rows;
  return b + state.sel;
}
function slotTotal() { return state.frames.reduce(function (s, f) { return s + f.cols * f.rows; }, 0); }
function curDims() { return frameDims(curL(), state.fc, af().cols, af().rows, state.mount); }
/* Gesamtmass der Reihe: die Rahmen nebeneinander, mit Abstand ROW_GAP */
function rowDims() {
  const L = curL(), F = frameGeo(L, state.fc, state.mount), P = L.pitch || PITCH;
  const sz = state.frames.map(function (f) { return { W: f.cols * P + 2 * F.border, H: f.rows * P + 2 * F.border }; });
  return { W: sz.reduce(function (s, d) { return s + d.W; }, 0) + ROW_GAP * (sz.length - 1), H: Math.max.apply(null, sz.map(function (d) { return d.H; })) };
}
function cfg() {
  const L = curL();
  return { L: L, F: frameGeo(L, state.fc, state.mount), fc: curFc(), ic: curIc(), frames: state.frames, op: state.op, lid: state.lid, mount: state.mount };
}
/* Bezeichnung folgt der Bedienart: Druckschalter, Wippschalter oder Kippschalter */
function itemName(it) {
  if (state.op === 'druck') return it.name;
  const w = state.op === 'wippe' ? 'Wipp' : 'Kipp';
  return it.name.replace('Druckschalter', w + 'schalter').replace('Drucktaster', w + 'taster');
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3400);
}
function segButtons(box, list, cur, fn) {
  box.textContent = '';
  list.forEach(function (x) {
    box.appendChild(h('button', { type: 'button', 'aria-pressed': String(cur === x[0]), title: x[2] || null, onclick: function () { fn(x[0]); } },
      x[2] && box.classList.contains('two') ? [h('b', { text: x[1] }), h('small', { text: x[2] })] : [x[1]]));
  });
}

/* ---------- Bauart und Designlinie ---------- */
const MOUNT_NOTE = {
  up: 'Unterputz: bündig in der Wand, Rahmen im 60-mm-Raster.',
  ap: 'Aufputz: derselbe Rahmen sitzt auf einem Gehäuse auf der Wand.',
  nup: 'Nass, Unterputz: IP55 mit Dichtung und Klappdeckel, bündig in der Wand.',
  nap: 'Nass, Aufputz: IP55-Gehäuse mit Klappdeckel für Keller, Garage und Aussenbereich.'
};
function glyph(l) {
  const F = l.frame || l.mframe, k = 34 / l.size1, rc = Math.max(0.8, F.rc * k * 1.3), i = (l.wet ? 70 : 60) * k, off = 1 + (34 - i) / 2;
  const inner = l.shape === 'circle'
    ? '<circle cx="18" cy="18" r="' + (26.5 * k).toFixed(1) + '"/><rect x="13" y="13" width="10" height="10" rx="1.6"/>'
    : '<rect x="' + off.toFixed(1) + '" y="' + off.toFixed(1) + '" width="' + i.toFixed(1) + '" height="' + i.toFixed(1) + '" rx="' + (l.wet ? 3 : 0.6) + '"/>' +
      (l.rocker.round ? '<circle cx="18" cy="18" r="7.5"/>' : '<rect x="11.5" y="11.5" width="13" height="13" rx="0.8"/>');
  return '<svg viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1" y="1" width="34" height="34" rx="' + rc.toFixed(1) + '"/>' + inner + '</svg>';
}
function renderLines() {
  const box = $('#lines'), brands = [], list = linesFor(state.mount);
  segButtons($('#mounts'), MOUNTS.map(function (m) { return [m[0], m[1], m[2]]; }), state.mount, setMount);
  $('#mountNote').textContent = MOUNT_NOTE[state.mount];
  box.textContent = '';
  list.forEach(function (l) { if (brands.indexOf(l.brand) < 0) brands.push(l.brand); });
  brands.forEach(function (b) {
    const grid = h('div', { class: 'linegrid' });
    list.forEach(function (l) {
      if (l.brand !== b) return;
      const d = frameDims(l, null, 1, 1, state.mount);
      const btn = h('button', { class: 'linecard', type: 'button', 'aria-pressed': String(l.id === state.line), onclick: function () { setLine(l.id); } });
      btn.innerHTML = glyph(l);
      btn.appendChild(h('span', null, [h('b', { text: l.name }), h('small', { text: d.W + ' mm · ' + l.tag })]));
      grid.appendChild(btn);
    });
    box.appendChild(h('div', { class: 'brandrow' }, [h('h3', { text: b }), grid]));
  });
}
/* nach Wechsel von Bauart oder Linie: Farben, Grösse und Einsätze aller Rahmen passend machen */
function resizeFrame(f, c, r) {
  const old = f.slots, oc = f.cols, orr = f.rows, ns = [];
  for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) ns.push(x < oc && y < orr ? old[y * oc + x] : { item: 't13', rot: 0, flip: false });
  f.cols = c; f.rows = r; f.slots = ns;
}
function normalize(prevF, prevI) {
  const L = curL(), fo = frameOpts(L, state.mount);
  let fc = byId(fo, state.fc);
  if (!fc) {
    const ref = prevF || { hex: '#ffffff' };
    fc = ref.mat ? (byId(fo, ref.pair) || nearestIn(fo, ref.pair === 'weiss' ? '#ffffff' : '#000000')) : nearestIn(fo, ref.hex);
    state.fc = fc.id;
  }
  if (!byId(L.colors, state.ic)) state.ic = nearestColor(L, prevI ? prevI.hex : '#ffffff').id;
  if (state.link) syncInsert();
  let dropped = 0;
  state.frames.forEach(function (f) {
    let c = f.cols, r = f.rows;
    while (!sizeAllowed(c, r, state.mount)) { if (c >= r && c > 1) c--; else if (r > 1) r--; else break; }
    if (c !== f.cols || r !== f.rows) resizeFrame(f, c, r);
    f.slots.forEach(function (s) { if (!itemAllowed(ITEM[s.item], L)) { s.item = 'blind'; s.rot = 0; s.flip = false; dropped++; } });
  });
  state.sel = Math.min(state.sel, af().slots.length - 1);
  if (dropped) toast(dropped === 1 ? '1 Einsatz gibt es in ' + L.name + ' nicht – ersetzt durch eine Blindabdeckung.' : dropped + ' Einsätze gibt es in ' + L.name + ' nicht – ersetzt durch Blindabdeckungen.');
}
function setLine(id) {
  if (id === state.line) return;
  const pf = curFc(), pi = curIc();
  state.line = id; normalize(pf, pi); update('line');
}
function setMount(m) {
  if (m === state.mount) return;
  const pf = curFc(), pi = curIc(), L = curL(), list = linesFor(m);
  state.mount = m;
  if (list.indexOf(L) < 0) state.line = (list.filter(function (l) { return l.brand === L.brand; })[0] || list[0]).id;
  normalize(pf, pi); update('line');
}

/* ---------- Farbe ---------- */
function swBg(c) {
  if (!c.mat) return c.hex;
  if (c.mat === 'glass') return 'linear-gradient(135deg,#ffffff 0%,' + c.hex + ' 40%,' + c.hex + ' 100%)';
  if (c.mat === 'brass') return 'linear-gradient(135deg,#ecd9a8,#a8843f 55%,#e2c888)';
  if (c.mat === 'slate') return 'linear-gradient(135deg,#5a5e61,#303336)';
  return 'linear-gradient(135deg,#eef0f1,#9aa0a5 52%,#e2e5e7)';
}
function swatch(c, on, fn, label) {
  return h('button', { class: 'sw' + (c.old ? ' old' : ''), type: 'button', title: c.name, 'aria-label': (label || '') + c.name, 'aria-pressed': String(on), style: 'background:' + swBg(c), onclick: fn });
}
function renderColors() {
  const L = curL(), fb = $('#swFrame'), ib = $('#swIns'), fc = curFc(), ic = curIc(), box = L.wet || state.mount === 'ap';
  fb.textContent = ''; ib.textContent = '';
  frameOpts(L, state.mount).forEach(function (c) { fb.appendChild(swatch(c, c.id === state.fc, function () { setFrameColor(c.id); }, 'Rahmen ')); });
  L.colors.forEach(function (c) { ib.appendChild(swatch(c, c.id === state.ic, function () { setInsColor(c.id); }, 'Einsätze ')); });
  $('#frameLbl').textContent = box ? 'Gehäuse' : L.shape === 'circle' ? 'Abdeckplatte' : 'Rahmen';
  $('#frameName').textContent = fc.name + (fc.mat && L.mname ? ' · ' + L.mname : '') + (fc.old ? ' · Auslauf' : '');
  $('#insName').textContent = ic.name + (ic.old ? ' · Auslauf' : '');
  $('#chkLink').checked = !!state.link;
  $('#linkLbl').textContent = box ? 'Einsätze in der Gehäusefarbe' : 'Einsätze in der Rahmenfarbe';
  $('#oldNote').hidden = !L.colors.some(function (c) { return c.old; });
}
function syncInsert() { const L = curL(), fc = curFc(); state.ic = fc.mat ? pairColor(L, fc).id : fc.id; }
function setFrameColor(id) { state.fc = id; if (state.link) syncInsert(); update('color'); }
function setInsColor(id) { state.ic = id; const fc = curFc(); state.link = !fc.mat && fc.id === id; update('color'); }

/* ---------- Grösse ---------- */
function hoverSize(c, r) {
  $('#sizegrid').querySelectorAll('button').forEach(function (b) { b.classList.toggle('hov', +b.dataset.c <= c && +b.dataset.r <= r); });
}
function renderSize() {
  const g = $('#sizegrid'), a = af(), d = curDims(), L = curL();
  g.textContent = '';
  for (let r = 1; r <= 4; r++) for (let c = 1; c <= 4; c++) {
    (function (c, r) {
      g.appendChild(h('button', {
        type: 'button', 'data-c': c, 'data-r': r, class: (c <= a.cols && r <= a.rows) ? 'in' : '',
        'aria-label': c + ' × ' + r + ' Felder', title: c + ' × ' + r, disabled: !sizeAllowed(c, r, state.mount),
        'aria-pressed': String(c === a.cols && r === a.rows),
        onclick: function () { setSize(c, r); }, onmouseenter: function () { hoverSize(c, r); }, onmouseleave: function () { hoverSize(0, 0); }
      }));
    })(c, r);
  }
  $('#sizeMain').textContent = a.cols + ' × ' + a.rows + (a.cols * a.rows === 1 ? ' Feld' : ' Felder');
  $('#sizeDims').textContent = ((L.wet || state.mount === 'ap') ? 'Gehäuse ' : L.shape === 'circle' ? 'Platte ' : 'Rahmen ') + d.W + ' × ' + d.H + ' mm';
  $('#sizeNote').textContent = sizeNote(state.mount);
}
function setSize(c, r) {
  if (!sizeAllowed(c, r, state.mount)) return;
  resizeFrame(af(), c, r); state.sel = Math.min(state.sel, af().slots.length - 1); update('size');
}

/* ---------- Reihe: Rahmen nebeneinander ---------- */
function pickItem(L, prefs) {
  for (let i = 0; i < prefs.length; i++) { const it = ITEM[prefs[i]]; if (it && itemAllowed(it, L)) return it.id; }
  return 'blind';
}
function renderFrames() {
  const box = $('#frameStrip'), n = state.frames.length;
  box.textContent = '';
  state.frames.forEach(function (f, i) {
    box.appendChild(h('button', {
      type: 'button', 'aria-pressed': String(i === state.act), title: 'Rahmen ' + (i + 1),
      onclick: function () { setActive(i); }
    }, ['Rahmen ' + (i + 1) + ' · ' + (f.cols * f.rows === 1 ? 'Einzel' : 'Kombi') + ' ' + f.cols + '×' + f.rows]));
  });
  $('#rowCount').textContent = n === 1 ? '1 Rahmen' : n + ' Rahmen · ' + slotTotal() + ' Felder';
  $('#btnAddKombi').disabled = n >= MAX_FRAMES;
  $('#btnAddSingle').disabled = n >= MAX_FRAMES;
  $('#btnFrameLeft').disabled = state.act <= 0;
  $('#btnFrameRight').disabled = state.act >= n - 1;
  $('#btnFrameDel').disabled = n <= 1;
  $('#rowNote').textContent = n === 1
    ? 'Mit «+ Kombi» oder «+ Einzelstück» setzt du weitere Rahmen daneben, bis zu ' + MAX_FRAMES + ' Stück.'
    : 'Gewählt ist Rahmen ' + (state.act + 1) + ': Grösse und Bestückung gelten für ihn. Im Bild wählst du jeden Rahmen mit einem Klick.';
}
function setActive(i) {
  if (i === state.act || i < 0 || i >= state.frames.length) return;
  state.act = i; state.sel = 0; update('frame');
}
function addFrame(single) {
  if (state.frames.length >= MAX_FRAMES) return;
  const L = curL();
  const f = single
    ? { cols: 1, rows: 1, slots: [{ item: pickItem(L, ['s3', 't13']), rot: 0, flip: false }] }
    : { cols: 2, rows: 1, slots: [{ item: pickItem(L, ['s3', 'blind']), rot: 0, flip: false }, { item: pickItem(L, ['t13x3', 't13']), rot: 0, flip: false }] };
  state.frames.splice(state.act + 1, 0, f);
  state.act += 1; state.sel = 0;
  update('frame');
}
function moveFrame(d) {
  const j = state.act + d;
  if (j < 0 || j >= state.frames.length) return;
  const t = state.frames[j]; state.frames[j] = state.frames[state.act]; state.frames[state.act] = t;
  state.act = j; update('frame');
}
function removeFrame() {
  if (state.frames.length <= 1) return;
  state.frames.splice(state.act, 1);
  state.act = Math.min(state.act, state.frames.length - 1); state.sel = 0;
  update('frame');
}

/* ---------- Bestückung ---------- */
function drawMini(cv, s) {
  const src = thumbs[s.item], ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!src || !src._ok) return;
  ctx.save(); ctx.translate(cv.width / 2, cv.height / 2); ctx.rotate((s.rot || 0) * Math.PI / 2);
  ctx.drawImage(src, -cv.width / 2, -cv.height / 2, cv.width, cv.height); ctx.restore();
}
function renderSlotbar() {
  const s = af().slots[state.sel], it = ITEM[s.item], n = $('#slotName');
  n.textContent = '';
  n.appendChild(document.createTextNode((state.frames.length > 1 ? 'Rahmen ' + (state.act + 1) + ', ' : '') + 'Feld ' + (state.sel + 1) + ' von ' + af().slots.length + ': '));
  n.appendChild(h('b', { text: itemName(it) }));
  $('#btnFlip').disabled = !(it.tog && state.op !== 'druck');
  $('#btnFlip').textContent = state.op === 'kipp' ? 'Hebel umlegen' : 'Wippe umlegen';
  $('#btnAll').disabled = af().slots.length < 2;
}
function renderMinimap() {
  const a = af(), m = $('#minimap'), cell = isNarrow() ? Math.max(38, Math.min(62, Math.floor(134 / a.rows))) : 72;
  m.textContent = ''; m.style.setProperty('--c', a.cols); m.style.setProperty('--cell', cell + 'px');
  a.slots.forEach(function (s, i) {
    const cv = h('canvas', { width: 128, height: 128 });
    m.appendChild(h('button', {
      class: 'cell', type: 'button', 'aria-pressed': String(i === state.sel), 'aria-label': 'Feld ' + (i + 1) + ': ' + itemName(ITEM[s.item]),
      onclick: function () { pick(i, false); }
    }, [cv, h('span', { text: String(i + 1) })]));
    drawMini(cv, s);
  });
  renderSlotbar();
}
function redrawMinis() {
  $('#minimap').querySelectorAll('canvas').forEach(function (cv, k) { if (af().slots[k]) drawMini(cv, af().slots[k]); });
}
/* Feld im aktiven Rahmen wählen */
function pick(i, fromStage) {
  if (i < 0 || i >= af().slots.length) return;
  state.sel = i; save();
  $('#minimap').querySelectorAll('.cell').forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
  renderSlotbar(); filterItems();
  if (stage) stage.select(gidx());
  if (fromStage) {
    setTab('secFill');
    if (!isNarrow()) { const sec = $('#secFill'); if (sec.scrollIntoView) sec.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
}
/* Klick im Bild: Feld über die globale Nummer finden und den zugehörigen Rahmen wählen */
function pickGlobal(gi, fromStage) {
  let base = 0;
  for (let k = 0; k < state.frames.length; k++) {
    const n = state.frames[k].cols * state.frames[k].rows;
    if (gi < base + n) { state.act = k; state.sel = gi - base; break; }
    base += n;
  }
  save(); renderFrames(); renderSize(); renderMinimap(); filterItems();
  if (stage) stage.select(gidx());
  if (fromStage) {
    setTab('secFill');
    if (!isNarrow()) { const sec = $('#secFill'); if (sec.scrollIntoView) sec.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
}
function renderOps() {
  const L = curL();
  segButtons($('#ops'), OPS, state.op, function (v) { state.op = v; update('op'); });
  $('#opName').textContent = OPS.filter(function (x) { return x[0] === state.op; })[0][2];
  $('#lidRow').hidden = !L.wet;
  if (L.wet) segButtons($('#lids'), [['auf', 'Offen'], ['zu', 'Geschlossen']], state.lid, function (v) { state.lid = v; update('op'); });
}

/* ---------- Einsätze wählen ---------- */
function buildCatalog() {
  const cats = $('#cats'), box = $('#items');
  cats.textContent = ''; box.textContent = '';
  [['all', 'Alle']].concat(CATS).forEach(function (c) {
    cats.appendChild(h('button', {
      type: 'button', 'data-cat': c[0], 'aria-pressed': String(state.cat === c[0]), text: c[1],
      onclick: function () {
        state.cat = c[0]; save(); $('#q').value = '';
        cats.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cat === c[0])); });
        filterItems();
      }
    }));
  });
  ITEMS.forEach(function (it) {
    const cv = h('canvas', { width: 128, height: 128 }), nm = h('b', { text: it.name });
    thumbs[it.id] = cv;
    cards[it.id] = h('button', { class: 'item', type: 'button', 'data-id': it.id, onclick: function () { assign(it.id); } },
      [cv, h('span', null, [nm, h('small', { text: it.sub })])]);
    cards[it.id]._nm = nm;
    box.appendChild(cards[it.id]);
  });
}
function filterItems() {
  const L = curL(), q = $('#q').value.trim().toLowerCase(), cur = af().slots[state.sel].item, catName = {}, usedCats = {};
  CATS.forEach(function (c) { catName[c[0]] = c[1]; });
  let n = 0;
  ITEMS.forEach(function (it) {
    const ok = itemAllowed(it, L), nm = itemName(it);
    if (ok) usedCats[it.cat] = 1;
    const hit = q ? (nm + ' ' + it.name + ' ' + it.sub + ' ' + catName[it.cat]).toLowerCase().indexOf(q) >= 0 : (state.cat === 'all' || it.cat === state.cat);
    cards[it.id]._nm.textContent = nm;
    cards[it.id].hidden = !(hit && ok);
    cards[it.id].classList.toggle('on', it.id === cur);
    if (hit && ok) n++;
  });
  $('#cats').querySelectorAll('button').forEach(function (b) { b.hidden = b.dataset.cat !== 'all' && !usedCats[b.dataset.cat]; });
  if (!n && !q && state.cat !== 'all') { state.cat = 'all'; $('#cats').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cat === 'all')); }); return filterItems(); }
  $('#noItems').hidden = n > 0;
}
function assign(id) {
  af().slots[state.sel] = { item: id, rot: 0, flip: false };
  update('slot');
}

/* ---------- Wand und Licht ---------- */
function renderEnv() {
  const p = $('#paints');
  segButtons($('#walls'), WALLS, state.wall, function (v) { state.wall = v; envChanged(); });
  segButtons($('#lights'), LIGHTS, state.light, function (v) { state.light = v; envChanged(); });
  p.textContent = '';
  p.hidden = !(state.wall === 'abrieb' || state.wall === 'glatt');
  PAINTS.forEach(function (x) {
    p.appendChild(h('button', { class: 'sw', type: 'button', title: x[1], 'aria-label': 'Wandfarbe ' + x[1], 'aria-pressed': String(state.paint === x[0]), style: 'background:' + x[0], onclick: function () { state.paint = x[0]; envChanged(); } }));
  });
}
function envChanged() {
  save(); renderEnv();
  if (stage) { stage.setLight(state.light); stage.setWall(state.wall, state.paint); }
}

/* ---------- Stückliste ---------- */
function partsData() {
  const L = curL(), fc = curFc(), ic = curIc(), d = rowDims(), out = [], cnt = {}, order = [], n = state.frames.length;
  const what = L.wet ? (state.mount === 'nap' ? 'NAP-Gehäuse IP55 ' : 'NUP-Abdeckung IP55 ') : state.mount === 'ap' ? 'AP-Gehäuse mit Rahmen ' : L.shape === 'circle' ? 'Abdeckplatte ' : 'Abdeckrahmen ';
  if (n > 1) out.push({ n: 1, t: 'Reihe aus ' + n + ' Rahmen · ' + L.brand + ' ' + L.name, s: d.W + ' × ' + d.H + ' mm · ' + fc.name });
  state.frames.forEach(function (f, i) {
    const dd = frameDims(L, state.fc, f.cols, f.rows, state.mount);
    out.push({ n: 1, t: (n > 1 ? 'Rahmen ' + (i + 1) + ': ' : '') + what + f.cols + '×' + f.rows + ' · ' + L.brand + ' ' + L.name + (fc.mat && L.mname ? ' ' + L.mname : ''), s: fc.name + ' · ' + dd.W + ' × ' + dd.H + ' mm' });
  });
  state.frames.forEach(function (f) { f.slots.forEach(function (s) { if (!cnt[s.item]) { cnt[s.item] = 0; order.push(s.item); } cnt[s.item]++; }); });
  order.forEach(function (id) {
    const it = ITEM[id];
    out.push({ n: cnt[id], t: itemName(it) + ' · ' + L.name + (L.wet ? ' IP55' : state.mount === 'ap' ? ' AP' : ''), s: it.sub + ' · ' + ic.name });
  });
  return out;
}
function renderList() {
  const ul = $('#parts');
  ul.textContent = '';
  partsData().forEach(function (p) {
    ul.appendChild(h('li', null, [h('span', { class: 'n', text: p.n + ' ×' }), h('span', null, [p.t, h('small', { text: p.s })])]));
  });
}
function copyList() {
  const L = curL(), n = state.frames.length;
  const head = n > 1 ? 'Reihe aus ' + n + ' Rahmen' : 'Kombination ' + af().cols + '×' + af().rows;
  const txt = head + ' – ' + L.brand + ' ' + L.name + '\n' +
    partsData().map(function (p) { return p.n + ' × ' + p.t + ' (' + p.s + ')'; }).join('\n');
  const fail = function () {
    try { window.getSelection().selectAllChildren($('#parts')); toast('Liste markiert – jetzt kopieren.'); }
    catch (e) { toast('Kopieren ist hier nicht möglich.'); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('Stückliste kopiert.'); }, fail);
  else fail();
}
function renderChips() {
  const L = curL(), fc = curFc(), d = rowDims(), m = MOUNTS.filter(function (x) { return x[0] === state.mount; })[0], n = state.frames.length;
  $('#chipLine').textContent = L.brand + ' ' + L.name + ' · ' + m[2].split(' ')[0] + ' · ' + fc.name;
  $('#chipDims').textContent = (n > 1 ? n + ' Rahmen' : af().cols + ' × ' + af().rows) + ' · ' + d.W + ' × ' + d.H + ' mm';
}

/* ---------- Vorschaubilder der Einsätze ---------- */
function refreshThumbs() {
  if (!stage) return;
  const L = curL(), ic = curIc(), opt = { op: state.op, lid: state.lid }, key = [L.id, ic.id, state.op, state.lid].join('|');
  if (key === thumbKey) return;
  thumbKey = key;
  const token = ++thumbToken, used = {}, list = [];
  state.frames.forEach(function (f) { f.slots.forEach(function (s) { if (!used[s.item]) { used[s.item] = 1; list.push(ITEM[s.item]); } }); });
  ITEMS.forEach(function (it) { if (!used[it.id] && itemAllowed(it, L)) list.push(it); });
  let i = 0;
  const step = function () {
    if (token !== thumbToken) return;
    const end = Math.min(list.length, i + 6);
    for (; i < end; i++) {
      const cv = thumbs[list[i].id];
      try { cv._ok = stage.thumb(cv, L, list[i].id, ic, opt); } catch (e) { cv._ok = false; if (window.console) console.error('Vorschau', list[i].id, e); }
    }
    stage.afterThumbs(); redrawMinis();
    if (i < list.length) setTimeout(step, 24);
  };
  setTimeout(step, 80);
}

/* ---------- alles neu zeichnen ---------- */
function pushStage() {
  if (!stage) return;
  try { stage.setConfig(cfg()); stage.select(gidx()); }
  catch (e) { if (window.console) console.error(e); toast('Diese Zusammenstellung konnte nicht dargestellt werden.'); }
  refreshThumbs();
}
function update(kind) {
  save();
  if (kind === 'line') renderLines();
  if (kind === 'line' || kind === 'color') renderColors();
  if (kind !== 'slot' && kind !== 'op') renderSize();
  if (kind === 'line' || kind === 'op') renderOps();
  renderFrames();
  renderMinimap(); filterItems(); renderList(); renderChips();
  pushStage();
}
function setTab(id) {
  if (TABS.indexOf(id) < 0) return;
  state.tab = id; save();
  TABS.forEach(function (t) { document.getElementById(t).classList.toggle('active', t === id); });
  $('#tabbar').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === id)); });
  $('#panel').dataset.tab = id;
  if (isNarrow()) $('#panel').scrollTop = 0;
}

/* ---------- Aktionen ---------- */
function randomize() {
  const pickOf = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  const L = pickOf(linesFor(state.mount)), fc = pickOf(frameOpts(L, state.mount).filter(function (c) { return !c.old; }));
  const sizes = [[1, 1], [2, 1], [2, 1], [3, 1], [3, 1], [1, 2], [1, 3], [2, 2], [4, 1], [3, 2], [2, 3]].filter(function (s) { return sizeAllowed(s[0], s[1], state.mount); });
  const pool = ITEMS.filter(function (it) { return itemAllowed(it, L) && it.id !== 'blind'; });
  const fav = ['t13x3', 't13', 's3', 's33', 'st2', 'k1', 'rj1', 'dim', 't23', 't13x2'].filter(function (id) { return itemAllowed(ITEM[id], L); });
  state.line = L.id; state.fc = fc.id; state.link = true; state.ic = fc.mat ? pairColor(L, fc).id : fc.id;
  /* die Anzahl der Rahmen bleibt, Grösse und Einsätze werden neu gewürfelt */
  const n = state.frames.length;
  state.frames = [];
  for (let k = 0; k < n; k++) {
    const sz = pickOf(sizes), slots = [];
    for (let i = 0; i < sz[0] * sz[1]; i++) slots.push({ item: Math.random() < 0.6 ? pickOf(fav) : pickOf(pool).id, rot: 0, flip: Math.random() < 0.3 });
    state.frames.push({ cols: sz[0], rows: sz[1], slots: slots });
  }
  state.act = 0; state.sel = 0;
  update('line');
}
function closeModal() {
  $('#modal').hidden = true;
  if (modalUrl) { URL.revokeObjectURL(modalUrl); modalUrl = null; $('#modalImg').removeAttribute('src'); }
}
function showImage(blob, name) {
  if (modalUrl) URL.revokeObjectURL(modalUrl);
  modalUrl = URL.createObjectURL(blob);
  $('#modalImg').src = modalUrl;
  const a = $('#modalLink');
  if (!window.claude) { a.hidden = false; a.href = modalUrl; a.setAttribute('download', name); } else a.hidden = true;
  $('#modal').hidden = false; $('#modalClose').focus();
}
/* Bild übergeben: in der eingebetteten Ansicht über die Plattform, sonst als Download oder über das Teilen-Menü des Handys */
function deliver(blob, name) {
  if (downloads) {
    downloads.save({ filename: name, data: blob }).then(function () { toast('Bild gespeichert.'); }, function (err) {
      if (err && err.code === 'declined') return;
      showImage(blob, name);
    });
    return;
  }
  if (window.claude) { showImage(blob, name); return; }
  try {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
    if (coarse && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Kombi-Planer' }).catch(function (e) { if (!e || e.name !== 'AbortError') showImage(blob, name); });
      return;
    }
    const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    toast('Bild wird heruntergeladen.');
  } catch (e) { showImage(blob, name); }
}
function saveImage() {
  if (!stage) { toast('Ohne 3D-Vorschau gibt es kein Bild zum Speichern.'); return; }
  const btn = $('#btnSave'), L = curL(), tag = state.frames.length > 1 ? 'reihe-' + state.frames.length : af().cols + 'x' + af().rows, name = 'kombination-' + L.id + '-' + tag + '.png';
  btn.disabled = true;
  stage.snapshot(function (blob) {
    btn.disabled = false;
    if (!blob) { toast('Das Bild konnte nicht erzeugt werden.'); return; }
    deliver(blob, name);
  });
}

/* ---------- Start ---------- */
(function init() {
  const progEl = $('#progress'), progBar = progEl.firstElementChild;
  buildCatalog(); renderLines(); renderColors(); renderSize(); renderOps(); renderFrames(); renderMinimap(); filterItems(); renderEnv(); renderList(); renderChips();
  setTab(state.tab);

  $('#btnRandom').addEventListener('click', randomize);
  $('#btnSave').addEventListener('click', saveImage);
  $('#btnCopy').addEventListener('click', copyList);
  $('#btnAddKombi').addEventListener('click', function () { addFrame(false); });
  $('#btnAddSingle').addEventListener('click', function () { addFrame(true); });
  $('#btnFrameLeft').addEventListener('click', function () { moveFrame(-1); });
  $('#btnFrameRight').addEventListener('click', function () { moveFrame(1); });
  $('#btnFrameDel').addEventListener('click', removeFrame);
  $('#btnRot').addEventListener('click', function () { const s = af().slots[state.sel]; s.rot = ((s.rot || 0) + 1) % 4; update('slot'); });
  $('#btnFlip').addEventListener('click', function () { const s = af().slots[state.sel]; s.flip = !s.flip; update('slot'); });
  $('#btnAll').addEventListener('click', function () {
    const s = af().slots[state.sel];
    af().slots = af().slots.map(function () { return { item: s.item, rot: s.rot, flip: s.flip }; });
    update('slot');
  });
  $('#chkLink').addEventListener('change', function (e) { state.link = e.target.checked; if (state.link) syncInsert(); update('color'); });
  $('#q').addEventListener('input', filterItems);
  $('#modalClose').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', function (e) { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  $('#panel').querySelectorAll('.steps button').forEach(function (b) {
    b.addEventListener('click', function () { const t = document.getElementById(b.dataset.go); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  });
  $('#tabbar').querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { setTab(b.dataset.tab); }); });
  let wasNarrow = isNarrow();
  window.addEventListener('resize', function () { if (isNarrow() !== wasNarrow) { wasNarrow = isNarrow(); renderMinimap(); } });

  if (window.claude && typeof window.claude.use === 'function') {
    try { window.claude.use('downloads').then(function (d) { downloads = d || null; }, function () { downloads = null; }); } catch (e) { downloads = null; }
  }

  stage = T ? createStage($('#stage'), $('#view'), $('#overlay'), {
    onPick: function (i) { pickGlobal(i, true); },
    onProgress: function (p) { progBar.style.width = Math.round(p * 100) + '%'; progEl.classList.toggle('on', p < 1); }
  }) : null;
  if (!stage) { $('#nogl').hidden = false; $('#view').hidden = true; return; }
  $('#vFront').addEventListener('click', function () { stage.view({ az: 0, el: 0, zoom: 1 }); });
  $('#vSide').addEventListener('click', function () { stage.view({ az: -0.42, el: 0.16, zoom: 1 }); });
  $('#vClose').addEventListener('click', function () { const v = stage.viewNow(); stage.view({ az: v.az, el: v.el, zoom: v.zoom < 0.7 ? 1 : 0.5 }); });
  stage.setLight(state.light); stage.setWall(state.wall, state.paint);
  stage.resize(); pushStage();

  /* nur beim lokalen Testen: Prüfhilfen */
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    window.__kp = {
      state: function () { return state; },
      converge: function () { stage.finishNow(); return 'ok'; },
      view: function (v) { stage.view(v); },
      first: function () { stage.firstFrameOnly(); return 'ok'; },
      set: function (patch) { state = sanitize(Object.assign({}, state, patch)); thumbKey = ''; update('line'); renderEnv(); setTab(state.tab); stage.setLight(state.light); stage.setWall(state.wall, state.paint); return state; },
      testAll: function () {
        const out = [];
        LINES.forEach(function (L) {
          OPS.forEach(function (op) {
            ITEMS.forEach(function (it) {
              if (!itemAllowed(it, L)) return;
              try {
                const k = new Kit(); buildSingle(k, L, it.id, { op: op[0], lid: 'auf' }); let tris = 0;
                for (const n in k.g) {
                  const g = k.g[n]; tris += g.i.length / 3;
                  for (let i = 0; i < g.p.length; i++) if (!isFinite(g.p[i]) || !isFinite(g.n[i])) { out.push(L.id + '/' + op[0] + '/' + it.id + ': NaN in ' + n); break; }
                }
                if (tris > 60000) out.push(L.id + '/' + it.id + ': ' + tris + ' tris');
              } catch (e) { out.push(L.id + '/' + op[0] + '/' + it.id + ': ' + e.message); }
            });
          });
        });
        return out;
      }
    };
  }
})();
