import './style.css';
import * as T from 'three';
import { makeView, contactShadow } from './scene.js';
import { INFO, ORDER } from '../creatures/index.js';

var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
var spin = !reduced, live = [], slots = [];
var cards = document.getElementById('cards');
// the box round a creature's solid parts, leaving out glow sprites that only look big
function boxOf(root) {
  var box = new T.Box3();
  root.updateMatrixWorld(true);
  root.traverse(function (o) { if (o.isMesh && o.geometry && !o.userData.noFit) box.union(new T.Box3().setFromObject(o)); });
  return box;
}
function setup(info, card) {
  var el = card.querySelector('.view');
  var v = makeView(el);
  var a = info.build();
  var box = boxOf(a.root), sz = box.getSize(new T.Vector3()), ctr = box.getCenter(new T.Vector3());
  var pad = a.fitPad || {}, reach = Math.max(sz.x, sz.z), tall = sz.y + (pad.up || 0), mid = ctr.y + (pad.up || 0) / 2;
  a.pivot = new T.Group(); a.pivot.add(a.root);
  a.root.position.set(-ctr.x, 0, -ctr.z);
  a.yaw = a.initYaw != null ? a.initYaw : -.55; a.pivot.rotation.y = a.yaw;
  v.s.add(a.pivot);
  contactShadow(v.s, reach * 1.2, reach * .8);
  a.spin = spin;
  v.fit = function () {
    var fov = v.cam.fov * Math.PI / 180;
    if (v.mode === 'head') {
      var hp = new T.Vector3(); a.head.getWorldPosition(hp);
      var hv = a.headView || (a.name === 'thornstag' ? { span: 2.6, up: .65, look: .38 } : { span: 1.9, up: .3, look: 0 });
      var d = hv.span / 2 / Math.tan(fov / 2);
      v.cam.position.set(hp.x * .6 + .2, hp.y + hv.up, hp.z * .6 + d);
      v.cam.lookAt(hp.x, hp.y + hv.look, hp.z);
      return;
    }
    var h = Math.max(tall * 1.2, reach * 1.16 / v.cam.aspect);
    var dist = (h / 2) / Math.tan(fov / 2);
    v.cam.position.set(0, mid + tall * .5, dist);
    v.cam.lookAt(0, mid * .92, 0);
  };
  v.fit();
  var drag = null;
  el.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, yaw: a.yaw }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', function (e) { if (!drag) return; a.yaw = drag.yaw + (e.clientX - drag.x) * .012; });
  el.addEventListener('pointerup', function () { drag = null; });
  el.addEventListener('pointercancel', function () { drag = null; });
  a.dragging = function () { return !!drag; };
  card.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var x = b.getAttribute('data-a');
    if (x === 'spin') { a.spin = !a.spin; b.setAttribute('aria-pressed', a.spin); return; }
    v.mode = x;
    card.querySelector('[data-a="body"]').setAttribute('aria-pressed', x === 'body');
    card.querySelector('[data-a="head"]').setAttribute('aria-pressed', x === 'head');
    v.fit();
  });
  var entry = { a: a, v: v, vis: true };
  live.push(entry);
  return entry;
}
function ensure(slot) { if (!slot.entry) slot.entry = setup(slot.info, slot.card); return slot.entry; }
ORDER.forEach(function (key) {
  var info = INFO[key];
  var card = document.createElement('article');
  card.className = 'card';
  card.innerHTML =
    '<div class="view" aria-label="' + info.name + ', drag to turn"><span class="hint">Drag to turn</span></div>' +
    '<div class="side"><div class="head"><h3>' + info.name + '</h3><span class="tag">' + info.element + '</span></div>' +
    '<p class="note">' + info.note + '</p><ul class="parts">' + info.parts.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
    '<div class="btns"><button class="ghost" data-a="body" aria-pressed="true">Whole body</button><button class="ghost" data-a="head" aria-pressed="false">Head</button><button class="ghost" data-a="spin" aria-pressed="' + spin + '">Spin</button></div></div>';
  cards.appendChild(card);
  slots.push({ card: card, info: info, entry: null });
});
// each creature is built when its card nears the screen, and drawn only while it is on screen
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (list) {
    list.forEach(function (x) {
      var slot = slots.filter(function (sl) { return sl.card === x.target; })[0];
      if (!slot) return;
      if (x.isIntersecting) ensure(slot).vis = true; else if (slot.entry) slot.entry.vis = false;
    });
  }, { rootMargin: '200px' });
  slots.forEach(function (sl) { io.observe(sl.card); });
} else slots.forEach(ensure);

var clock = new T.Clock(), elapsed = 0;
function frame() {
  var dt = Math.min(.05, clock.getDelta()); elapsed += dt;
  live.forEach(function (e, i) {
    if (!e.vis) return;
    var a = e.a, v = e.v;
    if (a.spin && !a.dragging()) a.yaw += dt * .28;
    a.pivot.rotation.y = a.yaw;
    if (!reduced) a.update(elapsed + i * 1.3);
    if (v.mode === 'head') v.fit();
    v.r.render(v.s, v.cam);
  });
  requestAnimationFrame(frame);
}
frame();
