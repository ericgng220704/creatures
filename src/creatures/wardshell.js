import * as T from 'three';
import { C, mix, rng, sstep } from '../kit/math.js';
import { blob, lumpGeo, ttube } from '../kit/geometry.js';
import { halo } from '../kit/materials.js';
import { band, finish, glow, onLimb, part, plateGeo, seg, shard } from '../kit/parts.js';

// =====================================================================
// WARDSHELL: a sturdy tortoise whose shell is plated and warded
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
    shell: C('#4b7a5f'), shellDark: C('#244638'), shellLight: C('#86ad7e'), groove: C('#17322a'),
    gold: C('#d9ab3d'), goldDark: C('#9a6a1a'), skin: C('#7d8f5a'), skinDark: C('#556a3e'), plastron: C('#d9c79a'),
    stone: C('#8a8f96'), stoneDark: C('#575c66'), nail: C('#efe6c8'), beak: C('#b9a36a'), mouth: C('#3a2a20'),
    moss: C('#5fa04a'), mossLight: C('#93cf5e'), leaf: C('#78c255'), blossom: C('#ffb9cd'), blossomCore: C('#ffd96a'),
    eye: '#ffd75a', rune: '#6ff0d0', runeDeep: '#00b894'
  };
  var root = new T.Group(), legs = new T.Group(), body = new T.Group(); root.add(legs, body);
  var SW = 2.9, SH = 1.7, SD = 2.5, SE = .78, CY = .85, HEX = .5;
  function shellY(x, z) { var u = Math.pow(Math.abs(x) / (SW / 2), 2 / SE) + Math.pow(Math.abs(z) / (SD / 2), 2 / SE); return CY + (SH / 2) * Math.pow(Math.max(0, 1 - u), SE / 2); }
  function shellCol(p, n) {
    var c = hexCell(p.x, p.z, HEX), g = sstep(.76, 1.0, c.d), h = ((c.id * 9301 + 49297) % 233280) / 233280;
    var base = mix(P.shell, P.shellLight, h * .55 + sstep(1, 0, c.d) * .25);
    base = mix(base, P.shellDark, sstep(.25, -.6, n.y) * .6);
    return mix(base, P.groove, g * .9);
  }
  var SKIN = { c: function (p, n) { return mix(P.skin, P.skinDark, sstep(.2, -.5, n.y) * .6 + sstep(.4, .9, n.y) * .15); } };
  var STONE = { c: function (p, n) { return mix(P.stone, P.stoneDark, sstep(.2, -.6, n.y)); }, m: 'flat' };
  var GOLD = { c: P.gold, m: 'metal' }, NAIL = { c: P.nail, m: 'gloss', noAO: true, noOcc: true };

  // the shell: a dome of raised hexagonal plates with sunken seams, over a pale underplate
  part(body, blob(SW, SH, SD, SE, function (x, y, z, W, H) {
    if (y < 0) return [x, y * .25, z];
    var c = hexCell(x, z, HEX), g = sstep(.78, 1.0, c.d), tt = y / H;
    return [x, y + tt * (.07 * (1 - c.d * c.d * .6) - .08 * g), z];
  }, 128, 76), { c: shellCol }, 0, CY, 0);
  part(body, blob(2.6, .5, 2.1, .7), { c: P.plastron }, 0, .5, 0);
  // a gold rim with spikes round the edge
  var rim = [];
  for (var a = 0; a < 28; a++) { var an = a / 28 * Math.PI * 2; rim.push([Math.cos(an) * 1.43, .8, Math.sin(an) * 1.23]); }
  part(body, ttube(rim, .1, .1, 8, 112, true), GOLD);
  for (var k = 0; k < 12; k++) {
    var ak = (k + .5) / 12 * Math.PI * 2, ck = Math.cos(ak), sk = Math.sin(ak);
    if (Math.abs(ck) > .9) continue;
    shard(body, .085, .3, 5, STONE, [ck * 1.45, .86, sk * 1.25], [ck, .55, sk], k);
  }
  // a gold sigil with a glowing ring and a gem at the crown of the shell
  var topY = shellY(0, 0);
  var sig = [], inr = [];
  for (var b = 0; b < 18; b++) { var ab = b / 18 * Math.PI * 2; sig.push([Math.cos(ab) * .46, shellY(Math.cos(ab) * .46, Math.sin(ab) * .46) + .02, Math.sin(ab) * .46]); inr.push([Math.cos(ab) * .3, shellY(Math.cos(ab) * .3, Math.sin(ab) * .3) + .03, Math.sin(ab) * .3]); }
  part(body, ttube(sig, .04, .04, 6, 72, true), GOLD);
  glow(body, ttube(inr, .022, .022, 6, 72, true), P.rune);
  var gem = glow(body, new T.IcosahedronGeometry(.12, 1), P.rune, 0, topY + .08, 0);
  halo(body, P.runeDeep, 1.2, 0, topY + .1, 0, .5);
  // a patch of moss and two small blossoms on one shoulder of the shell
  var mr = rng(14);
  [[-.85, .45], [-.62, .62], [-.98, .18], [-.5, .22], [-.72, -.02], [-.32, .55], [-.9, .62]].forEach(function (m, i) {
    var y = shellY(m[0], m[1]) - .02;
    part(body, lumpGeo(.13 + mr() * .06, i * 5 + 3), { c: mr() < .35 ? P.mossLight : P.moss, m: 'flat' }, m[0], y, m[1], mr() * 3, mr() * 3, mr() * 3);
    if (i % 2 === 0) shard(body, .02, .16 + mr() * .1, 4, { c: P.leaf, m: 'flat', noOcc: true }, [m[0], y + .08, m[1]], [(mr() - .5) * .6, 1, (mr() - .5) * .6]);
  });
  [[-.7, .3], [-.45, .5]].forEach(function (f) {
    var g = new T.Group(); g.position.set(f[0], shellY(f[0], f[1]) + .1, f[1]); body.add(g);
    for (var q = 0; q < 5; q++) part(g, blob(.1, .03, .065, .9), { c: P.blossom, noOcc: true }, Math.cos(q * 1.2566) * .055, 0, Math.sin(q * 1.2566) * .055, 0, -q * 1.2566, 0);
    part(g, blob(.05, .045, .05, .9), { c: P.blossomCore, noOcc: true }, 0, .02, 0);
  });

  // four pillar legs in stone shin plates and gold bands, with blunt nails
  [[1.0, 1], [1.0, -1], [-1.0, 1], [-1.0, -1]].forEach(function (l) {
    var x = l[0], s = l[1], front = x > 0, top = [x, .66, s * .86], bot = [x + (front ? .12 : .05), .15, s * .96];
    seg(legs, top, bot, front ? .44 : .48, .36, SKIN);
    var pl = onLimb(legs, blob(.46, .52, .2, .55), STONE, top, bot, .5);
    pl.position.add(new T.Vector3(.04, 0, s * .32));
    band(legs, GOLD, top, bot, .78, .38, .13);
    part(legs, blob(.7, .24, .62, .8), SKIN, bot[0] + .12, .12, s * .96);
    [-.2, -.07, .07, .2].forEach(function (dz) { shard(legs, .05, .16, 5, NAIL, [bot[0] + .46, .09, s * .96 + dz * 1.2], [1, -.1, dz * .8]); });
  });
  // tail
  seg(body, [-1.35, .6, 0], [-2.0, .4, 0], .26, .12, SKIN);
  shard(body, .08, .24, 5, STONE, [-1.95, .42, 0], [-1, .2, 0]);

  // neck, a gold collar and a calm, noble head: a domed brow, big gentle eyes under heavy lids,
  // a hooked beak and a closed mouth turned up a little at the corners
  seg(body, [1.05, .78, 0], [1.78, .98, 0], .5, .4, SKIN, .9);
  band(body, GOLD, [1.05, .78, 0], [1.78, .98, 0], .5, .5, .16);
  var HEADSKIN = { c: function (p, n) { var c = mix(P.skin, P.skinDark, sstep(.5, .95, n.y) * .25); return mix(c, P.plastron, sstep(-.2, -.8, n.y) * .6); } };
  var head = new T.Group(); head.position.set(2.1, 1.0, 0); head.rotation.z = .05; body.add(head);
  part(head, blob(.78, .72, .7, .9), HEADSKIN, 0, .03, 0);
  part(head, blob(.55, .36, .48, .85, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y * (1 - .25 * t), z * (1 - .3 * t)]; }), HEADSKIN, .46, -.1, 0);
  part(head, blob(.34, .2, .36, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y - .06 * t * t + .02, z * (1 - .5 * t)]; }), { c: P.beak, m: 'gloss' }, .78, -.06, 0);
  part(head, blob(.3, .1, .3, .8, function (x, y, z, W) { var t = (x / W + 1) / 2; return [x, y, z * (1 - .5 * t)]; }), { c: P.beak, m: 'gloss' }, .72, -.2, 0);
  [1, -1].forEach(function (sd) {
    part(head, ttube([[.28, -.18, sd * .27], [.55, -.2, sd * .24], [.82, -.16, sd * .15], [.92, -.1, sd * .1]], .016, .012, 6, 14), { c: P.mouth, noAO: true, noOcc: true });
    part(head, blob(.05, .04, .05, .9), { c: P.mouth, noOcc: true }, .94, 0, sd * .08);
  });
  var eyes = [];
  [.31, -.31].forEach(function (z) {
    part(head, blob(.26, .22, .2, .85), { c: P.skinDark, noOcc: true }, .3, .11, z * .96);
    eyes.push(glow(head, blob(.16, .15, .08, .85), P.eye, .33, .11, z * 1.06, 0, z > 0 ? -.3 : .3, 0));
    part(head, blob(.06, .09, .03, .9), { c: '#1a1208', noAO: true, noOcc: true }, .4, .11, z * 1.1, 0, z > 0 ? -.3 : .3, 0);
    halo(head, P.eye, .3, .35, .11, z * 1.14, .35);
    part(head, blob(.2, .09, .22, .9), HEADSKIN, .33, .2, z * 1.0, 0, z > 0 ? -.25 : .25, -.1);
  });
  part(head, blob(.16, .08, .16, .9), GOLD, .42, .3, 0);

  // eight shields of light circle the whole body, each turned outward; a faint ring of light marks their path
  var wards = new T.Group(); wards.position.set(0, 1.2, 0); root.add(wards);
  var shield = [[0, .44], [.3, .3], [.3, -.06], [0, -.46], [-.3, -.06], [-.3, .3]].map(function (q) { return [q[0] * .72, q[1] * .72]; });
  var shieldIn = shield.map(function (q) { return [q[0] * .7, q[1] * .7 - .01]; });
  var wg = [], path = [];
  for (var wi = 0; wi < 8; wi++) {
    var g2 = new T.Group(); wards.add(g2);
    part(g2, plateGeo(shield, .07, .02), GOLD, 0, 0, 0);
    glow(g2, plateGeo(shieldIn, .1, 0), P.rune, 0, 0, 0, 0, 0, 0, .7);
    wg.push(g2);
  }
  for (var pq = 0; pq < 48; pq++) { var pa = pq / 48 * Math.PI * 2; path.push([Math.cos(pa) * 3.4, .35, Math.sin(pa) * 2.3]); }
  glow(wards, ttube(path, .015, .015, 6, 160, true), P.rune, 0, 0, 0, 0, 0, 0, .2);
  function placeWards(t) {
    wg.forEach(function (g3, i) {
      var a = t * .32 + i * Math.PI / 4, nx = Math.cos(a) / 3.4, nz = Math.sin(a) / 2.3;
      g3.position.set(Math.cos(a) * 3.4, .35 + Math.sin(a * 2 + i) * .3, Math.sin(a) * 2.3);
      g3.rotation.y = Math.PI / 2 - Math.atan2(nz, nx);
    });
  }
  placeWards(0);
  var light = new T.PointLight(0x6ff0d0, 2, 3.4, 1.6); light.position.set(0, 2.4, 0); body.add(light);

  finish(root, 2.4);
  return {
    root: root, head: head, name: 'wardshell', headView: { span: 2.4, up: .3, look: 0 },
    update: function (t) {
      var br = Math.sin(t * 1.2);
      body.position.y = br * .012; body.scale.set(1, 1 + br * .006, 1 + br * .008);
      head.position.x = 2.1 + Math.sin(t * .7) * .06; head.rotation.y = Math.sin(t * .5) * .12; head.rotation.z = Math.sin(t * .8) * .03;
      placeWards(t);
      gem.scale.setScalar(1 + Math.sin(t * 2.2) * .18);
      light.intensity = 1.8 + Math.sin(t * 2.2) * .4;
      var blink = (t % 6.3) < .15 ? .1 : 1; eyes.forEach(function (e) { e.scale.y = blink; });
    }
  };
}
