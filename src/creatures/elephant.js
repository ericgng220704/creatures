import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, crystalGeo, ttube } from '../kit/geometry.js';
import { crystalMat, glowMat, halo } from '../kit/materials.js';
import { band, finish, glow, lock, part } from '../kit/parts.js';
import { bind, chain, hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// GRANDTUSK: a woolly mammoth in a shaggy frost-tipped coat, ice ridged along its hump, tusks rimed with frost
// =====================================================================
export function elephant() {
  var P = {
    fur: C('#4a382d'), furDark: C('#2b201a'), furLight: C('#6d5646'), frost: C('#9fb3c2'), skin: C('#3a302b'), ivory: C('#efe6d0'),
    nail: C('#cfc6b2'), crystal: '#7fd4ff', crystalGlow: '#2a9cff',
    eye: '#bff0ff', ice: '#4aa8ff', iceMid: '#a8e4ff', iceCore: '#f2fdff'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  var r = rng(23);
  // the coat: near-black brown along the back and hump, warmer on the flanks
  function coat(p, n) { var c = mix(P.fur, P.furDark, sstep(.1, .8, n.y) * .8); return mix(c, P.furLight, sstep(-.2, -.7, n.y) * .4); }
  var FUR = { c: coat }, SKIN = { c: function (p, n) { return mix(P.skin, P.furDark, sstep(.2, .8, n.y) * .5); } };
  var LOCK = { c: P.furDark, tip: P.frost, tipAmt: .28, aoK: .35, noOcc: true }, LOCKW = { c: P.fur, tip: P.frost, tipAmt: .25, aoK: .35, noOcc: true };
  var IVORY = { c: function (p, n) { return mix(P.ivory, C('#b7ad96'), sstep(.3, -.6, n.y) * .5); }, m: 'gloss' }, NAIL = { c: P.nail, m: 'gloss', noAO: true, noOcc: true };
  var ICE = crystalMat(P.crystal, P.crystalGlow);

  // body: a vast barrel with a high shoulder hump and a back that falls to the rump
  part(body, blob(2.9, 2.0, 1.95, .85), FUR, 0, 2.15, 0);
  part(body, blob(1.6, 2.0, 1.85, .85), FUR, .9, 2.2, 0);
  part(body, blob(1.5, 1.1, 1.4, .85), FUR, .7, 3.0, 0);
  part(body, blob(1.35, 1.7, 1.75, .85), FUR, -1.0, 2.05, 0);
  // a skirt of long shaggy locks round the belly and flanks, frosted at the tips
  for (var si = 0; si < 30; si++) {
    var sa = si / 30 * Math.PI * 2, sx = Math.cos(sa) * 1.45, sz = Math.sin(sa) * .98;
    lock(body, si % 2 ? LOCK : LOCKW, [sx, 1.55 + r() * .15, sz], [Math.cos(sa) * .15, -1, Math.sin(sa) * .25], [Math.cos(sa), 0, Math.sin(sa)], .7 + r() * .25, .42, .14, .08);
  }
  for (var fi = 0; fi < 22; fi++) {
    var fx = 1.1 - fi * .1, fs = fi % 2 ? 1 : -1, fy = 2.6 - Math.abs(fi - 4) * .03;
    lock(body, LOCK, [fx, fy, fs * (.8 + r() * .1)], [-.3, -1, fs * .35], [0, .3, fs], .65 + r() * .2, .38, .13, .08);
  }

  // the ice ridge: a row of crystals along the hump and back, leaning back, the shape that says Ice from the side
  var ridge = new T.Group(); body.add(ridge);
  [[1.15, 3.42, .55], [.85, 3.55, .75], [.55, 3.52, .85], [.25, 3.32, .7], [-.05, 3.18, .6], [-.35, 3.08, .5], [-.65, 2.95, .4]].forEach(function (q, i) {
    [-1, 0, 1].forEach(function (k) {
      if (k && i % 2) return;
      var h = q[2] * (k ? .55 : 1), c = new T.Mesh(crystalGeo(.11 * (k ? .7 : 1), h), ICE);
      c.position.set(q[0] + k * .08, q[1] - .12, k * .16); c.rotation.set(k * .35, 0, .45 + (i % 3) * .1); ridge.add(c);
      if (!k) glow(ridge, crystalGeo(.04, h * .8), P.iceCore, q[0], q[1] - .1, 0, 0, 0, .45 + (i % 3) * .1, .8);
    });
  });
  halo(body, P.ice, 2.6, .4, 3.4, 0, .22);
  // frost veins under the coat on each shoulder and flank
  [[[1.25, 2.9, .85], [1.1, 2.6, .92], [1.2, 2.3, .92], [1.05, 2.0, .88]], [[-.8, 2.7, .85], [-.95, 2.4, .9], [-.85, 2.1, .9]]].forEach(function (v) {
    [1, -1].forEach(function (s) { glow(body, ttube(v.map(function (q) { return [q[0], q[1], q[2] * s]; }), .022, .008, 6, 14), P.iceMid); });
  });

  // legs: pillars, each a chain shoulder or hip > knee > foot, shaggy at the top, wide feet with nails
  var LEGS = {};
  [[.95, 1], [.95, -1], [-1.0, 1], [-1.0, -1]].forEach(function (l) {
    var x = l[0], s = l[1], z = s * .68, leg = limb(legs, [[x, 1.8, z], [x + .05, .98, z + s * .02], [x + .02, .3, z + s * .02]], [[.6, .52], [.52, .46]], SKIN);
    hang(leg.joints[1], part(legs, blob(.6, .6, .6, .9), SKIN, x + .05, .98, z + s * .02));
    var ft = [part(legs, blob(1.0, .36, .92, .8), SKIN, x + .1, .17, z + s * .02)];
    [-.3, -.1, .1, .3].forEach(function (dz) { ft.push(part(legs, blob(.14, .14, .13, .85), NAIL, x + .62, .12, z + s * .02 + dz * 1.1)); });
    hang(leg.end, ft);
    var boot = [];
    for (var bi = 0; bi < 7; bi++) { var ba = bi / 7 * Math.PI * 2; boot.push(lock(legs, LOCK, [x + Math.cos(ba) * .5, 1.35, z + Math.sin(ba) * .5], [Math.cos(ba) * .15, -1, Math.sin(ba) * .15], [Math.cos(ba), 0, Math.sin(ba)], .55, .36, .13, .06)); }
    hang(leg.joints[0], boot);
    LEGS[(x > 0 ? 'f' : 'b') + (s > 0 ? 'r' : 'l')] = leg;
  });
  // tail: a short chain with a dark tuft
  var tailC = limb(body, [[-1.65, 2.5, 0], [-1.9, 2.15, 0], [-1.98, 1.7, 0]], [[.1, .08], [.08, .06]], FUR), tufts = [];
  for (var ti = 0; ti < 6; ti++) tufts.push(lock(body, LOCK, [-1.98, 1.72, 0], [Math.cos(ti) * .25, -1, Math.sin(ti) * .25], [Math.cos(ti), 0, Math.sin(ti)], .35, .16, .08, .06));
  bind(tailC, tufts);

  // head: a high domed skull, small furred ears, heavy brows over pale ice eyes that read across the field
  var head = new T.Group(); head.position.set(1.95, 2.62, 0); head.rotation.z = -.08; body.add(head);
  part(head, blob(1.2, 1.4, 1.1, .85, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x * (1 - .15 * t), y, z * (1 - .2 * t)]; }), FUR, 0, .1, 0);
  part(head, blob(.85, .8, .95, .85), FUR, .35, -.35, 0);
  for (var hi = 0; hi < 9; hi++) { var ha = -1.1 + hi / 8 * 2.2; lock(head, LOCK, [-.05 + Math.cos(ha) * .1, .62 + Math.cos(ha) * .12, Math.sin(ha) * .36], [-1, .2, Math.sin(ha) * .5], [0, 1, Math.sin(ha)], .38, .3, .1, .12); }
  var eyes = [], ears = [];
  [.5, -.5].forEach(function (z) {
    part(head, blob(.42, .17, .22, .8), { c: P.furDark, noOcc: true }, .42, .26, z * .9, 0, z > 0 ? -.2 : .2, -.3);
    eyes.push(glow(head, blob(.16, .08, .06, .7), P.eye, .5, .13, z * .98, 0, z > 0 ? -.35 : .35, -.22));
    halo(head, P.ice, .45, .53, .13, z * 1.05, .5);
    var ear = new T.Group(); ear.position.set(-.3, .3, z * .55); ear.rotation.y = z > 0 ? .25 : -.25; head.add(ear); ears.push(ear);
    part(ear, blob(.16, .6, .5, .8), FUR, 0, 0, z * .2);
  });
  // a frost rune on the brow
  glow(head, ttube([[.58, .62, 0], [.64, .46, .08], [.62, .34, -.06], [.66, .2, .05]], .016, .01, 6, 14), P.iceMid);
  // the trunk: eight joints, each turning a little more, so it can sway and curl; furred to the tip
  var trunk = new T.Group(); trunk.position.set(.7, -.2, 0); head.add(trunk);
  var base = [-.55, -.4, -.25, -.12, .05, .25, .5, .8], tj = [], pg = trunk;
  for (var i = 0; i < 8; i++) {
    var g = new T.Group(); g.position.set(i ? .38 : 0, 0, 0); g.rotation.z = base[i]; pg.add(g); pg = g;
    var rr = .27 - i * .022;
    part(g, blob(.56, rr * 2, rr * 2, .9), i < 3 ? FUR : SKIN, .2, 0, 0);
    tj.push({ g: g, base: base[i] });
  }
  // tusks: great ivory spirals curving up and in, banded with frost, their points rimed with glowing ice
  [1, -1].forEach(function (s) {
    var pts = [[.55, -.55, s * .44], [1.2, -1.05, s * .64], [1.95, -.9, s * .64], [2.35, -.25, s * .42], [2.18, .22, s * .2]];
    part(head, ttube(pts, .22, .05, 10, 32), IVORY);
    band(head, { c: P.frost, m: 'metal' }, pts[0], pts[1], .3, .25, .1);
    var tip = pts[4], prev = pts[3], d = new T.Vector3(tip[0] - prev[0], tip[1] - prev[1], tip[2] - prev[2]).normalize();
    glow(head, new T.ConeGeometry(.06, .42, 6).translate(0, .21, 0), P.iceMid, prev[0] + d.x * .3, prev[1] + d.y * .3, prev[2] + d.z * .3, 0, 0, 0, .85).quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d);
    [[1.6, -1.02], [2.15, -.62]].forEach(function (q, k) { var c = new T.Mesh(crystalGeo(.07, .3 - k * .06), ICE); c.position.set(q[0], q[1] + .05, s * .62); c.rotation.set(s * .4, 0, -.2); head.add(c); });
  });
  // snow drifting round it: one instanced mesh
  var MN = 22, snow = new T.InstancedMesh(new T.OctahedronGeometry(.035, 0), glowMat('#ffffff'), MN), sn = new T.Object3D(), fl = [];
  snow.frustumCulled = false; snow.userData.noFit = true; root.add(snow);
  for (var mi = 0; mi < MN; mi++) { fl.push({ ph: (mi * .137) % 1, x: -2 + (mi % 9) * .55, z: ((mi * 37) % 11 - 5) * .3, sp: .12 + (mi % 4) * .03 }); snow.setColorAt(mi, new T.Color(mi % 3 ? P.iceMid : P.iceCore)); }
  function placeSnow(t) {
    fl.forEach(function (e, i) { var k = (t * e.sp + e.ph) % 1; sn.position.set(e.x + Math.sin(t + e.ph * 9) * .2, 4.0 - k * 3.6, e.z); sn.rotation.y = t + e.ph * 5; sn.scale.setScalar(Math.sin(k * Math.PI)); sn.updateMatrix(); snow.setMatrixAt(i, sn.matrix); });
    snow.instanceMatrix.needsUpdate = true;
  }
  placeSnow(0);
  var light = new T.PointLight(0x9fdcff, 2.2, 4, 1.6); light.position.set(.6, 3.6, 0); body.add(light);

  // the neck joint, under the hump, carrying the head with its trunk and tusks
  var neck = new T.Group(); neck.position.set(1.45, 2.55, 0); body.add(neck);
  hang(neck, [head]);

  finish(root, 4.0);
  return {
    root: root, head: head, name: 'elephant', headView: { span: 4.6, up: .2, look: -.2 },
    rig: makeRig({ plan: 'quadruped', body: body, neck: neck, head: head, ears: ears, tail: tailC.joints, legs: LEGS, extra: { trunk: chain(tj.map(function (j) { return j.g; })) } }),
    // a tank charges head down and drives its tusks up through the target
    clips: {
      attack: { tracks: {
        'head.pitch': [[0, 0], [.25, .25], [.42, -.3], [.5, .35, 'in'], [.62, .1], [.85, 0]],
        'trunk.curl': [[0, 0], [.25, 1.2], [.5, -.6], [.8, 0]],
        'body.pitch': [[0, 0], [.25, .08], [.42, -.06], [.5, .1], [.8, 0]],
        'front.y': [[0, 0], [.28, .45], [.4, .2], [.5, 0]], 'front.x': [[0, 0], [.28, .1], [.45, .2], [.55, 0]]
      } }
    },
    update: function (t) {
      var br = Math.sin(t * 1.0);
      body.position.y = br * .02; body.scale.set(1, 1 + br * .005, 1 + br * .008);
      head.rotation.z = -.08 + Math.sin(t * .6) * .03; head.rotation.y = Math.sin(t * .45) * .08;
      ears.forEach(function (e, i) { e.rotation.y = (i ? -.25 : .25) + (i ? -1 : 1) * Math.sin(t * 1.4 + i) * .1; });
      tj.forEach(function (j, i) { j.g.rotation.z = j.base + Math.sin(t * 1.1 - i * .5) * .05 * (1 + i * .25); });
      placeSnow(t);
      light.intensity = 2 + Math.sin(t * 1.8) * .3;
      var blink = (t % 6.3) < .14 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
