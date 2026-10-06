// The battle preview: creatures at true battle size, from the fixed side camera, in a 6 v 6 formation.
// Silhouette mode, size-class boxes and layout sliders are for judging art (CLAUDE.md rule 1) and for fixing
// the formation and camera (roadmap 0.2). Every setting is mirrored in the URL, so a view can be shared or rendered.
import './style.css';
import * as T from 'three';
import { INFO, ORDER } from '../creatures/index.js';
import { RADIAL } from '../kit/materials.js';
import { makeStage } from './stadium.js';

// size classes: the solid body's length (x) and height (top above the ground); flyers also have a wingspan (z)
export var CLASSES = { S: { len: 3.5, h: 3.5 }, M: { len: 4.5, h: 3.5 }, L: { len: 6.5, h: 4.0 }, F: { len: 4.5, h: 4.5, span: 6.0 } };
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
var DEFAULT_L = { elev: 30, fov: 26, aim: 3, front: 4.5, rowGap: 6.5, colGap: 6, zoom: 1 };   // provisional until roadmap 0.2
var L = {};
LAYOUT_KEYS.forEach(function (k) { L[k] = num(k, DEFAULT_L[k]); });
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
    var sx = sl.side === 'p' ? -1 : 1;
    sl.g.position.set(sx * (L.front + sl.row * L.rowGap), 0, (sl.col - 1) * L.colGap);
    sl.g.rotation.y = 0; sl.g.scale.set(1, 1, 1);
    if (sl.side === 'e') { if (opt.turn) sl.g.rotation.y = Math.PI; else sl.g.scale.x = -1; }
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
  var c = CLASSES[a.cls], over = [];
  if (a.size.x > c.len) over.push('length ' + a.size.x.toFixed(1) + ' > ' + c.len);
  if (solid.max.y > c.h) over.push('height ' + solid.max.y.toFixed(1) + ' > ' + c.h);
  if (c.span && a.size.z > c.span) over.push('span ' + a.size.z.toFixed(1) + ' > ' + c.span);
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
  a.boxes.add(lineBox(c.len, c.h, c.span || L.colGap * .9, over.length ? 0xff4a4a : 0x5dff8a, .9));
  var real = lineBox(a.size.x, solid.max.y, a.size.z, 0xffffff, .45); a.boxes.add(real);
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
  var cam = st.cam; cam.aspect = w / h; cam.fov = L.fov; cam.updateProjectionMatrix();
  // wide enough for both back rows and a large creature, with a margin
  var half = L.front + L.rowGap + 3.6, hf = Math.atan(Math.tan(L.fov * Math.PI / 360) * cam.aspect);
  var d = half / Math.tan(hf) / L.zoom, e = L.elev * Math.PI / 180, look = L.aim;
  cam.position.set(0, look + d * Math.sin(e), d * Math.cos(e));
  cam.lookAt(0, look, 0);
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
// labels over each creature: name, class, height on screen in pixels at 720p, and what does not fit
function placeLabels() {
  var w = frame.clientWidth, h = frame.clientHeight, v = new T.Vector3();
  labels.classList.toggle('on', opt.boxes);
  slots.forEach(function (sl) {
    if (!sl.a || !opt.boxes) { sl.lab.style.display = 'none'; return; }
    var b = sl.a.solid, minY = 1e9, maxY = -1e9;
    for (var k = 0; k < 8; k++) {
      v.set(k & 1 ? b.max.x : b.min.x, k & 2 ? b.max.y : b.min.y, k & 4 ? b.max.z : b.min.z).applyMatrix4(sl.g.matrixWorld).project(st.cam);
      var y = (1 - v.y) / 2 * h; minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    var px = Math.round((maxY - minY) * 720 / h);
    v.set(0, b.max.y, 0).applyMatrix4(sl.g.matrixWorld).project(st.cam);
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
  if (act === 'reset') { L = Object.assign({}, DEFAULT_L); refresh(); return; }
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
