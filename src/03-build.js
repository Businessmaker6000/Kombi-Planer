/* ================================================================
   03 · Bauteile: Abdeckplatten, Kragen, Tasten, Rahmen und Gehäuse
   ================================================================ */

/* Kragen T13/T23 nach SN 441011: mind. 36.5 × 21 mm, 13 mm tief */
const HEX_W = 37.2, HEX_H = 21.4, WELL_1P = 12.6, WELL_3P = 17.5;
let _hexC = null;
function HEX() { return _hexC || (_hexC = cHex(HEX_W, HEX_H, 1.4, 9.5)); }
function M4() { return new T.Matrix4(); }

function buildWell(kit, w, top) {
  const zf = top - w.depth, dr = w.draft, fr = w.fr, pr = [];
  parc(pr, w.lip, top - w.lip, w.lip, 0, -H_PI, 4);
  pr.push([-dr, zf + fr, -1, 0]);
  parc(pr, -dr - fr, zf + fr, fr, H_PI, PI, 3, -1);
  kit.b(w.mat).loft(w.C, pr);
  const fl = kit.b(w.floorMat);
  const hc = w.holes.map(function (h) { return h.kind === 'screw' ? h.C : cOff(h.C, 0.25); });
  fl.cap(cOff(w.C, -dr - fr), hc, zf, 1);
  w.holes.forEach(function (h) {
    if (h.kind === 'screw') {
      fl.loft(h.C, [[0, zf, -1, 0], [0, zf - 0.7, -1, 0]]);
      kit.b('metal').cap(h.C, [], zf - 0.7, 1);
      kit.b('slot').rect(h.x, h.y, zf - 0.68, 3.5, 0.7, h.ang || 0.5);
    } else {
      fl.loft(h.C, [[0.25, zf, -0.7, 0.7], [0, zf - 0.25, -0.7, 0.7]]);
      const d = kit.b('dark');
      d.loft(h.C, [[0, zf - 0.25, -1, 0], [0, zf - 7, -1, 0]]);
      d.cap(h.C, [], zf - 7, 1);
    }
  });
  if (w.slot) kit.b('slot').rect(w.slot.x, w.slot.y, zf + 0.02, 3.7, 0.72, w.slot.ang);
}

function buildPlate(kit, o) {
  const top = o.top, er = o.er || 0, gb = kit.b(o.mat || 'body'), holes = [];
  o.wells.forEach(function (w) { holes.push(cOff(w.C, w.lip)); });
  o.cuts.forEach(function (c) { holes.push(cOff(c.C, c.lip)); });
  gb.cap(er ? cOff(o.C, -er) : o.C, holes, top, 1);
  if (!o.noEdge) {
    const pr = [];
    if (er) parc(pr, -er, top - er, er, 0, H_PI, 4); else pr.push([0, top, 1, 0]);
    pr.push([0, o.bot, 1, 0]);
    gb.loft(o.C, pr);
  }
  o.cuts.forEach(function (c) {
    const pr = [];
    parc(pr, c.lip, top - c.lip, c.lip, 0, -H_PI, 3);
    pr.push([0, top - c.depth, -1, 0]);
    gb.loft(c.C, pr);
    kit.b(c.floorMat || 'dark').cap(c.C, [], top - c.depth, 1);
  });
  o.wells.forEach(function (w) { buildWell(kit, w, top); });
}

/* Platte mit verrundeter Kante, Oberseite bei z = 0, Dicke t; für Tasten und Deckel */
function slab(gb, C, er, t, holes) {
  const pr = [];
  gb.cap(er ? cOff(C, -er) : C, holes || [], 0, 1);
  if (er) parc(pr, -er, -er, er, 0, H_PI, 4); else pr.push([0, 0, 1, 0]);
  pr.push([0, -t, 1, 0]);
  gb.loft(C, pr);
}

/* ---------- Einsatz-Baukasten ---------- */
class IB {
  constructor(kit, L, M, top, slot, opt) {
    opt = opt || {};
    this.kit = kit; this.L = L; this.M0 = M; this.top = top; this.slot = slot || {};
    this.op = opt.op || 'druck'; this.lidOpen = opt.lid !== 'zu';
    this.wells = []; this.cuts = []; this.parts = []; this.big = false;
  }
  get flip() { return this.slot.flip ? -1 : 1; }
  get round() { return this.L.insert.shape === 'circle'; }
  get wet() { return !!this.L.wet; }
  part(f) { this.parts.push(f); }
  well(C, depth, o) {
    const w = Object.assign({ C: C, depth: depth, lip: 0.7, draft: 0.35, fr: 0.5, holes: [], mat: 'well', floorMat: 'well' }, o || {});
    this.wells.push(w); return w;
  }
  cut(C, depth, o) { this.cuts.push(Object.assign({ C: C, depth: depth, lip: 0.25 }, o || {})); }
  local(x, y, z) { return M4().multiplyMatrices(this.M0, M4().makeTranslation(x, y, z)); }

  /* --- Steckdosen --- */
  socket(x, y, rotDeg, type, o) {
    o = o || {};
    const rot = rotDeg * PI / 180, c = Math.cos(rot), s = Math.sin(rot), sq = type === '23';
    const loc = function (lx, ly) { return [x + lx * c - ly * s, y + lx * s + ly * c]; };
    let C = cXf(HEX(), x, y, rot);
    if (o.clipR) C = clipCircle(C, o.clipR);
    const holes = [];
    [[-9.5, 0], [9.5, 0], [0, -5]].forEach(function (q) {
      const p = loc(q[0], q[1]);
      holes.push({ C: cXf(sq ? cRRect(4.5, 5.5, 0.6) : cCircle(2.25, 20), p[0], p[1], rot) });
    });
    if (o.screw) { const p = loc(0, 5.5); holes.push({ C: cXf(cCircle(2.3, 20), p[0], p[1], 0), kind: 'screw', x: p[0], y: p[1], ang: rot + 0.6 }); }
    this.well(C, WELL_1P, { holes: holes });
  }
  screw(x, y) {
    const w = this.well(cXf(cCircle(2.5, 24), x, y, 0), 0.75, { lip: 0.2, draft: 0, fr: 0.05, floorMat: 'metal' });
    w.slot = { x: x, y: y, ang: 0.5 + x * 0.13 + y * 0.07 };
  }
  sockets(n, type) {
    const L = this.L, I = L.insert;
    if (n === 1) { this.socket(0, 0, 0, type, { screw: true }); if (this.wet) this.collar(24.6); return; }
    this.big = true;
    const tight = this.round || this.wet;
    const clip = this.round ? I.dBig / 2 - I.beadBig - 0.9 : this.wet ? 27.4 : 0;
    if (n === 2) {
      const dy = tight ? 12.6 : 15.6;
      this.socket(0, dy, 0, type, { clipR: clip }); this.socket(0, -dy, 0, type, { clipR: clip }); this.screw(0, 0);
    } else {
      for (let k = 0; k < 3; k++) {
        const deg = L.tri + k * 120, th = deg * PI / 180;
        this.socket(L.triR * Math.cos(th), L.triR * Math.sin(th), deg - 90, type, { clipR: clip });
      }
      this.screw(0, 0);
    }
    if (this.wet) this.collar(31);
  }
  /* T15 / T25: L1 und N unten, PE 5 mm darüber, L2 und L3 13 mm darüber */
  tri5(type) {
    this.big = true;
    const y0 = -6.3, sq = type === '25', H = [];
    const C = cXf(cPoly([
      { x: 18.9, y: 0, r: 1.4 }, { x: 15.4, y: 3.5, r: 1.5 }, { x: 15.4, y: 26, r: 7 }, { x: -15.4, y: 26, r: 7 },
      { x: -15.4, y: 3.5, r: 1.5 }, { x: -18.9, y: 0, r: 1.4 }, { x: -9, y: -13.4, r: 11 }, { x: 9, y: -13.4, r: 11 }]), 0, y0, 0);
    [[-9.5, 0], [9.5, 0], [0, 5]].forEach(function (q) { H.push({ C: cXf(sq ? cRRect(4.5, 5.5, 0.6) : cCircle(2.25, 20), q[0], q[1] + y0, 0) }); });
    [[-9.5, 13], [9.5, 13]].forEach(function (q) { H.push({ C: cXf(sq ? cRRect(5.5, 4.5, 0.6) : cRRect(4.8, 3.2, 0.5), q[0], q[1] + y0, 0) }); });
    H.push({ C: cXf(cCircle(2.3, 20), 0, 20.6 + y0, 0), kind: 'screw', x: 0, y: 20.6 + y0, ang: 0.5 });
    this.well(C, WELL_3P, { holes: H, lip: 0.8 });
    if (this.wet) this.collar(29);
  }
  schuko() {
    this.big = true;
    const self = this;
    this.well(cCircle(19.6, 100), WELL_3P, {
      lip: 0.9, draft: 0.3, fr: 0.8, holes: [
        { C: cXf(cCircle(2.5, 20), -9.5, 0, 0) }, { C: cXf(cCircle(2.5, 20), 9.5, 0, 0) },
        { C: cCircle(2.3, 20), kind: 'screw', x: 0, y: 0, ang: 0.4 }]
    });
    this.part(function () {
      const m = self.kit.b('metal'), zf = self.top - WELL_3P;
      m.box(-2.6, 17.4, zf, 2.6, 19.3, self.top - 2.5); m.box(-2.6, -19.3, zf, 2.6, -17.4, self.top - 2.5);
    });
  }
  /* Nass: runder Kragen um die Steckdose, Dichtung und Klappdeckel mit Scharnier oben */
  collar(R) {
    const self = this, L = this.L;
    this.part(function () {
      const kit = self.kit, top = self.top, gb = kit.b('body'), hC = 6.5, t = 2.6, pr = [];
      pr.push([3.2, top, 1, 0], [3.2, top + 0.9, 1, 0], [2.7, top + 1.4, 0, 1], [0, top + 1.4, 0, 1], [0, top + 1.4, 1, 0], [0, top + hC - 0.6, 1, 0]);
      parc(pr, -0.6, top + hC - 0.6, 0.6, H_PI, 0, 3);
      pr.push([-t + 0.6, top + hC, 0, 1]);
      parc(pr, -t + 0.6, top + hC - 0.6, 0.6, 0, -H_PI, 3);
      pr.push([-t, top, -1, 0]);
      gb.loft(cCircle(R, 96), pr);
      if (L.gasket) kit.b('gasket').cap(cCircle(R - t - 0.15, 72), [cCircle(R - t - 2.3, 72)], top + 0.12, 1);
      /* Scharnier */
      const hy = R + 5.0, hz = top + hC + 1.0, hw = R * 0.5;
      gb.box(-hw, hy - 2.4, top - 0.2, hw, hy + 2.2, hz + 1.3);
      /* Deckel: dreht um die Scharnierachse nach oben */
      const m = self.local(0, hy - 2.2, hz);
      if (self.lidOpen) m.multiply(M4().makeRotationX(-104 * PI / 180));
      m.multiply(M4().makeTranslation(0, 0, 2.3));
      kit.setM(m);
      const lidMat = kit.b(L.lid === 'lidclear' ? 'lidclear' : 'body');
      const wL = 2 * R + 7.5, hL = 2 * R + 8.5, cyL = -(hy - 2.2) + 0.4;
      slab(lidMat, cXf(cRRect(wL, hL, R * 0.62), 0, cyL, 0), 0.9, 2.3);
      slab(lidMat, cXf(cRRect(16, 8, 3), 0, cyL - hL / 2 - 1.5, 0), 0.8, 2.3);
      kit.setM(self.M0);
    });
  }
  usbA(x, y) {
    const self = this;
    this.well(cXf(cRRect(12.6, 5.2, 0.6), x, y, 0), 8, { lip: 0.25, draft: 0, fr: 0.1, mat: 'metal', floorMat: 'dark' });
    this.part(function () { self.kit.b('ivory').box(x - 5.6, y + 0.2, self.top - 8, x + 5.6, y + 2.0, self.top - 0.9); });
  }
  usbC(x, y) {
    const self = this;
    this.well(cXf(cRRect(8.6, 2.8, 1.39), x, y, 0), 6.5, { lip: 0.25, draft: 0, fr: 0.1, mat: 'metal', floorMat: 'dark' });
    this.part(function () { self.kit.b('jack').box(x - 3.3, y - 0.35, self.top - 6.5, x + 3.3, y + 0.35, self.top - 1.0); });
  }
  t13usb() { this.big = true; this.socket(0, -9.6, 0, '13', { screw: true }); this.usbA(-9.6, 19.6); this.usbC(9.6, 19.6); }
  usbOnly() { this.usbA(0, 6.5); this.usbC(0, -6.5); }

  /* --- Bedienelemente: Druckknopf (flach), Wippe (geneigt) oder Kipphebel --- */
  rp(n) {
    const L = this.L, R = L.rocker, W = this.op === 'wippe' ? (L.wip || R) : R, two = this.round && n > 1;
    return { w: two && W.w2 ? W.w2 : W.w, h: W.h, r: W.r, er: R.er, proud: R.proud, tilt: R.tilt, round: this.op !== 'wippe' && !!R.round };
  }
  rockers(cx, cy, w, h, nx, ny, o, P) {
    o = o || {}; P = P || this.rp(nx);
    const g = 0.4, rc = Math.min(P.r, w / 2 - 0.1, h / 2 - 0.1);
    this.cut(cXf(cRRect(w + 2 * g, h + 2 * g, rc + g), cx, cy, 0), 4.2);
    const kw = (w - (nx - 1) * g) / nx, kh = (h - (ny - 1) * g) / ny, tilts = this.op === 'wippe' && !o.flat && ny === 1;
    let idx = 0;
    for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++, idx++) {
      const x = cx - w / 2 + kw / 2 + ix * (kw + g), y = cy + h / 2 - kh / 2 - iy * (kh + g);
      const t = tilts ? (o.tilts ? o.tilts[idx] : (idx % 2 ? -1 : 1)) * this.flip : 0;
      this.key(x, y, kw, kh, Math.min(rc, kw / 4, kh / 4), t, o, idx, P);
    }
  }
  key(x, y, w, h, r, t, o, idx, P) {
    const self = this, led = o.led && o.led[idx], sym = o.sym && o.sym[idx];
    this.part(function () {
      const kit = self.kit, er = Math.min(P.er, w / 6, h / 6), proud = (o.proud || P.proud) * (t === 0 ? 0.82 : 1);
      const m = self.local(x, y, self.top + proud);
      if (t) m.multiply(M4().makeRotationX(-t * P.tilt * PI / 180));
      kit.setM(m);
      const gb = kit.b('body'), C = cRRect(w, h, r);
      let lc = null;
      if (led) {
        lc = self.L.led === 'bar'
          ? cXf(cRRect(Math.min(5.6, w * 0.4), 1.9, 0.9), 0, -h / 2 + Math.min(4.6, h * 0.24), 0)
          : cXf(cCircle(1.25, 16), 0, -h / 2 + Math.min(5, h * 0.26), 0);
      }
      slab(gb, C, er, proud + 3.2, lc ? [lc] : []);
      if (lc) { gb.loft(lc, [[0, 0, -1, 0], [0, -0.3, -1, 0]]); kit.b('led:' + led).cap(lc, [], -0.3, 1); }
      const ink = kit.b('ink'), ss = Math.min(o.symSize || 11, Math.min(w, h) * 0.42);
      if (sym) ink.sym(sym, 0, led ? h * 0.08 : 0, 0.04, ss);
      if (o.sym2) { ink.sym(o.sym2[0], 0, h * 0.27, 0.04, 7.5); ink.sym(o.sym2[1], 0, -h * 0.27, 0.04, 7.5); }
      kit.setM(self.M0);
    });
  }
  /* runder Druckknopf (NEVO), bei zwei Tasten als zwei Halbkreise */
  roundKeys(cx, cy, P, n, o) {
    const self = this, Rk = P.w / 2, g = 0.45;
    o = o || {};
    this.cut(cXf(cCircle(Rk + g, 84), cx, cy, 0), 3.6);
    for (let i = 0; i < n; i++) {
      const led = o.led && o.led[i];
      if (led) this.well(cXf(cCircle(1.3, 16), cx + (n === 1 ? 0 : (i ? 7 : -7)), cy - Rk - 4.4, 0), 0.4, { lip: 0.15, draft: 0, fr: 0.05, floorMat: 'led:' + led });
      (function (i) {
        self.part(function () {
          const kit = self.kit, sym = o.sym && o.sym[i];
          let C, sx = 0;
          if (n === 1) C = cCircle(Rk, 84);
          else {
            const a0 = Math.asin(Math.min(0.9, (g / 2 + 0.2) / Rk)), pts = [];
            for (let k = 0; k <= 40; k++) { const a = -H_PI + a0 + (PI - 2 * a0) * k / 40; pts.push({ x: Rk * Math.cos(a), y: Rk * Math.sin(a) }); }
            if (i === 0) { pts.forEach(function (p) { p.x = -p.x; }); pts.reverse(); }
            C = cFromPts(pts); sx = (i ? 1 : -1) * Rk * 0.48;
          }
          kit.setM(self.local(cx, cy, self.top + P.proud * 0.9));
          slab(kit.b('key2'), C, P.er, P.proud + 3);
          const ink = kit.b('inkKey');
          if (sym) ink.sym(sym, sx, 0, 0.04, n === 1 ? 12 : 9);
          if (o.sym2 && n === 1) { ink.sym(o.sym2[0], 0, Rk * 0.5, 0.04, 8); ink.sym(o.sym2[1], 0, -Rk * 0.5, 0.04, 8); }
          kit.setM(self.M0);
        });
      })(i);
    }
  }
  /* Kipphebel auf Metallbuchse */
  levers(cx, cy, w, n, o) {
    const self = this, dx = n > 1 ? Math.min(w / n, 20) : 0;
    o = o || {};
    for (let i = 0; i < n; i++) {
      const x = cx + (i - (n - 1) / 2) * dx, t = o.flat ? 0 : (o.tilts ? o.tilts[i] : (i % 2 ? -1 : 1)) * this.flip;
      this.well(cXf(cCircle(8.6, 44), x, cy, 0), 0.9, { lip: 0.5, draft: 0, fr: 0.2 });
      (function (x, t) {
        self.part(function () {
          const kit = self.kit, z0 = self.top - 0.9;
          kit.setM(self.local(x, cy, z0));
          kit.b('metal').loft(cCircle(7.4, 44), [[-2.8, 2.3, 0, 1], [-0.5, 2.3, 0, 1], [0, 1.8, 1, 0.3], [0, 0, 1, 0]]);
          kit.b('body').dome(cCircle(4.7, 32), 0, 0, 2.3, 2.1, 5);
          kit.setM(self.local(x, cy, z0 + 2.9).multiply(M4().makeRotationX(-t * 26 * PI / 180)));
          const C = cRRect(6.4, 6.4, 2.7), pr = [[0, 0, 1, 0], [-0.5, 14.5, 1, 0]];
          parc(pr, -2.7, 14.5, 2.2, H_PI, 0, 4);
          const gb = kit.b('body');
          gb.loft(C, pr); gb.cap(cOff(C, -2.7), [], 16.7, 1);
          kit.setM(self.M0);
        });
      })(x, t);
    }
  }
  std(nx, ny, o) {
    const P = this.rp(nx);
    if (this.op === 'kipp' && ny === 1) this.levers(0, 0, P.w, nx, o);
    else if (P.round && ny === 1) this.roundKeys(0, 0, P, nx, o);
    else this.rockers(0, 0, P.w, P.h, nx, ny, o, P);
    if (this.round) { this.screw(0, 18.9); this.screw(0, -18.9); }
  }
  kombi(n, type, o) {
    const K = this.L.kombi, R = this.L.rocker;
    if (this.round) this.big = true;
    if (this.op === 'kipp') this.levers(0, K.ry + 1, K.rw, n, o);
    else this.rockers(0, K.ry, K.rw, K.rh, n, 1, o, { r: Math.min(R.r, 2.4), er: R.er, proud: R.proud, tilt: R.tilt * 1.5 });
    this.socket(0, K.sy, 0, type, { screw: true });
  }

  /* --- Drehknöpfe, Anzeigen, Sensoren --- */
  knob(x, y, R, hgt, o) {
    const self = this; o = o || {};
    this.cut(cXf(cCircle(R + 0.55, 72), x, y, 0), 2.2);
    this.part(function () {
      const kit = self.kit;
      kit.setM(self.local(x, y, self.top));
      const gb = kit.b('body'), C = cCircle(R, 84), er = 1.1, pr = [];
      gb.cap(cOff(C, -er), [], hgt, 1);
      parc(pr, -er, hgt - er, er, 0, H_PI, 5); pr.push([0.35, -1.6, 1, 0]);
      gb.loft(C, pr);
      if (o.grip) {
        const Cb = cRRect(7, R * 1.86, 2.6), p2 = [], hz = hgt + 5;
        gb.cap(cOff(Cb, -0.8), [], hz, 1);
        parc(p2, -0.8, hz - 0.8, 0.8, 0, H_PI, 3); p2.push([0, hgt - 0.2, 1, 0]);
        gb.loft(Cb, p2);
        kit.b('ink').rect(0, R * 0.58, hz + 0.03, 1.0, R * 0.46, 0);
      } else kit.b('ink').rect(0, R * 0.62, hgt + 0.03, 1.1, R * 0.42, 0);
      kit.setM(self.M0);
    });
  }
  dimmer() { this.knob(0, 0, 16.5, 9.5); }
  rotary() {
    const self = this; this.big = true;
    this.knob(0, -4, 13, 6, { grip: 1 });
    this.part(function () {
      const ink = self.kit.b('ink');
      [['d0', 150], ['d1', 110], ['d2', 70], ['d3', 30]].forEach(function (q) {
        const a = q[1] * PI / 180; ink.sym(q[0], 21 * Math.cos(a), -4 + 21 * Math.sin(a), self.top + 0.03, 6.2);
      });
    });
  }
  thermoKnob() {
    const self = this; this.big = true;
    this.knob(0, 0, 15, 8);
    this.part(function () {
      const ink = self.kit.b('ink');
      for (let k = 0; k < 9; k++) {
        const a = (225 - k * 33.75) * PI / 180;
        ink.rect(20.2 * Math.cos(a), 20.2 * Math.sin(a), self.top + 0.03, 0.8, k % 4 === 0 ? 3.6 : 2.2, a - H_PI);
      }
    });
  }
  display(x, y, w, h, sym) {
    const self = this;
    this.cut(cXf(cRRect(w, h, 1.6), x, y, 0), 0.5, { lip: 0.2, floorMat: 'glass' });
    this.part(function () { self.kit.b('lcd').symWH(sym, x, y, self.top - 0.46, w * 0.66, w * 0.33, 0); });
  }
  smallKeys(y, w, h, n, o) {
    const sav = this.op; this.op = 'druck';
    this.rockers(0, y, w, h, n, 1, Object.assign({ flat: 1, proud: 1.3 }, o || {}), { r: 1.2, er: 0.5, proud: 1.3, tilt: 0 });
    this.op = sav;
  }
  thermoDisplay() { this.big = true; this.display(0, 8.5, 34, 21, 'temp'); this.smallKeys(-14.5, 31, 9, 2, { sym: ['minus', 'plus'], symSize: 5 }); }
  timer() { this.big = true; this.display(0, 9.5, 38, 19, 'time'); this.smallKeys(-14.5, 40, 8, 4); }
  motion() {
    const self = this; this.big = true;
    const C = cXf(cRRect(36, 26, 9.5), 0, 4, 0);
    this.cut(cOff(C, 0.3), 1.2, { lip: 0.2 });
    this.part(function () { self.kit.b('lens').dome(C, 0, 4, self.top - 1.0, 7.5, 10); });
    this.well(cXf(cCircle(1.3, 16), 0, -20, 0), 0.5, { lip: 0.15, draft: 0, fr: 0.05, floorMat: 'led:off' });
  }
  keySwitch() {
    const self = this, K = cRRect(1.7, 8, 0.6);
    this.well(cCircle(10.4, 60), 1.0, { lip: 0.4, draft: 0, fr: 0.15 });
    this.part(function () {
      const kit = self.kit, z0 = self.top - 1.0, zt = z0 + 1.3, m = kit.b('metal'), C = cCircle(8.8, 60), pr = [];
      parc(pr, -0.5, zt - 0.5, 0.5, 0, H_PI, 3); pr.push([0, z0, 1, 0]);
      m.loft(C, pr); m.cap(cOff(C, -0.5), [K], zt, 1);
      const d = kit.b('dark'); d.loft(K, [[0, zt, -1, 0], [0, z0 - 2, -1, 0]]); d.cap(K, [], z0 - 2, 1);
    });
  }

  /* --- Daten und Multimedia --- */
  rj45(n) {
    const self = this; if (n > 1) this.big = true;
    (n === 1 ? [0] : [-11.5, 11.5]).forEach(function (x) {
      const y = -4;
      const C = cXf(cPoly([
        { x: 5.95, y: -2.6, r: 0.3 }, { x: 5.95, y: 4.0, r: 0.3 }, { x: -5.95, y: 4.0, r: 0.3 }, { x: -5.95, y: -2.6, r: 0.3 },
        { x: -3.1, y: -2.6, r: 0.2 }, { x: -3.1, y: -4.3, r: 0.3 }, { x: 3.1, y: -4.3, r: 0.3 }, { x: 3.1, y: -2.6, r: 0.2 }]), x, y, 0);
      self.well(C, 10, { lip: 0.3, draft: 0, fr: 0.1, mat: 'jack', floorMat: 'dark' });
      self.cut(cXf(cRRect(13, 5, 0.6), x, 10.5, 0), 0.35, { lip: 0.15, floorMat: 'ivory' });
      self.part(function () {
        const g = self.kit.b('gold'), zt = self.top - 1.5, zb = self.top - 8.5;
        for (let k = 0; k < 8; k++) {
          const px = x - 3.57 + k * 1.02;
          g.q4([px - 0.22, y + 3.7, zt], [px + 0.22, y + 3.7, zt], [px + 0.22, y + 1.5, zb], [px - 0.22, y + 1.5, zb], 0, -0.954, 0.3);
        }
      });
    });
  }
  coax(x, y, kind) {
    const self = this;
    this.well(cXf(cCircle(6.6, 44), x, y, 0), 8.5, { lip: 0.5, draft: 0.2, fr: 0.3 });
    this.part(function () {
      const kit = self.kit, zf = self.top - 8.5, zt = self.top - 1.0, ro = kind === 'sat' ? 4.6 : 4.75;
      kit.setM(self.local(x, y, 0));
      const m = kit.b('metal'), C = cCircle(ro, 40), pr = [];
      if (kind === 'sat') { for (let k = 0; k <= 12; k++) pr.push([k % 2 ? 0.16 : 0, zf + (zt - zf) * k / 12, 1, 0]); }
      else { pr.push([0, zf, 1, 0], [0, zt, 1, 0]); }
      pr.push([0, zt, 0, 1], [-0.6, zt, 0, 1], [-0.6, zt, -1, 0], [-0.6, zf + 1.2, -1, 0]);
      m.loft(C, pr);
      const ri = ro - 0.6, hole = kind === 'm' ? 1.15 : 0.8;
      kit.b('ivory').cap(cCircle(ri, 32), [cCircle(hole, 12)], zf + 1.2, 1);
      if (kind === 'm') {
        const P = cCircle(1.15, 14); m.loft(P, [[0, zf + 1.2, 1, 0], [0, zt - 1.6, 1, 0], [-0.5, zt - 1.0, 0.6, 0.8]]); m.cap(cOff(P, -0.5), [], zt - 1.0, 1);
      } else {
        const P = cCircle(1.9, 18), Q = cCircle(0.8, 12);
        m.loft(P, [[0, zf + 1.2, 1, 0], [0, zt - 1.5, 1, 0], [0, zt - 1.5, 0, 1], [-1.1, zt - 1.5, 0, 1]]);
        const d = kit.b('dark'); d.loft(Q, [[0, zt - 1.5, -1, 0], [0, zf, -1, 0]]); d.cap(Q, [], zf, 1);
      }
      kit.setM(self.M0);
    });
  }
  coaxSet(n) {
    const self = this; this.big = true;
    const P = n === 2 ? [[-11, 1, 'm', 'R', -11], [11, 1, 'f', 'TV', -11]] : [[-12, -8, 'm', 'R', -19.5], [12, -8, 'f', 'TV', -19.5], [0, 9, 'sat', 'SAT', 20.5]];
    P.forEach(function (q) { self.coax(q[0], q[1], q[2]); });
    this.part(function () {
      const ink = self.kit.b('ink');
      P.forEach(function (q) { ink.symWH(q[3], q[0], q[4], self.top + 0.03, q[3] === 'SAT' ? 9 : 5.2, q[3] === 'SAT' ? 4.5 : 5.2, 0); });
    });
  }
  hdmi() {
    const self = this; this.big = true;
    const C = cXf(cPoly([
      { x: 7.5, y: -1.0, r: 0.3 }, { x: 7.5, y: 2.8, r: 0.4 }, { x: -7.5, y: 2.8, r: 0.4 },
      { x: -7.5, y: -1.0, r: 0.3 }, { x: -5.4, y: -2.8, r: 0.4 }, { x: 5.4, y: -2.8, r: 0.4 }]), 0, 9, 0);
    this.well(C, 9, { lip: 0.25, draft: 0, fr: 0.1, mat: 'metal', floorMat: 'dark' });
    this.part(function () { self.kit.b('jack').box(-5.6, 8.7, self.top - 9, 5.6, 9.5, self.top - 1.2); });
    this.usbA(0, -9);
  }

  /* --- Diverses --- */
  cableOut() { this.well(cCircle(5.2, 40), 5, { lip: 1.6, draft: 0, fr: 0.3, floorMat: 'dark' }); }
  nightLight() {
    this.big = true;
    this.cut(cXf(cRRect(44, 10, 5), 0, -12, 0), 0.6, { lip: 0.2, floorMat: 'glow' });
    this.well(cXf(cCircle(1.6, 18), 0, 14, 0), 0.5, { lip: 0.15, draft: 0, fr: 0.05, floorMat: 'glass' });
  }
  signal() {
    const self = this; this.big = true;
    [[-11, 'lensR'], [11, 'lensG']].forEach(function (q) {
      const C = cXf(cCircle(6.2, 44), q[0], 0, 0);
      self.cut(cOff(C, 0.3), 1.0, { lip: 0.2 });
      self.part(function () { self.kit.b(q[1]).dome(C, q[0], 0, self.top - 0.8, 3.4, 8); });
    });
  }

  diam() { const I = this.L.insert; return this.round ? (this.big ? I.dBig : I.d) : 0; }

  finish() {
    const L = this.L, I = L.insert, kit = this.kit, top = this.top;
    kit.setM(this.M0);
    if (this.round) {
      const d = this.diam(), bw = this.big ? I.beadBig : I.bead, bh = this.big ? I.beadBigH : I.beadH;
      const Ro = d / 2, a = bw / 2, pr = [];
      buildPlate(kit, { C: cCircle(Ro - bw, 96), top: top, bot: top - 4, er: 0, noEdge: true, wells: this.wells, cuts: this.cuts });
      for (let k = 0; k <= 10; k++) {
        const t = PI - k / 10 * PI;
        pr.push([-a + a * Math.cos(t), top + bh * Math.sin(t), Math.cos(t) / a, Math.sin(t) / bh]);
      }
      pr.push([0, top - 4, 1, 0]);
      kit.b('body').loft(cCircle(Ro, 96), pr);
    } else {
      if (I.screws) { const q = I.size / 2 - 5.5; this.screw(-q, -q); this.screw(q, -q); this.screw(q, q); this.screw(-q, q); }
      buildPlate(kit, { C: cRRect(I.size, I.size, I.r), top: top, bot: top - 4.5, er: I.er, wells: this.wells, cuts: this.cuts });
    }
    for (let i = 0; i < this.parts.length; i++) this.parts[i]();
    kit.setM(null);
    return this;
  }
}

/* ---------- Abdeckrahmen und Gehäuse ---------- */
function frameTop(F) { return F.style === 'roof' ? F.hIn : F.h; }

/* Aussenwand bis zur Wand; Gehäuse bekommen eine Fuge zwischen Sockel und Deckel */
function wallDown(pr, F) {
  const s = F.seam;
  if (s && s > 2) pr.push([0, s + 0.5, 1, 0], [-0.55, s + 0.15, 0.55, -0.83], [-0.55, s - 0.15, 0.55, 0.83], [0, s - 0.5, 1, 0]);
  pr.push([0, 0, 1, 0]);
}

function buildFrame(kit, L, F, cols, rows, info) {
  const P = L.pitch || PITCH, ow = cols * P, oh = rows * P, b = F.border, W = ow + 2 * b, H = oh + 2 * b;
  const g = kit.b('frame'), cl = 0.15;
  kit.setM(null);
  if (F.style === 'roof') {
    /* EDIZIOdue: vier leicht geneigte Flächen mit Gehrungslinien in den Ecken */
    const a = ow / 2 + cl, bb = oh / 2 + cl, hO = F.hOut, hI = F.hIn, er = F.er, rc = F.rc, rr = rc - er;
    const Co = cRRect(W, H, rc), pr = [];
    parc(pr, -er, hO - er, er, 0, H_PI, 3); wallDown(pr, F);
    g.loft(Co, pr);
    const slope = (hI - hO) / (b - cl - er), nl = Math.hypot(slope, 1), ccx = W / 2 - rc, ccy = H / 2 - rc, K = 4;
    [
      { n: [1, 0], i0: [a, -bb], i1: [a, bb], c0: [ccx, -ccy], c1: [ccx, ccy], a0: -PI / 4 },
      { n: [0, 1], i0: [a, bb], i1: [-a, bb], c0: [ccx, ccy], c1: [-ccx, ccy], a0: PI / 4 },
      { n: [-1, 0], i0: [-a, bb], i1: [-a, -bb], c0: [-ccx, ccy], c1: [-ccx, -ccy], a0: 3 * PI / 4 },
      { n: [0, -1], i0: [-a, -bb], i1: [a, -bb], c0: [-ccx, -ccy], c1: [ccx, -ccy], a0: 5 * PI / 4 }
    ].forEach(function (s) {
      const nx = s.n[0] * slope / nl, ny = s.n[1] * slope / nl, nz = 1 / nl, outer = [];
      for (let k = 0; k <= K; k++) { const an = s.a0 + k / K * PI / 4; outer.push([s.c0[0] + rr * Math.cos(an), s.c0[1] + rr * Math.sin(an)]); }
      for (let k = 0; k <= K; k++) { const an = s.a0 + PI / 4 + k / K * PI / 4; outer.push([s.c1[0] + rr * Math.cos(an), s.c1[1] + rr * Math.sin(an)]); }
      const vi0 = g.v(s.i0[0], s.i0[1], hI, nx, ny, nz), vi1 = g.v(s.i1[0], s.i1[1], hI, nx, ny, nz);
      const vo = outer.map(function (p) { return g.v(p[0], p[1], hO, nx, ny, nz); });
      for (let k = 0; k < K; k++) g.tri(vi0, vo[k], vo[k + 1]);
      g.tri(vi0, vo[K], vo[K + 1]); g.tri(vi0, vo[K + 1], vi1);
      for (let k = K + 1; k < vo.length - 1; k++) g.tri(vi1, vo[k], vo[k + 1]);
    });
    const Ci = cRRect(2 * a, 2 * bb, 0);
    g.loft(Ci, [[0, hI, -1, 0], [0, hI - 5, -1, 0]]);
  } else if (F.style === 'pillow') {
    /* STANDARDdue: eine Platte mit runden Ausschnitten */
    const Co = cRRect(W, H, F.rc), er = F.er, h = F.h, pr = [];
    const holes = info.map(function (s) { return cXf(cCircle(s.d / 2 + 0.12, 96), s.x, s.y, 0); });
    g.cap(cOff(Co, -er), holes.map(function (c) { return cOff(c, 0.2); }), h, 1);
    parc(pr, -er, h - er, er, 0, H_PI, 9); wallDown(pr, F);
    g.loft(Co, pr);
    holes.forEach(function (c) {
      const p2 = []; parc(p2, 0.2, h - 0.2, 0.2, 0, -H_PI, 2); p2.push([0, h - 4.5, -1, 0]);
      g.loft(c, p2);
    });
  } else if (F.style === 'units') {
    /* Nass-Sortiment: Gehäuse oder Platte mit einem Ausschnitt je Einheit */
    const Co = cRRect(W, H, F.rc), er = F.er, h = F.h, pr = [], I = L.insert;
    const holes = info.map(function (s) { return cXf(cRRect(I.size + 0.5, I.size + 0.5, I.r + 0.25), s.x, s.y, 0); });
    g.cap(cOff(Co, -er), holes.map(function (c) { return cOff(c, 0.25); }), h, 1);
    parc(pr, -er, h - er, er, 0, H_PI, 7); wallDown(pr, F);
    g.loft(Co, pr);
    holes.forEach(function (c) {
      const p2 = []; parc(p2, 0.25, h - 0.25, 0.25, 0, -H_PI, 2); p2.push([0, h - 4, -1, 0]);
      g.loft(c, p2);
    });
    if (F.box) {
      /* Kabeleinführungen mit Membran auf der Oberseite */
      for (let c = 0; c < cols; c++) [-15, 15].forEach(function (dx) {
        kit.setM(M4().makeTranslation((c - (cols - 1) / 2) * P + dx, H / 2, F.seam * 0.5 + 1).multiply(M4().makeRotationX(-H_PI)));
        g.loft(cCircle(9.5, 44), [[0, -0.5, 1, 0], [0, 0.9, 1, 0], [0, 0.9, 0, 1], [-1.3, 0.9, 0, 1], [-1.3, 0.9, -1, 0], [-1.3, 0.25, -1, 0]]);
        g.cap(cCircle(8.2, 40), [], 0.25, 1);
      });
      kit.setM(null);
    }
  } else {
    const Co = cRRect(W, H, F.rc), Ci = cRRect(ow + 2 * cl, oh + 2 * cl, Math.max(0.3, L.insert.r || 0.5));
    const er = F.er, ir = 0.25, h = F.h, pr = [], p2 = [];
    g.cap(cOff(Co, -er), [cOff(Ci, ir)], h, 1);
    parc(pr, -er, h - er, er, 0, H_PI, Math.max(3, Math.ceil(er * 3.2))); wallDown(pr, F);
    g.loft(Co, pr);
    parc(p2, ir, h - ir, ir, 0, -H_PI, 2); p2.push([0, h - 5, -1, 0]);
    g.loft(Ci, p2);
  }
  /* dunkler Abschluss hinter den Einsätzen */
  kit.b('dark').cap(cRRect(ow + 2, oh + 2, 0), [], F.box ? 1 : -27, 1);
  return { W: W, H: H, ow: ow, oh: oh };
}

/* ganze Kombination: Einsätze + Rahmen */
function buildCombination(kit, cfg) {
  const L = cfg.L, F = cfg.F, cols = cfg.cols, rows = cfg.rows, P = L.pitch || PITCH;
  const top = frameTop(F) + L.insert.proud, info = [], opt = { op: cfg.op, lid: cfg.lid };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const s = cfg.slots[r * cols + c], x = (c - (cols - 1) / 2) * P, y = ((rows - 1) / 2 - r) * P;
    const M = M4().makeTranslation(x, y, 0).multiply(M4().makeRotationZ(-(s.rot || 0) * H_PI));
    const b = new IB(kit, L, M, top, s, opt);
    (ITEM[s.item] || ITEM.blind).b(b);
    b.finish();
    info.push({ x: x, y: y, d: b.diam() });
  }
  const d = buildFrame(kit, L, F, cols, rows, info);
  return { W: d.W, H: d.H, ow: d.ow, oh: d.oh, top: top, pitch: P, hole: !F.box };
}

/* einzelner Einsatz für Vorschaubilder */
function buildSingle(kit, L, itemId, opt) {
  const b = new IB(kit, L, M4(), 0, {}, opt);
  (ITEM[itemId] || ITEM.blind).b(b);
  b.finish();
  return b;
}
