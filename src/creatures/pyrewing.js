import * as T from 'three';
import { C, mix, sstep } from '../kit/math.js';
import { blob } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { feather, finish, flameCluster, glow, part, seg, shard } from '../kit/parts.js';

// =====================================================================
// PYREWING: a phoenix on the wing, in layered feathers that go from crimson to gold
// =====================================================================
export function pyrewing() {
  var P = {
    crimson: C('#a31f17'), red: C('#d83a1a'), orange: C('#ff7a1c'), gold: C('#ffc233'), beak: C('#ffb23b'), beakDark: C('#b5651a'),
    talon: C('#3a2a22'), shin: C('#d9922b'),
    eye: '#fff3b0', ember: '#ff4510', emberMid: '#ff8d1c', emberCore: '#ffe885'
  };
  var root = new T.Group(), body = new T.Group(); root.add(body);
  var BASE = 2.1; body.position.y = BASE;
  var flames = [], embers = [];
  function plume(p, n) { var c = mix(P.crimson, P.red, sstep(.1, .8, n.y)); c = mix(c, P.orange, sstep(0, -.45, n.y)); return mix(c, P.gold, sstep(-.45, -.9, n.y) * .8); }
  var BODYL = { c: plume };
  var PRIM = { m: 'feather', g: [C('#a3201a'), C('#ff5a1a'), C('#ffe27a')], noOcc: true, aoK: .3 };
  var SEC = { m: 'feather', g: [C('#8f1a14'), C('#ff6a1a'), C('#ffd24a')], noOcc: true, aoK: .3 };
  var COV = { m: 'feather', g: [C('#c2321a'), C('#ff8a2a'), C('#ffe9a0')], noOcc: true, aoK: .3 };
  var TAILF = { m: 'feather', g: [C('#b0261a'), C('#ff7a1e'), C('#fff2a0')], noOcc: true, aoK: .3 };
  var BEAK = { c: P.beak, m: 'gloss' }, SHIN = { c: P.shin }, TALON = { c: P.talon, m: 'gloss', noAO: true, noOcc: true };
  var UPV = [0, 1, 0];

  // body, tapering to the tail and leaning up into the air; a deep chest of small feathers
  part(body, blob(1.9, .72, .62, .82, function (x, y, z, W) { var xn = x / W, k = xn < 0 ? 1 + .42 * xn : 1; return [x, y * k, z * k]; }), BODYL, 0, 0, 0, 0, 0, .2);
  seg(body, [.75, .1, 0], [1.02, .42, 0], .27, .22, BODYL);
  seg(body, [1.02, .42, 0], [1.14, .8, 0], .22, .19, BODYL);

  // head: a hooked beak, burning eyes, a crest of plumes and flame
  var head = new T.Group(); head.position.set(1.24, .97, 0); head.rotation.z = .1; head.scale.setScalar(1.12); body.add(head);
  part(head, blob(.55, .46, .44, .85), BODYL, 0, 0, 0);
  part(head, blob(.6, .2, .26, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .5 * t) - .14 * t * t, z * (1 - .55 * t)]; }), BEAK, .42, -.04, 0);
  var jaw = new T.Group(); jaw.position.set(.18, -.12, 0); jaw.rotation.z = -.12; head.add(jaw);
  part(jaw, blob(.42, .1, .2, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y - .04 * t, z * (1 - .5 * t)]; }), { c: P.beakDark, m: 'gloss' }, .2, -.02, 0);
  var eyes = [];
  [.2, -.2].forEach(function (z) {
    eyes.push(glow(head, blob(.14, .1, .06, .8), P.eye, .17, .08, z, 0, z > 0 ? -.3 : .3, 0));
    halo(head, P.eye, .34, .19, .08, z * 1.12, .55);
  });
  [[-1, .35, .12, 1.15], [-1, .15, -.14, 1.0], [-1, .55, .0, 1.3], [-1, .0, .22, .85]].forEach(function (d, i) {
    feather(head, PRIM, [-.1, .2 + i * .01, d[2] * .6], d.slice(0, 3), UPV, d[3], .16, .2);
  });
  var cf = flameCluster(head, flames, .02, .3, 0, .7, .6, P); cf.rotation.z = .6;

  // legs, drawn up under the body, with open talons
  [1, -1].forEach(function (s) {
    part(body, blob(.42, .4, .28, .85), BODYL, -.1, -.25, s * .2);
    seg(body, [-.05, -.35, s * .2], [.12, -.68, s * .22], .06, .045, SHIN);
    [-.12, 0, .12].forEach(function (dz) {
      seg(body, [.12, -.68, s * .22], [.4, -.8, s * .22 + dz], .036, .024, SHIN);
      shard(body, .025, .11, 5, TALON, [.43, -.81, s * .22 + dz * 1.1], [1, -.4, dz]);
    });
    seg(body, [.12, -.68, s * .22], [-.1, -.8, s * .22], .036, .024, SHIN);
  });

  // wings: an arm, a forearm and a hand, each hinged on the last, with rows of feathers
  var wings = [];
  function wing(s) {
    var W = new T.Group(); W.position.set(.2, .2, s * .3); W.scale.set(.85, .85, s * .85); body.add(W);
    var F = new T.Group(); F.position.set(-.1, .04, .85); W.add(F);
    var H = new T.Group(); H.position.set(-.18, .03, .85); F.add(H);
    seg(W, [0, 0, 0], [-.1, .04, .85], .2, .14, BODYL);
    seg(F, [0, 0, 0], [-.18, .03, .85], .14, .1, BODYL);
    seg(H, [0, 0, 0], [-.25, .02, .75], .1, .06, BODYL);
    var i, t, ang;
    for (i = 0; i < 5; i++) { t = i / 4; feather(W, SEC, [-.1 * t, .02, .85 * t], [-1, -.02, -.05 + .1 * t], UPV, 1.0 - t * .1, .26, .14); }
    for (i = 0; i < 8; i++) { t = i / 7; ang = 1.3 - t * .25; feather(F, SEC, [-.18 * t, .0, .85 * t], [-Math.sin(ang), -.03, Math.cos(ang)], UPV, 1.25 - t * .1, .26, .16); }
    for (i = 0; i < 9; i++) {
      t = i / 8; ang = 1.12 - t * 1.0;
      var base = [-.25 * t, .01 - i * .003, .75 * t], dir = [-Math.sin(ang), -.02, Math.cos(ang)], len = 1.05 + t * .65;
      feather(H, PRIM, base, dir, UPV, len, .24, .22);
      if (i >= 6) { var fc = flameCluster(H, flames, base[0] + dir[0] * len, base[1], base[2] + dir[2] * len, .42, .5, P); fc.rotation.z = .3; }
    }
    for (i = 0; i < 7; i++) { t = i / 6; ang = 1.3 - t * .25; feather(F, COV, [-.18 * t, .035, .85 * t], [-Math.sin(ang), -.03, Math.cos(ang)], UPV, .62, .2, .14); }
    for (i = 0; i < 7; i++) { t = i / 6; ang = 1.12 - t * 1.0; feather(H, COV, [-.25 * t, .03, .75 * t], [-Math.sin(ang), -.02, Math.cos(ang)], UPV, .6, .18, .14); }
    for (i = 0; i < 5; i++) { t = i / 4; feather(W, COV, [-.1 * t, .05, .85 * t], [-1, -.02, 0], UPV, .6, .2, .1); }
    wings.push({ W: W, F: F, H: H, s: s });
  }
  wing(1); wing(-1);

  // tail: seven long feathers and two streamers, each ending in flame
  var tail = new T.Group(); tail.position.set(-.85, -.05, 0); body.add(tail);
  for (var k = -3; k <= 3; k++) {
    var len = 3.0 - Math.abs(k) * .35, d = [-1, -.1 - Math.abs(k) * .03, k * .19];
    feather(tail, TAILF, [0, 0, k * .05], d, UPV, len, .32, .12);
    if (k === 0 || Math.abs(k) === 2) { var tf = flameCluster(tail, flames, d[0] * len, d[1] * len, d[2] * len, .55, .6, P); tf.rotation.z = .5; }
  }
  [.5, -.5].forEach(function (z) { feather(tail, TAILF, [0, 0, z * .1], [-1, -.3, z], UPV, 3.6, .14, .25); });

  // fire over the whole body: along the back, down the neck, on the shoulders, thighs, chest and tail root
  [[.55, .3, 0, .6, .4], [.25, .34, 0, .7, .45], [-.1, .3, 0, .7, .45], [-.45, .24, 0, .6, .4], [.85, .42, 0, .5, .4], [1.06, .62, 0, .45, .4],
   [.3, .15, .3, .5, .6], [.3, .15, -.3, .5, .6], [-.1, .1, .28, .45, .6], [-.1, .1, -.28, .45, .6], [.55, .0, .22, .4, .5], [.55, .0, -.22, .4, .5],
   [-.1, -.28, .22, .38, .4], [-.1, -.28, -.22, .38, .4], [-.7, .0, 0, .5, .5]].forEach(function (f) {
    var fc = flameCluster(body, flames, f[0], f[1], f[2], f[3], f[4], P); fc.rotation.z = .5;
  });
  // a swirl of sparks and a glow behind the whole bird
  for (var ei = 0; ei < 38; ei++) {
    var m = glow(root, new T.IcosahedronGeometry(.03, 0), ei % 3 ? P.emberMid : P.emberCore);
    embers.push({ m: m, ph: (ei * .137) % 1, sp: .22 + (ei % 5) * .05, r: 1.0 + (ei % 7) * .35 });
  }
  halo(root, P.ember, 7, 0, BASE, 0, .22);
  halo(body, P.emberCore, 2.2, .4, .2, 0, .25);
  var light = new T.PointLight(0xff7a2a, 5, 6, 1.5); light.position.set(0, .4, 0); body.add(light);

  finish(root, 4.4);
  return {
    root: root, head: head, name: 'pyrewing', headView: { span: 2.4, up: .2, look: 0 }, fitPad: { up: 1.6 }, initYaw: -1.15,
    update: function (t) {
      var sp = t * 2.6;
      body.position.y = BASE + Math.sin(sp + .6) * .14;
      body.rotation.z = Math.sin(sp + 1) * .03;
      wings.forEach(function (w) {
        var sg = w.s > 0 ? -1 : 1;
        w.W.rotation.x = sg * (Math.sin(sp) * .55 + .12);
        w.F.rotation.x = -Math.sin(sp - .5) * .35;
        w.H.rotation.x = -Math.sin(sp - 1.0) * .5;
      });
      head.rotation.z = .1 + Math.sin(sp - .8) * .04; head.rotation.y = Math.sin(t * .6) * .1;
      jaw.rotation.z = -.12 - (Math.sin(t * 1.4) * .5 + .5) * .05;
      tail.rotation.y = Math.sin(sp - 1.2) * .16; tail.rotation.z = Math.sin(sp - .6) * .08;
      flames.forEach(function (f, i) { var w = Math.sin(t * 13 + i * 1.9) * .5 + Math.sin(t * 7.1 + i * 2.3) * .5; f.scale.set(1 - w * .07, 1 + w * .15, 1 - w * .07); });
      embers.forEach(function (e) {
        var kk = (t * e.sp + e.ph) % 1, an = e.ph * 20 + t * .6, rr = e.r * (.6 + .8 * kk);
        e.m.position.set(Math.cos(an) * rr - .2, BASE - 1.0 + kk * 3.4, Math.sin(an) * rr * 1.4);
        e.m.scale.setScalar(Math.max(.01, 1 - kk));
      });
      light.intensity = 5 + Math.sin(t * 15) * .7 + Math.sin(t * 8.3) * .5;
      var blink = (t % 4.9) < .12 ? .15 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
