// The battle preview: creatures at true battle size, from the fixed side camera, in a 6 v 6 formation.
// Silhouette mode and size-class boxes are for judging art (CLAUDE.md rule 1). The layout comes from
// src/arena/layout.js; the sliders only try other layouts out. Every setting is mirrored in the URL.
import './style.css';
import * as T from 'three';
import { INFO, ORDER } from '../creatures/index.js';
import { RADIAL } from '../kit/materials.js';
import { eachJoint, restPose } from '../kit/rig.js';
import { applyClip, clipFor, clipWeight, sample } from '../kit/anim.js';
import { bakeLights, drawCalls, merge } from '../kit/compact.js';
import { makeStage } from '../arena/stadium.js';
import { CLASSES, FORMATION, checkFit, faceSlot, placeCamera, slotPosition } from '../arena/layout.js';
// slot order in a team: front row far, middle, near; then back row far, middle, near
var DEFAULT_P = ['wardshell', 'emberwolf', 'stonemaul', 'thornstag', 'eagle', 'owl'];
var DEFAULT_E = ['elephant', 'lion', 'tidefang', 'panda', 'pyrewing', 'emberwolf'];
var LAYOUT_KEYS = ['elev', 'fov', 'aim', 'front', 'rowGap', 'colGap', 'zoom'];

var q = new URLSearchParams(location.search);
function team(key, def) {
  var v = q.get(key); if (!v) return def.slice();
  var a = v.split(',').map(function (id) { return INFO[id] ? id : null; });
  while (a.length < 6) a.push(null);
  return a.slice(0, 6);
}
function num(key, def) { var v = parseFloat(q.get(key)); return isNaN(v) ? def : v; }
var opt = {
  sil: q.get('sil') === '1', boxes: q.get('boxes') === '1', turn: q.get('enemy') === 'turn',
  still: q.get('still') === '1', light: ['baked', 'live', 'off'].indexOf(q.get('light')) >= 0 ? q.get('light') : 'baked', merge: q.get('merge') !== '0', bloom: q.get('bloom') !== '0', joints: q.get('joints') === '1', flex: q.get('flex') === '1', loop: false,
  frame: q.get('clip') ? { name: q.get('clip'), k: num('k', 0) } : null, t: num('t', 0), pick: INFO[q.get('pick')] ? q.get('pick') : 'emberwolf'
};
var L = {};
LAYOUT_KEYS.forEach(function (k) { L[k] = num(k, FORMATION[k]); });
var teams = { p: team('p', DEFAULT_P), e: team('e', DEFAULT_E) };

var frame = document.getElementById('frame'), labels = document.getElementById('labels'), status = document.getElementById('status');
var st = makeStage(frame);
if (q.get('shadows') === '0') st.r.shadowMap.enabled = false;   // for comparing renders
var BLACK = new T.MeshBasicMaterial({ color: 0x000000 });

// ---------- slots ----------
var slots = [];
['p', 'e'].forEach(function (side) {
  for (var i = 0; i < 6; i++) {
    var g = new T.Group(); st.s.add(g);
    var lab = document.createElement('div'); lab.className = 'lab'; labels.appendChild(lab);
    slots.push({ side: side, i: i, row: i < 3 ? 0 : 1, col: i % 3, g: g, id: null, a: null, lab: lab, home: new T.Vector3(), act: null });
  }
});
function placeSlots() {
  slots.forEach(function (sl) {
    sl.home.copy(slotPosition(sl.side, sl.row, sl.col, L));
    sl.g.position.copy(sl.home);
    faceSlot(sl.g, sl.side);
    if (sl.side === 'e' && opt.turn) { sl.g.scale.x = 1; sl.g.rotation.y = Math.PI; }   // to look at the far flank
  });
}

// ---------- creatures ----------
function dispose(o) {
  o.traverse(function (m) {
    if (m.geometry) m.geometry.dispose();
    if (m.material && !(m.userData && m.userData.look)) m.material.dispose();   // shared kit materials stay
  });
}
function lineBox(w, h, d, color, op) {
  var m = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w, h, d)), new T.LineBasicMaterial({ color: color, transparent: true, opacity: op, depthTest: false }));
  m.position.y = h / 2; m.renderOrder = 10;
  return m;
}
function build(id) {
  var a = INFO[id].build();
  // the creature as the battle will draw it: its own lights baked into its parts, still parts merged (roadmap 0.5)
  a.raw = drawCalls(a);
  if (opt.light === 'baked') bakeLights(a);
  if (opt.merge) merge(a);
  a.draws = drawCalls(a);
  a.update(0); a.root.updateMatrixWorld(true);
  // the solid body: lit parts only, leaving out glow, sprites and anything marked noFit
  var solid = new T.Box3();
  a.root.traverse(function (o) { if (o.isMesh && o.userData.look && !o.userData.noFit) solid.union(new T.Box3().setFromObject(o, true)); });
  var ctr = solid.getCenter(new T.Vector3()), off = new T.Vector3(-ctr.x, 0, -ctr.z);
  a.root.position.copy(off); solid.translate(off);
  a.solid = solid;
  a.size = solid.getSize(new T.Vector3());
  a.cls = INFO[id].size || 'M';
  var c = CLASSES[a.cls], over = checkFit(solid, a.cls);
  a.over = over;
  // what silhouette mode hides: sprites, faint glow, and noFit auras and rings
  a.soft = []; a.lights = [];
  a.root.traverse(function (o) {
    if (o.isLight) a.lights.push(o);
    else if (o.isSprite || o.userData.noFit || (o.isMesh && !o.userData.look && o.material.transparent && o.material.opacity < .5)) a.soft.push(o);
  });
  // a soft contact shadow, the size class box (green fits, red does not) and the actual body box
  var flyer = !!c.span, shadow = new T.Mesh(new T.PlaneGeometry(Math.max(1, a.size.x * 1.1), Math.max(1, a.size.z * (flyer ? .6 : 1.1))),
    new T.MeshBasicMaterial({ map: RADIAL, color: 0x000000, transparent: true, opacity: flyer ? .2 : .34, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .012; a.shadow = shadow;
  a.boxes = new T.Group();
  a.boxes.add(lineBox(c.len, c.h, c.span || c.dep, over.length ? 0xff4a4a : 0x5dff8a, .9));
  a.markers = jointMarkers(a.rig);
  var real = lineBox(a.size.x, solid.max.y - solid.min.y, a.size.z, 0xffffff, .45); real.position.y += solid.min.y; a.boxes.add(real);
  return a;
}
// joint markers: a dot at every rig joint and a bone line to the next joint in its chain, drawn over everything
var JCOL = { body: 0xffffff, head: 0xffffff, jaw: 0xffffff, neck: 0xffffff, ear: 0xffffff, tail: 0xff9a3c, legs: 0x4ad8ff, arms: 0xff5ad8, wings: 0xff5ad8, extra: 0xffe14a };
var DOT = new T.SphereGeometry(.07, 10, 8);
function jointMarkers(rig) {
  var out = [];
  eachJoint(rig, function (g, name) {
    var kind = name.replace(/[0-9]+$/, '').split('.')[0], col = JCOL[kind] || 0xffffff;
    var dot = new T.Mesh(DOT, new T.MeshBasicMaterial({ color: col, depthTest: false, toneMapped: false }));
    dot.renderOrder = 20; g.add(dot); out.push(dot);
    g.children.forEach(function (c) {
      if (!c.isGroup || !c.userData.rest) return;   // only bones to child joints
      var ln = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), c.position.clone()]), new T.LineBasicMaterial({ color: col, depthTest: false, transparent: true, opacity: .8 }));
      ln.renderOrder = 20; g.add(ln); out.push(ln);
    });
  });
  return out;
}
// flex: swing every joint but the body about its own z axis, out of step, to show what each one carries
var _q = new T.Quaternion(), ZAX = new T.Vector3(0, 0, 1);
function flex(a, t) {
  var i = 0;
  eachJoint(a.rig, function (g, name) {
    if (name === 'body') return;
    g.quaternion.copy(g.userData.rest.q).multiply(_q.setFromAxisAngle(ZAX, Math.sin(t * 2.4 + i * .8) * .4)); i++;
  });
}
// ---------- clips ----------
// the actor: the picked creature on the player side (front middle first), or front middle, or anyone;
// its target: the enemy in the same slot, or the enemy front middle, or anyone
function pair() {
  var P = slots.filter(function (sl) { return sl.side === 'p' && sl.a; }), E = slots.filter(function (sl) { return sl.side === 'e' && sl.a; });
  var actor = P.filter(function (sl) { return sl.id === opt.pick; }).sort(function (x, y) { return (x.i !== 1) - (y.i !== 1); })[0] || P.filter(function (sl) { return sl.i === 1; })[0] || P[0];
  if (!actor) { actor = E.filter(function (sl) { return sl.id === opt.pick; })[0] || E[0]; P = E; E = []; }
  var target = actor && (E.filter(function (sl) { return sl.i === actor.i; })[0] || E.filter(function (sl) { return sl.i === 1; })[0] || E[0]);
  return { actor: actor, target: target };
}
// where an attacker stops: nose to the target's front (a little under half of both lengths), or 6 ahead if no target
function strikePoint(sl, target) {
  if (!target) return sl.home.clone().add(new T.Vector3(sl.side === 'p' ? 6 : -6, 0, 0));
  var dir = target.home.clone().sub(sl.home).normalize(), gap = (sl.a.size.x + target.a.size.x) * .47;
  return target.home.clone().addScaledVector(dir, -gap);
}
var ctime = 0;
function play(sl, name, target) {
  if (!sl || !sl.a) return;
  sl.act = { clip: clipFor(sl.a, name), t0: ctime, target: target || null, dest: strikePoint(sl, target), hit: false };
}
function playAll(name) { slots.forEach(function (sl) { if (sl.a) play(sl, name); }); }
function stopAll() { slots.forEach(function (sl) { sl.act = null; sl.g.position.copy(sl.home); }); }
// lay a slot's clip over its idle; k is forced for still frames, else it runs on the clip clock
function runClip(sl, t, forcedK) {
  var act = sl.act, c = act.clip, k = forcedK != null ? forcedK : (ctime - act.t0) / c.dur;
  if (k >= 1 && !c.hold && forcedK == null) { sl.act = null; sl.g.position.copy(sl.home); return; }
  k = Math.min(1, Math.max(0, k));
  applyClip(sl.a, c, k, clipWeight(c, k), k * c.dur);
  sl.g.position.copy(sl.home).lerp(act.dest, sample(c.travel, k));
  if (c.impact != null && k >= c.impact && !act.hit && act.target && forcedK == null) { act.hit = true; play(act.target, 'hit'); }
}
// a still frame for renders: attack and ultimate play on the actor (its target reacts after the impact); the others on everyone
function forcedFrame() {
  var f = opt.frame, n = f.name, done = [];
  if (n === 'allattack') {
    slots.forEach(function (sl) {
      var tg = slots.filter(function (x) { return x.side === 'e' && x.a && x.i === sl.i; })[0];
      if (!sl.a || sl.side !== 'p') return;
      sl.act = { clip: clipFor(sl.a, 'attack'), t0: 0, target: tg, dest: strikePoint(sl, tg), hit: true };
      runClip(sl, 0, f.k); done.push(sl);
      if (tg && f.k >= sl.act.clip.impact) {
        var h = clipFor(tg.a, 'hit'), hk = (f.k - sl.act.clip.impact) * sl.act.clip.dur / h.dur;
        if (hk < 1) { tg.act = { clip: h, t0: 0, dest: tg.home.clone(), hit: true }; runClip(tg, 0, hk); done.push(tg); }
      }
    });
  } else if (n === 'attack' || n === 'ultimate') {
    var pr = pair(); if (!pr.actor) return done;
    pr.actor.act = { clip: clipFor(pr.actor.a, n), t0: 0, target: pr.target, dest: strikePoint(pr.actor, pr.target), hit: true };
    runClip(pr.actor, 0, f.k); done.push(pr.actor);
    if (pr.target && f.k >= pr.actor.act.clip.impact) {
      var h = clipFor(pr.target.a, 'hit'), hk = (f.k - pr.actor.act.clip.impact) * pr.actor.act.clip.dur / h.dur;
      if (hk < 1) { pr.target.act = { clip: h, t0: 0, dest: pr.target.home.clone(), hit: true }; runClip(pr.target, 0, hk); done.push(pr.target); }
    }
  } else slots.forEach(function (sl) {
    if (!sl.a) return;
    sl.act = { clip: clipFor(sl.a, n), t0: 0, dest: sl.home.clone(), hit: true }; runClip(sl, 0, f.k); done.push(sl);
  });
  return done;
}
// the exchange loop: the actor attacks, then its target answers, over and over
var nextSwing = 0, swingSide = 0;
function exchange() {
  if (!opt.loop || ctime < nextSwing || slots.some(function (sl) { return sl.act; })) return;
  var pr = pair(); if (!pr.actor) return;
  var who = swingSide % 3 === 2 ? 'ultimate' : 'attack';
  if (swingSide % 2 && pr.target) play(pr.target, who, pr.actor); else play(pr.actor, who, pr.target);
  swingSide++; nextSwing = ctime + .5;
}

// build every creature again (merging and baking happen at build time)
function rebuild() { slots.forEach(function (sl) { sl.id = '?'; }); fill(); }
function fill() {
  var todo = slots.filter(function (sl) { return sl.id !== teams[sl.side][sl.i]; });
  if (!todo.length) { refresh(); settle = 3; return; }
  status.textContent = 'Building ' + todo.length + '...';
  ready = false;
  setTimeout(function () {
    todo.forEach(function (sl) {
      if (sl.a) { sl.g.clear(); dispose(sl.a.root); sl.a = null; }
      sl.act = null; sl.g.position.copy(sl.home);
      sl.id = teams[sl.side][sl.i];
      if (!sl.id) return;
      sl.a = build(sl.id);
      sl.g.add(sl.a.root, sl.a.shadow, sl.a.boxes);
    });
    status.textContent = '';
    refresh();
    settle = 3;
  }, 30);
}

// ---------- view ----------
function fitCamera() {
  var w = frame.clientWidth, h = frame.clientHeight; if (!w || !h) return;
  st.r.setSize(w, h, false);
  placeCamera(st.cam, w / h, L);
  st.bloom.setSize(w, h);
}
function refresh() {
  placeSlots(); fitCamera();
  st.s.overrideMaterial = opt.sil ? BLACK : null;
  st.field.visible = st.back.visible = !opt.sil;
  frame.classList.toggle('sil', opt.sil);
  slots.forEach(function (sl) {
    if (!sl.a) return;
    sl.a.soft.forEach(function (o) { o.visible = !opt.sil; });
    sl.a.lights.forEach(function (o) { o.visible = opt.light === 'live' && !opt.sil; });
    sl.a.shadow.visible = !opt.sil;
    sl.a.boxes.visible = opt.boxes;
    sl.a.markers.forEach(function (m) { m.visible = opt.joints; });
  });
  st.s.updateMatrixWorld(true);
  placeLabels();
  syncUrl(); syncControls();
}
// labels over each creature: name, class, standing height on screen (ground to top at the slot, px at 720p),
// and what does not fit
function placeLabels() {
  var w = frame.clientWidth, h = frame.clientHeight, v = new T.Vector3();
  labels.classList.toggle('on', opt.boxes);
  slots.forEach(function (sl) {
    if (!sl.a || !opt.boxes) { sl.lab.style.display = 'none'; return; }
    var b = sl.a.solid;
    var y0 = v.set(0, 0, 0).applyMatrix4(sl.g.matrixWorld).project(st.cam).y;
    v.set(0, b.max.y, 0).applyMatrix4(sl.g.matrixWorld).project(st.cam);
    var px = Math.round((v.y - y0) / 2 * 720);
    sl.lab.style.display = '';
    sl.lab.style.left = ((v.x + 1) / 2 * w) + 'px'; sl.lab.style.top = ((1 - v.y) / 2 * h) + 'px';
    sl.lab.className = 'lab' + (sl.a.over.length ? ' bad' : '');
    sl.lab.innerHTML = '<b>' + INFO[sl.id].name + '</b> ' + sl.a.cls + ' &middot; ' + px + ' px' + (sl.a.over.length ? '<br>' + sl.a.over.join('<br>') : '');
  });
}

// ---------- url and controls ----------
function syncUrl() {
  var p = new URLSearchParams();
  p.set('p', teams.p.map(function (x) { return x || '-'; }).join(','));
  p.set('e', teams.e.map(function (x) { return x || '-'; }).join(','));
  if (opt.sil) p.set('sil', '1');
  if (opt.boxes) p.set('boxes', '1');
  if (opt.turn) p.set('enemy', 'turn');
  if (opt.light !== 'baked') p.set('light', opt.light);
  if (!opt.merge) p.set('merge', '0');
  if (!opt.bloom) p.set('bloom', '0');
  if (opt.frame) { p.set('clip', opt.frame.name); p.set('k', opt.frame.k); }
  if (opt.joints) p.set('joints', '1');
  if (opt.flex) p.set('flex', '1');
  if (opt.still) { p.set('still', '1'); p.set('t', opt.t); }
  LAYOUT_KEYS.forEach(function (k) { p.set(k, L[k]); });
  history.replaceState(null, '', '?' + p.toString().replace(/%2C/g, ','));
  document.getElementById('layout').textContent = JSON.stringify(L);
}
var ui = document.getElementById('ui');
function syncControls() {
  ui.querySelectorAll('[data-opt]').forEach(function (b) { b.setAttribute('aria-pressed', !!opt[b.getAttribute('data-opt')]); });
  ui.querySelectorAll('[data-opt-show]').forEach(function (b) { b.setAttribute('aria-pressed', !!opt[b.getAttribute('data-opt-show')]); });
  ui.querySelectorAll('[data-slot]').forEach(function (s) { var k = s.getAttribute('data-slot').split(':'); s.value = teams[k[0]][+k[1]] || ''; });
  LAYOUT_KEYS.forEach(function (k) { var el = document.getElementById('r-' + k); el.value = L[k]; document.getElementById('v-' + k).textContent = L[k]; });
  document.getElementById('pick').value = opt.pick;
  document.getElementById('light').textContent = 'Creature light: ' + opt.light;
}
function options() { return '<option value="">-</option>' + ORDER.map(function (id) { return '<option value="' + id + '">' + INFO[id].name + '</option>'; }).join(''); }
// team grids drawn as they stand on the field: back row outside, front row toward the centre line
function grid(side) {
  var cols = side === 'p' ? [3, 0] : [0, 3], html = '';
  for (var c = 0; c < 3; c++) cols.forEach(function (base) { html += '<select data-slot="' + side + ':' + (base + c) + '" aria-label="' + (side === 'p' ? 'Player' : 'Enemy') + ' ' + (base ? 'back' : 'front') + ' row, slot ' + (c + 1) + '">' + options() + '</select>'; });
  return html;
}
document.getElementById('grid-p').innerHTML = grid('p');
document.getElementById('grid-e').innerHTML = grid('e');
document.getElementById('pick').innerHTML = options().replace('<option value="">-</option>', '');
ui.addEventListener('change', function (ev) {
  var t = ev.target;
  if (t.hasAttribute('data-slot')) { var k = t.getAttribute('data-slot').split(':'); teams[k[0]][+k[1]] = t.value || null; fill(); }
  if (t.id === 'pick') opt.pick = t.value;
});
ui.addEventListener('input', function (ev) {
  var k = ev.target.getAttribute('data-layout'); if (!k) return;
  L[k] = parseFloat(ev.target.value); refresh();
});
ui.addEventListener('click', function (ev) {
  var b = ev.target.closest('button'); if (!b) return;
  var o = b.getAttribute('data-opt'), act = b.getAttribute('data-act');
  if (o === 'still' && !opt.still) opt.t = Math.round(time * 100) / 100;   // freeze where it is
  if (o === 'merge') { opt.merge = !opt.merge; rebuild(); return; }
  if (o) { opt[o] = !opt[o]; refresh(); return; }
  if (act === 'light') { opt.light = { baked: 'live', live: 'off', off: 'baked' }[opt.light]; rebuild(); return; }
  var none = [null, null, null, null, null, null];
  if (act === 'solo') { teams.p = none.slice(); teams.p[1] = opt.pick; teams.e = none.slice(); }
  if (act === 'all') { teams.p = none.map(function () { return opt.pick; }); teams.e = teams.p.slice(); }
  if (act === 'roster') { teams.p = DEFAULT_P.slice(); teams.e = DEFAULT_E.slice(); }
  if (act === 'swap') { var x = teams.p; teams.p = teams.e; teams.e = x; }
  var clip = b.getAttribute('data-clip');
  if (clip) {
    opt.frame = null;
    if (clip === 'stop') { opt.loop = false; stopAll(); refresh(); return; }
    if (clip === 'loop') { opt.loop = !opt.loop; nextSwing = ctime; refresh(); return; }
    if (clip === 'attack' || clip === 'ultimate') { var pr = pair(); play(pr.actor, clip, pr.target); }
    else if (clip === 'allattack') slots.forEach(function (sl) { if (sl.a && sl.side === 'p') play(sl, 'attack', slots.filter(function (x) { return x.side === 'e' && x.a && x.i === sl.i; })[0]); });
    else playAll(clip);
    return;
  }
  if (act === 'reset') { L = Object.assign({}, FORMATION); refresh(); return; }
  if (act === 'copy') { navigator.clipboard && navigator.clipboard.writeText(location.href); b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy link'; }, 1200); return; }
  fill();
});
new ResizeObserver(function () { fitCamera(); placeLabels(); }).observe(frame);

// ---------- performance readout: frames a second, draw calls, triangles, and what merging saved ----------
// the renderer's counters run over the whole frame (shadow map, scene, bloom), so they are reset by hand each frame
st.r.info.autoReset = false;
var pf = { n: 0, t0: performance.now() }, perfEl = document.getElementById('perf');
function perf() {
  var info = st.r.info.render;
  window.__frameInfo = { calls: info.calls, triangles: info.triangles };
  pf.n++;
  var el = (performance.now() - pf.t0) / 1000;
  if (el < .5) return;
  var raw = 0, now = 0;
  slots.forEach(function (sl) { if (sl.a) { raw += sl.a.raw.draws; now += sl.a.draws.draws; } });
  perfEl.textContent = Math.round(pf.n / el) + ' fps · ' + info.calls + ' draw calls a frame (shadows included) · ' + Math.round(info.triangles / 1000) + 'k triangles · creatures ' + now + ' meshes' + (opt.merge ? ' (were ' + raw + ')' : '');
  pf.n = 0; pf.t0 = performance.now();
}

// ---------- loop ----------
var clock = new T.Clock(), time = opt.t, ready = false, settle = 0;
function loop() {
  var dt = Math.min(.05, clock.getDelta());
  if (!opt.still) time += dt;
  ctime += dt;
  exchange();
  var forced = opt.frame ? null : [];
  // every frame starts from rest, so joints the idle does not drive (legs) come home when a clip ends
  slots.forEach(function (sl, i) { if (sl.a) { restPose(sl.a.rig); sl.a.update(opt.still ? opt.t : time + i * 1.3); } });
  if (opt.frame) forced = forcedFrame();
  slots.forEach(function (sl, i) {
    if (!sl.a || forced.indexOf(sl) >= 0) return;
    if (sl.act) runClip(sl, time);
    else if (opt.flex) flex(sl.a, opt.still ? opt.t : time + i * 1.3);
  });
  st.r.info.reset();
  st.r.render(st.s, st.cam);
  st.bloom.on = opt.bloom && !opt.sil;
  st.bloom.render();
  perf();
  // the render script waits for this: everything built and a few frames drawn. __frame poses a still for it
  window.__frame = function (name, k) { opt.frame = name ? { name: name, k: k } : null; if (!name) stopAll(); };
  if (settle > 0 && --settle === 0) { ready = true; window.__ready = true; }
  if (!ready) window.__ready = false;
  requestAnimationFrame(loop);
}
fill();
loop();
