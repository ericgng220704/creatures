import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, leafGeo, lumpGeo, ttube } from '../kit/geometry.js';
import { glowMat, halo } from '../kit/materials.js';
import { UP, eye, finish, glow, lock, part, seg, shard } from '../kit/parts.js';
import { bind, chain, hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// THORNSTAG: a gentle fawn forest stag whose antlers bloom with living green light
// =====================================================================
export function thornstag() {
  var P = {
    coat: C('#b98b5c'), coatDark: C('#94693f'), stripe: C('#82593a'), pale: C('#f1e4c9'), earIn: C('#e3ad98'), nose: C('#3a2b26'),
    hoof: C('#5c463a'), bark: C('#86684a'), barkDark: C('#644a34'), leaf: C('#6aa84c'), leafDark: C('#4f8a3c'),
    moss: C('#5f8a42'), mossLight: C('#7fa653'), vine: C('#557f3c'), mouth: C('#7a5040'),
    iris: C('#8a9a35'), bloom: '#78c255', bud: '#c4ff86', deep: '#4c973a'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  function coat(p, n) {
    var c = mix(P.coat, P.coatDark, sstep(.3, .9, n.y));
    c = mix(c, P.pale, sstep(-.3, -.75, n.y) * .85);
    if (n.y > .5 && Math.abs(p.z) < .12 && p.y > 1.8) c = mix(c, P.stripe, .7);
    if (p.x < -.95 && n.x < -.3) c = mix(c, P.pale, .7);
    if (p.x > .7) c = mix(c, P.pale, sstep(.15, .65, n.x * .5 - n.y) * .85);
    return c;
  }
  var COAT = { c: coat }, LOCK = { c: coat, tip: P.pale, tipAmt: .3, aoK: .35 };
  function gauss(x, c, w) { var d = (x - c) / w; return Math.exp(-d * d); }
  // the back's height along its length, so the moss can sit on it
  function stagTop(x) { var xn = x / .95; return 1.54 + .47 + .08 * gauss(xn, .55, .22) + .05 * gauss(xn, -.72, .2); }
  // body: a deep barrel of ribs, a tucked flank, withers and hips that rise
  part(body, blob(1.94, .94, .94, .8, function (x, y, z, W, H) {
    var xn = x / W, rib = 1 + .15 * gauss(xn, .3, .38) - .1 * gauss(xn, -.3, .26);
    if (y > 0) y += (.08 * gauss(xn, .55, .22) + .05 * gauss(xn, -.72, .2)) * (y / H);
    else y *= (1 - .2 * gauss(xn, -.25, .35)) * (.92 + .16 * (xn + 1) / 2);
    return [x, y, z * rib * (.9 + .1 * (xn + 1) / 2)];
  }), COAT, 0, 1.54, 0);
  part(body, blob(.84, 1.04, .86, .82), COAT, .64, 1.5, 0, 0, 0, -.1);
  part(body, blob(.8, .94, .84, .82), COAT, -.7, 1.6, 0);
  // heavy shoulders and thighs: shoulder blade, deltoid, triceps; thigh, glute, stifle
  function taper(x, y, z, W, H) { var k = .5 + .5 * ((y / H + 1) / 2); return [x * k, y, z * k]; }
  [1, -1].forEach(function (s) {
    part(body, blob(.56, .72, .26, .85, taper), COAT, .5, 1.74, s * .39, 0, 0, -.35);
    part(body, blob(.36, .56, .26, .85, taper), COAT, .64, 1.38, s * .37, 0, 0, -.12);
    part(body, blob(.54, .84, .32, .85, taper), COAT, -.6, 1.36, s * .33, 0, 0, .25);
    part(body, blob(.5, .46, .3, .85), COAT, -.8, 1.7, s * .3);
  });
  // moss along the spine, with blades of grass growing out of it, their tips lit
  var mr = rng(21);
  for (var m = 0; m < 20; m++) {
    var t = m / 19, mx = -.78 + t * 1.4, my = stagTop(mx) - .05, mz = (mr() - .5) * .3;
    part(body, lumpGeo(.08 + mr() * .05, m * 7 + 1), { c: mr() < .35 ? P.mossLight : P.moss, m: 'flat' }, mx, my, mz, mr() * 3, mr() * 3, mr() * 3);
    shard(body, .022, .16 + mr() * .12, 4, { c: P.leaf, m: 'flat', noOcc: true }, [mx + (mr() - .5) * .1, my + .04, mz], [-.4 + (mr() - .5) * .5, 1, (mr() - .5) * .6]);
    if (m % 3 === 1) glow(body, new T.ConeGeometry(.018, .12, 4).translate(0, .06, 0), P.bloom, mx, my + .1, mz, 0, 0, .35);
  }
  // green veins under the hide of the shoulders and haunches
  [1, -1].forEach(function (s) {
    glow(body, ttube([[.4, 1.86, .54 * s], [.56, 1.66, .6 * s], [.46, 1.48, .61 * s], [.6, 1.28, .57 * s]], .015, .007, 6, 24), P.bloom);
    glow(body, ttube([[.66, 1.78, .54 * s], [.72, 1.6, .59 * s]], .012, .006, 6, 8), P.bloom);
    glow(body, ttube([[-.46, 1.86, .56 * s], [-.66, 1.64, .61 * s], [-.56, 1.44, .62 * s], [-.7, 1.26, .57 * s]], .015, .007, 6, 24), P.bloom);
  });
  // neck: a crest of muscle along the top, a ruff of locks at the throat, a vine wound round it;
  // all of it rides the neck joint (added below) with the head
  var onNeck = [seg(body, [1.16, 2.46, 0], [.74, 1.74, 0], .22, .33, COAT, .9, 1.05)];
  onNeck.push(part(body, blob(.5, 1.0, .46, .85), COAT, .96, 2.08, 0, 0, 0, -.55));
  part(body, blob(.66, .74, .62, .85), COAT, .72, 1.92, 0);
  var r = rng(9);
  for (var k = 0; k < 14; k++) {
    var side = k % 2 ? 1 : -1, ky = 2.26 - k * .06;
    onNeck.push(lock(body, LOCK, [1.12 - k * .035, ky, side * (.1 + r() * .12)], [-.2, -1, side * .5], [1, -.2, side * .3], .3 + r() * .08, .16, .08, .08));
  }
  [1, -1].forEach(function (sd) {
    var vp = [[.5, 2.0, sd * .46], [.76, 2.2, sd * .4], [.98, 2.16, sd * .35], [1.08, 2.38, sd * .27], [1.2, 2.5, sd * .18]];
    onNeck.push(part(body, ttube(vp, .03, .016, 6, 20), { c: P.vine, noOcc: true }));
    vp.forEach(function (q, i) { onNeck.push(part(body, leafGeo(.16, .09), { c: i % 2 ? P.leafDark : P.leaf, m: 'leaf', noOcc: true }, q[0], q[1], q[2], .6 + i, i * 1.7, .5)); });
  });
  // tail: a short raised scut on three joints, pale beneath, fringed with locks
  var tailC = limb(body, [[-1.0, 1.9, 0], [-1.16, 1.94, 0], [-1.3, 1.84, 0], [-1.36, 1.68, 0]], [[.13, .12], [.12, .1], [.1, .06]], COAT), tufts = [];
  [[-1.12, 1.9], [-1.22, 1.88], [-1.3, 1.8], [-1.35, 1.7]].forEach(function (q, i) {
    [.06, -.06].forEach(function (z) { tufts.push(lock(body, LOCK, [q[0], q[1] - .03, z], [-.4, -1, z * 3], [-1, -.3, 0], .2 + i * .02, .11, .07, .05)); });
  });
  bind(tailC, tufts);
  // legs: chains of joints, shoulder > knee > fetlock and hip > stifle > hock > fetlock, cloven hooves on the last
  var LEGW = { c: function (p, n) { return mix(P.coat, P.pale, sstep(.5, .15, p.y) * .3); } };
  var HOOF = { c: P.hoof, m: 'gloss' };
  function hoof(arr, x, z) {
    arr.push(seg(legs, [x - .04, .22, z], [x, .1, z], .068, .066, LEGW));
    [.04, -.04].forEach(function (dz) { arr.push(part(legs, blob(.15, .14, .08, .75, function (xx, y, zz, W) { return [xx, y * (1 - .3 * Math.max(0, xx / W)), zz]; }), HOOF, x + .05, .07, z + dz)); });
  }
  var FRONT = [[.6, 1.36], [.64, .78], [.65, .22]], BACK = [[-.64, 1.44], [-.46, .98], [-.82, .64], [-.76, .22]], LEGS = {};
  function at(pts, z) { return pts.map(function (q) { return [q[0], q[1], z]; }); }
  [.24, -.24].forEach(function (z) {
    var front = limb(legs, at(FRONT, z), [[.16, .1], [.085, .07]], COAT), back = limb(legs, at(BACK, z), [[.21, .14], [.14, .09], [.08, .07]], COAT);
    hang(front.joints[1], part(legs, blob(.16, .17, .15, .9), LEGW, .64, .76, z));
    hang(back.joints[2], part(legs, blob(.16, .16, .14, .9), LEGW, -.82, .63, z));
    var fp = [], bp = []; hoof(fp, .69, z); hoof(bp, -.72, z);
    hang(front.end, fp); hang(back.end, bp);
    LEGS[z > 0 ? 'fr' : 'fl'] = front; LEGS[z > 0 ? 'br' : 'bl'] = back;   // +z is its right
  });
  // head: held high, a long deep muzzle closed in a calm line, a soft brow over round hazel eyes
  var head = new T.Group(); head.position.set(1.26, 2.66, 0); head.rotation.z = -.12; body.add(head);
  part(head, blob(.56, .48, .48, .8, function (x, y, z, W) { return [x, y, z * (1 - .12 * Math.max(0, x / W))]; }), COAT, 0, 0, 0);
  part(head, blob(.58, .38, .4, .76, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .2 * t), z * (1 - .3 * t)]; }), COAT, .34, -.08, 0);
  part(head, blob(.17, .13, .21, .75), { c: P.nose, m: 'gloss' }, .64, -.04, 0);
  var jaw = new T.Group(); jaw.position.set(.1, -.21, 0); jaw.rotation.z = -.05; head.add(jaw);
  part(jaw, blob(.46, .14, .31, .72, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .45 * t)]; }), { c: function (p, n) { return mix(P.coat, P.pale, sstep(.1, -.5, n.y)); } }, .27, 0, 0);
  [1, -1].forEach(function (sd) {
    part(head, ttube([[.1, -.21, sd * .16], [.3, -.27, sd * .17], [.5, -.25, sd * .12], [.62, -.2, sd * .1]], .012, .01, 6, 14), { c: P.mouth, noAO: true, noOcc: true });
  });
  var eyes = [], ears = [];
  [.23, -.23].forEach(function (z) {
    var s = z > 0 ? 1 : -1;
    eyes.push(eye(head, P.iris, .16, .04, z * 1.04, .21, .19, -s * .22, 0));
    part(head, blob(.28, .07, .1, .8), COAT, .14, .18, z * .94, 0, -s * .2, .04);
    var ear = new T.Group(); ear.position.set(-.1, .15, z * .82); ear.rotation.set(s * 1.15, 0, .35); head.add(ear); ears.push(ear);
    part(ear, blob(.24, .48, .1, .75, function (x, y, zz, W, H) { var t = (y / H + 1) / 2; return [x * (1 - .75 * t * t), y, zz]; }), COAT, 0, .24, 0);
    part(ear, blob(.16, .36, .05, .78, function (x, y, zz, W, H) { var t = (y / H + 1) / 2; return [x * (1 - .8 * t * t), y, zz]; }), { c: P.earIn, noOcc: true }, 0, .23, s * .035);
  });
  // antlers: a crown fanned in the side plane, the beams sweeping back and up, the tines reaching forward,
  // green veins of light along the beams and a bloom of glowing leaves and buds on every tip
  var antlers = new T.Group(); antlers.position.set(-.04, .2, 0); antlers.scale.set(1, .62, .85); head.add(antlers);
  var BARK = { c: function (p, n) { return mix(P.bark, P.barkDark, sstep(.2, -.6, n.y)); }, m: 'flat' };
  var BEAM = [[0, 0, 0], [-.12, .3, .08], [-.3, .56, .14], [-.46, .8, .18], [-.5, 1.0, .2]];
  var TINES = [
    [[-.04, .12, .04], [.16, .22, .07], [.3, .36, .09]],
    [[-.17, .4, .1], [-.02, .6, .13], [.06, .78, .15]],
    [[-.36, .64, .15], [-.24, .86, .18], [-.2, 1.02, .2]],
    [[-.46, .82, .18], [-.68, .9, .2], [-.82, .9, .21]]
  ];
  var LEAF = [P.leaf, P.leafDark];
  [1, -1].forEach(function (s) {
    var A = new T.Group(); A.position.set(0, 0, .13 * s); A.rotation.y = -s * .12; antlers.add(A);
    function mz(pts) { return pts.map(function (q) { return [q[0], q[1], q[2] * s]; }); }
    part(A, lumpGeo(.075, s > 0 ? 3 : 4, 1), { c: P.barkDark, m: 'flat' }, 0, 0, 0);
    part(A, ttube(mz(BEAM), .07, .022, 7, 22), BARK);
    glow(A, ttube(mz(BEAM).slice(1).map(function (q) { return [q[0] + .03, q[1], q[2] + .045 * s]; }), .014, .006, 5, 18), P.bloom);
    TINES.forEach(function (tn) { part(A, ttube(mz(tn), .04, .015, 6, 12), BARK); });
    // the bloom: lit leaves round each tip, glowing leaves and a bud of light on it
    var q = rng(30 + s);
    mz(TINES.map(function (tn) { return tn[2]; }).concat([BEAM[4]])).forEach(function (tip, ti) {
      for (var i = 0; i < 6; i++) part(A, leafGeo(.26 + q() * .08, .13), { c: LEAF[i % 2], m: 'leaf', noOcc: true }, tip[0], tip[1] - .02, tip[2], q() * 6, q() * 6, q() * 6);
      for (var j = 0; j < 3; j++) {
        var lf = glow(A, leafGeo(.22 + q() * .06, .11), j ? P.bloom : P.deep, tip[0], tip[1], tip[2], (q() - .5) * 1.2, q() * 6, -.6 + j * .6 + (q() - .5) * .4);
        lf.material.side = T.DoubleSide;
      }
      glow(A, new T.IcosahedronGeometry(.06, 1), P.bud, tip[0] + .02, tip[1] + .03, tip[2]);
      if (ti === 1 || ti === 4) halo(A, P.bloom, .55, tip[0], tip[1] + .05, tip[2], .35);
    });
    part(A, lumpGeo(.06, 8 + s, 1), { c: P.moss, m: 'flat', noOcc: true }, -.2, .48, .12 * s);
  });
  halo(head, P.bloom, 2.4, -.25, .95, 0, .18);
  // the neck joint, where the neck meets the shoulders: it carries the head and everything gathered above
  var neck = new T.Group(); neck.position.set(.8, 1.86, 0); body.add(neck);
  hang(neck, onNeck.concat([head]));
  // drifting leaves of light and seeds rising round the crown: two instanced meshes, in the fx layer
  var fx = new T.Group(); fx.userData.noFit = true; head.add(fx);
  var LN = 12, lv = new T.InstancedMesh(leafGeo(.14, .075), glowMat('#ffffff'), LN), SN = 14, sd = new T.InstancedMesh(new T.IcosahedronGeometry(.024, 0), glowMat('#ffffff'), SN), ot = new T.Object3D();
  lv.material.side = T.DoubleSide;
  [lv, sd].forEach(function (im) { im.frustumCulled = false; im.userData.noFit = true; fx.add(im); });
  var orbit = [], seeds = [];
  for (var oi = 0; oi < LN; oi++) { orbit.push({ ph: oi / LN * Math.PI * 2, r: .75 + (oi % 4) * .1, h: .5 + (oi % 5) * .13 }); lv.setColorAt(oi, new T.Color(oi % 3 ? P.bloom : P.bud)); }
  for (var si = 0; si < SN; si++) { seeds.push({ ph: (si * .137) % 1, x: -.6 + (si % 7) * .13, z: ((si * 29) % 9 - 4) * .07, sp: .18 + (si % 4) * .05 }); sd.setColorAt(si, new T.Color(si % 3 ? P.bud : P.bloom)); }
  function placeFx(t) {
    orbit.forEach(function (o, i) {
      var a = t * .45 + o.ph;
      ot.position.set(Math.cos(a) * o.r - .2, o.h + Math.sin(a * 2 + o.ph) * .1, Math.sin(a) * o.r); ot.rotation.set(t * 1.2 + o.ph, -a, t * .8); ot.scale.setScalar(1); ot.updateMatrix();
      lv.setMatrixAt(i, ot.matrix);
    });
    seeds.forEach(function (e, i) {
      var k = (t * e.sp + e.ph) % 1;
      ot.position.set(e.x + Math.sin(t * 1.7 + e.ph * 9) * .08, .9 + k * 1.1, e.z); ot.rotation.set(0, 0, 0); ot.scale.setScalar(Math.sin(k * Math.PI)); ot.updateMatrix();
      sd.setMatrixAt(i, ot.matrix);
    });
    lv.instanceMatrix.needsUpdate = true; sd.instanceMatrix.needsUpdate = true;
  }
  placeFx(0);
  // the ultimate: a ring of thorns of light bursting from the ground at its forefeet, hidden until then
  var thorns = new T.Group(); thorns.position.set(1.5, 0, 0); root.add(thorns);
  var tq = rng(77);
  for (var th = 0; th < 11; th++) {
    var ta = th / 11 * Math.PI * 2, tr = .45 + tq() * .35, hgt = .7 + tq() * .7;
    var tm = glow(thorns, new T.ConeGeometry(.07, hgt, 5).translate(0, hgt / 2, 0), th % 3 ? P.bloom : P.bud, Math.cos(ta) * tr, 0, Math.sin(ta) * tr);
    tm.quaternion.setFromUnitVectors(UP, new T.Vector3(Math.cos(ta) * .35, 1, Math.sin(ta) * .35).normalize());
  }
  thorns.visible = false; thorns.traverse(function (o) { o.userData.noFit = true; o.userData.noMerge = true; });
  var light = new T.PointLight(0x8dff5a, 2.2, 3, 1.6); light.position.set(.6, 2.9, 0); body.add(light);
  finish(root, 3.0);
  return {
    root: root, head: head, name: 'thornstag', headView: { span: 2.8, up: .45, look: 0 },
    rig: makeRig({ plan: 'quadruped', body: body, neck: neck, head: head, jaw: jaw, ears: ears, tail: tailC.joints, legs: LEGS, extra: { antlers: chain([antlers]) } }),
    // it lowers its crown and charges, tossing the antlers up through the target
    clips: {
      attack: { tracks: {
        'head.pitch': [[0, 0], [.25, -.4], [.42, -.55], [.5, .3, 'in'], [.62, .1], [.85, 0]],
        'jaw.open': [[0, 0], [1, 0]]
      } },
      ultimate: { tracks: {
        'head.pitch': [[0, 0], [.35, .35], [.5, .3], [.62, -.5, 'in'], [.76, 0]],
        'jaw.open': [[0, 0], [.35, .25], [.6, 0], [1, 0]]
      } }
    },
    clipFx: function (name, k, clip) {
      if (name !== 'ultimate') { thorns.visible = false; return; }
      var g = sstep(clip.impact - .02, clip.impact + .06, k) * sstep(1, .8, k);
      thorns.visible = g > .01; thorns.scale.set(1, Math.max(.01, g), 1);
    },
    update: function (t) {
      var br = Math.sin(t * 1.8);
      body.position.y = br * .012; body.scale.set(1, 1 + br * .008, 1 + br * .01);
      head.rotation.z = -.12 + Math.sin(t * .9) * .04; head.rotation.y = Math.sin(t * .55) * .08;
      jaw.rotation.z = -.05 - (Math.sin(t * 1.1) * .5 + .5) * .015;
      var flick = (t % 3.9) < .25 ? Math.sin((t % 3.9) / .25 * Math.PI) * .35 : 0;
      ears[0].rotation.x = 1.15 + flick;
      antlers.rotation.x = Math.sin(t * .8) * .015;
      tailC.root.rotation.y = Math.sin(t * 1.9) * .22; tailC.root.rotation.z = Math.sin(t * 1.3) * .05;
      thorns.visible = false;
      placeFx(t);
      light.intensity = 2 + Math.sin(t * 1.4) * .4;
      var blink = ((t + 2.5) % 6.1) < .13 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
