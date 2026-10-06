// Builds every creature without a browser and prints what it costs: parts, triangles, vertices, build time.
// Useful when deciding how many creatures a scene can hold, and which to bake into sprites.
import * as T from 'three';

// the glow texture draws on a canvas when the kit loads; a stand-in is enough to build geometry in Node
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }) }) };
const { ORDER, INFO } = await import('../src/creatures/index.js');

const rows = [];
for (const id of ORDER) {
  const t0 = performance.now();
  const a = INFO[id].build();
  const ms = performance.now() - t0;
  let meshes = 0, tris = 0, verts = 0, lights = 0;
  a.root.traverse(o => {
    if (o.isLight) lights++;
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    verts += g.attributes.position.count;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  rows.push({ id, name: INFO[id].name, meshes, triangles: Math.round(tris), vertices: verts, lights, 'build ms': Math.round(ms) });
}
if (process.argv.includes('--json')) console.log(JSON.stringify(rows));
else { console.table(rows); console.log('three r' + T.REVISION); }
