// Small maths helpers: colours, mixing, smooth steps and a seeded random number generator.
import * as T from 'three';

export function C(h) { return new T.Color(h); }

export function mix(a, b, t) { return a.clone().lerp(b, Math.max(0, Math.min(1, t))); }

export function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

export function rng(seed) {
  var a = seed >>> 0;
  return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
