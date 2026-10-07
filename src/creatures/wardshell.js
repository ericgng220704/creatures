import * as T from 'three';
import { C, mix, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { glowMat, halo } from '../kit/materials.js';
import { band, finish, glow, onLimb, part, plateGeo, shard } from '../kit/parts.js';
import { hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// WARDSHELL: a deep-sea tortoise, its domed shell crested with breaking waves, its wards rising when it is struck
// =====================================================================
// a hexagonal cell grid on the x-z plane: the cell's id, and d, 0 at its centre to 1 at its edge
function hexCell(x, z, size) {
  var xx = (Math.sqrt(3) / 3 * x - z / 3) / size, zz = (2 / 3 * z) / size, yy = -xx - zz;
  var rx = Math.round(xx), ry = Math.round(yy), rz = Math.round(zz);
  var dx = Math.abs(rx - xx), dy = Math.abs(ry - yy), dz = Math.abs(rz - zz);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  var vx = x - size * Math.sqrt(3) * (rx + rz / 2), vz = z - size * 1.5 * rz, A = size * Math.sqrt(3) / 2;
  var d = Math.max(Math.abs(vx), Math.abs(vx * .5 + vz * .866), Math.abs(-vx * .5 + vz * .866)) / A;
  return { d: d, id: Math.abs(rx * 7 + rz * 13) };
}
export function wardshell() {
  var P = {
    shell: C('#2c4f4c'), shellDark: C('#142826'), shellLight: C('#4f7a70'), groove: C('#0b1a1a'),
    gold: C('#d9ab3d'), skin: C('#4a5548'), skinDark: C('#2e382f'), plastron: C('#8f8a70'),
    stone: C('#56605e'), stoneDark: C('#323a39'), nail: C('#d8d0b8'), beak: C('#3a352a'),
    eye: '#ffd75a', water: '#0099ff', waterMid: '#3fd2ff', waterCore: '#c9fbff'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  var SW = 3.1, SH = 2.2, SD = 2.6, SE = .78, CY = 1.2, HEX = .5;
  function shellY(x, z) { var u = Math.pow(Math.abs(x) / (SW / 2), 2 / SE) + Math.pow(Math.abs(z) / (SD / 2), 2 / SE); return CY + (SH / 2) * Math.pow(Math.max(0, 1 - u), SE / 2); }
  function shellCol(p, n) {
    var c = hexCell(p.x, p.z, HEX), g = sstep(.76, 1.0, c.d), h = ((c.id * 9301 + 49297) % 233280) / 233280;
    var base = mix(P.shell, P.shellLight, h * .45 + sstep(1, 0, c.d) * .2);
    base = mix(base, P.shellDark, sstep(.25, -.6, n.y) * .6);
    return mix(base, P.groove, g * .9);
  }
  var SKIN = { c: function (p, n) { return mix(P.skin, P.skinDark, sstep(.2, -.5, n.y) * .6 + sstep(.4, .9, n.y) * .2); } };
  var STONE = { c: function (p, n) { return mix(P.stone, P.stoneDark, sstep(.2, -.6, n.y)); }, m: 'flat' };
  var FIN = { c: function (p, n) { return mix(P.shell, P.shellDark, sstep(2.4, 3.1, p.y) * .5 + sstep(.2, -.6, n.y) * .4); }, m: 'flat' };
  var GOLD = { c: P.gold, m: 'metal' }, NAIL = { c: P.nail, m: 'gloss', noAO: true, noOcc: true };

  // the shell: a high dome of raised hexagonal plates with sunken seams, over a pale underplate
  part(body, blob(SW, SH, SD, SE, function (x, y, z, W, H) {
    if (y < 0) return [x, y * .25, z];
    var c = hexCell(x, z, HEX), g = sstep(.78, 1.0, c.d), tt = y / H;
    return [x, y + tt * (.07 * (1 - c.d * c.d * .6) - .08 * g), z];
  }, 128, 76), { c: shellCol }, 0, CY, 0);
  part(body, blob(2.8, .5, 2.2, .7), { c: P.plastron }, 0, .9, 0);
  // a gold rim with stone spikes round the edge, and a line of water light rippling just above it
  var rim = [], ripple = [];
  for (var a = 0; a < 32; a++) { var an = a / 32 * Math.PI * 2; rim.push([Math.cos(an) * 1.56, 1.18, Math.sin(an) * 1.32]); }
  for (var a2 = 0; a2 < 96; a2++) { var an2 = a2 / 96 * Math.PI * 2; ripple.push([Math.cos(an2) * 1.53, 1.42 + Math.sin(an2 * 10) * .06, Math.sin(an2) * 1.29]); }
  part(body, ttube(rim, .1, .1, 8, 128, true), GOLD);
  glow(body, ttube(ripple, .02, .02, 6, 240, true), P.waterMid);
  for (var k = 0; k < 12; k++) {
    var ak = (k + .5) / 12 * Math.PI * 2, ck = Math.cos(ak), sk = Math.sin(ak);
    if (Math.abs(ck) > .9) continue;
    shard(body, .085, .3, 5, STONE, [ck * 1.58, 1.24, sk * 1.34], [ck, .55, sk], k);
  }
  // the crest: four breaking waves along the spine of the shell, each a dark fin with a crest of glowing water,
  // drawn in the plane the camera sees so the top line says Water
  var WAVE = [[-.32, 0], [-.26, .3], [-.14, .58], [.04, .8], [.24, .86], [.4, .76], [.42, .6], [.3, .54], [.2, .6], [.14, .5], [.24, .3], [.32, 0]];
  var EDGE = [[-.32, 0], [-.26, .3], [-.14, .58], [.04, .8], [.24, .86], [.4, .76], [.42, .6]];
  [[.75, .78], [.2, 1.0], [-.38, .86], [-.9, .62]].forEach(function (w) {
    var x = w[0], sc = w[1], y = shellY(x, 0) - .12;
    part(body, plateGeo(WAVE.map(function (q) { return [q[0] * sc, q[1] * sc]; }), .12, .02), FIN, x, y, 0);
    glow(body, ttube(EDGE.map(function (q) { return [x + q[0] * sc, y + q[1] * sc + .02, .07]; }), .03, .018, 6, 20), P.waterMid);
    glow(body, ttube(EDGE.map(function (q) { return [x + q[0] * sc, y + q[1] * sc + .02, -.07]; }), .03, .018, 6, 20), P.waterMid);
  });
  halo(body, P.water, 3.0, 0, 2.7, 0, .2);

  // four pillar legs, each a chain hip > knee > foot, in stone shin plates and gold bands, with blunt nails
  var LEGS = {};
  [[1.05, 1], [1.05, -1], [-1.05, 1], [-1.05, -1]].forEach(function (l) {
    var x = l[0], s = l[1], front = x > 0, top = [x, 1.05, s * .9], kn = [x + .06, .62, s * .95], bot = [x + (front ? .12 : .05), .2, s * .97];
    var leg = limb(legs, [top, kn, bot], [[front ? .48 : .52, .44], [.44, .38]], SKIN);
    var pl = onLimb(legs, blob(.48, .5, .2, .55), STONE, kn, bot, .45); pl.position.add(new T.Vector3(.04, 0, s * .34));
    hang(leg.joints[1], [part(legs, blob(.5, .5, .5, .9), SKIN, kn[0], kn[1], kn[2]), pl, band(legs, GOLD, kn, bot, .8, .4, .13)]);
    var ft = [part(legs, blob(.76, .26, .66, .8), SKIN, bot[0] + .12, .13, bot[2])];
    [-.2, -.07, .07, .2].forEach(function (dz) { ft.push(shard(legs, .05, .16, 5, NAIL, [bot[0] + .5, .09, bot[2] + dz * 1.2], [1, -.1, dz * .8])); });
    hang(leg.end, ft);
    LEGS[(front ? 'f' : 'b') + (s > 0 ? 'r' : 'l')] = leg;
  });
  // tail: a short chain tipped with a stone spike
  var tailC = limb(body, [[-1.45, .95, 0], [-1.85, .78, 0], [-2.1, .62, 0]], [[.26, .18], [.18, .1]], SKIN);
  hang(tailC.end, shard(body, .08, .24, 5, STONE, [-2.08, .62, 0], [-1, .2, 0]));

  // the neck: a chain that can reach out and draw back, with a gold collar at its root
  var neckC = limb(body, [[1.2, 1.05, 0], [1.62, 1.22, 0], [2.02, 1.34, 0]], [[.54, .48], [.48, .44]], SKIN, .9);
  hang(neckC.root, band(body, GOLD, [1.2, 1.05, 0], [1.62, 1.22, 0], .35, .54, .18));
  // the head: big and heavy, stern brow scutes over amber eyes, a hooked beak with a jaw that snaps, a water gem
  var HEADSKIN = { c: function (p, n) { var c = mix(P.skin, P.skinDark, sstep(.5, .95, n.y) * .3); return mix(c, P.plastron, sstep(-.2, -.8, n.y) * .5); } };
  var head = new T.Group(); head.position.set(.2, .02, 0); head.rotation.z = -.04; neckC.end.add(head);
  part(head, blob(.98, .86, .86, .9), HEADSKIN, 0, .03, 0);
  part(head, blob(.5, .44, .58, .85, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .25 * t), z * (1 - .3 * t)]; }), HEADSKIN, .42, -.1, 0);
  part(head, blob(.36, .26, .4, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y - .1 * t * t + .02, z * (1 - .5 * t)]; }), { c: P.beak, m: 'gloss' }, .72, -.06, 0);
  var jaw = new T.Group(); jaw.position.set(.34, -.22, 0); head.add(jaw);
  part(jaw, blob(.5, .12, .36, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .5 * t)]; }), { c: P.beak, m: 'gloss' }, .34, -.02, 0);
  var eyes = [];
  [.33, -.33].forEach(function (z) {
    part(head, blob(.42, .16, .26, .6), STONE, .3, .25, z * .95, 0, z > 0 ? -.2 : .2, -.32);
    eyes.push(glow(head, blob(.2, .1, .07, .8), P.eye, .36, .12, z * 1.04, 0, z > 0 ? -.3 : .3, -.18));
    halo(head, P.eye, .4, .4, .12, z * 1.1, .45);
  });
  part(head, blob(.3, .12, .2, .6), STONE, .1, .42, 0);
  glow(head, new T.IcosahedronGeometry(.08, 1), P.waterMid, .3, .42, 0);

  // wards: six shields of water light, hidden at rest, rising round it when it is struck or calls them up
  var wards = new T.Group(); wards.position.set(0, 1.4, 0); root.add(wards);
  var shield = [[0, .44], [.3, .3], [.3, -.06], [0, -.46], [-.3, -.06], [-.3, .3]].map(function (q) { return [q[0] * .8, q[1] * .8]; });
  var wg = [];
  for (var wi = 0; wi < 6; wi++) {
    var g2 = new T.Group(); wards.add(g2);
    var rimM = glow(g2, plateGeo(shield, .06, .02), P.waterCore, 0, 0, 0, 0, 0, 0, 0), inM = glow(g2, plateGeo(shield.map(function (q) { return [q[0] * .78, q[1] * .78]; }), .08, 0), P.water, 0, 0, 0, 0, 0, 0, 0);
    [rimM, inM].forEach(function (m) { m.userData.noMerge = true; });
    wg.push({ g: g2, m: [rimM, inM] });
  }
  wards.visible = false; wards.traverse(function (o) { o.userData.noFit = true; o.userData.noMerge = true; });
  function placeWards(spin, op) {
    wards.visible = op > .01;
    wg.forEach(function (w, i) {
      var a = spin + i * Math.PI / 3, nx = Math.cos(a) / 2.5, nz = Math.sin(a) / 2.0;
      w.g.position.set(Math.cos(a) * 2.5, Math.sin(a * 2 + i) * .2, Math.sin(a) * 2.0);
      w.g.rotation.y = Math.PI / 2 - Math.atan2(nz, nx);
      w.m[0].material.opacity = op * .9; w.m[1].material.opacity = op * .55;
    });
  }
  // bubbles of light drifting up off the shell: one instanced mesh
  var MN = 16, bub = new T.InstancedMesh(new T.IcosahedronGeometry(.04, 1), glowMat('#ffffff'), MN), bt = new T.Object3D(), bs = [];
  bub.frustumCulled = false; bub.userData.noFit = true; root.add(bub);
  for (var bi = 0; bi < MN; bi++) { bs.push({ ph: (bi * .137) % 1, x: -1.2 + (bi % 6) * .45, z: ((bi * 29) % 9 - 4) * .25, sp: .14 + (bi % 4) * .04 }); bub.setColorAt(bi, new T.Color(bi % 3 ? P.waterMid : P.waterCore)); }
  function placeBubbles(t) {
    bs.forEach(function (e, i) { var k = (t * e.sp + e.ph) % 1; bt.position.set(e.x + Math.sin(t * 2 + e.ph * 9) * .08, 1.6 + k * 2.2, e.z); bt.scale.setScalar(Math.sin(k * Math.PI)); bt.updateMatrix(); bub.setMatrixAt(i, bt.matrix); });
    bub.instanceMatrix.needsUpdate = true;
  }
  placeBubbles(0);
  var light = new T.PointLight(0x3fd2ff, 2, 3.6, 1.6); light.position.set(0, 3.0, 0); body.add(light);

  finish(root, 3.2);
  return {
    root: root, head: head, name: 'wardshell', headView: { span: 2.6, up: .3, look: 0 },
    rig: makeRig({ plan: 'quadruped', body: body, neck: neckC.root, head: head, jaw: jaw, tail: tailC.joints, legs: LEGS, extra: { neck: neckC } }),
    // a tank's strike: the neck draws back, then shoots out and the beak snaps shut on the target
    clips: {
      attack: { tracks: {
        'neck.pitch': [[0, 0], [.25, .3], [.45, -.25], [.6, 0]],
        'head.pitch': [[0, 0], [.25, .25], [.45, -.2], [.6, 0]],
        'jaw.open': [[0, 0], [.3, .75], [.47, 0, 'in'], [.6, .2], [.85, 0]],
        'body.pitch': [[0, 0], [.25, .06], [.45, -.06], [.7, 0]]
      } }
    },
    clipFx: function (name, k) {
      if (name === 'hit') placeWards(k * 2.5, Math.sin(Math.min(1, k * 1.4) * Math.PI));
      else if (name === 'ultimate') placeWards(k * 6, sstep(0, .2, k) * sstep(1, .8, k));
      else placeWards(0, 0);
    },
    update: function (t) {
      var br = Math.sin(t * 1.2);
      body.position.y = br * .012; body.scale.set(1, 1 + br * .006, 1 + br * .008);
      head.rotation.y = Math.sin(t * .5) * .1; head.rotation.z = -.04 + Math.sin(t * .8) * .03;
      jaw.rotation.z = -(Math.sin(t * 1.2) * .5 + .5) * .05;
      wards.visible = false;
      placeBubbles(t);
      light.intensity = 1.8 + Math.sin(t * 2.2) * .4;
      var blink = (t % 6.3) < .15 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
