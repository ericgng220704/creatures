# Roadmap

The plan for the whole game, in phases. Art comes first, then the fight, then everything else. Decisions referred to as A1, B3 and so on are in [CLAUDE.md](../CLAUDE.md#decisions).

Each phase has a goal, its deliverables and a "done when" test. A phase is finished when its test passes, not when its list is ticked. Sizes are rough: **S** is about one working session, **M** two to four, **L** more.

```
Phase 0  Art foundations         battle view, rig, performance, lighting; Emberwolf as the pilot
Phase 1  Rework the ten          every existing creature brought up to the wolf
Phase 2  Battle rules + sim      the fight on paper and in a headless simulator    (can run beside phase 1)
Phase 3  Battle scene            6 v 6 on the stadium, HUD, playing back the sim
Phase 4  Roster to 30            19 new unique creatures, filling the type wheel
Phase 5  Skills and ultimates    targeting rules, a unique ultimate per creature, skill art
Phase 6  Roster to 60            31 more, then element variants (round two)
Phase 7  The game around it      team builder, PvE stages, levels and rewards
Later    Evolution, PvP, publishing
```

---

## Phase 0: Art foundations

**Goal:** before reworking ten creatures, build the tools that judge them, and the rig and performance pipeline they will all share. Prove it all on Emberwolf, the benchmark.

| # | Deliverable | Size |
| --- | --- | --- |
| 0.1 | ✅ **Battle preview page** (`battle.html`, `src/preview/`). A 16:9 stage (1280 x 720 in renders) with the side camera, the stadium, and a 6 v 6 formation you set slot by slot (or Solo, All of it, Roster mix). Toggles for **Silhouette**, **Size boxes** (class box green or red, the real body box, and each creature's height on screen in px at 720p), **Enemy turned** (instead of mirrored), **Creature lights** and **Freeze**. Sliders for the camera and formation; every setting is in the URL. `npm run render -- --battle` writes the PNGs. | M |
| 0.2 | ✅ **Formation and camera, fixed.** Locked in `src/arena/layout.js` (shared by the preview and the future battle scene): camera 30° above level, field of view 26°, aim 3; front row 4.5 from the centre line, row gap 6.5, column gap 6; enemies mirrored, so the camera always sees the +z flank. Size classes made firm and derived from the layout (length, height, depth, flyer span and lift); `npm run stats` and the preview both check them. | S |
| 0.3 | ✅ **Rig convention in the kit** (`src/kit/rig.js`). `limb()` builds a leg, arm, neck or tail as a chain of joints; `hang()` and `bind()` put paws, claws and tufts on the right joint; `chain()` wraps existing groups; `makeRig()` makes the standard rig (`plan, body, neck, head, jaw, ears, tail, legs, arms, wings, extra`) and saves each joint's rest pose. **Emberwolf is fully rigged** (four leg chains, five-joint tail), pixel-identical at rest; the other ten return the joints they already had (wings, trunk, ears, arms) and get legs in phase 1. The preview gained **Joints** and **Flex** toggles to check rigs. | M |
| 0.4 | ✅ **Animation clips** (`src/kit/anim.js`). `attack` (crouch, leap, bite, hop home), `ultimate` (trembling wind-up, high leap, slam), `hit`, `faint` (holds) and `victory` (rears and howls), as keyframe tracks over k = 0 to 1 with an impact moment and a travel track, shared per plan (quadruped feet, biped arms, flyer wings) and overridable track by track per creature. Legs keep their feet planted with two-bone IK. The idle stays `update(t)`. The preview's **Play** row runs them (Attack, Ultimate, All attack, Hit, Faint, Victory, Exchange). | M |
| 0.5 | ✅ **Performance pipeline** (`src/kit/compact.js`). `bakeLights()` bakes each creature's `PointLight` into its parts as per-vertex emitted light and removes it (no more colour spilling onto neighbours); `merge()` finds what moves by watching `update(t)` and merges everything else into one mesh per material per joint. All eleven: 2,208 meshes to 682, shadow casters 1,718 to 267, renders unchanged. Not done: a shared particle pool (embers and flames are now most of what is left: Pyrewing 138, Emberwolf 108 meshes), and a frame-rate check on a real GPU, which the preview's readout now gives you. | M |
| 0.6 | ✅ **Battle lighting, locked.** Key light moved over the centre line so both teams are lit alike (enemies' faces were in shadow), rim light from straight behind, sky fill, one 4096 shadow map fitted to the formation, contact shadows kept. Selective bloom (`src/arena/glow.js`) haloes only the unlit glow parts, added over an unchanged frame. Preview: **Bloom** toggle. | S |
| 0.7 | ✅ (two clicks left for the owner) **A link instead of `npm run dev`.** `.github/workflows/pages.yml` builds both pages and publishes them to GitHub Pages on every push to `main`; the pages link to each other; the production build was checked served from a `/creatures/` subfolder, as Pages serves it. To switch it on: Settings > Pages > Source: "GitHub Actions", then merge this work into `main`. The preview is then at `https://ericgng220704.github.io/creatures/battle.html`. | S |
| 0.8 | **Emberwolf, the pilot.** Merged, relit, all six clips, checked in the battle view (its rig came early, in 0.3). Add a neck joint and joint blobs if the clips open gaps at the shoulder or knees. Small art fixes only; the look is already the target. | M |

**Done when:** a 6 v 6 of twelve Emberwolves (or a mix of rigged and not-yet-rigged creatures) runs the attack clip in the battle preview at 60 fps on your laptop, and the wolf still looks like the wolf.

---

## Phase 1: Rework the ten

**Goal:** every existing creature has the Emberwolf vibe, its new element, its role's silhouette, a rig and the six clips, inside its size class, in a neutral stance.

Order: most broken first, so the lessons arrive early.

| # | Creature | New element (proposed) | Role | Main work |
| --- | --- | --- | --- | --- |
| 1.1 | Sunmane | Light | Attacker | New mane (broad curved clumps, not spikes); neutral stance instead of the baked swipe (the swipe becomes its attack clip); darker coat for contrast; limbs without the balloon seams. |
| 1.2 | Ironpaw | Neutral | Bruiser | Less cartoon: heavier brow, glowing slit eyes, a fighter's build; neutral guard stance (the punch becomes the attack); keep the headband. Fits size class S (now too tall). |
| 1.3 | Duskseer | Dark | Support | Lose the moon, branch and ground ring; heroic brow over the big eyes (no glasses look); stands on the field. |
| 1.4 | Grandtusk | Neutral (or Ice, see the type wheel) | Tank | Bigger readable eyes under the brow, legs without seams, value contrast; shorter to fit class L. |
| 1.5 | Stonemaul | Ground | Tank | Rocks and rune rings into a small `fx` group or gone; bigger eyes; trim the armour so the silhouette reads from the side. |
| 1.6 | Wardshell | Water | Tank | Shields tight round the body (or only shown when it defends); water glow; bigger head and eyes. |
| 1.7 | Tidefang | Water | Attacker | Taller, less flat; bigger head; shorter tail for the slot; under 60k triangles. |
| 1.8 | Thornstag | Grass | Support | Heavier body, smaller antler crown for class M; under 60k triangles. |
| 1.9 | Stormtalon | Electric | Speedster | Wingspan down to 6.0; wind ribbons become lightning; a perched or hovering battle stance; storm crest on the top line. |
| 1.10 | Pyrewing | Fire | Speedster | Wingspan down to 6.0; hover stance; check it reads apart from Emberwolf (both Fire). |

Each creature: one session or two (**M** each). After each, update `docs/creatures.md`, the README table, and render the full current roster side by side in the battle view.

**Done when:** all eleven stand in one 6 v 6 battle preview, pass the CLAUDE.md checklist, and look like one family.

---

## Phase 2: Battle rules and simulator

**Goal:** the fight works as numbers before it works as pictures. Independent of the art, so it can run beside phase 1 when you want a break from art.

| # | Deliverable | Size |
| --- | --- | --- |
| 2.1 | **`docs/battle.md`**: the rules. Stats, damage formula, action bar, rounds, energy, ultimates, front row shielding, crits, dodge, buffs, debuffs, status effects, the turn-limit win (B1 to B7), with the open questions answered. | M |
| 2.2 | **Headless simulator** in `src/battle/`: plain JavaScript, no three.js. Takes two teams, returns an event log (who acts, on whom, damage, multiplier, crit, energy, KOs, round changes). `npm run sim` fights two teams in the terminal. Uses a seeded random generator internally so balance changes can be compared run against run (this does not decide question 6, replays). | M |
| 2.3 | **Balance harness.** `npm run sim -- --many 1000`: win rates by creature, type and role, average fight length, how often the turn limit decides it. | S |
| 2.4 | **Stats for the eleven.** A data file of base stats per creature that fits its role. | S |

A starting proposal for 2.1, to argue with rather than to adopt:

- **Stats:** HP, ATK, DEF, SPD, CRIT rate, CRIT damage, DODGE, plus energy gain.
- **Action bar:** every creature's bar fills by its SPD each tick; at 1000 it acts and drops back to 0. A round is a fixed number of ticks, so a creature with twice the speed acts twice in a round (B2). The right-hand bar previews the next acts in order.
- **Damage:** `ATK x skill power x 1000 / (1000 + DEF) x type (1.2 / 1.0 / 0.8) x crit x buffs x a 0.95 to 1.05 roll`.
- **Energy:** gained when acting and when hit; at full, the next act is the ultimate (B3).
- **Targeting (basic attacks):** the nearest living front-row enemy; the back row only once its front row is gone (B1).
- **Turn limit:** 10 rounds; then the side with the higher remaining HP wins (percentage or absolute is still open).

**Done when:** a thousand simulated fights between sensible teams finish, mostly before the turn limit, and no single creature or type wins far more than its share.

---

## Phase 3: Battle scene

**Goal:** the screenshot, working. A simulated fight played back on the stadium with real creatures.

| # | Deliverable | Size |
| --- | --- | --- |
| 3.1 | **Stadium.** Field with lines and the centre circle, stands and lights as cheap backdrop geometry. One renderer, one scene; each creature kind built once and cloned (README "Towards a game"). | M |
| 3.2 | **Playback.** Reads the simulator's log and plays it: the attacker lunges to its target, strikes, returns; the target plays `hit`; KOs play `faint`; the winner plays `victory`. x1 / x2 speed and pause. | M |
| 3.3 | **HUD.** Level badge, HP and energy bars over each creature, the turn-order bar on the right, floating damage numbers with multiplier and "Extremely Effective" / "Low Effective", total damage, round counter `01 / 10`, trainer portraits. | M |
| 3.4 | **Placeholder hit effects** per element, so attacks read before skill art exists. | S |
| 3.5 | **Performance pass.** 60 fps with twelve creatures on your laptop, full screen. | S |

**Done when:** you can watch a full 6 v 6 fight in your browser, start to finish, and it feels like the reference.

---

## Phase 4: Roster to 30

**Goal:** nineteen new unique creatures (round one: no variants, R2), filling the type wheel to three per type with a spread of roles.

Per creature: concept (animal base, element, role, size class, its element shape on the top line, its weapon) agreed with you first, then build, rig, clips, stats. About **M** each. Do them in pairs of different types so every week the roster gets wider, not deeper.

Concept seeds, to discuss and replace freely:

| Type | Have | Seeds for new creatures |
| --- | --- | --- |
| Neutral | Ironpaw, Grandtusk | a war ram (bruiser) |
| Fire | Emberwolf, Pyrewing | a magma rhino (tank) |
| Water | Tidefang, Wardshell | a storm-sea otter or seal (speedster) |
| Grass | Thornstag | a mantis (attacker), a bark-armoured boar (tank) |
| Electric | Stormtalon | a thunder jackal (attacker), a dynamo ram or goat (tank) |
| Ice | none | a frost lynx (speedster), a woolly mammoth or ice bear (tank), an aurora fox (support) |
| Ground | Stonemaul | a pangolin (tank), a sand drake or monitor lizard (attacker) |
| Dark | Duskseer | a shadow panther (attacker), a bat (speedster) |
| Light | Sunmane | a crane (support), a white stag or unicorn (support or tank) |
| Dragon | none | a wyvern (speedster), a horned drake (attacker), a dragon turtle (tank) |

**Done when:** thirty creatures pass the checklist, the simulator is balanced across them, and the roster screen reads as one family.

---

## Phase 5: Skills and ultimates

**Goal:** each creature fights in its own way (A8).

| # | Deliverable | Size |
| --- | --- | --- |
| 5.1 | **Skill rules:** targeting by row, column, back row, all; healing, shields, buffs and debuffs, status (B1 left these until now). Added to `docs/battle.md` and the simulator. | M |
| 5.2 | **A skill kit for effects:** slashes, beams, projectiles, area bursts, auras, screen shake, hit-stop, built from the same unlit glow pieces the creatures use. | M |
| 5.3 | **A unique ultimate per creature**, art and timing: a wind-up pose, the effect, and the hit. | M each |

---

## Phase 6: Roster to 60, then variants

- Thirty more unique creatures, same process as phase 4.
- **Round two (R2):** element variants of existing creatures, chosen by you (an ice Emberwolf, an electric one...). Variants share the body and rig and change palette, element features and ultimate, so each costs far less than a new creature. Needs a small "element skin" layer in the creature builders.

---

## Phase 7: The game around the battle

Only after the fight is fun. Team builder with placement on the 2 x 3 grid (B7: the whole game is here), a PvE ladder of stages with enemy teams, levels and stats growth, collection screen, saving progress in the browser.

## Later

Evolution (A3), PvP and a server (P3), publishing and the questions that come with it.

---

## Type wheel (proposed)

Ten types, close to Palworld's nine, with Light added as the partner of Dark. **Not decided yet**: confirm or change it before any creature is re-coloured.

**Strong against** (x1.2 when attacking; the reverse direction is x0.8 weak):

| Attacker | Strong against |
| --- | --- |
| Fire | Grass, Ice |
| Water | Fire |
| Grass | Ground |
| Ground | Electric |
| Electric | Water |
| Ice | Dragon |
| Dragon | Dark |
| Dark | Neutral, Light |
| Light | Dark |
| Neutral | none |

Dark and Light are strong against each other (both directions x1.2). Every other pair is x1.0.

**Element colour keys** (the glow ramp each type owns; body palettes stay dark and quiet):

| Type | Glow ramp (deep > mid > core) |
| --- | --- |
| Fire | `#ff4510` > `#ff8d1c` > `#ffe885` (Emberwolf's) |
| Water | `#0099ff` > `#3fd2ff` > `#c9fbff` (Tidefang's) |
| Grass | `#4c973a` > `#78c255` > `#c4ff86` |
| Electric | `#ffb800` > `#ffe23a` > `#fffbd0`, with a cold `#9fd8ff` edge |
| Ice | `#4aa8ff` > `#a8e4ff` > `#f2fdff` |
| Ground | `#c96a1a` > `#ffb347` > `#ffe0a0` (Stonemaul's amber) |
| Dark | `#5a2bbf` > `#a58cff` > `#e6dcff` |
| Light | `#ffb02e` > `#ffcf5a` > `#fff6d0` |
| Dragon | `#c0185a` > `#ff4f9a` > `#ffd0e6`, or a teal alternative |
| Neutral | `#b0b6c4` > `#e2e6ee` > `#ffffff` (the creature's own trim colour may stand in) |

Water and Ice, and Fire and Light, sit close together; their creatures must also differ in shape (crystal versus frost, flame versus sun rays), not only in hue.
