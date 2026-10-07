import * as T from 'three';
import { C, mix, sstep } from '../kit/math.js';
import { blob, crystalGeo, ttube } from '../kit/geometry.js';
import { crystalMat, halo } from '../kit/materials.js';
import { UP, eye, finish, glow, part, shard } from '../kit/parts.js';
import { hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// TIDEFANG: a heavy armoured crocodile carrying the sea in crystal, high on its arms, a toothy grin
// =====================================================================
export function tidefang() {
  var P = {
    back: C('#467f93'), flank: C('#5f9db0'), belly: C('#f3ebd6'), scute: C('#3f7488'), keel: C('#9ccbd4'),
    mouth: C('#d98591'), gum: C('#bc6573'), tooth: C('#f4f0e6'), claw: C('#efe9dc'), web: C('#7fb4c2'), nostril: C('#26434d'),
    crystal: '#3fd2ff', crystalGlow: '#0099ff', core: '#c9fbff', iris: C('#e8a23a'), wave: '#8ff6ff'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  // the body rides high on its arms; the tail slopes down to the ground behind it
  var LIFT = .42, TD = .78, TY = .6, TL = 1.75;
  body.position.y = LIFT;
  var crystals = [], CRY = crystalMat(P.crystal, P.crystalGlow);   // one material: every crystal pulses together
  function hide(p, n) {
    var c = mix(P.flank, P.back, sstep(.2, .8, n.y));
    if (n.y > -.25 && Math.sin(p.x * 7.5) > .55) c.multiplyScalar(.82);
    return mix(c, P.belly, sstep(.05, -.35, n.y));
  }
  var HIDE = { c: hide };
  // body: long, deep and round, with a full belly
  part(body, blob(2.3, .98, 1.3, .88, function (x, y, z, W) {
    var xn = x / W, sz = 1 - .22 * xn * xn, sy = 1 - .14 * xn * xn;
    if (y < 0) y *= .88;
    return [x, y * sy, z * sz];
  }), HIDE, 0, .62, 0);
  [.36, -.36].forEach(function (z) {
    part(body, blob(.64, .5, .46, .85), HIDE, .62, .56, z * 1.12);
    part(body, blob(.7, .54, .48, .85), HIDE, -.7, .56, z * 1.12);
  });
  part(body, blob(1.1, .72, 1.0, .82, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .12 * t), z * (1 - .08 * t)]; }), HIDE, 1.1, .62, 0);
  // tail: one tapered, flattened body; a travelling wave bends it, and its crest rides along
  var TAIL0 = -.95, tailPts = [], riders = [];
  for (var k = 0; k <= 6; k++) { var tt = k / 6; tailPts.push([TAIL0 - tt * TL, TY - tt * TD + Math.sin(tt * Math.PI) * .04, 0]); }
  var tailGeo = ttube(tailPts, .44, .035, 14, 44), tp = tailGeo.attributes.position;
  for (var i = 0; i < tp.count; i++) { var ty = tp.getY(i), tcy = TY - Math.min(1, (TAIL0 - tp.getX(i)) / TL) * TD; tp.setZ(i, tp.getZ(i) * .86); tp.setY(i, tcy + (ty - tcy) * 1.05); }
  tailGeo.computeVertexNormals();
  part(body, tailGeo, HIDE);
  var tailBase = Float32Array.from(tp.array);
  function tailR(x) { var t = Math.min(1, Math.max(0, (TAIL0 - x) / TL)); return { t: t, r: .44 + (.035 - .44) * Math.pow(t, .9), y: TY - t * TD + Math.sin(t * Math.PI) * .04 }; }
  for (var cxp = TAIL0 - .1; cxp > TAIL0 - TL + .15; cxp -= .12) {
    var q = tailR(cxp), h = .13 - q.t * .07;
    (q.t < .55 ? [.1 * (1 - q.t), -.1 * (1 - q.t)] : [0]).forEach(function (z) {
      riders.push(shard(body, .05 - q.t * .02, h, 4, { c: P.keel, m: 'flat' }, [cxp, q.y + q.r * .9, z], [-.35, 1, z * 2], Math.PI / 4));
    });
  }
  var fan = new T.Group(), qe = tailR(TAIL0 - TL + .05); fan.position.set(TAIL0 - TL + .05, qe.y, 0); body.add(fan); riders.push(fan);
  [-.55, 0, .55].forEach(function (a) {
    var c = new T.Mesh(crystalGeo(.055, .5 - Math.abs(a) * .18), CRY);
    c.rotation.set(0, 0, 1.3 + a); c.castShadow = true; fan.add(c); crystals.push(c);
  });
  riders.forEach(function (m) { m.userData.base = m.position.clone(); m.userData.baseQ = m.quaternion.clone(); });
  function wave(x, t) { var d = Math.max(0, TAIL0 - x); return Math.sin(t * 1.5 - d * 1.7) * Math.pow(d, 1.35) * .09; }
  // armour: keeled scutes in rows down the back
  function topY(x) { var xn = x / 1.15; return .62 + .49 * (1 - .14 * xn * xn); }
  var SCUTE = { c: function (p, n) { return mix(P.scute, P.keel, sstep(.62, .95, p.y)); }, m: 'flat' };
  for (var x = -1.0; x <= 1.0; x += .16) {
    [0, .14, .3, .45].forEach(function (zz, row) {
      if (row === 3 && Math.abs(x) > .7) return;
      if (row === 0 && Math.abs(Math.round(x / .16)) % 2 === 1) return;
      var xn = x / 1.15, half = .65 * (1 - .22 * xn * xn), y = .62 + .49 * (1 - .14 * xn * xn) * Math.sqrt(Math.max(.05, 1 - (zz / half) * (zz / half)));
      (zz ? [zz, -zz] : [0]).forEach(function (z) { shard(body, .075 - row * .008, .09 - row * .012, 4, SCUTE, [x + (row % 2) * .08, y - .02, z], [0, 1, z * 1.6], Math.PI / 4); });
    });
  }
  // crystal clusters along the spine, lit from inside
  for (var cx = -.95; cx <= .95; cx += .38) {
    var s = .8 + (cx + .95) / 1.9 * .5, grp = new T.Group(); grp.position.set(cx, topY(cx) + .02, 0); body.add(grp);
    [[0, .55, 0, .11], [.08, .38, .2, .08], [-.06, .34, -.22, .08], [.12, .26, -.05, .06]].forEach(function (k) {
      var c = new T.Mesh(crystalGeo(k[3] * s, k[1] * s), CRY);
      c.position.set(k[0] * s, 0, 0); c.rotation.set(k[2] * 2, 0, .28); c.castShadow = true; grp.add(c); crystals.push(c);
      glow(grp, crystalGeo(k[3] * s * .4, k[1] * s * .75), P.core, k[0] * s, 0, 0, k[2] * 2, 0, .28, .4);
    });
  }
  halo(body, P.crystalGlow, 2.6, 0, 1.25, 0, .22);
  var light = new T.PointLight(0x46dcff, 3, 3, 1.6); light.position.set(0, 1.5, 0); body.add(light);
  // glowing wave lines along each flank
  [1, -1].forEach(function (s) {
    var pts = []; for (var k = 0; k <= 10; k++) { var x = -.9 + k * .18; pts.push([x, .72 + Math.sin(k * 1.4) * .06, s * (.64 * (1 - .22 * (x / 1.15) * (x / 1.15)) + .02)]); }
    glow(body, ttube(pts, .02, .012, 6, 40), P.wave);
  });
  // head: wide skull, long snout, bulb nose, eye turrets, a heavy jaw
  var head = new T.Group(); head.position.set(1.46, .54, 0); head.rotation.z = -.07; head.scale.set(1.0, 1.4, 1.25); body.add(head);
  // profile along the head: t = 0 at the back of the skull, 1 at the nose
  function bulb(t) { return Math.exp(-Math.pow((t - .92) / .06, 2)); }
  function headH(t) { return (t < .28 ? 1 : 1 - .48 * sstep(.28, .85, t)) + .22 * bulb(t); }
  function headW(t) { return (t < .22 ? 1 : 1 - .5 * sstep(.22, .8, t)) + .14 * bulb(t); }
  var HL = 1.96, HX = .62;
  part(head, blob(HL, .5, .84, .78, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, (y > 0 ? y * .85 : y) * headH(t), z * headW(t)]; }, 40, 20), HIDE, HX, 0, 0);
  function halfW(lx) { var t = (lx - (HX - HL / 2)) / HL; return .42 * headW(t); }
  [.07, -.07].forEach(function (z) { part(head, blob(.07, .04, .055, .9), { c: P.nostril, noOcc: true }, 1.47, .1, z); });
  for (var b = 0; b < 7; b++) part(head, blob(.06, .045, .06, .9), { c: P.keel, m: 'flat', noOcc: true }, .42 + b * .14, .15 - b * .012, (b % 2 ? .09 : -.09));
  var eyes = [];
  [.25, -.25].forEach(function (z) {
    part(head, blob(.3, .21, .22, .8), HIDE, .16, .15, z * .92);
    part(head, blob(.26, .06, .12, .8), HIDE, .15, .245, z * .97, 0, 0, -.05);
    eyes.push(eye(head, P.iris, .23, .16, z * 1.32, .2, .13, z > 0 ? -.3 : .3, 0));
  });
  var jaw = new T.Group(); jaw.position.set(-.08, -.12, 0); jaw.rotation.z = -.03; head.add(jaw);
  part(jaw, blob(1.78, .32, .78, .8, function (x, y, z, W) { var t = (x / W + 1) / 2, tt = .14 + t * .86; return [x, y, z * headW(tt) * .95]; }, 40, 20), { c: function (p, n) { return mix(P.flank, P.belly, sstep(.1, -.6, n.y)); } }, .9, -.13, 0);
  part(jaw, blob(1.6, .06, .66, .8, function (x, y, z, W) { var t = (x / W + 1) / 2, tt = .18 + t * .78; return [x, y, z * headW(tt) * .9]; }), { c: P.mouth, noOcc: true }, .85, .01, 0);
  part(head, blob(1.5, .05, .7, .8, function (x, y, z, W) { var t = (x / W + 1) / 2, tt = .2 + t * .76; return [x, y, z * headW(tt) * .92]; }), { c: P.gum, noOcc: true }, .82, -.17, 0);
  var TOOTH = { c: P.tooth, m: 'gloss', noAO: true, noOcc: true };
  // a pair of fangs over the lip near the snout, and a smaller pair rising from the jaw
  [halfW(1.18) - .01, -(halfW(1.18) - .01)].forEach(function (z) {
    shard(head, .038, .22, 5, TOOTH, [1.18, -.17, z], [0, -1, z * .5]);
    shard(jaw, .026, .1, 5, TOOTH, [1.0, .03, z * .9], [0, 1, z * .4]);
  });
  // legs: a muscled shoulder or hip, a long upper arm, an elbow knuckle, a heavy forearm,
  // then a palm with five toes in front (four behind) joined by a web, each toe ending in a claw
  var CLAW = { c: P.claw, m: 'gloss', noAO: true };
  var LEGS = {};
  [[.62, 1], [.62, -1], [-.7, 1], [-.7, -1]].forEach(function (l) {
    var x = l[0], s = l[1], back = x < 0;
    var sh = [x, 1.06, s * .54], el = back ? [x + .12, .6, s * .96] : [x - .04, .58, s * .92], wr = back ? [x - .08, .14, s * .82] : [x + .08, .13, s * .8];
    var leg = limb(legs, [sh, el, wr], [[back ? .21 : .18, back ? .14 : .12], [back ? .13 : .12, .085]], HIDE), upper = [], lower = [], foot = [];
    upper.push(part(legs, blob(back ? .5 : .4, .4, .34, .85), HIDE, x, 1.0, s * .6, 0, 0, back ? .25 : -.2));
    lower.push(part(legs, blob(.22, .22, .22, .9), HIDE, el[0], el[1], el[2]));
    foot.push(part(legs, blob(.15, .13, .15, .9), HIDE, wr[0], wr[1], wr[2]));
    // keeled scutes up the back edge of each segment
    [[sh, el], [el, wr]].forEach(function (pair, pi) {
      [.25, .55, .85].forEach(function (t) {
        var bp = [pair[0][0] + (pair[1][0] - pair[0][0]) * t - .07, pair[0][1] + (pair[1][1] - pair[0][1]) * t + .06, pair[0][2] + (pair[1][2] - pair[0][2]) * t + s * .05];
        (pi ? lower : upper).push(shard(legs, .036 - pi * .006, .1 - pi * .02, 4, SCUTE, bp, [-.4, .8, s * .5], Math.PI / 4));
      });
    });
    // a small crystal pushing out of each elbow
    [[.04, .2, .9, .45], [.03, .13, .45, -.25]].forEach(function (k, ki) {
      var c = new T.Mesh(crystalGeo(k[0], k[1]), CRY);
      c.position.set(el[0] - .03 - ki * .04, el[1] + .06, el[2] + s * (.08 + ki * .04));
      c.rotation.set(s * k[2], 0, k[3]); c.castShadow = true; legs.add(c); crystals.push(c); lower.push(c);
    });
    // the foot
    var fz = s * .82, toes = back ? [-.15, -.05, .05, .15] : [-.2, -.1, 0, .1, .2];
    foot.push(part(legs, blob(.3, .1, .34, .8), HIDE, x + .08, .06, fz), part(legs, blob(.44, .03, .56, .7), { c: P.web }, x + .22, .028, fz));
    toes.forEach(function (dz) {
      var reach = .07 * (1 - Math.abs(dz) / .22), mid = [x + .2 + reach * .6, .065, fz + dz * .85], tip = [x + .34 + reach, .045, fz + dz * 1.25];
      foot.push(part(legs, ttube([[x + .04, .07, fz + dz * .3], mid, tip], .05, .03, 6, 6), HIDE));
      foot.push(shard(legs, .024, .09, 5, CLAW, [tip[0] + .03, tip[1], tip[2]], [1, -.35, dz * 1.2]));
    });
    hang(leg.joints[0], upper); hang(leg.joints[1], lower); hang(leg.end, foot);
    LEGS[(back ? 'b' : 'f') + (s > 0 ? 'r' : 'l')] = leg;
  });
  // the neck joint, behind the skull, carrying the head; and the whole crocodile a size up
  var neck = new T.Group(); neck.position.set(1.1, .6, 0); body.add(neck);
  hang(neck, [head]);
  root.scale.setScalar(1.1);
  finish(root, 1.4);
  return {
    root: root, head: head, name: 'tidefang',
    rig: makeRig({ plan: 'quadruped', body: body, neck: neck, head: head, jaw: jaw, legs: LEGS }),
    // it lunges with its jaws thrown wide and slams them shut on the target
    clips: { attack: { tracks: { 'jaw.open': [[0, 0], [.3, .9], [.48, 0, 'in'], [.6, .3], [.85, 0]], 'head.pitch': [[0, 0], [.28, .3], [.48, -.1], [.7, 0]] } } },
    update: function (t) {
      var br = Math.sin(t * 1.6);
      body.position.y = LIFT + br * .01; body.scale.set(1, 1 + br * .01, 1 + br * .012);
      head.rotation.y = Math.sin(t * .6) * .05; head.rotation.z = -.07 + Math.sin(t * .9) * .02;
      jaw.rotation.z = -.03 - (Math.sin(t * .9) * .5 + .5) * .03;
      var arr = tp.array;
      for (var i = 0; i < tp.count; i++) arr[i * 3 + 2] = tailBase[i * 3 + 2] + wave(tailBase[i * 3], t);
      tp.needsUpdate = true; tailGeo.computeVertexNormals();
      var yq = new T.Quaternion();
      riders.forEach(function (m) {
        var bp = m.userData.base; m.position.set(bp.x, bp.y, bp.z + wave(bp.x, t));
        var slope = (wave(bp.x - .02, t) - wave(bp.x + .02, t)) / .04;
        m.quaternion.copy(yq.setFromAxisAngle(UP, -Math.atan(slope))).multiply(m.userData.baseQ);
      });
      var pulse = .65 + Math.sin(t * 2.2) * .25;
      crystals.forEach(function (c) { c.material.emissiveIntensity = pulse; });
      light.intensity = 2.6 + Math.sin(t * 2.2) * .8;
      var blink = ((t + 2.5) % 5.3) < .14 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
