import * as T from 'three';
import { C, mix, sstep } from '../kit/math.js';
import { blob } from '../kit/geometry.js';
import { glowMat, halo } from '../kit/materials.js';
import { eye, feather, featherGeo, finish, flameCluster, glow, part, seg, shard, wingKit } from '../kit/parts.js';
import { bind, chain, hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// PYREWING: a young phoenix hovering on raised wings, red-orange with a golden breast, a crest and tail of living flame
// =====================================================================
export function pyrewing() {
  var P = {
    red: C('#cc5a38'), redDark: C('#a8442e'), orange: C('#e07a3e'), cream: C('#f5e0b4'), mask: C('#f7e6c2'),
    beak: C('#f0c160'), beakTip: C('#c98a3a'), beakLow: C('#d9a04c'), leg: C('#d7953f'), talon: C('#f1e8d8'), iris: C('#d9781c'),
    ember: '#ff4510', emberMid: '#ff8d1c', emberCore: '#ffe885'
  };
  var root = new T.Group(), body = new T.Group(); root.add(body);
  var BASE = 2.05; body.position.y = BASE;
  var flames = [], UPV = [0, 1, 0], SIDE = [0, 0, 1];
  // plumage: red-orange, a shade deeper along the back, warming to orange low on the flanks; a golden cream breast and belly
  function plum(p, n) {
    var c = mix(P.red, P.redDark, sstep(.25, .85, n.y));
    c = mix(c, P.orange, sstep(.05, -.4, n.y) * .6);
    var breast = sstep(.1, .65, n.x) * sstep(BASE + .8, BASE + .25, p.y) * sstep(-.3, .1, p.x);
    return mix(c, P.cream, Math.max(sstep(-.35, -.8, n.y) * .9, breast * .95));
  }
  function face(p, n) { var c = mix(P.red, P.redDark, sstep(.35, .9, n.y) * .8); return mix(c, P.cream, sstep(-.1, -.6, n.y) * .9); }
  var PLUM = { c: plum }, FACE = { c: face };
  // feathers: deeper red at the quill, orange in the middle, a golden tip
  var COV = { m: 'plume', g: [C('#b44a30'), C('#d2603a'), C('#e58a4a')], noOcc: true, aoK: .3 };
  var SEC = { m: 'plume', g: [C('#a8432e'), C('#d0623a'), C('#e8a058')], noOcc: true, aoK: .3 };
  var PRIM = { m: 'plume', g: [C('#b04530'), C('#dc7a40'), C('#eeb866')], noOcc: true, aoK: .3 };
  var TAILF = { m: 'plume', g: [C('#b04530'), C('#dc7440'), C('#ecb062')], noOcc: true, aoK: .3 };
  var CREST = { m: 'plume', g: [C('#c4502f'), C('#e2803f'), C('#f1c06a')], noOcc: true, aoK: .3 };
  var BREAST = { m: 'plume', g: [C('#e9c48e'), C('#f5e0b4'), C('#fbeed0')], noOcc: true, aoK: .3 };

  // body: a plump, deep-chested teardrop that tapers to the tail, a round golden breast of small layered feathers
  part(body, blob(1.6, .98, .92, .85, function (x, y, z, W) { var xn = x / W, k = xn < 0 ? 1 + .42 * xn : 1; return [x, y * k, z * k]; }), PLUM, -.1, 0, 0, 0, 0, .2);
  part(body, blob(1.0, 1.08, .94, .86), PLUM, .36, .1, 0, 0, 0, .3);
  for (var row = 0; row < 3; row++) for (var c = -2; c <= 2; c++) {
    var zz = c * .13 + (row % 2 ? .065 : 0), yy = .36 - row * .2, xx = .36 + .5 * Math.sqrt(Math.max(.05, 1 - Math.pow((yy - .1) / .54, 2) - Math.pow(zz / .47, 2))) - .02;
    feather(body, BREAST, [xx, yy, zz], [.25, -1, zz * .5], [1, 0, zz], .3, .17, .1);
  }

  // neck joint at the shoulders, carrying the throat, the head and its crest
  var neck = new T.Group(); neck.position.set(.55, .38, 0); body.add(neck);
  var onNeck = [seg(body, [.6, .36, 0], [.92, .7, 0], .34, .3, PLUM)];
  // head: big and round, a small hooked beak that can open, round amber eyes on pale golden patches under a soft brow
  var head = new T.Group(); head.position.set(1.02, .78, 0); body.add(head);
  part(head, blob(.86, .78, .78, .85, function (x, y, z, W) { return [x, y + .05 * Math.max(0, -x / W), z * (1 - .12 * Math.max(0, x / W))]; }), FACE, 0, 0, 0);
  var BEAK = { c: function (p) { return mix(P.beak, P.beakTip, sstep(1.48, 1.62, p.x)); }, m: 'gloss' };
  part(head, blob(.36, .24, .22, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .5 * t) - .13 * t * t, z * (1 - .6 * t)]; }), BEAK, .42, -.04, 0);
  var jaw = new T.Group(); jaw.position.set(.3, -.12, 0); head.add(jaw);
  part(jaw, blob(.26, .08, .16, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y - .02 * t, z * (1 - .5 * t)]; }), { c: P.beakLow, m: 'gloss' }, .1, -.01, 0);
  var eyes = [];
  [1, -1].forEach(function (s) {
    part(head, blob(.44, .4, .14, .85), { c: P.mask }, .13, .03, s * .335, 0, s * -.3, 0);
    part(head, blob(.32, .09, .13, .8), { c: P.red, noOcc: true, aoK: .4 }, .18, .28, s * .32, 0, s * -.3, -.1);
    eyes.push(eye(head, P.iris, .18, .05, s * .385, .28, .26, s * -.3, 0));
  });
  // the crest: three plumes swept back from the crown in the plane the camera sees, each tipped with flame, and two flames
  // rising off the crown itself
  var crest = new T.Group(); crest.position.set(-.05, .3, 0); head.add(crest);
  [[-.7, 1.0, .78], [-1, .55, .9], [-1, .2, .7]].forEach(function (d, i) {
    var dir = new T.Vector3(d[0], d[1], 0).normalize(), len = d[2];
    feather(crest, CREST, [0, -i * .05, 0], [dir.x, dir.y, 0], SIDE, len, .2, -.05);
    var f = flameCluster(crest, flames, dir.x * len * .9, -i * .05 + dir.y * len * .9, 0, .55 - i * .08, .5, P); f.rotation.z = Math.atan2(-dir.x, dir.y) * .6 + .3;
  });
  [[.08, .06, .7], [-.16, .04, .6]].forEach(function (f) { var g = flameCluster(crest, flames, f[0], f[1], 0, f[2], .6, P); g.rotation.z = .45; });

  // fire along the top line, nape to rump
  [[.42, .58, .52], [.15, .55, .58], [-.14, .48, .55], [-.42, .36, .48], [-.7, .2, .4]].forEach(function (f, i) {
    var g = flameCluster(body, flames, f[0], f[1], 0, f[2], .7, P); g.rotation.z = .55;
    if (!i) onNeck.push(g);
  });

  // legs: feathered thighs, golden shins drawn up under the body, three ivory talons forward and one back
  var LEGS = {}, LEG = { c: P.leg, m: 'gloss' }, TALON = { c: P.talon, m: 'gloss', noAO: true, noOcc: true };
  [1, -1].forEach(function (s) {
    var z = s * .24, ft = [];
    part(body, blob(.46, .44, .32, .85), PLUM, .1, -.36, z, 0, 0, .2);
    var leg = limb(body, [[.12, -.42, z], [.3, -.66, z], [.2, -.9, z]], [[.08, .065], [.06, .05]], LEG);
    [[.2, .1], [.22, 0], [.2, -.1], [-.16, 0]].forEach(function (d) {
      var b = [.2 + d[0] * .7, -.97, z + d[1]];
      ft.push(seg(body, [.2, -.9, z], b, .04, .032, LEG));
      ft.push(shard(body, .028, .14, 5, TALON, b, [d[0] > 0 ? 1 : -1, -.9, d[1]]));
    });
    hang(leg.end, ft);
    LEGS[s > 0 ? 'r' : 'l'] = leg;
  });

  // wings raised in a ready V and swept back a little: arm, forearm and hand on hinges, golden-tipped primaries
  // burning at the ends
  var RAISE = 1.2, SWEEP = .3, BEND = [-.3, -.35], WK = .8;
  var wings = [1, -1].map(function (s) {
    var w = wingKit(body, s, { x: .05, y: .34, z: .3, sc: .8, k: WK, L: 1.0, Wd: 1.15, r: .22, body: PLUM, sec: SEC, prim: PRIM, cov: COV, np: 8, spread: 1.05, slot: .9, tipUp: .04 });
    w.W.rotation.order = w.F.rotation.order = w.H.rotation.order = 'YXZ'; w.W.rotation.set(-s * RAISE, -s * SWEEP, 0); w.F.rotation.y = BEND[0]; w.H.rotation.y = BEND[1];
    for (var i = 5; i < 8; i++) {
      var t = i / 7, ang = 1.05 - t * 1.05 * .9, dir = new T.Vector3(-Math.sin(ang), -.02 + .04 * t, Math.cos(ang)).normalize(), len = (1.05 + .65 * t) * WK * .7;
      var f = flameCluster(w.H, flames, -.25 * WK * t + dir.x * len, .01 + dir.y * len, .75 * WK * t + dir.z * len, .45 + (i - 5) * .12, .3, P);
      f.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    }
    return w;
  });

  // tail: a short chain from the rump, a fan of golden-tipped feathers and three streamers of living flame, drawn flat
  // in the plane the camera sees
  var tailC = limb(body, [[-.62, -.08, 0], [-.98, -.2, 0], [-1.28, -.3, 0]], [[.22, .14], [.14, .08]], PLUM), tparts = [];
  [-.62, -.42, -.22, -.02, .18].forEach(function (a, i) {
    tparts.push(feather(body, TAILF, [-1.1, -.24, (i - 2) * .05], [-Math.cos(a), Math.sin(a), (i - 2) * .12], [0, .45, 1], 1.15 + (2 - Math.abs(i - 2)) * .12, .3, .08));
  });
  function tongue(parent, pts, w) {
    var g = new T.Group(); g.position.set(pts[0][0], pts[0][1], 0); parent.add(g);
    var curve = new T.CatmullRomCurve3(pts.map(function (q) { return new T.Vector3(q[0] - pts[0][0], q[1] - pts[0][1], 0); })), N = 28;
    [[P.ember, 1, 0], [P.emberMid, .6, .012], [P.emberCore, .28, .024]].forEach(function (L) {
      var left = [], right = [];
      for (var i = 0; i <= N; i++) {
        var t = i / N, q = curve.getPoint(t), d = curve.getTangent(t), hw = w * L[1] * .5 * Math.pow(1 - t, .75) * Math.min(1, .35 + t * 5) * (1 + .16 * Math.sin(t * 15));
        left.push(new T.Vector2(q.x - d.y * hw, q.y + d.x * hw)); right.unshift(new T.Vector2(q.x + d.y * hw, q.y - d.x * hw));
      }
      glow(g, new T.ShapeGeometry(new T.Shape(left.concat(right)), 1), L[0], 0, 0, L[2]).material.side = T.DoubleSide;
    });
    return g;
  }
  var streamers = [
    tongue(body, [[-1.2, -.22], [-1.7, -.05], [-2.2, .1], [-2.6, .4], [-2.85, .75]], .3),
    tongue(body, [[-1.2, -.3], [-1.8, -.4], [-2.4, -.4], [-3.0, -.25]], .34),
    tongue(body, [[-1.15, -.34], [-1.6, -.62], [-2.1, -.8], [-2.6, -.82]], .26)
  ];
  bind(tailC, tparts.concat(streamers));

  // sparks shed from the wings and tail, drifting up and back: one instanced mesh in its own fx group
  var fx = new T.Group(); root.add(fx);
  var EN = 22, sparks = new T.InstancedMesh(new T.IcosahedronGeometry(.032, 0), glowMat('#ffffff'), EN), emt = new T.Object3D(), es = [];
  sparks.frustumCulled = false; fx.add(sparks);
  for (var ei = 0; ei < EN; ei++) { es.push({ x: .5 - (ei % 7) * .32, z: ((ei * 37) % 9 - 4) * .2, y: (ei % 3) * .4, ph: (ei * .137) % 1, sp: .3 + (ei % 5) * .06 }); sparks.setColorAt(ei, new T.Color(ei % 3 ? P.emberMid : P.emberCore)); }
  function placeSparks(t) {
    es.forEach(function (e, i) { var k = (t * e.sp + e.ph) % 1; emt.position.set(e.x - k * 1.0, BASE - .2 + e.y + k * 1.4, e.z + Math.sin(t * 3 + e.ph * 9) * .08); emt.scale.setScalar(Math.max(.01, 1 - k)); emt.updateMatrix(); sparks.setMatrixAt(i, emt.matrix); });
    sparks.instanceMatrix.needsUpdate = true;
  }
  placeSparks(0);
  halo(body, P.ember, 2.6, -.2, .25, 0, .2);
  var light = new T.PointLight(0xff7a2a, 3.5, 4, 1.6); light.position.set(.2, .9, 0); body.add(light);

  // moments, hidden at rest and shown by clipFx: a fiery swipe under the talons for the swoop; for the ultimate, a
  // sunburst of flame behind the bird as it rears, a volley of burning feathers flung at the target, and the blast there
  var slash = new T.Group(); slash.position.set(.55, -.6, .35); body.add(slash);
  glow(slash, new T.RingGeometry(.75, .88, 24, 1, -1.9, 1.7), P.emberMid).material.side = T.DoubleSide;
  glow(slash, new T.RingGeometry(.79, .84, 24, 1, -1.9, 1.7), P.emberCore, 0, 0, .01).material.side = T.DoubleSide;
  var nova = new T.Group(); nova.position.set(-.1, .3, -.4); body.add(nova);
  for (var ni = 0; ni < 12; ni++) { var na = ni / 12 * Math.PI * 2; flameCluster(nova, [], Math.cos(na) * .8, Math.sin(na) * .8, 0, .9 + (ni % 2) * .35, .2, P).rotation.z = na - Math.PI / 2; }
  halo(nova, P.emberMid, 4, 0, 0, 0, .5);
  var volley = new T.Group(), shots = []; root.add(volley);
  for (var vi = 0; vi < 7; vi++) {
    var sh = new T.Group(); volley.add(sh);
    glow(sh, featherGeo(.8, .26, 0), P.ember, 0, 0, 0, 0, 0, -Math.PI / 2).material.side = T.DoubleSide;
    glow(sh, featherGeo(.55, .12, 0), P.emberCore, .1, 0, .02, 0, 0, -Math.PI / 2).material.side = T.DoubleSide;
    flameCluster(sh, [], -.05, 0, 0, .6, 0, P).rotation.z = Math.PI / 2;
    shots.push({ g: sh, a: new T.Vector3(.4 + (vi % 2) * .3, BASE - .3 + vi * .3, (vi - 3) * .15), c: new T.Vector3(3.8, BASE + 1.4 - Math.abs(vi - 3) * .15 + (vi - 3) * .25, (vi - 3) * .3), b: new T.Vector3(7.5, 1.55 + (vi - 3) * .14, (vi - 3) * .06), k0: .42 + vi * .01, k1: .59 + vi * .006 });
  }
  var boom = new T.Group(); boom.position.set(7.3, 1.6, .4); root.add(boom);
  for (var bi = 0; bi < 9; bi++) { var ba = bi / 9 * Math.PI * 2; flameCluster(boom, [], Math.cos(ba) * .2, Math.sin(ba) * .2, 0, .8 + (bi % 3) * .2, 0, P).rotation.z = ba - Math.PI / 2; }
  halo(boom, P.emberMid, 2.4, 0, 0, 0, .6);
  [fx, slash, nova, volley, boom].forEach(function (g) {
    g.traverse(function (o) {
      o.userData.noFit = true; o.userData.noMerge = true;
      if (o.material && g !== fx) { o.userData.op = o.material.transparent ? o.material.opacity : 1; o.material.transparent = true; o.material.depthWrite = false; }
    });
  });
  function fade(g, op) { g.visible = op > .01; g.traverse(function (o) { if (o.userData.op != null) o.material.opacity = o.userData.op * op; }); }
  var _q = new T.Quaternion(), ZAX = new T.Vector3(0, 0, 1), _p = new T.Vector3(), _d = new T.Vector3();

  hang(neck, onNeck.concat([head]));
  finish(root, 4.2);
  return {
    root: root, head: head, name: 'pyrewing', headView: { span: 2.3, up: .3, look: 0 }, fitPad: { up: .5 }, initYaw: -.9,
    rig: makeRig({ plan: 'flyer', body: body, neck: neck, head: head, jaw: jaw, tail: tailC.joints, legs: LEGS, wings: { r: chain([wings[0].W, wings[0].F, wings[0].H]), l: chain([wings[1].W, wings[1].F, wings[1].H]) } }),
    clips: {
      // a diving swoop: it climbs, folds its wings and drops on the target, flaring them and raking with its talons
      attack: { tracks: {
        'body.y': [[0, 0], [.25, .45], [.46, -.35, 'in'], [.6, -.15], [.85, 0]],
        'body.pitch': [[0, 0], [.25, .3], [.4, -.6], [.5, .25], [.65, .1], [.85, 0]],
        'wings.lift': [[0, 0], [.25, .7], [.42, -.55], [.5, .5], [.65, .3], [.85, 0]], 'wings.beat': [[0, .2], [.25, .05], [.45, 0], [.6, .4], [1, .2]], 'wings.rate': 1.4,
        'head.pitch': [[0, 0], [.25, .2], [.42, -.3], [.52, .1], [.7, 0]],
        'jaw.open': [[0, 0], [.3, .4], [.48, .5], [.56, 0], [.8, 0]],
        'tail.curl': [[0, 0], [.25, -.3], [.45, .4], [.65, -.2], [1, 0]]
      } },
      // the ultimate is ranged: it stays home, rears in a sunburst of flame and flings a volley of burning feathers
      ultimate: { impact: .6, travel: [[0, 0], [1, 0]], tracks: {
        'shake': [[0, 0], [.08, .6], [.36, .6], [.4, 0]],
        'body.x': [[0, 0], [.35, -.25], [.44, .15], [.55, -.05], [.8, 0]],
        'body.y': [[0, 0], [.35, .5], [.42, .55], [.48, .3], [.7, .1], [.95, 0]],
        'body.pitch': [[0, 0], [.35, .35], [.44, -.25], [.55, -.1], [.85, 0]],
        'wings.lift': [[0, 0], [.3, .9], [.38, .95], [.44, -.6, 'in'], [.55, -.4], [.8, 0]], 'wings.beat': [[0, .2], [.1, .1], [.38, .05], [.44, 0], [.6, .35], [1, .2]], 'wings.rate': 1.6,
        'head.pitch': [[0, 0], [.35, .35], [.44, -.2], [.6, 0]],
        'jaw.open': [[0, 0], [.3, .5], [.44, .7], [.55, .2], [.75, 0]],
        'tail.curl': [[0, 0], [.35, .5], [.45, -.3], [.7, 0]]
      } },
      // it falls out of the air and lands in a heap on the field
      faint: { tracks: { 'body.y': [[0, 0], [.2, .12], [.75, -.82, 'in'], [.85, -.76], [.95, -.8]] } }
    },
    clipFx: function (name, k) {
      // the swoop: talons swing forward and a fiery swipe flashes as it lands
      var sw = name === 'attack' ? sstep(.3, .46, k) * sstep(.66, .52, k) : 0;
      if (sw) ['l', 'r'].forEach(function (n) { var lg = LEGS[n]; lg.root.quaternion.multiply(_q.setFromAxisAngle(ZAX, sw * 1.1)); lg.joints[1].quaternion.multiply(_q.setFromAxisAngle(ZAX, -sw * .6)); });
      fade(slash, name === 'attack' ? Math.max(0, 1 - Math.abs(k - .5) / .07) : 0);
      // the ultimate: the sunburst grows, flares as the wings come down, and the feathers fly
      var ult = name === 'ultimate';
      fade(nova, ult ? sstep(.04, .3, k) * (1 - sstep(.42, .52, k)) : 0);
      nova.scale.setScalar(.2 + .8 * sstep(.04, .36, k) + .6 * sstep(.36, .46, k)); nova.rotation.z = k * 1.5;
      volley.visible = ult;
      shots.forEach(function (s) {
        var u = (k - s.k0) / (s.k1 - s.k0), on = ult && u > 0 && u < 1;
        s.g.visible = on; if (!on) return;
        _p.copy(s.a).multiplyScalar((1 - u) * (1 - u)).addScaledVector(s.c, 2 * u * (1 - u)).addScaledVector(s.b, u * u);
        _d.set(2 * (1 - u) * (s.c.x - s.a.x) + 2 * u * (s.b.x - s.c.x), 2 * (1 - u) * (s.c.y - s.a.y) + 2 * u * (s.b.y - s.c.y), 0);
        s.g.position.copy(_p); s.g.rotation.z = Math.atan2(_d.y, _d.x); s.g.scale.setScalar(.6 + .4 * sstep(0, .15, u));
      });
      var kb = (k - .6) / .2;
      fade(boom, ult && kb > 0 && kb < 1 ? 1 - sstep(.35, 1, kb) : 0);
      boom.scale.setScalar(.4 + 1.2 * sstep(0, .5, kb));
    },
    update: function (t) {
      var sp = t * 2.4;
      body.position.y = BASE + Math.sin(sp + .6) * .07; body.rotation.z = Math.sin(sp + 1) * .02;
      wings.forEach(function (w) { w.W.rotation.x = -w.s * (RAISE + Math.sin(sp) * .2); w.F.rotation.x = -Math.sin(sp - .5) * .12; w.H.rotation.x = -Math.sin(sp - 1) * .18; });
      head.rotation.z = Math.sin(sp - .8) * .03; head.rotation.y = Math.sin(t * .6) * .12;
      jaw.rotation.z = -(Math.sin(t * 1.3) * .5 + .5) * .06;
      tailC.joints[0].rotation.set(0, Math.sin(t * .9) * .08, Math.sin(sp - 1.2) * .06); tailC.joints[1].rotation.z = Math.sin(sp - 1.8) * .08;
      streamers.forEach(function (g, i) { g.rotation.z = Math.sin(t * 2.2 + i * 1.7) * .07; });
      flames.forEach(function (f, i) { var w = Math.sin(t * 13 + i * 1.9) * .5 + Math.sin(t * 7.1 + i * 2.3) * .5; f.scale.set(1 - w * .07, 1 + w * .15, 1 - w * .07); });
      slash.visible = nova.visible = volley.visible = boom.visible = false;
      placeSparks(t);
      light.intensity = 3.5 + Math.sin(t * 15) * .5 + Math.sin(t * 8.3) * .4;
      var blink = ((t + 2.4) % 5.2) < .13 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
