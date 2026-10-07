import * as T from 'three';
import { C, mix, sstep } from '../kit/math.js';
import { blob, flameGeo, ttube } from '../kit/geometry.js';
import { glowMat, halo } from '../kit/materials.js';
import { band, feather, finish, glow, part, shard } from '../kit/parts.js';
import { chain, hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// IRONPAW: a panda fighter in a low guard, fists up and wrapped, white qi burning off its shoulders
// =====================================================================
export function panda() {
  var P = {
    black: C('#1a191e'), blackSoft: C('#2c2a31'), cream: C('#cfc7b8'), creamDark: C('#958c7d'), red: C('#9e2228'), redDark: C('#5e1216'),
    gold: C('#d9ab3d'), nose: C('#0d0d0f'), gum: C('#4a1a1c'), tongue: C('#a84a52'), tooth: C('#f3eee3'), claw: C('#e6dcc6'),
    eye: '#ffe08a', qi: '#ffe9b8', qiDeep: '#ffcf7a', qiCore: '#fffaf0'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  // the coat: muted cream, shaded down the belly, with the black band across the shoulders and down the arms
  function coat(p, n) { var c = mix(P.cream, P.creamDark, sstep(.25, -.6, n.y) * .55 + sstep(.4, .95, n.y) * .15); return mix(c, P.black, sstep(2.28, 2.42, p.y)); }
  var BODYL = { c: coat }, FURB = { c: function (p, n) { return mix(P.blackSoft, P.black, sstep(-.2, .7, n.y)); } }, FURW = { c: coat };
  var HEADW = { c: function (p, n) { return mix(P.cream, P.creamDark, sstep(.1, -.7, n.y) * .5); } };
  var GOLD = { c: P.gold, m: 'metal' }, WRAP = { c: function (p, n) { return mix(P.red, P.redDark, sstep(.3, -.6, n.y)); } };
  var CLAW = { c: P.claw, m: 'gloss', noAO: true, noOcc: true }, TOOTH = { c: P.tooth, m: 'gloss', noAO: true, noOcc: true };
  var RIB = { m: 'plume', g: [P.redDark, P.red, C('#c83a34')], noOcc: true, aoK: .3 };
  var UPV = [0, 1, 0];

  // body: a broad, heavy trunk leaning into the guard, a deep chest, a black band over huge shoulders
  part(body, blob(1.25, .9, 1.25, .85), FURB, -.05, 1.3, 0);
  part(body, blob(1.42, 1.5, 1.45, .86, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x * (.9 + .2 * t), y, z * (.88 + .22 * t)]; }), BODYL, .02, 1.95, 0, 0, 0, -.14);
  [1, -1].forEach(function (s) { part(body, blob(.78, .72, .7, .85), FURB, .1, 2.42, s * .66, 0, 0, -.1); });
  // a black belt, a gold buckle and the red tails of a knot
  var belt = [];
  for (var b = 0; b < 24; b++) { var ab = b / 24 * Math.PI * 2; belt.push([Math.cos(ab) * .7 - .03, 1.5, Math.sin(ab) * .7]); }
  part(body, ttube(belt, .1, .1, 8, 72, true), { c: P.black });
  part(body, blob(.1, .28, .28, .8), GOLD, .67, 1.5, 0);
  [.1, -.1].forEach(function (z, i) { feather(body, RIB, [-.68, 1.48, z], [-.4, -1, z * 2], [1, 0, 0], .75 + i * .1, .2, .1); });
  // qi lines burning on the chest
  [[[.6, 2.1, .2], [.68, 1.9, .3], [.6, 1.7, .32]], [[.6, 2.1, -.2], [.68, 1.9, -.3], [.6, 1.7, -.32]]].forEach(function (v) { glow(body, ttube(v, .02, .008, 6, 12), P.qi); });

  // legs: a low wide stance, each a chain hip > knee > ankle with a broad clawed foot planted on the end
  var LEGS = {};
  [.42, -.42].forEach(function (z) {
    var s = z > 0 ? 1 : -1, leg = limb(legs, [[0, 1.18, z], [.24, .66, z + s * .18], [.08, .22, z + s * .16]], [[.42, .32], [.32, .25]], FURB);
    hang(leg.joints[1], part(legs, blob(.44, .44, .44, .9), FURB, .24, .66, z + s * .18));
    var ft = [part(legs, blob(.78, .24, .52, .8), FURB, .26, .12, z + s * .16)];
    [-.15, 0, .15].forEach(function (dz) { ft.push(shard(legs, .04, .15, 5, CLAW, [.64, .1, z + s * .16 + dz], [1, -.25, dz * .6])); });
    hang(leg.joints[1], band(legs, WRAP, [.24, .66, z + s * .18], [.08, .22, z + s * .16], .55, .29, .12));
    hang(leg.end, ft);
    LEGS[s > 0 ? 'r' : 'l'] = leg;   // +z is its right
  });

  // arms: chains shoulder > elbow > wrist in a guard, the right fist leading, the left held back at the chin;
  // forearms wrapped in red, fists bound in cream with gold knuckle plates and qi burning on them
  var ARMS = {}, fistGlows = [];
  [[1, [.14, 2.36, .8], [.55, 1.9, .95], [1.02, 2.22, .78]], [-1, [.14, 2.36, -.8], [.45, 1.88, -.92], [.82, 2.42, -.62]]].forEach(function (a) {
    var s = a[0], arm = limb(body, [a[1], a[2], a[3]], [[.42, .33], [.33, .29]], FURB);
    hang(arm.joints[1], part(body, blob(.44, .44, .44, .9), FURB, a[2][0], a[2][1], a[2][2]));
    var w = a[3], fist = [part(body, blob(.64, .56, .56, .85), FURW, w[0] + .16, w[1] + .03, w[2])];
    [-.18, -.06, .06, .18].forEach(function (dz) { fist.push(part(body, blob(.15, .14, .14, .85), GOLD, w[0] + .46, w[1] + .08, w[2] + dz)); });
    hang(arm.joints[1], [band(body, WRAP, a[2], a[3], .55, .29, .3), glow(body, ttube([[a[2][0] + .1, a[2][1] + .05, a[2][2] + s * .26], [(a[2][0] + w[0]) / 2, (a[2][1] + w[1]) / 2 + .02, (a[2][2] + w[2]) / 2 + s * .28], [w[0] - .05, w[1], w[2] + s * .22]], .018, .008, 6, 12), P.qi)]);
    var h = halo(body, P.qiDeep, 1.0, w[0] + .25, w[1] + .05, w[2], .45); fistGlows.push(h); fist.push(h);
    hang(arm.end, fist);
    ARMS[s > 0 ? 'r' : 'l'] = arm;
  });

  // head: round and heavy, low behind the guard; black patches with slit eyes under a black brow, a snarl
  var head = new T.Group(); head.position.set(.46, 2.86, 0); head.rotation.z = -.12; body.add(head);
  part(head, blob(1.06, .94, 1.02, .9), HEADW, 0, 0, 0);
  part(head, blob(.46, .36, .5, .85), HEADW, .6, -.18, 0);
  part(head, blob(.2, .14, .26, .75), { c: P.nose, m: 'gloss' }, .86, -.06, 0);
  var jaw = new T.Group(); jaw.position.set(.24, -.36, 0); jaw.rotation.z = -.28; head.add(jaw);
  part(jaw, blob(.52, .15, .42, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .3 * t)]; }), HEADW, .26, -.04, 0);
  part(jaw, blob(.44, .05, .32, .8), { c: P.gum, noOcc: true }, .25, .03, 0);
  part(jaw, blob(.26, .05, .16, .9), { c: P.tongue, m: 'gloss', noOcc: true }, .2, .06, 0);
  part(head, blob(.44, .05, .36, .8), { c: P.gum, noOcc: true }, .56, -.36, 0);
  [.12, -.12].forEach(function (z) { shard(head, .05, .17, 6, TOOTH, [.7, -.36, z], [0, -1, 0]); shard(jaw, .045, .14, 6, TOOTH, [.46, .03, z * .9], [0, 1, 0]); });
  var eyes = [];
  [.36, -.36].forEach(function (z) {
    part(head, blob(.34, .44, .17, .8), FURB, .4, .04, z, z > 0 ? .55 : -.55, 0, -.3);
    eyes.push(glow(head, blob(.17, .055, .05, .7), P.eye, .49, .08, z * 1.05, 0, z > 0 ? -.3 : .3, -.38));
    halo(head, P.eye, .3, .52, .08, z * 1.12, .5);
    part(head, blob(.4, .12, .24, .8), FURB, .4, .22, z * .95, 0, z > 0 ? -.15 : .15, -.5);
    part(head, blob(.28, .28, .15, .85), FURB, -.12, .42, z * 1.2);
  });
  // a headband: a red loop with a gold plate, and two tails that stream behind
  var hb = [];
  for (var hi = 0; hi < 20; hi++) { var ah = hi / 20 * Math.PI * 2; hb.push([Math.cos(ah) * .5 - .02, .32 + Math.cos(ah) * .02, Math.sin(ah) * .52]); }
  part(head, ttube(hb, .06, .06, 8, 60, true), WRAP);
  part(head, blob(.07, .2, .22, .8), GOLD, .5, .32, 0);
  var tails = new T.Group(); tails.position.set(-.5, .32, 0); head.add(tails);
  [.1, -.1].forEach(function (z, i) { feather(tails, RIB, [0, 0, z], [-1, -.15 - i * .05, z * 3], UPV, 1.3 - i * .15, .28, .2); });

  // qi rising off the shoulders and back: pale flames along the top line, the mark of a fighter's spirit
  var wisps = [], QI = { ember: P.qiDeep, emberMid: P.qi, emberCore: P.qiCore };
  [[-.45, 2.55, .45, .85], [-.2, 2.68, -.4, .9], [-.65, 2.4, 0, .75], [.02, 2.62, .5, .65], [-.42, 2.6, -.05, 1.0]].forEach(function (w) {
    var g = new T.Group(); g.position.set(w[0], w[1], w[2]); g.rotation.z = .55; body.add(g);
    glow(g, flameGeo(w[3], .6), QI.ember, 0, 0, 0, 0, 0, 0, .55);
    glow(g, flameGeo(w[3] * .6, .55), QI.emberMid, .02, .02, 0, 0, .5, 0, .75);
    wisps.push(g);
  });
  // sparks of qi round the fists: one instanced mesh
  var SN = 14, sparks = new T.InstancedMesh(new T.IcosahedronGeometry(.03, 0), glowMat('#ffffff'), SN), st = new T.Object3D(), sp = [];
  sparks.frustumCulled = false; sparks.userData.noFit = true; body.add(sparks);
  for (var si = 0; si < SN; si++) { sp.push({ ph: si / SN, side: si % 2 ? 1 : -1 }); sparks.setColorAt(si, new T.Color(si % 3 ? P.qi : P.qiCore)); }
  function placeSparks(t) {
    sp.forEach(function (e, i) {
      var an = t * 2.4 + e.ph * Math.PI * 2, w = e.side > 0 ? [1.25, 2.27, .78] : [1.05, 2.47, -.62];
      st.position.set(w[0] + Math.sin(an * 1.3) * .12, w[1] + Math.cos(an) * .32, w[2] + Math.sin(an) * .32); st.scale.setScalar(.6 + .4 * Math.sin(an * 2)); st.updateMatrix(); sparks.setMatrixAt(i, st.matrix);
    });
    sparks.instanceMatrix.needsUpdate = true;
  }
  placeSparks(0);
  var light = new T.PointLight(0xffe2a8, 2, 3.4, 1.6); light.position.set(1.2, 2.4, 0); body.add(light);

  // the neck joint, between the shoulders, carrying the head
  var neck = new T.Group(); neck.position.set(.25, 2.62, 0); body.add(neck);
  hang(neck, [head]);

  finish(root, 3.5);
  return {
    root: root, head: head, name: 'panda', headView: { span: 2.4, up: .3, look: 0 },
    rig: makeRig({ plan: 'biped', body: body, neck: neck, head: head, jaw: jaw, legs: LEGS, arms: ARMS, extra: { sash: chain([tails]) } }),
    update: function (t) {
      var br = Math.sin(t * 1.6), sway = Math.sin(t * .9);
      body.position.y = br * .015; body.position.x = sway * .02; body.scale.set(1, 1 + br * .006, 1 + br * .008);
      head.rotation.z = -.12 + Math.sin(t * .8) * .03; head.rotation.y = Math.sin(t * .55) * .06;
      jaw.rotation.z = -.28 - (br * .5 + .5) * .05;
      tails.rotation.y = Math.sin(t * 3.1) * .22; tails.rotation.z = Math.sin(t * 2.3) * .08;
      wisps.forEach(function (g, i) { var w = Math.sin(t * 5 + i * 1.7) * .5 + Math.sin(t * 3.3 + i) * .5; g.scale.set(1 - w * .06, 1 + w * .16, 1 - w * .06); });
      fistGlows.forEach(function (h, i) { var k = .4 + .12 * Math.sin(t * 3 + i * 2); h.material.opacity = k; });
      placeSparks(t);
      light.intensity = 1.9 + Math.sin(t * 2.2) * .3;
      var blink = (t % 5.2) < .12 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
