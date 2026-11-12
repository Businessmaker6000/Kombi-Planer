/* ================================================================
   02 · Katalog: Designlinien, Farben, Einsätze
   Rastermass der Schweizer Kombinationen: 60 mm.
   ================================================================ */
const PITCH = 60;

function col(id, name, hex, extra) { return Object.assign({ id: id, name: name, hex: hex }, extra || {}); }

/* Rahmen aus Echtmaterial */
const FRAME_MATS = {
  glasw: { id: 'glasw', name: 'Glas weiss', mat: 'glass', hex: '#f0f3f2', pair: 'weiss' },
  glass: { id: 'glass', name: 'Glas schwarz', mat: 'glass', hex: '#0c0d0e', pair: 'schwarz' },
  stahl: { id: 'stahl', name: 'Chromstahl gebürstet', mat: 'steel', hex: '#c6cacd', pair: 'schwarz' },
  alu: { id: 'alu', name: 'Aluminium natur', mat: 'alu', hex: '#d2d4d5', pair: 'weiss' },
  messing: { id: 'messing', name: 'Messing', mat: 'brass', hex: '#c2a164', pair: 'schwarz' },
  schiefer: { id: 'schiefer', name: 'Schiefer', mat: 'slate', hex: '#3d4043', pair: 'schwarz' }
};

/* Montageart und Bedienart */
const MOUNTS = [['up', 'Unterputz', 'UP'], ['ap', 'Aufputz', 'AP'], ['nup', 'Nass UP', 'NUP · IP55'], ['nap', 'Nass AP', 'NAP · IP55']];
const OPS = [['druck', 'Druck', 'Schweizer Standard: flacher Druckknopf'], ['wippe', 'Wippe', 'Wipp- bzw. Kippschalter: grosse, geneigte Wippe'], ['kipp', 'Kipphebel', 'Kippschalter mit kleinem Hebel']];

const LINES = [
  {
    id: 'ediziodue', brand: 'Feller', name: 'EDIZIOdue', tag: 'kantig, glänzend', size1: 88, shape: 'sq',
    mounts: ['up', 'ap'], apH: 44, wip: { w: 54, h: 54, r: 1.0 },
    frame: { style: 'roof', border: 14, rc: 1.6, er: 0.35, hOut: 6.2, hIn: 9.4 },
    mframe: { style: 'flat', border: 17, rc: 1.0, er: 0.6, h: 8.0 }, mname: 'prestige',
    insert: { shape: 'sq', size: 59.7, r: 0.5, er: 0.3, proud: 0.35 },
    rocker: { w: 41, h: 41, r: 0.6, er: 0.4, proud: 2.6, tilt: 3.8 }, led: 'bar',
    kombi: { rw: 40.6, rh: 25, ry: 10.3, sy: -15.1 },
    tri: 0, triR: 16.8, finish: 'lacquer',
    colors: [
      col('weiss', 'Weiss', '#f5f5f2'), col('creme', 'Crème', '#e9e3d0'), col('hellgrau', 'Hellgrau', '#c8cac8'),
      col('dunkelgrau', 'Dunkelgrau', '#6a6c6b'), col('schwarz', 'Schwarz', '#1b1b1a'), col('coffee', 'Coffee', '#5b4a3e'),
      col('vanille', 'Vanille', '#efe2b6', { old: 1 }), col('sand', 'Sand', '#cbbda2', { old: 1 }),
      col('silver', 'Silver', '#b9bcbd', { old: 1, finish: 'metallic' }), col('lemon', 'Lemon', '#d6d24a', { old: 1 }),
      col('olive', 'Olive', '#7d7b4a', { old: 1 }), col('berry', 'Berry', '#8a2c44', { old: 1 })],
    mats: ['glasw', 'glass', 'stahl', 'messing', 'alu', 'schiefer']
  },
  {
    id: 'edizioliv', brand: 'Feller', name: 'EDIZIO.liv', tag: 'flach, matt', size1: 96, shape: 'sq',
    mounts: ['up', 'ap'], apH: 42, wip: { w: 54, h: 54, r: 2.0 },
    frame: { style: 'flat', border: 18, rc: 3.0, er: 0.9, h: 7.0 },
    mframe: { style: 'flat', border: 18, rc: 2.0, er: 0.6, h: 7.5 }, mname: 'prestige',
    insert: { shape: 'sq', size: 59.7, r: 1.4, er: 0.35, proud: 0.25 },
    rocker: { w: 42, h: 42, r: 1.8, er: 0.5, proud: 2.0, tilt: 2.8 }, led: 'bar',
    kombi: { rw: 41, rh: 25, ry: 10.3, sy: -15.1 },
    tri: 0, triR: 16.8, finish: 'matte',
    colors: [
      col('weiss', 'Weiss', '#f3f3f0'), col('crema', 'Crema', '#e6dfcf'), col('umbra', 'Umbra', '#8b8176'),
      col('hellgrau', 'Hellgrau', '#c5c6c4'), col('dunkelgrau', 'Dunkelgrau', '#68696a'), col('schwarz', 'Schwarz', '#1f1f1f')],
    mats: ['glasw', 'glass', 'messing']
  },
  {
    id: 'standarddue', brand: 'Feller', name: 'STANDARDdue', tag: 'Kreis im Quadrat', size1: 86, shape: 'circle',
    mounts: ['up', 'ap'], apH: 46, wip: { w: 30, h: 30, w2: 34, r: 4 },
    frame: { style: 'pillow', border: 13, rc: 8.5, er: 3.0, h: 8.6 },
    insert: { shape: 'circle', d: 53, dBig: 58.4, bead: 3.2, beadH: 1.25, beadBig: 1.9, beadBigH: 0.75, proud: 0 },
    rocker: { w: 25, h: 25, w2: 31, r: 3.4, er: 0.8, proud: 3.2, tilt: 4.0 }, led: 'dot',
    kombi: { rw: 27, rh: 22, ry: 11.2, sy: -11.8 },
    tri: 0, triR: 16.0, finish: 'gloss',
    colors: [col('weiss', 'Weiss', '#f4f4f0'), col('schwarz', 'Schwarz', '#1c1c1c')],
    mats: []
  },
  {
    id: 'kallysto-line', brand: 'Hager', name: 'kallysto.line', tag: 'geradlinig', size1: 92, shape: 'sq',
    mounts: ['up', 'ap'], apH: 44, wip: { w: 55, h: 55, r: 1.2 },
    frame: { style: 'flat', border: 16, rc: 2.2, er: 0.7, h: 7.5 },
    insert: { shape: 'sq', size: 59.6, r: 0.6, er: 0.3, proud: 0.3 },
    rocker: { w: 45, h: 45, r: 1.1, er: 0.5, proud: 2.2, tilt: 3.0 }, led: 'dot',
    kombi: { rw: 45, rh: 18.6, ry: 12.7, sy: -10.4 },
    tri: 270, triR: 16.8, finish: 'satin',
    colors: [
      col('ultraweiss', 'Ultraweiss', '#f7f8f8'), col('beige', 'Beige', '#e6d2b5'), col('lichtgrau', 'Lichtgrau', '#c5c7c4'),
      col('anthrazit', 'Anthrazit', '#383e42'), col('schwarz', 'Schwarz', '#0f0f11'), col('orange', 'Orange', '#e25303')],
    mats: []
  },
  {
    id: 'kallysto-trend', brand: 'Hager', name: 'kallysto.trend', tag: 'weich gerundet', size1: 94, shape: 'sq',
    mounts: ['up'], wip: { w: 55, h: 55, r: 1.2 },
    frame: { style: 'flat', border: 17, rc: 6.5, er: 2.6, h: 8.6 },
    insert: { shape: 'sq', size: 59.6, r: 0.6, er: 0.3, proud: 0.3 },
    rocker: { w: 45, h: 45, r: 1.1, er: 0.5, proud: 2.2, tilt: 3.0 }, led: 'dot',
    kombi: { rw: 45, rh: 18.6, ry: 12.7, sy: -10.4 },
    tri: 270, triR: 16.8, finish: 'satin',
    colors: [
      col('ultraweiss', 'Ultraweiss', '#f7f8f8'), col('beige', 'Beige', '#e6d2b5'), col('lichtgrau', 'Lichtgrau', '#c5c7c4'),
      col('anthrazit', 'Anthrazit', '#383e42'), col('schwarz', 'Schwarz', '#0f0f11')],
    mats: []
  },
  {
    id: 'kallysto-art', brand: 'Hager', name: 'kallysto.art', tag: 'Rahmen aus Echtmaterial', size1: 94, shape: 'sq',
    mounts: ['up'], wip: { w: 55, h: 55, r: 1.2 },
    frame: null,
    mframe: { style: 'flat', border: 17, rc: 1.2, er: 0.5, h: 7.6 }, mname: 'art',
    insert: { shape: 'sq', size: 59.6, r: 0.6, er: 0.3, proud: 0.3 },
    rocker: { w: 45, h: 45, r: 1.1, er: 0.5, proud: 2.2, tilt: 3.0 }, led: 'dot',
    kombi: { rw: 45, rh: 18.6, ry: 12.7, sy: -10.4 },
    tri: 270, triR: 16.8, finish: 'satin',
    colors: [
      col('ultraweiss', 'Ultraweiss', '#f7f8f8'), col('lichtgrau', 'Lichtgrau', '#c5c7c4'),
      col('anthrazit', 'Anthrazit', '#383e42'), col('schwarz', 'Schwarz', '#0f0f11')],
    mats: ['alu', 'stahl', 'glasw', 'glass']
  },
  {
    id: 'sidus', brand: 'ABB', name: 'Sidus', tag: 'schlanker Rahmen', size1: 88, shape: 'sq',
    mounts: ['up', 'ap'], apH: 48, wip: { w: 54, h: 54, r: 1.4 },
    frame: { style: 'flat', border: 14, rc: 1.4, er: 0.5, h: 8.2 },
    mframe: { style: 'flat', border: 14, rc: 1.0, er: 0.5, h: 8.2 }, mname: 'Echtmaterial',
    insert: { shape: 'sq', size: 59.6, r: 0.9, er: 0.35, proud: 0.3 },
    rocker: { w: 41, h: 41, r: 1.3, er: 0.5, proud: 2.2, tilt: 3.0 }, led: 'dot',
    kombi: { rw: 44, rh: 17.5, ry: 12.6, sy: -10.4 },
    tri: 270, triR: 16.8, finish: 'satin',
    colors: [col('weiss', 'Weiss', '#f4f4f1'), col('schwarz', 'Schwarz', '#1b1b1b')],
    mats: ['glasw', 'glass', 'stahl']
  },
  /* Nass-Sortimente IP55: als Gehäuse (NAP) oder bündig in der Wand (NUP) */
  {
    id: 'nevo', brand: 'Feller', name: 'NEVO', tag: 'IP55, runder Druckknopf', size1: 82, shape: 'sq',
    mounts: ['nap', 'nup'], wet: true, pitch: 76, lid: 'body', gasket: true,
    frame: { style: 'units', border: 3, rc: 9, er: 2.2, h: 58, seam: 15, box: true },
    nupFrame: { style: 'units', border: 3, rc: 7, er: 1.6, h: 9 },
    insert: { shape: 'sq', size: 70, r: 7, er: 1.3, proud: 1.6, screws: 4 },
    rocker: { w: 42, h: 42, r: 21, er: 0.9, proud: 2.6, tilt: 3.5, round: true }, wip: { w: 44, h: 44, r: 5 }, led: 'dot',
    kombi: { rw: 40, rh: 18, ry: 12, sy: -10 },
    tri: 0, triR: 16.2, finish: 'satin',
    colors: [col('weiss', 'Weiss', '#f3f3f0'), col('lichtgrau', 'Lichtgrau', '#c8ccc9'), col('schwarz', 'Schwarz', '#1e1f20')],
    mats: []
  },
  {
    id: 'robusto', brand: 'Hager', name: 'robusto', tag: 'IP55, quadratische Taste', size1: 82, shape: 'sq',
    mounts: ['nap', 'nup'], wet: true, pitch: 76, lid: 'lidclear', gasket: false,
    frame: { style: 'units', border: 3, rc: 7, er: 2.0, h: 56, seam: 14, box: true },
    nupFrame: { style: 'units', border: 3, rc: 6, er: 1.5, h: 9 },
    insert: { shape: 'sq', size: 70, r: 5.5, er: 1.2, proud: 1.4, screws: 4 },
    rocker: { w: 40, h: 40, r: 2.5, er: 0.8, proud: 2.2, tilt: 3.2 }, wip: { w: 46, h: 46, r: 3 }, led: 'dot',
    kombi: { rw: 40, rh: 18, ry: 12, sy: -10 },
    tri: 270, triR: 16.2, finish: 'satin',
    colors: [col('weiss', 'Weiss', '#f4f5f4'), col('lichtgrau', 'Lichtgrau', '#c5c7c4'), col('alu', 'Aluminium', '#b6b9ba', { finish: 'metallic' }), col('schwarz', 'Schwarz', '#17181a')],
    mats: []
  }
];
const LINE = {};
LINES.forEach(function (l) { LINE[l.id] = l; });

const CATS = [
  ['steck', 'Steckdosen'], ['kombi', 'Kombinationen'], ['schalt', 'Schalter & Taster'], ['storen', 'Storen'],
  ['regler', 'Dimmer & Regler'], ['daten', 'Daten & Multimedia'], ['smart', 'Bus & Smart'], ['div', 'Abdeckungen']
];

function rep(v, n) { const a = []; for (let i = 0; i < n; i++) a.push(v); return a; }

/* tog = hat Wippen, die sich umlegen lassen · adv = nicht in STANDARDdue */
const ITEMS = [
  { id: 't13', cat: 'steck', name: 'Steckdose T13', sub: '1-fach · 10 A / 250 V', b: function (b) { b.sockets(1, '13'); } },
  { id: 't13x2', cat: 'steck', name: 'Steckdose 2×T13', sub: '2-fach · 10 A / 250 V', b: function (b) { b.sockets(2, '13'); } },
  { id: 't13x3', cat: 'steck', name: 'Steckdose 3×T13', sub: '3-fach · 10 A / 250 V', b: function (b) { b.sockets(3, '13'); } },
  { id: 't23', cat: 'steck', name: 'Steckdose T23', sub: '1-fach · 16 A / 250 V', b: function (b) { b.sockets(1, '23'); } },
  { id: 't23x3', cat: 'steck', name: 'Steckdose 3×T23', sub: '3-fach · 16 A / 250 V', b: function (b) { b.sockets(3, '23'); } },
  { id: 't15', cat: 'steck', name: 'Steckdose T15', sub: '3 × 400 V · 10 A · 5-polig', b: function (b) { b.tri5('15'); } },
  { id: 't25', cat: 'steck', name: 'Steckdose T25', sub: '3 × 400 V · 16 A · 5-polig', b: function (b) { b.tri5('25'); } },
  { id: 't13usb', cat: 'steck', name: 'Steckdose T13 + USB', sub: 'mit Ladeanschluss USB-A / USB-C', adv: 1, b: function (b) { b.t13usb(); } },
  { id: 'usb', cat: 'steck', name: 'USB-Ladesteckdose', sub: 'USB-A + USB-C', b: function (b) { b.usbOnly(); } },
  { id: 'schuko', cat: 'steck', name: 'Steckdose Typ F', sub: 'Schuko · 16 A · Spezialanwendung', adv: 1, b: function (b) { b.schuko(); } },

  { id: 'k1', cat: 'kombi', name: 'Schalter + T13', sub: 'Schema 3 mit Steckdose', tog: 1, b: function (b) { b.kombi(1, '13'); } },
  { id: 'k1l', cat: 'kombi', name: 'Leuchtschalter + T13', sub: 'Schema 3 beleuchtet mit Steckdose', tog: 1, b: function (b) { b.kombi(1, '13', { led: ['orange'] }); } },
  { id: 'k2', cat: 'kombi', name: '2 Schalter + T13', sub: 'Schema 3+3 mit Steckdose', tog: 1, b: function (b) { b.kombi(2, '13'); } },
  { id: 'k1t', cat: 'kombi', name: 'Taster + T13', sub: 'Schliesser mit Steckdose', b: function (b) { b.kombi(1, '13', { flat: 1 }); } },
  { id: 'k23', cat: 'kombi', name: 'Schalter + T23', sub: 'Schema 3 mit Steckdose 16 A', tog: 1, b: function (b) { b.kombi(1, '23'); } },

  { id: 's3', cat: 'schalt', name: 'Druckschalter Schema 3', sub: 'Wechselschalter', tog: 1, b: function (b) { b.std(1, 1); } },
  { id: 's0', cat: 'schalt', name: 'Druckschalter Schema 0', sub: 'Ausschalter 1-polig', tog: 1, b: function (b) { b.std(1, 1); } },
  { id: 's6', cat: 'schalt', name: 'Druckschalter Schema 6', sub: 'Kreuzschalter', tog: 1, b: function (b) { b.std(1, 1); } },
  { id: 's2', cat: 'schalt', name: 'Druckschalter Schema 2', sub: 'Ausschalter 2-polig', tog: 1, b: function (b) { b.std(1, 1); } },
  { id: 's1', cat: 'schalt', name: 'Druckschalter Schema 1', sub: 'Serieschalter · 2 Wippen', tog: 1, b: function (b) { b.std(2, 1); } },
  { id: 's33', cat: 'schalt', name: 'Druckschalter Schema 3+3', sub: 'Doppel-Wechsel · 2 Wippen', tog: 1, b: function (b) { b.std(2, 1); } },
  { id: 's3l', cat: 'schalt', name: 'Leuchtschalter Schema 3', sub: 'mit Orientierungslicht', tog: 1, b: function (b) { b.std(1, 1, { led: ['orange'] }); } },
  { id: 's3k', cat: 'schalt', name: 'Kontrollschalter Schema 3', sub: 'mit roter Kontrolllampe', tog: 1, b: function (b) { b.std(1, 1, { led: ['red'] }); } },
  { id: 't1', cat: 'schalt', name: 'Drucktaster', sub: 'Schliesser 1-fach', b: function (b) { b.std(1, 1, { flat: 1 }); } },
  { id: 't2', cat: 'schalt', name: 'Drucktaster 2-fach', sub: '2 Schliesser', b: function (b) { b.std(2, 1, { flat: 1 }); } },
  { id: 't1l', cat: 'schalt', name: 'Leuchttaster', sub: 'Schliesser mit LED', b: function (b) { b.std(1, 1, { flat: 1, led: ['white'] }); } },
  { id: 'tli', cat: 'schalt', name: 'Taster «Licht»', sub: 'Symbol Lampe', b: function (b) { b.std(1, 1, { flat: 1, sym: ['light'] }); } },
  { id: 'tgl', cat: 'schalt', name: 'Taster «Glocke»', sub: 'Symbol Sonnerie', b: function (b) { b.std(1, 1, { flat: 1, sym: ['bell'] }); } },
  { id: 'tkey', cat: 'schalt', name: 'Taster «Türöffner»', sub: 'Symbol Schlüssel', b: function (b) { b.std(1, 1, { flat: 1, sym: ['key'] }); } },
  { id: 'skey', cat: 'schalt', name: 'Schlüsselschalter', sub: 'mit Profilzylinder', b: function (b) { b.keySwitch(); } },

  { id: 'st2', cat: 'storen', name: 'Storenschalter', sub: 'Auf / Ab · 2 Wippen', tog: 1, b: function (b) { b.std(2, 1, { sym: ['up', 'down'], tilts: [1, -1] }); } },
  { id: 'st2t', cat: 'storen', name: 'Storentaster', sub: 'Auf / Ab · tastend', b: function (b) { b.std(2, 1, { sym: ['up', 'down'], flat: 1 }); } },
  { id: 'st1', cat: 'storen', name: 'Storenschalter 1 Wippe', sub: 'Auf / Ab auf einer Wippe', tog: 1, b: function (b) { b.std(1, 1, { sym2: ['up', 'down'] }); } },
  { id: 'st4', cat: 'storen', name: 'Storentaster 2-fach', sub: '2 Storen · 4 Tasten', adv: 1, b: function (b) { b.std(2, 2, { sym: ['up', 'up', 'down', 'down'], flat: 1 }); } },

  { id: 'dim', cat: 'regler', name: 'Drehdimmer LED', sub: 'Universaldimmer mit Drehknopf', b: function (b) { b.dimmer(); } },
  { id: 'dimt', cat: 'regler', name: 'Tastdimmer LED', sub: 'Bedienung über Taste', b: function (b) { b.std(1, 1, { flat: 1, led: ['white'], sym: ['light'] }); } },
  { id: 'rot', cat: 'regler', name: 'Drehschalter 0-1-2-3', sub: 'Stufenschalter Lüftung', adv: 1, b: function (b) { b.rotary(); } },
  { id: 'thk', cat: 'regler', name: 'Raumthermostat', sub: 'mit Drehknopf', adv: 1, b: function (b) { b.thermoKnob(); } },
  { id: 'thd', cat: 'regler', name: 'Raumthermostat Display', sub: 'mit Anzeige und Tasten', adv: 1, b: function (b) { b.thermoDisplay(); } },
  { id: 'uhr', cat: 'regler', name: 'Zeitschaltuhr', sub: 'Wochenprogramm mit Display', adv: 1, b: function (b) { b.timer(); } },
  { id: 'pir', cat: 'regler', name: 'Bewegungsmelder', sub: 'Erfassung 180°', adv: 1, b: function (b) { b.motion(); } },

  { id: 'rj1', cat: 'daten', name: 'Netzwerkdose RJ45', sub: '1 Anschluss · Cat. 6A', b: function (b) { b.rj45(1); } },
  { id: 'rj2', cat: 'daten', name: 'Netzwerkdose 2×RJ45', sub: '2 Anschlüsse · Cat. 6A', adv: 1, b: function (b) { b.rj45(2); } },
  { id: 'tv2', cat: 'daten', name: 'Antennendose R/TV', sub: 'Radio + TV', adv: 1, b: function (b) { b.coaxSet(2); } },
  { id: 'tv3', cat: 'daten', name: 'Antennendose R/TV/SAT', sub: 'Radio + TV + Satellit', adv: 1, b: function (b) { b.coaxSet(3); } },
  { id: 'mm', cat: 'daten', name: 'Multimedia HDMI + USB', sub: 'Durchführungsdose', adv: 1, b: function (b) { b.hdmi(); } },

  { id: 'bus1', cat: 'smart', name: 'Bus-Taster 1-fach', sub: 'KNX · mit Status-LED', adv: 1, b: function (b) { b.std(1, 1, { flat: 1, led: ['green'] }); } },
  { id: 'bus2', cat: 'smart', name: 'Bus-Taster 2-fach', sub: 'KNX · 2 Tasten mit LED', adv: 1, b: function (b) { b.std(2, 1, { flat: 1, led: rep('green', 2) }); } },
  { id: 'bus4', cat: 'smart', name: 'Bus-Taster 4-fach', sub: 'KNX · 4 Tasten mit LED', adv: 1, b: function (b) { b.std(2, 2, { flat: 1, led: rep('green', 4) }); } },
  { id: 'bus8', cat: 'smart', name: 'Bus-Taster 8-fach', sub: 'KNX · 8 Tasten mit LED', adv: 1, b: function (b) { b.std(2, 4, { flat: 1, led: rep('green', 8) }); } },
  { id: 'szene', cat: 'smart', name: 'Szenentaster', sub: '4 Szenen mit LED', adv: 1, b: function (b) { b.std(1, 4, { flat: 1, led: rep('white', 4) }); } },

  { id: 'blind', cat: 'div', name: 'Blindabdeckung', sub: 'Abdeckung ohne Funktion', b: function () { } },
  { id: 'kabel', cat: 'div', name: 'Kabelauslass', sub: 'mit Zugentlastung', b: function (b) { b.cableOut(); } },
  { id: 'ledo', cat: 'div', name: 'LED-Orientierungslicht', sub: 'Nachtlicht mit Dämmerungssensor', adv: 1, b: function (b) { b.nightLight(); } },
  { id: 'sig', cat: 'div', name: 'Signalleuchte rot/grün', sub: 'Besetzt- / Frei-Anzeige', adv: 1, b: function (b) { b.signal(); } }
];
const ITEM = {};
ITEMS.forEach(function (it) { ITEM[it.id] = it; });

/* Einsätze, die es auch im Nass-Sortiment gibt */
const WET_ITEMS = ['t13', 't13x2', 't13x3', 't23', 't23x3', 't15', 't25', 's3', 's0', 's6', 's2', 's1', 's33', 's3l', 's3k', 't1', 't2', 't1l', 'tli', 'tgl', 'tkey', 'skey', 'st2', 'st2t', 'st1', 'pir', 'blind', 'kabel', 'sig'];
WET_ITEMS.forEach(function (id) { ITEM[id].wet = 1; });
function itemAllowed(it, L) { return L.wet ? !!it.wet : !(it.adv && L.insert.shape === 'circle'); }

/* Standardgrössen: UP 1×1 bis 3×4, AP bis 4×2, Nass bis 3×2 */
function sizeAllowed(c, r, mount) {
  if (!(c >= 1 && r >= 1 && c <= 4 && r <= 4)) return false;
  const lo = Math.min(c, r), hi = Math.max(c, r);
  if (mount === 'ap') return lo <= 2;
  if (mount === 'nap' || mount === 'nup') return hi <= 3 && lo <= 2;
  return lo <= 3;
}
function sizeNote(mount) {
  return mount === 'ap' ? 'Aufputz-Gehäuse von 1×1 bis 4×2.' : (mount === 'nap' || mount === 'nup') ? 'Nass-Kombinationen von 1×1 bis 3×2.' : 'Rahmen von 1×1 bis 3×4, quer oder hoch.';
}

/* Aufputz: derselbe Rahmen sitzt auf einem Gehäuse, die Fuge liegt auf Höhe des Sockels */
function raised(F, H) {
  const o = Object.assign({}, F), d = H - (F.style === 'roof' ? F.hIn : F.h);
  if (F.style === 'roof') { o.hOut = F.hOut + d; o.hIn = F.hIn + d; } else o.h = F.h + d;
  o.seam = d; o.box = true;
  return o;
}
function frameGeo(L, frameColorId, mount) {
  if (L.wet) return mount === 'nup' ? L.nupFrame : L.frame;
  if (mount === 'ap') return L._ap || (L._ap = raised(L.frame, L.apH));
  if (FRAME_MATS[frameColorId] && L.mframe) return L.mframe;
  return L.frame || L.mframe;
}
function frameDims(L, frameColorId, cols, rows, mount) {
  const F = frameGeo(L, frameColorId, mount), P = L.pitch || PITCH;
  return { W: cols * P + 2 * F.border, H: rows * P + 2 * F.border };
}
function linesFor(mount) { return LINES.filter(function (l) { return l.mounts.indexOf(mount) >= 0; }); }
