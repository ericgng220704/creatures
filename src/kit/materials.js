// Shared materials, and the glow sprite texture. Parts use vertex colours, baked by finish().
import * as T from 'three';

// ---------- materials ----------
export var MAT = {
  matte: new T.MeshStandardMaterial({ vertexColors: true, roughness: .7, metalness: 0, envMapIntensity: .6 }),
  flat: new T.MeshStandardMaterial({ vertexColors: true, roughness: .74, metalness: 0, flatShading: true, envMapIntensity: .55 }),
  gloss: new T.MeshStandardMaterial({ vertexColors: true, roughness: .26, metalness: 0, envMapIntensity: 1 }),
  leaf: new T.MeshStandardMaterial({ vertexColors: true, roughness: .6, metalness: 0, side: T.DoubleSide, envMapIntensity: .6 }),
  metal: new T.MeshStandardMaterial({ vertexColors: true, roughness: .34, metalness: .85, envMapIntensity: 1.3 }),
  plume: new T.MeshStandardMaterial({ vertexColors: true, roughness: .62, metalness: 0, side: T.DoubleSide, envMapIntensity: .5 }),
  feather: new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, metalness: 0, side: T.DoubleSide, emissive: 0xff5a14, emissiveIntensity: .35, envMapIntensity: .5 })
};

export function glowMat(color, op) {
  var m = new T.MeshBasicMaterial({ color: color, toneMapped: false });
  if (op != null) { m.transparent = true; m.opacity = op; m.depthWrite = false; }
  return m;
}

export function crystalMat(color, glowC) {
  return new T.MeshStandardMaterial({ color: color, emissive: glowC, emissiveIntensity: .6, roughness: .1, metalness: .05, flatShading: true, transparent: true, opacity: .82, envMapIntensity: 1.4 });
}

export var RADIAL = (function () {
  var c = document.createElement('canvas'); c.width = c.height = 128;
  var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new T.CanvasTexture(c);
})();

export function halo(parent, color, size, x, y, z, op) {
  var s = new T.Sprite(new T.SpriteMaterial({ map: RADIAL, color: color, transparent: true, opacity: op || .5, depthWrite: false, toneMapped: false }));
  s.scale.set(size, size, 1); s.position.set(x, y, z); parent.add(s);
  return s;
}
