import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { finish, glow, lock, part, seg, shard } from '../kit/parts.js';
import { chain, makeRig } from '../kit/rig.js';

// =====================================================================
// SUNMANE: a lion mid-strike, one paw raised with its claws out, a great mane burning gold at the tips
// =====================================================================
export function lion() {
  var P = {
    coat: C('#c99a54'), coatDark: C('#a67a3c'), cream: C('#ecd8b0'), mane: C('#6e3f1a'), maneTip: C('#f0b24a'), nose: C('#2a1a16'),
    claw: C('#f2ead6'), gum: C('#5a1f22'), tongue: C('#c25f66'), tooth: C('#f4efe0'), eye: '#ffc13a', gold: '#ffcf5a'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  function gauss(x, c, w) { var d = (x - c) / w; return Math.exp(-d * d); }
  function coat(p, n) { var c = mix(P.coat, P.coatDark, sstep(.3, .9, n.y) * .6); return mix(c, P.cream, sstep(-.1, -.6, n.y)); }
  var FUR = { c: coat }, LOCK = { c: P.mane, tip: P.maneTip, tipAmt: .9, aoK: .35, noOcc: true };
  var CLAW = { c: P.claw, m: 'gloss', noAO: true, noOcc: true }, TOOTH = { c: P.tooth, m: 'gloss', noAO: true, noOcc: true };
  function taper(x, y, z, W, H) { var k = .55 + .45 * ((y / H + 1) / 2); return [x * k, y, z * k]; }

  // body: a deep chest, a tucked waist, heavy shoulders and haunches
  part(body, blob(2.2, 1.15, .98, .85, function (x, y, z, W) { var xn = x / W; if (y < 0) y *= 1 - .25 * gauss(xn, -.2, .4); return [x, y, z * (.9 + .1 * (xn + 1) / 2)]; }), FUR, 0, 1.5, 0);
  part(body, blob(1.0, 1.35, 1.05, .85), FUR, .78, 1.45, 0, 0, 0, -.1);
  part(body, blob(.95, 1.1, .98, .85), FUR, -.85, 1.42, 0);
  [1, -1].forEach(function (s) { part(body, blob(.6, .9, .45, .85, taper), FUR, .72, 1.5, s * .44, 0, 0, -.1); });

  // the raised right paw: a limb hung from the shoulder that swings, claws long and curved
  var swipe = new T.Group(); swipe.position.set(.75, 1.4, .46); swipe.rotation.z = 1.25; body.add(swipe);
  seg(swipe, [0, 0, 0], [.12, -.62, .03], .27, .21, FUR);
  part(swipe, blob(.42, .42, .42, .9), FUR, .12, -.62, .03);
  seg(swipe, [.12, -.62, .03], [.2, -1.2, .04], .21, .17, FUR);
  part(swipe, blob(.5, .3, .46, .8), FUR, .24, -1.28, .04);
  [-.15, -.05, .05, .15].forEach(function (dz) {
    part(swipe, blob(.14, .12, .13, .85), FUR, .3, -1.4, .04 + dz);
    part(swipe, ttube([[.3, -1.42, .04 + dz], [.34, -1.66, .04 + dz], [.44, -1.84, .04 + dz]], .05, .006, 6, 10), CLAW);
  });
  // a golden slash that flares as the paw comes through
  var slashes = [];
  [[1.25, 1.34, -1.25, 1.2], [1.45, 1.55, -1.05, 1.1], [1.65, 1.72, -.9, .95]].forEach(function (a) {
    var m = glow(body, new T.RingGeometry(a[0], a[1], 28, 1, a[2], a[3]), P.gold, .75, 1.4, .56, 0, 0, 0, .5);
    m.material.side = T.DoubleSide; slashes.push(m);
  });

  // the planted front leg and the hind legs, with big paws
  seg(legs, [.75, 1.4, -.46], [.7, .8, -.5], .27, .21, FUR);
  seg(legs, [.7, .8, -.5], [.85, .3, -.5], .21, .17, FUR);
  part(legs, blob(.6, .28, .5, .8), FUR, .96, .14, -.5);
  [-.15, -.05, .05, .15].forEach(function (dz) { part(legs, blob(.14, .12, .12, .85), FUR, 1.22, .09, -.5 + dz); shard(legs, .03, .15, 5, CLAW, [1.28, .07, -.5 + dz], [1, -.3, 0]); });
  [1, -1].forEach(function (s) {
    var hip = [-.85, 1.4, s * .46], knee = [-.5, .85, s * .52], hock = [-.95, .4, s * .5];
    seg(legs, hip, knee, .42, .26, FUR);
    seg(legs, knee, hock, .26, .17, FUR);
    seg(legs, hock, [-.85, .13, s * .5], .17, .15, FUR);
    part(legs, blob(.7, .22, .46, .8), FUR, -.62, .11, s * .5);
    [-.15, -.05, .05, .15].forEach(function (dz) { part(legs, blob(.14, .11, .11, .85), FUR, -.3, .08, s * .5 + dz); shard(legs, .028, .13, 5, CLAW, [-.24, .06, s * .5 + dz], [1, -.3, 0]); });
  });

  // head: heavy, roaring, a short broad muzzle, fangs and a furrowed brow
  var head = new T.Group(); head.position.set(1.62, 2.05, 0); head.rotation.z = -.1; body.add(head);
  part(head, blob(.88, .8, .85, .85), FUR, 0, 0, 0);
  part(head, blob(.58, .44, .54, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .15 * t), z * (1 - .2 * t)]; }), { c: function (p, n) { return mix(P.coat, P.cream, sstep(-.1, -.6, n.y) + sstep(.3, .8, n.x) * .3); } }, .52, -.14, 0);
  part(head, blob(.22, .15, .28, .75), { c: P.nose, m: 'gloss' }, .84, -.02, 0);
  var jaw = new T.Group(); jaw.position.set(.15, -.34, 0); jaw.rotation.z = -.5; head.add(jaw);
  part(jaw, blob(.68, .2, .46, .75, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .3 * t)]; }), { c: function (p, n) { return mix(P.coat, P.cream, sstep(.1, -.5, n.y)); } }, .36, -.07, 0);
  part(jaw, blob(.58, .05, .34, .8), { c: P.gum, noOcc: true }, .34, .03, 0);
  part(jaw, blob(.36, .06, .2, .9), { c: P.tongue, m: 'gloss', noOcc: true }, .3, .07, 0);
  part(head, blob(.52, .06, .38, .8), { c: P.gum, noOcc: true }, .54, -.34, 0);
  [.17, -.17].forEach(function (z) {
    shard(head, .075, .32, 6, TOOTH, [.66, -.34, z], [.1, -1, 0]);
    shard(jaw, .062, .26, 6, TOOTH, [.62, .03, z * .9], [-.1, 1, 0]);
    [.34, .46].forEach(function (x) { shard(head, .03, .12, 5, TOOTH, [x, -.34, z * 1.2], [0, -1, 0]); shard(jaw, .028, .1, 5, TOOTH, [x - .12, .03, z * 1.1], [0, 1, 0]); });
  });
  var eyes = [];
  [.35, -.35].forEach(function (z) {
    part(head, blob(.44, .14, .2, .8), FUR, .3, .28, z * .95, 0, 0, -.4);
    eyes.push(glow(head, blob(.16, .09, .06, .7), P.eye, .39, .14, z, 0, z > 0 ? -.3 : .3, -.2));
    halo(head, P.eye, .3, .42, .14, z * 1.08, .5);
    part(head, blob(.26, .26, .12, .85), FUR, -.18, .46, z * .9);
    for (var wi = 0; wi < 3; wi++) part(head, blob(.04, .04, .04, .9), { c: P.nose, noOcc: true }, .62 + wi * .04, -.1 - wi * .045, z * .62);
  });

  // the mane: four rings of long locks round the head, dark at the root and gold at the tip, a beard and a shoulder cape
  var r = rng(19);
  [[1.6, .62, 16, .34], [1.4, .74, 18, .4], [1.2, .84, 19, .46], [.98, .92, 19, .5]].forEach(function (ring) {
    for (var i = 0; i < ring[2]; i++) {
      var a = i / ring[2] * Math.PI * 2 + (r() - .5) * .1, cy = Math.cos(a), cz = Math.sin(a);
      lock(body, LOCK, [ring[0] + (r() - .5) * .06, 2.05 + cy * ring[1] * .88, cz * ring[1]], [-.7, cy * .95, cz * .95], [0, cy, cz], ring[3] + r() * .1, .24, .1, .07 + r() * .04);
    }
  });
  for (var bi = 0; bi < 9; bi++) lock(body, LOCK, [1.5 - bi * .1, 1.55 + (bi % 3) * .05, (bi - 4) * .09], [-.2, -1, (bi - 4) * .1], [1, 0, 0], .42, .2, .1, .08);
  for (var ci = 0; ci < 14; ci++) lock(body, LOCK, [1.0 - ci * .1, 2.0 - ci * .02, (r() - .5) * .5], [-1, -.3, 0], [0, 1, 0], .4 + r() * .1, .24, .1, .08);

  // tail with a tuft, and a sun-gold glow behind the head
  part(body, ttube([[-1.3, 1.55, 0], [-1.9, 1.5, 0], [-2.4, 1.15, 0], [-2.58, .7, 0]], .11, .07, 8, 20), FUR);
  for (var ti = 0; ti < 8; ti++) { var ta = ti / 8 * Math.PI * 2; lock(body, LOCK, [-2.58, .72, 0], [Math.cos(ta) * .3, -1, Math.sin(ta) * .3], [Math.cos(ta), 0, Math.sin(ta)], .4, .24, .12, .1); }
  halo(body, P.gold, 4.2, 1.3, 2.1, 0, .22);
  var motes = [];
  for (var mi = 0; mi < 24; mi++) motes.push({ m: glow(root, new T.IcosahedronGeometry(.03, 0), P.gold), ph: (mi * .137) % 1, sp: .15 + (mi % 5) * .04, r: .9 + (mi % 6) * .3 });
  var light = new T.PointLight(0xffb84a, 2.6, 4, 1.6); light.position.set(1.7, 2.1, 0); body.add(light);
  slashes.forEach(function (m) { m.userData.noFit = true; });

  finish(root, 3.4);
  return {
    root: root, head: head, name: 'lion', headView: { span: 3.0, up: .35, look: 0 },
    rig: makeRig({ plan: 'quadruped', body: body, head: head, jaw: jaw, legs: { fr: chain([swipe]) } }),
    update: function (t) {
      var br = Math.sin(t * 1.5), ph = t * 1.8;
      body.position.y = br * .015; body.scale.set(1, 1 + br * .006, 1 + br * .009);
      swipe.rotation.z = 1.25 + Math.sin(ph) * .5;
      slashes.forEach(function (m, i) { m.material.opacity = Math.max(0, -Math.cos(ph - i * .25)) * .65; });
      head.rotation.z = -.1 + Math.sin(t * .8) * .03; head.rotation.y = Math.sin(t * .55) * .1;
      jaw.rotation.z = -.5 - (Math.sin(t * 1.5) * .5 + .5) * .08;
      motes.forEach(function (e) { var kk = (t * e.sp + e.ph) % 1, an = e.ph * 20 + t * .4; e.m.position.set(1.0 + Math.cos(an) * e.r, 1.2 + kk * 2.6, Math.sin(an) * e.r); e.m.scale.setScalar(Math.max(.01, 1 - kk)); });
      light.intensity = 2.4 + Math.sin(t * 2.1) * .4;
      var blink = (t % 5.3) < .13 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
