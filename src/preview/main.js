// The battle preview: creatures at true battle size, from the fixed side camera, in a 6 v 6 formation.
// Silhouette mode and size-class boxes are for judging art (CLAUDE.md rule 1). The layout comes from
// src/arena/layout.js; the sliders only try other layouts out. Every setting is mirrored in the URL.
import './style.css';
import * as T from 'three';
import { INFO, ORDER } from '../creatures/index.js';
import { RADIAL } from '../kit/materials.js';
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
  still: q.get('still') === '1', lights: q.get('lights') !== '0', t: num('t', 0), pick: INFO[q.get('pick')] ? q.get('pick') : 'emberwolf'
};
var L = {};
LAYOUT_KEYS.forEach(function (k) { L[k] = num(k, FORMATION[k]); });
var teams = { p: team('p', DEFAULT_P), e: team('e', DEFAULT_E) };

var frame = document.getElementById('frame'), labels = document.getElementById('labels'), status = document.getElementById('status');
var st = makeStage(frame);
var BLACK = new T.MeshBasicMaterial({ color: 0x000000 });

// ---------- slots ----------
var slots = [];
['p', 'e'].forEach(function (side) {
  for (var i = 0; i < 6; i++) {
    var g = new T.Group(); st.s.add(g);
    var lab = document.createElement('div'); lab.className = 'lab'; labels.appendChild(lab);
    slots.push({ side: side, i: i, row: i < 3 ? 0 : 1, col: i % 3, g: g, id: null, a: null, lab: lab });
  }
});
function placeSlots() {
  slots.forEach(function (sl) {
    sl.g.position.copy(slotPosition(sl.side, sl.row, sl.col, L));
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
  a.update(0); a.root.updateMatrixWorld(true);
  // the solid body: lit parts only, leaving out glow, sprites and anything marked noFit
  var solid = new T.Box3();
  a.root.traverse(function (o) { if (o.isMesh && o.userData.look && !o.userData.noFit) solid.union(new T.Box3().setFromObject(o)); });
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
  var real = lineBox(a.size.x, solid.max.y - solid.min.y, a.size.z, 0xffffff, .45); real.position.y += solid.min.y; a.boxes.add(real);
  return a;
}
function fill() {
  var todo = slots.filter(function (sl) { return sl.id !== teams[sl.side][sl.i]; });
  if (!todo.length) { refresh(); settle = 3; return; }
  status.textContent = 'Building ' + todo.length + '...';
  ready = false;
  setTimeout(function () {
    todo.forEach(function (sl) {
      if (sl.a) { sl.g.clear(); dispose(sl.a.root); sl.a = null; }
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
}
function refresh() {
  placeSlots(); fitCamera();
  st.s.overrideMaterial = opt.sil ? BLACK : null;
  st.field.visible = st.back.visible = !opt.sil;
  frame.classList.toggle('sil', opt.sil);
  slots.forEach(function (sl) {
    if (!sl.a) return;
    sl.a.soft.forEach(function (o) { o.visible = !opt.sil; });
    sl.a.lights.forEach(function (o) { o.visible = opt.lights && !opt.sil; });
    sl.a.shadow.visible = !opt.sil;
    sl.a.boxes.visible = opt.boxes;
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
  if (!opt.lights) p.set('lights', '0');
  if (opt.still) { p.set('still', '1'); p.set('t', opt.t); }
  LAYOUT_KEYS.forEach(function (k) { p.set(k, L[k]); });
  history.replaceState(null, '', '?' + p.toString().replace(/%2C/g, ','));
  document.getElementById('layout').textContent = JSON.stringify(L);
}
var ui = document.getElementById('ui');
function syncControls() {
  ui.querySelectorAll('[data-opt]').forEach(function (b) { b.setAttribute('aria-pressed', !!opt[b.getAttribute('data-opt')]); });
  ui.querySelectorAll('[data-slot]').forEach(function (s) { var k = s.getAttribute('data-slot').split(':'); s.value = teams[k[0]][+k[1]] || ''; });
  LAYOUT_KEYS.forEach(function (k) { var el = document.getElementById('r-' + k); el.value = L[k]; document.getElementById('v-' + k).textContent = L[k]; });
  document.getElementById('pick').value = opt.pick;
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
  if (o) { opt[o] = !opt[o]; refresh(); return; }
  var none = [null, null, null, null, null, null];
  if (act === 'solo') { teams.p = none.slice(); teams.p[1] = opt.pick; teams.e = none.slice(); }
  if (act === 'all') { teams.p = none.map(function () { return opt.pick; }); teams.e = teams.p.slice(); }
  if (act === 'roster') { teams.p = DEFAULT_P.slice(); teams.e = DEFAULT_E.slice(); }
  if (act === 'swap') { var x = teams.p; teams.p = teams.e; teams.e = x; }
  if (act === 'reset') { L = Object.assign({}, FORMATION); refresh(); return; }
  if (act === 'copy') { navigator.clipboard && navigator.clipboard.writeText(location.href); b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy link'; }, 1200); return; }
  fill();
});
new ResizeObserver(function () { fitCamera(); placeLabels(); }).observe(frame);

// ---------- loop ----------
var clock = new T.Clock(), time = opt.t, ready = false, settle = 0;
function loop() {
  var dt = Math.min(.05, clock.getDelta());
  if (!opt.still) time += dt;
  slots.forEach(function (sl, i) { if (sl.a) sl.a.update(opt.still ? opt.t : time + i * 1.3); });
  st.r.render(st.s, st.cam);
  // the render script waits for this: everything built and a few frames drawn
  if (settle > 0 && --settle === 0) { ready = true; window.__ready = true; }
  if (!ready) window.__ready = false;
  requestAnimationFrame(loop);
}
fill();
loop();
