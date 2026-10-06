// The battle layout, fixed in roadmap 0.2: where the twelve slots stand, where the camera looks from,
// and the size classes that follow from both. The battle preview and the battle scene both read it from here.
import * as T from 'three';

// formation and camera. Slots: front row `front` from the centre line, back row `rowGap` behind it,
// three columns `colGap` apart across the field (z). The camera looks from +z, `elev` degrees above level,
// at height `aim`, and stands back far enough to fit both back rows across the screen; zoom > 1 moves it in.
export var FORMATION = { elev: 30, fov: 26, aim: 3, front: 4.5, rowGap: 6.5, colGap: 6, zoom: 1 };

// size classes, from the formation (solid body: lit parts, no glow, no fx; in scene units):
//   len   length along x. Row gap 6.5: two L creatures one behind the other just touch nose to tail.
//   h     top above the ground. Over 4.0, a creature in a near column starts hiding the feet of the one behind it
//         (9 px at 4.25, 20 px at 4.5, at 720p).
//   dep   depth across the field (z). Column gap 6: at most 4.0 leaves 2 between neighbours.
//   span  flyers only: wingspan, up to the whole lane. lift: flyers only, the lowest point above the ground.
export var CLASSES = {
  S: { len: 3.5, h: 3.5, dep: 3.0 },
  M: { len: 4.5, h: 3.75, dep: 3.5 },
  L: { len: 6.5, h: 4.0, dep: 4.0 },
  F: { len: 4.5, h: 4.25, span: 6.0, lift: .8 }
};

// a slot's place on the field. side 'p' (player, left, facing +x) or 'e' (enemy, right);
// row 0 front, 1 back; col 0 far, 1 middle, 2 near the camera
export function slotPosition(side, row, col, L) {
  L = L || FORMATION;
  return new T.Vector3((side === 'p' ? -1 : 1) * (L.front + row * L.rowGap), 0, (col - 1) * L.colGap);
}

// enemies are mirrored, not turned round, so the camera always sees each creature's +z flank: its show side
export function faceSlot(group, side) {
  group.rotation.y = 0;
  group.scale.set(side === 'e' ? -1 : 1, 1, 1);
}

// the camera for a stage of the given aspect
export function placeCamera(cam, aspect, L) {
  L = L || FORMATION;
  cam.aspect = aspect; cam.fov = L.fov; cam.updateProjectionMatrix();
  var half = L.front + L.rowGap + 3.6, hf = Math.atan(Math.tan(L.fov * Math.PI / 360) * aspect);
  var d = half / Math.tan(hf) / L.zoom, e = L.elev * Math.PI / 180;
  cam.position.set(0, L.aim + d * Math.sin(e), d * Math.cos(e));
  cam.lookAt(0, L.aim, 0);
  cam.updateMatrixWorld();
}

// which limits a creature's solid box breaks, as short strings; empty when it fits its class
export function checkFit(box, cls) {
  var c = CLASSES[cls], s = box.getSize(new T.Vector3()), out = [];
  function f(v) { return v.toFixed(2).replace(/0$/, ''); }
  if (s.x > c.len) out.push('length ' + f(s.x) + ' > ' + c.len);
  if (box.max.y > c.h) out.push('height ' + f(box.max.y) + ' > ' + c.h);
  if (c.dep && s.z > c.dep) out.push('depth ' + f(s.z) + ' > ' + c.dep);
  if (c.span && s.z > c.span) out.push('span ' + f(s.z) + ' > ' + c.span);
  if (c.lift && box.min.y < c.lift) out.push('lift ' + f(box.min.y) + ' < ' + c.lift);
  return out;
}
