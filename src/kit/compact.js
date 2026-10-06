// Making a built creature cheap to draw (roadmap 0.5), without changing how it looks:
//
//   bakeLights(a)   bakes each of the creature's own PointLights into its parts, as light the parts give off
//                   (a per-vertex emissive term the shared materials learn to read), and takes the lights out.
//                   Twelve creatures no longer pour twelve coloured lights onto each other, and each pixel
//                   stops paying for them.
//   merge(a)        merges every part that never moves on its own into one mesh per material per joint.
//                   What moves is found by running the creature's update(t) at a few moments and watching:
//                   anything whose transform, material or geometry changes stays separate (eyes that blink,
//                   embers, flames that flicker, orbiting shields...), as do rig joints, sprites and lights.
//   optimize(a)     both, and the draw calls before and after.
//
// Both work on a creature as its builder returned it, before it is placed in a scene.
import * as T from 'three';
import { MAT } from './materials.js';
import { eachJoint, restPose } from './rig.js';

// ---------- the emissive term the lit materials read ----------
// glowLight is a per-vertex colour added to the light a surface gives off; parts without it give off nothing
Object.keys(MAT).forEach(function (k) {
  var m = MAT[k];
  m.defaultAttributeValues = Object.assign({}, m.defaultAttributeValues, { glowLight: [0, 0, 0] });
  m.onBeforeCompile = function (sh) {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 glowLight;\nvarying vec3 vGlowLight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlowLight = glowLight;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGlowLight;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlowLight;');
  };
  m.needsUpdate = true;
});

// ---------- baking the creature's lights ----------
// the diffuse light a three.js PointLight (r158, physically based) would add: albedo x colour x intensity x
// attenuation x cos / pi, from where the light stands in the build pose
export function bakeLights(a) {
  var lights = [];
  a.root.updateMatrixWorld(true);
  a.root.traverse(function (o) { if (o.isPointLight && o.visible) lights.push(o); });
  if (!lights.length) return 0;
  var L = lights.map(function (l) { return { p: new T.Vector3().setFromMatrixPosition(l.matrixWorld), c: l.color.clone().multiplyScalar(l.intensity), dist: l.distance, decay: l.decay }; });
  var p = new T.Vector3(), n = new T.Vector3(), d = new T.Vector3(), nm = new T.Matrix3();
  a.root.traverse(function (m) {
    if (!m.isMesh || !m.userData.look) return;
    var g = m.geometry, P = g.attributes.position, N = g.attributes.normal, Cc = g.attributes.color, out = new Float32Array(P.count * 3);
    nm.getNormalMatrix(m.matrixWorld);
    for (var i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
      n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      var r = 0, gg = 0, b = 0;
      L.forEach(function (l) {
        d.subVectors(l.p, p); var dist = d.length(); d.divideScalar(dist || 1);
        var cos = Math.max(0, n.dot(d)); if (!cos) return;
        var att = 1 / Math.max(Math.pow(dist, l.decay), .01);
        if (l.dist > 0) { var c = Math.max(0, Math.min(1, 1 - Math.pow(dist / l.dist, 4))); att *= c * c; }
        var k = att * cos / Math.PI; r += l.c.r * k; gg += l.c.g * k; b += l.c.b * k;
      });
      out[i * 3] = Cc.getX(i) * r; out[i * 3 + 1] = Cc.getY(i) * gg; out[i * 3 + 2] = Cc.getZ(i) * b;
    }
    g.setAttribute('glowLight', new T.BufferAttribute(out, 3));
  });
  lights.forEach(function (l) { l.parent.remove(l); });   // update(t) may still set their intensity; it no longer matters
  a.lightsBaked = lights.length;
  return lights.length;
}

// ---------- finding what moves ----------
function state(o) {
  var s = o.position.toArray().concat(o.quaternion.toArray(), o.scale.toArray(), [o.visible ? 1 : 0]);
  if (o.material) { var m = o.material; s.push(m.opacity, m.emissiveIntensity || 0, m.color ? m.color.getHex() : 0); }
  if (o.geometry && o.geometry.attributes.position) s.push(o.geometry.attributes.position.version);
  return s;
}
function liveSet(a) {
  var objs = [], first = [], live = new Set();
  a.root.traverse(function (o) { objs.push(o); });
  [0, .41, 1.3, 2.23, 3.71, 4.75, 6.2].forEach(function (t, i) {
    if (a.rig) restPose(a.rig);
    a.update(t);
    objs.forEach(function (o, j) {
      var s = state(o);
      if (!i) first[j] = s;
      else if (!live.has(o) && s.some(function (v, q) { return Math.abs(v - first[j][q]) > 1e-6; })) live.add(o);
    });
  });
  if (a.rig) restPose(a.rig);
  a.update(0);
  return live;
}

// ---------- merging ----------
function matKey(m) {
  if (m.isMeshBasicMaterial && !m.map && !m.vertexColors) return 'glow|' + (m.transparent ? m.opacity : 1) + '|' + m.side + '|' + m.depthWrite + '|' + m.depthTest + '|' + m.toneMapped;
  return 'mat|' + m.uuid;
}
export function merge(a) {
  var live = liveSet(a), hosts = new Set([a.root]);
  if (a.rig) eachJoint(a.rig, function (g) { hosts.add(g); });
  live.forEach(function (o) { hosts.add(o); });
  a.root.updateMatrixWorld(true);
  var buckets = {};
  a.root.traverse(function (m) {
    if (!m.isMesh || live.has(m) || m.userData.noMerge) return;
    var host = m.parent; while (!hosts.has(host)) host = host.parent;
    var key = host.uuid + '|' + matKey(m.material) + '|' + (m.userData.noFit ? 1 : 0) + '|' + (m.castShadow ? 1 : 0) + '|' + m.renderOrder;
    (buckets[key] = buckets[key] || { host: host, list: [] }).list.push(m);
  });
  var made = 0;
  Object.keys(buckets).forEach(function (k) {
    var bk = buckets[k], list = bk.list;
    if (list.length < 2) return;
    var inv = new T.Matrix4().copy(bk.host.matrixWorld).invert(), glow = matKey(list[0].material).indexOf('glow') === 0;
    var lit = !!list[0].userData.look, names = glow ? ['position', 'color'] : lit ? ['position', 'normal', 'color'] : ['position', 'normal'];
    if (lit && list.every(function (m) { return m.geometry.attributes.glowLight; })) names.push('glowLight');
    var arrays = {}, index = [], base = 0;
    names.forEach(function (nme) { arrays[nme] = []; });
    list.forEach(function (m) {
      var g = m.geometry.clone();
      g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      if (!g.attributes.normal && names.indexOf('normal') >= 0) g.computeVertexNormals();
      var cnt = g.attributes.position.count;
      names.forEach(function (nme) {
        var at = g.attributes[nme];
        if (nme === 'color' && glow) { var c = m.material.color; for (var i = 0; i < cnt; i++) arrays.color.push(c.r, c.g, c.b); return; }
        for (var j = 0; j < cnt; j++) for (var q = 0; q < at.itemSize; q++) arrays[nme].push(at.array[j * at.itemSize + q]);
      });
      if (g.index) for (var x = 0; x < g.index.count; x++) index.push(g.index.getX(x) + base);
      else for (var y = 0; y < cnt; y++) index.push(y + base);
      base += cnt;
    });
    var geo = new T.BufferGeometry();
    names.forEach(function (nme) { geo.setAttribute(nme, new T.Float32BufferAttribute(arrays[nme], nme === 'position' || nme === 'normal' || nme === 'color' || nme === 'glowLight' ? 3 : 1)); });
    geo.setIndex(index);
    var mat = list[0].material;
    if (glow) { mat = list[0].material.clone(); mat.color.set(0xffffff); mat.vertexColors = true; }
    var out = new T.Mesh(geo, mat);
    out.castShadow = list[0].castShadow; out.receiveShadow = list[0].receiveShadow; out.renderOrder = list[0].renderOrder;
    out.userData = { look: list[0].userData.look, noFit: list[0].userData.noFit, merged: list.length };
    bk.host.add(out);
    list.forEach(function (m) { m.parent.remove(m); m.geometry.dispose(); if (glow) m.material.dispose(); });
    made++;
  });
  return made;
}

// draw calls a creature costs: meshes and sprites (each lit, shadow-casting mesh costs one more in the shadow pass)
export function drawCalls(a) {
  var n = 0, sh = 0;
  a.root.traverse(function (o) { if ((o.isMesh || o.isSprite) && o.visible) { n++; if (o.castShadow) sh++; } });
  return { draws: n, shadow: sh };
}

export function optimize(a, opts) {
  opts = opts || {};
  var before = drawCalls(a);
  if (opts.bake !== false) bakeLights(a);
  merge(a);
  var after = drawCalls(a);
  a.optimized = { before: before, after: after };
  return a.optimized;
}
