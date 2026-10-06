// Geometry builders. blob() is the workhorse: a superellipsoid you can sculpt with a deform function.
import * as T from 'three';
import { rng } from './math.js';

// ---------- geometry ----------
// merge vertices that share a position, so normals are smooth across seams
export function weld(g) {
  var p = g.attributes.position, idx = g.index ? g.index.array : null, map = {}, np = [], remap = new Uint32Array(p.count);
  for (var i = 0; i < p.count; i++) {
    var x = p.getX(i), y = p.getY(i), z = p.getZ(i), key = Math.round(x * 1e4) + '_' + Math.round(y * 1e4) + '_' + Math.round(z * 1e4);
    if (map[key] === undefined) { map[key] = np.length / 3; np.push(x, y, z); }
    remap[i] = map[key];
  }
  var tri = [], n = idx ? idx.length : p.count;
  for (var t = 0; t < n; t += 3) {
    var a = remap[idx ? idx[t] : t], b = remap[idx ? idx[t + 1] : t + 1], c = remap[idx ? idx[t + 2] : t + 2];
    if (a !== b && b !== c && a !== c) tri.push(a, b, c);
  }
  var out = new T.BufferGeometry();
  out.setAttribute('position', new T.Float32BufferAttribute(np, 3));
  out.setIndex(tri);
  out.computeVertexNormals();
  return out;
}

// a superellipsoid: e = 1 is an ellipsoid, smaller is boxier; def(x, y, z) sculpts it
export function blob(w, h, d, e, def, ws, hs) {
  var g = new T.SphereGeometry(1, ws || 30, hs || 20), p = g.attributes.position;
  function f(v) { return Math.sign(v) * Math.pow(Math.abs(v), e); }
  for (var i = 0; i < p.count; i++) {
    var x = f(p.getX(i)) * w / 2, y = f(p.getY(i)) * h / 2, z = f(p.getZ(i)) * d / 2;
    if (def) { var r = def(x, y, z, w / 2, h / 2, d / 2); x = r[0]; y = r[1]; z = r[2]; }
    p.setXYZ(i, x, y, z);
  }
  return weld(g);
}

// a tube along points whose radius runs from r0 to r1
export function ttube(pts, r0, r1, radial, segs, closed) {
  segs = segs || 18; radial = radial || 8;
  var curve = new T.CatmullRomCurve3(pts.map(function (a) { return new T.Vector3(a[0], a[1], a[2]); }), !!closed);
  var g = new T.TubeGeometry(curve, segs, 1, radial, !!closed), p = g.attributes.position, n = g.attributes.normal;
  for (var i = 0; i < p.count; i++) {
    var t = Math.floor(i / (radial + 1)) / segs, r = r0 + (r1 - r0) * Math.pow(t, .9);
    p.setXYZ(i, p.getX(i) - n.getX(i) + n.getX(i) * r, p.getY(i) - n.getY(i) + n.getY(i) * r, p.getZ(i) - n.getZ(i) + n.getZ(i) * r);
  }
  g.computeVertexNormals();
  return g;
}

export function lathe(profile, seg) { return new T.LatheGeometry(profile.map(function (a) { return new T.Vector2(a[0], a[1]); }), seg || 10); }

export function flameGeo(s, lean) {
  var g = lathe([[0, 0], [.42, .1], [.56, .3], [.5, .55], [.36, .8], [.2, 1.05], [.08, 1.3], [0, 1.52]].map(function (a) { return [a[0] * .34 * s, a[1] * .62 * s]; }), 10);
  var p = g.attributes.position, H = .94 * s;
  for (var i = 0; i < p.count; i++) { var y = p.getY(i) / H; p.setX(i, p.getX(i) - lean * y * y * .45 * s); }
  g.computeVertexNormals();
  return g;
}

export function crystalGeo(r, h) { return lathe([[0, 0], [r, .02], [r * .96, h * .7], [0, h]], 6); }

export function leafGeo(len, wid) {
  var s = new T.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(wid * .62, len * .18, wid * .55, len * .72, 0, len); s.bezierCurveTo(-wid * .55, len * .72, -wid * .62, len * .18, 0, 0);
  var g = new T.ShapeGeometry(s, 8), p = g.attributes.position;
  for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i) / len; p.setZ(i, Math.abs(x) * .55 - y * y * len * .22); }
  g.computeVertexNormals();
  return g;
}

export function lumpGeo(r, seed, detail) {
  var g = weld(new T.IcosahedronGeometry(r, detail == null ? 1 : detail)), p = g.attributes.position, q = rng(seed);
  for (var i = 0; i < p.count; i++) { var k = 1 + (q() - .5) * .34; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * .8, p.getZ(i) * k); }
  g.computeVertexNormals();
  return g;
}
