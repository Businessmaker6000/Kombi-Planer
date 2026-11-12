/* ================================================================
   01 · Geometrie-Baukasten
   Alle Masse in Millimetern. x = rechts, y = oben, z = aus der Wand.
   Eine Kontur ist eine Liste von Punkten {x,y,nx,ny} im Gegenuhrzeigersinn
   mit nach aussen zeigender Normalen. Scharfe Ecken = doppelter Punkt.
   ================================================================ */
const T = window.THREE;
const PI = Math.PI, H_PI = Math.PI / 2;

function pt(x, y, nx, ny) { return { x: x, y: y, nx: nx, ny: ny }; }

/* Polygon mit verrundeten Ecken. verts: [{x,y,r}] im Gegenuhrzeigersinn */
function cPoly(verts, seg) {
  seg = seg || 0.6;
  const n = verts.length, out = [];
  for (let i = 0; i < n; i++) {
    const P = verts[i], A = verts[(i + n - 1) % n], B = verts[(i + 1) % n];
    let ux = A.x - P.x, uy = A.y - P.y, vx = B.x - P.x, vy = B.y - P.y;
    const ul = Math.hypot(ux, uy), vl = Math.hypot(vx, vy);
    ux /= ul; uy /= ul; vx /= vl; vy /= vl;
    const n1x = -uy, n1y = ux, n2x = vy, n2y = -vx;
    const cross = (-ux) * vy - (-uy) * vx;
    const ang = Math.acos(Math.max(-1, Math.min(1, n1x * n2x + n1y * n2y)));
    const r = P.r || 0;
    if (ang < 1e-4) { out.push(pt(P.x, P.y, n1x, n1y)); continue; }
    if (r < 1e-6) { out.push(pt(P.x, P.y, n1x, n1y), pt(P.x, P.y, n2x, n2y)); continue; }
    const t = r * Math.tan(ang / 2);
    const sg = cross >= 0 ? 1 : -1;
    const p1x = P.x + ux * t, p1y = P.y + uy * t;
    const cx = p1x - sg * n1x * r, cy = p1y - sg * n1y * r;
    const steps = Math.max(2, Math.ceil(ang * r / seg), Math.ceil(ang / (PI / 18)));
    const a0 = Math.atan2(n1y, n1x);
    for (let k = 0; k <= steps; k++) {
      const a = a0 + sg * ang * k / steps, nx = Math.cos(a), ny = Math.sin(a);
      out.push(pt(cx + sg * r * nx, cy + sg * r * ny, nx, ny));
    }
  }
  return out;
}

function cRRect(w, h, r, seg) {
  const a = w / 2, b = h / 2;
  r = Math.max(0, Math.min(r, a - 1e-3, b - 1e-3));
  return cPoly([{ x: a, y: -b, r: r }, { x: a, y: b, r: r }, { x: -a, y: b, r: r }, { x: -a, y: -b, r: r }], seg);
}

function cCircle(r, n) {
  n = n || Math.max(20, Math.ceil(2 * PI * r / 0.7));
  const o = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * 2 * PI;
    o.push(pt(r * Math.cos(a), r * Math.sin(a), Math.cos(a), Math.sin(a)));
  }
  return o;
}

/* Sechseck nach SN 441011: Seiten unter 45°, Spitzen leicht, Übergänge gross verrundet */
function cHex(W, Hh, rt, rf) {
  const xt = W / 2 + 0.4142 * rt, hh = Hh / 2, xf = xt - hh;
  return cPoly([
    { x: xt, y: 0, r: rt }, { x: xf, y: hh, r: rf }, { x: -xf, y: hh, r: rf },
    { x: -xt, y: 0, r: rt }, { x: -xf, y: -hh, r: rf }, { x: xf, y: -hh, r: rf }]);
}

function cXf(C, tx, ty, rot) {
  const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
  return C.map(function (p) {
    return pt(p.x * c - p.y * s + tx, p.x * s + p.y * c + ty, p.nx * c - p.ny * s, p.nx * s + p.ny * c);
  });
}

function cOff(C, d) {
  if (!d) return C;
  return C.map(function (p) { return pt(p.x + p.nx * d, p.y + p.ny * d, p.nx, p.ny); });
}

/* Kontur aus rohen Polygonpunkten, Normalen aus den Kanten (Knick ab ~29°) */
function cFromPts(P, crease) {
  crease = crease || 0.5;
  const Q = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = Q[Q.length - 1];
    if (!b || Math.hypot(a.x - b.x, a.y - b.y) > 1e-4) Q.push(a);
  }
  if (Q.length > 1 && Math.hypot(Q[0].x - Q[Q.length - 1].x, Q[0].y - Q[Q.length - 1].y) < 1e-4) Q.pop();
  const m = Q.length, out = [];
  for (let i = 0; i < m; i++) {
    const p = Q[i], a = Q[(i + m - 1) % m], b = Q[(i + 1) % m];
    let d1x = p.x - a.x, d1y = p.y - a.y, d2x = b.x - p.x, d2y = b.y - p.y;
    const l1 = Math.hypot(d1x, d1y), l2 = Math.hypot(d2x, d2y);
    d1x /= l1; d1y /= l1; d2x /= l2; d2y /= l2;
    const n1x = d1y, n1y = -d1x, n2x = d2y, n2y = -d2x;
    const ang = Math.acos(Math.max(-1, Math.min(1, n1x * n2x + n1y * n2y)));
    if (ang > crease) out.push(pt(p.x, p.y, n1x, n1y), pt(p.x, p.y, n2x, n2y));
    else { const nx = n1x + n2x, ny = n1y + n2y, l = Math.hypot(nx, ny) || 1; out.push(pt(p.x, p.y, nx / l, ny / l)); }
  }
  return out;
}

/* Konvexe Kontur an einem Kreis (Mittelpunkt 0/0) beschneiden */
function clipCircle(C, R, N) {
  let needs = false;
  for (let i = 0; i < C.length; i++) if (C[i].x * C[i].x + C[i].y * C[i].y > R * R) { needs = true; break; }
  if (!needs) return C;
  N = N || 90;
  let poly = C.map(function (p) { return { x: p.x, y: p.y }; });
  const lim = R * Math.cos(PI / N);
  for (let i = 0; i < N && poly.length; i++) {
    const a = (i + 0.5) / N * 2 * PI, nx = Math.cos(a), ny = Math.sin(a), out = [];
    for (let j = 0; j < poly.length; j++) {
      const p = poly[j], q = poly[(j + 1) % poly.length];
      const dp = p.x * nx + p.y * ny - lim, dq = q.x * nx + q.y * ny - lim;
      if (dp <= 0) out.push(p);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
        const t = dp / (dp - dq);
        out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
      }
    }
    poly = out;
  }
  return cFromPts(poly);
}

/* Profilbogen: d = dc + r·sin a, z = zc + r·cos a, Normale = sgn·(sin a, cos a) */
function parc(out, dc, zc, r, a0, a1, steps, sgn) {
  sgn = sgn || 1;
  for (let k = 0; k <= steps; k++) {
    const a = a0 + (a1 - a0) * k / steps, s = Math.sin(a), c = Math.cos(a);
    out.push([dc + r * s, zc + r * c, sgn * s, sgn * c]);
  }
  return out;
}

/* Symbol-Atlas (UV-Rechtecke), wird in 04-stage gezeichnet */
const SYMUV = {};

/* ---------- Geometrie-Sammler ---------- */
class GB {
  constructor(kit) { this.kit = kit; this.p = []; this.n = []; this.u = []; this.i = []; }

  v(x, y, z, nx, ny, nz, u, w) {
    const m = this.kit && this.kit.m;
    if (m) {
      const e = m.elements;
      const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      const NX = e[0] * nx + e[4] * ny + e[8] * nz, NY = e[1] * nx + e[5] * ny + e[9] * nz, NZ = e[2] * nx + e[6] * ny + e[10] * nz;
      x = X; y = Y; z = Z; nx = NX; ny = NY; nz = NZ;
    }
    if (this.kit && this.kit.dx) x += this.kit.dx;
    const l = Math.hypot(nx, ny, nz) || 1;
    this.p.push(x, y, z); this.n.push(nx / l, ny / l, nz / l);
    if (u !== undefined) this.u.push(u, w); else this.u.push(x * 0.02, y * 0.02);
    return this.p.length / 3 - 1;
  }

  /* Dreieck, Umlaufsinn wird an den Normalen ausgerichtet */
  tri(a, b, c) {
    const p = this.p, n = this.n;
    const ax = p[a * 3], ay = p[a * 3 + 1], az = p[a * 3 + 2];
    const e1x = p[b * 3] - ax, e1y = p[b * 3 + 1] - ay, e1z = p[b * 3 + 2] - az;
    const e2x = p[c * 3] - ax, e2y = p[c * 3 + 1] - ay, e2z = p[c * 3 + 2] - az;
    const fx = e1y * e2z - e1z * e2y, fy = e1z * e2x - e1x * e2z, fz = e1x * e2y - e1y * e2x;
    if (fx * fx + fy * fy + fz * fz < 1e-13) return;
    const sx = n[a * 3] + n[b * 3] + n[c * 3], sy = n[a * 3 + 1] + n[b * 3 + 1] + n[c * 3 + 1], sz = n[a * 3 + 2] + n[b * 3 + 2] + n[c * 3 + 2];
    if (fx * sx + fy * sy + fz * sz < 0) this.i.push(a, c, b); else this.i.push(a, b, c);
  }
  quad(a, b, c, d) { this.tri(a, b, c); this.tri(a, c, d); }

  /* Kontur entlang eines Profils [[d,z,nd,nz],…] ziehen */
  loft(C, prof) {
    const n = C.length, m = prof.length, rings = [];
    for (let j = 0; j < m; j++) {
      const q = prof[j], ring = new Array(n);
      for (let i = 0; i < n; i++) {
        const c = C[i];
        ring[i] = this.v(c.x + c.nx * q[0], c.y + c.ny * q[0], q[1], c.nx * q[2], c.ny * q[2], q[3]);
      }
      rings.push(ring);
    }
    for (let j = 0; j < m - 1; j++) {
      const A = rings[j], B = rings[j + 1];
      for (let i = 0; i < n; i++) { const k = (i + 1) % n; this.quad(A[i], A[k], B[k], B[i]); }
    }
  }

  /* ebene Fläche mit Löchern */
  cap(C, holes, z, up) {
    holes = holes || []; up = up || 1;
    const v2 = function (p) { return new T.Vector2(p.x, p.y); };
    const faces = T.ShapeUtils.triangulateShape(C.map(v2), holes.map(function (h) { return h.map(v2); }));
    let all = C;
    for (let i = 0; i < holes.length; i++) all = all.concat(holes[i]);
    const ids = new Array(all.length);
    for (let i = 0; i < all.length; i++) ids[i] = this.v(all[i].x, all[i].y, z, 0, 0, up);
    for (let i = 0; i < faces.length; i++) this.tri(ids[faces[i][0]], ids[faces[i][1]], ids[faces[i][2]]);
  }

  q4(a, b, c, d, nx, ny, nz) {
    const s = this, f = function (q) { return s.v(q[0], q[1], q[2], nx, ny, nz); };
    this.quad(f(a), f(b), f(c), f(d));
  }

  box(x0, y0, z0, x1, y1, z1) {
    this.q4([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0, 0, 1);
    this.q4([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], 0, 0, -1);
    this.q4([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], 0, -1, 0);
    this.q4([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], 0, 1, 0);
    this.q4([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], -1, 0, 0);
    this.q4([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], 1, 0, 0);
  }

  /* bedrucktes Symbol aus dem Atlas */
  symWH(name, cx, cy, z, w, h, rot) {
    const uv = SYMUV[name] || SYMUV.solid || [0, 0, 1, 1];
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0), self = this;
    const P = [[-w / 2, -h / 2, uv[0], uv[1]], [w / 2, -h / 2, uv[2], uv[1]], [w / 2, h / 2, uv[2], uv[3]], [-w / 2, h / 2, uv[0], uv[3]]]
      .map(function (q) { return self.v(cx + q[0] * c - q[1] * s, cy + q[0] * s + q[1] * c, z, 0, 0, 1, q[2], q[3]); });
    this.quad(P[0], P[1], P[2], P[3]);
  }
  sym(name, cx, cy, z, size, rot) { this.symWH(name, cx, cy, z, size, size, rot); }
  rect(cx, cy, z, w, h, rot) { this.symWH('solid', cx, cy, z, w, h, rot); }

  /* Kuppel über einer Kontur */
  dome(C, cx, cy, z0, bulge, rings) {
    const n = C.length; let prev = null;
    for (let k = 0; k <= rings; k++) {
      const a = k / rings * H_PI, s = Math.cos(a), z = z0 + bulge * Math.sin(a), ring = new Array(n);
      for (let i = 0; i < n; i++) {
        const c = C[i], dx = c.x - cx, dy = c.y - cy, dl = Math.hypot(dx, dy) || 1;
        ring[i] = this.v(cx + dx * s, cy + dy * s, z, c.nx * Math.cos(a) / dl, c.ny * Math.cos(a) / dl, Math.sin(a) / bulge + 1e-6);
      }
      if (prev) for (let i = 0; i < n; i++) { const j = (i + 1) % n; this.quad(prev[i], prev[j], ring[j], ring[i]); }
      prev = ring;
    }
  }

  get empty() { return this.i.length === 0; }

  geometry() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(this.u, 2));
    g.setIndex(this.i);
    return g;
  }
}

/* Ein Kit sammelt Geometrie getrennt nach Material */
class Kit {
  /* dx: Verschiebung in x für einen Rahmen der Reihe, wirkt auf alle seine Teile */
  constructor() { this.g = {}; this.m = null; this.dx = 0; }
  b(name) { return this.g[name] || (this.g[name] = new GB(this)); }
  setM(m) { this.m = m || null; }
}
