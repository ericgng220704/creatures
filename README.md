# Creatures

Eleven procedural 3D creatures, drawn entirely in code with [three.js](https://threejs.org). No models, no textures, no art files: every body is built from sculpted blobs, tubes, feathers and locks of fur, coloured by functions, and lit with baked contact shading. They were designed in a conversation as a single-page "creature sheet", and this repo is that code moved into a project of its own, to build a game on.

## Run it

```bash
npm install
npm run dev        # the sheet, at http://localhost:5173, and the battle preview at /battle.html
npm run build      # a static build in dist/
npm run stats      # what each creature costs, and whether it fits its battle size class, with no browser
npm run render     # a PNG of every creature in renders/ (needs a browser, see below)
npm run render -- --battle   # the battle preview as PNGs in renders/battle/
```

The sheet shows each creature on a turntable. Drag to turn it, **Head** shows the face close up, **Spin** stops the turning. A creature is built when its card nears the screen and drawn only while it is visible.

**Online, without installing anything:** once GitHub Pages is switched on (Settings > Pages > Source: "GitHub Actions"), every push to `main` publishes both pages through `.github/workflows/pages.yml`, at `https://<owner>.github.io/creatures/` (the sheet) and `.../battle.html` (the preview). Each page links to the other.

The **battle preview** (`battle.html`) shows creatures as the game will: at true size, from the fixed side camera, in a 6 v 6 formation on the stadium field, all in one scene. **Silhouette** turns them into black shapes on white, **Size boxes** checks each against its size class and shows how tall it stands on screen, and the sliders move the camera and the formation. Every setting is kept in the URL, so a view can be shared or rendered.

## The creatures

| Creature | Id | Element | Parts | Triangles | Build (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Emberwolf | `emberwolf` | Fire | 227 | 60,386 | 240 |
| Tidefang | `tidefang` | Water | 317 | 44,754 | 115 |
| Thornstag | `thornstag` | Grass | 242 | 61,388 | 167 |
| Stonemaul | `stonemaul` | Ground | 249 | 73,004 | 148 |
| Wardshell | `wardshell` | Water | 93 | 58,919 | 99 |
| Pyrewing | `pyrewing` | Fire | 240 | 32,284 | 55 |
| Stormtalon | `eagle` | Electric | 178 | 33,910 | 70 |
| Sunmane | `lion` | Light | 238 | 64,738 | 87 |
| Grandtusk | `elephant` | Ice | 187 | 57,700 | 68 |
| Ironpaw | `panda` | Neutral | 80 | 42,322 | 48 |
| Duskseer | `owl` | Dark | 139 | 19,648 | 25 |

Cost is measured by `npm run stats` at three r158. Descriptions of each are in [docs/creatures.md](docs/creatures.md).

## How it is laid out

```
index.html               the sheet's page
src/showcase/            the sheet: cards, camera, lights, turntable (main.js, scene.js, style.css)
battle.html              the battle preview's page
src/arena/               shared by the preview and the battle to come: layout.js (formation, camera, size classes), stadium.js (field, stands, lights)
src/preview/             the battle preview: main.js (teams, silhouette, size boxes, sliders), style.css
src/creatures/           one file per creature, and index.js, which lists them with their notes
src/kit/                 the building blocks every creature uses
  math.js                colours, mixing, smooth steps, a seeded random number generator
  geometry.js            blob (a sculptable superellipsoid), tubes, flames, leaves, crystals, lumps
  materials.js           shared materials and the glow texture
  parts.js               part, seg, shard, lock, feather, wingKit, band, plateGeo, finish...
scripts/render.mjs       PNGs of every creature, from a headless browser
scripts/stats.mjs        parts, triangles, build time and size-class fit per creature
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
  rig,         // its joints by name, from makeRig() in src/kit/rig.js (see "Rigs" below)
  clips,       // optional: its own tracks for any animation clip, laid over the shared ones (see "Clips")
  headView,    // optional { span, up, look }: how the close-up is framed
  fitPad,      // optional { up }: extra headroom, for wings that rise above the build pose
  initYaw      // optional: the angle the turntable starts at
}
```

The creature stands on the ground at `y = 0`, faces `+x`, and is a few units tall (0.5 to 4.5). `update(t)` is a pure function of time: it only sets rotations, positions and scales on groups the creature kept hold of (a jaw, a wing, a trunk joint, a tail), so any clock can drive it.

### Drawing one

- `blob(w, h, d, e, deform, ws, hs)` is the workhorse: an ellipsoid (`e = 1`) that gets boxier as `e` falls. `deform(x, y, z, W, H, D)` sculpts it, which is how chests, haunches and snouts are made. Small blobs (under 0.25 across: eyes, toes, knuckles, buttons) get a coarser sphere, 14 x 10 instead of 30 x 20, unless `ws`, `hs` say otherwise.
- `part(parent, geometry, look, x, y, z, rx, ry, rz)` adds a mesh. `look` says how it is coloured: `c` is a colour or a function `(worldPosition, worldNormal) => Color` (spots, stripes, hexagonal shell plates, belly gradients are all colour functions), `m` picks a material (`matte`, `flat`, `gloss`, `metal`, `leaf`, `plume`, `feather`), and `noAO` / `noOcc` switch contact shading off for a part.
- `seg` is a limb segment between two points, `shard` a cone, `ttube` a tube that tapers along a path, `lock` a lock of fur, `feather` a feather, `wingKit` a three-part wing with rows of feathers, `band` a ring round a limb, `plateGeo` a flat plate cut from an outline.
- `limb(parent, points, radii, look)` builds a leg, arm, neck or tail as a **chain of joints** (see "Rigs").
- **`finish(root, height)` goes last.** It bakes every part's colour, a gradient up from the ground and contact shading where parts meet into vertex colours, from their world positions at build time. After that the creature has no textures to load and no lights beyond the scene's.

### Rigs

Animation drives creatures through their **rig**: named joints, each a `Group` that pivots at its point. `src/kit/rig.js` has the pieces:

- `limb(parent, pts, radii, look)` puts a joint at every point and the segment to the next point inside it, so turning a joint swings everything after it. `radii` is `[r0, r1]` per segment. It returns a chain `{ joints, root, end }`; the last joint has no segment and carries the paw, hoof or tail tip.
- `hang(joint, parts)` moves parts that were placed in the chain's parent space onto one joint without moving them (paws and claws onto `leg.end`). `bind(chain, parts)` does the same but picks the nearest joint for each part (tufts along a tail).
- `chain(groups)` wraps Groups a creature already has (wing arm, forearm, hand; trunk joints) as a chain.
- `makeRig({ plan, body, neck, head, jaw, ears, tail, legs, arms, wings, extra })` makes the standard rig and saves every joint's build pose as its rest pose. `plan` is `quadruped`, `biped`, `flyer` or `perched`. Legs are `fl, fr, bl, br` (or `l, r`), arms and wings `l, r`, `extra` any other named chain. Left and right are the creature's own: it faces `+x`, so `+z` is its right, the side the battle camera sees.
- `eachJoint(rig, fn)` visits every joint with a name (`legs.fr.1`, `tail3`, `extra.trunk.5`); `restPose(rig)` puts them all back.

Because the colours are baked once in the build pose, a rig changes nothing about how the creature looks until a joint turns. Emberwolf is fully rigged (a neck joint carrying the head, ruff and crown of the mane, four leg chains and a five-joint tail); the others return the joints they already had, and get legs as they are reworked. The battle preview's **Joints** and **Flex** toggles show and swing every joint.

### Clips

Attacks, hits and the rest are **clips** (`src/kit/anim.js`): keyframe tracks over normalised time `k` from 0 to 1, a duration, an `impact` moment (when the blow lands) and a `travel` track (0 at home, 1 at the target) that the battle uses to move the creature's slot. A track is a number or `[[k, value, ease], ...]`. Channels are offsets from the rest pose: `body.x/y/pitch/roll`, `head.pitch/turn`, `neck.pitch`, `jaw.open`, `ears.back`, `tail.curl/side`, `front.x/y` and `back.x/y` (foot targets), `arms.r.swing/stretch`, `wings.lift/beat/rate`, `trunk.curl`, `shake`.

- The clips are `attack`, `ultimate`, `hit`, `faint` (holds its last pose) and `victory`, shared by plan: every plan has the body, head, jaw, ears and tail tracks; quadrupeds add feet, bipeds arms, flyers wings. The idle is not a clip: it is the creature's own `update(t)`.
- `clipFor(creature, name)` gives the clip a creature plays: the shared one, with the creature's own `clips[name].tracks` (and `dur`, `impact`, `travel`) laid over it. Unique ultimates (decision A8) will be written this way.
- With a `neck` joint, `head.pitch` and `head.turn` are shared half and half between neck and head, so the head arcs on the neck instead of tipping at the skull; `neck.pitch` moves the neck alone.
- `applyClip(creature, clip, k, weight, seconds)` poses it after `update(t)`, blending in and out. The body turns about its pivot; legs built with `limb()` and standing outside the body keep their feet planted by solving each leg as a two-bone chain (a three-segment hind leg keeps its hock-to-foot slope), unless the clip moves the feet.
- Start each frame from `restPose(rig)` before `update(t)`, so joints the idle does not drive come home after a clip.

In the battle preview, **Play** runs them: Attack and Ultimate send the picked creature (or the player's front middle) at the enemy facing it, which plays Hit at the impact; Hit, Faint and Victory play on everyone; Exchange keeps the two trading blows.

### Drawing many at once

A built creature is hundreds of small meshes, and each is a draw call. `src/kit/compact.js` makes it cheap without changing how it looks:

- `bakeLights(creature)` bakes the creature's own `PointLight`s into its parts as a per-vertex glow (a `glowLight` attribute that the shared materials add to their emitted light), then takes the lights out. The creature looks the same, and no longer lights its neighbours.
- `merge(creature)` merges every part that never moves on its own into one mesh per material per joint. It finds what moves by running `update(t)` at a few moments and watching transforms, material values and geometry: eyes, flames, embers, shields and crystals stay separate, as do rig joints and sprites. Glow parts of different colours merge through vertex colours.
- Inside a group that moves on its own (a flickering flame), glow layers of different opacities merge too, their opacity carried in a per-vertex alpha: solid layers first, then see-through ones in the order they were made. Drawn apart, three.js sorted those layers by a camera depth they nearly share, so they flipped order now and then; merged, they hold the order they had most of the time.
- A material shared by several parts may change in `update(t)` (a pulse) and they still merge: only a part whose material is its own counts as moving when the material changes.
- `merge()` leaves an `InstancedMesh` alone. Swarms of particles (embers, sparks, motes) should be one `InstancedMesh` whose instances `update(t)` moves, not one mesh each: Emberwolf's 18 embers are one draw.
- `optimize(creature)` does both. For all eleven: 2,191 meshes become 576, and the shadow pass 1,718 casters become 268. Twelve Emberwolves on the field: 4,727 draw calls a frame as built, 1,062 optimised (1,730 with bloom, which draws the scene a second time).

The battle preview always draws creatures this way; its **Merge** and **Creature light** (baked, live, off) buttons switch it, and it shows frames a second, draw calls and triangles. `npm run stats` lists meshes as built and after merging.

### The battle light

`src/arena/stadium.js` lights the battle the same for both teams: a key light high over the camera's side, a rim light from behind, a sky fill and one shadow fitted to the formation. `src/arena/glow.js` adds a selective bloom: the scene is drawn as usual, then drawn again with every surface black except unlit glow parts, blurred, and added on top, so flames, eyes and runes halo while bodies keep their colours. The preview's **Bloom** button switches it.

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
- **Budget the triangles.** Creatures run from about 20,000 to 75,000 triangles and 60 to 340 parts. That is fine for a handful on screen; for crowds, bake each to a sprite sheet or an impostor, and keep full models for close-ups.
- **Pick a licence.** None has been chosen. three.js is MIT; the sheet's fonts (Fredoka, Nunito) are loaded from Google Fonts under the SIL Open Font License.

## Rendering without a GPU

`npm run render` drives a headless Chromium on the software WebGL renderer, so it works on a machine with no GPU, but slowly (about four seconds a creature). Install a browser with `npx playwright install chromium`, or point `CHROMIUM_PATH` at one you already have.
