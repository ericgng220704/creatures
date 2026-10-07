import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { glowMat, halo } from '../kit/materials.js';
import { eye, feather, finish, glow, lock, part, wingKit } from '../kit/parts.js';
import { chain, hang, limb, makeRig } from '../kit/rig.js';
import { sample } from '../kit/anim.js';

// =====================================================================
// STORMTALON: a storm eagle hovering on raised wings, a crest of lightning on its crown
// =====================================================================
export function eagle() {
  var P = {
    brown: C('#8a6446'), dark: C('#6a4a33'), buff: C('#e6d2b0'), white: C('#f6f1e6'), cream: C('#e9dcc4'),
    beak: C('#f2b52e'), cere: C('#f7d672'), beakDark: C('#c98a1c'), leg: C('#f0bd3a'), talon: C('#3b3236'),
    iris: C('#e8a21e'), deep: '#ffb800', mid: '#ffe23a', core: '#fffbd0', edge: '#9fd8ff'
  };
  var root = new T.Group(), body = new T.Group(); root.add(body);
  var BASE = 2.0; body.position.y = BASE;
  var UPV = [0, 1, 0], r = rng(7);
  // plumage: warm brown, darker along the back, a buff belly and a cream bib under the white head
  function coat(p, n) {
    var c = mix(P.brown, P.dark, sstep(.2, .85, n.y));
    c = mix(c, P.buff, sstep(-.1, -.7, n.y) * .8);
    return mix(c, P.cream, sstep(.3, .8, n.x) * sstep(2.0, 2.5, p.y) * .8);
  }
  function hood(p, n) { return mix(P.white, P.cream, sstep(.2, -.6, n.y) * .6); }
  var BODYL = { c: coat }, HEAD = { c: hood };
  var PRIM = { m: 'plume', g: [C('#5c412e'), C('#7a573d'), C('#b48d66')], noOcc: true, aoK: .3 };
  var SEC = { m: 'plume', g: [C('#664832'), C('#87623f'), C('#c29c72')], noOcc: true, aoK: .3 };
  var COV = { m: 'plume', g: [C('#765640'), C('#9a7552'), C('#d4b48a')], noOcc: true, aoK: .3 };
  var BACKF = { m: 'plume', g: [C('#6a4a33'), C('#8a6446'), C('#b99068')], noOcc: true, aoK: .3 };
  var BREAST = { m: 'plume', g: [C('#c9ad86'), C('#e2cda8'), C('#f0e3c8')], noOcc: true, aoK: .3 };
  var TAILF = { m: 'plume', g: [C('#e3d6bf'), C('#f2ebdc'), C('#fbf8f0')], noOcc: true, aoK: .3 };
  var NAPE = { m: 'plume', g: [C('#e6dbc6'), C('#f4eee2'), C('#fbf8f1')], noOcc: true, aoK: .3 };
  var BEAK = { c: P.beak, m: 'gloss' }, TALON = { c: P.talon, m: 'gloss', noAO: true, noOcc: true };
  // a jagged bolt from a to b: n kinks, pushed off the line by up to amp, to and fro along off
  function zig(a, b, n, amp, rr, off) {
    var pts = [a];
    for (var i = 1; i < n; i++) {
      var t = i / n, s = (i % 2 ? 1 : -1) * amp * (.5 + rr() * .5);
      pts.push([0, 1, 2].map(function (c) { return a[c] + (b[c] - a[c]) * t + s * off[c]; }));
    }
    pts.push(b);
    return pts;
  }
  // a lightning plume: a flat zigzag blade pointing +y, from a wide root to a sharp tip
  function boltGeo(len, wid) {
    var s = new T.Shape(), q = [[-.5, 0], [.5, 0], [.14, .42], [.62, .38], [-.02, .76], [.3, .72], [-.32, 1.0], [-.12, .62], [-.44, .64], [-.06, .34], [-.5, .32]];
    q.forEach(function (v, i) { if (i) s.lineTo(v[0] * wid, v[1] * len); else s.moveTo(v[0] * wid, v[1] * len); });
    return new T.ShapeGeometry(s);
  }

  // body: a deep chest held high, the tail end dropping, as an eagle hangs in the air
  part(body, blob(1.5, .95, .9, .85, function (x, y, z, W) { var xn = x / W, k = xn < 0 ? 1 + .3 * xn : 1; return [x, y * k, z * k]; }), BODYL, -.05, 0, 0, 0, 0, .38);
  part(body, blob(.95, 1.0, .9, .85), BODYL, .38, .12, 0, 0, 0, .2);
  // the breast and shoulders in rows of soft feathers, darker on the back, buff on the breast
  for (var br = 0; br < 3; br++) for (var bc = -2; bc <= 2; bc++) feather(body, BREAST, [.78 - br * .06, .1 - br * .22, bc * .13 + (br % 2 ? .06 : 0)], [-.1, -1, bc * .1], [1, -.2, 0], .34, .18, .1);
  for (var mr = 0; mr < 2; mr++) for (var mc = -2; mc <= 2; mc++) feather(body, BACKF, [.25 - mr * .3, .46 - mr * .14, mc * .14], [-1, -.25, mc * .15], [0, 1, 0], .5, .22, .1);

  // legs: feathered trousers over short yellow shanks, each a chain hip > knee > ankle, talons curled under
  var LEGS = {};
  function legC(p, n) { return mix(P.leg, P.beakDark, sstep(.2, -.6, n.y) * .35); }
  [.2, -.2].forEach(function (z) {
    var leg = limb(body, [[0, -.32, z], [.14, -.62, z], [.26, -.92, z]], [[.11, .09], [.07, .06]], { c: legC }), toes = [];
    hang(leg.root, [part(body, blob(.42, .5, .34, .85), BODYL, .05, -.42, z * 1.05, 0, 0, -.25)]);
    hang(leg.root, [0, 1, 2].map(function (i) { return lock(body, { c: coat, tip: P.buff, tipAmt: .4, aoK: .4 }, [.04 + i * .07, -.5, z * 1.05 + (i - 1) * .06], [.15, -1, 0], [1, 0, z], .32, .18, .08, .06); }));
    [[.2, .07], [.22, -.03], [.18, -.12], [-.16, 0]].forEach(function (d) {
      var base = [.26, -.94, z], tip = [.26 + d[0], -1.02, z + d[1]], fw = d[0] > 0 ? 1 : -1;
      toes.push(part(body, ttube([base, [.26 + d[0] * .55, -.99, z + d[1] * .6], tip], .04, .03, 6, 8), { c: legC }));
      toes.push(part(body, ttube([tip, [tip[0] + fw * .06, tip[1] - .02, tip[2]], [tip[0] + fw * .07, tip[1] - .09, tip[2]]], .028, .006, 6, 8), TALON));
    });
    hang(leg.end, toes);
    LEGS[z > 0 ? 'r' : 'l'] = leg;   // +z is the eagle's right, the side the camera sees
  });

  // head: big, round and white, round golden eyes, a short hooked beak on a hinge
  var onNeck = [], head = new T.Group(); head.position.set(.84, .98, 0); body.add(head); onNeck.push(head);
  onNeck.push(part(body, blob(.58, .85, .6, .85, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x, y, z * (1.1 - .2 * t)]; }), HEAD, .66, .64, 0, 0, 0, -.45));
  // the hood ends in a ragged ruff of white feathers lying over the brown shoulders
  for (var hi = 0; hi < 11; hi++) { var ha = -1.35 + hi / 10 * 2.7; onNeck.push(feather(body, NAPE, [.6 + Math.cos(ha) * .12, .44 + Math.cos(ha) * .08, Math.sin(ha) * .3], [-.7 + Math.cos(ha) * .5, -1, Math.sin(ha) * .6], [Math.cos(ha) * .6, .3, Math.sin(ha)], .36 + (hi % 2) * .06, .2, .08)); }
  part(head, blob(.9, .8, .78, .85, function (x, y, z, W) { return [x, y, z * (1 - .15 * Math.max(0, x / W))]; }), HEAD, 0, 0, 0);
  part(head, blob(.22, .22, .3, .8), { c: P.cere, m: 'gloss' }, .34, .02, 0);
  part(head, blob(.5, .26, .24, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .45 * t) - .14 * Math.pow(t, 2.4), z * (1 - .55 * t)]; }), BEAK, .54, -.04, 0);
  [.07, -.07].forEach(function (z) { part(head, blob(.05, .03, .03, 1), { c: '#5a3a1a', noAO: true, noOcc: true }, .44, .04, z); });
  var jaw = new T.Group(); jaw.position.set(.32, -.1, 0); head.add(jaw);
  part(jaw, blob(.36, .1, .2, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .4 * t), z * (1 - .5 * t)]; }), { c: P.beakDark, m: 'gloss' }, .16, -.01, 0);
  var eyes = [];
  [.3, -.3].forEach(function (z) {
    eyes.push(eye(head, P.iris, .22, .1, z * 1.27, .26, .25, z > 0 ? -.42 : .42, 0));
  });
  // nape feathers lying back from the crown
  for (var ni = 0; ni < 7; ni++) feather(head, NAPE, [-.12 - ni * .03, .2 - ni * .07, (ni % 2 ? .16 : -.16) * (1 - ni * .05)], [-1, -.5 - ni * .08, (ni % 2 ? .3 : -.3)], UPV, .44, .16, .12);
  // the storm crest: lightning plumes fanned back from the crown, in the plane the camera sees
  var crest = new T.Group(); crest.position.set(-.04, .3, 0); head.add(crest);
  [[1.75, .78, .3], [2.1, .7, .28], [2.45, .58, .26], [2.8, .46, .22]].forEach(function (c, i) {
    var dir = new T.Vector3(Math.cos(c[0]), Math.sin(c[0]), 0), q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    var bx = -i * .08, by = -i * .04;
    [[P.deep, 1, 1, .02], [P.mid, .8, .72, .03], [P.core, .55, .42, .04]].forEach(function (L) {
      var m = glow(crest, boltGeo(c[1] * L[1], c[2] * L[2]), L[0], bx, by, 0); m.quaternion.copy(q); m.material.side = T.DoubleSide;
      var m2 = m.clone(); m2.position.z = L[3]; crest.add(m2); m.position.z = -L[3];
    });
  });
  halo(head, P.mid, 1.4, -.25, .55, 0, .3);

  // wings raised high in a V, the hands swept back, so the camera sees each one whole from the side
  var TH = { r: 1.2, l: 1.05 };
  var wings = [1, -1].map(function (s) {
    var w = wingKit(body, s, { x: .02, y: .3, z: .3, sc: 1, k: .66, L: 1.05, Wd: 1.15, r: .13, body: BODYL, sec: SEC, prim: PRIM, cov: COV, np: 8, spread: 1.0, slot: .8, tipUp: .06 });
    w.th = TH[s > 0 ? 'r' : 'l'];
    w.W.rotation.x = -s * w.th; w.F.rotation.y = -.3; w.H.rotation.y = -.5;
    // the near wing shows the camera its underside: coverts there too, so the arm does not read bare
    var fy = s > 0 ? -.07 : .07, kk = .66, i, t, an;
    if (s > 0) {
      for (i = 0; i < 5; i++) { t = i / 4; feather(w.W, COV, [-.1 * kk * t, -.05, .85 * kk * t], [-1, -.02, 0], UPV, .6 * kk, .2 * kk, .1); }
      for (i = 0; i < 7; i++) { t = i / 6; an = 1.3 - t * .25; feather(w.F, COV, [-.18 * kk * t, -.04, .85 * kk * t], [-Math.sin(an), -.03, Math.cos(an)], UPV, .62 * kk, .2 * kk, .14); }
      for (i = 0; i < 7; i++) { t = i / 6; an = 1 - t * .9; feather(w.H, COV, [-.25 * kk * t, -.035, .75 * kk * t], [-Math.sin(an), -.02, Math.cos(an)], UPV, .6 * kk, .18 * kk, .14); }
    }
    // a lightning vein along the arm and down the hand, on the face the camera sees
    glow(w.W, ttube(zig([-.08, fy, .12], [-.12, fy, .56], 4, .1, r, [1, 0, 0]), .02, .012, 6, 24), P.mid);
    glow(w.F, ttube(zig([-.1, fy, .05], [-.22, fy, .52], 4, .1, r, [1, 0, 0]), .018, .01, 6, 24), P.mid);
    glow(w.H, ttube(zig([-.12, fy, .05], [-.5, fy, .55], 4, .08, r, [.8, 0, .6]), .016, .006, 6, 24), P.mid);
    return w;
  });

  // tail: a broad cream fan tipped down, on its own joint
  var tail = new T.Group(); tail.position.set(-.66, -.24, 0); body.add(tail);
  for (var k = -4; k <= 4; k++) feather(tail, TAILF, [0, 0, k * .035], [-1, -.32 - Math.abs(k) * .02, k * .14], UPV, 1.15 - Math.abs(k) * .04, .3, .08);
  for (var kc = -2; kc <= 2; kc++) feather(tail, BACKF, [.12, .06, kc * .05], [-1, -.2, kc * .2], UPV, .5, .22, .06);

  // fx: crackling arcs round the bird where the wind used to be, and sparks jumping off it (one instanced mesh)
  var fx = new T.Group(), ring = new T.Group(); root.add(fx); fx.add(ring);
  var arcs = [];
  [[1.5, .2, 0], [1.7, -.1, 2.2], [1.35, .45, 4.1]].forEach(function (a, ai) {
    var set = [];
    for (var v = 0; v < 3; v++) {
      var rr = rng(30 + ai * 5 + v), pts = [];
      for (var q = 0; q <= 14; q++) { var an = a[2] + q / 14 * 1.9, rad = a[0] + (q % 2 ? .12 : -.12) * (.4 + rr()); pts.push([Math.cos(an) * rad, BASE + a[1] + (rr() - .5) * .3, Math.sin(an) * rad * .8]); }
      var m = new T.Group(); ring.add(m); m.visible = false; set.push(m);
      glow(m, ttube(pts, .05, .02, 5, 30), P.edge, 0, 0, 0, 0, 0, 0, .3); glow(m, ttube(pts, .02, .008, 5, 30), v ? P.mid : P.core);
    }
    arcs.push(set);
  });
  var SN = 24, sparks = new T.InstancedMesh(new T.OctahedronGeometry(.05, 0), glowMat('#ffffff'), SN), smt = new T.Object3D(), ss = [];
  sparks.frustumCulled = false; fx.add(sparks);
  var SPOT = [[.9, 3.6, 0], [.5, 3.4, 0], [-.6, 3.9, .8], [-1.2, 3.6, .5], [-1.3, 3.4, -.6], [.4, 1.0, .2], [-1.6, 1.4, 0], [.2, 2.6, .5]];
  for (var si = 0; si < SN; si++) { ss.push({ a: SPOT[si % SPOT.length], ph: (si * .137) % 1, sp: 1.6 + (si % 5) * .5 }); sparks.setColorAt(si, new T.Color(si % 4 === 0 ? P.edge : si % 2 ? P.mid : P.core)); }
  function placeSparks(t) {
    ss.forEach(function (e, i) {
      var kk = (t * e.sp + e.ph) % 1, n = Math.floor(t * e.sp + e.ph) * 7 + i * 13, j = function (m) { return (Math.sin(n * m) * 43758.5453) % 1; };
      smt.position.set(e.a[0] + j(1.3) * .4, e.a[1] + j(2.1) * .35 + kk * .3, e.a[2] + j(3.7) * .4); smt.rotation.set(n, n * .7, 0);
      smt.scale.setScalar(Math.max(.01, Math.sin(kk * Math.PI) * (1 - kk))); smt.updateMatrix(); sparks.setMatrixAt(i, smt.matrix);
    });
    sparks.instanceMatrix.needsUpdate = true;
  }
  placeSparks(0);
  halo(fx, P.mid, 5, 0, BASE + .4, 0, .16);
  fx.traverse(function (o) { o.userData.noFit = true; });
  var light = new T.PointLight(0xffd84a, 2.4, 4, 1.6); light.position.set(.4, 1.3, .4); body.add(light);

  // the ultimate: a bolt from the sky onto the target, and a jolt off the talons when the dive lands (clipFx below)
  var strike = new T.Group(); root.add(strike);
  var sr = rng(91), main = zig([1.6, 6.4, 0], [2.4, .02, 0], 9, .35, sr, [1, 0, .4]);
  glow(strike, ttube(main, .11, .07, 6, 120), P.deep, 0, 0, 0, 0, 0, 0, .85);
  glow(strike, ttube(main, .045, .035, 6, 120), P.core);
  [[3, [2.9, 3.6, .3]], [5, [1.4, 1.6, -.2]], [6, [3.0, 1.0, .2]]].forEach(function (b) { var bp = zig(main[b[0]], b[1], 4, .2, sr, [0, 1, .3]); glow(strike, ttube(bp, .05, .01, 5, 40), P.mid); });
  var flash = glow(strike, new T.RingGeometry(.3, 1.0, 32), P.mid, 2.4, .03, 0, -Math.PI / 2, 0, 0, .5);
  halo(strike, P.mid, 4, 2.4, .6, 0, .6);
  strike.visible = false; strike.traverse(function (o) { o.userData.noFit = true; o.userData.noMerge = true; });
  var zap = new T.Group(); zap.position.set(.3, -.1, 0); LEGS.r.end.add(zap);
  for (var zi = 0; zi < 6; zi++) { var za = zi / 6 * Math.PI * 2; glow(zap, ttube(zig([0, 0, 0], [Math.cos(za) * .7, Math.sin(za) * .55, (zi % 2 - .5) * .4], 4, .12, sr, [-Math.sin(za), Math.cos(za), 0]), .035, .006, 5, 24), zi % 2 ? P.mid : P.core); }
  zap.visible = false; zap.traverse(function (o) { o.userData.noFit = true; o.userData.noMerge = true; });

  // the neck joint, low in the shoulders: it carries the head, the white hood and the crest
  var neck = new T.Group(); neck.position.set(.52, .42, 0); body.add(neck);
  hang(neck, onNeck);

  finish(root, 4.2);
  var LQ = new T.Quaternion(), LE = new T.Euler();
  function swing(g, a) { g.quaternion.copy(g.userData.rest.q).multiply(LQ.setFromEuler(LE.set(0, 0, a))); }
  var TALONS = {
    attack: [[0, 0], [.3, -.3], [.42, .2], [.5, 1.0, 'out'], [.62, .5], [.85, 0]],
    ultimate: [[0, 0], [.4, -.35], [.55, .2], [.62, 1.1, 'out'], [.75, .4], [.95, 0]]
  };
  return {
    root: root, head: head, name: 'eagle', headView: { span: 2.2, up: .1, look: 0 }, initYaw: -1.1,
    rig: makeRig({ plan: 'flyer', body: body, neck: neck, head: head, jaw: jaw, tail: [tail], legs: LEGS,
      wings: { r: chain([wings[0].W, wings[0].F, wings[0].H]), l: chain([wings[1].W, wings[1].F, wings[1].H]) } }),
    // the attack is a stoop: a climb on raised wings, a dive with the wings tucked, and a flare that throws the
    // talons forward as it lands; the ultimate climbs higher, charges, and calls the bolt down as it dives
    clips: {
      attack: { tracks: {
        'wings.lift': [[0, 0], [.25, .25], [.42, .3], [.5, -.6], [.62, -.3], [.85, 0]], 'wings.beat': [[0, .2], [.22, .3], [.3, 0], [.5, 0], [.62, .35], [1, .2]],
        'body.y': [[0, 0], [.25, .3], [.48, -.42, 'in'], [.62, -.15], [.9, 0]], 'body.pitch': [[0, 0], [.25, .2], [.42, -.5], [.5, .3, 'out'], [.62, .1], [.85, 0]],
        'head.pitch': [[0, 0], [.25, -.15], [.42, .35], [.5, -.25], [.62, 0]], 'jaw.open': [[0, 0], [.3, .25], [.5, .3], [.65, 0]]
      } },
      ultimate: { tracks: {
        'wings.lift': [[0, 0], [.38, .35], [.5, .3], [.6, -.65], [.72, -.3], [.95, 0]], 'wings.beat': [[0, .2], [.1, .4], [.38, .4], [.45, 0], [.62, 0], [.75, .35], [1, .2]],
        'body.y': [[0, 0], [.4, .6], [.62, -.42, 'in'], [.75, -.15], [.95, 0]], 'body.pitch': [[0, 0], [.38, .3], [.55, -.5], [.62, .3, 'out'], [.72, .1], [.9, 0]],
        'head.pitch': [[0, 0], [.38, .35], [.55, .3], [.62, -.25], [.76, 0]], 'jaw.open': [[0, 0], [.3, .35], [.5, .35], [.62, .1], [.75, 0]]
      } },
      victory: { tracks: { 'wings.lift': [[0, 0], [.3, -.35], [.75, -.35], [1, 0]], 'jaw.open': [[0, 0], [.3, .35], [.75, .35], [1, 0]] } },
      faint: { tracks: { 'body.y': [[0, 0], [.2, .1], [.9, -.55, 'in']], 'body.roll': [[0, 0], [.35, 0], [.85, .45]], 'wings.lift': [[0, 0], [.6, -1.0]] } }
    },
    clipFx: function (name, k, clip) {
      var tk = TALONS[name], sw = tk ? sample(tk, k) : 0;
      if (tk) { swing(LEGS.r.root, sw); swing(LEGS.l.root, sw * .9); }
      var hit = clip.impact, d = Math.abs(k - hit - .03);
      zap.visible = name === 'attack' && d < .07 && Math.floor((k - hit) * 90 + 3) % 3 !== 2;
      strike.visible = name === 'ultimate' && k > hit - .02 && k < hit + .12 && Math.floor((k - hit) * 80 + 2) % 4 !== 3;
      flash.material.opacity = .5 * Math.max(0, 1 - Math.abs(k - hit) / .1);
      if (name === 'ultimate') crest.scale.setScalar(1 + .45 * sstep(.05, .4, k) * (1 - sstep(.62, .8, k)));
    },
    update: function (t) {
      var sp = t * 3.2, a = .15;
      body.position.y = BASE + Math.sin(sp + .9) * .06; body.rotation.z = Math.sin(t * .6) * .025;
      wings.forEach(function (w) {
        w.W.rotation.x = -w.s * (w.th + Math.sin(sp) * a + a * .2);
        w.F.rotation.x = -Math.sin(sp - .5) * a * .6; w.H.rotation.x = -Math.sin(sp - 1.0) * a * .9;
      });
      tail.rotation.y = Math.sin(t * .8) * .08; tail.rotation.z = Math.sin(sp + .4) * .04;
      head.rotation.y = Math.sin(t * .5) * .12; head.rotation.z = Math.sin(t * .7) * .04;
      jaw.rotation.z = -(Math.sin(t * .9) * .5 + .5) * .04;
      crest.scale.set(1, 1 + Math.sin(t * 11) * .04 + Math.sin(t * 7.3) * .03, 1);
      arcs.forEach(function (set, i) { var c = Math.floor(t * 9 + i * 3.7), on = (c % 7) < 2; set.forEach(function (m, v) { m.visible = on && (c % 3) === v; }); });
      ring.rotation.y = t * .2;
      strike.visible = zap.visible = false;
      placeSparks(t);
      light.intensity = 2.4 + Math.sin(t * 19) * .4 + Math.sin(t * 7.7) * .3;
      var blink = ((t + 2.5) % 5.5) < .13 ? .12 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
