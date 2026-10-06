// The battle stage: one renderer, one scene, the stadium field and the lights. The camera is placed by layout.js.
import * as T from 'three';
import { RADIAL } from '../kit/materials.js';
import { envFor } from '../showcase/scene.js';
import { makeBloom } from './glow.js';

export var FIELD = { w: 46, d: 28, playW: 40, playD: 22 };

// the field drawn once on a canvas: a teal surround, a sand pitch, white lines and the centre circle
function fieldTexture() {
  var px = 48, W = FIELD.w * px, D = FIELD.d * px, c = document.createElement('canvas');
  c.width = W; c.height = D;
  var x = c.getContext('2d'), cx = W / 2, cy = D / 2, pw = FIELD.playW * px, pd = FIELD.playD * px;
  x.fillStyle = '#2b6c72'; x.fillRect(0, 0, W, D);
  var g = x.createRadialGradient(cx, cy, 20, cx, cy, pw * .6);
  g.addColorStop(0, '#e2cfa3'); g.addColorStop(1, '#c4ab7c');
  x.fillStyle = g; x.fillRect(cx - pw / 2, cy - pd / 2, pw, pd);
  // faint mowing bands across the pitch
  x.fillStyle = 'rgba(255,255,255,.035)';
  for (var b = 0; b < 10; b += 2) x.fillRect(cx - pw / 2 + b * pw / 10, cy - pd / 2, pw / 10, pd);
  x.strokeStyle = 'rgba(255,255,255,.88)'; x.lineWidth = .14 * px;
  x.strokeRect(cx - pw / 2, cy - pd / 2, pw, pd);
  x.beginPath(); x.moveTo(cx, cy - pd / 2); x.lineTo(cx, cy + pd / 2); x.stroke();
  x.beginPath(); x.arc(cx, cy, 3.4 * px, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.arc(cx, cy, 1.1 * px, 0, Math.PI * 2); x.stroke();
  // a band of teal paint round the pitch, as in the reference
  x.strokeStyle = 'rgba(16,52,58,.55)'; x.lineWidth = .5 * px;
  x.strokeRect(cx - pw / 2 - .8 * px, cy - pd / 2 - .8 * px, pw + 1.6 * px, pd + 1.6 * px);
  var t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// stands behind the pitch: stepped tiers, a wall and a row of floodlights; cheap boxes and sprites
function backdrop() {
  var g = new T.Group(), z0 = -FIELD.d / 2;
  var tiers = [['#1d3354', 1.2], ['#182b48', 3.0], ['#14243d', 5.2], ['#101d33', 7.8]];
  tiers.forEach(function (tr, i) {
    var m = new T.Mesh(new T.BoxGeometry(80, tr[1], 3), new T.MeshStandardMaterial({ color: tr[0], roughness: .9 }));
    m.position.set(0, tr[1] / 2, z0 - 1.5 - i * 3); g.add(m);
  });
  var lip = new T.Mesh(new T.BoxGeometry(80, .25, .3), new T.MeshBasicMaterial({ color: '#7fd8ff', toneMapped: false }));
  lip.position.set(0, 1.25, z0 - .05); lip.userData.noBloom = true; g.add(lip);
  for (var i = 0; i < 9; i++) {
    var s = new T.Sprite(new T.SpriteMaterial({ map: RADIAL, color: '#cfe6ff', transparent: true, opacity: .55, depthWrite: false, toneMapped: false }));
    s.scale.set(4, 4, 1); s.position.set(-32 + i * 8, 13, z0 - 12); g.add(s);
  }
  return g;
}

export function makeStage(el) {
  var r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
  r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.outputColorSpace = T.SRGBColorSpace;
  el.appendChild(r.domElement);
  var s = new T.Scene();
  s.environment = envFor(r);
  // the battle light (roadmap 0.6), the same for both teams: the key stands high over the camera's side of the
  // centre line, so player and enemy faces are lit alike; the rim comes from straight behind, edging every top line;
  // the sky fill keeps dark bodies from going black. One shadow, tight round the formation.
  s.add(new T.HemisphereLight(0xe6edff, 0x4a3d34, .65));
  var key = new T.DirectionalLight(0xfff0dc, 2.3);
  key.position.set(1.5, 22, 12); key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  var sc = key.shadow.camera; sc.left = -19; sc.right = 19; sc.top = 12; sc.bottom = -12; sc.near = 4; sc.far = 50;
  key.shadow.bias = -.0004; key.shadow.normalBias = .025;
  s.add(key);
  var rim = new T.DirectionalLight(0xbad8ff, 1.7); rim.position.set(0, 9, -14); s.add(rim);
  var field = new T.Mesh(new T.PlaneGeometry(FIELD.w, FIELD.d), new T.MeshStandardMaterial({ map: fieldTexture(), roughness: .95, envMapIntensity: .4 }));
  field.rotation.x = -Math.PI / 2; field.receiveShadow = true; s.add(field);
  var back = backdrop(); s.add(back);
  var cam = new T.PerspectiveCamera(28, 16 / 9, .1, 300);
  var bloom = makeBloom(r, s, cam);
  return { r: r, s: s, cam: cam, field: field, back: back, key: key, rim: rim, bloom: bloom };
}
