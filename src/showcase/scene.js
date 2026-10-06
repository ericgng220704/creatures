import * as T from 'three';
import { C, mix, sstep } from '../kit/math.js';
import { RADIAL } from '../kit/materials.js';

export function envFor(renderer) {
  var pm = new T.PMREMGenerator(renderer), sc = new T.Scene();
  var g = new T.SphereGeometry(20, 32, 16), p = g.attributes.position, col = new Float32Array(p.count * 3), top = C('#eef3ff'), bot = C('#4a4038');
  for (var i = 0; i < p.count; i++) { var t = sstep(-8, 14, p.getY(i)), c = mix(bot, top, t); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new T.BufferAttribute(col, 3));
  sc.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
  function panel(x, y, z, w, h, rr, gg, bb) { var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(rr, gg, bb), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); }
  panel(8, 12, 10, 10, 6, 4, 3.8, 3.5);
  panel(-12, 6, -10, 8, 10, 1.6, 2.2, 3);
  panel(0, 3, 16, 14, 4, 1, 1, 1);
  var tex = pm.fromScene(sc, .03).texture;
  pm.dispose();
  return tex;
}
export function makeView(el) {
  var r = new T.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
  r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.outputColorSpace = T.SRGBColorSpace;
  el.appendChild(r.domElement);
  var s = new T.Scene();
  s.environment = envFor(r);
  s.add(new T.HemisphereLight(0xe6edff, 0x4a3d34, .55));
  var key = new T.DirectionalLight(0xfff0dc, 2.3);
  key.position.set(4, 9, 7); key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  var sc = key.shadow.camera; sc.left = -3.5; sc.right = 3.5; sc.top = 3.5; sc.bottom = -3.5; sc.near = .5; sc.far = 30;
  key.shadow.bias = -.0004; key.shadow.normalBias = .015;
  s.add(key);
  var rim = new T.DirectionalLight(0xbad8ff, 1.5); rim.position.set(-6, 5, -7); s.add(rim);
  var ground = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: .28 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  var cam = new T.PerspectiveCamera(26, 16 / 11, .05, 100);
  var view = { r: r, s: s, cam: cam, el: el, mode: 'body' };
  function size() { var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (view.fit) view.fit(); }
  new ResizeObserver(size).observe(el);
  size();
  return view;
}
export function contactShadow(scene, w, d) {
  var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: RADIAL, color: 0x000000, transparent: true, opacity: .32, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = .004; scene.add(m);
}
