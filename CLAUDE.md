# CLAUDE.md

Guidance for Claude (and people) working in this repo. Read it before touching a creature.

## What this project is

Procedural 3D creatures drawn entirely in code with three.js r158 (no models, no textures, no art files), growing into an **auto-battle, turn-based creature game** modelled on *Pocket Incoming* (6 v 6 on a stadium field, fixed camera, speed-ordered turns, type multipliers, a turn limit; see "Battle target" below).

**Current phase: design.** Priorities, in order:

1. **Creature art.** The top priority. Every change is judged by how the creature looks.
2. **The fight mechanism.** Rules, stats, turn order, skills, type chart.
3. Everything else (menus, progression, monetisation, backend) waits.

Do not build game systems ahead of the design decisions listed under "Open decisions". If a task needs one of them, ask.

## Commands

```bash
npm install
npm run dev                 # the creature sheet at http://localhost:5173
npm run build               # static build in dist/
npm run stats               # parts, triangles, build ms per creature (Node, no browser)
npm run render              # PNG of every creature in renders/ (headless Chromium)
npm run render -- --head    # plus a face close-up of each
npm run render -- owl lion  # only these ids
```

In the cloud container, point the renderer at the pre-installed browser:
`CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run render -- --head`
(software WebGL, about 4 s per creature). `renders/` is git-ignored.

There are no tests and no linter. "Done" for art means: rendered, looked at, and compared with its neighbours.

## Layout

```
src/kit/         math.js (C, mix, sstep, rng), geometry.js (blob, ttube, lathe, flameGeo, leafGeo, lumpGeo, crystalGeo),
                 materials.js (MAT, glowMat, crystalMat, halo, RADIAL), parts.js (part, glow, seg, shard, lock, feather,
                 place, plateGeo, wingKit, beatWing, onLimb, band, finish, flameCluster)
src/creatures/   one file per creature + index.js (INFO, ORDER)
src/showcase/    the creature sheet (one WebGL context per card; not how the game should render)
scripts/         render.mjs (PNGs), stats.mjs (cost table)
reference/       the original single-file sheet, frozen. Do not edit.
docs/            creatures.md, the catalogue
```

The README documents the kit API and the "things learned the hard way". Do not repeat it here; keep it current.

## Code conventions (match them)

- ES modules, but ES5 style inside: `var`, `function`, `forEach`, no classes, no arrow functions in creature files. Scripts in `scripts/` may use modern JS.
- `import * as T from 'three'`. Each creature file exports one builder named after its id (`export function owl()`).
- File header: a `// ===` banner with `NAME: one-line description`.
- `var P = { ... }` holds the whole palette at the top. Lit colours are `C('#hex')`; unlit glow colours are plain `'#hex'` strings.
- Looks are UPPER_CASE consts (`FUR`, `GOLD`, `CLAW`, `TOOTH`, `LOCK`, `STONE`). Colour functions `(p, n) => Color` are small named functions (`coat`, `plum`, `torso`).
- Randomness only through `rng(seed)`, one fixed seed per use. A creature must build identically every time.
- Comments are short plain sentences describing anatomy ("// neck and a ruff of soft locks, three layers deep"), one per block.
- Dense one-liners are normal here. Do not reformat existing files.

### The creature contract

The builder returns `{ root, head, name, update(t), headView?, fitPad?, initYaw? }`. The creature stands on `y = 0`, faces `+x`, and `update(t)` is a pure function of time that only moves groups it kept hold of. Anything that moves after `finish()` must be its own `Group`, pivoting at its joint, built before `finish(root, H)` (which is always last). Full details in the README.

When you add or rename a creature, update all of: `src/creatures/index.js` (`INFO`, `ORDER`), `docs/creatures.md` (edited by hand: no export script exists despite its header), and the table in `README.md` (numbers from `npm run stats`).

---

## Creature art: the house style

Analysed from the code and from renders of all eleven creatures (October 2026). This is the reference every new creature is held to.

### What the style is

**"Painted vinyl toy with magic in it."** Smooth, soft, sculpted volumes with no texture, lit like a studio figurine, with one element's magic glowing out of it.

| Trait | How it is done |
| --- | --- |
| Soft sculpted volumes | `blob()` superellipsoids, `e` between 0.7 and 0.9, sculpted with `deform`. Hard edges only on stone (`m: 'flat'`) and crystal. |
| Built from anatomy | Torso + chest + haunch blobs, `seg` limbs shoulder > elbow > wrist > paw, hocks on hind legs, toes and claws. Real animal structure, pushed heroic: deep chest, tucked waist, heavy shoulders. |
| Colour by function, not texture | Counter-shading on every body: dark on top (`sstep` on `n.y`), pale belly, chest or throat. Patterns (spots, hex plates, stripes, wrinkles) are colour functions of world position. |
| Baked light | `finish()` bakes a ground gradient (0.78 at the feet to 1.0 at the top) and contact shading into vertex colours. No textures, ever. |
| Hair and feathers as cards | `lock` for fur (darker root, lighter tip, `tipAmt` 0.5 to 0.9), `feather` with a 3-stop `g` gradient root > mid > tip. Always `noOcc: true`, `aoK` about 0.3 to 0.4. |
| Natural body, magic accent | Body colours are natural and muted (greys, browns, olive, slate). The element is the only saturated colour, and it is unlit (`glow`, `toneMapped: false`). |
| Glowing eyes | Every creature: an unlit `glow` eye, a `halo` sprite on it (all but Grandtusk), and a blink in `update` (`scale.y` to about 0.1 for 0.12 to 0.16 s every 4.7 to 6.3 s). Nine of eleven eyes are warm yellow to amber; only Tidefang (cyan) and Thornstag (green) take the element colour. |
| Gloss for the hard bits | Teeth, claws, nails, noses, beaks, tongues are `m: 'gloss'`, usually `noAO` and `noOcc`. Teeth and claws are off-white (`#f3eee3` family), never pure white. |
| Gold trim as rank | Gold or iron bands, rims, buckles and sigils (`m: 'metal'`, gold `#d9ab3d` / dark `#9a6a1a`) mark the "trained, heroic" creatures. |
| Element kit | Each creature draws on the same five layers of magic: rune lines (`ttube` glow, radius 0.01 to 0.02), motes (tiny icosahedra that rise or orbit), a body `halo` (opacity 0.16 to 0.35), an element-specific feature (flame mane, crystal spine, antler bloom, ward shields...), and one `PointLight` in the element colour. |
| Alive at rest | `update` always has breathing (body y and scale, period about 3 to 6 s), a slow head sway, a secondary motion (tail, ears, jaw, wings) and the blink. |

### Palettes in use

| Creature | Element | Body | Element glow | Eye |
| --- | --- | --- | --- | --- |
| Emberwolf | Fire | charcoal violet `#544c5c` / `#36313b` | ember `#ff4510` > `#ff8d1c` > `#ffe885` | `#ffb72e` |
| Tidefang | Water | deep teal `#1f4e60` / `#3a8197`, pale belly | crystal `#3fd2ff`, `#0099ff` | `#b4fdff` |
| Thornstag | Plant | warm brown `#a4794c`, cream | leaf `#78c255`, rune `#a6ff70` | `#c4ff86` |
| Stonemaul | Earth | brown `#6a4a36`, stone `#7b7f8c`, iron | amber rune `#ffb347` | `#ffad33` |
| Wardshell | Ward | green shell `#4b7a5f`, olive skin, gold | teal rune `#6ff0d0` | `#ffd75a` |
| Pyrewing | Fire | crimson `#a31f17` > gold `#ffc233` | ember (same as Emberwolf) | `#fff3b0` |
| Stormtalon | Sky | brown `#4a3426`, white head | wind `#cfe8ff` | `#ffc933` |
| Sunmane | Light | tawny `#c99a54`, mane `#6e3f1a` > `#f0b24a` | gold `#ffcf5a` | `#ffc13a` |
| Grandtusk | Titan | grey `#82838d`, ivory, gold | gold rune `#ffd25a` | `#ffd98a` |
| Ironpaw | Qi | black / white, red `#c0282d`, gold | qi `#fff2a0`, `#ffb02e` | `#ffe9a0` |
| Duskseer | Night | plum `#4b3f5e`, cream disc | violet rune `#a58cff`, moon `#e8eaff` | `#ffd34a` |

### Rules for every creature (new or changed)

**MUST**

1. **Read at battle size first.** Design the silhouette for the battle camera (about 150 to 250 px tall on a phone), then add detail. If it is not recognisable as a black silhouette at that size, it is not done. Close-up detail is a bonus, never the point.
2. **One element, one accent hue.** The body stays natural and muted; the element owns the only saturated, glowing colour. No second competing glow colour (a pale core of the same hue is fine).
3. **Counter-shade the body.** Darker on top, paler underneath, via a colour function on `n.y`. No flat single-colour bodies.
4. **Eyes glow and blink.** Unlit `glow` eye + `halo` + blink in `update`. Eyes must be big enough to read at battle size (see weakness 9 below).
5. **Neutral battle stance as the build pose.** Standing, facing `+x`, weight on all feet, ready. Attacks, strikes and punches are animation, not the build pose.
6. **Fit the footprint.** The solid body (no FX) fits its size class (see table). Battle formation slots are fixed; a creature that does not fit overlaps its neighbour.
7. **FX live in their own group.** Auras, orbiting shields, rocks, rings, moons, perches, wind ribbons and particles go in an `fx` group (marked `userData.noFit`) that the game can scale, shorten or switch off. Nothing in `fx` may reach more than 1.5 x the body's half-length from its centre.
8. **No scenery.** Branches, moons and ground rings are scene props, not creature parts. A creature must stand on the plain field.
9. **No textures, no imported models.** Everything is kit geometry + colour functions + `finish()`.
10. **Deterministic.** Seeds through `rng(seed)`; same build every time.
11. **Render and look.** After any art change, run `npm run render -- <id> --head` and look at both PNGs next to at least two neighbours before calling it done.

**SHOULD**

- Heroic proportions: chest and shoulders oversized, waist tucked, head 10 to 20 % larger than anatomy says, so the face reads.
- Keep the kit's vocabulary (`blob`, `seg`, `lock`, `feather`, `shard`, `band`). Add a new kit helper only when two or more creatures need it.
- Overlap blobs at joints (shoulder blob over the top of the limb `seg`) so limbs grow out of the body rather than plugging into it.
- Gold or iron trim at most in two places. It is a rank marker, not decoration.
- Triangle budget: aim for 40k and stay under 60k. Mark small parts `noOcc`. (Thornstag at 110k and Tidefang at 88k are over.)
- Glow colours from the element's ramp (see "Element colour keys" once decided); eyes may stay warm amber as the house signature.

**Size classes** (solid body, metres in scene units; current creatures shown for scale)

| Class | Length x height | Today |
| --- | --- | --- |
| S | up to 3.5 x 3.5 | Duskseer 3.2 x 3.5, Ironpaw 3.3 x 4.2 (too tall) |
| M | up to 4.5 x 3.5 | Emberwolf 4.4 x 2.9, Thornstag 3.5 x 4.4 (antlers too tall) |
| L | up to 6.5 x 4.0 | Grandtusk 6.4 x 3.8, Sunmane 5.4 x 3.4, Stonemaul 6.4 x 2.8, Tidefang 6.6 (tail) |
| Flyers | wingspan up to 6.0, hover base about 2.0 | Stormtalon 10.6 span (too wide), Pyrewing 7.2 |

These numbers are provisional until the formation and camera are fixed (open decision).

### Known weaknesses (from the renders; fix these before making more)

1. **The style gap.** The reference game uses 2D anime sprites: saturated, cel-shaded, outlined. Ours are soft PBR clay with muted bodies. Unless we choose otherwise, the plan is to keep 3D and close the gap with a toon look: an outline pass, stepped (toon) shading, higher saturation. This is open decision 1.
2. **Balloon limbs.** Elephant, Sunmane and Ironpaw limbs read as stacked sausages with visible seams at the joints. Needs overlap, tapering and joint blobs.
3. **Sunmane's mane reads as spikes**, like a hedgehog, not fur. The locks are too stiff, pointed and evenly spaced; it needs fewer, broader, curved locks in clumps.
4. **Sizes are all over the place.** Solid length runs 3.2 to 6.9, height 1.6 to 4.4, Stormtalon's wingspan is 10.6. In a 6 v 6 field this will not fit.
5. **Action poses are baked in.** Sunmane is mid-swipe, Ironpaw mid-punch, Stormtalon mid-dive. They need neutral idles; the action becomes an attack animation.
6. **FX and scenery bleed out.** Wardshell's shields orbit 6.9 units wide, Stonemaul's rocks and rings, Duskseer's moon, branch and ring, Stormtalon's wind ribbons. They will cover the neighbours in formation.
7. **One PointLight per creature.** Twelve coloured dynamic lights in one scene is expensive and spills colour onto neighbours. In battle, element light should be baked or faked (halo plus emissive), not real lights.
8. **Low saturation for a phone at arm's length.** Next to the reference, bodies look dusty. Raise the body palette's saturation a notch once the shading model is chosen.
9. **Small faces.** Grandtusk's and Stonemaul's eyes vanish at battle size; Tidefang's and Stormtalon's heads are tiny relative to the body. Faces carry personality and must read.
10. **Thin or flat silhouettes.** Thornstag is mostly antler on a slim body; Tidefang is long and low, nearly invisible from an elevated camera.
11. **No family resemblance.** Ironpaw (warrior with clothes) and Duskseer (cartoon owl with glasses-like rims) lean cartoonish; Emberwolf and Stonemaul lean realistic and menacing. Pick one point on that scale (open decision 2).

### Checklist before you call a creature done

- [ ] Silhouette recognisable as a black shape at about 200 px tall.
- [ ] Body counter-shaded, one element accent, eyes glow and blink.
- [ ] Neutral battle stance, faces `+x`, feet on `y = 0` (or hover base for flyers).
- [ ] Solid body inside its size class; FX inside the `fx` group and within reach.
- [ ] Joint groups exposed for animation (`head`, `jaw`, `tail`, `wings`, limbs as needed).
- [ ] `npm run stats`: under 60k triangles.
- [ ] `npm run render -- <id> --head` looked at, beside two neighbours.
- [ ] `index.js`, `docs/creatures.md` and the README table updated.

---

## Battle target (from the reference screenshot)

What *Pocket Incoming* does, which is what we are copying unless a decision says otherwise:

- **6 v 6**, each side in two rows of three (front and back), player on the left facing right, enemy on the right facing left. Our creatures face `+x`; the enemy side is mirrored (`scale.x = -1` on a parent, or `rotation.y = PI`).
- **Fixed camera**, side-on from an elevated three-quarter angle, over a stadium field with a centre circle.
- **Auto battle.** Pause, "Act" (manual ultimate?) and speed (x1 / x2) buttons; turn limit shown as `01 / 10 turn`.
- **Turn order bar** on the right edge: portraits stacked in speed order, the next actor at the bottom, highlighted.
- **Per-creature HUD:** level badge, HP bar, and an energy bar under it that fills toward an ultimate.
- **Damage feedback:** floating numbers with the multiplier (`-13628 (x1.20)`), labels "Extremely Effective" / "Low Effective", and a running Total DMG counter.
- **AoE skills** that hit a row or the whole enemy side (several numbers pop at once).
- Trainer portraits and levels at the top corners.

## Open decisions (ask; do not assume)

1. Render style for battle: keep 3D procedural with a toon pass, or bake the 3D creatures to 2D sprites, or stay soft PBR.
2. Tone: cute, heroic or menacing; and a target age.
3. Element list and type chart (today: Fire x2, Water, Plant, Earth, Ward, Sky, Light, Titan, Qi, Night, which is ten elements for eleven creatures).
4. Evolution stages, and whether each creature has them.
5. Battle rules: stat set, damage formula, energy and ultimates, what a "turn" is, the turn limit and what happens when it runs out, targeting.
6. Platform and orientation (phone landscape like the reference?), and the renderer (three.js in a browser, wrapped for mobile, or something else).

Record each answer here when it is made, and turn the matching "provisional" rules above into firm ones.
