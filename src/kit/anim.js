// Animation clips (roadmap 0.4): poses driven by the battle's state, not only by time.
//
// A clip is data: keyframe tracks over normalised time k (0 to 1), a duration in seconds, an impact moment
// (when the blow lands, so the battle can start the target's hit), and a travel track (0 at home, 1 at the
// target) that the battle uses to move the creature's slot. Channels are offsets from the rig's rest pose:
//
//   body.x, body.y      the body's shift (scaled to the creature's size); body.pitch (+ nose up), body.roll
//   head.pitch, head.turn (shared half and half with the neck when there is one), neck.pitch (the neck alone), jaw.open, ears.back, tail.curl (+ tip up), tail.side
//   front.x, front.y, back.x, back.y    foot targets for the front and hind pairs (+x forward, +y up);
//                                       fl.x, fr.y... add to one leg. Feet stay planted unless moved.
//   arms.r.swing, arms.l.swing (+ forward and up), arms.r.stretch, arms.l.stretch (1 + this along the arm)
//   wings.lift (+ up), wings.beat (flap size), wings.rate (flaps a second), trunk.curl
//   shake               a fast tremble of the body, for wind-ups
//
// The idle is not a clip: it is the creature's own update(t), which also runs every flame, mote and blink.
// A clip is laid over it after update(t), blending in and out so nothing pops.
import * as T from 'three';
import { eachJoint } from './rig.js';

// ---------- tracks ----------
// a track is a number or [[k, value, ease?], ...]; ease is 'in', 'out', 'lin' or smooth (the default)
export function sample(track, k) {
  if (track == null) return 0;
  if (typeof track === 'number') return track;
  if (k <= track[0][0]) return track[0][1];
  for (var i = 1; i < track.length; i++) {
    var b = track[i];
    if (k <= b[0]) {
      var a = track[i - 1], t = (k - a[0]) / ((b[0] - a[0]) || 1), e = b[2];
      t = e === 'in' ? t * t : e === 'out' ? 1 - (1 - t) * (1 - t) : e === 'lin' ? t : t * t * (3 - 2 * t);
      return a[1] + (b[1] - a[1]) * t;
    }
  }
  return track[track.length - 1][1];
}

// ---------- the shared clips ----------
// tracks every plan uses; each plan adds its own (feet for quadrupeds, arms for bipeds, wings for flyers)
var BASE = {
  attack: { dur: 1.0, impact: .48, travel: [[0, 0], [.28, 0], [.48, 1, 'in'], [.62, 1], [.95, 0]], tracks: {
    'body.x': [[0, 0], [.25, -.18], [.45, .15], [.6, 0]],
    'body.y': [[0, 0], [.25, -.18], [.36, .25], [.48, .05], [.56, -.05], [.75, .12], [.9, 0]],
    'body.pitch': [[0, 0], [.25, .1], [.38, -.12], [.48, -.18], [.6, .05], [.85, 0]],
    'head.pitch': [[0, 0], [.25, .15], [.4, .12], [.48, -.35, 'in'], [.58, -.1], [.8, 0]],
    'jaw.open': [[0, 0], [.25, .05], [.42, .55], [.5, 0, 'in'], [.6, .15], [.8, 0]],
    'ears.back': [[0, 0], [.25, .5], [.65, .5], [.9, 0]],
    'tail.curl': [[0, 0], [.25, .45], [.45, -.25], [.7, .1], [1, 0]]
  } },
  ultimate: { dur: 2.0, impact: .62, travel: [[0, 0], [.42, 0], [.6, 1, 'in'], [.72, 1], [.95, 0]], tracks: {
    'shake': [[0, 0], [.08, 1], [.4, 1], [.42, 0]],
    'body.x': [[0, 0], [.35, -.25], [.5, .1], [.62, .25], [.75, 0]],
    'body.y': [[0, 0], [.35, -.3], [.42, -.32], [.52, .9, 'out'], [.6, .2, 'in'], [.66, -.12], [.78, .3], [.92, 0]],
    'body.pitch': [[0, 0], [.35, .05], [.45, .25], [.55, -.25], [.62, -.3], [.74, 0]],
    'head.pitch': [[0, 0], [.35, -.25], [.45, .3], [.58, .2], [.62, -.45, 'in'], [.76, 0]],
    'jaw.open': [[0, 0], [.3, .3], [.4, .3], [.55, .7], [.62, 0, 'in'], [.7, .2], [.85, 0]],
    'ears.back': [[0, 0], [.2, .7], [.8, .7], [1, 0]],
    'tail.curl': [[0, 0], [.35, .6], [.5, -.35], [.7, .1], [1, 0]]
  } },
  hit: { dur: .55, tracks: {
    'body.x': [[0, 0], [.15, -.3, 'out'], [.5, -.1], [1, 0]],
    'body.y': [[0, 0], [.15, .05], [.4, -.08], [.8, 0]],
    'body.pitch': [[0, 0], [.15, .18], [.6, 0]],
    'head.pitch': [[0, 0], [.12, .3], [.5, 0]],
    'jaw.open': [[0, 0], [.12, .35], [.6, 0]],
    'ears.back': [[0, 0], [.1, .6], [.8, 0]],
    'tail.curl': [[0, 0], [.15, -.3], [.7, 0]]
  } },
  faint: { dur: 1.3, hold: true, tracks: {
    'body.y': [[0, 0], [.15, .1], [.65, -.55, 'in'], [.75, -.5], [.85, -.55]],
    'body.pitch': [[0, 0], [.2, .12], [.7, -.08]],
    'body.roll': [[0, 0], [.35, 0], [.8, .22]],
    'head.pitch': [[0, 0], [.15, .25], [.75, -.6]],
    'jaw.open': [[0, 0], [.15, .3], [.75, .1]],
    'ears.back': [[0, 0], [.2, .7]],
    'tail.curl': [[0, 0], [.7, -.5]]
  } },
  victory: { dur: 1.8, tracks: {
    'body.x': [[0, 0], [.3, -.2], [.75, -.2], [1, 0]],
    'body.y': [[0, 0], [.3, .12], [.75, .12], [1, 0]],
    'body.pitch': [[0, 0], [.3, .35], [.75, .35], [1, 0]],
    'head.pitch': [[0, 0], [.3, .5], [.75, .55], [1, 0]],
    'jaw.open': [[0, 0], [.3, .5], [.75, .5], [1, 0]],
    'ears.back': [[0, 0], [.3, -.2], [.75, -.2], [1, 0]],
    'tail.curl': [[0, 0], [.3, .6], [.75, .6], [1, 0]]
  } }
};
var PLAN = {
  quadruped: {
    attack: {
      'front.x': [[0, 0], [.25, -.05], [.3, 0], [.4, .45], [.48, .35], [.55, 0]], 'front.y': [[0, 0], [.3, 0], [.4, .35], [.47, .15], [.52, 0]],
      'back.x': [[0, 0], [.3, 0], [.4, -.35], [.5, 0]], 'back.y': [[0, 0], [.35, 0], [.42, .15], [.5, 0]]
    },
    ultimate: {
      'front.x': [[0, 0], [.42, -.1], [.5, .5], [.6, .4], [.66, 0]], 'front.y': [[0, 0], [.45, 0], [.52, .6], [.6, .2], [.64, 0]],
      'back.x': [[0, 0], [.45, 0], [.52, -.5], [.62, 0]], 'back.y': [[0, 0], [.47, 0], [.53, .3], [.62, 0]]
    },
    hit: { 'front.x': [[0, 0], [.2, -.12], [.6, 0]] },
    victory: { 'front.x': [[0, 0], [.3, .1], [.75, .1], [1, 0]], 'front.y': [[0, 0], [.3, .55], [.75, .55], [1, 0]] }
  },
  biped: {
    attack: { 'arms.r.swing': [[0, 0], [.25, -.4], [.45, .25], [.6, 0]], 'arms.r.stretch': [[0, 0], [.25, -.15], [.46, .4, 'in'], [.6, .1], [.8, 0]], 'arms.l.swing': [[0, 0], [.25, .2], [.6, 0]] },
    ultimate: { 'arms.r.swing': [[0, 0], [.4, -.6], [.6, .3], [.75, 0]], 'arms.r.stretch': [[0, 0], [.4, -.2], [.62, .6, 'in'], [.8, 0]], 'arms.l.swing': [[0, 0], [.4, .5], [.62, .3], [.8, 0]] },
    victory: { 'arms.r.swing': [[0, 0], [.3, 1.0], [.75, 1.0], [1, 0]], 'arms.l.swing': [[0, 0], [.3, .8], [.75, .8], [1, 0]] }
  },
  flyer: {
    attack: {
      'wings.lift': [[0, 0], [.28, .6], [.4, -.35], [.55, -.2], [.8, 0]], 'wings.beat': [[0, .25], [.25, .1], [.4, 0], [.6, .3], [1, .25]], 'wings.rate': 1.4,
      'body.y': [[0, 0], [.25, .35], [.48, -.55, 'in'], [.62, -.2], [.9, 0]], 'body.pitch': [[0, 0], [.25, .25], [.42, -.45], [.55, -.2], [.8, 0]]
    },
    ultimate: {
      'wings.lift': [[0, 0], [.4, .8], [.55, -.4], [.7, -.1], [1, 0]], 'wings.beat': [[0, .25], [.1, .45], [.4, .45], [.5, 0], [.7, .35], [1, .25]], 'wings.rate': 1.8,
      'body.y': [[0, 0], [.4, .7], [.62, -.6, 'in'], [.75, -.2], [.95, 0]], 'body.pitch': [[0, 0], [.4, .35], [.58, -.55], [.7, -.2], [.9, 0]]
    },
    hit: { 'wings.lift': [[0, 0], [.12, .5], [.7, 0]], 'wings.beat': [[0, .25], [.2, .1], [1, .25]] },
    faint: { 'wings.lift': [[0, 0], [.6, -.5]], 'wings.beat': [[0, .25], [.3, .05], [1, 0]], 'body.y': [[0, 0], [.2, .15], [.9, -1.1, 'in']] },
    victory: { 'wings.lift': [[0, 0], [.3, .7], [.75, .7], [1, 0]], 'wings.beat': [[0, .25], [.3, .45], [1, .25]], 'body.y': [[0, 0], [.3, .4], [.75, .4], [1, 0]] }
  },
  perched: {}
};
export var CLIP_NAMES = ['attack', 'ultimate', 'hit', 'faint', 'victory'];

// the clip a creature plays: the shared one for its plan, with any of its own tracks laid over it
export function clipFor(a, name) {
  var base = BASE[name], plan = (PLAN[a.rig.plan] || {})[name] || {}, own = (a.clips || {})[name] || {}, tracks = {};
  [base.tracks, plan, own.tracks || {}].forEach(function (src) { Object.keys(src).forEach(function (c) { tracks[c] = src[c]; }); });
  return {
    name: name, dur: own.dur || base.dur, impact: own.impact != null ? own.impact : base.impact, hold: !!base.hold,
    travel: own.travel || base.travel || 0, tracks: tracks
  };
}

// ---------- posing ----------
var _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _m = new T.Matrix4(), _mi = new T.Matrix4();
function turn(g, x, y, z) { _q.setFromEuler(_e.set(x, y, z)); g.quaternion.copy(g.userData.rest.q).multiply(_q); }
function wrap(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

// what posing needs that does not change: the body's pivot and size, the leg chains that stand outside the body
function prep(a) {
  var r = a.rig;
  if (r._anim) return r._anim;
  var inBody = function (g) { for (var p = g.parent; p; p = p.parent) if (p === r.body) return true; return false; };
  var legs = Object.keys(r.legs).map(function (n) { return { name: n, ch: r.legs[n] }; }).filter(function (l) { return l.ch.ik && !inBody(l.ch.root); });
  var rb = r.body.userData.rest;
  r._anim = { legs: legs, restM: new T.Matrix4().compose(rb.p, rb.q, rb.s), s: r.scale || 1, pivot: r.pivot || new T.Vector3() };
  return r._anim;
}

// two-bone planar IK in the chain's parent space (x, y): which way to turn the root and the middle joint so that
// the chain reaches from hip to target, bending the same way it bends at rest
function twoBone(A, B, C, hip, tgt) {
  var l1 = Math.hypot(B[0] - A[0], B[1] - A[1]), l2 = Math.hypot(C[0] - B[0], C[1] - B[1]);
  var dx = tgt[0] - hip[0], dy = tgt[1] - hip[1], d = Math.min(l1 + l2 - 1e-4, Math.max(Math.abs(l1 - l2) + 1e-4, Math.hypot(dx, dy)));
  var phi = Math.atan2(dy, dx), al = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  var restSide = (B[0] - A[0]) * (C[1] - B[1]) - (B[1] - A[1]) * (C[0] - B[0]);
  var u = phi + al, kx = hip[0] + l1 * Math.cos(u), ky = hip[1] + l1 * Math.sin(u);
  if (((kx - hip[0]) * (tgt[1] - ky) - (ky - hip[1]) * (tgt[0] - kx)) * restSide < 0) { u = phi - al; kx = hip[0] + l1 * Math.cos(u); ky = hip[1] + l1 * Math.sin(u); }
  var v = Math.atan2(tgt[1] - ky, tgt[0] - kx), a0 = Math.atan2(B[1] - A[1], B[0] - A[0]), a1 = Math.atan2(C[1] - B[1], C[0] - B[0]);
  return [wrap(u - a0), wrap((v - u) - (a1 - a0))];
}

// pose a creature from a clip at time k (0 to 1), over whatever update(t) left, with weight w (0 to 1)
export function applyClip(a, clip, k, w, time) {
  var r = a.rig, P = prep(a), s = P.s, tr = clip.tracks;
  function ch(c) { return sample(tr[c], k); }
  // what update(t) left, to blend from
  var snap = [];
  if (w < 1) eachJoint(r, function (g) { snap.push([g, g.position.clone(), g.quaternion.clone(), g.scale.clone()]); });
  eachJoint(r, function (g) { var q = g.userData.rest; g.position.copy(q.p); g.quaternion.copy(q.q); g.scale.copy(q.s); });

  // the body turns about its pivot and shifts
  var b = r.body, pitch = ch('body.pitch'), roll = ch('body.roll'), shake = ch('shake') * .03 * s;
  _q.setFromEuler(_e.set(roll, 0, pitch));
  b.quaternion.copy(b.userData.rest.q).premultiply(_q);
  _v.copy(b.userData.rest.p).sub(P.pivot).applyQuaternion(_q).add(P.pivot);
  b.position.set(_v.x + ch('body.x') * s + Math.sin(time * 70) * shake, _v.y + ch('body.y') * s, _v.z + Math.sin(time * 53) * shake * .6);
  // with a neck joint, the neck takes half of every head pitch and turn, so the head arcs instead of tipping
  var hp = ch('head.pitch'), ht = ch('head.turn'), nk = r.neck ? .5 : 0;
  if (r.neck) turn(r.neck, 0, ht * nk, ch('neck.pitch') + hp * nk);
  if (r.head) turn(r.head, 0, ht * (1 - nk), hp * (1 - nk));
  if (r.jaw) turn(r.jaw, 0, 0, -ch('jaw.open'));
  r.ears.forEach(function (g) { turn(g, 0, 0, ch('ears.back')); });
  var nt = r.tail.length, curl = ch('tail.curl'), side = ch('tail.side');
  r.tail.forEach(function (g) { turn(g, 0, side / nt, -curl / nt); });
  if (r.extra.trunk) { var tj = r.extra.trunk.joints; tj.forEach(function (g) { turn(g, 0, 0, ch('trunk.curl') / tj.length); }); }
  ['r', 'l'].forEach(function (sd) {
    var arm = r.arms[sd];
    if (arm) { turn(arm.root, 0, 0, ch('arms.' + sd + '.swing')); arm.root.scale.x = arm.root.userData.rest.s.x * (1 + ch('arms.' + sd + '.stretch')); }
    var wg = r.wings[sd];
    if (wg) {
      var amp = ch('wings.beat'), sp = time * Math.PI * 2 * (ch('wings.rate') || 1.2), lift = ch('wings.lift'), J = wg.joints, sg = sd === 'r' ? -1 : 1;
      turn(J[0], sg * (Math.sin(sp) * amp + amp * .2 + lift), 0, 0);
      if (J[1]) turn(J[1], -Math.sin(sp - .5) * amp * .6, 0, 0);
      if (J[2]) turn(J[2], -Math.sin(sp - 1) * amp * .9, 0, 0);
    }
  });

  // legs outside the body: hips ride with the body, feet stay planted unless the clip moves them
  if (P.legs.length) {
    b.updateMatrix();
    _m.copy(b.matrix).multiply(_mi.copy(P.restM).invert());
    P.legs.forEach(function (l) {
      var c = l.ch, pts = c.pts, J = c.joints, n = pts.length, par = c.root.parent, front = l.name.charAt(0) === 'f';
      par.updateMatrix();
      var hipV = new T.Vector3(pts[0][0], pts[0][1], pts[0][2]).applyMatrix4(par.matrix).applyMatrix4(_m).applyMatrix4(_mi.copy(par.matrix).invert());
      var pre = front ? 'front' : 'back';
      var fx = pts[n - 1][0] + (ch(pre + '.x') + ch(l.name + '.x')) * s, fy = pts[n - 1][1] + (ch(pre + '.y') + ch(l.name + '.y')) * s;
      // with three segments, the last one (hock to foot) keeps its rest slope
      var C = n >= 4 ? pts[2] : pts[n - 1], tgt = n >= 4 ? [fx - (pts[3][0] - pts[2][0]), fy - (pts[3][1] - pts[2][1])] : [fx, fy];
      var th = twoBone(pts[0], pts[1], C, [hipV.x, hipV.y], tgt);
      J[0].position.set(J[0].userData.rest.p.x + hipV.x - pts[0][0], J[0].userData.rest.p.y + hipV.y - pts[0][1], J[0].userData.rest.p.z);
      turn(J[0], 0, 0, th[0]); turn(J[1], 0, 0, th[1]);
      if (J[2]) turn(J[2], 0, 0, -(th[0] + th[1]));   // keeps the paw, or the hock-to-foot segment, as it was
    });
  }

  // blend in from what update(t) left
  if (w < 1) snap.forEach(function (sn) {
    var g = sn[0];
    g.position.lerpVectors(sn[1], g.position, w); g.quaternion.slerpQuaternions(sn[2], g.quaternion.clone(), w); g.scale.lerpVectors(sn[3], g.scale, w);
  });
}

// a clip's weight at k: it blends in over the first few percent, and out over the last unless it holds
export function clipWeight(clip, k) {
  var t = Math.min(1, k / .06);
  if (!clip.hold) t = Math.min(t, (1 - k) / .08);
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}
