// Placing parts on a creature (part, seg, shard, lock, feather, wings...) and finish(), which bakes
// colour, ground gradient and contact shading into every part's vertices once, at build time.
import * as T from 'three';
import { mix } from './math.js';
import { blob, flameGeo, weld } from './geometry.js';
import { MAT, glowMat } from './materials.js';

// ---------- placing parts ----------
export var UP = new T.Vector3(0, 1, 0);

// look = { c: colour or fn(worldPos, worldNormal) -> Color, m: material key, noAO, noOcc }
export function part(parent, geo, look, x, y, z, rx, ry, rz) {
  var mesh = new T.Mesh(geo, MAT[look.m || 'matte']);
  mesh.position.set(x || 0, y || 0, z || 0);
  mesh.rotation.set(rx || 0, ry || 0, rz || 0);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData.look = look;
  parent.add(mesh);
  return mesh;
}

export function glow(parent, geo, color, x, y, z, rx, ry, rz, op) {
  var mesh = new T.Mesh(geo, glowMat(color, op));
  mesh.position.set(x || 0, y || 0, z || 0);
  mesh.rotation.set(rx || 0, ry || 0, rz || 0);
  parent.add(mesh);
  return mesh;
}

// a limb segment from a (top) to b (bottom), radius r0 at a and r1 at b
export function seg(parent, a, b, r0, r1, look, e, flatZ) {
  var A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]);
  var u = A.clone().sub(B), len = u.length(); u.normalize();
  var R = Math.max(r0, r1), H = len + (r0 + r1) * .85;
  var geo = blob(R * 2, H, R * 2 * (flatZ || 1), e || .9, function (x, y, z) {
    var t = (y / (H / 2) + 1) / 2, s = (r1 + (r0 - r1) * t) / R;
    return [x * s, y, z * s];
  }, 22, 16);
  var mesh = part(parent, geo, look);
  mesh.position.copy(A).add(B).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(UP, u);
  return mesh;
}

// a cone or shard pointing along dir from base point
export function shard(parent, r, h, sides, look, base, dir, spin) {
  var g = new T.ConeGeometry(r, h, sides || 5); g.translate(0, h / 2, 0);
  var mesh = part(parent, g, look);
  mesh.position.set(base[0], base[1], base[2]);
  var d = new T.Vector3(dir[0], dir[1], dir[2]).normalize();
  mesh.quaternion.setFromUnitVectors(UP, d);
  if (spin) mesh.rotateY(spin);
  return mesh;
}

// a lock of fur: a soft tapered blade, wide in X, thin in Z, bent toward +Z by curl; tipT (0 root, 1 tip) is kept for colouring
export function lockGeo(len, wid, thick, curl) {
  var g = new T.SphereGeometry(1, 8, 10), p = g.attributes.position;
  for (var i = 0; i < p.count; i++) {
    var x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (y + 1) / 2, rho = Math.sqrt(x * x + z * z) || 1;
    var w = Math.pow(Math.sin(Math.PI * Math.pow(t, .5)), .5) * (1 - .12 * t);
    p.setXYZ(i, x / rho * w * wid / 2, t * len, z / rho * w * thick / 2 + curl * t * t * len);
  }
  var out = weld(g), q = out.attributes.position, tt = new Float32Array(q.count);
  for (var j = 0; j < q.count; j++) tt[j] = Math.min(1, Math.max(0, q.getY(j) / len));
  out.setAttribute('tipT', new T.BufferAttribute(tt, 1));
  return out;
}

// lays geo from base with its +Y along dir and its +Z toward nrm (the way a surface faces)
export function place(parent, geo, look, base, dir, nrm) {
  var y = new T.Vector3(dir[0], dir[1], dir[2]).normalize(), z = new T.Vector3(nrm[0], nrm[1], nrm[2]);
  z.addScaledVector(y, -z.dot(y));
  if (z.lengthSq() < 1e-4) z.set(0, 0, 1).addScaledVector(y, -y.z);
  z.normalize();
  var x = new T.Vector3().crossVectors(y, z);
  var mesh = part(parent, geo, look);
  mesh.position.set(base[0], base[1], base[2]);
  mesh.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
  return mesh;
}

export function lock(parent, look, base, dir, nrm, len, wid, thick, curl) { return place(parent, lockGeo(len, wid, thick, curl), look, base, dir, nrm); }

// a feather: long in +Y, soft-pointed, its sides lifted a little and its tip drooping by bow; tipT runs 0 at the quill to 1 at the tip
export function featherGeo(len, wid, bow) {
  var s = new T.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(wid * .55, len * .25, wid * .6, len * .75, 0, len); s.bezierCurveTo(-wid * .6, len * .75, -wid * .55, len * .25, 0, 0);
  var g = new T.ShapeGeometry(s, 10), p = g.attributes.position, tt = new Float32Array(p.count);
  for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i) / len; tt[i] = y; p.setZ(i, Math.abs(x) * .4 - y * y * (bow || 0) * len); }
  g.setAttribute('tipT', new T.BufferAttribute(tt, 1));
  g.computeVertexNormals();
  return g;
}

export function feather(parent, look, base, dir, nrm, len, wid, bow) { return place(parent, featherGeo(len, wid, bow), look, base, dir, nrm); }

// a flat plate cut from an outline of [x, y] points, given depth and centred on z = 0
export function plateGeo(pts, depth, bevel) {
  var sh = new T.Shape();
  pts.forEach(function (q, i) { if (i) sh.lineTo(q[0], q[1]); else sh.moveTo(q[0], q[1]); });
  var g = new T.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, -depth / 2);
  return g;
}

// a wing in three hinged parts (arm, forearm, hand) with rows of feathers; o holds sizes and feather looks
export function wingKit(body, s, o) {
  var k = o.k, W = new T.Group(), F = new T.Group(), H = new T.Group(), UPV = [0, 1, 0], i, t, ang;
  W.position.set(o.x, o.y, s * o.z); W.scale.set(o.sc, o.sc, s * o.sc); body.add(W);
  F.position.set(-.1 * k, .04, .85 * k); W.add(F);
  H.position.set(-.18 * k, .03, .85 * k); F.add(H);
  seg(W, [0, 0, 0], [-.1 * k, .04, .85 * k], o.r, o.r * .7, o.body);
  seg(F, [0, 0, 0], [-.18 * k, .03, .85 * k], o.r * .7, o.r * .5, o.body);
  seg(H, [0, 0, 0], [-.25 * k, .02, .75 * k], o.r * .5, o.r * .3, o.body);
  for (i = 0; i < 5; i++) { t = i / 4; feather(W, o.sec, [-.1 * k * t, .02, .85 * k * t], [-1, -.02, -.05 + .1 * t], UPV, (1.0 - t * .1) * k * o.L, .26 * k * o.Wd, .14); }
  for (i = 0; i < 8; i++) { t = i / 7; ang = 1.3 - t * .25; feather(F, o.sec, [-.18 * k * t, 0, .85 * k * t], [-Math.sin(ang), -.03, Math.cos(ang)], UPV, (1.25 - t * .1) * k * o.L, .26 * k * o.Wd, .16); }
  var np = o.np || 9, sp = o.spread || 1.12;
  for (i = 0; i < np; i++) {
    t = i / (np - 1); ang = sp - t * sp * .9;
    feather(H, o.prim, [-.25 * k * t, .01 - i * .003, .75 * k * t], [-Math.sin(ang), -.02 + (o.tipUp || 0) * t, Math.cos(ang)], UPV, (1.05 + t * .65) * k * o.L, .24 * k * o.Wd * (o.slot || 1), .22);
  }
  for (i = 0; i < 7; i++) { t = i / 6; ang = 1.3 - t * .25; feather(F, o.cov, [-.18 * k * t, .035, .85 * k * t], [-Math.sin(ang), -.03, Math.cos(ang)], UPV, .62 * k, .2 * k, .14); }
  for (i = 0; i < 7; i++) { t = i / 6; ang = sp - t * sp * .9; feather(H, o.cov, [-.25 * k * t, .03, .75 * k * t], [-Math.sin(ang), -.02, Math.cos(ang)], UPV, .6 * k, .18 * k, .14); }
  for (i = 0; i < 5; i++) { t = i / 4; feather(W, o.cov, [-.1 * k * t, .05, .85 * k * t], [-1, -.02, 0], UPV, .6 * k, .2 * k, .1); }
  return { W: W, F: F, H: H, s: s };
}

// one beat of a wing from wingKit: the arm leads, the forearm and hand follow a moment later; the left wing is mirrored, so only its arm flips
export function beatWing(w, sp, a) {
  var sg = w.s > 0 ? -1 : 1;
  w.W.rotation.x = sg * (Math.sin(sp) * a + a * .2);
  w.F.rotation.x = -Math.sin(sp - .5) * a * .6;
  w.H.rotation.x = -Math.sin(sp - 1.0) * a * .9;
}

// geo placed on the line a to b at fraction t, its +Y along the limb
export function onLimb(parent, geo, look, a, b, t) {
  var A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]);
  var mesh = part(parent, geo, look);
  mesh.position.copy(A).lerp(B, t);
  mesh.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
  return mesh;
}

// a solid ring around a limb
export function band(parent, look, a, b, t, r, hh, taper) { return onLimb(parent, new T.CylinderGeometry(r * (taper || 1), r, hh, 18, 1), look, a, b, t); }

// Bake colour, a soft ground gradient and contact shading into each part's vertices.
export function finish(root, H) {
  root.updateMatrixWorld(true);
  var meshes = [], occ = [];
  root.traverse(function (o) {
    if (!o.isMesh || !o.userData.look) return;
    meshes.push(o);
    o.geometry.computeBoundingBox();
    var bb = o.geometry.boundingBox, sz = bb.getSize(new T.Vector3());
    if (sz.x * sz.y * sz.z > .003 && !o.userData.look.noOcc) {
      var c = bb.getCenter(new T.Vector3()), hs = sz.clone().multiplyScalar(.5 * .86);
      occ.push({ m: o, inv: o.matrixWorld.clone().invert(), c: c, hs: hs, sc: o.matrixWorld.getMaxScaleOnAxis() });
    }
  });
  var p = new T.Vector3(), n = new T.Vector3(), q = new T.Vector3(), l = new T.Vector3(), nm = new T.Matrix3(), col = new T.Color();
  meshes.forEach(function (m) {
    var g = m.geometry, P = g.attributes.position, N = g.attributes.normal, tipT = g.attributes.tipT, out = new Float32Array(P.count * 3), look = m.userData.look;
    nm.getNormalMatrix(m.matrixWorld);
    for (var i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
      n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      if (typeof look.c === 'function') col.copy(look.c(p, n)); else col.set(look.c);
      if (tipT) {
        var kt = tipT.getX(i);
        if (look.g) col.copy(kt < .5 ? mix(look.g[0], look.g[1], kt * 2) : mix(look.g[1], look.g[2], (kt - .5) * 2));
        else { if (look.tip) col.lerp(look.tip, kt * (look.tipAmt || .55)); col.multiplyScalar(.7 + .3 * kt); }
      }
      var hg = .78 + .22 * Math.min(1, Math.max(0, p.y / H));
      var o = 0;
      if (!look.noAO) {
        q.copy(p).addScaledVector(n, .035);
        for (var j = 0; j < occ.length; j++) {
          var O = occ[j]; if (O.m === m) continue;
          l.copy(q).applyMatrix4(O.inv).sub(O.c);
          var dx = Math.max(Math.abs(l.x) - O.hs.x, 0), dy = Math.max(Math.abs(l.y) - O.hs.y, 0), dz = Math.max(Math.abs(l.z) - O.hs.z, 0);
          var d = Math.sqrt(dx * dx + dy * dy + dz * dz) * O.sc;
          if (d < .2) { var f = 1 - d / .2; o += f * f * .5; }
        }
        if (p.y < .22) { var f2 = 1 - p.y / .22; o += f2 * f2 * .4; }
      }
      var ao = 1 - Math.min(.6, o * (look.aoK == null ? 1 : look.aoK));
      out[i * 3] = col.r * hg * ao; out[i * 3 + 1] = col.g * hg * ao; out[i * 3 + 2] = col.b * hg * ao;
    }
    g.setAttribute('color', new T.BufferAttribute(out, 3));
  });
}

// ---------- flames ----------
export function flameCluster(parent, list, x, y, z, s, lean, P) {
  var g = new T.Group(); g.position.set(x, y, z); parent.add(g);
  glow(g, flameGeo(s, lean), P.ember, 0, 0, 0, 0, 0, 0, .92);
  glow(g, flameGeo(s * .72, lean * .9), P.emberMid, .02 * s, .02 * s, 0, 0, .5, 0, .96);
  glow(g, flameGeo(s * .42, lean * .7), P.emberCore, .03 * s, .03 * s, 0, 0, 1, 0);
  list.push(g);
  return g;
}
