import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, leafGeo, lumpGeo, ttube } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { finish, glow, lock, part, seg, shard } from '../kit/parts.js';

// =====================================================================
// THORNSTAG
// =====================================================================
export function thornstag() {
  var P = {
    coat: C('#a4794c'), coatDark: C('#76522f'), cream: C('#ecdfc4'), earIn: C('#d9a08f'), nose: C('#1b1512'),
    hoof: C('#2a221f'), bark: C('#6c4c30'), barkDark: C('#4a321f'), leaf: C('#78c255'), leafDark: C('#4c973a'),
    moss: C('#5a9a45'), mossLight: C('#8fcb5c'), cap: C('#e2683f'), stalk: C('#f1e8d6'),
    blossom: C('#ffb9cd'), blossomCore: C('#ffd96a'), tusk: C('#f3eee3'),
    eye: '#c4ff86', rune: '#a6ff70', fly: '#d8ff9a', mouth: C('#4a2a1e'), vine: C('#4f8a3a'), gold: '#ffe58a'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  // fawn spots on the flanks and haunches, as (x, y, side) on the surface
  var SPOTS = [], sr = rng(5);
  for (var i = 0; i < 38; i++) SPOTS.push({ x: -.85 + sr() * 1.5, y: 1.42 + sr() * .5, s: sr() < .5 ? 1 : -1 });
  function coat(p, n) {
    var c = mix(P.coat, P.coatDark, sstep(.35, .9, n.y));
    c = mix(c, P.cream, sstep(-.3, -.7, n.y));
    if (n.y > .5 && Math.abs(p.z) < .13 && p.y > 1.75) c = mix(c, P.coatDark, .65);
    if (Math.abs(n.z) > .4 && p.y > 1.35 && p.y < 2.0) {
      var sd = n.z > 0 ? 1 : -1;
      for (var i = 0; i < SPOTS.length; i++) { var S = SPOTS[i]; if (S.s === sd && (p.x - S.x) * (p.x - S.x) + (p.y - S.y) * (p.y - S.y) < .0016) return mix(c, P.cream, .9); }
    }
    if (p.x < -.9 && n.x < -.3) c = mix(c, P.cream, .85);
    return c;
  }
  var COAT = { c: coat }, CREAM = { c: P.cream, tip: P.cream, tipAmt: .3, aoK: .5 };
  function gauss(x, c, w) { var d = (x - c) / w; return Math.exp(-d * d); }
  // the back's height along its length, so the moss and the flower can sit on it
  function stagTop(x) { var xn = x / .95; return 1.54 + .43 + .07 * gauss(xn, .55, .22) + .05 * gauss(xn, -.72, .2); }
  // body: a barrel of ribs, a tucked flank, withers and hips that rise
  part(body, blob(1.9, .86, .86, .8, function (x, y, z, W, H) {
    var xn = x / W, rib = 1 + .13 * gauss(xn, .3, .38) - .12 * gauss(xn, -.3, .26);
    if (y > 0) y += (.07 * gauss(xn, .55, .22) + .05 * gauss(xn, -.72, .2)) * (y / H);
    else y *= (1 - .22 * gauss(xn, -.25, .35)) * (.92 + .16 * (xn + 1) / 2);
    return [x, y, z * rib * (.9 + .1 * (xn + 1) / 2)];
  }), COAT, 0, 1.54, 0);
  part(body, blob(.72, .96, .76, .82), COAT, .62, 1.48, 0, 0, 0, -.1);
  part(body, blob(.76, .9, .8, .82), COAT, -.7, 1.6, 0);
  // built shoulders and thighs: shoulder blade, deltoid, triceps; thigh, glute, stifle
  function taper(x, y, z, W, H) { var k = .5 + .5 * ((y / H + 1) / 2); return [x * k, y, z * k]; }
  [1, -1].forEach(function (s) {
    part(body, blob(.5, .66, .24, .85, taper), COAT, .5, 1.72, s * .36, 0, 0, -.35);
    part(body, blob(.32, .52, .24, .85, taper), COAT, .64, 1.38, s * .35, 0, 0, -.12);
    part(body, blob(.24, .4, .2, .85, taper), COAT, .36, 1.32, s * .34);
    part(body, blob(.5, .8, .3, .85, taper), COAT, -.6, 1.34, s * .3, 0, 0, .25);
    part(body, blob(.46, .42, .28, .85), COAT, -.8, 1.68, s * .28);
    part(body, blob(.24, .4, .2, .85, taper), COAT, -.4, 1.08, s * .26);
  });
  // neck: a crest of muscle along the top, a heavy base into the withers, and a soft throat ruff
  seg(body, [1.16, 2.42, 0], [.72, 1.7, 0], .2, .3, COAT, .9, 1.05);
  part(body, blob(.46, .95, .4, .85), COAT, .94, 2.06, 0, 0, 0, -.55);
  part(body, blob(.6, .7, .55, .85), COAT, .7, 1.9, 0);
  var r = rng(9);
  for (var k = 0; k < 9; k++) lock(body, CREAM, [1.06 - k * .04 + (r() - .5) * .04, 2.12 - k * .07, (r() - .5) * .3], [-.15, -1, (r() - .5) * .6], [1, -.2, 0], .28 + r() * .08, .14, .08, .08);
  // tail: a raised, curving scut, dark on top and cream beneath, fringed with soft locks and tipped with a sprig
  var tail = new T.Group(); tail.position.set(-1.0, 1.86, 0); body.add(tail);
  part(tail, ttube([[0, 0, 0], [-.17, .07, 0], [-.32, .03, 0], [-.42, -.13, 0], [-.46, -.3, 0]], .13, .06, 10, 16), { c: function (p, n) { return mix(P.coatDark, P.cream, sstep(.2, -.45, n.y)); } });
  [[-.18, .0], [-.28, -.04], [-.37, -.12], [-.43, -.22], [-.46, -.3]].forEach(function (q, i) {
    [.05, -.05].forEach(function (z) { lock(tail, CREAM, [q[0], q[1] - .03, z], [-.3, -1, z * 3], [-1, -.3, 0], .2 + i * .02, .1, .07, .05); });
  });
  for (var tl = 0; tl < 3; tl++) part(tail, leafGeo(.2, .09), { c: tl === 1 ? P.leafDark : P.leaf, m: 'leaf', noOcc: true }, -.46, -.3, 0, -2.4 + tl * .3, tl * 1.2 - 1.2, .3);
  // legs: long and fine, knees and hocks, cloven hooves
  var LEG = { c: function (p, n) { return mix(P.coat, P.cream, sstep(.6, .2, p.y) * .25 + (n.x < -.3 ? .1 : 0)); } };
  var HOOF = { c: P.hoof, m: 'gloss' };
  function hoofHalf(x, z) { part(legs, blob(.14, .13, .075, .75, function (xx, y, zz, W) { return [xx, y * (1 - .3 * Math.max(0, xx / W)), zz]; }), HOOF, x, .065, z); }
  [.22, -.22].forEach(function (z) {
    seg(legs, [.58, 1.32, z], [.62, .76, z], .14, .095, COAT);
    part(legs, blob(.15, .16, .14, .9), LEG, .63, .74, z);
    seg(legs, [.62, .74, z], [.63, .24, z], .075, .065, LEG);
    seg(legs, [.63, .24, z], [.68, .1, z], .07, .07, LEG);
    seg(legs, [-.64, 1.44, z], [-.48, .98, z], .19, .13, COAT);
    seg(legs, [-.48, .98, z], [-.82, .64, z], .13, .085, COAT);
    part(legs, blob(.15, .15, .13, .9), LEG, -.82, .63, z);
    seg(legs, [-.82, .62, z], [-.76, .22, z], .075, .065, LEG);
    seg(legs, [-.76, .22, z], [-.71, .1, z], .07, .07, LEG);
    [.04, -.04].forEach(function (dz) { hoofHalf(.73, z + dz); hoofHalf(-.66, z + dz); });
  });
  // moss mantle with sprouts, two mushrooms and a flower
  var mr = rng(21);
  for (var m = 0; m < 22; m++) {
    var t = m / 21, mx = -.78 + t * 1.6, my = stagTop(mx) - .03 + Math.sin(t * Math.PI) * .03 + (mx > .55 ? (mx - .55) * 1.2 : 0), mz = (mr() - .5) * .38;
    if (mx > .55) mx = .55 + (mx - .55) * .7;
    part(body, lumpGeo(.085 + mr() * .06, m * 7 + 1), { c: mr() < .35 ? P.mossLight : P.moss, m: 'flat' }, mx, my, mz, mr() * 3, mr() * 3, mr() * 3);
    if (m % 2 === 0) shard(body, .018, .14 + mr() * .1, 4, { c: P.leaf, m: 'flat', noOcc: true }, [mx + (mr() - .5) * .1, my + .06, mz], [(mr() - .5) * .6, 1, (mr() - .5) * .6]);
  }
  [[-.3, 0, .12, .9], [.12, 0, -.14, .7]].forEach(function (mu) {
    var s = mu[3]; mu[1] = stagTop(mu[0]) - .01;
    part(body, new T.CylinderGeometry(.025 * s, .032 * s, .14 * s, 8), { c: P.stalk, noOcc: true }, mu[0], mu[1] + .06 * s, mu[2]);
    part(body, blob(.16 * s, .09 * s, .16 * s, .9, function (x, y, z) { return [x, Math.max(y, -.01), z]; }), { c: P.cap, m: 'gloss', noOcc: true }, mu[0], mu[1] + .15 * s, mu[2]);
  });
  var fl = new T.Group(); fl.position.set(-.55, stagTop(-.55) - .01, -.08); body.add(fl);
  for (var pe = 0; pe < 5; pe++) part(fl, blob(.08, .025, .05, .9), { c: P.blossom, noOcc: true }, Math.cos(pe * 1.2566) * .045, 0, Math.sin(pe * 1.2566) * .045, 0, -pe * 1.2566, 0);
  part(fl, blob(.04, .035, .04, .9), { c: P.blossomCore, noOcc: true }, 0, .015, 0);
  // rune light on shoulders and haunches
  [1, -1].forEach(function (s) {
    glow(body, ttube([[.42, 1.78, .5 * s], [.58, 1.62, .55 * s], [.48, 1.46, .56 * s], [.6, 1.3, .53 * s]], .02, .012, 6, 24), P.rune);
    glow(body, ttube([[.66, 1.74, .5 * s], [.7, 1.6, .54 * s]], .016, .01, 6, 8), P.rune);
    glow(body, ttube([[-.48, 1.8, .52 * s], [-.66, 1.62, .56 * s], [-.56, 1.44, .57 * s], [-.7, 1.28, .53 * s]], .02, .012, 6, 24), P.rune);
  });
  // head
  var head = new T.Group(); head.position.set(1.24, 2.62, 0); head.rotation.z = -.12; body.add(head);
  part(head, blob(.52, .44, .44, .8, function (x, y, z, W) { return [x, y, z * (1 - .12 * Math.max(0, x / W))]; }), COAT, 0, 0, 0);
  // a long, deep muzzle and a closed, gentle mouth: no fangs, the corners of the lips turned up
  part(head, blob(.56, .36, .38, .76, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .2 * t), z * (1 - .3 * t)]; }), COAT, .33, -.07, 0);
  part(head, blob(.16, .12, .2, .75), { c: P.nose, m: 'gloss' }, .62, -.03, 0);
  var jaw = new T.Group(); jaw.position.set(.1, -.2, 0); jaw.rotation.z = -.05; head.add(jaw);
  part(jaw, blob(.44, .13, .3, .72, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .45 * t)]; }), { c: function (p, n) { return mix(P.coat, P.cream, sstep(.1, -.5, n.y)); } }, .26, .0, 0);
  [1, -1].forEach(function (sd) {
    part(head, ttube([[.1, -.2, sd * .15], [.3, -.265, sd * .17], [.5, -.245, sd * .12], [.6, -.19, sd * .1]], .012, .01, 6, 14), { c: P.mouth, noAO: true, noOcc: true });
  });
  var eyes = [], ears = [];
  [.22, -.22].forEach(function (z) {
    part(head, blob(.2, .16, .06, .8), { c: '#2a1d14', noOcc: true }, .14, .05, z * .98);
    eyes.push(glow(head, blob(.15, .11, .05, .75), P.eye, .15, .05, z * 1.03, 0, z > 0 ? -.2 : .2, 0));
    halo(head, P.eye, .3, .17, .05, z * 1.15, .5);
    var ear = new T.Group(); ear.position.set(-.08, .14, z * .8); ear.rotation.set(z > 0 ? 1.1 : -1.1, 0, .3); head.add(ear); ears.push(ear);
    part(ear, blob(.24, .5, .1, .75, function (x, y, zz, W, H) { var t = (y / H + 1) / 2; return [x * (1 - .75 * t * t), y, zz]; }), COAT, 0, .25, 0);
    part(ear, blob(.16, .38, .05, .78, function (x, y, zz, W, H) { var t = (y / H + 1) / 2; return [x * (1 - .8 * t * t), y, zz]; }), { c: P.earIn, noOcc: true }, 0, .24, z > 0 ? .035 : -.035);
  });
  // antlers: tapered beams that branch, with leaves, moss and one blossom
  var antlers = new T.Group(); head.add(antlers);
  var BARK = { c: function (p, n) { return mix(P.bark, P.barkDark, sstep(.2, -.6, n.y)); }, m: 'flat' };
  var leaves = [];
  function leafCluster(parent, at, n, seed) {
    var q = rng(seed);
    for (var i = 0; i < n; i++) leaves.push(part(parent, leafGeo(.2 + q() * .08, .1), { c: q() < .4 ? P.leafDark : P.leaf, m: 'leaf', noOcc: true }, at[0], at[1], at[2], q() * 6, q() * 6, q() * 6));
  }
  [1, -1].forEach(function (s) {
    var A = new T.Group(); A.position.set(-.02, .2, .12 * s); antlers.add(A);
    part(A, lumpGeo(.07, s > 0 ? 3 : 4, 1), { c: P.barkDark, m: 'flat' }, 0, 0, 0);
    part(A, ttube([[0, 0, 0], [-.1, .28, .1 * s], [-.18, .58, .17 * s], [-.12, .9, .22 * s], [.04, 1.12, .22 * s]], .065, .02, 7, 22), BARK);
    [
      [[-.02, .12, .03 * s], [.14, .2, .08 * s], [.27, .34, .12 * s]],
      [[-.13, .4, .13 * s], [.04, .58, .18 * s], [.14, .74, .2 * s]],
      [[-.17, .66, .19 * s], [-.02, .86, .26 * s], [.03, 1.0, .3 * s]],
      [[-.15, .8, .2 * s], [-.38, .94, .25 * s], [-.5, 1.04, .26 * s]]
    ].forEach(function (tn) { part(A, ttube(tn, .036, .014, 6, 12), BARK); });
    leafCluster(A, [.27, .35, .12 * s], 4, 30 + s);
    leafCluster(A, [.04, 1.13, .22 * s], 5, 40 + s);
    leafCluster(A, [-.5, 1.05, .26 * s], 4, 50 + s);
    leafCluster(A, [.03, 1.0, .3 * s], 3, 60 + s);
    part(A, lumpGeo(.06, 8 + s, 1), { c: P.moss, m: 'flat', noOcc: true }, -.16, .55, .17 * s);
    if (s > 0) {
      var bl = new T.Group(); bl.position.set(.15, .76, .21); A.add(bl);
      for (var pe2 = 0; pe2 < 5; pe2++) part(bl, blob(.1, .03, .065, .9), { c: P.blossom, noOcc: true }, Math.cos(pe2 * 1.2566) * .055, 0, Math.sin(pe2 * 1.2566) * .055, 0, -pe2 * 1.2566, 0);
      part(bl, blob(.05, .045, .05, .9), { c: P.blossomCore, noOcc: true }, 0, .02, 0);
      bl.rotation.set(.4, 0, -.5);
    }
  });
  var light = new T.PointLight(0x9dff6a, 1.8, 2.6, 1.6); light.position.set(0, 1.7, 0); body.add(light);
  // the forest's blessing: larger antlers with a glow behind them, vines and blossoms round the neck,
  // a leaf emblem on the chest, and leaves and petals turning slowly round the crown
  antlers.scale.setScalar(1.15);
  halo(head, P.fly, 3.0, 0, .85, 0, .24);
  halo(head, P.gold, 1.7, 0, .85, 0, .2);
  function blossom(parent, x, y, z, sc, rx, rz) {
    var g = new T.Group(); g.position.set(x, y, z); g.rotation.set(rx || 0, 0, rz || 0); parent.add(g);
    for (var q = 0; q < 5; q++) part(g, blob(.1 * sc, .03 * sc, .065 * sc, .9), { c: P.blossom, noOcc: true }, Math.cos(q * 1.2566) * .055 * sc, 0, Math.sin(q * 1.2566) * .055 * sc, 0, -q * 1.2566, 0);
    part(g, blob(.05 * sc, .045 * sc, .05 * sc, .9), { c: P.blossomCore, noOcc: true }, 0, .02 * sc, 0);
  }
  [1, -1].forEach(function (sd) {
    var vp = [[.46, 1.98, sd * .44], [.74, 2.18, sd * .38], [.98, 2.14, sd * .34], [1.06, 2.34, sd * .26], [1.2, 2.46, sd * .17]];
    part(body, ttube(vp, .03, .016, 6, 20), { c: P.vine, noOcc: true });
    vp.forEach(function (q, i) {
      part(body, leafGeo(.16, .09), { c: i % 2 ? P.leafDark : P.leaf, m: 'leaf', noOcc: true }, q[0], q[1], q[2], .6 + i, i * 1.7, .5);
      if (i === 1 || i === 3) blossom(body, q[0], q[1] + .04, q[2] + sd * .05, .9, sd * .5, .2);
    });
  });
  var emblem = glow(body, leafGeo(.5, .28), P.gold, 1.12, 1.36, 0, 0, Math.PI / 2, 0);
  emblem.material.side = T.DoubleSide;
  halo(body, P.gold, 1.1, 1.16, 1.6, 0, .5);
  var orbit = [];
  for (var oi = 0; oi < 16; oi++) {
    var om = glow(head, leafGeo(.14, .075), oi % 3 === 0 ? P.blossom : oi % 3 === 1 ? P.gold : P.leaf);
    om.material.side = T.DoubleSide;
    orbit.push({ m: om, ph: oi / 16 * Math.PI * 2, r: .8 + (oi % 4) * .1, h: .5 + (oi % 5) * .14 });
  }
  // fireflies around the antlers
  var flies = [];
  for (var f = 0; f < 7; f++) flies.push({ m: glow(head, new T.IcosahedronGeometry(.022, 0), P.fly), ph: f * .9, r: .35 + (f % 3) * .12, h: .7 + (f % 4) * .15, sp: .6 + (f % 3) * .2 });
  finish(root, 3.0);
  return {
    root: root, head: head, name: 'thornstag',
    update: function (t) {
      var br = Math.sin(t * 1.8);
      body.position.y = br * .012; body.scale.set(1, 1 + br * .008, 1 + br * .01);
      head.rotation.z = -.12 + Math.sin(t * .9) * .04; head.rotation.y = Math.sin(t * .55) * .08;
      jaw.rotation.z = -.05 - (Math.sin(t * 1.1) * .5 + .5) * .015;
      var flick = (t % 3.9) < .25 ? Math.sin((t % 3.9) / .25 * Math.PI) * .35 : 0;
      ears[0].rotation.x = 1.1 + flick;
      antlers.rotation.x = Math.sin(t * .8) * .015;
      leaves.forEach(function (l, i) { l.rotation.z += Math.sin(t * 2 + i) * .0015; });
      flies.forEach(function (fl) { var a = t * fl.sp + fl.ph; fl.m.position.set(Math.cos(a) * fl.r - .1, fl.h + Math.sin(a * 1.7) * .12, Math.sin(a) * fl.r); fl.m.scale.setScalar(.6 + .4 * Math.sin(t * 6 + fl.ph * 3)); });
      tail.rotation.y = Math.sin(t * 1.9) * .22; tail.rotation.z = Math.sin(t * 1.3) * .05;
      orbit.forEach(function (o) { var a = t * .45 + o.ph; o.m.position.set(Math.cos(a) * o.r - .1, o.h + Math.sin(a * 2 + o.ph) * .1, Math.sin(a) * o.r); o.m.rotation.set(t * 1.2 + o.ph, -a, t * .8); });
      emblem.scale.setScalar(1 + Math.sin(t * 1.6) * .06);
      light.intensity = 1.6 + Math.sin(t * 1.4) * .4;
      var blink = (t % 6.1) < .13 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
