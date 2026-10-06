import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, lumpGeo, ttube } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { band, finish, glow, lock, onLimb, part, seg, shard } from '../kit/parts.js';

// =====================================================================
// STONEMAUL: a huge bear in stone and iron, whose claws are its weapons
// =====================================================================
export function stonemaul() {
  var P = {
    fur: C('#6a4a36'), furDark: C('#3e2a20'), furLight: C('#9b7a5a'), cream: C('#c8aa84'), nose: C('#15100e'),
    stone: C('#7b7f8c'), stoneDark: C('#4b4e5a'), iron: C('#3f434d'), steel: C('#d6dce6'),
    tooth: C('#f1e9d6'), gum: C('#5a1f22'), tongue: C('#c25f66'), scar: C('#d9bfa0'), earIn: C('#b58b6b'),
    eye: '#ffad33', rune: '#ffb347'
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
  [1, -1].forEach(function (s) {
    var sh = [.7, 1.45, s * .74], el = [.55, .85, s * .84], wr = [.9, .34, s * .8];
    seg(legs, sh, el, .46, .38, FUR);
    seg(legs, el, wr, .38, .3, FUR);
    onLimb(legs, blob(.7, .78, .72, .5), STONE, el, wr, .5);
    band(legs, IRON, el, wr, .12, .4, .1);
    band(legs, IRON, el, wr, .88, .33, .1);
    [.3, .5, .7].forEach(function (f) {
      var px = el[0] + (wr[0] - el[0]) * f, py = el[1] + (wr[1] - el[1]) * f;
      shard(legs, .06, .26, 5, IRON, [px, py + .06, s * (.84 + .36)], [.1, .35, s]);
    });
    glow(legs, ttube([[.62, .78, s * 1.22], [.7, .62, s * 1.2], [.66, .5, s * 1.22], [.78, .38, s * 1.18]], .018, .011, 6, 16), P.rune);
    part(legs, blob(.8, .3, .62, .75), FUR, 1.02, .15, s * .8);
    [-.22, -.075, .075, .22].forEach(function (dz) {
      var zc = s * .8 + dz * .9;
      part(legs, blob(.22, .17, .15, .8), FUR, 1.4, .1, zc);
      part(legs, ttube([[1.48, .12, zc], [1.74, .15, zc], [1.94, .04, zc]], .055, .006, 6, 12), STEEL);
    });
    // pauldron
    part(body, blob(.95, .55, .85, .5), STONE, .62, 2.05, s * .74);
    [0, 1, 2].forEach(function (i) { shard(body, .08, .32, 5, IRON, [.4 + i * .22, 2.28, s * .74], [.1, 1, s * .4]); });
    // hind leg
    var hip = [-.95, 1.45, s * .7], kn = [-.55, .9, s * .82], hk = [-1.05, .45, s * .74];
    seg(legs, hip, kn, .58, .4, FUR);
    seg(legs, kn, hk, .38, .28, FUR);
    seg(legs, hk, [-.95, .14, s * .74], .26, .22, FUR);
    part(legs, blob(.95, .2, .56, .8), FUR, -.65, .1, s * .74);
    [-.2, -.07, .07, .2].forEach(function (dz) {
      var zc = s * .74 + dz * .9;
      part(legs, blob(.16, .14, .12, .8), FUR, -.2, .08, zc);
      shard(legs, .035, .22, 5, STEEL, [-.12, .06, zc], [1, -.25, 0]);
    });
  });
  // stone plates down the hump, each with a line of rune light
  [[.62, -.1], [.2, 0], [-.26, .12]].forEach(function (pl) {
    var y = backY(pl[0]) - .02;
    part(body, blob(.55, .2, .9, .5), STONE, pl[0], y, 0, 0, 0, pl[1]);
    glow(body, ttube([[pl[0] - .1, y + .1, -.3], [pl[0], y + .11, -.1], [pl[0] - .08, y + .11, .1], [pl[0] + .02, y + .1, .3]], .014, .01, 6, 14), P.rune);
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
    part(head, blob(.46, .15, .22, .8), { c: P.furDark, noOcc: true }, .36, .27, z * .96, 0, 0, -.3);
    eyes.push(glow(head, blob(.16, .09, .06, .7), P.eye, .39, .12, z, 0, z > 0 ? -.3 : .3, -.15));
    halo(head, P.eye, .3, .42, .12, z * 1.08, .5);
    var ear = new T.Group(); ear.position.set(-.2, .48, z * .8); head.add(ear); ears.push(ear);
    part(ear, blob(.34, .34, .16, .85), FUR, 0, 0, 0);
    part(ear, blob(.2, .2, .08, .85), { c: P.earIn, noOcc: true }, .02, 0, z > 0 ? .04 : -.04);
  });

  // fur: a deep ruff, a ridge along the back
  var r = rng(31);
  [[1.2, .75, 14, .3], [.95, .8, 15, .26], [.7, .85, 15, .22]].forEach(function (ring, k) {
    for (var i = 0; i < ring[2]; i++) {
      var a = -Math.PI * .95 + (i / (ring[2] - 1)) * Math.PI * 1.9 + (r() - .5) * .1, cy = Math.cos(a), cz = Math.sin(a);
      lock(body, LOCK, [ring[0] + (r() - .5) * .08, 1.8 + cy * ring[1] * .75 + (k === 0 ? .1 : k === 1 ? 0 : -.1), cz * ring[1]], [-1.4, cy * .3 + .02, cz * .25], [0, cy, cz], .3 + ring[3] + r() * .12, .3 + r() * .08, .13, .08 + r() * .05);
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
    lock(legs, LOCK, [.45, .9, sd * .86], [-1, -.2, sd * .1], [0, 1, sd], .34, .24, .1, .06);
    lock(legs, LOCK, [.45, .7, sd * .86], [-1, -.3, sd * .1], [0, 1, sd], .3, .22, .1, .06);
  });
  var light = new T.PointLight(0xff9a3c, 2.4, 3.6, 1.6); light.position.set(.7, 1.9, 0); body.add(light);

  // earth aura: two turning rings of rune light on the ground, rocks circling the bear, amber haze and rising motes
  var aura = new T.Group(); root.add(aura);
  function runering(rad) { var pts = []; for (var q = 0; q < 40; q++) { var an = q / 40 * Math.PI * 2; pts.push([Math.cos(an) * rad, .04, Math.sin(an) * rad]); } return ttube(pts, .028, .028, 6, 120, true); }
  var ringA = new T.Group(), ringB = new T.Group(); aura.add(ringA, ringB);
  glow(ringA, runering(2.4), P.rune, 0, 0, 0, 0, 0, 0, .6);
  glow(ringB, runering(3.0), P.rune, 0, 0, 0, 0, 0, 0, .38);
  for (var q = 0; q < 16; q++) { var an = q / 16 * Math.PI * 2; glow(ringA, new T.BoxGeometry(.3, .02, .07), P.rune, Math.cos(an) * 2.08, .04, Math.sin(an) * 2.08, 0, -an, 0, .6); }
  for (var q2 = 0; q2 < 12; q2++) { var an2 = (q2 + .5) / 12 * Math.PI * 2; glow(ringB, new T.BoxGeometry(.2, .02, .2), P.rune, Math.cos(an2) * 3.3, .04, Math.sin(an2) * 3.3, 0, -an2, 0, .45); }
  var rocks = new T.Group(); aura.add(rocks);
  var rockList = [];
  for (var ri = 0; ri < 9; ri++) rockList.push(part(rocks, lumpGeo(.15 + (ri % 3) * .06, ri * 3 + 1, 0), { c: P.stone, m: 'flat', noAO: true, noOcc: true }, 0, 0, 0));
  var motes = [];
  for (var mi = 0; mi < 30; mi++) motes.push({ m: glow(aura, new T.IcosahedronGeometry(.035, 0), P.rune), ph: (mi * .137) % 1, sp: .18 + (mi % 5) * .04, r: .8 + (mi % 7) * .4 });
  halo(root, P.rune, 7.5, 0, 1.3, 0, .16);
  halo(body, P.rune, 4.2, .6, 1.8, 0, .2);
  aura.traverse(function (o) { o.userData.noFit = true; });

  finish(root, 2.8);
  return {
    root: root, head: head, name: 'stonemaul', headView: { span: 2.8, up: .35, look: -.05 },
    update: function (t) {
      var br = Math.sin(t * 1.5);
      body.position.y = br * .018; body.scale.set(1, 1 + br * .007, 1 + br * .01);
      head.rotation.z = -.12 + Math.sin(t * .9) * .04; head.rotation.y = Math.sin(t * .6) * .1;
      jaw.rotation.z = -.55 - (Math.sin(t * 1.5) * .5 + .5) * .08;
      ears[0].rotation.z = Math.sin(t * 3.1) * .08;
      ringA.rotation.y = t * .25; ringB.rotation.y = -t * .18;
      rockList.forEach(function (rk, i) { var a = t * .3 + i * Math.PI * 2 / 9; rk.position.set(Math.cos(a) * 3.1, 1.1 + Math.sin(a * 2 + i) * .35, Math.sin(a) * 2.1); rk.rotation.set(t * .6 + i, t * .4, 0); });
      motes.forEach(function (m) { var k = (t * m.sp + m.ph) % 1, an = m.ph * 20 + t * .4; m.m.position.set(Math.cos(an) * m.r * 1.3, k * 3, Math.sin(an) * m.r); m.m.scale.setScalar(Math.max(.01, 1 - k)); });
      light.intensity = 2.2 + Math.sin(t * 2.3) * .5;
      var blink = (t % 5.7) < .13 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
