// Builds every creature without a browser and prints what it costs (parts, triangles, vertices, build time)
// and whether its solid body fits its battle size class (src/arena/layout.js), and how many meshes it draws as built
// and after optimize() (lights baked, still parts merged; src/kit/compact.js). `--json` for machine output.
import * as T from 'three';

// the glow texture draws on a canvas when the kit loads; a stand-in is enough to build geometry in Node
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }) }) };
const { ORDER, INFO } = await import('../src/creatures/index.js');
const { checkFit } = await import('../src/arena/layout.js');
const { optimize } = await import('../src/kit/compact.js');

const rows = [];
for (const id of ORDER) {
  const t0 = performance.now();
  const a = INFO[id].build();
  const ms = performance.now() - t0;
  let meshes = 0, tris = 0, verts = 0, lights = 0;
  // the solid body, measured as the battle preview does: lit parts, no glow, no noFit fx, at t = 0
  a.update(0); a.root.updateMatrixWorld(true);
  const solid = new T.Box3();
  a.root.traverse(o => { if (o.isMesh && o.userData.look && !o.userData.noFit) solid.union(new T.Box3().setFromObject(o, true)); });
  const fit = checkFit(solid, INFO[id].size);
  a.root.traverse(o => {
    if (o.isLight) lights++;
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    verts += g.attributes.position.count;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  const opt = optimize(INFO[id].build());
  rows.push({ id, name: INFO[id].name, meshes, merged: opt.after.draws, 'shadow casters': opt.after.shadow, triangles: Math.round(tris), vertices: verts, lights, 'build ms': Math.round(ms), class: INFO[id].size, fits: fit.length ? fit.join(', ') : 'yes' });
}
if (process.argv.includes('--json')) console.log(JSON.stringify(rows));
else { console.table(rows); console.log('three r' + T.REVISION); }
