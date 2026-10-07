import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { glowMat, halo } from '../kit/materials.js';
import { eye, finish, glow, lock, part, shard } from '../kit/parts.js';
import { bind, hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// SUNMANE: a golden lion braced to pounce, its mane a corona of sunfire, claws out
// =====================================================================
export function lion() {
  var P = {
    coat: C('#c99a5c'), coatDark: C('#a87a44'), cream: C('#f3e4c6'), maneRoot: C('#66361a'), maneMid: C('#844822'), maneTip: C('#d08a3c'),
    nose: C('#5a3a30'), whisker: C('#7a5636'), claw: C('#f2ead6'), gum: C('#a8505c'), tongue: C('#e8808c'), tooth: C('#f4efe0'),
    iris: C('#d9861c'), sun: '#ffcf5a', sunDeep: '#ffb02e', sunCore: '#fff6d0'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  function gauss(x, c, w) { var d = (x - c) / w; return Math.exp(-d * d); }
  // coat: warm gold along the back, tawny on the flanks, a cream belly and throat
  function coat(p, n) { var c = mix(P.coat, P.coatDark, sstep(.15, .85, n.y) * .85); return mix(c, P.cream, sstep(-.15, -.7, n.y) * .8); }
  var FUR = { c: coat }, PAW = { c: function (p, n) { return mix(P.coat, P.coatDark, .35); } };
  var LOCK = { c: P.maneRoot, tip: P.maneTip, tipAmt: .5, aoK: .35, noOcc: true }, LOCKM = { c: P.maneMid, tip: P.maneTip, tipAmt: .5, aoK: .35, noOcc: true };
  var CLAW = { c: P.claw, m: 'gloss', noAO: true, noOcc: true }, TOOTH = { c: P.tooth, m: 'gloss', noAO: true, noOcc: true };
  function taper(x, y, z, W, H) { var k = .55 + .45 * ((y / H + 1) / 2); return [x * k, y, z * k]; }

  // body: a deep chest pushed forward, heavy shoulders, a tucked waist and strong haunches
  part(body, blob(2.2, 1.15, .98, .85, function (x, y, z, W) { var xn = x / W; if (y < 0) y *= 1 - .28 * gauss(xn, -.2, .4); return [x, y, z * (.9 + .1 * (xn + 1) / 2)]; }), FUR, 0, 1.5, 0);
  part(body, blob(1.08, 1.45, 1.12, .85), FUR, .8, 1.44, 0, 0, 0, -.12);
  part(body, blob(1.0, 1.12, 1.0, .85), FUR, -.85, 1.42, 0);
  [1, -1].forEach(function (s) {
    part(body, blob(.66, .95, .48, .85, taper), FUR, .74, 1.48, s * .46, 0, 0, -.1);
    part(body, blob(.8, .85, .42, .85), FUR, -.82, 1.3, s * .42, 0, 0, .12);
  });

  // legs: chains of joints with muscle at the top and a knob at each joint, so they bend without seams;
  // big paws with long claws out on the front feet
  var FRONT = [[.74, 1.38], [.68, .8], [.84, .3]], BACK = [[-.85, 1.38], [-.5, .85], [-.95, .4], [-.85, .13]], LEGS = {};
  function at(pts, z) { return pts.map(function (q) { return [q[0], q[1], z]; }); }
  [.48, -.48].forEach(function (z) {
    var front = limb(legs, at(FRONT, z), [[.3, .2], [.2, .16]], FUR), back = limb(legs, at(BACK, z), [[.42, .26], [.25, .16], [.16, .14]], FUR);
    hang(front.joints[1], part(legs, blob(.36, .36, .36, .9), FUR, FRONT[1][0], FRONT[1][1], z));
    hang(back.joints[1], part(legs, blob(.4, .4, .4, .9), FUR, BACK[1][0], BACK[1][1], z));
    hang(back.joints[2], part(legs, blob(.26, .26, .26, .9), FUR, BACK[2][0], BACK[2][1], z));
    var fp = [part(legs, blob(.62, .28, .52, .8), PAW, .98, .14, z)], bp = [part(legs, blob(.7, .22, .46, .8), PAW, -.62, .11, z)];
    [-.16, -.055, .055, .16].forEach(function (dz) {
      fp.push(part(legs, blob(.15, .13, .13, .85), PAW, 1.24, .09, z + dz), shard(legs, .036, .22, 5, CLAW, [1.3, .08, z + dz], [1, -.35, 0]));
      bp.push(part(legs, blob(.14, .11, .11, .85), PAW, -.3, .08, z + dz), shard(legs, .028, .13, 5, CLAW, [-.24, .06, z + dz], [1, -.3, 0]));
    });
    hang(front.end, fp); hang(back.end, bp);
    LEGS[z > 0 ? 'fr' : 'fl'] = front; LEGS[z > 0 ? 'br' : 'bl'] = back;   // +z is the lion's right
  });

  // head: heavy and low, a short broad muzzle, a jaw just open on two fangs, round amber eyes under a soft brow
  var head = new T.Group(); head.position.set(1.62, 2.02, 0); head.rotation.z = -.12; body.add(head);
  part(head, blob(.9, .8, .86, .85), FUR, 0, 0, 0);
  part(head, blob(.6, .46, .56, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .15 * t), z * (1 - .2 * t)]; }), { c: function (p, n) { return mix(mix(P.coat, P.coatDark, .2), P.cream, sstep(-.1, -.6, n.y) * .8); } }, .52, -.14, 0);
  part(head, blob(.24, .16, .3, .75), { c: P.nose, m: 'gloss' }, .85, -.02, 0);
  var jaw = new T.Group(); jaw.position.set(.15, -.34, 0); jaw.rotation.z = -.14; head.add(jaw);
  part(jaw, blob(.7, .2, .46, .75, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .3 * t)]; }), { c: function (p, n) { return mix(P.coat, P.cream, sstep(.1, -.5, n.y)); } }, .36, -.07, 0);
  part(jaw, blob(.58, .05, .34, .8), { c: P.gum, noOcc: true }, .34, .03, 0);
  part(jaw, blob(.36, .06, .2, .9), { c: P.tongue, m: 'gloss', noOcc: true }, .3, .07, 0);
  part(head, blob(.52, .06, .38, .8), { c: P.gum, noOcc: true }, .54, -.34, 0);
  [.17, -.17].forEach(function (z) {
    shard(head, .06, .2, 6, TOOTH, [.66, -.34, z], [.1, -1, 0]);
  });
  var eyes = [];
  [.35, -.35].forEach(function (z) {
    part(head, blob(.34, .08, .16, .8), FUR, .33, .33, z * .95, 0, z > 0 ? -.15 : .15, -.06);
    eyes.push(eye(head, P.iris, .37, .14, z * 1.0, .22, .2, z > 0 ? -.3 : .3, 0));
    for (var wi = 0; wi < 3; wi++) part(head, blob(.04, .04, .04, .9), { c: P.whisker, noOcc: true }, .62 + wi * .04, -.1 - wi * .045, z * .62);
  });

  // the mane: three rings of clumps round the head, each clump three locks swept back toward the shoulders,
  // warm brown at the root and honey at the tip, longest on the crest; a beard below the jaw. It rides on the neck,
  // with a corona of sun rays rising from its upper rim
  var onNeck = [head], r = rng(19), HC = [1.55, 2.04];
  [[1.48, .62, 9, .6], [1.3, .76, 10, .72], [1.1, .86, 10, .84]].forEach(function (ring, k) {
    for (var i = 0; i < ring[2]; i++) {
      var a0 = (i + (k % 2) * .5) / ring[2] * Math.PI * 2;
      for (var j = -1; j <= 1; j++) {
        var a = a0 + j * .13 + (r() - .5) * .06, cy = Math.cos(a), cz = Math.sin(a), up = Math.max(0, cy);
        var len = ring[3] * (1 + .3 * up) * (j ? .85 : 1) + r() * .1;
        onNeck.push(lock(body, j ? LOCKM : LOCK, [ring[0] + (r() - .5) * .06, HC[1] + cy * ring[1] * .9, cz * ring[1]], [-1.3 - .5 * up, cy * .6, cz * .6], [0, cy, cz], len, .3 + r() * .06, .13, .18 + r() * .05));
      }
    }
  });
  for (var bi = 0; bi < 6; bi++) onNeck.push(lock(body, LOCK, [1.55 - bi * .08, 1.6 + (bi % 2) * .06, (bi - 2.5) * .12], [-.25, -1, (bi - 2.5) * .12], [1, 0, 0], .5, .32, .13, .1));
  var corona = new T.Group(); corona.position.set(HC[0] - .05, HC[1] + .02, 0); body.add(corona); onNeck.push(corona);
  // the corona is a sunburst in the plane the battle camera sees: a thin arc of light just outside the mane, from
  // the brow over the crown to the nape, with long and short rays fanning out of it
  var UPV3 = new T.Vector3(0, 1, 0), CR = 1.12, arc = [];
  for (var ai = 0; ai <= 24; ai++) { var aa = 1.05 + ai / 24 * 2.3; arc.push([Math.cos(aa) * CR, Math.sin(aa) * CR, -.1]); }
  glow(corona, ttube(arc, .03, .03, 6, 60), P.sun);
  for (var ri = 0; ri < 11; ri++) {
    var ra = 1.12 + ri / 10 * 2.16, long = ri % 2 === 0, len = long ? .5 + .12 * Math.sin(ri / 10 * Math.PI) : .26, dir = new T.Vector3(Math.cos(ra), Math.sin(ra), 0);
    var bx = Math.cos(ra) * CR, by = Math.sin(ra) * CR;
    glow(corona, new T.ConeGeometry(long ? .075 : .055, len, 5).translate(0, len / 2, 0), P.sunDeep, bx, by, -.1).quaternion.setFromUnitVectors(UPV3, dir);
    glow(corona, new T.ConeGeometry(long ? .035 : .025, len * .85, 5).translate(0, len * .42, 0), P.sunCore, bx, by, -.08).quaternion.setFromUnitVectors(UPV3, dir);
  }
  onNeck.push(halo(body, P.sun, 2.8, 1.3, 2.15, 0, .2));
  // a shoulder cape of mane locks along the spine
  for (var ci = 0; ci < 10; ci++) lock(body, LOCK, [.95 - ci * .1, 2.0 - ci * .03, (r() - .5) * .5], [-1, -.3, 0], [0, 1, 0], .42 + r() * .1, .34, .12, .1);

  // sun glyphs burning under the coat on each shoulder and flank
  var GLYPHS = [[[.95, 1.7, .5], [.82, 1.5, .56], [.9, 1.3, .56], [.78, 1.1, .5]], [[.55, 1.75, .47], [.45, 1.55, .5], [.52, 1.35, .5]], [[-.6, 1.65, .5], [-.72, 1.45, .52], [-.62, 1.25, .5]]];
  GLYPHS.forEach(function (v) { [1, -1].forEach(function (s) { glow(body, ttube(v.map(function (q) { return [q[0], q[1], q[2] * s]; }), .022, .008, 6, 14), P.sun); }); });

  // tail: a chain of joints ending in a brown tuft with a spark of sun in it
  var tailC = limb(body, [[-1.3, 1.55, 0], [-1.75, 1.55, 0], [-2.15, 1.36, 0], [-2.4, 1.06, 0], [-2.5, .76, 0]], [[.11, .1], [.1, .085], [.085, .075], [.075, .07]], FUR), tail = tailC.root;
  var tufts = [];
  for (var ti = 0; ti < 8; ti++) { var ta = ti / 8 * Math.PI * 2; tufts.push(lock(body, LOCK, [-2.5, .78, 0], [Math.cos(ta) * .3, -1, Math.sin(ta) * .3], [Math.cos(ta), 0, Math.sin(ta)], .4, .26, .12, .1)); }
  tufts.push(glow(body, new T.OctahedronGeometry(.09, 0), P.sunCore, -2.52, .7, 0), halo(body, P.sun, .7, -2.52, .7, 0, .45));
  bind(tailC, tufts);

  // the strike: three golden slashes beside the right forepaw, dark until the attack lands (clipFx below)
  var slashes = [];
  [[1.25, 1.34, -1.25, 1.2], [1.45, 1.55, -1.05, 1.1], [1.65, 1.72, -.9, .95]].forEach(function (q) {
    var m = glow(body, new T.RingGeometry(q[0], q[1], 28, 1, q[2], q[3]), P.sun, 1.3, 1.6, .75, 0, 0, 0, 0);
    m.material.side = T.DoubleSide; m.userData.noFit = true; m.userData.noMerge = true; m.visible = false; slashes.push(m);
  });
  // motes of sunlight drifting up round it: one instanced mesh
  var MN = 24, motes = new T.InstancedMesh(new T.IcosahedronGeometry(.03, 0), glowMat('#ffffff'), MN), mt = new T.Object3D(), ms = [];
  motes.frustumCulled = false; motes.userData.noFit = true; root.add(motes);
  for (var mi = 0; mi < MN; mi++) { ms.push({ ph: (mi * .137) % 1, sp: .15 + (mi % 5) * .04, r: .9 + (mi % 6) * .26 }); motes.setColorAt(mi, new T.Color(mi % 3 ? P.sun : P.sunCore)); }
  function placeMotes(t) {
    ms.forEach(function (e, i) { var kk = (t * e.sp + e.ph) % 1, an = e.ph * 20 + t * .4; mt.position.set(.6 + Math.cos(an) * e.r, 1.2 + kk * 2.4, Math.sin(an) * e.r); mt.scale.setScalar(Math.max(.01, 1 - kk)); mt.updateMatrix(); motes.setMatrixAt(i, mt.matrix); });
    motes.instanceMatrix.needsUpdate = true;
  }
  placeMotes(0);
  var light = new T.PointLight(0xffb84a, 2.6, 4, 1.6); light.position.set(1.7, 2.1, 0); body.add(light);

  // the neck joint, where the neck meets the shoulders: it carries the head, the mane and the corona
  part(body, blob(.8, 1.0, .85, .85), FUR, 1.25, 1.8, 0, 0, 0, -.5);
  var neck = new T.Group(); neck.position.set(1.1, 1.85, 0); body.add(neck);
  hang(neck, onNeck);

  finish(root, 3.4);
  return {
    root: root, head: head, name: 'lion', headView: { span: 3.2, up: .35, look: 0 },
    rig: makeRig({ plan: 'quadruped', body: body, neck: neck, head: head, jaw: jaw, tail: tailC.joints, legs: LEGS }),
    // the attack is a rearing swipe of the right forepaw that lands as the slashes flare
    clips: {
      attack: { tracks: {
        'body.pitch': [[0, 0], [.28, .22], [.42, .12], [.5, -.15], [.62, .04], [.85, 0]],
        'head.pitch': [[0, 0], [.28, .2], [.45, -.05], [.52, -.2], [.8, 0]],
        'jaw.open': [[0, 0], [.28, .45], [.5, .6], [.7, .2], [.9, 0]],
        'fr.x': [[0, 0], [.28, .3], [.42, .7], [.5, .55, 'in'], [.58, 0]],
        'fr.y': [[0, 0], [.28, .95], [.42, 1.05], [.5, .2, 'in'], [.58, 0]]
      } }
    },
    clipFx: function (name, k, clip) {
      var hit = name === 'attack' || name === 'ultimate' ? clip.impact : -1;
      slashes.forEach(function (m, i) {
        var d = hit < 0 ? 1 : Math.abs(k - hit - .02 - i * .015) / .07, op = Math.max(0, 1 - d) * .75;
        m.material.opacity = op; m.visible = op > .01;
      });
    },
    update: function (t) {
      var br = Math.sin(t * 1.5);
      body.position.y = br * .015; body.scale.set(1, 1 + br * .006, 1 + br * .009);
      head.rotation.z = -.12 + Math.sin(t * .8) * .03; head.rotation.y = Math.sin(t * .55) * .08;
      jaw.rotation.z = -.14 - (Math.sin(t * 1.5) * .5 + .5) * .08;
      tail.rotation.y = Math.sin(t * 1.3) * .22; tail.rotation.z = Math.sin(t * .9) * .05;
      corona.scale.setScalar(1 + Math.sin(t * 2.3) * .04); corona.rotation.x = Math.sin(t * .6) * .05;
      slashes.forEach(function (m) { m.visible = false; });
      placeMotes(t);
      light.intensity = 2.4 + Math.sin(t * 2.1) * .4;
      var blink = ((t + 2.5) % 5.3) < .13 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
