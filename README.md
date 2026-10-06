# Creatures

Eleven procedural 3D creatures, drawn entirely in code with [three.js](https://threejs.org). No models, no textures, no art files: every body is built from sculpted blobs, tubes, feathers and locks of fur, coloured by functions, and lit with baked contact shading. They were designed in a conversation as a single-page "creature sheet", and this repo is that code moved into a project of its own, to build a game on.

## Run it

```bash
npm install
npm run dev        # the sheet, at http://localhost:5173
npm run build      # a static build in dist/
npm run stats      # what each creature costs, with no browser
npm run render     # a PNG of every creature in renders/ (needs a browser, see below)
```

The sheet shows each creature on a turntable. Drag to turn it, **Head** shows the face close up, **Spin** stops the turning. A creature is built when its card nears the screen and drawn only while it is visible.

## The creatures

| Creature | Id | Element | Parts | Triangles | Build (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Emberwolf | `emberwolf` | Fire | 244 | 77,598 | 343 |
| Tidefang | `tidefang` | Water | 341 | 87,714 | 164 |
| Thornstag | `thornstag` | Plant | 242 | 110,228 | 261 |
| Stonemaul | `stonemaul` | Earth | 300 | 89,460 | 174 |
| Wardshell | `wardshell` | Ward | 107 | 71,911 | 126 |
| Pyrewing | `pyrewing` | Fire | 240 | 34,060 | 69 |
| Stormtalon | `eagle` | Sky | 178 | 35,686 | 64 |
| Sunmane | `lion` | Light | 214 | 74,552 | 94 |
| Grandtusk | `elephant` | Titan | 63 | 54,404 | 74 |
| Ironpaw | `panda` | Qi | 85 | 46,054 | 61 |
| Duskseer | `owl` | Night | 159 | 25,374 | 41 |

Cost is measured by `npm run stats` at three r158. Descriptions of each are in [docs/creatures.md](docs/creatures.md).

## How it is laid out

```
index.html               the sheet's page
src/showcase/            the sheet: cards, camera, lights, turntable (main.js, scene.js, style.css)
src/creatures/           one file per creature, and index.js, which lists them with their notes
src/kit/                 the building blocks every creature uses
  math.js                colours, mixing, smooth steps, a seeded random number generator
  geometry.js            blob (a sculptable superellipsoid), tubes, flames, leaves, crystals, lumps
  materials.js           shared materials and the glow texture
  parts.js               part, seg, shard, lock, feather, wingKit, band, plateGeo, finish...
scripts/render.mjs       PNGs of every creature, from a headless browser
scripts/stats.mjs        parts, triangles and build time per creature
reference/               the single-file page this code came from, as last published
docs/creatures.md        the catalogue
docs/roadmap.md          the plan for the whole game, phase by phase
CLAUDE.md                house art style, rules and design decisions: read before changing a creature
```

## What a creature is

Each file in `src/creatures/` exports one function that builds a creature and returns:

```js
{
  root,        // a THREE.Group holding the whole creature
  head,        // a Group at the head, used by the sheet's close-up
  name,        // the id
  update(t),   // pose the creature for time t, in seconds
  headView,    // optional { span, up, look }: how the close-up is framed
  fitPad,      // optional { up }: extra headroom, for wings that rise above the build pose
  initYaw      // optional: the angle the turntable starts at
}
```

The creature stands on the ground at `y = 0`, faces `+x`, and is a few units tall (0.5 to 4.5). `update(t)` is a pure function of time: it only sets rotations, positions and scales on groups the creature kept hold of (a jaw, a wing, a trunk joint, a tail), so any clock can drive it.

### Drawing one

- `blob(w, h, d, e, deform)` is the workhorse: an ellipsoid (`e = 1`) that gets boxier as `e` falls. `deform(x, y, z, W, H, D)` sculpts it, which is how chests, haunches and snouts are made.
- `part(parent, geometry, look, x, y, z, rx, ry, rz)` adds a mesh. `look` says how it is coloured: `c` is a colour or a function `(worldPosition, worldNormal) => Color` (spots, stripes, hexagonal shell plates, belly gradients are all colour functions), `m` picks a material (`matte`, `flat`, `gloss`, `metal`, `leaf`, `plume`, `feather`), and `noAO` / `noOcc` switch contact shading off for a part.
- `seg` is a limb segment between two points, `shard` a cone, `ttube` a tube that tapers along a path, `lock` a lock of fur, `feather` a feather, `wingKit` a three-part wing with rows of feathers, `band` a ring round a limb, `plateGeo` a flat plate cut from an outline.
- **`finish(root, height)` goes last.** It bakes every part's colour, a gradient up from the ground and contact shading where parts meet into vertex colours, from their world positions at build time. After that the creature has no textures to load and no lights beyond the scene's.

### Adding a creature

1. Copy the closest creature in `src/creatures/` to a new file and change it.
2. Add it to `INFO` and `ORDER` in `src/creatures/index.js`.
3. `npm run render -- yourid --head` to look at it, `npm run stats` to see what it costs.

## Things learned the hard way

- **The bake happens once, at build time, in the build pose.** Anything that moves later must be its own `Group`, pivoting at the joint (jaw at the hinge, wing at the shoulder), with its parts added to the group before `finish()`.
- **A mirrored group (`scale.z = -1`) mirrors its geometry, not its animation.** A wing built once and mirrored needs its own arm rotation flipped, but its forearm and hand rotate the same way as the other wing's. Flipping all three made the two wings beat out of step.
- **Contact shading costs vertices x occluders.** Small parts (feathers, locks, teeth) are marked `noOcc: true` so they receive shading but do not cast it; without that the bake gets slow.
- **Glow is unlit.** Flames, eyes, gems and rune lines use unlit materials that ignore the tone mapping; halos are sprites. Sprites are left out of the box the camera frames, and meshes marked `userData.noFit = true` (auras, rings) are too.
- **Colour functions see world positions.** A pattern drawn by position (the stag's spots, the tortoise's shell plates) must use the same coordinates the geometry was built in, so build and colour with the same helper.
- **Many creatures on one page means many WebGL contexts.** The sheet makes one per card and builds them lazily. A game should draw all its creatures in one scene with one renderer.

## Towards a game

This repo makes creatures; it does not yet make a game. The obvious next steps:

- **Share one renderer and one scene**, build each creature kind once, and clone it for each instance.
- **Pose by state, not by time.** `update(t)` loops an idle. Attacks, hits and walks need the joint groups exposed (for example `joints: { jaw, tail, wings }`) so a state machine can drive them.
- **Budget the triangles.** Creatures run from about 25,000 to 110,000 triangles and 60 to 340 parts. That is fine for a handful on screen; for crowds, bake each to a sprite sheet or an impostor, and keep full models for close-ups.
- **Pick a licence.** None has been chosen. three.js is MIT; the sheet's fonts (Fredoka, Nunito) are loaded from Google Fonts under the SIL Open Font License.

## Rendering without a GPU

`npm run render` drives a headless Chromium on the software WebGL renderer, so it works on a machine with no GPU, but slowly (about four seconds a creature). Install a browser with `npx playwright install chromium`, or point `CHROMIUM_PATH` at one you already have.
