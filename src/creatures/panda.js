import * as T from 'three';
import { C, mix, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { band, feather, finish, glow, lock, part, seg, shard } from '../kit/parts.js';

// =====================================================================
// IRONPAW: a panda warrior in a wide stance, one fist thrown and wrapped in qi
// =====================================================================
export function panda() {
  var P = {
    white: C('#f2efe8'), black: C('#1e1d22'), red: C('#c0282d'), redDark: C('#7e1a1e'), gold: C('#e3b43f'), nose: C('#101010'),
    tongue: C('#d6747c'), gum: C('#6a2a2c'), tooth: C('#fffdf4'), claw: C('#efe6d0'), qi: '#fff2a0', qiDeep: '#ffb02e', eye: '#ffe9a0'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  function torso(p, n) { var c = mix(P.white, C('#cfcac0'), sstep(.2, -.6, n.y) * .35); return mix(c, P.black, sstep(2.5, 2.62, p.y)); }
  var BODYL = { c: torso }, FURB = { c: P.black }, FURW = { c: P.white };
  var GOLD = { c: P.gold, m: 'metal' };
  var LOCKW = { c: P.white, tip: C('#ffffff'), tipAmt: .5, aoK: .4, noOcc: true };
  var CLAW = { c: P.claw, m: 'gloss', noAO: true, noOcc: true }, TOOTH = { c: P.tooth, m: 'gloss', noAO: true, noOcc: true };
  var RIB = { m: 'plume', g: [P.redDark, P.red, C('#e24a40')], noOcc: true, aoK: .3 };
  var UPV = [0, 1, 0];

  // body: a round, heavy trunk with a black shoulder band, black legs wide apart in a horse stance
  part(body, blob(1.3, .95, 1.4, .85), FURB, -.05, 1.35, 0);
  part(body, blob(1.45, 1.8, 1.6, .88), BODYL, -.05, 2.05, 0, 0, 0, -.1);
  [1, -1].forEach(function (s) {
    var hip = [-.02, 1.25, s * .45], knee = [.22, .75, s * .9], ank = [.06, .22, s * .86];
    seg(legs, hip, knee, .55, .42, FURB);
    part(legs, blob(.5, .5, .5, .9), FURB, knee[0], knee[1], knee[2]);
    seg(legs, knee, ank, .4, .3, FURB);
    part(legs, blob(.95, .26, .6, .8), FURB, .3, .13, s * .86);
    [-.18, 0, .18].forEach(function (dz) { shard(legs, .04, .16, 5, CLAW, [.76, .1, s * .86 + dz * 1.1], [1, -.2, dz * .8]); });
    band(legs, { c: P.red }, knee, ank, .55, .38, .12);
  });
  // a black belt, a gold buckle and the red tails of a knot
  var belt = [];
  for (var b = 0; b < 24; b++) { var ab = b / 24 * Math.PI * 2; belt.push([Math.cos(ab) * .72 - .05, 1.62, Math.sin(ab) * .78]); }
  part(body, ttube(belt, .1, .1, 8, 72, true), { c: P.black });
  part(body, blob(.1, .3, .3, .8), GOLD, .68, 1.62, 0);
  [.1, -.1].forEach(function (z, i) { feather(body, RIB, [-.7, 1.6, z], [-.4, -1, z * 2], [1, 0, 0], .9 + i * .1, .22, .1); });

  // the thrown right arm: a group at the shoulder, so the whole arm can drive forward
  var rArm = new T.Group(); rArm.position.set(.05, 2.5, .8); body.add(rArm);
  seg(rArm, [0, 0, 0], [.62, -.1, .05], .45, .38, FURB);
  part(rArm, blob(.7, .6, .6, .85), FURB, .1, .05, 0);
  seg(rArm, [.62, -.1, .05], [1.3, -.12, -.05], .38, .32, FURB);
  band(rArm, { c: P.white }, [.62, -.1, .05], [1.3, -.12, -.05], .75, .36, .3);
  band(rArm, { c: P.red }, [.62, -.1, .05], [1.3, -.12, -.05], .9, .34, .1);
  part(rArm, blob(.6, .54, .54, .85), FURB, 1.5, -.12, -.05);
  [-.16, -.05, .06, .17].forEach(function (dz) { part(rArm, blob(.16, .13, .13, .85), { c: P.black }, 1.74, -.05, -.05 + dz); });
  // qi: a gold glow at the fist, bands of light that fly off it, and sparks that circle it
  var qiRings = [];
  for (var qr = 0; qr < 3; qr++) { var ring = glow(rArm, new T.TorusGeometry(.5, .028, 6, 36), P.qi, 1.8, -.12, -.05, 0, Math.PI / 2, 0, .7); qiRings.push(ring); }
  halo(rArm, P.qiDeep, 1.9, 1.6, -.12, -.05, .55);
  halo(rArm, P.qi, .9, 1.7, -.12, -.05, .6);
  var sparks = [];
  for (var sp = 0; sp < 14; sp++) sparks.push({ m: glow(rArm, new T.IcosahedronGeometry(.03, 0), P.qi), ph: sp / 14 });
  // the other fist drawn back at the hip
  var lArm = new T.Group(); lArm.position.set(.05, 2.5, -.8); body.add(lArm);
  seg(lArm, [0, 0, 0], [-.4, -.5, -.12], .45, .38, FURB);
  part(lArm, blob(.7, .6, .6, .85), FURB, -.05, .05, 0);
  seg(lArm, [-.4, -.5, -.12], [.28, -.62, .12], .38, .32, FURB);
  band(lArm, { c: P.white }, [-.4, -.5, -.12], [.28, -.62, .12], .78, .36, .3);
  part(lArm, blob(.56, .5, .5, .85), FURB, .45, -.64, .15);

  // head: round, with black ears and eye patches, brows drawn down, a shouting mouth
  var head = new T.Group(); head.position.set(.5, 3.25, 0); head.rotation.z = -.12; body.add(head);
  part(head, blob(1.15, 1.0, 1.1, .9), FURW, 0, 0, 0);
  part(head, blob(.52, .42, .56, .85), FURW, .66, -.16, 0);
  part(head, blob(.2, .14, .26, .75), { c: P.nose, m: 'gloss' }, .94, -.02, 0);
  var jaw = new T.Group(); jaw.position.set(.22, -.38, 0); jaw.rotation.z = -.4; head.add(jaw);
  part(jaw, blob(.6, .17, .46, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .3 * t)]; }), FURW, .32, -.05, 0);
  part(jaw, blob(.5, .05, .34, .8), { c: P.gum, noOcc: true }, .3, .03, 0);
  part(jaw, blob(.3, .06, .18, .9), { c: P.tongue, m: 'gloss', noOcc: true }, .26, .07, 0);
  part(head, blob(.5, .05, .38, .8), { c: P.gum, noOcc: true }, .62, -.36, 0);
  [.13, -.13].forEach(function (z) { shard(head, .045, .14, 6, TOOTH, [.76, -.36, z], [0, -1, 0]); shard(jaw, .04, .12, 6, TOOTH, [.5, .03, z * .9], [0, 1, 0]); });
  var eyes = [];
  [.4, -.4].forEach(function (z) {
    part(head, blob(.3, .52, .16, .8), FURB, .46, .06, z, z > 0 ? .5 : -.5, 0, -.15);
    eyes.push(glow(head, blob(.15, .07, .05, .7), P.eye, .56, .11, z * 1.04, 0, z > 0 ? -.3 : .3, -.35));
    part(head, blob(.4, .11, .2, .8), FURW, .44, .36, z * .92, 0, 0, -.4);
    part(head, blob(.34, .34, .18, .85), FURB, -.15, .56, z * 1.3);
    for (var ci = 0; ci < 4; ci++) lock(head, LOCKW, [.1 + ci * .06, -.18 - ci * .06, z * 1.0], [-.5, -.3, z * 1.2], [0, -.3, z], .26, .22, .1, .06);
  });
  // a headband: a red loop with a gold plate and two tails that stream behind
  var hb = [];
  for (var h = 0; h < 20; h++) { var ah = h / 20 * Math.PI * 2; hb.push([Math.cos(ah) * .5 - .02, .36 + Math.cos(ah) * .02, Math.sin(ah) * .52]); }
  part(head, ttube(hb, .06, .06, 8, 60, true), { c: P.red });
  part(head, blob(.07, .2, .22, .8), GOLD, .5, .36, 0);
  var tails = new T.Group(); tails.position.set(-.5, .36, 0); head.add(tails);
  [.1, -.1].forEach(function (z, i) { feather(tails, RIB, [0, 0, z], [-1, -.15 - i * .05, z * 3], UPV, 1.5 - i * .15, .3, .2); });
  var light = new T.PointLight(0xffd25a, 2.2, 3.6, 1.6); light.position.set(1.7, 2.4, .7); body.add(light);

  finish(root, 3.8);
  return {
    root: root, head: head, name: 'panda', headView: { span: 2.4, up: .3, look: 0 },
    update: function (t) {
      var br = Math.sin(t * 1.6), pn = Math.max(0, Math.sin(t * 2.4));
      body.position.y = br * .015; body.scale.set(1, 1 + br * .006, 1 + br * .008);
      rArm.scale.x = 1 + pn * pn * .2; lArm.rotation.z = -pn * .05;
      head.rotation.z = -.12 + Math.sin(t * .8) * .03; head.rotation.y = Math.sin(t * .55) * .08;
      jaw.rotation.z = -.4 - pn * .12;
      tails.rotation.y = Math.sin(t * 3.1) * .22; tails.rotation.z = Math.sin(t * 2.3) * .08;
      qiRings.forEach(function (rg, i) { var k = ((t * .9 + i / 3) % 1); rg.position.x = 1.8 + k * 1.8; rg.scale.setScalar(.7 + k * 1.1); rg.material.opacity = (1 - k) * .75 * (.4 + pn); });
      sparks.forEach(function (e, i) { var an = t * 2.6 + e.ph * Math.PI * 2; e.m.position.set(1.7 + Math.sin(t * 1.9 + i) * .5, -.12 + Math.cos(an) * .6, -.05 + Math.sin(an) * .6); e.m.scale.setScalar(.6 + .4 * Math.sin(an * 2)); });
      light.intensity = 2 + pn * 1.2;
      var blink = (t % 5.2) < .12 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
