import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { beatWing, feather, finish, glow, lock, part, seg, wingKit } from '../kit/parts.js';
import { chain, makeRig } from '../kit/rig.js';

// =====================================================================
// STORMTALON: an eagle riding the wind, wings wide, talons open
// =====================================================================
export function eagle() {
  var P = {
    brown: C('#4a3426'), brownMid: C('#7a5a3c'), gold: C('#c9a05a'), white: C('#f4f1ea'), cream: C('#d9cfb8'),
    beak: C('#f2b82a'), beakDark: C('#b97a14'), talon: C('#2a1f1a'), leg: C('#e8b830'), eye: '#ffc933', wind: '#cfe8ff'
  };
  var root = new T.Group(), body = new T.Group(); root.add(body);
  var BASE = 2.0; body.position.y = BASE;
  var UPV = [0, 1, 0];
  var BODYL = { c: function (p, n) { return mix(P.brown, P.brownMid, sstep(.2, -.6, n.y) * .7); } };
  var WHITEL = { c: function (p, n) { return mix(P.white, P.cream, sstep(.2, -.6, n.y) * .5); } };
  var PRIM = { m: 'plume', g: [C('#2e2018'), C('#5b4230'), C('#a9825a')], noOcc: true, aoK: .3 };
  var SEC = { m: 'plume', g: [C('#3a281c'), C('#6b4e36'), C('#b8925f')], noOcc: true, aoK: .3 };
  var COV = { m: 'plume', g: [C('#5a3f2a'), C('#8c6a42'), C('#d6b27a')], noOcc: true, aoK: .3 };
  var TAILF = { m: 'plume', g: [C('#e9e4d6'), C('#f8f6f0'), C('#ffffff')], noOcc: true, aoK: .3 };
  var RUFF = { c: P.white, tip: P.cream, tipAmt: .5, aoK: .4, noOcc: true };
  var NAPE = { m: 'plume', g: [C('#b58a45'), C('#d9b266'), C('#f4e1ad')], noOcc: true, aoK: .3 };
  var BEAK = { c: P.beak, m: 'gloss' }, LEG = { c: P.leg, m: 'gloss' }, TALON = { c: P.talon, m: 'gloss', noAO: true, noOcc: true };

  // a strong, slim body with a deep chest, feathered thighs and a long neck
  part(body, blob(1.7, .62, .52, .85, function (x, y, z, W) { var xn = x / W, k = xn < 0 ? 1 + .4 * xn : 1; return [x, y * k, z * k]; }), BODYL, 0, 0, 0, 0, 0, .12);
  part(body, blob(.8, .7, .62, .85), BODYL, .5, -.04, 0);
  [1, -1].forEach(function (s) { part(body, blob(.5, .5, .3, .85), { c: P.cream }, -.1, -.3, s * .2); });
  seg(body, [.72, .1, 0], [1.0, .36, 0], .27, .22, WHITEL);

  // head: white, with a heavy brow, a keen amber eye and a great hooked beak
  var head = new T.Group(); head.position.set(1.16, .52, 0); head.rotation.z = .1; body.add(head);
  part(head, blob(.52, .44, .42, .85), WHITEL, 0, 0, 0);
  part(head, blob(.64, .3, .28, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .4 * t) - .22 * Math.pow(t, 2.2), z * (1 - .6 * t)]; }), BEAK, .46, -.08, 0);
  part(head, blob(.46, .12, .2, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .5 * t)]; }), { c: P.beakDark, m: 'gloss' }, .4, -.22, 0);
  var eyes = [];
  [.2, -.2].forEach(function (z) {
    part(head, blob(.4, .1, .16, .85), WHITEL, .12, .17, z * .95, 0, 0, -.35);
    eyes.push(glow(head, blob(.11, .09, .06, .8), P.eye, .17, .07, z, 0, z > 0 ? -.3 : .3, 0));
    halo(head, P.eye, .3, .2, .07, z * 1.1, .5);
  });
  for (var ni = 0; ni < 6; ni++) feather(head, NAPE, [-.14 + ni * .03, .1 - ni * .05, (ni % 2 ? .12 : -.12)], [-1, -.35 - ni * .05, (ni % 2 ? .35 : -.35)], UPV, .5, .14, .12);
  var rr = rng(7);
  for (var ri = 0; ri < 12; ri++) { var ra = ri / 12 * Math.PI * 2; lock(body, RUFF, [.8, .24 + Math.cos(ra) * .2, Math.sin(ra) * .2], [-.6, -.3 + Math.cos(ra) * .3, Math.sin(ra) * .6], [0, Math.cos(ra), Math.sin(ra)], .34 + rr() * .1, .14, .08, .08); }

  // legs, thrust forward with the talons spread
  [1, -1].forEach(function (s) {
    seg(body, [-.05, -.36, s * .2], [.28, -.88, s * .22], .09, .065, LEG);
    [-.15, -.02, .11].forEach(function (dz) {
      var base = [.28, -.88, s * .22], mid = [.52, -1.0, s * .22 + dz * 1.4], tip = [.72, -1.2, s * .22 + dz * 1.8];
      seg(body, base, mid, .05, .04, LEG);
      seg(body, mid, tip, .04, .03, LEG);
      part(body, ttube([[tip[0], tip[1], tip[2]], [tip[0] + .12, tip[1] - .02, tip[2]], [tip[0] + .16, tip[1] - .16, tip[2]]], .035, .006, 6, 8), TALON);
    });
    seg(body, [.28, -.88, s * .22], [.0, -1.02, s * .22], .045, .03, LEG);
    part(body, ttube([[0, -1.02, s * .22], [-.1, -1.0, s * .22], [-.14, -1.14, s * .22]], .035, .006, 6, 8), TALON);
  });

  // wings: broad, with the fingered tips of an eagle
  var wings = [1, -1].map(function (s) {
    return wingKit(body, s, { x: .2, y: .16, z: .28, sc: 1.05, k: 1.1, L: 1.15, Wd: 1.0, r: .2, body: BODYL, sec: SEC, prim: PRIM, cov: COV, np: 8, spread: 1.0, slot: .8, tipUp: .06 });
  });
  // tail: a broad white fan
  var tail = new T.Group(); tail.position.set(-.85, -.05, 0); body.add(tail);
  for (var k = -4; k <= 4; k++) feather(tail, TAILF, [0, 0, k * .04], [-1, -.08 - Math.abs(k) * .02, k * .17], UPV, 1.9 - Math.abs(k) * .06, .38, .1);

  // wind: pale ribbons that circle the bird, and bright specks drifting in its wake
  var wind = new T.Group(); root.add(wind);
  [[3.2, 1.9, .2, .22], [2.7, 1.5, -.3, .16], [3.6, 2.3, .5, .12]].forEach(function (w, wi) {
    var pts = [];
    for (var q = 0; q < 36; q++) { var an = q / 36 * Math.PI * 1.35 + wi * 2.1; pts.push([Math.cos(an) * w[0], BASE + w[2] + Math.sin(q * .5 + wi) * .25, Math.sin(an) * w[1]]); }
    glow(wind, ttube(pts, .028, .004, 6, 90), P.wind, 0, 0, 0, 0, 0, 0, w[3]);
  });
  var specks = [];
  for (var si = 0; si < 26; si++) specks.push({ m: glow(root, new T.IcosahedronGeometry(.03, 0), P.wind), ph: (si * .137) % 1, sp: .1 + (si % 5) * .03, r: 1.5 + (si % 6) * .5 });
  halo(root, P.wind, 7, 0, BASE, 0, .16);
  var light = new T.PointLight(0xdbe9ff, 2.5, 6, 1.5); light.position.set(.4, 1, 0); body.add(light);
  wind.traverse(function (o) { o.userData.noFit = true; });

  finish(root, 4.2);
  return {
    root: root, head: head, name: 'eagle', headView: { span: 2.4, up: .2, look: 0 }, fitPad: { up: .9 }, initYaw: -1.1,
    rig: makeRig({ plan: 'flyer', body: body, head: head, tail: [tail], wings: { r: chain([wings[0].W, wings[0].F, wings[0].H]), l: chain([wings[1].W, wings[1].F, wings[1].H]) } }),
    update: function (t) {
      var sp = t * 1.7;
      body.position.y = BASE + Math.sin(sp + .6) * .1; body.rotation.z = Math.sin(sp + 1) * .025; body.rotation.x = Math.sin(t * .5) * .05;
      wings.forEach(function (w) { beatWing(w, sp, .26); });
      tail.rotation.y = Math.sin(t * .8) * .1; tail.scale.z = 1 + Math.sin(sp) * .12;
      head.rotation.y = Math.sin(t * .5) * .3; head.rotation.z = .1 + Math.sin(sp - .8) * .03;
      wind.rotation.y = t * .12;
      specks.forEach(function (e) { var kk = (t * e.sp + e.ph) % 1, an = e.ph * 20 + t * .3; e.m.position.set(Math.cos(an) * e.r - kk * 1.4, BASE - .6 + Math.sin(an * 2) * .6, Math.sin(an) * e.r * 1.2); e.m.scale.setScalar(Math.max(.01, Math.sin(kk * Math.PI))); });
      var blink = (t % 5.5) < .12 ? .15 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
