import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { glowMat, halo } from '../kit/materials.js';
import { band, finish, glow, lock, onLimb, part, shard } from '../kit/parts.js';
import { hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// STONEMAUL: a huge bear in stone and iron, stone spires cracked with amber light along its hump, claws as weapons
// =====================================================================
export function stonemaul() {
  var P = {
    fur: C('#4f3828'), furDark: C('#2c1f17'), furLight: C('#7a5c44'), cream: C('#9c805f'), nose: C('#15100e'),
    stone: C('#5f626d'), stoneDark: C('#383a43'), iron: C('#3f434d'), steel: C('#d6dce6'),
    tooth: C('#f1e9d6'), gum: C('#5a1f22'), tongue: C('#c25f66'), scar: C('#d9bfa0'), earIn: C('#b58b6b'),
    eye: '#ffad33', rune: '#ffb347', runeDeep: '#c96a1a', runeCore: '#ffe0a0'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  function coat(p, n) { var c = mix(P.fur, P.furDark, sstep(.3, .9, n.y)); return mix(c, P.furLight, sstep(-.1, -.6, n.y) * .5); }
  var FUR = { c: coat }, LOCK = { c: coat, tip: P.furLight, tipAmt: .6, aoK: .4, noOcc: true };
  var STONE = { c: function (p, n) { return mix(P.stone, P.stoneDark, sstep(.2, -.6, n.y)); }, m: 'flat' };
  var IRON = { c: P.iron, m: 'metal' }, STEEL = { c: P.steel, m: 'metal', noAO: true, noOcc: true };
  var TOOTH = { c: P.tooth, m: 'gloss', noAO: true, noOcc: true };
  function gauss(x, c, w) { var d = (x - c) / w; return Math.exp(-d * d); }
  function backY(x) { var xn = x / 1.25; return 1.5 + .775 * (1 - .1 * xn * xn) + .3 * gauss(xn, .36, .24); }

  // body: a deep barrel, a great shoulder hump, a heavy rump
  part(body, blob(2.5, 1.55, 1.5, .85, function (x, y, z, W, H) {
    var xn = x / W;
    if (y > 0) y += .3 * gauss(xn, .36, .24) * (y / H); else y *= .88 - .18 * gauss(xn, -.3, .4);
    return [x, y, z * (.94 + .1 * (xn + 1) / 2)];
  }), FUR, 0, 1.5, 0);
  part(body, blob(1.1, 1.6, 1.5, .85), FUR, .8, 1.4, 0, 0, 0, -.1);
  part(body, blob(1.0, 1.0, 1.3, .85), FUR, .45, 2.0, 0);
  part(body, blob(1.2, 1.25, 1.4, .85), FUR, -.95, 1.35, 0);
  part(body, blob(.9, .9, 1.0, .85), FUR, 1.35, 1.7, 0);
  part(body, blob(.34, .34, .34, .9), FUR, -1.62, 1.5, 0);
  [1, -1].forEach(function (s) { part(body, blob(.85, 1.2, .7, .85), FUR, .7, 1.5, s * .7); part(body, blob(.6, .9, .5, .85), FUR, .38, 1.35, s * .88); });

  // front legs: pillars of muscle in stone gauntlets, with steel claws as long as a forearm
  // each leg is a chain of joints: the gauntlet rides the forearm, the paw and claws ride the end
  var LEGS = {};
  [1, -1].forEach(function (s) {
    var sh = [.7, 1.45, s * .74], el = [.55, .85, s * .84], wr = [.9, .34, s * .8];
    var front = limb(legs, [sh, el, wr], [[.46, .38], [.38, .3]], FUR), fore = [];
    hang(front.joints[1], part(legs, blob(.46, .46, .46, .9), FUR, el[0], el[1], el[2]));
    fore.push(onLimb(legs, blob(.6, .64, .62, .5), STONE, el, wr, .5), band(legs, IRON, el, wr, .12, .4, .1), band(legs, IRON, el, wr, .88, .33, .1));
    [.3, .55].forEach(function (f) {
      var px = el[0] + (wr[0] - el[0]) * f, py = el[1] + (wr[1] - el[1]) * f;
      fore.push(shard(legs, .06, .24, 5, IRON, [px, py + .06, s * (.84 + .32)], [.1, .35, s]));
    });
    fore.push(glow(legs, ttube([[.62, .78, s * 1.16], [.7, .62, s * 1.14], [.66, .5, s * 1.16], [.78, .38, s * 1.12]], .018, .011, 6, 16), P.rune));
    fore.push(lock(legs, LOCK, [.45, .9, s * .86], [-1, -.2, s * .1], [0, 1, s], .34, .24, .1, .06), lock(legs, LOCK, [.45, .7, s * .86], [-1, -.3, s * .1], [0, 1, s], .3, .22, .1, .06));
    hang(front.joints[1], fore);
    var paw = [part(legs, blob(.8, .3, .62, .75), FUR, 1.02, .15, s * .8)];
    [-.22, -.075, .075, .22].forEach(function (dz) {
      var zc = s * .8 + dz * .9;
      paw.push(part(legs, blob(.22, .17, .15, .8), FUR, 1.4, .1, zc), part(legs, ttube([[1.48, .12, zc], [1.74, .15, zc], [1.94, .04, zc]], .055, .006, 6, 12), STEEL));
    });
    hang(front.end, paw);
    LEGS[s > 0 ? 'fr' : 'fl'] = front;
    // pauldron
    part(body, blob(.72, .42, .66, .5), STONE, .62, 2.05, s * .76);
    [0, 1, 2].forEach(function (i) { shard(body, .08, .32, 5, IRON, [.4 + i * .22, 2.28, s * .74], [.1, 1, s * .4]); });
    // hind leg
    var hip = [-.95, 1.45, s * .7], kn = [-.55, .9, s * .82], hk = [-1.05, .45, s * .74];
    var back = limb(legs, [hip, kn, hk, [-.95, .14, s * .74]], [[.58, .4], [.38, .28], [.26, .22]], FUR);
    hang(back.joints[1], part(legs, blob(.5, .5, .5, .9), FUR, kn[0], kn[1], kn[2]));
    var bp = [part(legs, blob(.95, .2, .56, .8), FUR, -.65, .1, s * .74)];
    [-.2, -.07, .07, .2].forEach(function (dz) {
      var zc = s * .74 + dz * .9;
      bp.push(part(legs, blob(.16, .14, .12, .8), FUR, -.2, .08, zc), shard(legs, .035, .22, 5, STEEL, [-.12, .06, zc], [1, -.25, 0]));
    });
    hang(back.end, bp);
    LEGS[s > 0 ? 'br' : 'bl'] = back;
  });
  // stone plates down the hump, each with a line of rune light
  [[.62, -.1], [.2, 0], [-.26, .12]].forEach(function (pl) {
    var y = backY(pl[0]) - .02;
    part(body, blob(.55, .2, .9, .5), STONE, pl[0], y, 0, 0, 0, pl[1]);
    glow(body, ttube([[pl[0] - .1, y + .1, -.3], [pl[0], y + .11, -.1], [pl[0] - .08, y + .11, .1], [pl[0] + .02, y + .1, .3]], .014, .01, 6, 14), P.rune);
  });

  // stone spires along the hump, cracked with amber light: the shape that says Ground from the side
  [[.75, .5, -.25], [.45, .7, -.05], [.12, .62, .12], [-.2, .48, .25], [-.5, .36, .35]].forEach(function (q, i) {
    var y = backY(q[0]) - .05, h = q[1];
    var sp = part(body, new T.ConeGeometry(.2, h, 5).translate(0, h / 2, 0), STONE, q[0], y, (i % 2 ? .1 : -.1), 0, i * .7, q[2] + .35);
    glow(body, ttube([[q[0] - .02, y + .05, (i % 2 ? .1 : -.1) + .21], [q[0] - .1, y + h * .3, (i % 2 ? .1 : -.1) + .16], [q[0] - .14, y + h * .55, (i % 2 ? .1 : -.1) + .1]], .02, .008, 6, 10), P.rune);
    glow(body, new T.ConeGeometry(.06, h * 1.1, 5).translate(0, h * .55, 0), P.rune, q[0], y + .02, (i % 2 ? .1 : -.1), 0, i * .7, q[2] + .35, .95);
  });

  // head: heavy, lowered, roaring
  var head = new T.Group(); head.position.set(1.7, 1.95, 0); head.rotation.z = -.12; body.add(head);
  part(head, blob(1.0, .92, 1.0, .85), FUR, 0, 0, 0);
  part(head, blob(.85, .52, .62, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .2 * t), z * (1 - .3 * t)]; }), { c: function (p, n) { return mix(P.fur, P.cream, sstep(-.1, -.6, n.y) + sstep(.3, .8, n.x) * .5); } }, .62, -.2, 0);
  part(head, blob(.24, .17, .28, .75), { c: P.nose, m: 'gloss' }, 1.02, -.08, 0);
  var jaw = new T.Group(); jaw.position.set(.08, -.42, 0); jaw.rotation.z = -.55; head.add(jaw);
  part(jaw, blob(.95, .22, .5, .75, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .35 * t)]; }), { c: function (p, n) { return mix(P.fur, P.cream, sstep(.1, -.5, n.y)); } }, .5, -.08, 0);
  part(jaw, blob(.8, .05, .38, .8), { c: P.gum, noOcc: true }, .46, .03, 0);
  part(jaw, blob(.46, .07, .22, .9), { c: P.tongue, m: 'gloss', noOcc: true }, .4, .07, 0);
  part(head, blob(.8, .07, .42, .8), { c: P.gum, noOcc: true }, .6, -.46, 0);
  [.18, -.18].forEach(function (z) {
    shard(head, .085, .36, 6, TOOTH, [.72, -.46, z], [.1, -1, 0]);
    shard(jaw, .07, .28, 6, TOOTH, [.78, .03, z * .9], [-.1, 1, 0]);
    [.34, .48, .9].forEach(function (x) { shard(head, .035, .13, 5, TOOTH, [x, -.46, z * 1.15], [0, -1, 0]); });
    [.3, .44, .6].forEach(function (x) { shard(jaw, .032, .12, 5, TOOTH, [x, .03, z * 1.1], [0, 1, 0]); });
  });
  var eyes = [], ears = [];
  [.44, -.44].forEach(function (z) {
    part(head, blob(.5, .17, .25, .8), { c: P.furDark, noOcc: true }, .37, .28, z * .96, 0, z > 0 ? -.15 : .15, -.36);
    eyes.push(glow(head, blob(.21, .075, .06, .7), P.eye, .42, .13, z, 0, z > 0 ? -.3 : .3, -.25));
    halo(head, P.eye, .42, .45, .13, z * 1.08, .55);
    var ear = new T.Group(); ear.position.set(-.2, .48, z * .8); head.add(ear); ears.push(ear);
    part(ear, blob(.34, .34, .16, .85), FUR, 0, 0, 0);
    part(ear, blob(.2, .2, .08, .85), { c: P.earIn, noOcc: true }, .02, 0, z > 0 ? .04 : -.04);
  });

  // fur: a deep ruff, a ridge along the back
  var r = rng(31), onNeck = [head];
  [[1.2, .75, 14, .3], [.95, .8, 15, .26], [.7, .85, 15, .22]].forEach(function (ring, k) {
    for (var i = 0; i < ring[2]; i++) {
      var a = -Math.PI * .95 + (i / (ring[2] - 1)) * Math.PI * 1.9 + (r() - .5) * .1, cy = Math.cos(a), cz = Math.sin(a);
      (k < 1 ? onNeck : []).push(lock(body, LOCK, [ring[0] + (r() - .5) * .08, 1.8 + cy * ring[1] * .75 + (k === 0 ? .1 : k === 1 ? 0 : -.1), cz * ring[1]], [-1.4, cy * .3 + .02, cz * .25], [0, cy, cz], .3 + ring[3] + r() * .12, .3 + r() * .08, .13, .08 + r() * .05));
    }
  });
  for (var bx = .98; bx > -1.5; bx -= .2) {
    if (bx < .75 && bx > -.4) continue;
    lock(body, LOCK, [bx, backY(bx) - .06, (r() - .5) * .3], [-1, .35, 0], [0, 1, 0], .3 + r() * .1, .22, .12, .08);
  }
  // shaggy flanks and haunches, and tufts behind each elbow
  [1, -1].forEach(function (sd) {
    for (var fx = -1.15; fx <= 1.0; fx += .22) for (var fy = 0; fy < 3; fy++) {
      var yy = 1.0 + fy * .42 + (r() - .5) * .1, hw = .62 * Math.sqrt(Math.max(.1, 1 - Math.pow((yy - 1.45) / .85, 2)));
      lock(body, LOCK, [fx + (r() - .5) * .08, yy, sd * (hw * 1.15)], [-1, -.3 - fy * .1, sd * .12], [0, .3, sd], .36 + r() * .1, .26, .1, .06);
    }
  });
  var light = new T.PointLight(0xff9a3c, 2.4, 3.6, 1.6); light.position.set(.7, 1.9, 0); body.add(light);

  // motes of amber dust rising off the stone: one instanced mesh, and a warm haze close round the body
  var MN = 20, motes = new T.InstancedMesh(new T.IcosahedronGeometry(.035, 0), glowMat('#ffffff'), MN), mt = new T.Object3D(), ms = [];
  motes.frustumCulled = false; motes.userData.noFit = true; root.add(motes);
  for (var mi = 0; mi < MN; mi++) { ms.push({ ph: (mi * .137) % 1, sp: .18 + (mi % 5) * .04, rr: .8 + (mi % 6) * .3 }); motes.setColorAt(mi, new T.Color(mi % 3 ? P.rune : P.runeCore)); }
  function placeMotes(t) {
    ms.forEach(function (e, i) { var k = (t * e.sp + e.ph) % 1, an = e.ph * 20 + t * .4; mt.position.set(Math.cos(an) * e.rr * 1.3, .3 + k * 3, Math.sin(an) * e.rr); mt.scale.setScalar(Math.max(.01, 1 - k)); mt.updateMatrix(); motes.setMatrixAt(i, mt.matrix); });
    motes.instanceMatrix.needsUpdate = true;
  }
  placeMotes(0);
  halo(body, P.rune, 3.4, .5, 2.2, 0, .18);
  // the neck joint, where the neck meets the hump, carrying the head and the outer ruff
  var neck = new T.Group(); neck.position.set(1.2, 1.85, 0); body.add(neck);
  hang(neck, onNeck);

  finish(root, 2.8);
  return {
    root: root, head: head, name: 'stonemaul', headView: { span: 2.8, up: .35, look: -.05 },
    rig: makeRig({ plan: 'quadruped', body: body, neck: neck, head: head, jaw: jaw, ears: ears, legs: LEGS }),
    // it rears up roaring and brings both clawed forepaws down on the target
    clips: {
      attack: { tracks: {
        'body.pitch': [[0, 0], [.28, .32], [.42, .2], [.5, -.12, 'in'], [.62, 0]],
        'front.y': [[0, 0], [.28, 1.0], [.42, 1.1], [.5, 0, 'in']], 'front.x': [[0, 0], [.28, .2], [.42, .6], [.5, .7], [.6, 0]],
        'head.pitch': [[0, 0], [.3, .3], [.5, -.2], [.75, 0]], 'jaw.open': [[0, 0], [.3, .6], [.55, .6], [.8, 0]]
      } }
    },
    update: function (t) {
      var br = Math.sin(t * 1.5);
      body.position.y = br * .018; body.scale.set(1, 1 + br * .007, 1 + br * .01);
      head.rotation.z = -.12 + Math.sin(t * .9) * .04; head.rotation.y = Math.sin(t * .6) * .1;
      jaw.rotation.z = -.55 - (Math.sin(t * 1.5) * .5 + .5) * .08;
      ears[0].rotation.z = Math.sin(t * 3.1) * .08;
      placeMotes(t);
      light.intensity = 2.2 + Math.sin(t * 2.3) * .5;
      var blink = (t % 5.7) < .13 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
