# CLAUDE.md

Guidance for Claude (and people) working in this repo. Read it before touching a creature.

## What this project is

Procedural 3D creatures drawn entirely in code with three.js r158 (no models, no textures, no art files), growing into an **auto-battle, turn-based creature game** modelled closely on *Pocket Incoming* (6 v 6 on a stadium field, fixed side camera, speed-ordered turns, type multipliers, a turn limit; see "Battle target" below). A hobby project, PvE only, played mostly in a laptop browser. Copying the reference game closely is fine; it will not be published.

The phased plan for the whole game is in [docs/roadmap.md](docs/roadmap.md). Check it for the current phase before starting work.

**Current phase: design.** Priorities, in order:

1. **Creature art.** The top priority. Every change is judged by how the creature looks.
2. **The fight mechanism.** Rules, stats, turn order, skills, type chart.
3. Everything else (menus, progression, monetisation, backend) waits.

Do not build game systems ahead of the design decisions listed under "Decisions". If a task needs one that is still open, ask.

## Workflow

- **Commit and push after every change**, to the branch you are working on (`git push -u origin <branch>`). The owner follows progress through the pushes. Never leave work only in the working tree.
- One logical change per commit, with a message that says what changed in the art or rules, not only which file.
- For art, a change is not finished until it has been rendered and looked at (rule 11 below).

## Commands

```bash
npm install
npm run dev                 # the creature sheet at http://localhost:5173, the battle preview at /battle.html
npm run build               # static build in dist/
npm run stats               # parts, merged meshes, triangles, build ms per creature, and whether it fits its size class
npm run render              # PNG of every creature in renders/ (headless Chromium)
npm run render -- --head    # plus a face close-up of each
npm run render -- owl lion  # only these ids
npm run render -- --battle  # battle preview PNGs in renders/battle/: the 6 v 6 as is, as silhouettes, with size boxes,
                            # then each creature alone at true battle size (boxes + silhouette); add ids to limit it
```

In the cloud container, point the renderer at the pre-installed browser:
`CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run render -- --head`
(software WebGL, about 4 s per creature). `renders/` is git-ignored.

There are no tests and no linter. "Done" for art means: rendered, looked at, and compared with its neighbours.

## Layout

```
src/kit/         math.js (C, mix, sstep, rng), geometry.js (blob, ttube, lathe, flameGeo, leafGeo, lumpGeo, crystalGeo),
                 materials.js (MAT, glowMat, crystalMat, halo, RADIAL), parts.js (part, glow, seg, shard, lock, feather,
                 place, plateGeo, wingKit, beatWing, onLimb, band, finish, flameCluster),
                 rig.js (limb, chain, hang, bind, makeRig, eachJoint, restPose),
                 anim.js (the shared clips; sample, clipFor, applyClip, clipWeight),
                 compact.js (bakeLights, merge, optimize, drawCalls)
src/creatures/   one file per creature + index.js (INFO, ORDER)
src/showcase/    the creature sheet (one WebGL context per card; not how the game should render)
src/arena/       what the battle preview and the future battle scene share: layout.js (FORMATION, CLASSES, slotPosition,
                 faceSlot, placeCamera, checkFit), stadium.js (renderer, field, stands, the battle light) and
                 glow.js (selective bloom on glowing parts)
src/preview/     the battle preview (battle.html): a 6 v 6 formation, silhouette mode, size-class boxes with on-screen
                 heights, joint markers and a flex test, sliders to try other layouts; settings live in the URL
scripts/         render.mjs (PNGs), stats.mjs (cost table)
.github/workflows/pages.yml   builds and publishes both pages to GitHub Pages on every push to main
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

The builder returns `{ root, head, name, update(t), rig, headView?, fitPad?, initYaw? }`. The creature stands on `y = 0`, faces `+x`, and `update(t)` is a pure function of time that only moves groups it kept hold of. Anything that moves after `finish()` must be its own `Group`, pivoting at its joint, built before `finish(root, H)` (which is always last). Full details in the README.

**The rig (roadmap 0.3).** Every builder returns `rig: makeRig({...})` (`src/kit/rig.js`), naming its joints so animation can drive any creature: `plan`, `body`, `neck`, `head`, `jaw`, `ears`, `tail` (root to tip), `legs` (`fl, fr, bl, br`, or `l, r`), `arms`, `wings` (`l, r`) and `extra` chains. Left and right are the creature's own; `+z` is its right. Rules for rigging:

- Build legs, arms, necks and tails with `limb()`, never loose `seg`s, so each bends at its joints. Hang paws, hooves and claws on `leg.end` with `hang()`; spread tufts along a tail with `bind()`.
- Give the head a `neck` joint where the neck meets the shoulders, carrying the head and whatever should follow it (the outer ruff, a crown, a crest). Clips share head pitch half and half with it, so the head arcs instead of tipping and the throat does not open. Emberwolf shows how (`hang(neck, [...])`, before `finish()`).
- Quadruped legs: front leg shoulder > elbow > wrist (end), hind leg hip > knee > hock > foot (end). Put the leg chains in a `legs` group outside `body`, so the body can bob and lunge while the feet stay planted.
- Rigging must not change the look: render the creature at rest before and after, and the pictures must match.
- Check with the battle preview's **Joints** (dots and bones) and **Flex** (swings every joint): nothing may stay behind or come loose.

**Clips (roadmap 0.4).** `attack`, `ultimate`, `hit`, `faint` and `victory` are shared per `plan` in `src/kit/anim.js`, as keyframe tracks over k = 0 to 1 with an `impact` moment and a `travel` track. A creature changes how it fights by returning `clips: { attack: { tracks: {...} } }`, overriding single tracks; never copy a whole shared clip. Unique ultimates (A8) are written that way. The idle stays `update(t)`. Check every clip in the preview's **Play** row, against a target, before calling a creature done.

When you add or rename a creature, update all of: `src/creatures/index.js` (`INFO`, `ORDER`), `docs/creatures.md` (edited by hand: no export script exists despite its header), and the table in `README.md` (numbers from `npm run stats`).

---

## Creature art: the house style

Analysed from the code and from renders of all eleven creatures (October 2026). This is the reference every new creature is held to.

### What the style is

**"Painted vinyl toy with magic in it."** Smooth, soft, sculpted volumes with no texture, lit like a studio figurine, with one element's magic glowing out of it. The mood is a **friendly adventure, like Pokémon**: mid-value, gently coloured, neither dark nor neon, and never creepy (decision A2, revised October 2026).

| Trait | How it is done |
| --- | --- |
| Soft sculpted volumes | `blob()` superellipsoids, `e` between 0.7 and 0.9, sculpted with `deform`. Hard edges only on stone (`m: 'flat'`) and crystal. |
| Built from anatomy | Torso + chest + haunch blobs, `seg` limbs shoulder > elbow > wrist > paw, hocks on hind legs, toes and claws. Real animal structure, pushed a little heroic: deep chest, tucked waist, strong shoulders. |
| Colour by function, not texture | Counter-shading on every body: dark on top (`sstep` on `n.y`), pale belly, chest or throat. Patterns (spots, hex plates, stripes, wrinkles) are colour functions of world position. |
| Baked light | `finish()` bakes a ground gradient (0.78 at the feet to 1.0 at the top) and contact shading into vertex colours. No textures, ever. |
| Hair and feathers as cards | `lock` for fur (darker root, lighter tip, `tipAmt` 0.5 to 0.9), `feather` with a 3-stop `g` gradient root > mid > tip. Always `noOcc: true`, `aoK` about 0.3 to 0.4. |
| Natural body, magic accent | Body colours are natural, **mid-value** and gently saturated (warm browns, blue-greys, sage, tawny, teal), never near black. The element is the only glowing colour, and it is unlit (`glow`, `toneMapped: false`). |
| Friendly eyes | Every creature: the kit's `eye()` (a glossy coloured iris, a dark pupil, a white catchlight), round rather than slit (height at least 0.75 of the width), under a soft brow in the body colour, and a blink in `update` (`scale.y` to about 0.1 for 0.12 to 0.16 s every 4.7 to 6.3 s). No glowing eyes, no halo on the eye. |
| Gloss for the hard bits | Teeth, claws, nails, noses, beaks, tongues are `m: 'gloss'`, usually `noAO` and `noOcc`. Teeth and claws are off-white (`#f3eee3` family), never pure white. |
| Gold trim as rank | Gold or iron bands, rims, buckles and sigils (`m: 'metal'`, gold `#d9ab3d` / dark `#9a6a1a`) mark the "trained" creatures. |
| Element kit | Each creature draws on the same five layers of magic: rune lines (`ttube` glow, radius 0.01 to 0.02), motes (tiny icosahedra that rise or orbit), a body `halo` (opacity 0.16 to 0.35), an element-specific feature (flame mane, crystal spine, antler bloom, ward shields...), and one `PointLight` in the element colour. |
| Alive at rest | `update` always has breathing (body y and scale, period about 3 to 6 s), a slow head sway, a secondary motion (tail, ears, jaw, wings) and the blink. |

### The benchmark: Emberwolf

The tone is **friendly and adventurous, like Pokémon** (revised October 2026: the first, darker "heroic" look read as too dark and a bit creepy), and **Emberwolf is the benchmark**. Every creature, new or reworked, should feel like it belongs in the same pack as the wolf. What gives Emberwolf its vibe, and what every creature takes from it:

1. **Mid-value body; glowing element.** The body is a clear, friendly mid-tone (blue-grey `#8590a8` over `#66718a`, a cream chest `#e8ddcb`), so the creature reads as light and approachable, and the element glow still pops as the only unlit colour. Not dark, not neon.
2. **Bright, round eyes under a soft brow.** `eye()` with a warm coloured iris, a dark pupil and a catchlight; a brow in the body colour gives a little determination, never a scowl. Lively and brave, not menacing.
3. **The element grows out of the anatomy.** Flames rise from the mane line, ember veins run under the fur, the tail burns at the tip. Magic lives on and in the body, not orbiting around it.
4. **One dominant element shape on the top line.** The flame mane runs crown to back. Seen from the side, the top of the silhouette tells you the element at once (flame mane, crystal spine, antler bloom, storm crest...).
5. **Layered surface rhythm.** Overlapping clumps of locks (or feathers, scales, plates), darker at the root and paler at the tip, break up the big shapes.
6. **The weapon on show, kept friendly.** A pair of fangs (not a row of teeth), claws, talons, horns or tusks: the viewer can see how it fights. Calm supports show their tool (antlers, shell) instead.
7. **Forward weight.** Chest high and forward, head low and level, ready to lunge.

### Roles shape the silhouette

| Role | Silhouette | Today |
| --- | --- | --- |
| Tank | Wide, low, heavy; armour plates or shell; head tucked low; short thick legs | Wardshell, Grandtusk, Stonemaul |
| Attacker | Long and forward-leaning, big front end, the weapon prominent | Emberwolf, Sunmane, Tidefang |
| Speedster | Lean, light, long legs or wings, a sharp pointed outline | Stormtalon, Pyrewing |
| Support | Rounded, upright, calm face, soft glow, tool instead of fangs | Thornstag, Duskseer |
| Bruiser | Compact, top-heavy, big arms or fists | Ironpaw |

A player should be able to tell a creature's role from its outline before reading any number.

### Palettes in use

| Creature | Element | Body | Element glow | Eye |
| --- | --- | --- | --- | --- |
| Emberwolf (the pilot, fully rigged) | Fire | blue-grey `#8590a8` / `#66718a`, cream `#e8ddcb` | ember `#ff4510` > `#ff8d1c` > `#ffe885` | iris `#e0861c` |
| Tidefang (reworked, rigged) | Water | teal-blue `#5f9db0` / `#467f93`, cream belly `#f3ebd6` | crystal `#3fd2ff`, `#0099ff`, core `#c9fbff` | iris `#e8a23a` |
| Thornstag (reworked, rigged) | Grass | fawn `#b98b5c` / `#94693f`, cream `#f1e4c9`, bark `#86684a` | leaf `#4c973a` > `#78c255` > `#c4ff86` | iris `#8a9a35` |
| Stonemaul (reworked, rigged) | Ground | warm brown `#93725a` / `#755a46`, cream `#ecdcc2`, stone `#9a9ca6` / `#767884`, iron | amber `#c96a1a` > `#ffb347` > `#ffe0a0` | iris `#d9861e` |
| Wardshell (reworked, rigged) | Water | shell `#5a9a84` / `#3f7262`, sage skin `#97a06f`, cream plastron `#ece0bd`, gold | water `#0099ff` > `#3fd2ff` > `#c9fbff` | iris `#e0952c` |
| Pyrewing (reworked, rigged) | Fire | red-orange `#cc5a38` / `#a8442e`, cream breast `#f5e0b4` | ember `#ff4510` > `#ff8d1c` > `#ffe885` | iris `#d9781c` |
| Stormtalon (reworked, rigged) | Electric | brown `#8a6446` / `#6a4a33`, buff `#e6d2b0`, white head `#f6f1e6`, yellow beak and feet | lightning `#ffb800` > `#ffe23a` > `#fffbd0`, cold edge `#9fd8ff` | iris `#e8a21e` |
| Sunmane (reworked, rigged) | Light | tawny `#c99a5c` / `#a87a44`, cream `#f3e4c6`, mane `#66361a` > `#d08a3c` | gold `#ffcf5a`, sunburst `#ffb02e` > `#fff6d0` | iris `#d9861c` |
| Grandtusk (reworked, rigged) | Ice | wool `#8d6e57` / `#715641`, tips `#c4a98f`, cream `#e6d5bf`, ivory | ice `#4aa8ff` > `#a8e4ff` > `#f2fdff`, crystal `#7fd4ff` | iris `#4f9fd6` |
| Ironpaw (reworked, rigged) | Neutral | charcoal `#504f5a` / `#6a6975`, cream `#efe8dc`, red wraps, gold | white-gold qi `#ffcf7a` > `#ffe9b8` > `#fffaf0` | iris `#d98a22` |
| Duskseer (reworked, rigged) | Dark | lavender-indigo `#6b628a` / `#554c70`, breast `#e6dde4`, disc `#efe8ea` | violet `#5a2bbf` > `#a58cff` > `#e6dcff` | iris `#e48a1e` |

### Rules for every creature (new or changed)

**MUST**

1. **Read at battle size first.** Design the silhouette for the battle camera, then add detail. In the battle preview at 1280 x 720 a creature stands about **100 to 150 px** tall, ground to top (the size-box labels show the number); under about 80 px it is too small to read (Tidefang today: 54). If it is not recognisable in the preview's **Silhouette** mode at that size, it is not done. Close-up detail is a bonus, never the point.
2. **One element, one accent hue.** The body stays natural and muted; the element owns the only saturated, glowing colour. No second competing glow colour (a pale core of the same hue is fine).
3. **Counter-shade the body.** Darker on top, paler underneath, via a colour function on `n.y`. No flat single-colour bodies.
4. **Friendly eyes that blink.** The kit's `eye()` + blink in `update`; no glowing eyes. Eyes must be big enough to read at battle size (see weakness 9 below).
5. **Neutral battle stance as the build pose.** Standing, facing `+x`, weight on all feet, ready. Attacks, strikes and punches are animation, not the build pose.
6. **Fit the footprint.** The solid body (no FX) fits its size class (see table; `npm run stats` and the preview's Size boxes check it). Battle formation slots are fixed; a creature that does not fit overlaps its neighbour.
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
- Swarms of particles (embers, sparks, motes) are one `InstancedMesh` whose instances `update(t)` places, not one mesh per particle (Emberwolf's embers show how).
- Anything that moves on its own after `finish()` must be moved by `update(t)` or be a rig joint, or `merge()` will not know to keep it separate. Mark a part `userData.noMerge` if something else moves it.
- Triangle budget: aim for 60k; over 120k needs a reason. Mark small parts `noOcc`. The game runs on a laptop (P1), so detail may win over thrift, but twelve creatures share one frame.
- Put asymmetric detail (a scar, a moss patch, a raised paw) on the **+z flank**. It is the show side: the battle camera only ever sees +z, on both teams, because enemies are mirrored.
- Fill the class. A creature far below its class height reads as small and weak on the field; a low animal (a crocodile) should ride high on its legs.
- Animate a material shared by many parts (Tidefang's one crystal material pulsing) rather than many materials: `merge()` still merges the parts that share it.
- Effects that belong to a moment (shields, slashes, bursts) are hidden at rest and shown by `clipFx` during the clip that calls them, as Wardshell's wards and Sunmane's slashes are.
- Pale frost or tips on hair locks read as feathers or plates, not hair: keep `tipAmt` low (about 0.25) when the tip colour is much paler than the root (Grandtusk).
- A creature whose face points forward (an owl's disc) shows it edge-on to the side camera. Turn the head a quarter toward +z in the rest pose, as Duskseer does, so the face reads in battle.
- A bruiser's fists must stand clear of the body in the guard, or the silhouette is one blob: Ironpaw's first guard tucked them under the chin and the role vanished.
- The element shape on the top line must read **from the side**: build it in the x-y plane the camera sees. Sunmane's first corona radiated in y-z and, seen edge-on, looked like lightning bolts; as a sunburst fanned in x-y it reads as sun at once.
- Glow colours from the element's ramp (the type wheel's colour keys in `docs/roadmap.md`); eyes may stay warm amber as the house signature.

### The battle camera

Battles are seen **from the side** (player left, enemy right), from above. Design and judge every creature in that view: profile silhouette first, then three-quarter. The turntable on the sheet is for close-up checking only.

**Formation and camera (locked, roadmap 0.2; `FORMATION` in `src/arena/layout.js`).** Each team stands in two rows of three. The front row is 4.5 from the centre line, the back row 6.5 behind it, and the three columns are 6 apart across the field. The camera looks from the +z side, 30° above level, with a 26° field of view, aimed at height 3, and pulled back until both back rows fit across a 16:9 screen. Enemies are **mirrored** (`scale.x = -1`), not turned round, so both teams show the camera their +z flank.

**Size classes (firm; `CLASSES` in `src/arena/layout.js`).** Measured on the solid body: lit parts only, no glow, no `noFit` FX, at `t = 0`. Each creature's class is `size` in `src/creatures/index.js`.

| Class | Length (x) | Height (top) | Depth (z) | Why |
| --- | --- | --- | --- | --- |
| S | 3.5 | 3.5 | 3.0 | |
| M | 4.5 | 3.75 | 3.5 | |
| L | 6.5 | 4.0 | 4.0 | Length: the row gap is 6.5, so two L creatures in line just touch nose to tail. Height: above 4.0 a creature in a near column hides the feet of the one behind it (9 px at 4.25, 20 px at 4.5). Depth: columns are 6 apart, so 4.0 leaves 2 between neighbours. |
| F (flyers) | 4.5 | 4.25 | wingspan 6.0 | Wings may fill the whole lane. The lowest point must be at least **0.8** above the ground, so it reads as flying. |

**Battle light (locked, roadmap 0.6; `src/arena/stadium.js`).** The same for both teams: a key light high over the camera's side of the centre line (so player and enemy faces are lit alike), a cool rim from straight behind on every top line, a sky fill, one 4096 shadow map fitted to the formation, and soft contact shadows. A **selective bloom** (`glow.js`) haloes only unlit glow parts (flames, eyes, runes, crystals); bodies are drawn exactly as without it. Judge creatures under this light: glow that does not pop here does not pop in battle. Mark a glow part `userData.noBloom` to keep it out of the bloom.

On screen, from front-middle at 720p, a top of 3.5 stands about 128 px tall, 4.0 about 148 px; the near column adds about 10 %, the far column takes off about 9 %.

### Known weaknesses (from the renders; fix these before making more)

Phase 1 reworked all eleven to the friendly look (October 2026); every one fits its size class. Fixed along the way: balloon limbs, petal manes, baked action poses (Stormtalon's dive, Sunmane's swipe, Ironpaw's punch are clips now), FX bleeding into neighbours, oversized creatures, tiny faces, glowing slit eyes and snarls. Lessons that still apply are in the SHOULD rules above. What is left:

1. **Pyrewing costs three times the draw calls** of the others (152 merged meshes against about 40 to 60). Trim it before battles get busy.
2. **Ranged ultimates aim at a fixed point.** `clipFx` is not told where the target stands, so Pyrewing's feather volley lands in front of the same column only. Every ranged creature (A10) needs the target position passed to `clipFx`.
3. **Small looks:** Tidefang shows a darker band where its teal meets the cream belly; Wardshell's eyes read a little sleepy close up; Sunmane's sun glyphs barely show on the golden coat; Pyrewing's wingtip flames read as separate drops.
4. **Blink phase:** stills are taken at `t = 0`, so every blink is offset (`(t + 2.5) % period`) to keep the eyes open in them. Keep that in new creatures.
5. **Wings face the camera edge-on when spread flat.** Both flyers hold their wings raised in a V so the side camera sees them; a flyer whose span matters to its look needs the same thought.

### Checklist before you call a creature done

- [ ] Silhouette recognisable in the battle preview's Silhouette mode, **from the side**, at true size (`npm run render -- --battle <id>`).
- [ ] Passes the Emberwolf test: friendly mid-value body, bright round eyes under a soft brow, element growing from the body, element shape on the top line, weapon on show but not menacing.
- [ ] Role readable from the outline.
- [ ] Body counter-shaded, one element accent, eyes glow and blink.
- [ ] Neutral battle stance, faces `+x`, feet on `y = 0` (or hover base for flyers).
- [ ] `npm run stats` says it fits its size class; FX inside the `fx` group and within reach.
- [ ] Rigged: returns `rig`, legs and tail built with `limb()`, and the preview's **Flex** leaves nothing behind.
- [ ] Every clip in the preview's **Play** row reads well against a target: feet planted, nothing sinks into the field or comes loose.
- [ ] `npm run stats`: about 60k triangles, never over 120k without a reason.
- [ ] `npm run render -- <id> --head` looked at, beside two neighbours.
- [ ] `index.js`, `docs/creatures.md` and the README table updated.

---

## Battle target (from the reference screenshot)

What *Pocket Incoming* does, which is what we are copying unless a decision says otherwise:

- **6 v 6**, each side in two rows of three (front and back), player on the left facing right, enemy on the right facing left. Our creatures face `+x`; the enemy side is mirrored (`scale.x = -1` on a parent; `faceSlot` in `src/arena/layout.js`).
- **Fixed camera**, side-on from an elevated three-quarter angle, over a stadium field with a centre circle.
- **Auto battle.** Pause and speed (x1 / x2) buttons; turn limit shown as `01 / 10 turn`. The player does nothing during a fight.
- **Turn order bar** on the right edge: portraits stacked in speed order, the next actor at the bottom, highlighted.
- **Per-creature HUD:** level badge, HP bar, and an energy bar under it that fills toward an ultimate.
- **Damage feedback:** floating numbers with the multiplier (`-13628 (x1.20)`), labels "Extremely Effective" / "Low Effective", and a running Total DMG counter.
- **AoE skills** that hit a row or the whole enemy side (several numbers pop at once).
- Trainer portraits and levels at the top corners.

## Decisions

Made by the owner, October 2026. Treat them as rules.

### Art

| # | Decision |
| --- | --- |
| A1 | **Render style: 3D clay figures** (the current procedural look). No toon shading, no 2D sprites. |
| A2 | **Tone: friendly adventure, like Pokémon** (revised October 2026; first set as "heroic"). Mid-value, gently coloured bodies, neither too dark nor too bright, childlike but not babyish, never creepy. Emberwolf is the benchmark (see above). |
| A10 | **Some creatures attack from range** (projectiles, beams, bursts) instead of lunging. Which ones, and how a ranged attack looks, is set per creature; the clip system's `travel` track can stay at zero for them. |
| A3 | **No evolution for now.** Wanted later; not in the first rounds. Do not design evolution stages yet. |
| A4 | **Roster target: 30 to 60** unique creatures. |
| A5 | **Side view** battle camera. |
| A6 | **Rework the existing creatures** freely to match the wolf's vibe. Nothing is sacred. |
| A7 | **Attacks are full-body lunges and strikes.** Every creature needs a rig (joint groups for legs, neck, head, jaw, tail, wings) that animation can drive. Skill art (effects) comes later. |
| A8 | **Every creature gets a unique ultimate**, with its own art. Most of the project's work is art. |
| A9 | **Roles show in the silhouette** (see "Roles shape the silhouette"). |

### Roster and elements

| # | Decision |
| --- | --- |
| R1 | **Ten types** (confirmed October 2026): Fire, Water, Grass, Electric, Ice, Ground, Dark, Light, Dragon, Neutral, close to Palworld's nine with Light added as Dark's partner. The wheel, the chart and each type's glow ramp are in [docs/roadmap.md](docs/roadmap.md#type-wheel). The eleven: Emberwolf and Pyrewing **Fire**; Tidefang and Wardshell **Water**; Thornstag **Grass**; Stonemaul **Ground**; Stormtalon **Electric**; Sunmane **Light**; Duskseer **Dark**; Ironpaw **Neutral**; Grandtusk **Ice** (a woolly mammoth). A creature takes its type's glow ramp when it is reworked. |
| R2 | **Each creature has one fixed element.** Element variants of a creature (an ice Emberwolf, an electric one) come in a **second round**, chosen by the owner. **Round one is unique creatures only.** |

### Battle

| # | Decision |
| --- | --- |
| B1 | 6 v 6, front row and back row. **The front row shields the back row from basic attacks.** Skills may target a row, a column or the back row; skill targeting rules are set **after the creatures are done**. |
| B2 | **Turn order: speed plus a refilling action bar.** The bar on the right of the screen shows the order of action. Battles are counted in rounds, and a fast creature can act twice in one round. |
| B3 | **Energy** (the yellow bar) fills during the fight. When full, the creature uses its ultimate **on its next turn** (it waits for its turn). |
| B4 | **Turn limit reached: the side with the most HP remaining wins.** |
| B5 | Multiplicative damage formula, with crits, dodge, buffs and debuffs, and status effects. |
| B6 | **Type multipliers: x1.2 strong, x0.8 weak.** |
| B7 | **No player input during battle.** The game is team building and placement. |

### Platform

| # | Decision |
| --- | --- |
| P1 | **Laptop browser** (three.js), 16:9 landscape. Mostly played on a laptop; phones are not a target. |
| P2 | **Target 60 fps on a laptop** with 12 creatures on screen. Budgets are generous ("go wild"), but draw calls still add up across twelve creatures. |
| P3 | **PvE only**, hobby project. May change if it is ever published. |

### Still open (ask; do not assume)

1. The exact action-bar formula: bar length, how speed fills it, how a round is counted.
2. Turn-limit tiebreak: HP remaining as a percentage of max HP, or absolute HP.
3. Stat set and the damage formula's numbers.
4. Skill targeting rules (row, column, back row), after the creatures are done.
5. Whether fights are reproducible from a seed (for replays and testing). Parked until the art is done.

Record each answer here when it is made, and turn the matching "provisional" rules above into firm ones.
