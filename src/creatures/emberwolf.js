import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { finish, flameCluster, glow, lock, part, seg, shard } from '../kit/parts.js';

// =====================================================================
// EMBERWOLF
// =====================================================================
export function emberwolf() {
  var P = {
    furDark: C('#36313b'), fur: C('#544c5c'), furLight: C('#8c8392'), cream: C('#b3aab3'), earIn: C('#8a4b52'),
    paw: C('#2c2830'), claw: C('#ece5d8'), nose: C('#141116'), gum: C('#4e1820'), tongue: C('#c1505f'), tooth: C('#f3eee3'),
    eye: '#ffb72e', ember: '#ff4510', emberMid: '#ff8d1c', emberCore: '#ffe885', vein: '#ff9a26'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  var flames = [], embers = [];
  // fur colour: dark along the back, lighter on the chest, throat and belly
  function coat(p, n) {
    var c = mix(P.fur, P.furDark, sstep(.25, .85, n.y));
    c = mix(c, P.furLight, sstep(-.15, -.6, n.y));
    var chest = sstep(.55, 1.05, p.x) * sstep(.2, .7, n.x) * sstep(2.0, 1.2, p.y);
    return mix(c, P.furLight, chest * .9);
  }
  var FUR = { c: coat }, PAW = { c: P.paw };
  // locks of fur: smooth, darker at the root, lighter at the tip, with only a little contact shading
  var LOCK = { c: coat, tip: P.furLight, tipAmt: .75, aoK: .4 }, LOCKL = { c: P.furLight, tip: P.cream, tipAmt: .7, aoK: .4 };
  // torso: deep chest, tucked waist, a slight arch
  part(body, blob(1.95, 1.0, 1.0, .82, function (x, y, z, W) {
    var xn = x / W, t = (xn + 1) / 2, sy = .84 + .3 * t, sz = .84 + .24 * t;
    if (y < 0) y *= 1 - .22 * (1 - xn * xn);
    return [x, y * sy + .05 * (1 - xn * xn), z * sz];
  }), FUR, .02, 1.26, 0);
  part(body, blob(.86, 1.08, 1.04, .85), FUR, .64, 1.3, 0, 0, 0, -.12);
  [.33, -.33].forEach(function (z) {
    part(body, blob(.56, .78, .4, .85), FUR, .62, 1.12, z, 0, 0, -.1);
    part(body, blob(.66, .82, .44, .85), FUR, -.66, 1.2, z, 0, 0, .15);
  });
  // neck and a ruff of soft locks, three layers deep, lying back over the shoulders
  part(body, blob(.72, 1.0, .8, .85, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x, y, z * (1.08 - .2 * t)]; }), FUR, 1.0, 1.72, 0, 0, 0, -.62);
  var r = rng(11);
  [[1.12, .44, 15, .22], [.92, .5, 16, .18], [.7, .55, 16, .14]].forEach(function (ring, k) {
    for (var i = 0; i < ring[2]; i++) {
      var a = -Math.PI * .95 + (i / (ring[2] - 1)) * Math.PI * 1.9 + (r() - .5) * .1, cy = Math.cos(a), cz = Math.sin(a);
      var bx = ring[0] + (r() - .5) * .06, by = 1.7 + (k === 0 ? .18 : k === 1 ? .05 : -.08) + cy * ring[1] * .8, bz = cz * ring[1];
      lock(body, cy < -.3 ? LOCKL : LOCK, [bx, by, bz], [-1.5, cy * .3 + .02 - (cy < -.3 ? .3 : 0), cz * .28], [0, cy, cz], .22 + ring[3] + r() * .1, .26 + r() * .06, .1, .06 + r() * .04);
    }
  });
  // a fringe hanging from the chest
  [[1.02, 1.32], [1.05, 1.16], [1.0, 1.0], [.92, .88], [.8, .8]].forEach(function (c, i) {
    [.11, -.11].forEach(function (z) { lock(body, LOCKL, [c[0], c[1], z * (1 + i * .12)], [.12 - i * .1, -1, z * .4], [1, -.2, 0], .24 + r() * .06, .22, .09, .05); });
  });
  // back fur along the spine
  for (var bx = .45; bx > -.95; bx -= .17) lock(body, LOCK, [bx, 1.72 - (.45 - bx) * .06, (r() - .5) * .2], [-1, .3, 0], [0, 1, 0], .26 + r() * .08, .24, .09, .06);
  // legs: shoulder, elbow, wrist, paw; hip, knee, hock, paw
  var FRONT = [[.62, 1.1], [.66, .62], [.71, .26]], BACK = [[-.7, 1.18], [-.5, .74], [-.93, .38], [-.82, .12]];
  [.3, -.3].forEach(function (z) {
    seg(legs, [FRONT[0][0], FRONT[0][1], z], [FRONT[1][0], FRONT[1][1], z], .2, .14, FUR);
    seg(legs, [FRONT[1][0], FRONT[1][1], z], [FRONT[2][0], FRONT[2][1], z], .13, .11, FUR);
    part(legs, blob(.42, .2, .34, .7, function (x, y, zz, W) { return [x, y * (1 - .35 * Math.max(0, x / W)), zz]; }), PAW, .8, .1, z);
    seg(legs, [BACK[0][0], BACK[0][1], z], [BACK[1][0], BACK[1][1], z], .27, .16, FUR);
    seg(legs, [BACK[1][0], BACK[1][1], z], [BACK[2][0], BACK[2][1], z], .14, .1, FUR);
    seg(legs, [BACK[2][0], BACK[2][1], z], [BACK[3][0], BACK[3][1], z], .1, .1, FUR);
    part(legs, blob(.4, .19, .32, .7, function (x, y, zz, W) { return [x, y * (1 - .35 * Math.max(0, x / W)), zz]; }), PAW, -.7, .095, z);
    [-.1, 0, .1].forEach(function (dz) {
      part(legs, blob(.13, .11, .1, .8), PAW, .99, .08, z + dz);
      shard(legs, .026, .12, 5, { c: P.claw, m: 'gloss', noAO: true }, [1.04, .07, z + dz], [1, -.45, 0]);
      part(legs, blob(.12, .1, .09, .8), PAW, -.52, .075, z + dz);
      shard(legs, .024, .11, 5, { c: P.claw, m: 'gloss', noAO: true }, [-.47, .065, z + dz], [1, -.45, 0]);
    });
  });
  // head
  var head = new T.Group(); head.position.set(1.36, 2.04, 0); head.rotation.z = -.06; body.add(head);
  part(head, blob(.74, .62, .68, .78, function (x, y, z, W) { return [x, y, z * (1 - .18 * Math.max(0, x / W))]; }), FUR, 0, 0, 0);
  part(head, blob(.3, .09, .66, .72), { c: P.furDark }, .2, .15, 0, 0, 0, -.3);
  part(head, blob(.66, .32, .38, .72, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .22 * t) + .02 * t, z * (1 - .3 * t)]; }), { c: function (p, n) { return mix(P.fur, P.cream, sstep(-.1, -.7, n.y) + sstep(.2, .8, n.x) * .4); } }, .5, -.12, 0, 0, 0, -.06);
  part(head, blob(.15, .12, .19, .7), { c: P.nose, m: 'gloss' }, .84, -.05, 0);
  [.06, -.06].forEach(function (z) { part(head, blob(.04, .03, .03, 1), { c: '#000000', noAO: true, noOcc: true }, .9, -.08, z); });
  // jaw on a hinge, a little open
  var jaw = new T.Group(); jaw.position.set(.18, -.25, 0); jaw.rotation.z = -.2; head.add(jaw);
  part(jaw, blob(.58, .14, .3, .72, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .3 * t)]; }), { c: function (p, n) { return mix(P.fur, P.cream, sstep(.2, -.7, n.y)); } }, .3, -.05, 0);
  part(jaw, blob(.52, .1, .24, .8), { c: P.gum, noOcc: true }, .28, .03, 0);
  part(jaw, blob(.32, .06, .16, .9), { c: P.tongue, m: 'gloss', noOcc: true }, .24, .07, 0);
  part(head, blob(.5, .08, .28, .8), { c: P.gum, noOcc: true }, .46, -.27, 0);
  var TOOTH = { c: P.tooth, m: 'gloss', noAO: true, noOcc: true };
  [.12, -.12].forEach(function (z) {
    shard(head, .045, .2, 6, TOOTH, [.72, -.25, z], [0, -1, 0]);
    shard(jaw, .04, .16, 6, TOOTH, [.5, .02, z * .85], [-.1, 1, 0]);
    [.36, .46, .56].forEach(function (x) { shard(head, .024, .08, 5, TOOTH, [x, -.27, z * 1.08], [0, -1, 0]); });
    [.22, .32].forEach(function (x) { shard(jaw, .022, .07, 5, TOOTH, [x, .02, z * .9], [0, 1, 0]); });
  });
  // eyes: glowing slits under a heavy brow, ears with a dark inner, a cheek ruff
  var eyes = [];
  [.31, -.31].forEach(function (z) {
    part(head, blob(.22, .12, .06, .8), { c: P.furDark, noOcc: true }, .25, .06, z * 1.01, 0, z > 0 ? -.25 : .25, -.15);
    eyes.push(glow(head, blob(.17, .07, .05, .7), P.eye, .27, .06, z * 1.05, 0, z > 0 ? -.25 : .25, -.18));
    halo(head, P.eye, .28, .3, .06, z * 1.15, .45);
    var ear = new T.Group(); ear.position.set(-.12, .32, z * .62); ear.rotation.set(z > 0 ? .2 : -.2, 0, .32); head.add(ear);
    part(ear, blob(.24, .56, .3, .72, function (x, y, zz, W, H) { var t = (y / H + 1) / 2; return [x * (1 - .7 * t), y, zz * (1 - .65 * t)]; }), FUR, 0, .26, 0);
    part(ear, blob(.1, .4, .22, .75, function (x, y, zz, W, H) { var t = (y / H + 1) / 2; return [x * (1 - .7 * t), y, zz * (1 - .7 * t)]; }), { c: P.earIn, noOcc: true }, .08, .22, 0);
    for (var i = 0; i < 4; i++) lock(head, LOCKL, [-.05 + i * .05, -.12 - i * .05, z * 1.0], [-1, -.35 - i * .1, z > 0 ? .55 : -.55], [0, -.3, z], .22 + i * .03, .22, .09, .05);
  });
  // tail: bushy, tufted, burning at the tip
  var tail = new T.Group(); tail.position.set(-.92, 1.38, 0); body.add(tail);
  var TP = [[0, 0, 0], [-.32, .1, 0], [-.6, .28, 0], [-.82, .5, 0], [-.94, .74, 0]];
  for (var ti = 0; ti < TP.length - 1; ti++) seg(tail, TP[ti], TP[ti + 1], .2 - ti * .02, .2 - ti * .035, FUR);
  for (var tj = 0; tj < 9; tj++) {
    var tt = tj / 8, tx = -.1 - tt * .8, ty = .02 + tt * tt * .62, an = tj * 2.4;
    lock(tail, tj % 2 ? LOCKL : LOCK, [tx, ty + Math.cos(an) * .1, Math.sin(an) * .12], [-.9, .2 + Math.cos(an) * .5, Math.sin(an) * .6], [0, Math.cos(an), Math.sin(an)], .32, .26, .1, .06);
  }
  flameCluster(tail, flames, -.96, .72, 0, 1.0, .5, P);
  halo(tail, P.ember, 1.0, -1.0, 1.05, 0, .35);
  // the mane of flame from the crown down the back
  [[1.36, 2.34, .76, .9], [1.12, 2.18, .9, .95], [.88, 2.0, .92, 1], [.62, 1.86, .82, 1], [.36, 1.78, .7, 1], [.1, 1.74, .58, 1], [-.16, 1.7, .46, 1]].forEach(function (f, i) {
    var g = flameCluster(body, flames, f[0], f[1], 0, f[2], f[3], P);
    g.rotation.z = .5;
    if (i < 5) { [.16, -.16].forEach(function (z) { var s = flameCluster(body, flames, f[0] - .08, f[1] - .08, z, f[2] * .55, .9, P); s.rotation.set(z > 0 ? -.4 : .4, 0, .5); }); }
  });
  halo(body, P.ember, 2.4, .6, 2.1, 0, .25);
  var light = new T.PointLight(0xff7a2a, 4, 3.2, 1.6); light.position.set(.6, 2.3, 0); body.add(light);
  // ember veins in the fur
  var VEINS = [
    [[.82, 1.62, .5], [.7, 1.42, .55], [.78, 1.22, .55], [.66, 1.0, .5]],
    [[-.5, 1.52, .5], [-.62, 1.32, .55], [-.55, 1.12, .55], [-.68, .92, .48]],
    [[1.12, 1.95, .38], [1.0, 1.78, .44], [1.04, 1.6, .44]],
    [[.2, 1.6, .52], [.12, 1.4, .56], [.22, 1.2, .54]]
  ];
  VEINS.forEach(function (v) {
    [1, -1].forEach(function (s) { glow(body, ttube(v.map(function (a) { return [a[0], a[1], a[2] * s]; }), .022, .008, 6, 14), P.vein); });
  });
  // embers rising off the mane
  for (var ei = 0; ei < 18; ei++) {
    var m = glow(body, new T.IcosahedronGeometry(.028, 0), ei % 3 ? P.emberMid : P.emberCore);
    var em = { m: m, x: .9 - (ei % 7) * .18, z: ((ei * 37) % 9 - 4) * .05, ph: (ei * .137) % 1, sp: .35 + (ei % 5) * .07 };
    m.position.set(em.x - em.ph * .7, 1.95 + em.ph * 1.2, em.z); m.scale.setScalar(1 - em.ph);
    embers.push(em);
  }
  finish(root, 2.6);
  return {
    root: root, head: head, name: 'emberwolf',
    update: function (t) {
      var br = Math.sin(t * 2.1);
      body.position.y = br * .015; body.scale.set(1, 1 + br * .008, 1 + br * .01);
      head.rotation.z = -.06 + Math.sin(t * 1.1) * .045; head.rotation.y = Math.sin(t * .7) * .06;
      jaw.rotation.z = -.2 - (Math.sin(t * 2.1) * .5 + .5) * .06;
      tail.rotation.y = Math.sin(t * 2.3) * .28; tail.rotation.z = Math.sin(t * 1.6) * .06;
      flames.forEach(function (f, i) { var w = Math.sin(t * 13 + i * 1.9) * .5 + Math.sin(t * 7.1 + i * 2.3) * .5; f.scale.set(1 - w * .07, 1 + w * .15, 1 - w * .07); });
      light.intensity = 4 + Math.sin(t * 17) * .6 + Math.sin(t * 9.3) * .5;
      embers.forEach(function (e) {
        var k = (t * e.sp + e.ph) % 1;
        e.m.position.set(e.x - k * .7, 1.95 + k * 1.2, e.z + Math.sin(t * 3 + e.ph * 9) * .06);
        e.m.scale.setScalar(Math.max(.01, 1 - k));
      });
      var blink = (t % 4.7) < .12 ? .15 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
