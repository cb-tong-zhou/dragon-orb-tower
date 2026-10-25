# Map Story Brief — Dragon Orb Tower

**For:** the agent modifying the map visuals.
**From:** the story plan in `STORY_PLAN.md` (approved 2026-10-24; Revision 2).
**Companion:** `STORY_COPY_DECK.md` (canonical strings; the map must not duplicate them).
**Rule:** this is a **visual brief only**. Do not put story text in the map, and do not change ring counts, mission logic, item placement, or generator behavior.

---

## 1. The one-sentence direction

Every floor is a **memory room** inside a living tower: the maze shape, the landmarks, and the props should tell the floor's story before the player reads a word.

The player should be able to recognize six things by shape alone:

| Landmark | Existing element | What it looks like | Story meaning |
|---|---|---|---|
| **Story gate** | start portal | A doorway with the floor's symbol and the floor number | “You are entering a memory.” |
| **Memory diorama** | friend chamber | A small scene: cockpit, kitchen, greenhouse, reading nook, gatehouse, cooling room, wish well | The keeper's story in one visual |
| **Hidden memory** | radar cell | A story object: book, sandbox, toolbench, altar | The Hollow Wish hid the radar here |
| **Memory shrine** | orb cell | A pedestal, trophy cabinet, carrot patch, keep, forge heart, altar | The orb's resting place |
| **Memory gate** | exit portal | A door with a red X seal; the seal fades when the floor is cleared | The floor's question |
| **Echo alcove** | coin / carrot cells | A small vignette: photo, toy, letter, drawing | An optional one-line memory |

**The Hollow Wish's visual rule:** gray fog at the edges, a red X on sealed doors, the light dimming for one breath when it “speaks.” No face, no eyes, no chase, no jump scare. It should feel sad, not dangerous.

**The 4-star rule:** Sora carries a **glass 4-star marble** (a warm glass marble with a four-point star inside), not the real orb. The **real 4-star Dragon Orb** is on the pedestal in the sky library on Floor 4. The marble glows near the real orb. Do not draw the marble as a Dragon Orb, and do not put the real orb in Sora's hand before Floor 4. The twin marble is Grandpa Ren's, seen in the prologue/epilogue.

**The two silent breadcrumbs:** every floor carries a **child's paper crown** (the king) and a **dragon trace** (the dragon). They are small visual props, never text, never interactive, never blocking. They pay off in Floor 7 and the finale.

---

## 2. Floor-by-floor visual spec

### Floor 1 — Mira's Crash Landing

- **Silhouette:** a broken circle — a crater with a capsule nose sticking out.
- **Rings:** shockwave rings; the outer ring is cracked.
- **Landmarks:** capsule cockpit (friend), broken wing, fuel trail, small photo of Grandpa Ren, child's paper crown in the debris, warm dragon scale fused into the vault wall, vault at the center (orb), vault door (exit).
- **Props:** crash foam, bolts, bent propeller, “memory engine” coil, child's drawing of the tower, Sora's glass 4-star marble (token prop, warm).
- **Palette:** Mira blue `#8ED1FC`, warm cream, charcoal ink, one orange spark.
- **Ambience:** wind through metal, a distant horn, a soft orb hum.
- **Echoes:** none. Keep the tutorial clean.
- **Story breadcrumbs:** paper crown (king), dragon scale (dragon), photo (Grandpa Ren), marble (Sora's copy). Silent props only.
- **Do not:** make the crash look violent or scary. It is a soft, funny crash — Mira is annoyed, not hurt. Do not draw the marble as a Dragon Orb.

### Floor 2 — Bo's Dumpling Dojo

- **Silhouette:** a steamer basket — concentric bamboo rings with a domed lid at the center.
- **Rings:** 15 (current config); bamboo slats make natural corridors.
- **Landmarks:** dojo gate (exit), kitchen (friend), trophy cabinet (orb), twelve place settings (coins), giant bell, training dummies.
- **Props:** chopstick bridges, steam clouds, dumpling baskets, rice scoop, scoreboard with no numbers, tiny apron, a child's paper crown on one place setting.
- **Palette:** Bo orange `#FFB347`, bamboo green, cream, ink.
- **Ambience:** bubbling steam, wooden bell, knife on a board, a cheerful training count, a low dragon rumble under the count.
- **Echoes:** the 12 coins are the counting mission, not optional echoes. Do not add a separate echo layer.
- **Story breadcrumbs:** the paper crown on the child-sized place setting (king), the low rumble (dragon). Silent props only.

### Floor 3 — Pico's Bunny Garden

- **Silhouette:** bunny head + two long ears (already supported by `bunny: true`).
- **Rings:** 10 (current config); the ears are long carrot rows; the head is the garden.
- **Landmarks:** greenhouse (friend), three carrot patches (carrots), ladybug gate (exit), carrot-patch shrine (orb), Pico's meditation stone.
- **Props:** giant carrots, watering cans, seed packets, scarecrow with a ladybug on its hat and a child's paper crown on its head, moon disc, vines.
- **Palette:** Pico green `#B9E769`, carrot orange, moon cream, deep green ink.
- **Ambience:** crickets, leaves, a slow drip, a ladybug's tiny chime, a warm wind that smells of the sky.
- **Echoes:** the 3 carrots are the mandatory story echoes. Each carrot frees a named villager: **Bram the baker (2)**, **Uma the drummer (21)**, **Gus the gardener (7)**. Their initials spell **BUG**, the ladybug gate's word. No coin layer (current `coinCount: 0`).
- **Story breadcrumbs:** the paper crown on the scarecrow (king), the warm wind (dragon). Silent props only.

### Floor 4 — Roku's Sky Library

- **Silhouette:** a floating island shaped like an open book, with a planetarium dome.
- **Rings:** 11 (current config); bookshelf rings and cloud bridges.
- **Landmarks:** reading nook (friend), giant telescope, planetarium dome, the pedestal with the **real 4-star Dragon Orb** (orb), the book with the radar lens, archive gate (exit).
- **Props:** floating books, star charts, Grandpa Ren's fishing rod, a photo of Grandpa as a boy, cold tea, constellation projector, a child's paper crown on a high shelf, a book titled *The King Who Wouldn't Say Goodnight*, Sora's glass 4-star marble (token prop, glowing near the pedestal).
- **Palette:** Roku mint `#A8E6CF`, midnight blue, paper cream, gold star.
- **Ambience:** turning pages, wind chimes, a low planetarium hum, a distant star, a warm wind that smells of home.
- **Echoes (3 coins):** fishing rod, photo of Grandpa as a boy, star chart. Each alcove is a small memory vignette, not a treasure chest.
- **Story breadcrumbs:** paper crown + king's book (king), warm wind (dragon), marble + photo (Grandpa Ren). The first full Hollow Wish encounter is here, as a gray shape in the planetarium constellations; no face.

### Floor 5 — Taro's Sandcastle

- **Silhouette:** a sandcastle — concentric battlements, a keep at the center, a drawbridge.
- **Rings:** 11 (current config); the rings are castle walls; the moat is a dry channel.
- **Landmarks:** gatehouse (friend), sandbox (radar), keep (orb), drawbridge (exit), three toy alcoves (coins), a kite stuck in a tower.
- **Props:** sand buckets, wooden sword, child's drawing of Taro, seashell, wind streaks, tiny flags, half-buried wagon, a child's paper crown half-buried in the sand.
- **Palette:** Taro sand `#FFD9A0`, warm brown, sky blue, sunset orange.
- **Ambience:** wind, a loose shutter, children laughing in the distance, sand shifting, a heartbeat under the storm.
- **Echoes (3 coins):** child's drawing of Taro, wooden sword, seashell.
- **Story breadcrumbs:** the paper crown in the sand (king), the heartbeat (dragon). Silent props only.

### Floor 6 — Nova's Star Forge

- **Silhouette:** a giant gear with a star at its center — or a star-shaped forge with gear teeth.
- **Rings:** 12 (current config); the rings are gear teeth; molten channels glow.
- **Landmarks:** cooling room (friend), anvil, toolbench (radar), forge heart (orb), blast door (exit), three memory alcoves (coins), a dark star that lights up as the player collects.
- **Props:** broken scouter, royal seal, unsent letter, hammer, tongs, sparks, cooling rack, tiny plant in a tin can (Nova's secret softness), a tiny paper crown on the anvil, a dragon claw mark scored into the cooling-room wall.
- **Palette:** Nova pink `#FF9EC4`, forge orange, steel gray, scouter green, deep navy.
- **Ambience:** hammer on anvil, low furnace roar, metal ticking as it cools, scouter ping.
- **Echoes (3 coins):** broken scouter, royal seal, unsent letter.
- **Story breadcrumbs:** the paper crown on the anvil (king), the claw mark (dragon). The forge relights only when two people hold the light; show the two-hand glow, not a solo hero pose.

### Floor 7 — Kiko's Wish Room

- **Silhouette:** a coiled dragon around seven pillars, with the altar at the center.
- **Rings:** 12 (current config); the rings are the dragon's coils; the pillars are story markers.
- **Landmarks:** wish well (friend), altar (orb), constellation ceiling, dragon-mouth door (exit), three memory alcoves (coins), seven pillars with tiny carvings of the previous floors.
- **Props:** candles, the king's paper crown on the altar, a child's drawing of the dragon signed “K.”, Grandpa Ren's letter, a tiny plant from Nova's forge, a seed from Pico's garden, a dumpling steamer from Bo's dojo, the **real 4-star Dragon Orb** among the seven.
- **Palette:** Kiko pink `#FFC2D1`, candle gold, midnight blue, dragon green.
- **Ambience:** a heartbeat, low wind, a single chime, the dragon's breath.
- **Echoes (3 coins):** the king's crown, the child's drawing of the dragon, Grandpa Ren's letter.
- **Story breadcrumbs:** the paper crown (king), the heartbeat (dragon), the real 4-star orb (the promise). Sora's marble stays in his pocket; do not place it on the altar.

---

## 3. The Floor 7 payoff: the journey table

The altar in Kiko's Wish Room should hold one small object from every previous floor:

| Floor | Object on the altar |
|---|---|
| 1 | Mira's bolt / capsule fragment |
| 2 | Bo's tiny dumpling steamer |
| 3 | Pico's seed |
| 4 | Roku's star chart |
| 5 | Taro's seashell |
| 6 | Nova's tiny plant in a tin can |
| 7 | Kiko's drawing of the dragon |

This is the visual proof that the whole tower was one story. It should be readable but not interactive. The **real 4-star Dragon Orb** sits among the seven; Sora's glass marble stays in his pocket and is never placed on the altar.

---

## 4. Future overlay: Friends Who Scout

`FRIENDS_PLAN.md` adds an optional party bar below the maze and a scout-marks layer (a chalk X and a dotted trail). It is blocked on the map redesign, so **do not implement it now** — just avoid blocking it.

- Keep the bottom edge below the maze clear for a future party bar.
- The friends' dead-end mark is **white/cream chalk on the floor**. The Hollow Wish's seal is a **red X on the door**. They must never look alike.
- After a friend is rescued, the memory diorama stays as an empty “memory bubble”; the friend joins the party line.
- The scout layer is an overlay between walls and tokens; it needs no changes to walls, portals, or the generator.
- The party line is the visual answer to Sora's arc: he does not climb alone. It must not cover the maze or the bottom edge of the play area.

**Scout banter (optional, P2, one line):**

| Friend | Dead-end line |
|---|---|
| Mira | “Dead end. I could invent a sign.” |
| Bo | “Nothing here. ...Is it lunchtime?” |
| Pico | “Hmph. I could have told you.” |
| Roku | “Ah, the scenic route.” |
| Taro | “Oops. Sorry, little path.” |
| Nova | “Obviously a dead end.” |
| Kiko | “My whiskers say no.” |

The banter is text-only. Do not add speech bubbles, portraits, or new blocking UI. The friends' chalk X is **white/cream on the floor**; the Hollow Wish's seal is **red on the door**.

---

## 5. Ring narrative — the maze as a three-act story

The rings are not just geometry. On every floor they carry the same three-act shape:

- **Outer ring = arrival / the lie.** The first impression and the keeper's defense.
- **Middle rings = memory / relationship.** The clues, echoes, and the friend's story.
- **Inner ring = truth / the orb.** The keeper's real need and the orb.

| Floor | Outer ring | Middle rings | Inner ring |
|---|---|---|---|
| 1 | Crash foam, Mira's joke | Capsule debris, the photo | The vault of first wishes |
| 2 | Dojo gate, the training count | Twelve place settings, the bell | The trophy cabinet |
| 3 | Overgrown garden, the scarecrow | The three carrot villagers | The ladybug gate |
| 4 | Cloud bridge, the telescope | Library shelves, Grandpa's books | The real 4-star pedestal |
| 5 | Storm wall, the drawbridge | Castle rooms, the children's toys | The keep |
| 6 | Cold gear, the scouter ping | The forge floor, the tiny plant | The star heart |
| 7 | Seven pillars, the candles | The dragon coils, the journey table | The altar |

**Three wordless murals per floor.** Visual only — no text, no labels, no blocking. Attach them to ring bands, not fixed coordinates. They are optional; the floor must read without them.

| Floor | Mural 1 (outer) | Mural 2 (middle) | Mural 3 (inner) |
|---|---|---|---|
| 1 | A crash | A small hand reaching | A warm light |
| 2 | A lone figure training | A table with one seat | A table with twelve seats |
| 3 | An overgrown garden | Three carrots with faces | A ladybug opening a gate |
| 4 | A boy climbing | An old man leaving a star | A child holding a marble |
| 5 | A storm | A giant holding a gate | Many small hands holding it too |
| 6 | A cold star | A smith alone | Two hands on a hammer |
| 7 | A paper crown | A dragon coiled around a tower | A door opening outward |

**Rules:** the final mural should be visible near the orb/exit; murals never replace the six landmark types; murals never add required information.

---

## 6. Placement contract — attach to cells, not coordinates

The map is generated, so story props must attach to **cell types and ring bands**, never to fixed coordinates.

- **Cell types:** `start` → story gate; `exit` → memory gate; `friendCell` → memory diorama; `radarCell` → hidden memory; `orbCell` → memory shrine; `coinCells` → echo alcoves (optional); `carrotCells` → carrot patches (mandatory mission cells, not echo alcoves).
- **Ring bands:** compute `ringIndex` relative to `rings`; outer = first third, middle = middle third, inner = last third. The ring narrative above uses these bands.
- **Props:** SVG symbols at cell centers, scaled to cell size. No geometry changes. No text in the map.
- **Structural vs decorative silhouettes:**
  - **Structural:** bunny ears (already supported by `bunny: true`). Any new structural silhouette must preserve the cell graph and validation.
  - **Decorative:** steamer, sandcastle, gear, book, dragon coil. These are props on a decorated circle, not new geometry.
- **Fallback:** if a silhouette would break the maze, use a decorated circle with the motif. The story survives; the shape is a bonus.
- **Budget:** max 3 props per cell; reuse symbols; no per-frame filters.
- **Reserved space:** bottom edge below the maze for the future party bar; an overlay between walls and tokens for scout marks.
- **No story text in the map.** Story text stays in `FloorStory` / `characters.ts` for read-aloud and localization.

---

## 7. Prologue and tower exterior

The tower has **seven windows**, one per floor and orb. They are the campaign's progress bar.

- **Home / tower screen:** seven windows, dark until the floor is cleared. The top window is the dragon's eye; it opens at the finale.
- **The village at the foot:** Grandpa Ren's porch, a warm light, a path to the tower door. This is the first and last image of the game.
- **Prologue card (first play):** “At the foot of the tower, Grandpa Ren gives Sora a glass marble with a four-point star. ‘Bring me back a story.’”
- **Replay:** all seven windows lit; the top window open; the tower is a lighthouse.
- **Implementation:** background art only; no gameplay changes. The map agent can do this after the maze pass.

---

## 8. Accessibility and performance rules

- **Shape + position + color** for every landmark; test protanopia and deuteranopia.
- **No flashing.** Fog moves slowly; reduced-motion mode removes drift and pulsing.
- **Sound-off play.** Every story beat has a visual cue: friend glow, orb pulse, door seal, mural.
- **Pre-reader cues.** The friend diorama glows; the orb pulses; the sealed door has a red X shape, not just a color.
- **Performance.** Reuse SVG symbols; cap props per cell; no per-frame filters; test on a low-end iPad.
- **Wordless playtest.** Mute text and audio; can a child retell the floor from the map alone?

---

## 9. Handoff rules

1. **Visual only.** Story text stays in `FloorStory` / `characters.ts` for read-aloud and localization.
2. **Do not change the maze.** Ring counts, mission logic, item placement, and generator behavior stay as they are.
3. **Shape first.** The six landmarks must be recognizable at a glance, not just by color.
4. **One Hollow Wish mark.** The red X on the sealed door is the only “danger” signal. No extra villains in the map.
5. **Keep it warm.** Ages 5–8. The crash is soft, the storm is windy not violent, the forge is sparkly not dangerous, the Hollow Wish is fog not a monster.
6. **Leave room for the journey table.** The Floor 7 altar needs clear space for the seven objects.
7. **Review against the copy deck.** If a prop contradicts the text, change the prop or the text together — never let them drift.
8. **4-star rule.** Sora's marble is glass and warm; the real 4-star Dragon Orb is on the library pedestal. Never draw the marble as a Dragon Orb.
9. **Attach to cells, not coordinates.** Follow §6; the maze is generated and props must move with it.
10. **Use the ring narrative.** Outer ring = arrival/lie, middle = memory/relationship, inner = truth/orb. The murals are optional; the landmarks are not.
11. **Reserve the future.** Leave the bottom edge clear for the party bar and the overlay space for scout marks.
12. **Test wordless.** Mute text and audio; the floor must still tell its story.

---

## 10. Quick review checklist

- [ ] Can a child point to the friend, radar, orb, and door by shape alone?
- [ ] Does each floor's silhouette match its story (crater, steamer, bunny, book, castle, gear, dragon)?
- [ ] Is the Hollow Wish's red X the only scary mark?
- [ ] Are the echo alcoves visually distinct from the mission items?
- [ ] Does Floor 7 show one object from every previous floor?
- [ ] Is the glass 4-star marble visually distinct from the real 4-star Dragon Orb?
- [ ] Does every floor carry the paper crown and the dragon trace without adding text?
- [ ] Does the ring narrative read (outer lie, middle memory, inner truth) without labels?
- [ ] Are all props attached to cell types/ring bands, not fixed coordinates?
- [ ] Is every landmark readable at the smallest supported screen size?
- [ ] Does the map still work with the sound off and the text muted?
- [ ] Does the map still work with reduced motion and a colorblind filter?
