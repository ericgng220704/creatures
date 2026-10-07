import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { glowMat, halo } from '../kit/materials.js';
import { feather, finish, glow, part } from '../kit/parts.js';
import { chain, hang, limb, makeRig } from '../kit/rig.js';

// =====================================================================
// DUSKSEER: a horned owl of the night, stern under a V brow, a crest of shadow quills burning violet
// =====================================================================
export function owl() {
  var P = {
    plum: C('#3a3150'), dark: C('#221c30'), bar: C('#16111f'), chest: C('#857b98'), disc: C('#a99fba'), discDark: C('#5d5372'),
    brow: C('#17121f'), beak: C('#2b2530'), leg: C('#6e6488'), talon: C('#1c1820'),
    eye: '#ffb52e', deep: '#5a2bbf', mid: '#a58cff', core: '#e6dcff'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  var UPV = [0, 1, 0], r = rng(41);
  // plumage: near-black indigo on the back, a muted lavender breast
  function plum(p, n) { var c = mix(P.plum, P.dark, sstep(.1, .8, n.y) * .7); return mix(c, P.chest, sstep(.35, .9, n.x) * .55 * sstep(1.0, 1.6, p.y)); }
  var BODYL = { c: plum };
  var CHEST = { m: 'plume', g: [C('#5f5674'), C('#8a80a0'), C('#2c2440')], noOcc: true, aoK: .3 };
  var WING = { m: 'plume', g: [C('#1d1729'), C('#3a3150'), C('#16111f')], noOcc: true, aoK: .3 };
  var WINGC = { m: 'plume', g: [C('#3a3150'), C('#56496e'), C('#8d84a0')], noOcc: true, aoK: .3 };
  var TUFT = { m: 'plume', g: [C('#16111f'), C('#2c2440'), C('#4a3e66')], noOcc: true, aoK: .3 };
  var LEGL = { c: function (p, n) { return mix(P.leg, P.dark, sstep(.2, -.5, n.y) * .4); } }, CLAW = { c: P.talon, m: 'gloss', noAO: true, noOcc: true };

  // body: upright and broad in the shoulder, a breast of barred scale-feathers, fluffed thighs
  part(body, blob(1.12, 1.55, 1.0, .88, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x * (.82 + .3 * t), y, z * (.84 + .24 * t)]; }), BODYL, 0, 1.5, 0);
  for (var row = 0; row < 5; row++) for (var c = -3; c <= 3; c++) {
    var zz = c * .115 + (row % 2 ? .055 : 0), yy = 2.0 - row * .25, xx = Math.sqrt(Math.max(.01, .27 - zz * zz * .8)) + .14;
    feather(body, CHEST, [xx, yy, zz], [.15, -1, zz * .6], [1, 0, 0], .34, .17, .12);
  }
  [1, -1].forEach(function (s) { part(body, blob(.55, .6, .45, .85), BODYL, .02, .92, s * .24); });

  // wings folded down the sides, each on a shoulder joint so it can flare open; crescent sigils and violet runes
  // on the outer face, where the battle camera sees them
  var WINGS = {};
  [1, -1].forEach(function (s) {
    var wg = new T.Group(); wg.position.set(-.08, 2.0, s * .44); body.add(wg);
    var parts = [part(body, blob(.36, 1.25, .5, .85, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x, y, z * (1 - .5 * (1 - t))]; }), BODYL, -.18, 1.45, s * .52, 0, 0, -.06)];
    for (var wr = 0; wr < 3; wr++) for (var wc = 0; wc < 6; wc++) parts.push(feather(body, wr === 2 ? WINGC : WING, [-.2 - wr * .03, 1.95 - wr * .3, s * (.36 + wc * .06)], [-.12, -1, s * .1], [1, 0, 0], .58 - wr * .03, .2, .14));
    for (var tf = 0; tf < 3; tf++) parts.push(feather(body, WING, [-.3, .8, s * (.12 + tf * .12)], [-.3, -1, s * .2], [1, 0, 0], .75, .22, .1));
    // a crescent of violet light on the folded wing, and two rune lines running down it
    var cs = new T.Shape(); cs.absarc(0, 0, .2, 1.04, Math.PI * 2 - 1.04, false); cs.absarc(.09, 0, .17, Math.PI * 2 - 1.5, 1.5, true);
    var cres = glow(body, new T.ShapeGeometry(cs, 16), P.mid, -.2, 1.55, s * .79, 0, s > 0 ? 0 : Math.PI, .4); parts.push(cres);
    parts.push(glow(body, ttube([[-.08, 1.95, s * .78], [-.2, 1.75, s * .8], [-.14, 1.32, s * .79], [-.28, 1.05, s * .74]], .016, .006, 6, 14), P.mid));
    hang(wg, parts);
    WINGS[s > 0 ? 'r' : 'l'] = chain([wg]);
  });

  // legs: short and feathered, each a chain hip > knee > ankle, three hooked talons forward and one back
  var LEGS = {};
  [.24, -.24].forEach(function (z) {
    var leg = limb(legs, [[.04, .95, z], [.16, .55, z], [.1, .18, z]], [[.16, .12], [.09, .075]], LEGL), tal = [];
    [[.36, .12], [.34, -.02], [.3, -.14], [-.24, 0]].forEach(function (d) {
      var tip = [.1 + d[0], .06, z + d[1]], fw = d[0] > 0 ? 1 : -1;
      tal.push(part(legs, ttube([[.1, .14, z], [.1 + d[0] * .55, .09, z + d[1] * .6], tip], .05, .035, 6, 8), LEGL));
      tal.push(part(legs, ttube([tip, [tip[0] + fw * .08, tip[1] - .02, tip[2]], [tip[0] + fw * .1, tip[1] - .1, tip[2]]], .032, .006, 6, 8), CLAW));
    });
    hang(leg.end, tal);
    LEGS[z > 0 ? 'r' : 'l'] = leg;
  });

  // head: wide and round with a pale heart-shaped disc, a stern V brow over amber eyes, a hooked beak that can
  // open, and tall ear tufts tipped with violet; a crest of shadow quills fans back from the crown
  // the head rests turned a quarter toward the camera's side (+z), as an owl's does, so its face reads in battle
  var head = new T.Group(); head.position.set(.14, 2.32, 0); head.rotation.y = -.45; body.add(head);
  part(head, blob(1.1, .9, 1.1, .9), BODYL, 0, 0, 0);
  var eyes = [];
  [1, -1].forEach(function (s) {
    part(head, blob(.16, .7, .5, .9), { c: function (p, n) { return mix(P.disc, P.discDark, sstep(.1, .6, Math.abs(p.z) - .1)); } }, .5, -.04, s * .27, 0, s * .12, 0);
    part(head, blob(.5, .12, .26, .8), { c: P.brow, noOcc: true }, .52, .2, s * .24, s > 0 ? .3 : -.3, s * -.35, -.38);
    var ey = glow(head, new T.SphereGeometry(.17, 18, 14), P.eye, .55, .02, s * .27); ey.scale.x = .55; eyes.push(ey);
    part(head, new T.SphereGeometry(.075, 12, 10), { c: '#0a0810', noOcc: true, noAO: true, m: 'gloss' }, .63, .02, s * .27);
    halo(head, P.eye, .5, .62, .04, s * .3, .45);
    feather(head, TUFT, [-.05, .36, s * .28], [-.45, 1, s * .3], UPV, .78, .24, .1);
    feather(head, TUFT, [-.12, .32, s * .22], [-.6, 1, s * .15], UPV, .58, .2, .1);
    var tip = [-.05 + (-.45 / 1.14) * .78 * .92, .36 + (1 / 1.14) * .78 * .92, s * (.28 + (.3 / 1.14) * .78 * .9)];
    glow(head, new T.ConeGeometry(.04, .22, 5).translate(0, .11, 0), P.mid, tip[0], tip[1], tip[2]).quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-.45, 1, s * .3).normalize());
  });
  part(head, blob(.18, .24, .15, .8, function (x, y, z, W, H) { var t = (y / H + 1) / 2; return [x, y - .06 * (1 - t), z * (1 - .5 * (1 - t))]; }), { c: P.beak, m: 'gloss' }, .62, -.14, 0);
  var jaw = new T.Group(); jaw.position.set(.56, -.2, 0); head.add(jaw);
  part(jaw, blob(.12, .1, .12, .8), { c: P.beak, m: 'gloss' }, .04, -.04, 0);
  // the crest: violet quills fanned in the plane the camera sees, from the crown down the nape
  var crest = new T.Group(); head.add(crest);
  for (var qi = 0; qi < 5; qi++) {
    var qa = 1.85 + qi / 4 * 1.1, ql = .42 - qi * .04, dir = new T.Vector3(Math.cos(qa), Math.sin(qa), 0), bx = Math.cos(qa) * .44, by = Math.sin(qa) * .4;
    glow(crest, new T.ConeGeometry(.05, ql, 5).translate(0, ql / 2, 0), P.deep, bx, by, 0, 0, 0, 0, .9).quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    glow(crest, new T.ConeGeometry(.022, ql * .85, 5).translate(0, ql * .42, 0), P.core, bx, by, 0).quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
  }

  // tail: a short fan of dark feathers
  for (var tq = -2; tq <= 2; tq++) feather(body, WING, [-.45, .85, tq * .08], [-.5, -1, tq * .15], [1, 0, 0], .6, .2, .1);

  // motes of starlight drifting round it: one instanced mesh
  var MN = 18, motes = new T.InstancedMesh(new T.OctahedronGeometry(.045, 0), glowMat('#ffffff'), MN), mt = new T.Object3D(), ms = [];
  motes.frustumCulled = false; motes.userData.noFit = true; root.add(motes);
  for (var mi = 0; mi < MN; mi++) { ms.push({ ph: mi / MN, rr: .9 + (mi % 5) * .18, h: .7 + (mi % 7) * .36 }); motes.setColorAt(mi, new T.Color(mi % 3 ? P.mid : P.core)); }
  function placeMotes(t) {
    ms.forEach(function (e, i) { var a = t * .25 + e.ph * Math.PI * 2; mt.position.set(Math.cos(a) * e.rr, e.h + Math.sin(t * .8 + e.ph * 9) * .08, Math.sin(a) * e.rr); mt.rotation.y = t + e.ph * 5; mt.scale.setScalar(.6 + .4 * Math.sin(t * 2 + e.ph * 12)); mt.updateMatrix(); motes.setMatrixAt(i, mt.matrix); });
    motes.instanceMatrix.needsUpdate = true;
  }
  placeMotes(0);
  halo(body, P.deep, 3.2, 0, 1.7, 0, .16);
  var light = new T.PointLight(0x9a7cff, 2, 3.6, 1.6); light.position.set(.6, 2.4, .5); body.add(light);

  // the neck joint, low in the shoulders, carrying the head; an owl turns its head a long way on it
  var neck = new T.Group(); neck.position.set(.1, 2.1, 0); body.add(neck);
  hang(neck, [head]);

  finish(root, 3.2);
  return {
    root: root, head: head, name: 'owl', headView: { span: 2.0, up: .15, look: 0 },
    rig: makeRig({ plan: 'perched', body: body, neck: neck, head: head, jaw: jaw, legs: LEGS, wings: WINGS }),
    update: function (t) {
      var br = Math.sin(t * 1.5);
      body.position.y = br * .012; body.scale.set(1, 1 + br * .008, 1 + br * .012);
      head.rotation.y = -.45 + Math.sin(t * .5) * .5 * (Math.sin(t * .25) > -.2 ? 1 : .2);
      head.rotation.z = Math.sin(t * .7) * .04;
      jaw.rotation.z = -(Math.sin(t * .9) * .5 + .5) * .05;
      crest.scale.setScalar(1 + Math.sin(t * 2.6) * .05);
      placeMotes(t);
      light.intensity = 1.9 + Math.sin(t * 1.3) * .35;
      var blink = (t % 6.1) < .16 ? .12 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
