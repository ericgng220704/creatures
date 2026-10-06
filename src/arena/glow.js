// Selective bloom (roadmap 0.6): a soft halo round the unlit glow parts only (flames, eyes, runes, crystals).
// The scene is drawn to the screen exactly as before; then a second pass draws it again with every other surface
// black (so bodies still hide the glow behind them), blurs that with UnrealBloomPass, and adds it on top.
import * as T from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// what glows: unlit meshes that skip tone mapping (glow() and glowMat() in the kit, merged or not), and crystals
function glows(o) {
  var m = o.material;
  if (!m || o.userData.noBloom) return false;
  return (m.isMeshBasicMaterial && m.toneMapped === false) || (m.isMeshStandardMaterial && m.emissiveIntensity > 0 && m.transparent && !m.vertexColors);
}

export function makeBloom(r, scene, cam, opts) {
  opts = opts || {};
  var size = r.getSize(new T.Vector2()), rt = new T.WebGLRenderTarget(size.x, size.y, { type: T.HalfFloatType });
  var comp = new EffectComposer(r, rt);
  comp.renderToScreen = false;
  comp.addPass(new RenderPass(scene, cam));
  var pass = new UnrealBloomPass(size, opts.strength || .5, opts.radius || .35, 0);
  comp.addPass(pass);
  var BLACK = new T.MeshBasicMaterial({ color: 0x000000, side: T.DoubleSide }), swapped = [], hidden = [];
  // the blurred glow, added over the finished frame as it is: lifting it to sRGB would turn faint haze into fog
  var quad = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
    uniforms: { tex: { value: null }, gain: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'uniform sampler2D tex; uniform float gain; varying vec2 vUv; void main() { gl_FragColor = vec4(max(texture2D(tex, vUv).rgb * gain, 0.0), 1.0); }',
    blending: T.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true
  }));
  var qScene = new T.Scene(), qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  qScene.add(quad); quad.frustumCulled = false;
  var api = {
    on: true, pass: pass,
    setSize: function (w, h) { comp.setSize(w, h); },
    render: function () {
      if (!api.on) return;
      // everything that does not glow goes black, sprites and the background go away
      scene.traverse(function (o) {
        if (o.isSprite || o.isLine || o.isLineSegments) { if (o.visible) { hidden.push(o); o.visible = false; } }
        else if (o.isMesh && !glows(o)) { swapped.push([o, o.material]); o.material = BLACK; }
      });
      var bg = scene.background, ov = scene.overrideMaterial, sh = r.shadowMap.autoUpdate;
      scene.background = null; scene.overrideMaterial = null; r.shadowMap.autoUpdate = false;
      comp.render();
      swapped.forEach(function (s) { s[0].material = s[1]; }); swapped.length = 0;
      hidden.forEach(function (o) { o.visible = true; }); hidden.length = 0;
      scene.background = bg; scene.overrideMaterial = ov; r.shadowMap.autoUpdate = sh;
      // the pass leaves the blur alone (before it adds it to its input) in its first horizontal target
      quad.material.uniforms.tex.value = pass.renderTargetsHorizontal[0].texture;
      var ac = r.autoClear; r.autoClear = false; r.render(qScene, qCam); r.autoClear = ac;
    }
  };
  return api;
}
