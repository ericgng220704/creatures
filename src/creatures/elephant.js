import * as T from 'three';
import { C, mix, sstep } from '../kit/math.js';
import { blob, ttube } from '../kit/geometry.js';
import { band, finish, glow, lock, part, seg } from '../kit/parts.js';
import { chain, makeRig } from '../kit/rig.js';

// =====================================================================
// GRANDTUSK: a giant elephant with tusks as long as its body is deep
// =====================================================================
export function elephant() {
  var P = {
    skin: C('#82838d'), skinDark: C('#5d5e68'), skinLight: C('#a9aab3'), ear: C('#c79a9a'), ivory: C('#f3ecd8'), gold: C('#d9ab3d'), goldDark: C('#9a6a1a'),
    nail: C('#d8d0bc'), eye: '#ffd98a', rune: '#ffd25a', tuft: C('#3c3a40')
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  function skin(p, n) {
    var c = mix(P.skin, P.skinDark, sstep(.3, .9, n.y) * .35);
    c = mix(c, P.skinLight, sstep(-.1, -.7, n.y) * .5);
    return mix(c, P.skinDark, (Math.sin(p.y * 22 + p.x * 3) > .86 ? .35 : 0) + (Math.sin(p.x * 17 - p.y * 5) > .9 ? .25 : 0));
  }
  var SKIN = { c: skin }, IVORY = { c: P.ivory, m: 'gloss' }, GOLD = { c: P.gold, m: 'metal' }, NAIL = { c: P.nail, m: 'gloss', noAO: true, noOcc: true };

  // body: a vast barrel, a domed back, a heavy rump
  part(body, blob(2.9, 2.1, 1.85, .85), SKIN, 0, 2.15, 0);
  part(body, blob(1.5, 1.9, 1.7, .85), SKIN, .95, 2.1, 0);
  part(body, blob(1.4, 1.8, 1.7, .85), SKIN, -1.0, 2.1, 0);
  // four pillar legs with wide feet and nails
  [[.95, 1], [.95, -1], [-1.0, 1], [-1.0, -1]].forEach(function (l) {
    var x = l[0], s = l[1];
    seg(legs, [x, 1.65, s * .68], [x + .02, .22, s * .7], .56, .46, SKIN);
    part(legs, blob(1.0, .34, .92, .8), SKIN, x + .1, .15, s * .7);
    [-.3, -.1, .1, .3].forEach(function (dz) { part(legs, blob(.13, .13, .12, .85), NAIL, x + .62, .1, s * .7 + dz * 1.1); });
  });
  // tail
  part(body, ttube([[-1.7, 2.4, 0], [-1.95, 2.0, 0], [-2.0, 1.4, 0]], .09, .05, 6, 12), SKIN);
  for (var ti = 0; ti < 6; ti++) lock(body, { c: P.tuft, noOcc: true, aoK: .3 }, [-2.0, 1.45, 0], [Math.cos(ti) * .25, -1, Math.sin(ti) * .25], [Math.cos(ti), 0, Math.sin(ti)], .3, .12, .07, .06);

  // head: a great dome of a brow, small kind eyes, and ears like sails
  var head = new T.Group(); head.position.set(1.95, 2.55, 0); head.rotation.z = -.05; body.add(head);
  part(head, blob(1.2, 1.3, 1.1, .85), SKIN, 0, 0, 0);
  part(head, blob(.8, .8, .9, .85), SKIN, .35, -.35, 0);
  var eyes = [], ears = [];
  [.5, -.5].forEach(function (z) {
    part(head, blob(.2, .14, .1, .8), { c: P.skinDark, noOcc: true }, .42, .12, z * .98);
    eyes.push(glow(head, blob(.1, .08, .05, .8), P.eye, .45, .12, z * 1.02, 0, z > 0 ? -.3 : .3, 0));
    part(head, blob(.3, .08, .12, .8), SKIN, .4, .24, z * .94, 0, 0, -.2);
    var ear = new T.Group(); ear.position.set(-.25, .3, z * .5); ear.rotation.y = z > 0 ? .25 : -.25; head.add(ear); ears.push(ear);
    part(ear, blob(.14, 1.5, 1.3, .8, function (x, y, zz, W, H) { return [x, y, zz * (1 + .15 * (y / H))]; }), SKIN, 0, -.05, z * .6);
    part(ear, blob(.1, 1.15, .95, .8), { c: P.ear, noOcc: true }, z > 0 ? .05 : .05, -.05, z * .62);
  });
  // a rune of light on the brow
  glow(head, ttube([[.58, .55, .0], [.62, .4, .08], [.6, .28, -.06], [.64, .12, .06]], .014, .01, 6, 14), P.rune);
  // the trunk: eight joints, each turning a little more, so it can sway and curl
  var trunk = new T.Group(); trunk.position.set(.7, -.15, 0); head.add(trunk);
  var base = [-.55, -.4, -.25, -.12, .05, .25, .5, .8], tj = [], pg = trunk;
  for (var i = 0; i < 8; i++) {
    var g = new T.Group(); g.position.set(i ? .4 : 0, 0, 0); g.rotation.z = base[i]; pg.add(g); pg = g;
    var rr = .27 - i * .022;
    part(g, blob(.58, rr * 2, rr * 2, .9), SKIN, .2, 0, 0);
    tj.push({ g: g, base: base[i] });
  }
  // tusks: thick ivory curves, banded in gold, each carrying a glowing gem
  [1, -1].forEach(function (s) {
    var pts = [[.55, -.5, s * .44], [1.05, -.95, s * .6], [1.75, -.95, s * .58], [2.3, -.45, s * .46]];
    part(head, ttube(pts, .2, .035, 10, 28), IVORY);
    band(head, GOLD, pts[0], pts[1], .22, .24, .12);
    band(head, GOLD, pts[0], pts[1], .62, .22, .08);
    glow(head, new T.IcosahedronGeometry(.07, 1), P.rune, pts[0][0] + .15, pts[0][1] - .1, pts[0][2] + s * .13);
  });
  var light = new T.PointLight(0xffd25a, 1.4, 3, 1.6); light.position.set(2.4, 2.6, 0); body.add(light);

  finish(root, 4.0);
  return {
    root: root, head: head, name: 'elephant', headView: { span: 4.4, up: .2, look: -.2 },
    rig: makeRig({ plan: 'quadruped', body: body, head: head, ears: ears, extra: { trunk: chain(tj.map(function (j) { return j.g; })) } }),
    update: function (t) {
      var br = Math.sin(t * 1.0);
      body.position.y = br * .02; body.scale.set(1, 1 + br * .005, 1 + br * .008);
      head.rotation.z = -.05 + Math.sin(t * .6) * .03; head.rotation.y = Math.sin(t * .45) * .1;
      ears.forEach(function (e, i) { e.rotation.y = (i ? -.25 : .25) + (i ? -1 : 1) * Math.sin(t * 1.4 + i) * .12; });
      tj.forEach(function (j, i) { j.g.rotation.z = j.base + Math.sin(t * 1.1 - i * .5) * .05 * (1 + i * .25); });
      light.intensity = 1.3 + Math.sin(t * 1.8) * .3;
      var blink = (t % 6.3) < .14 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
