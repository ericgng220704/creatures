// Rigs: limbs built as chains of joints, and the standard `rig` object every creature returns, so that
// animation (idle, attack, hit...) can drive any creature by name. Joints are plain Groups that pivot at
// their point; parts hang inside them. Baking still happens once, in the build pose, so a rig costs nothing
// until something turns a joint.
import * as T from 'three';
import { seg } from './parts.js';

// a chain of joints through pts (points in parent space): a Group at each point holding the segment to the
// next, so turning a joint swings everything after it. radii is [r0, r1] per segment. The last joint has no
// segment: it is where the paw, hoof, hand or tail tip goes. Works for legs, arms, necks and tails.
export function limb(parent, pts, radii, look, e) {
  var joints = [];
  pts.forEach(function (p, i) {
    var g = new T.Group(), q = i ? pts[i - 1] : [0, 0, 0];
    g.position.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    (i ? joints[i - 1] : parent).add(g);
    joints.push(g);
  });
  for (var i = 0; i < pts.length - 1; i++) {
    var a = pts[i], b = pts[i + 1];
    seg(joints[i], [0, 0, 0], [b[0] - a[0], b[1] - a[1], b[2] - a[2]], radii[i][0], radii[i][1], look, e);
  }
  return chain(joints);
}

// a chain from Groups a creature already has (wing arm, forearm, hand; trunk joints...)
export function chain(groups) { return { joints: groups, root: groups[0], end: groups[groups.length - 1] }; }

// hang parts that were placed in the chain's parent space on the right joint, keeping where they are: each goes
// to the joint whose segment it is nearest, and anything past the last segment goes to the end joint
var _a = new T.Vector3(), _b = new T.Vector3(), _p = new T.Vector3(), _d = new T.Vector3();
export function bind(ch, objs) {
  var J = ch.joints;
  J[0].updateWorldMatrix(true, true);
  (Array.isArray(objs) ? objs : [objs]).forEach(function (o) {
    o.updateWorldMatrix(true, false);
    _p.setFromMatrixPosition(o.matrixWorld);
    var best = J.length - 1, bd = Infinity;
    for (var i = 0; i < J.length - 1; i++) {
      _a.setFromMatrixPosition(J[i].matrixWorld); _b.setFromMatrixPosition(J[i + 1].matrixWorld);
      _d.subVectors(_b, _a);
      var raw = _d.lengthSq() ? _p.clone().sub(_a).dot(_d) / _d.lengthSq() : 0, t = Math.max(0, Math.min(1, raw));
      var dist = _a.clone().addScaledVector(_d, t).distanceTo(_p);
      if (dist < bd) { bd = dist; best = i === J.length - 2 && raw > 1 ? J.length - 1 : i; }
    }
    J[best].attach(o);
  });
}

// hang parts on one joint, keeping where they are (paws, hooves, claws on the end of a leg)
export function hang(joint, objs) { (Array.isArray(objs) ? objs : [objs]).forEach(function (o) { joint.attach(o); }); }

// the standard rig. Every field is optional except body; missing ones are filled in empty.
//   plan     'quadruped', 'biped', 'flyer' or 'perched': which shared animation clips fit (roadmap 0.4)
//   body     the group that carries the torso (legs usually stay outside it, planted)
//   neck, head, jaw    single joints
//   ears     joints;   tail: joints from root to tip
//   legs     chains by name: fl, fr, bl, br for four legs (front/back, left/right); l, r for two
//   arms     chains: l, r;   wings: chains l, r (arm, forearm, hand)
//   extra    any other chains by name (trunk, antlers, sash tails...)
// Left and right are the creature's own: it faces +x, so its right side is +z, the side the battle camera sees.
// The build pose of every joint is saved as its rest pose (userData.rest), so animation can work as offsets.
export function makeRig(o) {
  var r = {
    plan: o.plan || 'quadruped', body: o.body, neck: o.neck || null, head: o.head || null, jaw: o.jaw || null,
    ears: o.ears || [], tail: o.tail || [], legs: o.legs || {}, arms: o.arms || {}, wings: o.wings || {}, extra: o.extra || {}
  };
  eachJoint(r, function (g) { g.userData.rest = { p: g.position.clone(), q: g.quaternion.clone(), s: g.scale.clone() }; });
  return r;
}

// every joint in a rig once, with a name: body, head, jaw, ear0, tail2, legs.fl.1, wings.r.0, extra.trunk.3...
export function eachJoint(r, fn) {
  var seen = [];
  function visit(g, name) { if (g && seen.indexOf(g) < 0) { seen.push(g); fn(g, name); } }
  visit(r.body, 'body'); visit(r.neck, 'neck'); visit(r.head, 'head'); visit(r.jaw, 'jaw');
  r.ears.forEach(function (g, i) { visit(g, 'ear' + i); });
  r.tail.forEach(function (g, i) { visit(g, 'tail' + i); });
  ['legs', 'arms', 'wings', 'extra'].forEach(function (k) {
    Object.keys(r[k]).forEach(function (n) { r[k][n].joints.forEach(function (g, i) { visit(g, k + '.' + n + '.' + i); }); });
  });
}

// put every joint back in its rest pose
export function restPose(r) {
  eachJoint(r, function (g) { var s = g.userData.rest; g.position.copy(s.p); g.quaternion.copy(s.q); g.scale.copy(s.s); });
}
