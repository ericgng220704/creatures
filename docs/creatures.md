# The creatures

Generated from `src/creatures/index.js` by the export. Edit the source, not this file.

## Emberwolf

`emberwolf` · element: Fire · `src/creatures/emberwolf.js`

A heavy-shouldered wolf whose fire lives in its coat.

- **Body.** Deep chest, tucked waist, bent hind legs on hocks, toes and claws.
- **Coat.** Blue-grey, a shade darker along the back, cream on the chest and belly. Soft overlapping locks of fur make the ruff, cheeks, chest fringe, spine and tail, darker at the root and paler at the tip.
- **Face.** Round amber eyes with a catchlight under a soft brow, a jaw that breathes a little open on two fangs and a tongue.
- **Fire.** A mane of layered flame from crown to back, a burning tail, ember veins, rising sparks and firelight on its own fur.

- **Rig.** The pilot for every creature (roadmap 0.8): a neck joint carrying the head, the outer ruff and the crown of the mane; four legs as joint chains with planted feet; a five-joint tail. Attacks with a crouch, a leap and a bite; its embers are one instanced mesh.

Cost: 227 parts, 77,258 triangles, built in about 343 ms; 57 meshes once merged.

## Tidefang

`tidefang` · element: Water · `src/creatures/tidefang.js`

A heavy armoured crocodile carrying the sea in crystal, high on its arms, jaws wide.

- **Body.** Long, deep and round-bellied, carried high on muscled arms with elbow knuckles, scutes up the back of each limb and a small crystal at every elbow. Webbed feet: five clawed toes in front, four behind.
- **Armour.** Keeled scutes in rows, a double crest down a shorter tail, dark bands across a deep teal back, a pale belly.
- **Face.** A big deep head, eye turrets with glowing eyes, a bulb nose, and an interlocking jaw with two long fangs a side.
- **Crystal.** Glowing clusters down the spine and a crystal fan at the tail, all pulsing together, and wave lines on each flank.
- **Rig.** Reworked to the Emberwolf benchmark (roadmap 1.7): legs as joint chains with planted feet, a neck, the jaw; the tail still swims on its own wave. Its attack throws the jaws wide and slams them shut.

Cost: 317 parts, 65,178 triangles, built in about 150 ms; 65 meshes once merged.

## Thornstag

`thornstag` · element: Grass · `src/creatures/thornstag.js`

A gentle forest stag whose antler crown blooms with living green light.

- **Body.** A deep barrel of ribs, a tucked flank, strong shoulders and thighs, long legs with knees and hocks on cloven hooves, a short raised tail fringed with locks.
- **Coat.** Warm fawn, a shade darker along the back, cream on the belly, throat and rump, with a mantle of moss and grass down the spine and a vine wound round the neck.
- **Face.** Round hazel eyes under a soft fawn brow, large ears that flick, and a long muzzle closed in a calm line.
- **Bloom.** An antler crown fanned wide and low in the side plane, green veins of light along the beams, and a bloom of leaves, glowing leaves and buds on every tip, the shape that says Grass from the side; leaves of light drift round it and seeds rise.
- **Thorns.** Its attack lowers the crown and tosses it up through the target; its ultimate bursts a ring of glowing thorns from the ground at its forefeet.
- **Rig.** Reworked (roadmap 1.8): legs as joint chains with planted hooves, a neck joint carrying the head and vine, a three-joint tail, the antler crown as an extra chain.

Cost: 277 parts, 53,847 triangles, built in about 511 ms; 58 meshes once merged.

## Stonemaul

`stonemaul` · element: Ground · `src/creatures/stonemaul.js`

A huge bear in stone and iron, stone spires cracked with amber light along its hump, claws as weapons.

- **Body.** A great shoulder hump, a deep barrel chest, pillar forelegs and a heavy rump under a thick ruff.
- **Spires.** Jagged stone spires along the hump, cracked with amber light and burning at the points, the shape that says Ground from the side.
- **Armour.** Stone gauntlets with iron bands and spikes and slimmer stone pauldrons, lined with amber rune light.
- **Claws.** Four steel claws on each forepaw, long and hooked down.
- **Face.** Round honey eyes under a soft brow of fur, a mouth just open on two small fangs.
- **Rig.** Reworked to the Emberwolf benchmark (roadmap 1.5): the ground rings and orbiting rocks are gone; legs as joint chains with the gauntlets on the forearms, a neck carrying the head and outer ruff. Its attack rears up roaring and brings both clawed forepaws down.

Cost: 249 parts, 90,764 triangles, built in about 183 ms; 41 meshes once merged.

## Wardshell

`wardshell` · element: Water · `src/creatures/wardshell.js`

A deep-sea tortoise, its domed shell crested with breaking waves, its wards rising when it is struck.

- **Shell.** A high dark dome of raised hexagonal plates with sunken seams, a gold rim with stone spikes, and a line of water light rippling round it.
- **Crest.** Four breaking waves along the spine of the shell, dark fins with crests of glowing water, the shape that says Water from the side.
- **Body.** Pillar legs in stone shin plates and gold bands with blunt nails, a short spiked tail, a neck that reaches out from a gold collar.
- **Face.** A big heavy head, stern brow scutes over amber eyes, a hooked beak that snaps, and a water gem on the crown.
- **Wards.** Six shields of water light that rise and circle it when it is struck, and swirl round it in its ultimate.
- **Rig.** Reworked to the Emberwolf benchmark (roadmap 1.6): the orbiting shields only appear when it is hit or calls them (`clipFx`); legs, tail and a two-joint neck as chains, a beak jaw. Its attack draws the neck back and snaps out at the target.

Cost: 93 parts, 60,695 triangles, built in about 102 ms; 57 meshes once merged.

## Pyrewing

`pyrewing` · element: Fire · `src/creatures/pyrewing.js`

A young phoenix hovering on raised wings, warm red-orange with a golden breast, a crest and tail of living flame.

- **Body.** A plump, deep-chested teardrop with a round breast of small layered feathers, feathered thighs, and golden shins drawn up under it with three ivory talons forward and one back.
- **Plumage.** Red-orange, a shade deeper along the back and warmer orange low on the flanks, with a golden cream breast and belly. The wing and tail feathers run from deep red at the quill to golden tips.
- **Face.** A big round head with round amber eyes on pale golden patches, a soft brow and a small hooked golden beak that can open.
- **Fire.** A crest of three plumes swept back from the crown, each tipped with flame; flames along the back, burning tips on the longest flight feathers, three streamers of flame for a tail, sparks drifting off it and firelight on its own feathers.
- **Strike.** It attacks with a diving swoop, raking talons and a fiery swipe. Its ultimate is ranged: it rears in a sunburst of flame and flings a volley of burning feathers at the target.
- **Rig.** Reworked (roadmap 1.10): wings as arm > forearm > hand chains raised in a ready V, a neck joint carrying the head and crest, a jaw, a 3-joint tail, legs as joint chains.

Cost: 307 parts, 51,005 triangles, built in about 328 ms; 152 meshes once merged.

## Stormtalon

`eagle` · element: Electric · `src/creatures/eagle.js`

A storm eagle hovering on raised wings, a crest of lightning crackling on its crown.

- **Body.** A deep chest held high and the tail end dropping as it hangs in the air; short yellow legs in feathered trousers, talons curled under.
- **Wings.** Raised high in a V with the hands swept back and fingered tips, warm brown paling to buff at the edges, beating slowly; a lightning vein runs down each one.
- **Face.** A big round white head, round golden eyes that blink, and a short yellow hooked beak that opens.
- **Storm.** A crest of lightning plumes fanned back from the crown, the shape that says Electric from the side; arcs crackle round the bird and sparks jump off it. Its attack dives and throws the talons forward in a burst of sparks; its ultimate calls a bolt down from the sky onto its target.
- **Rig.** Reworked (roadmap 1.9): wings as arm > forearm > hand chains raised in a ready V, a neck joint carrying the head, hood and crest, a beak jaw, a tail joint, legs as joint chains.

Cost: 266 parts, 38,796 triangles, built in about 140 ms; 60 meshes once merged.

## Sunmane

`lion` · element: Light · `src/creatures/lion.js`

A lion braced to pounce, its mane crowned with a corona of sunfire, claws ready.

- **Mane.** Three rings of clumped locks swept back toward the shoulders, warm brown at the root and honey at the tip, longest on the crest, with a beard and a cape along the spine.
- **Corona.** A sunburst over the mane: an arc of light from brow to nape with long and short rays fanning out of it, the shape that says Light from across the field.
- **Body.** A tawny golden coat with a cream belly over a deep chest, heavy shoulders and haunches, sun glyphs burning under the fur, and a tufted tail with a spark of sun at its tip.
- **Face.** Round amber eyes under a soft golden brow, a jaw just open on two small fangs.
- **Strike.** Its attack rears up and swipes the right forepaw through, four long claws out, with three golden slashes that flare as it lands.
- **Rig.** Reworked to the Emberwolf benchmark (roadmap 1.1): a neck joint carrying the head, mane and corona; four legs as joint chains with knobs at elbow and knee; a five-joint tail; its own attack and slashes (`clipFx`).

Cost: 238 parts, 86,050 triangles, built in about 120 ms; 38 meshes once merged.

## Grandtusk

`elephant` · element: Ice · `src/creatures/elephant.js`

A woolly mammoth in a shaggy frost-tipped coat, ice ridged along its hump, tusks rimed with frost.

- **Coat.** A warm mid-brown coat over a vast barrel and a high shoulder hump, with a skirt of long shaggy locks round the belly and legs, lighter at the tips, and frost veins glowing under the fur.
- **Ridge.** A row of ice crystals along the hump and back, leaning back, the shape that says Ice from the side.
- **Tusks.** Great ivory spirals curving up and in, banded with frost, their points rimed with glowing ice and small crystals.
- **Face.** A high domed skull, small furred ears, round ice-blue eyes under a soft brow, a frost rune on the brow, and an eight-joint trunk furred at the root.
- **Rig.** Reworked to the Emberwolf benchmark as an Ice mammoth (roadmap 1.4): pillar legs as joint chains with planted feet, a neck under the hump, a short tail chain, the eight-joint trunk. Its attack rears, curls the trunk and drives the tusks up through the target.

Cost: 187 parts, 73,684 triangles, built in about 115 ms; 42 meshes once merged.

## Ironpaw

`panda` · element: Neutral · `src/creatures/panda.js`

A panda fighter in a low guard, fists up and wrapped, white qi burning off its shoulders.

- **Guard.** A low, wide stance on planted black legs, the right fist leading and the left held back at the chin, forearms wrapped in red, fists bound in cream with gold knuckle plates.
- **Qi.** Pale flames of qi rising off the shoulders and back along the top line, qi lines burning on the chest and forearms, a glow and sparks round each fist.
- **Face.** A heavy round head, black patches with slit eyes under a black brow, a snarl with fangs, and a red headband with a gold plate and two tails that stream behind.
- **Strike.** Its attack swings the lead arm up level and snaps the elbow straight into a punch; its ultimate throws a left and then a right.
- **Rig.** Reworked to the Emberwolf benchmark (roadmap 1.2): the first biped rig, with legs and arms as joint chains (feet planted, elbows that straighten into punches) and a neck joint.

Cost: 80 parts, 52,090 triangles, built in about 71 ms; 40 meshes once merged.

## Duskseer

`owl` · element: Dark · `src/creatures/owl.js`

A horned owl of the night, stern under a V brow, a crest of shadow quills burning violet.

- **Face.** A pale heart-shaped disc, amber eyes under a stern black V brow, a hooked beak that opens, tall ear tufts tipped with violet; the head rests turned toward the camera, as an owl's does.
- **Crest.** Shadow quills fanned from crown to nape, violet with pale cores, the shape that says Dark from the side.
- **Plumage.** Near-black indigo on the back, a muted lavender breast of barred scale-feathers, wings folded down the sides with a violet crescent and rune lines on each, a short dark tail.
- **Stance.** Upright on short feathered legs, three hooked talons forward and one back, motes of starlight drifting round it.
- **Rig.** Reworked to the Emberwolf benchmark (roadmap 1.3): the moon, branch and ground ring are gone; legs as joint chains with planted talons, wings on shoulder joints that flare, a neck, and a jaw in the beak. Attacks with a talon-first leap, wings flared (the shared perched clips).

Cost: 139 parts, 21,424 triangles, built in about 44 ms; 28 meshes once merged.

