import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, leafGeo, lumpGeo, ttube } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { feather, finish, glow, part, seg } from '../kit/parts.js';
import { makeRig } from '../kit/rig.js';

// =====================================================================
// DUSKSEER: a wise owl on a mossy branch, under a crescent moon
// =====================================================================
export function owl() {
  var P = {
    plum: C('#4b3f5e'), bar: C('#2e2640'), cream: C('#e3d8c4'), disc: C('#ddd4e8'), rim: C('#5b4a72'), beak: C('#3a3040'),
    eye: '#ffd34a', moon: '#e8eaff', moonGlow: '#8c9bff', star: '#fff2c4', rune: '#a58cff',
    bark: C('#5a4636'), barkDark: C('#3a2c22'), moss: C('#5a9a45'), mossLight: C('#8fcb5c'), leaf: C('#78c255'), claw: C('#2a2230')
  };
  var root = new T.Group(), body = new T.Group(); root.add(body);
  var UPV = [0, 1, 0];
  function plum(p, n) { var c = mix(P.plum, P.bar, sstep(.2, -.5, n.y) * .3); return mix(c, P.cream, sstep(.35, .9, n.x) * .4 * sstep(1.0, 1.6, p.y)); }
  var BODYL = { c: plum };
  var CHEST = { m: 'plume', g: [C('#d8cdb8'), C('#e9dfcc'), C('#4a3d58')], noOcc: true, aoK: .3 };
  var WING = { m: 'plume', g: [C('#3a2f4c'), C('#5b4a72'), C('#2a2238')], noOcc: true, aoK: .3 };
  var WINGC = { m: 'plume', g: [C('#6a5a82'), C('#8a76a6'), C('#e3d8c4')], noOcc: true, aoK: .3 };
  var TUFT = { m: 'plume', g: [C('#3a2f4c'), C('#5b4a72'), C('#9a86b6')], noOcc: true, aoK: .3 };
  var BARK = { c: function (p, n) { return mix(P.bark, P.barkDark, sstep(.2, -.6, n.y)); }, m: 'flat' };
  var CLAW = { c: P.claw, m: 'gloss', noAO: true, noOcc: true };
  var r = rng(41);

  // a mossy branch, forked and held up by a root, for the owl to perch on
  part(root, ttube([[-1.5, .52, .3], [-.7, .62, .12], [.2, .58, -.02], [1.0, .66, -.12], [1.6, .78, -.2]], .15, .09, 9, 28), BARK);
  part(root, ttube([[.5, .6, -.05], [.9, 1.0, .1], [1.2, 1.35, .2]], .07, .03, 7, 14), BARK);
  part(root, ttube([[-1.1, .56, .22], [-1.15, .3, .3], [-1.0, .0, .34]], .12, .1, 7, 14), BARK);
  [[-1.3, .64, .3], [-.8, .7, .14], [-.4, .7, .1], [1.2, .75, -.14], [-1.05, .1, .34]].forEach(function (m, i) {
    part(root, lumpGeo(.13 + r() * .05, i * 5 + 2), { c: r() < .4 ? P.mossLight : P.moss, m: 'flat' }, m[0], m[1], m[2], r() * 3, r() * 3, r() * 3);
  });
  [[1.2, 1.38, .2], [.95, 1.04, .1], [1.55, .82, -.2]].forEach(function (q, i) { part(root, leafGeo(.2, .1), { c: i % 2 ? P.leaf : C('#4c973a'), m: 'leaf', noOcc: true }, q[0], q[1], q[2], .6 + i, i * 1.7, .5); });

  // body: upright and round-shouldered, a chest of barred scale-feathers, wings folded down the sides
  part(body, blob(1.05, 1.6, .95, .88, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x * (.8 + .3 * t), y, z * (.82 + .25 * t)]; }), BODYL, 0, 1.4, 0);
  for (var row = 0; row < 5; row++) for (var c = -3; c <= 3; c++) {
    var zz = c * .115 + (row % 2 ? .055 : 0), yy = 1.95 - row * .26, xx = Math.sqrt(Math.max(.01, .26 - zz * zz * .8)) + .13;
    feather(body, CHEST, [xx, yy, zz], [.15, -1, zz * .6], [1, 0, 0], .34, .17, .12);
  }
  [1, -1].forEach(function (s) {
    part(body, blob(.34, 1.25, .95, .85, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x, y, z * (1 - .55 * (1 - t))]; }), BODYL, -.18, 1.4, s * .5, 0, 0, -.06);
    for (var wr = 0; wr < 3; wr++) for (var wc = 0; wc < 6; wc++) {
      feather(body, wr === 2 ? WINGC : WING, [-.2 - wr * .03, 1.95 - wr * .3, s * (.34 + wc * .06)], [-.12, -1, s * .1], [1, 0, 0], .55 - wr * .03, .2, .14);
    }
    for (var tf = 0; tf < 3; tf++) feather(body, WING, [-.3, .75, s * (.12 + tf * .12)], [-.3, -1, s * .2], [1, 0, 0], .8, .22, .1);
  });

  // head: wide and round with a heart of pale feathers round the eyes, huge golden eyes, a small hooked beak and ear tufts
  var head = new T.Group(); head.position.set(.12, 2.4, 0); body.add(head);
  part(head, blob(1.1, .92, 1.1, .9), BODYL, 0, 0, 0);
  var eyes = [];
  [1, -1].forEach(function (s) {
    part(head, blob(.14, .74, .52, .9), { c: P.disc }, .5, -.02, s * .28, 0, s * .12, 0);
    var rim = [];
    for (var q = 0; q < 20; q++) { var aq = q / 20 * Math.PI * 2; rim.push([.58, -.02 + Math.cos(aq) * .38, s * .3 + Math.sin(aq) * .28]); }
    part(head, ttube(rim, .028, .028, 6, 40, true), { c: P.rim, noOcc: true, noAO: true });
    part(head, blob(.1, .18, .18, .9), { c: P.rim, noOcc: true }, .55, .3, s * .3, 0, 0, 0);
    eyes.push(glow(head, new T.SphereGeometry(.2, 18, 14), P.eye, .55, .06, s * .3));
    halo(head, P.eye, .6, .62, .06, s * .3, .5);
    part(head, new T.SphereGeometry(.09, 12, 10), { c: '#0a0810', noOcc: true, noAO: true, m: 'gloss' }, .74, .06, s * .3);
    part(head, blob(.5, .12, .24, .85), BODYL, .46, .3, s * .3, 0, 0, -.1 + s * 0);
    feather(head, TUFT, [-.05, .38, s * .3], [-.15, 1, s * .35], UPV, .62, .22, .1);
    feather(head, TUFT, [-.1, .34, s * .24], [-.3, 1, s * .2], UPV, .46, .18, .1);
  });
  part(head, blob(.18, .26, .15, .8, function (x, y, z, W, H) { return [x, y - .06 * (1 - (y / H + 1) / 2), z * (1 - .5 * (1 - (y / H + 1) / 2))]; }), { c: P.beak, m: 'gloss' }, .62, -.16, 0);

  // talons gripping the branch
  [.2, -.2].forEach(function (z) {
    seg(body, [.0, .85, z], [.05, .64, z], .09, .07, { c: P.cream });
    [[.35, .12], [.32, -.04], [-.28, -.1]].forEach(function (d, i) {
      var tip = [.05 + d[0], .6, z + d[1]];
      seg(body, [.05, .66, z], tip, .045, .035, { c: P.cream });
      part(body, ttube([tip, [tip[0] + (d[0] > 0 ? .06 : -.06), tip[1] - .06, tip[2]], [tip[0] + (d[0] > 0 ? .04 : -.04), tip[1] - .16, tip[2]]], .03, .006, 6, 8), CLAW);
    });
  });

  // night: a crescent moon behind, stars that drift, and a ring of rune light turning below the branch
  var moonShape = new T.Shape();
  moonShape.absarc(0, 0, .9, 1.04, Math.PI * 2 - 1.04, false);
  moonShape.absarc(.4, 0, .78, Math.PI * 2 - 1.5, 1.5, true);
  var moon = glow(root, new T.ShapeGeometry(moonShape, 24), P.moon, -1.7, 2.9, -1.3, 0, .5, .3, .95);
  moon.material.side = T.DoubleSide;
  halo(root, P.moonGlow, 3.2, -1.7, 2.9, -1.3, .35);
  halo(body, P.moonGlow, 4.5, 0, 1.6, 0, .18);
  var stars = [];
  for (var si = 0; si < 22; si++) stars.push({ m: glow(root, new T.OctahedronGeometry(.045 + (si % 3) * .02, 0), si % 3 ? P.star : P.moon), ph: si / 22, r: 1.2 + (si % 6) * .35, h: .6 + (si % 8) * .38 });
  var ringPts = [];
  for (var q2 = 0; q2 < 40; q2++) { var a2 = q2 / 40 * Math.PI * 2; ringPts.push([Math.cos(a2) * 1.9, .04, Math.sin(a2) * 1.9]); }
  var ringG = new T.Group(); root.add(ringG);
  glow(ringG, ttube(ringPts, .024, .024, 6, 120, true), P.rune, 0, 0, 0, 0, 0, 0, .55);
  for (var q3 = 0; q3 < 12; q3++) { var a3 = q3 / 12 * Math.PI * 2; glow(ringG, new T.BoxGeometry(.24, .02, .06), P.rune, Math.cos(a3) * 1.6, .04, Math.sin(a3) * 1.6, 0, -a3, 0, .6); }
  var light = new T.PointLight(0x9a8cff, 2.2, 5, 1.5); light.position.set(.8, 2.8, .6); body.add(light);
  moon.userData.noFit = true; ringG.traverse(function (o) { o.userData.noFit = true; });

  finish(root, 3.0);
  return {
    root: root, head: head, name: 'owl', headView: { span: 1.9, up: .1, look: 0 }, initYaw: -.9,
    rig: makeRig({ plan: 'perched', body: body, head: head }),
    update: function (t) {
      var br = Math.sin(t * 1.5);
      body.position.y = br * .012; body.scale.set(1, 1 + br * .008, 1 + br * .012);
      head.rotation.y = Math.sin(t * .5) * .85 * (Math.sin(t * .25) > -.2 ? 1 : .2);
      head.rotation.z = Math.sin(t * .7) * .04;
      ringG.rotation.y = t * .2; moon.rotation.y = .5 + Math.sin(t * .3) * .1;
      stars.forEach(function (s) { var a = t * .18 + s.ph * Math.PI * 2; s.m.position.set(Math.cos(a) * s.r, s.h + Math.sin(t * .8 + s.ph * 9) * .08, Math.sin(a) * s.r); s.m.rotation.y = t + s.ph * 5; s.m.scale.setScalar(.7 + .5 * Math.sin(t * 2 + s.ph * 12)); });
      light.intensity = 2 + Math.sin(t * 1.3) * .4;
      var blink = (t % 6.1) < .16 ? .12 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
