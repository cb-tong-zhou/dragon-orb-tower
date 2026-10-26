# Dragon Orb Tower — Story Bible & Map Narrative Plan

**Status:** direction approved (2026-10-24). Re-checked against the committed codebase 2026-10-25 (Revision 3). The story plan itself has changed no source code.
**Purpose:** define the complete story for all seven floors, and the visual/narrative layer the map agent can build in parallel.
**Companions:** `PLAN.md` (original design), `README.md` (current game), `FRIENDS_PLAN.md` (rescued friends who scout), `MAP_STORY_BRIEF.md` (map-agent handoff), `STORY_COPY_DECK.md` (canonical strings), `src/content/floors.ts`, `src/content/characters.ts`, `src/screens/PlayScreen.tsx`, `src/screens/FinaleScreen.tsx`.

---

## At a glance

**Logline:** A boy climbs a tower of seven trapped memories to bring his grandfather a story — and learns that a story only counts if it is shared.

**Theme:** A wish is a promise; a story is shared.

**The cast:** Sora (the boy), Grandpa Ren (waiting at the foot), seven keepers (Mira, Bo, Pico, Roku, Taro, Nova, Kiko), the Hollow Wish (a sad echo), and the Eternal Dragon (the king's only friend).

**The seven floors:**

| Floor | Memory | Keeper | Orb | Lesson |
|---|---|---|---|---|
| 1 | Crash landing | Mira | 1-star | Ask for help |
| 2 | Dumpling dojo | Bo | 2-star | Share the feast |
| 3 | Bunny garden | Pico | 3-star | Rest is protection |
| 4 | Sky library | Roku | 4-star | Carry memory lightly |
| 5 | Sandcastle | Taro | 5-star | Let people help rebuild |
| 6 | Star forge | Nova | 6-star | Trust is stronger |
| 7 | Wish room | Kiko | 7-star | Endings make room |

**The turn:** Sora believes a story only counts if he finishes it alone. On Floor 6, the forge light slips through his hands; Nova tells him, “That's not a failure. That's a forge.” He finishes the climb with his friends.

**The truth:** The Forgotten King was a lonely child. The dragon was his only friend and granted his wish out of love. The true wish is not to win the tower — it is to let the story end, and everyone go home.

**Revision 2 adds:** the glass 4-star marble (so Sora never carries the real orb), Sora's flaw, the child king and the dragon's guilt, the rules of the tower, the ring narrative, the dynamic landmark contract, the finale roll call, the copy budget, the replay loop, the voice/localization plan, the prologue, the accessibility checklist, the copy deck, the v2 save, and the playtest rubric.

**Revision 3 (2026-10-25) syncs the plan to the code:** the map redesign landed in commit `3d0fdc0` — bigger floors with a constant per-ring sector count, Floor 3's ears rebuilt as tall 5×9 spiral mini-mazes, and the renderer now merges wall edges into long hand-drawn paths. Floor 2's coin toast hides the running count on purpose (the counting door is the test), so the plan's copy rule changed. The accepted grumblin scouting twist from `FRIENDS_PLAN.md` is folded in as a minor, harmless mischief-maker (§11.16).

---

## 0. How much Dragon Ball this plan uses

Short answer: enough to map every floor to a specific saga, its emotional beat, and its visual vocabulary — while keeping the game's original cast.

### 0.1 Canon I am drawing from

| Era | Sagas / beats I know well | Used here? |
|---|---|---|
| **Dragon Ball** (1984–1995, 519 chapters / 153 episodes) | Pilaf Saga, 21st–23rd Tenkaichi Budokai, Red Ribbon Army, Muscle Tower, Monster Carrot, Tao Pai Pai, Bora & Upa, King Piccolo, Korin Tower, Kami's Lookout, Fortuneteller Baba, Grandpa Gohan and the 4-star ball | **Yes — floors 1–5** |
| **Dragon Ball Z** (1989–1996, 291 episodes) | Saiyan Saga, Namek/Frieza, Android/Cell, Buu, Vegeta's pride and sacrifice, Super Saiyan, Spirit Bomb, Shenron and the final wish | **Yes — floors 6–7** |
| **Dragon Ball GT** (1996–1997, 64 episodes) | Black Star Dragon Balls, Baby, Super 17, Shadow Dragons | No — alternate continuity |
| **Dragon Ball Super** (2015–2018, 131 episodes) | Battle of Gods, Resurrection F, Universe 6, Goku Black, Tournament of Power, Ultra Instinct | Optional epilogue flavor |
| **Dragon Ball Super films / manga** | Broly, Super Hero, Moro, Granolah | Optional epilogue flavor |
| **Dragon Ball Daima** (2024–2025) | Demon Realm, Gomah, Glorio, Panzy, the origins of Majin Buu | Optional epilogue flavor |

### 0.2 Canon details I will use as load-bearing story beats

- **The 4-star ball is Grandpa Gohan's keepsake.** It is the most personal Dragon Ball, not the most powerful. Goku reunites with Grandpa Gohan during Fortuneteller Baba's tournament, and Gohan tells him to keep it. This is the emotional center of **Floor 4**.
- **The first wish in the series is a gag.** Oolong's silly wish sets the tone that a wish reveals character. **Floor 1** uses that idea: the first orb remembers a small, human wish, not a grand one.
- **Bulma's capsule and the Dragon Radar.** The adventure starts with a crash and an invention. **Mira** inherits both.
- **The Turtle School training is repetition and humility** — milk delivery, plowing, construction — not flashy power. **Bo's** counting mission is training as counting small steps.
- **Monster Carrot turns people into carrots**, and he is exiled to the moon. **Pico's** garden is a rescue story disguised as a bunny maze; the three numbered carrots are people, not vegetables.
- **Android 8 (Eighter) is the gentle giant who refuses to fight.** **Taro** inherits that gentleness, with Bora's protective father energy.
- **Korin is a cat; Kami's Lookout is above Korin Tower; the Ultra Divine Water is a test, not a shortcut.** **Roku** is the old mentor who keeps the tower's memories; **Kiko** is the cat who keeps the last wish.
- **Vegeta's scouter, pride, and sacrifice.** **Nova** is the last smith of a star kingdom: proud, alone, and secretly waiting for someone to come back.
- **Shenron grants the wish; the balls turn to stone for a year.** Every ending resets the quest. That is the thematic engine of **Floor 7** and the finale.

### 0.3 Deep cuts and accuracy notes

- “It's over 9000!” is a famous English-dub line; the original Japanese reading is **8000**. Nova's scouter can carry a “power level: 1 friend” joke instead.
- **Porunga** is Namek's dragon (three wishes); **Shenron** is Earth's dragon (one wish, later more). The game's dragon is a single Eternal Dragon; no need to split them.
- **The Dragon Balls scatter and turn to stone for a year** after a wish. This is a graceful way to explain why the tower resets for replay.
- **King Piccolo wished for his youth**, then killed Shenron; Kami later restored the dragon. The game's “Forgotten King” is an original echo of that idea — a lonely child's wish that the dragon granted out of love, not a canon retelling.
- **Grandpa Gohan's 4-star ball** is the one Goku keeps. The canon ache would be to make Grandpa Ren gone. **Decision: Grandpa Ren is alive and waiting at the foot of the tower**, which keeps the ending warm for ages 5–8. See §9.

### 0.4 IP decision

The current game is deliberately built with **original characters** (`characters.ts` is the reskin point). **Decision: keep the original cast.** The story below is **Dragon Ball–inspired**, not a direct retelling:

- It uses the *emotional grammar* of Dragon Ball — wishes, training, guardians, pride, sacrifice, and the 4-star keepsake.
- It does **not** put Goku, Bulma, Piccolo, or Shenron on screen.
- Every floor still maps 1:1 to a canon saga, so a later “canon skin” is a name/outfit swap, not a rewrite.

If you ever want a direct canon fan version, §8 has the full mapping table. For anything commercial, keep the original cast.

---

## 1. The story in one page

### 1.1 Title

**Dragon Orb Tower: The Seven Memory Floors** (working subtitle; the game title can stay `Dragon Orb Tower`).

### 1.2 Logline

A young hero climbs a tower that keeps the Dragon World's memories. Seven friends are trapped inside seven story-rooms, each guarding a numbered Dragon Orb. To wake the Eternal Dragon, Sora must relive each memory, rescue its keeper, and answer the door's riddle — then make a wish worth the whole journey.

### 1.3 Premise

Long ago, a lonely **child king** climbed the tower and asked the Eternal Dragon for one thing:

> “Let my story never end.”

The dragon was his only friend. It granted the wish because it could not say no to him. The tower became a living archive of stories, and the king's story became a loop. The child is gone from the tower; only his loneliness remains — **the Hollow Wish**, a soft gray echo that promises people they never have to leave.

The king's wish cracked the dragon's light into **seven stars**. Each star became a Dragon Orb, and each orb chose a keeper — a person who loved that story enough to stay. Now seven keepers are caught inside the tower's memories, each guarding an orb and a piece of the dragon's light. Sora, a child from the village at the foot of the tower, carries his grandfather's **4-star marble** — a glass copy of the real 4-star Dragon Orb — and a simple wish: bring back a story.

At the top, the Eternal Dragon is waiting. But a wish is not a prize. It is a promise.

### 1.4 Theme

**A wish is a promise.**
**Sora's truth: a story is only a story if it is shared.**

Every floor is a different way of being stuck:

| Floor | Keeper | The lie they believe | The truth they learn |
|---|---|---|---|
| 1 | Mira | “I can do it alone.” | Ask for help. |
| 2 | Bo | “Strength means never needing anyone.” | Share the feast. |
| 3 | Pico | “A guardian never rests.” | Rest is part of protecting. |
| 4 | Roku | “Hold on to the past.” | Carry it lightly. |
| 5 | Taro | “A wall is enough.” | Let people help rebuild. |
| 6 | Nova | “Pride is the only thing that lasts.” | Trust is stronger. |
| 7 | Kiko | “A story must never end.” | Endings make room for new stories. |

The Hollow Wish voices each lie. Sora breaks it by showing up.

Sora has the same lie in his own words: **“A story only counts if you finish it alone.”** He thinks asking for help makes the story smaller. The Hollow Wish offers to make that true. The party is the answer.

### 1.5 Tone and rules

- **Ages 5–8.** Short sentences. Warm, funny, adventurous. No irony that needs adult context.
- **No fail state.** The Hollow Wish is sad, not scary. It never chases, shouts, or threatens.
- **Read-aloud first.** Every story line must work when spoken by the existing voice button.
- **One mission, one feeling.** Each floor has one emotional lesson and one puzzle twist.
- **The map tells the story visually; the text tells it in words.** Neither should depend on the other to make sense.
- **No new blocking cutscenes.** Story rides on events the game already has: intro, rescue, radar, orb, sealed door, wrong answer, completion. The prologue and replay cards reuse the existing intro/completion modals; no new screen.

### 1.6 Three acts

| Act | Floors | Title | What Sora learns |
|---|---|---|---|
| I | 1–2 | **The Call** | The tower is a story. Friends are the way in. |
| II | 3–5 | **The Memory** | The tower's history, Grandpa Ren's promise, and the cost of guarding alone. |
| III | 6–7 | **The Wish** | Pride, sacrifice, and the difference between a prize and a promise. |

### 1.7 Story map

```
                 VILLAGE AT THE FOOT OF THE TOWER
                 Grandpa Ren waits with the matching glass star
                 Sora carries the 4-star marble
                              |
                              v
 F1  CRASH LANDING      "A story begins with a crash."        Pilaf / the call
                              |
 F2  DUMPLING DOJO      "Strength is shared."                 Turtle School
                              |
 F3  BUNNY GARDEN       "A guardian must rest."               Red Ribbon / Monster Carrot
                              |
 F4  SKY LIBRARY        "Memory is a map, not a cage."        Korin / Kami / Grandpa Gohan
                              |  <-- real 4-star Dragon Orb reveal
 F5  SANDCASTLE         "A castle is who you protect."        Bora & Upa / the desert
                              |
 F6  STAR FORGE         "Pride can be a door."                Saiyan / Namek / Vegeta
                              |
 F7  WISH ROOM          "A wish is a promise."                Shenron / the last story
                              |
                     THE DRAGON RISES
                              |
                  WISH  ->  ENDING  ->  EPILOGUE
```

### 1.8 The emotional spine

- **Sora's want:** reach the top and bring Grandpa Ren a story.
- **Sora's flaw:** he believes a story only counts if he finishes it alone. Asking for help feels like cheating.
- **Sora's need:** understand that a wish is a promise, and a story is shared.
- **The 4-star marble:** Grandpa Ren's glass copy. Planted on Floor 1, it glows near the real **4-star Dragon Orb** on Floor 4, and stays with Sora in the finale.
- **The real 4-star Dragon Orb:** the memory Grandpa Ren left in the sky library. In the true wish, it returns to the dragon; the marble stays with Sora in every ending.
- **The Hollow Wish:** the fear of being forgotten. It is released, not defeated.
- **The friends:** seven ways of being stuck. Sora frees them by showing up, not by being stronger.

---

## 2. Cast

| Name | Role | Dragon Ball north star | Want | Need | Floor | Voice / verbal tic |
|---|---|---|---|---|---|---|
| **Sora** | the little hero | Kid Goku | Bring home a story | Learn that a story is shared | all | “Let's go!” — earnest, never sarcastic |
| **Mira** | the inventor | Bulma | Build a machine that remembers | Ask for help | 1 | fast, technical, secretly sentimental |
| **Bo** | the dumpling monk | Krillin | Become the strongest | Share the feast | 2 | cheerful, competitive, food metaphors |
| **Pico** | the green guardian | Piccolo | Protect the garden alone | Accept rest and help | 3 | clipped, grumpy, soft underneath |
| **Roku** | the sky mentor | Master Roshi / Kami | Keep every memory safe | Let go | 4 | slow, wry, calls Sora “young one” |
| **Taro** | the gentle giant | Bora / Android 8 | Build a wall nothing can break | Let the children help | 5 | warm, careful, surprised by his own strength |
| **Nova** | the star smith | Vegeta | Never need anyone again | Trust someone | 6 | proud, dry, “Don't tell anyone.” |
| **Kiko** | the wish keeper | Korin / Puar | Keep the last wish safe | Let the story end | 7 | bright, mysterious, purrs on long vowels |
| **The Hollow Wish** | the unfinished wish | The shadow of King Piccolo's wish | Be remembered | Be released | all | soft echo, never shouts, always sad |
| **The Eternal Dragon (Long)** | the dragon at the top | Shenron | Grant the wish | Let go of the king | finale | warm, slow, rumbling, a little funny |
| **The Forgotten King** | the lonely child king | original (echo of King Piccolo) | Never be forgotten | Have an ending | finale | a small silhouette, a paper crown, one bow |
| **Grandpa Ren** | Sora's grandfather | Grandpa Gohan | Hear a good story | Let Sora climb | home / F4 / finale | warm, teasing, “Bring me back a story.” |
| **A grumblin** | the tower's mischief-maker (scouting only) | gag monsters (Muscle Tower / Pilaf's machines) | Make noise | Be shooed | 2+ (scouting) | grumbles, poofs, never a full line |

> **The king is a child.** The tower calls him a king because that is the role the story gave him. His paper crown is a child's craft. He is never portrayed as a tyrant, and he is never mocked. He is a lonely kid who asked his only friend for one more day.

> **The grumblin is a guest of the scouting plan.** It belongs to `FRIENDS_PLAN.md` and appears only while scouting: a small, grumpy mischief-maker that blocks a rescued friend's way home after a successful dead-end check. It is never a villain, never scary, and never hurts anyone — Sora walks over, it grumbles, poofs, and flees. The climb simply pauses until Sora goes to help, which is the arc's thesis as a mechanic: the opposite of finishing alone. See §11.16.

### 2.1 The Hollow Wish

- **What it is:** the loneliness left over from the Forgotten King's wish. Not a demon, not a monster — a draft in a closed room. It is the age the king never got to have.
- **What it says:** half-truths. “Stay. Be safe. Be remembered. You don't need anyone.”
- **What it wants:** to keep the story from ending, because an ending means being forgotten.
- **How it appears:** a soft gray fog at the edges of the map; the red X on sealed doors; the lights dim for one breath when it speaks. No face, no jump scare.
- **When it speaks:** whispers on Floors 1–3; the first full encounter on Floor 4 in the planetarium; it offers each keeper their own lie on Floors 5–6; the final offer to Sora on Floor 7.
- **How it ends:** the true wish releases it. It becomes a small, quiet light — the king's story finally ending. It says “Thank you” in the king's voice, finally a child's voice.

### 2.2 The Eternal Dragon

- **Name in lore:** Long. The UI can keep calling it “the dragon.”
- **What it is:** the keeper of the tower's stories, not a wish machine. It was the child king's only friend. It granted the wish out of love, not malice, and has regretted it ever since.
- **Why it seems asleep:** the seven orbs are its light. With them scattered, it is stone — but not asleep. It has been listening to every telling.
- **What it wants:** an ending as much as the king does. It could not say no to its friend; it needs help saying goodbye.
- **Voice:** short sentences. Warm. A little funny. “You climbed with seven stories. Now tell me the eighth.”

### 2.3 The Forgotten King

- A lonely **child** who was given a crown and a tower full of stories. His only friend was the dragon.
- He wished his story would never end. The dragon granted it because it could not say no to him. That is why the tower is a loop.
- He is not a villain. He is a kid who was left alone with a wish that was too big for him.
- In the finale, his echo appears as a child in a paper crown for one bow. He does not ask for forgiveness; he asks for an ending.
- The true wish gives him one. The dragon finally says the thing it could not say before: “I remember you. That was never the problem. The problem was letting you go.”

---

## 3. Canon-to-floor map

| Floor | Current game title | Canon engine | Canon beats used | Original twist |
|---|---|---|---|---|
| 1 | Mira's Crash Landing | **Pilaf Saga** | Bulma's capsule, the first orb, Oolong's gag wish, Pilaf's castle | Mira's “memory engine” crash; the first wish is small and human |
| 2 | Bo's Dumpling Dojo | **Turtle School / 21st Budokai** | Milk-and-plow training, Krillin, Jackie Chun, Kamehameha | Bo trains alone; counting dumplings = counting small steps; the feast is the win |
| 3 | Pico's Bunny Garden | **Red Ribbon / Monster Carrot / Muscle Tower** | Carrot spell, Android 8's kindness, the moon | Pico guards the carrot victims; the three carrots are people; BUG is the ladybug gate |
| 4 | Roku's Sky Library | **Korin Tower / Kami's Lookout / Grandpa Gohan** | Korin, Ultra Divine Water, Kami, Mr. Popo, the 4-star ball | Roku knew Grandpa Ren; the real 4-star Dragon Orb is a promise; Sora's marble is a copy; the radar lens is found |
| 5 | Taro's Sandcastle | **Red Ribbon desert / Bora & Upa** | Bora protects the Sacred Land, Tao Pai Pai, the desert | Taro is a builder and a father; the sandcastle protects children; the storm is the Hollow Wish |
| 6 | Nova's Star Forge | **Saiyan / Namek / Frieza** | Vegeta's scouter, Planet Vegeta, Super Saiyan, sacrifice | Nova is the last smith of a star kingdom; pride becomes trust; Sora learns he cannot hold the light alone |
| 7 | Kiko's Wish Room | **Kami's Lookout / Shenron / final wish** | The seven balls, Shenron, the final wish, Goku's goodbye | Kiko is the last keeper; the king was a child; the dragon was his friend; the true wish to end the story |

### 3.1 Why these seven, in this order

- **Floor 1** is the call: a crash, a first friend, a first orb.
- **Floor 2** is training: the hero learns the rules of the tower and the value of sharing.
- **Floor 3** is the first guardian: someone who has been alone so long he forgot how to be helped.
- **Floor 4** is the heart: the real 4-star Dragon Orb, Sora's marble, and Grandpa Ren. The story stops being an adventure and becomes personal.
- **Floor 5** is protection: the hero sees what happens when a guardian tries to carry everyone alone.
- **Floor 6** is pride: the hardest friend to save, because she does not want to be saved.
- **Floor 7** is the wish: the keeper who has been waiting for someone to end the story.

### 3.2 Canon reference appendix (for the team)

Approximate anime episode ranges, for orientation only. They vary by release and dub; use them as a pointer, not a citation. The game is **inspired by** these stories, not a retelling.

| Saga | Approx. episodes | What this plan borrows |
|---|---|---|
| **Pilaf Saga** | 1–13 | The crash, the first orb, the gag wish, the start of a quest |
| **21st Tenkaichi Budokai / Turtle School** | 14–28 | Training, humility, friendship, the feast after the fight |
| **Red Ribbon Army** | 29–68 | Muscle Tower, Android 8's kindness, the cost of being a weapon |
| **Fortuneteller Baba** | 69–83 | The dead returning for one conversation; memory as a gift |
| **22nd Tenkaichi Budokai** | 84–101 | Rivalry becoming respect; the cost of pride |
| **King Piccolo** | 102–132 | A wish that threatens the world; a child forced to grow up |
| **23rd Tenkaichi Budokai** | 133–153 | The final tournament; letting go of a mentor |
| **Saiyan Saga** | DBZ 1–35 | A lost home planet; pride as armor |
| **Namek / Frieza** | DBZ 36–107 | Sacrifice, the first Super Saiyan, a planet's ending |
| **Android / Cell** | DBZ 108–194 | Chosen family, a son from the future, legacy |
| **Buu Saga** | DBZ 195–291 | A wish that erases memory; the cost of a clean slate |

**Use in the plan:** the floor's **emotional grammar**, not its plot. The original cast keeps the story safe for a commercial release.

---

## 4. Floor-by-floor story bible

> **Copy status:** all lines below are drafts for later implementation. Nothing here is wired into the game yet.
> **Existing hooks:** `FloorStory.intro`, `FloorStory.orbHint`, `Character.greeting`, `PlayScreen` toasts for rescue / radar / orb / sealed door / wrong answer, the completion modal, and `FinaleScreen` wishes.

### Floor 1 — Mira's Crash Landing

| | |
|---|---|
| **Orb** | 1-star |
| **Mission** | Rescue |
| **Friend** | Mira |
| **Canon** | Pilaf Saga: the crash, the first orb, the gag wish, the start of the quest |
| **Chapter** | The First Memory |
| **Emotional beat** | “Every story starts with something breaking.” |

**Story in one sentence:** Mira's memory engine crashes into the tower's first floor, and Sora has to rescue her before the crater's memory closes.

**The memory:** The first floor is the tower's front door — a crash site. The rings are the shockwave of Mira's capsule. The center is a vault of first wishes. The 1-star orb is warm because it remembers the smallest wish in the tower: a lonely child wishing for a friend.

**Beat sheet:**

1. **Arrive.** Sora steps off the stairwell into crash foam. A capsule horn blares. The Hollow Wish whispers: “Turn back. Stories are safer when they stay closed.”
2. **Explore.** Follow the fuel trail through the outer rings. Capsule panels, a broken wing, a photo of Grandpa Ren, and a child's paper crown are scattered like breadcrumbs. The 4-star marble is warm in Sora's pocket.
3. **Rescue.** Mira is upside down in her cockpit, tapping a wrench against the harness. She is more annoyed than scared. She notices the marble: “That's a nice star. Is it real?” Sora: “Grandpa made it.” She joins Sora.
4. **Story beat.** Mira explains the tower pulled her in while she was testing a “memory engine.” Her Dragon Radar broke in the crash; its lens fell somewhere upstairs. This is why the radar does not appear until Floor 4.
5. **Orb.** The 1-star orb sits in the crater's heart. It shows a flash of the first wish: a lonely child wishing for a friend.
6. **Door.** The vault door opens. The first orb is the key. The stairwell lights up.

**Map narrative (for the map agent):**

- **Silhouette:** a broken circle — a crater with a capsule nose sticking out.
- **Rings:** shockwave rings; the outer ring is cracked.
- **Landmarks:** capsule cockpit (friend chamber), broken wing, fuel trail, a small photo of Grandpa Ren, a child's paper crown in the debris, a warm dragon scale fused into the vault wall, the vault at the center.
- **Props:** crash foam, bolts, a bent propeller, a “memory engine” coil, a child's drawing of the tower, Sora's 4-star marble (a warm glass marble with a four-point star; carried by the token, not placed on the map).
- **Palette:** Mira's blue `#8ED1FC`, warm cream, charcoal ink, one orange spark.
- **Ambience:** wind through metal, a distant horn, a soft hum from the orb.
- **Echoes:** none on this floor (the tutorial is clean). If you want three later: a cracked photo of Grandpa Ren, a bolt from the capsule, a star sticker.
- **Story breadcrumbs:** the paper crown (the king), the dragon scale (the dragon), the photo (Grandpa Ren), the marble (Sora's copy). All four are silent visual props; none of them carry required text.

**Dialogue copy deck (draft):**

- **Intro:** “A capsule just crashed into the tower! Mira the inventor is trapped inside. Find her, then reach the 1-star Dragon Orb in the crater's heart.”
- **Orb hint:** “The 1-star orb glows in the middle of the crater.”
- **Rescue:** “You found me! I knew you'd come. My capsule hit something on the way down — a story. This whole floor is a memory.”
- **Marble:** “That marble... it's warm.” / “Grandpa made it. It has a four-point star inside.”
- **Radar mention:** “My Dragon Radar broke in the crash. Its lens fell somewhere upstairs. We'll find it.”
- **Orb:** “The 1-star orb! It's warm. It remembers the very first wish.”
- **Sealed door:** “The door is sealed. A voice in the wall whispers: 'A story cannot begin alone.'”
- **Completion:** “Floor 1 clear! Mira is safe, and the first orb is yours. The tower's next door creaks open.”
- **Teaser:** “A smell of dumplings drifts down the stairs. Someone is training upstairs.”

**Continuity:** Mira gives Sora the radar blueprint (not the radar itself). The lens is lost until Floor 4. The photo of Grandpa Ren, the paper crown, the dragon scale, and the 4-star marble are the first seeds of the finale. The marble is a **glass copy**, not the real 4-star Dragon Orb; the real orb stays in the sky library until Floor 4.

---

### Floor 2 — Bo's Dumpling Dojo

| | |
|---|---|
| **Orb** | 2-star |
| **Mission** | Coins (12) |
| **Friend** | Bo |
| **Canon** | Turtle School training / 21st Budokai: repetition, humility, Krillin, the shared meal |
| **Chapter** | The Shared Feast |
| **Emotional beat** | “Strength is shared.” |

**Story in one sentence:** Bo has been training alone so long he forgot how to share a meal, and the dojo's counting door will only open for someone who counts the dumplings — and the friends.

**The memory:** The dojo is a giant steamer basket. The rings are bamboo slats. The corridors smell of dumplings. The 12 Dragon Coins are the 12 dumplings for the Turtle School feast. The door asks “How many?” because counting is the first training.

**Beat sheet:**

1. **Arrive.** Morning practice. Steam rolls through the corridors. A bell rings somewhere.
2. **Rescue.** Bo is trapped under a giant steamer lid in the kitchen. He has been doing one-handed push-ups to stay warm. He is embarrassed he cannot open the door alone.
3. **Collect.** Twelve Dragon Coins are hidden in the side paths — one per place setting. Each coin smells like a dumpling.
4. **Story beat.** Bo admits he thought strength meant never needing anyone. The Hollow Wish whispers: “A strong hero never needs anyone.”
5. **Door.** Count the coins at the dojo gate. The gate opens onto the trophy cabinet.
6. **Orb.** The 2-star orb was in the trophy cabinet all along. Bo laughs: “I never looked up.”

**Map narrative (for the map agent):**

- **Silhouette:** a steamer basket — concentric bamboo rings, with a domed lid at the center.
- **Rings:** 18 (tuned; `floors.ts` is the source of truth). The bamboo slats make natural corridors.
- **Landmarks:** dojo gate (exit), kitchen (friend chamber), trophy cabinet (orb), twelve place settings (coin alcoves), a giant bell, training dummies, a child's paper crown on one place setting.
- **Props:** chopstick bridges, steam clouds, dumpling baskets, a rice scoop, a scoreboard with no numbers, a tiny apron.
- **Palette:** Bo's orange `#FFB347`, bamboo green, cream, ink.
- **Ambience:** bubbling steam, a wooden bell, a knife on a board, a cheerful training count, a low dragon rumble under the count.
- **Echoes:** the 12 coins are the mission, not optional echoes. Do not add a separate echo layer here; the feast is the story.
- **Story breadcrumbs:** the paper crown on the child-sized place setting (king), the low rumble (dragon). Silent props only.

**Dialogue copy deck (draft):**

- **Intro:** “Bo's dumpling dojo is a maze of steam and chopsticks! Rescue Bo, collect every Dragon Coin, and count them at the door to earn the 2-star orb.”
- **Orb hint:** “Collect every coin and answer the counting question at the door.”
- **Rescue:** “Nice moves! I've been training solo so long I forgot how to share a meal. Let's count the dumplings together.”
- **Coin (first):** “Dragon Coin! It smells like a dumpling. One for the feast!”
- **Coin (later):** “Another dumpling for the feast! Keep exploring.”
- **Places:** “Twelve places. One for every dumpling. Four are for the next friends.” / “There are only eight of us.”
- **Sora (optional, after the feast):** “I could have done it alone.” / “You could have. It wouldn't have been a feast.”
- **Door:** “How many Dragon Coins did you collect?”
- **Wrong answer:** “Not quite. Count the empty steamer baskets — one, two...”
- **Orb:** “The 2-star orb! It was in the trophy cabinet all along. Bo laughs. 'I never looked up.'”
- **Sealed door:** “The dojo gate is sealed. A voice whispers: 'A strong hero never needs anyone.' Bo's smile slips.”
- **Completion:** “Twelve coins, twelve dumplings, one shared feast. The 2-star orb is yours!”
- **Teaser:** “A carrot rolls down the stairs. Something is hopping in the garden above.”

**Copy rule (matches the current code):** Floor 2 copy never reveals the running coin count or the total. The game says “Dragon Coin found! Keep exploring.” for each coin and “All Dragon Coins found! Head to the door.” on the last one — the counting question at the door is the test. Do not restore “That's {n}…” toasts, and do not say “12” in the intro or the mission chip.

**Continuity:** Bo's feast is the first time the friends eat together. In the finale, the “feast for everyone” wish echoes this floor.

---

### Floor 3 — Pico's Bunny Garden

| | |
|---|---|
| **Orb** | 3-star |
| **Mission** | Code (3 carrots) |
| **Friend** | Pico |
| **Canon** | Red Ribbon Army / Monster Carrot / Muscle Tower: the carrot spell, Android 8's kindness, the moon |
| **Chapter** | The Sleeping Guardian |
| **Emotional beat** | “A guardian must rest.” |

**Story in one sentence:** Pico has guarded the bunny garden alone for a hundred years, and the only way to free the three carrot villagers is to solve the garden's A = 1 code and let the ladybug gate open.

**The memory:** The garden is a rescue story disguised as a bunny maze. The bunny-head silhouette is the garden's shape; the ear corridors are the carrot rows. The three numbered carrots are three villagers trapped by the old carrot spell: **Bram the baker (2), Uma the drummer (21), and Gus the gardener (7)**. Their initials spell **BUG** — the garden's secret word and the name of the ladybug who guards the gate.

**Beat sheet:**

1. **Arrive.** The garden is overgrown. Giant carrots lean over the paths. A moon hangs where the sun should be.
2. **Rescue.** Pico is tangled in greenhouse vines. He insists he does not need help. The carrots do.
3. **Collect.** Find the three numbered carrots. Each one frees a villager and gives a letter: 2 = B, 21 = U, 7 = G.
4. **Story beat.** Pico admits he has not slept in a hundred years. The Hollow Wish whispers: “A guardian never rests.”
5. **Door.** The ladybug gate asks for the garden's secret word. The answer is BUG.
6. **Orb.** The 3-star orb was sleeping under the carrot patch. Pico finally sits down.

**Map narrative (for the map agent):**

- **Silhouette:** bunny head + two tall ears (already supported by `bunny: true`).
- **Rings:** 12 (tuned; `floors.ts` is the source of truth). The ears are tall **5×9 spiral mini-mazes** — one nested U-lane per ear, like hand-drawn carrot rows; the head is the garden. Ear cells expose `earRow` (0 at the tip), so ear props can band by tip / middle / base.
- **Landmarks:** greenhouse (friend chamber), three carrot patches (carrot cells), ladybug gate (exit), carrot-patch shrine (orb), Pico's meditation stone.
- **Props:** giant carrots, watering cans, seed packets, a scarecrow with a ladybug on its hat and a child's paper crown on its head, a moon disc, vines.
- **Palette:** Pico's green `#B9E769`, carrot orange, moon cream, deep green ink.
- **Ambience:** crickets, leaves, a slow drip, a ladybug's tiny chime, a warm wind that smells of the sky.
- **Echoes:** the 3 carrots are mandatory mission items with story lines. Each carrot frees a named villager; the code word is their initials. No separate coin layer (current `coinCount: 0`).
- **Story breadcrumbs:** the paper crown on the scarecrow (king), the warm wind (dragon). Silent props only.

**Dialogue copy deck (draft):**

- **Intro:** “Pico's garden grew into a giant bunny maze! Rescue Pico, find the three numbered carrots, and crack the A = 1 code at the gate.”
- **Orb hint:** “The 3-star orb is sleeping in the carrot patch.”
- **Rescue:** “Hmph. Took you long enough. I don't need help... but the carrots do.”
- **Sora (optional):** “I know. Neither do I.”
- **Carrot 1 (2):** “Carrot 2! Bram the baker is free. A = 1, so 2 = B.”
- **Carrot 2 (21):** “Carrot 21! Uma the drummer is free. 21 = U. Two letters so far.”
- **Carrot 3 (7):** “Carrot 7! Gus the gardener is free. 7 = G. B... U... G. Bug!”
- **Door:** “The ladybug gate asks for the garden's secret word.”
- **Wrong answer:** “Not quite. 2 is B, 21 is U, 7 is G. Read it again.”
- **Orb:** “The 3-star orb! It was sleeping under the carrots. The ladybug gate clicks open.”
- **Sealed door:** “The garden gate is sealed. A voice whispers: 'A guardian never rests.' Pico grips his staff.”
- **Completion:** “BUG! The ladybug gate opens. The 3-star orb is yours — and Pico finally sits down.”
- **Teaser:** “Dust falls from the ceiling. Above, a library floats in the clouds.”

**Continuity:** Pico gives Sora a seed from the garden. In the finale, the seed is growing on the tower roof. The ladybug gate is the first time the tower's “code” is a kindness, not a lock.

---

### Floor 4 — Roku's Sky Library

| | |
|---|---|
| **Orb** | 4-star |
| **Mission** | Radar |
| **Friend** | Roku |
| **Canon** | Korin Tower / Kami's Lookout / Grandpa Gohan: the 4-star ball, the old mentor, the memory that is a map |
| **Chapter** | The Four-Star Promise |
| **Emotional beat** | “Memory is a map, not a cage.” |

**Story in one sentence:** Roku knew Grandpa Ren, and the 4-star marble Sora carries is a copy of a promise the sky library has been keeping safe.

**The memory:** The sky library is the tower's archive. Every book is a memory. The floating island is above the clouds; the planetarium dome shows stories as constellations. The **real 4-star Dragon Orb** sits on a pedestal at the end of a winding path, exactly where Grandpa Ren left it. Sora's marble is a glass copy — and it glows when the real orb is near.

**Beat sheet:**

1. **Arrive.** Books whisper. A telescope points at a star that is not there yet. The marble in Sora's pocket is warm.
2. **Rescue.** Roku is asleep under a pile of books. He wakes slowly, recognizes the **4-star marble** in Sora's hand, and says: “You have your grandfather's eyes. And his terrible hair. That marble is a good copy. The real one is here.”
3. **Story beat.** Roku tells the story: Grandpa Ren climbed the tower as a boy, carrying the real 4-star Dragon Orb and a wish — “one more day with my family.” The dragon could not grant a wish for the past. Grandpa Ren left the real orb in the library as a promise, made **two** glass copies from a shard of star-glass — one for himself, one for Sora — and went home to raise Sora. The marble in Sora's pocket is his copy.
4. **Radar.** The Dragon Radar's lens is in a book called *How to Find What You Miss*. Mira's radar is whole again. From here on, the radar can reveal what the Hollow Wish hides.
5. **Temptation.** The Hollow Wish whispers: “Keep the memory. Don't let go.” Sora holds the marble, then the real orb. The marble stays warm. He puts the marble back in his pocket — carrying the memory, not clinging to it.
6. **Orb + door.** The **real 4-star Dragon Orb** is his to carry to the top. The marble stays with him. The archive door opens. The sky library lets the morning in.

**Map narrative (for the map agent):**

- **Silhouette:** a floating island shaped like an open book, with a planetarium dome.
- **Rings:** 11 (tuned; `floors.ts` is the source of truth). Bookshelf rings; cloud bridges between them.
- **Landmarks:** reading nook (friend chamber), giant telescope, planetarium dome, the pedestal with the **real 4-star Dragon Orb**, the book with the radar lens, the archive gate.
- **Props:** floating books, star charts, a fishing rod, a photo of Grandpa Ren as a boy, a cup of cold tea, a constellation projector, Sora's glass 4-star marble (token prop), a child's paper crown on a high shelf, a book titled *The King Who Wouldn't Say Goodnight*.
- **Palette:** Roku's mint `#A8E6CF`, midnight blue, paper cream, gold star.
- **Ambience:** turning pages, wind chimes, a low planetarium hum, a distant star, a warm wind that smells of home.
- **Story breadcrumbs:** the paper crown and the king's book (the king), the warm wind (the dragon), the marble and the photo (Grandpa Ren). The first full Hollow Wish encounter happens here, in the planetarium, as a gray shape in the constellations.
- **Echoes (3 coins):**
  1. **Grandpa's fishing rod** — “Grandpa Ren caught a star here once. He threw it back.”
  2. **A photo of Grandpa as a boy** — “He looks like you, but with worse hair.”
  3. **A star chart** — “He drew a line from the tower to home. He always meant to come back.”

**Dialogue copy deck (draft):**

- **Intro:** “Roku fell asleep in the sky library. Wake him, find the Dragon Radar, and uncover the real 4-star Dragon Orb.”
- **Orb hint:** “The real 4-star Dragon Orb is on a pedestal at the end of a winding path.”
- **Rescue:** “Ah, youth. My back was getting stiff. I knew your grandfather. He climbed this tower once, carrying a wish and the real four-star orb. That marble in your hand is his copy.”
- **Radar:** “The Dragon Radar! Its lens was lost in Mira's crash. Now the library can show you what you're missing.”
- **Orb:** “The real 4-star orb hums. The marble in your pocket answers. It remembers a promise: 'One more day together.'”
- **Sealed door:** “The archive door is sealed. The Hollow Wish whispers: 'Keep the memory. Don't let go.'”
- **Completion:** “You carry the memory without letting it carry you. The real 4-star Dragon Orb is yours; the marble stays with you. The sky library opens.”
- **Teaser:** “A warm wind smells of sand. Below, a castle is holding back a storm.”

**Continuity:** This is the midpoint. The **real 4-star Dragon Orb** is now the emotional center of the finale; Sora's **4-star marble** is the keepsake that proves he is Grandpa Ren's grandson. The radar is repaired; floors 5–7 can use it. Grandpa Ren's wish is the mirror of the king's wish: one wants one more day; the other wants never to end. The marble glows near the real orb, but it is not a Dragon Orb and cannot wake the dragon.

---

### Floor 5 — Taro's Sandcastle

| | |
|---|---|
| **Orb** | 5-star |
| **Mission** | Radar |
| **Friend** | Taro |
| **Canon** | Red Ribbon desert / Bora & Upa: the gentle giant, the Sacred Land, the storm |
| **Chapter** | The Castle That Cares |
| **Emotional beat** | “A castle is who you protect.” |

**Story in one sentence:** Taro built a sandcastle to keep the village children safe from a magic sandstorm, but the castle is falling, and the only thing strong enough to hold it together is letting the children help.

**The memory:** The sandcastle is the desert village's last stand. The rings are castle walls. The moat is a dry moat. The storm is the Hollow Wish's breath, trying to prove that a wall is all a guardian needs.

**Beat sheet:**

1. **Arrive.** A sandstorm howls. The drawbridge is half-buried. Children's toys are scattered in the dunes.
2. **Rescue.** Taro is holding up the falling portcullis in the gatehouse. He has been there for hours. He is not hurt; he is embarrassed.
3. **Story beat.** Taro built the castle for the village children. The storm keeps tearing it down. He thinks if he just holds on harder, he can save everyone alone.
4. **Radar.** The Dragon Radar is buried in the sandbox. The children were playing treasure hunt.
5. **Orb.** The 5-star orb is in the castle's heart. When Sora lifts it, the storm calms — not because the orb is magic, but because the children see the light and come back to help.
6. **Door.** Taro opens the gate. The children cheer. The castle is still standing, but now it is held up by many hands.

**Map narrative (for the map agent):**

- **Silhouette:** a sandcastle — concentric battlements, a keep at the center, a drawbridge.
- **Rings:** 11 (tuned; `floors.ts` is the source of truth). The rings are castle walls; the moat is a dry channel.
- **Landmarks:** gatehouse (friend chamber), sandbox (radar), keep (orb), drawbridge (exit), three toy alcoves (coins), a kite stuck in a tower.
- **Props:** sand buckets, a wooden sword, a child's drawing of Taro, a seashell, wind streaks, tiny flags, a half-buried wagon, a child's paper crown half-buried in the sand.
- **Palette:** Taro's sand `#FFD9A0`, warm brown, sky blue, sunset orange.
- **Ambience:** wind, a loose shutter, children laughing in the distance, sand shifting, a heartbeat under the storm.
- **Story breadcrumbs:** the paper crown in the sand (king), the heartbeat (dragon). Silent props only.
- **Echoes (3 coins):**
  1. **A child's drawing of Taro** — “The drawing says 'My dad is a castle.'”
  2. **A wooden sword** — “Someone has been practicing. The blade is covered in teeth marks.”
  3. **A seashell** — “You can hear the sea. Taro says the desert was an ocean once.”

**Dialogue copy deck (draft):**

- **Intro:** “Taro's sandcastle is crumbling in a magic sandstorm! Help him, find the Dragon Radar, and dig out the 5-star Dragon Orb.”
- **Orb hint:** “The 5-star orb is buried in the castle's heart.”
- **Rescue:** “Whoa! This maze is bigger than my lunchbox. I built these walls to keep the little ones safe... but the storm keeps getting in.”
- **Sora (optional):** “Let them help.” / “I'm not good at that.”
- **Radar:** “The radar! It was buried in the sandbox. The kids must have been playing treasure hunt.”
- **Orb:** “The 5-star orb glows in the castle heart. The storm calms when you hold it.”
- **Sealed door:** “The drawbridge is sealed. The Hollow Wish howls: 'A wall can't love you back.' Taro looks at the children.”
- **Completion:** “Taro opens the gate. The children cheer. The 5-star orb is yours!”
- **Teaser:** “Sparks rise through the floor. Above, a forge is hammering stars.”

**Continuity:** Taro's children are the first “village” we see. In the finale, they are in the crowd. The seashell is a quiet hint that the tower's memories are older than the desert.

---

### Floor 6 — Nova's Star Forge

| | |
|---|---|
| **Orb** | 6-star |
| **Mission** | Radar |
| **Friend** | Nova |
| **Canon** | Saiyan / Namek / Frieza: Vegeta's scouter, Planet Vegeta, pride, sacrifice |
| **Chapter** | The Last Smith |
| **Emotional beat** | “Pride can be a door.” |

**Story in one sentence:** Nova is the last smith of a star kingdom, and the forge's heart is going out — but she would rather freeze alone than admit she needs help.

**The memory:** The star forge is the tower's heart. It is where the dragon's light was shaped. The rings are gear teeth; the molten channels are the veins of the tower. The star at the center is dark. Nova has been keeping it alive with her own stubbornness.

**Beat sheet:**

1. **Arrive.** Sparks fall like snow. The forge is cold. A scouter pings in the dark.
2. **Rescue.** Nova is trapped behind a jammed gear in the cooling room. She has already found the exit; she just cannot reach it alone. “Don't tell anyone.”
3. **Story beat.** Nova is the last smith. Everyone else left when the star began to die. She stayed because leaving would mean admitting she needed someone.
4. **Temptation.** The Hollow Wish offers her the 6-star orb: “Take the star. Be the strongest. Never need anyone.” She reaches for it — then sees Sora staying. She stops. Sora sees the Hollow Wish clearly again.
5. **Radar + orb.** The radar cuts through the forge's noise. The 6-star orb is the forge's heart. Nova strikes the anvil; Sora tries to hold the light alone. It slips. Nova: “You can't hold it alone. That's not a failure. That's a forge.” They hold it together; the forge roars back to life.
6. **Door.** The blast door opens. Nova gives Sora the forge key — and her respect.

**Map narrative (for the map agent):**

- **Silhouette:** a giant gear with a star at its center — or a star-shaped forge with gear teeth.
- **Rings:** 12 (tuned; `floors.ts` is the source of truth). The rings are gear teeth; the molten channels glow.
- **Landmarks:** cooling room (friend chamber), anvil, toolbench (radar), forge heart (orb), blast door (exit), three memory alcoves (coins), a dark star that lights up as the player collects.
- **Props:** broken scouter, royal seal, unsent letter, hammer, tongs, sparks, a cooling rack, a tiny plant in a tin can (Nova's secret softness), a tiny paper crown on the anvil, a dragon claw mark scored into the cooling-room wall.
- **Palette:** Nova's pink `#FF9EC4`, forge orange, steel gray, scouter green, deep navy.
- **Ambience:** hammer on anvil, a low furnace roar, metal ticking as it cools, a scouter ping.
- **Story breadcrumbs:** the paper crown (the king), the claw mark (the dragon), the tiny plant (Nova's home). The forge only relights when two people hold the light — the visual thesis of Sora's arc.
- **Echoes (3 coins):**
  1. **A broken scouter** — “The last reading says 'power level: 1 friend.' Nova swears it's broken.”
  2. **A royal seal** — “The crest of a star kingdom. Nova's name is on the back.”
  3. **A letter never sent** — “‘I don't need anyone.’ The ink is smudged where she crossed it out.”

**Dialogue copy deck (draft):**

- **Intro:** “Nova's star forge is going cold. Get her out, find the Dragon Radar, and find the 6-star Dragon Orb.”
- **Orb hint:** “The 6-star orb is the forge's heart, cold at the edge of the star.”
- **Rescue:** “About time. I already found the exit. ...I just couldn't reach it alone. Don't tell anyone.”
- **Radar:** “The radar? I recalibrated it to ignore the forge's noise. You're welcome.”
- **Orb:** “The 6-star orb is the forge's heart. It's been cold for a hundred years.”
- **Hold it together:** “I can hold it.” / “No. You can't. That's not a failure. That's a forge. Together.”
- **Sealed door:** “The blast door is sealed. The Hollow Wish whispers: 'Take the star for yourself. You could be the strongest.' Nova looks away.”
- **Completion:** “Nova strikes the anvil. You hold the light together. The forge roars back to life. The 6-star orb is yours — and so is her respect.”
- **Teaser:** “The stairs end at a quiet door. Someone has been waiting a very long time.”

**Continuity:** Nova's forge key opens the top-floor door. The tiny plant in the tin can is the first sign that the forge is not just a weapon — it is a home. In the finale, the plant is on the dragon's altar. Sora's lie — “a story only counts if you finish it alone” — fails here; the forge only relights when they hold it together.

---

### Floor 7 — Kiko's Wish Room

| | |
|---|---|
| **Orb** | 7-star |
| **Mission** | Radar |
| **Friend** | Kiko |
| **Canon** | Kami's Lookout / Shenron / the final wish: the seven balls, the dragon, the goodbye |
| **Chapter** | The Last Story |
| **Emotional beat** | “A wish is a promise.” |

**Story in one sentence:** Kiko has been waiting at the top for the one who carries all seven stories, and the last orb is not hidden — it is waiting for someone brave enough to end the story.

**The memory:** The wish room is the dragon's altar. Seven pillars hold the seven stories. The ceiling is a constellation map. The 7-star orb is the dragon's heart. The sealed door is the dragon's mouth. The Hollow Wish has one last offer: stay, be remembered, never end.

**Beat sheet:**

1. **Arrive.** The room is quiet. Candles. A coiled dragon mosaic on the floor. Kiko is sitting on the altar, swinging her feet.
2. **Rescue.** Kiko is not trapped in a chamber; she is trapped by her promise to keep the last wish safe. She has been waiting for someone to share it with.
3. **Story beat.** Kiko tells Sora the king's story: the king was a lonely child; the dragon was his only friend; he wished the story would never end; the dragon granted it because it could not say no; the tower became a loop.
4. **Temptation.** The Hollow Wish offers Sora the throne: “Wish for yourself. Stay here. Be remembered. Finish alone.” Kiko asks: “What will you wish for?” Sora hears his friends on the stairs.
5. **Orb.** The 7-star orb is the dragon's heart. Sora takes it. The marble in his pocket is warm. The tower trembles — not with fear, but with hope.
6. **Door.** The dragon's mouth opens. The stairs end. The sky begins. The party comes with him.

**Map narrative (for the map agent):**

- **Silhouette:** a coiled dragon around seven pillars, with the altar at the center.
- **Rings:** 12 (tuned; `floors.ts` is the source of truth). The rings are the dragon's coils; the pillars are story markers.
- **Landmarks:** wish well (friend chamber), altar (orb), constellation ceiling, dragon-mouth door (exit), three memory alcoves (coins), seven pillars with tiny carvings of the previous floors.
- **Props:** candles, the king's paper crown, a child's drawing of the dragon signed “K.”, Grandpa Ren's letter, a tiny plant from Nova's forge, a seed from Pico's garden, a dumpling steamer from Bo's dojo (a small reunion of the journey), the **real 4-star Dragon Orb** among the seven.
- **Palette:** Kiko's pink `#FFC2D1`, candle gold, midnight blue, dragon green.
- **Ambience:** a heartbeat, a low wind, a single chime, the dragon's breath.
- **Story breadcrumbs:** the paper crown (king), the heartbeat (dragon), the real 4-star Dragon Orb (the promise). Sora's marble stays in his pocket; it is never placed on the altar.
- **Echoes (3 coins):**
  1. **The king's crown** — “It's too small for a king. It looks like a child's paper crown.”
  2. **A child's drawing of the dragon** — “The dragon has seven stars in its heart. The drawing is signed 'K.'”
  3. **Grandpa Ren's letter** — “‘Bring me back a story. Any story. I already have the best one: you.’”

**Dialogue copy deck (draft):**

- **Intro:** “Kiko is waiting at the top. Rescue her, find the Dragon Radar, and take the 7-star Dragon Orb.”
- **Orb hint:** “The last orb isn't hidden. It's waiting on the altar.”
- **Rescue:** “The dragon is waking up! I can feel it! I've been keeping the last wish safe... but I couldn't make it myself. The king was just a kid, you know. He got left alone with a wish that was too big.”
- **Radar:** “The radar points at the altar. The last orb isn't hidden. It's waiting.”
- **Orb:** “The 7-star orb! The dragon's heart. Seven stories, one wish. The marble in your pocket is warm.”
- **Sealed door:** “The dragon's door is sealed. The Hollow Wish sighs: 'If you end the story, no one will remember. Finish alone. Keep it for yourself.' Kiko squeezes your hand.”
- **Completion:** “The seventh orb is yours. Your friends are with you. The tower trembles — not with fear, but with hope.”
- **Teaser:** “The dragon rises. So do your friends.”

**Continuity:** Every previous floor leaves a small object on the altar: Pico's seed, Bo's steamer, Taro's shell, Nova's plant, Roku's star chart, Mira's bolt, and Kiko's drawing. The map agent can place these as a visual “journey table” in the wish room. This is the payoff of “story in the map.” The paper crown is the king's; it is too small for a king because he was a child. The 4-star marble is Sora's copy; the real 4-star Dragon Orb is one of the seven on the altar.

---

## 5. Finale — The Wish Room

### 5.1 The dragon rises

The seven orbs lift from the altar. The ceiling opens. The sky goes dark, then fills with stars. The Eternal Dragon uncoils around the tower — not a monster, a very old, very tired creature made of light and story.

**Dragon:**

> “Seven orbs. Seven friends. One wish. Speak it, little hero.”

> “I granted a wish for a story that would never end. I forgot that endings are how stories grow. I have been waiting for someone to help me say goodbye.”

**Kiko:**

> “Whatever you choose, I'll remember it.”

**The Hollow Wish (softly):**

> “Or you could stay. No one would ever have to leave. Finish alone. Keep the story.”

**The roll call (before the wish):** the seven friends step out of the party line and stand with Sora. Each says one line. This is the ensemble beat; it is not a blocking cutscene. The lines can be one toast each or a single scrollable card.

| Friend | Final line | Promise |
|---|---|---|
| **Mira** | “I'll build a door that always opens for friends.” | She will make the way home. |
| **Bo** | “I'll save you a seat at the feast.” | There is always a place for you. |
| **Pico** | “I'll rest. Then I'll guard the garden again.” | Rest is part of protection. |
| **Roku** | “I'll keep the stories, but I'll let them grow.” | Memory is a map, not a cage. |
| **Taro** | “I'll build with more hands next time.” | A wall is stronger with friends. |
| **Nova** | “I'll leave the forge door open.” | Trust is the strongest thing she has made. |
| **Kiko** | “I'll keep the wish, but I'll share it.” | A wish is a promise. |

**Sora (to the dragon, quietly):**

> “A story isn't a trophy. It's a table. Everyone gets a seat.”

### 5.2 The wish options

The game currently offers three wishes. **Decision: keep all three and add a fourth “true wish” in a later finale pass.** None of the existing three should feel wrong; they are different kinds of happy ending.

| Wish | What happens | Ending card |
|---|---|---|
| **A feast for everyone!** | The dragon laughs. A mountain of dumplings appears. Bo calls everyone to the table. For the first time in a hundred years, the tower smells like dinner. | “The tower smells of dumplings forever.” |
| **A sky full of stars!** | The dragon writes the friends' stories into constellations. Roku finds a new star and names it “Grandpa Ren.” The Hollow Wish becomes a small, quiet light. | “Every story has a star.” |
| **One more adventure!** | The dragon grins. A brand-new door appears. The friends look at each other. “One more?” “One more.” The tower becomes a ship, and the sky opens. | “The tower is always open.” |
| **Let the story end — and everyone go home.** *(fourth wish, added in a later finale pass)* | The Hollow Wish sighs. The child king bows. The dragon stretches its wings. “Thank you,” it says. “I have been waiting for an ending.” The real seven orbs return to the dragon; the tower becomes a lighthouse. The friends go home. Sora keeps the 4-star **marble**. | “The end is a door, too.” |

### 5.3 Why the fourth wish matters

The story's theme is “a wish is a promise.” The first three wishes are generous, but they all keep the tower open. The fourth wish is the one that lets the story **end** — which is what the Forgotten King and the Hollow Wish need. It is the emotional resolution of the whole tower.

It should **not** be the only “correct” ending. All four are valid. The dragon can say:

> “Every wish is a door. Some open outward. Some open inward. All of them are real.”

**Decision: the fourth wish is always available; it is not gated behind echoes.** For ages 5–8, the choice itself is the reward. Collecting all the echoes can unlock an extra epilogue line instead of gating the ending.

### 5.4 Epilogue

At the foot of the tower, Grandpa Ren is waiting on the porch. Sora holds up the 4-star **marble**. Grandpa Ren holds up its twin.

> **Sora:** “I brought you a story.”
>
> **Grandpa Ren:** “I knew you would.”

The camera pulls back. **In the true wish,** the tower is a lighthouse; the dragon is a shape in the stars; the real 4-star Dragon Orb becomes a new star beside the tower. **In the other endings,** the tower stays a tower, all seven windows lit. The marble glows in Sora's pocket.

> **Narrator:** “The end is a door, too.”

**True wish only:** a child in a paper crown appears for one bow. The dragon lowers its head.

> **Dragon:** “I remember you. That was never the problem. The problem was letting you go.”

The child becomes a small light and joins the stars. The paper crown stays on the porch step, warm.

### 5.5 The Hollow Wish's resolution

- **If the player chooses feast/stars/adventure:** the Hollow Wish becomes a small light that follows the friends home. It is not gone; it is quieter. The king's story is still waiting for an ending, but it is no longer alone.
- **If the player chooses the true wish:** the Hollow Wish sighs, the child king bows, and the light goes out gently. The tower is free. The story ends.
- **The king's echo:** only in the true wish does the child appear. He does not speak a villain's line. He says, “I only wanted someone to remember me.” The dragon answers, “I remember you. That was never the problem.” The Hollow Wish says “Thank you” in his voice — finally a child's voice.
- Either way, the Hollow Wish is **released**, not destroyed. That is the kindest version for young players.

### 5.6 Replay is a retelling

The tower is a story. Every telling is a new wish. This is the in-world reason the game can be replayed without undoing the ending.

- **First clear:** the full story, the full roll call, the chosen wish, the epilogue.
- **Replay:** skip the long intro; show a short “story so far” card (one line per cleared floor); keep collected echoes; let the player choose a different wish at the top.
- **The dragon remembers:** on a replay, it says, “You again. Good. Every telling is a new wish.”
- **The true wish is not a “true ending” that deletes the others.** It is the ending where the king is released. The other three are endings where the tower stays open. All four are real.
- **“Play again”** starts a new telling, not a new game. Progress, echoes, and friends stay.

**Why this matters:** it gives the game a soft loop for replay without making the first ending feel wrong, and it gives the Hollow Wish a thematic reason to exist: a story that refuses to end is not a story; a story that can be retold is.

### 5.7 Post-credits teaser

After the epilogue, hold on the tower for three seconds. A new door appears in the stars — small, warm, and open. The dragon's eye opens in the top window.

> **Dragon:** “The tower is always open.”

This is the hook for replay and for any future chapter. It is a visual + one line, not a new mode.

---

## 6. Story in the map — the narrative layer

The phrase “a complete story in the map” means three layers working together:

1. **Narrative layer** — the words: intro, rescue, radar, orb, door, completion, finale.
2. **Map layer** — the visuals: silhouette, landmarks, props, palette, ambience.
3. **Mechanic layer** — the optional echoes: one-line memories attached to existing collectibles.

The story must still make sense if the player skips every optional echo. The map must still be readable if the text is muted.

### 6.1 Landmark grammar

Every floor uses the same six landmark types. This keeps the map agent's work consistent and the player's understanding portable.

| Landmark | Existing game element | Story function | Visual treatment |
|---|---|---|---|
| **Story gate** | start portal | Floor title + one-line inscription | A doorway with the floor's symbol; the title carved above |
| **Memory diorama** | friend chamber | The keeper's story in one visual | A small scene: cockpit, kitchen, greenhouse, reading nook, gatehouse, cooling room, wish well |
| **Hidden memory** | radar cell | The object the Hollow Wish hid | A story object: book, sandbox, toolbench, altar |
| **Memory shrine** | orb cell | The orb's resting place | A pedestal, trophy cabinet, carrot patch, keep, forge heart, altar |
| **Memory gate** | exit portal | The floor's question | A door with a red X seal; the Hollow Wish's mark |
| **Echo alcove** | coin cells / carrot cells | One-line optional memory | A small vignette: photo, toy, letter, drawing |

### 6.2 Event-to-story mapping (no new mechanics required)

| Game event | Current hook | Story line to add later |
|---|---|---|
| Floor intro | `FloorStory.intro` + intro modal | Chapter title + one-sentence premise |
| Friend rescue | `friend.greeting` + rescue toast | `friendLine` (the keeper's first honest sentence) |
| Radar collect | `showToast("Dragon Radar found! ...")` | `radarLine` |
| Orb collect | `showToast("... Dragon Orb found!")` | `orbLine` |
| Sealed door | `showToast("The door is sealed. ...")` | `sealedLine` (the Hollow Wish's whisper) |
| Wrong answer | `lockError` | `wrongLine` (gentle hint) |
| Floor complete | `completeTitle` + `friend.greeting` | `completeLine` + `nextTeaser` |
| Finale | `WISHES` | `wishLines` per wish + epilogue |

### 6.3 The echo layer

The echo layer uses collectibles that already exist. It does **not** require a new item type.

| Floor | Collectibles with story lines | Story lines | Notes |
|---|---|---|---|
| 1 | none (`coinCount: 0`) | 0 | Tutorial. Keep it clean. |
| 2 | 12 coins (mission) | 0 | The 12 coins are the feast, not optional echoes. |
| 3 | 3 carrots (mission) | 3 | Mandatory for the code; the lines are mission feedback, not optional pickups. |
| 4 | 3 coins | 3 | Grandpa Ren memories. |
| 5 | 3 coins | 3 | Taro's village memories. |
| 6 | 3 coins | 3 | Nova's star kingdom memories. |
| 7 | 3 coins | 3 | The king, Kiko, and Grandpa Ren. |
| **Total** | | **15** | 3 mandatory carrot lines + 12 optional coin echoes. If you want 21, add 3 crash echoes to Floor 1 and 3 “recipe” echoes to Floor 2 later. |

**How it works later:**

- Each story line is a one-line memory shown as a toast when the collectible is picked up.
- Collecting all **optional** echoes on Floors 4–7 gives a bonus line from the friend at the door. Floor 3's carrot lines are part of the mission, so its “all echoes” bonus is the completed code.
- The story text lives in `FloorStory`, not in the map, so it can be read aloud and localized.
- The map agent only needs to make the optional echo alcoves visually distinct (a small vignette, a different prop, a tiny glow). The Floor 3 carrots are already mission cells.

### 6.4 Visual storytelling per floor

| Floor | Silhouette / motif | Signature props | Palette | Ambience |
|---|---|---|---|---|
| 1 | Broken circle / crater | Capsule nose, broken wing, crash foam, photo | Blue, cream, charcoal, orange spark | Wind, horn, orb hum |
| 2 | Steamer basket | Chopstick bridges, dumpling baskets, bell, scoreboard | Orange, bamboo, cream | Steam, bell, knife, count |
| 3 | Bunny head + ears | Giant carrots, scarecrow, ladybug, moon disc | Green, carrot orange, moon cream | Crickets, leaves, drip, chime |
| 4 | Open book / floating island | Books, telescope, planetarium, star charts | Mint, midnight, paper, gold | Pages, chimes, hum, star |
| 5 | Sandcastle | Battlements, drawbridge, sandbox, toys, kite | Sand, brown, sky, sunset | Wind, shutter, children, sand |
| 6 | Gear / star | Anvil, scouter, royal seal, letter, tiny plant | Pink, forge orange, steel, green | Hammer, furnace, metal, ping |
| 7 | Coiled dragon / seven pillars | Altar, candles, crown, drawing, journey table | Pink, candle gold, midnight, dragon green | Heartbeat, wind, chime, breath |

### 6.5 Handoff rules for the map agent

- **Do not encode story text in the map.** Keep text in `FloorStory` / `characters.ts` for read-aloud and localization.
- **Do not change ring counts, mission logic, or item placement for story reasons.** The story must fit the existing generator.
- **Use the six landmark types.** A player should be able to recognize “friend,” “radar,” “orb,” “door,” and “echo” by shape, not just color.
- **Make the landmark readable at a glance.** The map is for ages 5–8; silhouette first, detail second.
- **Keep the Hollow Wish gentle.** Gray fog, a red X, a dimming light. No face, no chase, no jump scare.
- **Leave room for the journey table.** On Floor 7, the altar should have small objects from every previous floor. This is the visual payoff of the whole campaign.
- **Review against the copy deck.** If a prop contradicts the text, the text wins (or we change both together).

### 6.6 Compatibility with `FRIENDS_PLAN.md` (Friends Who Scout)

The scouting plan and this story plan are complementary. The story already treats rescued friends as companions who join the climb; scouting is the mechanical expression of that.

- **The diorama stays, the friend leaves.** After rescue, the friend steps out of the memory diorama and joins the party line. The diorama remains as an empty “memory bubble” — the memory stays, the friend is free. This is a strong visual beat and costs no new mechanics.
- **Scouting is in character.** Mira checks a path with a gadget; Bo jogs ahead with a cheerful “I'll go!”; Pico grunts and stalks off; Roku takes a slow, dignified stroll; Taro looks carefully for the little ones; Nova pings her scouter; Kiko follows her whiskers.
- **Two different X marks.** The friends' dead-end mark is a **chalk X** — white/cream, drawn on the floor. The Hollow Wish's seal is a **red X** — painted on the door. Keep them visually distinct so a child never confuses “safe to skip” with “locked.”
- **A third mark: the grumblin.** A successful scout can attract a harmless grumblin that blocks the friend's way back (`FRIENDS_PLAN.md` §3.7). Sora walks over and shoos it; the friend is never hurt; the dead-end mark is already earned; the door waits with “A friend needs help first!”. It is the arc's thesis as a mechanic — the climb stops until Sora helps, the exact opposite of finishing alone.
- **Three marks, three meanings, one rule:** chalk X (floor) = safe to skip; red X (door) = locked by the story; grumblin (corridor) = a friend needs help. They must never look alike.
- **Grumblin pacing matches the story's floors.** Floor 1 never spawns one (the tutorial stays clean). The first eligible encounter on Floor 2 is a scripted, gentle one — right where Bo learns that strength is shared. From Floor 3 on, the first scout of a floor is safe.
- **Friends never collect.** Sora still collects every coin, carrot, radar, and orb. The echo layer is unaffected.
- **One party roster.** The seven friends in the story are the same seven in the scouting roster. The finale shows all seven; the scouting save must not diverge from the story save.
- **One v2 save, not two.** Both plans want a version 2 save. Merge the fields in one migration, using `FRIENDS_PLAN.md`'s canonical names: `rescuedFriends`, `settings.friendHelp`, `seenScoutTutorial`, `seenTutorial` — plus the story plan's `echoes`. Coordinate with `FRIENDS_PLAN.md` §8 before writing the schema.
- **Floor 1 tutorial order.** Rescue Mira → show the story line → show the scout tip (“Mira can check one path for you”). The story tutorial stays clean; scouting is the first “friends help” mechanic.

### 6.7 Ring narrative — the maze as a three-act story

The maze already has rings. The story uses them as a three-act structure on every floor:

- **Outer ring = arrival / the lie.** The floor's first impression and the keeper's defense.
- **Middle rings = memory / relationship.** The clues, echoes, and the friend's story.
- **Inner ring = truth / the orb.** The keeper's real need and the orb.

| Floor | Outer ring (arrival / lie) | Middle rings (memory / relationship) | Inner ring (truth / orb) |
|---|---|---|---|
| 1 | Crash foam, Mira's joke | Capsule debris, the photo | The vault of first wishes |
| 2 | Dojo gate, the training count | Twelve place settings, the bell | The trophy cabinet |
| 3 | Overgrown garden, the scarecrow | The three carrot villagers | The ladybug gate |
| 4 | Cloud bridge, the telescope | Library shelves, Grandpa's books | The real 4-star pedestal |
| 5 | Storm wall, the drawbridge | Castle rooms, the children's toys | The keep |
| 6 | Cold gear, the scouter ping | The forge floor, the tiny plant | The star heart |
| 7 | Seven pillars, the candles | The dragon coils, the journey table | The altar |

**Three wordless murals per floor.** These are visual only — no text, no labels, no blocking. They attach to ring bands, not fixed coordinates. They are optional: the floor must still read without them.

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

### 6.8 Dynamic landmark contract

The map is generated, so story props must attach to **cell types and ring bands**, never to fixed coordinates.

- **Cell types:** `start` → story gate; `exit` → memory gate; `friendCell` → memory diorama; `radarCell` → hidden memory; `orbCell` → memory shrine; `coinCells` → echo alcoves (optional); `carrotCells` → carrot patches (mandatory mission cells, not echo alcoves).
- **Ring bands:** compute `ringIndex` relative to `rings`; outer = first third, middle = middle third, inner = last third. The ring narrative above uses these bands. **Band by thirds of the actual `rings` value — never a fixed number;** ring and sector counts are tuning and may change again.
- **Ear bands (Floor 3):** ear cells expose `earRow` (0 = tip). Band ear props by thirds: tip / middle / base. The generator already keeps carrots out of the ear rim and the bottom row; ear props should follow the same rule.
- **Walls are merged long paths.** The renderer now combines touching collinear wall edges into single long SVG paths (the hand-drawn look). Props stay at cell centers and never sit on wall segments.
- **Props:** SVG symbols at cell centers, scaled to cell size. No geometry changes. No text in the map.
- **Structural vs decorative silhouettes:**
  - **Structural:** bunny ears (already supported by `bunny: true`). Any new structural silhouette must preserve the cell graph and validation.
  - **Decorative:** steamer, sandcastle, gear, book, dragon coil. These are props on a decorated circle, not new geometry.
- **Fallback:** if a silhouette would break the maze, use a decorated circle with the motif. The story survives; the shape is a bonus.
- **Budget:** max 3 props per cell; reuse symbols; no per-frame filters.
- **Reserved space:** bottom edge below the maze for the future party bar; an overlay between walls and tokens for scout marks.
- **No story text in the map.** Story text stays in content data for read-aloud and localization.

### 6.9 The tower exterior and progress windows

The tower has **seven windows**, one per floor and orb. They are the campaign's progress bar.

- **Home / tower screen:** seven windows, dark until the floor is cleared. The top window is the dragon's eye; it opens at the finale.
- **The village at the foot:** Grandpa Ren's porch, a warm light, a path to the tower door. This is the first and last image of the game.
- **Prologue card (first play):** “At the foot of the tower, Grandpa Ren gives Sora a glass marble with a four-point star. ‘Bring me back a story.’”
- **Replay:** all seven windows lit; the top window open; the tower is a lighthouse.
- **Implementation:** background art only; no gameplay changes. The map agent can do this after the maze pass.

### 6.10 Party line and scout banter

The party line is the seven friends below the maze (see `FRIENDS_PLAN.md`). It is the mechanical answer to Sora's lie: he does not climb alone.

**Scout banter (optional, P2, one line, text-only):**

| Friend | Dead-end line |
|---|---|
| **Mira** | “Dead end. I could invent a sign.” |
| **Bo** | “Nothing here. ...Is it lunchtime?” |
| **Pico** | “Hmph. I could have told you.” |
| **Roku** | “Ah, the scenic route.” |
| **Taro** | “Oops. Sorry, little path.” |
| **Nova** | “Obviously a dead end.” |
| **Kiko** | “My whiskers say no.” |

**Rules:** one line, no new mechanics, no blocking. The friends' chalk X is **white/cream on the floor**; the Hollow Wish's seal is **red on the door**. They must never look alike.

**Grumblin and blocked-friend strings** are owned by `FRIENDS_PLAN.md`; they are listed in `STORY_COPY_DECK.md` §10 for drift control. See §11.16 for the story rules.

### 6.11 Accessibility and performance rules for the map

- **Shape + position + color** for every landmark; test protanopia and deuteranopia.
- **No flashing.** Fog moves slowly; reduced-motion mode removes drift and pulsing.
- **Sound-off play.** Every story beat has a visual cue: friend glow, orb pulse, door seal, mural.
- **Pre-reader cues.** The friend diorama glows; the orb pulses; the sealed door has a red X shape, not just a color.
- **Performance.** Reuse SVG symbols; cap props per cell; no per-frame filters; test on a low-end iPad.
- **Wordless playtest.** Mute text and audio; can a child retell the floor from the map alone?

---

## 7. Implementation plan (later — no code changes now)

### Phase 0 — Decisions (locked 2026-10-24)

- **Canon skin:** original cast. Keep Sora, Mira, Bo, Pico, Roku, Taro, Nova, and Kiko. No direct Dragon Ball names or likenesses.
- **Hollow Wish:** sad echo, not a comic villain. Soft fog, a red X, a dimming light; no face, no chase, no jump scare.
- **Text budget:** one line per toast. The chapter title rides on the existing intro modal; no separate cutscene and no blocking story screens.
- **Grandpa Ren:** alive and waiting at the foot of the tower. Warm intergenerational ending; no grief subplot.
- **Floor 1 echoes:** keep the tutorial clean. No crash echoes in the first implementation; revisit only if playtests ask for more collectibles.
- **True wish:** add the fourth “let the story end” wish in a later finale pass, always available. The existing three wishes remain valid endings.
- **Map handoff:** a separate one-page brief for the map agent is provided in `MAP_STORY_BRIEF.md`; §6 remains the full rationale.

### Phase 1 — Content-only pass (no engine changes)

- Rewrite `src/content/floors.ts`: titles, subtitles, `intro`, `orbHint`, chapter names, canon references. Pull the final strings from `STORY_COPY_DECK.md` (P0 first, then P1).
- Rewrite `src/content/characters.ts`: roles, greetings, epithets. Keep IDs and colors stable.
- No generator changes. No navigation changes. No save schema changes.
- The map agent can work in parallel on Phase 4.

### Phase 2 — Small UI wiring (uses existing slots)

- Extend `FloorStory` with `friendLine`, `radarLine`, `orbLine`, `sealedLine`, `wrongLine`, `completeLine`, `nextTeaser`. Pull the final strings from `STORY_COPY_DECK.md`.
- Render them in the existing toasts and completion modal.
- Add a one-line “chapter card” before the intro modal if the text budget allows.
- Separate `Character.greeting` (rescue) from `completeLine` (completion); today the completion modal reuses `friend.greeting`.
- No new screens, no new item types, no generator changes.

### Phase 3 — Optional narrative layer

- Add `echoes?: string[]` to `FloorStory` and show a story-line toast when a coin/carrot is collected.
- Add a “memory book” / codex screen for collected echoes (optional; can be a modal).
- If echoes are tracked, bump `SaveData` to version 2 with a migration that keeps existing progress. Merge this with `FRIENDS_PLAN.md`'s v2 schema (`rescuedFriends`, `settings.friendHelp`, `seenScoutTutorial`) into **one** migration, not two. Add `echoes` to that same schema.
- Add an all-echoes bonus line at each door on Floors 4–7 (Floor 3's carrot lines are mission feedback; its “all echoes” bonus is the completed code).

### Phase 4 — Map visual layer (the other agent)

**Status (2026-10-25):** the geometry half landed in commit `3d0fdc0` — per-floor sector counts, bigger rings, spiral 5×9 ears, merged wall paths. The story half is still open: silhouettes, landmarks, props, ring narrative, breadcrumbs.

- Implement the silhouette, landmarks, props, palette, and ambience from §6.4.
- Keep the six landmark grammar.
- Build the Floor 7 journey table from the previous floors' objects.
- No text in the map.

### Phase 5 — Finale and epilogue

- Add the fourth wish to `WISHES`. The existing three wishes stay exactly as they are.
- Add the dragon's wish dialogue and the epilogue card.
- Add the “new game+” tease: a new door appears in the stars.
- Update the finale art if needed: the dragon, the seven orbs, the friends, the tower as a lighthouse.

### 7.1 Proposed data contract (for later)

This is a plan, not an implementation. It shows how little needs to change.

```ts
interface FloorStory {
  config: FloorConfig;
  accent: string;
  chapter: string;          // "The First Memory"
  canonRef: string;         // "Pilaf Saga"
  intro: string;            // existing
  orbHint: string;          // existing
  friendLine: string;       // on rescue
  radarLine: string;        // on radar
  orbLine: string;          // on orb
  sealedLine: string;       // on sealed door
  wrongLine: string;        // on wrong answer
  completeLine: string;     // on completion
  nextTeaser: string;       // on next-floor button
  soraLine?: string;        // optional Sora beat (e.g. “There are only eight of us.”)
  echoes?: string[];        // optional memory echoes
}
```

### 7.2 Acceptance criteria

- Every floor has: chapter title, canon north star, one-sentence premise, five-beat story, map brief, dialogue copy, completion line, and teaser.
- The macro story answers: Why the tower? Why seven orbs? Why the friends? Why the wish? What does Sora want and need? What is the Hollow Wish? How does it end?
- The story works with the existing loop: rescue → objective → door → orb. No new blocking mechanics.
- Every line is read-aloud friendly: no more than two sentences per toast; intro under 40 words.
- No scary content, no fail states, no timers added for story.
- The map and story can be implemented independently. Text lives in content data; visuals live in the map.
- The 4-star marble, the real 4-star Dragon Orb, and the Hollow Wish all pay off in the finale.
- Sora's flaw (“a story only counts if you finish it alone”) is stated early, tested on Floor 6, and answered in the finale.
- All four wishes are emotionally valid; the true wish is available but not the only “correct” choice.

### 7.3 Test plan

- **Read-aloud:** play every line with the existing voice button; check pronunciation of names (Sora, Mira, Bo, Pico, Roku, Taro, Nova, Kiko, Ren).
- **Text overflow:** longest line at the smallest supported width; completion modal; door modal; finale cards.
- **Localization:** avoid puns that only work in English (the A = 1 code is language-dependent; note it for translators).
- **Accessibility:** color is never the only signal; landmarks have distinct shapes; reduced motion respected; contrast checked.
- **Child playtest:** ages 5–8; can they retell each floor's story in one sentence? Do they understand why the door is sealed? Do they feel sorry for the Hollow Wish, not scared of it?
- **Map/story review:** walk each floor with the map agent and the copy deck side by side.

### 7.4 Risks

| Risk | Mitigation |
|---|---|
| **IP:** direct canon names for a commercial release | Keep the original cast; use the canon map as inspiration, not a retelling |
| **Too much text** for ages 5–8 | One line per toast; optional story cards; read-aloud; test with children |
| **The Hollow Wish is scary** | Soft fog, sad voice, no face, no chase; the red X is the only mark |
| **Canon mismatch** | Say “inspired by,” not “retelling”; use canon as emotional grammar |
| **Map/story drift** | Six landmark grammar; copy deck review; text lives in content data |
| **Localization** | Short strings; no English-only puns; note the A = 1 code for translators |
| **The true wish feels like the “right” answer** | All four wishes are valid; the dragon says so; no wrong ending |
| **4-star confusion** | The marble is glass and a copy; the real orb is on the library pedestal; never call the marble a Dragon Orb |
| **The child king reads as a tyrant** | He is a lonely kid; the paper crown is a child's craft; sensitivity read before ship |
| **Copy drift between plan and code** | `STORY_COPY_DECK.md` is canonical; review it with the map agent |
| **Two save migrations** | One v2 schema, merged with `FRIENDS_PLAN.md` §8; no divergent fields |

### 7.5 What not to do

- Do not rename the game or the existing characters in this pass.
- Do not add cutscenes that block play.
- Do not make the Hollow Wish a jump scare or a boss fight.
- Do not change maze difficulty, ring counts, or item placement for story reasons.
- Do not put essential story only in visual detail; the read-aloud text must stand alone.
- Do not make the true wish the only happy ending.
- Do not call the glass marble a Dragon Orb, and do not put the real 4-star orb in Sora's hand before Floor 4.
- Do not make the child king a tyrant or the dragon a villain.
- Do not write two save migrations; use the one merged v2 schema.
- Do not put story text in the map.

---

## 8. Optional direct-canon skin

If you decide to use Dragon Ball names directly, this is the mapping. The floor themes, map briefs, and story beats above still work; only the names and outfits change.

| Game | Canon skin | Notes |
|---|---|---|
| Sora | Kid Goku | Spiky hair, orange gi, earnest |
| Mira | Bulma | Capsule crash, Dragon Radar, blue hair |
| Bo | Krillin | Bald monk, friendly rival, dumplings |
| Pico | Piccolo | Green guardian, cape, grumpy softness |
| Roku | Master Roshi / Kami | Old mentor, sky library, memory |
| Taro | Bora / Android 8 | Gentle giant, protective father energy |
| Nova | Vegeta | Scouter, pride, star kingdom, redemption |
| Kiko | Korin / Puar | Cat, wish keeper, last guardian |
| Hollow Wish | Shadow of King Piccolo's wish | Original villain; not a canon character |
| Eternal Dragon | Shenron | The wish-granting dragon |
| Forgotten King | Original character | Do not use a canon king; the story needs an original lonely **child** king |
| Grandpa Ren | Grandpa Gohan | The 4-star ball; the emotional center. The glass **4-star marble** is original to this story |
| Dragon Orbs | Dragon Balls | 1–7 stars |
| Dragon Radar | Dragon Radar | Bulma's invention |
| Dragon Coins | Game-only | Keep as a game collectible |

**Canon floor map:** Floor 1 = Pilaf Saga; Floor 2 = 21st Budokai / Turtle School; Floor 3 = Red Ribbon / Monster Carrot / Muscle Tower; Floor 4 = Korin Tower / Kami's Lookout / Grandpa Gohan; Floor 5 = Red Ribbon desert / Bora & Upa; Floor 6 = Saiyan / Namek / Frieza; Floor 7 = Kami's Lookout / Shenron / final wish.

**IP note:** Direct Dragon Ball names and likenesses are copyrighted. A personal fan project is one thing; a commercial release needs a license. The original cast is the safest path and already maps cleanly to every beat.

---

## 9. Locked decisions (2026-10-24)

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Canon skin | **Original cast** | Matches the README's reskin-safe design; avoids IP risk; the canon map still works as inspiration |
| 2 | Hollow Wish | **Sad echo** | Age-appropriate for 5–8; the story is about release, not defeating a villain |
| 3 | Text budget | **One line per toast** | Read-aloud friendly; no blocking cutscenes; the chapter title rides on the existing intro modal |
| 4 | Grandpa Ren | **Alive and waiting** | Warm ending; avoids a grief subplot that would dominate a short kids' game |
| 5 | Floor 1 echoes | **Keep the tutorial clean** | The first floor teaches the loop; no optional collectibles to distract |
| 6 | True wish | **Add a fourth wish later, always available** | Resolves the Hollow Wish and the king's story without making the other three “wrong” |
| 7 | Map handoff | **Separate one-page brief** | The map agent can work in parallel without reading the full story bible |
| 8 | 4-star continuity | **Glass marble + real orb** | Sora carries a copy; the real orb is in the library; no contradiction |
| 9 | Sora's flaw | **“A story only counts if you finish it alone”** | Gives the party/scouting mechanic an emotional payoff |
| 10 | The king | **A lonely child** | Keeps the Hollow Wish sad, not villainous |
| 11 | The dragon | **The king's only friend** | The wish was an act of love; the dragon needs an ending too |
| 12 | Ring narrative | **Outer lie / middle memory / inner truth** | Tells the story in the map without text |
| 13 | Copy budget | **P0 / P1 / P2** | Protects the short text budget; see `STORY_COPY_DECK.md` |
| 14 | Save v2 | **One migration** | Merge with `FRIENDS_PLAN.md`; no divergent saves |
| 15 | Voice | **Narrator first; per-character later** | Current `speak()` is single-voice; plan only |
| 16 | Grumblin (Rev 3) | **A friendly rescue beat, never a villain** | Owned by `FRIENDS_PLAN.md`; story rules in §11.16; never Floor 1, never the finale |

**No open questions remain for the story direction.** Revision 2 adds implementation-level decisions, not new story questions. The next step is the content-only pass in Phase 1, which is still a code change and should wait for the map work or a separate implementation session.

---

## 10. Summary

- **Story:** a tower of seven memories, seven trapped keepers, seven orbs, and one lonely wish that must be released.
- **Canon:** each floor maps to a specific Dragon Ball saga — Pilaf, Turtle School, Red Ribbon/Monster Carrot, Korin/Kami/Grandpa Gohan, Bora & Upa, Saiyan/Namek, Shenron.
- **Original cast:** Sora, Mira, Bo, Pico, Roku, Taro, Nova, Kiko; the Hollow Wish; the Eternal Dragon; Grandpa Ren.
- **Structure:** three acts, seven floors, one emotional spine (the 4-star **marble** and the real 4-star **Dragon Orb**), one theme (“a wish is a promise; a story is shared”).
- **Sora's arc:** his lie (“a story only counts if you finish it alone”) is tested on Floor 6 and answered by the party in the finale.
- **The king:** a lonely child, not a villain. The dragon was his only friend and granted the wish out of love. The true wish lets them both go.
- **Map:** six landmark types, ring narrative (outer lie / middle memory / inner truth), visual storytelling per floor, optional echo layer using existing collectibles.
- **Implementation:** content-only first; small UI wiring second; map visuals in parallel; finale last. One copy deck (`STORY_COPY_DECK.md`) and one save v2.
- **Locked decisions:** original cast, sad Hollow Wish, one line per toast, Grandpa Ren alive, clean Floor 1, fourth wish added later and always available, separate map brief, glass marble + real orb, child king, one save v2, grumblin as a comedy rescue beat (never Floor 1, never the finale).
- **No code changed by the story plan:** `STORY_PLAN.md`, `MAP_STORY_BRIEF.md`, and `STORY_COPY_DECK.md` are the only artifacts; the map redesign that landed in `3d0fdc0` was the other agent's work.

---

## 11. Revisions 2 & 3 — gap fixes and codebase sync

> **Status:** canonical where it conflicts with §1–§10. Revision 2 (2026-10-24) closes every gap from the story review. Revision 3 (2026-10-25) syncs the plan to the committed codebase (map redesign, `3d0fdc0`) and folds in the accepted grumblin scouting twist (§11.16). No code changed.
> **Companion artifacts:** `STORY_COPY_DECK.md` (canonical strings), `MAP_STORY_BRIEF.md` (visual handoff), `FRIENDS_PLAN.md` (scouting and grumblins; do not duplicate its schema).

### 11.1 The 4-star fix (canon)

**The two objects:**

| Object | What it is | Where it is | What it does |
|---|---|---|---|
| **4-star marble** | A glass marble with a four-point star inside, made by Grandpa Ren from a shard of the library's star-glass | Sora's pocket, from the prologue to the epilogue | Warms near the real orb; proves Sora is Ren's grandson; cannot wake the dragon |
| **Real 4-star Dragon Orb** | One of the seven Dragon Orbs, the memory of “one more day” | On the pedestal in the sky library until Floor 4; then with Sora; then back to the dragon in the true wish (with the tower in the other endings) | Hums with the promise; one of the seven lights |

**Backstory:** Grandpa Ren climbed the tower as a boy. He found the real 4-star orb in the sky library and wished for “one more day with my family.” The dragon could not grant a wish for the past. Grandpa Ren left the real orb on the pedestal as a promise, made **two** glass copies from a shard of star-glass — one for himself, one for Sora — and went home. The marble is a keepsake, not a Dragon Orb.

**Where it appears:**

| Beat | What the player sees | What the text says |
|---|---|---|
| Prologue | Grandpa Ren ties the marble into Sora's pocket | “Bring me back a story.” |
| Floor 1 | The marble is warm; Mira notices it | “Grandpa made it. It has a four-point star inside.” |
| Floor 4 | The marble glows; Roku recognizes it; the real orb is on the pedestal | “That marble is a good copy. The real one is here.” |
| Floor 4 orb | The real orb hums; the marble answers | “One more day together.” |
| Floor 6 | The marble is warm in the forge | No line needed; visual only |
| Floor 7 | The marble is warm at the altar | “The marble in your pocket is warm.” |
| Finale (true wish) | The seven real orbs lift; the marble stays in Sora's pocket | “The real 4-star Dragon Orb is a new star. The marble stays with you.” |
| Epilogue | Sora holds up the marble; Grandpa Ren holds up its twin | “I brought you a story.” |

**Hard rules:**
- Never call the marble a Dragon Orb.
- Never say Sora carries the real 4-star orb before Floor 4.
- The marble cannot wake the dragon, open a door, or count as one of the seven.
- In the true wish, the real orbs return to the dragon. In the other endings, they stay with the tower. The marble stays with Sora in every ending.
- The twin marble is Grandpa Ren's; it is the visual proof that the story was shared, not solo.

### 11.2 Sora's arc

**The lie:** “A story only counts if you finish it alone.”
**The want:** bring Grandpa Ren a story.
**The need:** learn that a story is shared.
**The ghost:** Grandpa Ren climbed the tower once and came back with a story. Sora thinks he has to match it alone.
**The turn:** on Floor 6, he tries to hold the forge light alone and fails; Nova and the party hold it with him.
**The truth:** “A story isn't a trophy. It's a table. Everyone gets a seat.”

| Act | Floors | Sora's lie in his own words | What cracks it |
|---|---|---|---|
| I | 1–2 | “I can do this alone.” | Mira joins him; Bo sets a place for him. |
| II | 3–5 | “If I keep the memory, I won't lose it.” | Pico rests; Roku lets the orb go; Taro lets the children help. |
| III | 6–7 | “If I finish alone, it will count.” | The forge light slips; the party climbs the last stairs with him. |

**How it shows up:**
- **Floor 1:** he introduces himself as “Sora, alone” — a small joke that lands differently later. (Optional P2 line.)
- **Floor 2:** Bo sets twelve places; Sora counts seven friends and himself. Four seats are empty. Bo: “Four for the next friends.” Sora does not notice yet.
- **Floor 3:** Pico says, “I don't need help.” Sora agrees too quickly. The player sees the mirror.
- **Floor 4:** the Hollow Wish says, “Keep the memory. Don't let go.” Sora holds the marble, then the real orb; he chooses to carry, not cling.
- **Floor 5:** Taro tries to hold the gate alone; Sora tells him to let the children help — and hears his own lie.
- **Floor 6:** Sora tries to hold the forge light alone; it slips; Nova says the line; they hold it together.
- **Floor 7:** the Hollow Wish offers him the throne: “Finish alone. Keep the story.” Sora chooses the party.
- **Finale:** the roll call; Sora's “table” line; the wish.

**New lines (P1 unless marked):**
- **Floor 2, Bo:** “Twelve places. One for every dumpling. Four are for the next friends.” / **Sora:** “There are only eight of us.”
- **Floor 3, Pico:** “I don't need help.” / **Sora:** “I know. Neither do I.” (P2; the silence after is the point.)
- **Floor 6, Sora:** “I can hold it.” / **Nova:** “No. You can't. That's not a failure. That's a forge. Together.”
- **Floor 7, Hollow Wish:** “Finish alone. Keep the story. Be remembered.” / **Sora:** “A story isn't a trophy. It's a table. Everyone gets a seat.”
- **Finale, Sora:** “I brought you a story. It's not just mine.”

**Why it matters:** the party/scouting mechanic is not a side feature; it is the answer to Sora's lie. If scouting is cut, the arc still works through the rescued friends in the finale. If scouting ships, the mechanic and the theme are the same thing.

### 11.3 The king, the dragon, and the Hollow Wish

**The backstory (canon for this game):**
- A lonely child was given a crown and a tower full of stories. The tower had seven windows. He wanted one story for each window.
- His only friend was the dragon. The dragon coiled around the tower and listened to him talk about the stories.
- The child wished, “Let my story never end.” The dragon granted it because it could not say no to its friend.
- The wish cracked the dragon's light into seven stars — one for each window. Each star became a Dragon Orb. Each orb chose a keeper: a person who loved that story enough to stay.
- The tower became a loop. The keepers were caught in their roles. The loop kept the king a child; the Hollow Wish is the loneliness he left behind.
- The dragon has been awake and unable to move ever since. It has listened to every telling. It wants an ending as much as the child does.

**The paper crown breadcrumbs (visual only; no text):**

| Floor | Where the crown appears | What it tells the player |
|---|---|---|
| 1 | In the capsule debris | The king's story crashed here too |
| 2 | On a child-sized place setting | The king was small |
| 3 | On the scarecrow's hat | The garden is keeping a child's role |
| 4 | On a high shelf, next to *The King Who Wouldn't Say Goodnight* | The king was a child who couldn't sleep |
| 5 | Half-buried in the sandcastle | The castle was built for a child |
| 6 | On the anvil, tiny and scorched | The king's story was forged here |
| 7 | On the altar, waiting | The king is ready to be remembered |

**The dragon breadcrumbs (visual/audio only):**

| Floor | Breadcrumb | What it tells the player |
|---|---|---|
| 1 | A warm scale fused into the vault wall | The dragon is part of the tower |
| 2 | A low rumble under the training count | Something big is breathing below |
| 3 | A warm wind in the garden | The dragon is watching |
| 4 | A warm wind from the planetarium; a star that is not there yet | The dragon's eye is in the sky |
| 5 | A heartbeat under the storm | The tower is alive |
| 6 | A claw mark in the cooling room | The dragon built the forge |
| 7 | A heartbeat in the altar | The dragon is waking |

**The Hollow Wish encounters:**

| Floor | Encounter | What it says | How it appears |
|---|---|---|---|
| 1 | Whisper at the crash | “Turn back. Stories are safer when they stay closed.” | Fog at the edge; no shape |
| 2 | Whisper at the dojo gate | “You don't need a table. You need a trophy.” | Fog in the steam |
| 3 | Whisper in the vines | “A guardian never rests. Neither should you.” | Fog behind the scarecrow |
| 4 | **First full encounter** | “You miss him. Keep the memory. Don't let go.” | A gray shape in the planetarium constellations; two-line toast, no cutscene |
| 5 | Sand-fog in the storm | “A wall can't love you back. Let the storm take the rest.” | A tall gray shape in the wind; it howls, never chases |
| 6 | Offer to Nova | “Take the star. Be the strongest. Never need anyone.” | A gray shape in the forge smoke; Sora sees it clearly |
| 7 | Offer to Sora | “Finish alone. Keep the story. Be remembered.” | A gray shape on the empty throne; the red X on the door pulses once |

**The repeated phrase:**
- The king wrote it: **“Let it never end.”**
- The Hollow Wish whispers it.
- The dragon repeats it at the finale: “I granted a wish for a story that would never end.”
- Sora answers it: **“Let it end.”**
- This is the emotional key to the true wish. Use it sparingly: Floor 4, Floor 7, finale.

**The final scene (true wish):**
- The child king appears as a child in a paper crown. He does not ask for forgiveness. He says, “I only wanted someone to remember me.”
- The dragon lowers its head: “I remember you. That was never the problem. The problem was letting you go.”
- The child becomes a small light and joins the stars. The paper crown stays on the porch step, warm.
- The Hollow Wish says “Thank you” in the child's voice, then goes quiet.

**Hard rules:**
- The king is a child, never a tyrant. No “evil king” language.
- The dragon is not a villain and not a wish machine. It is a friend who made a mistake out of love.
- The Hollow Wish never chases, shouts, or threatens. It is sad, not scary.
- The child king is never mocked for being lonely. The tone is gentle.
- The true wish is an act of love, not a punishment.

### 11.4 Rules of the tower

**Why seven?** The tower has seven windows. The child king wanted one story for each window. The dragon's light broke into seven stars to fill them. Seven is not a magic number; it is the number of windows the king could see from his bed.

**Why the keepers?** Each orb chose a keeper — a person who loved that story enough to stay. The tower pulled them in when the loop tightened. They are not guards by choice; they are readers who got caught in the book.

**Why the loop?** The king's wish was “let my story never end.” The tower replays the seven stories. The keepers are trapped in their roles. The Hollow Wish keeps the loop going because an ending means being forgotten.

**Why is the tower fading?** The seven orbs are scattered across the floors. The dragon's light is dim. The **real 4-star Dragon Orb** is the one Grandpa Ren left in the library; its absence from the altar is part of why the tower's heart is faint. All seven must return.

**What can the dragon do?**

| Can | Cannot |
|---|---|
| Open a door to a new story | Bring back a day |
| Return a memory | Undo a death |
| Wake a friend | Make someone stay |
| Grant a wish for the future | Erase a wish already made |

**Why Grandpa Ren's wish failed:** he wished for “one more day with my family” — a wish for the past. The dragon could not grant it. The king's wish was for the future (“never end”), so the dragon could grant it literally. That is the difference between a memory and a loop.

**Why the marble matters:** Grandpa Ren could not take the real orb, so he made **two** copies — one for himself, one for Sora. The copy is a promise to come back. Sora brings the promise back to the real orb. That is the emotional engine of Floor 4.

**The tower exterior:** seven windows, one per orb. The top window is the dragon's eye. The village at the foot has Grandpa Ren's porch. The tower is a story made physical; the exterior is the book cover.

### 11.5 Prologue, home frame, and tower exterior

**First-play flow (no new blocking screen required):**
1. Home screen: the tower exterior, seven dark windows, Grandpa Ren's porch light.
2. Prologue card (reuse the existing intro modal; no new screen): “At the foot of the tower, Grandpa Ren gives Sora a glass marble with a four-point star. ‘Bring me back a story.’”
3. Floor 1 intro: the crash. The marble is warm in Sora's pocket.
4. After Floor 1, the first window lights.

**Prologue copy (P0, ~30 words):**
> “At the foot of the tower, Grandpa Ren gives Sora a glass marble with a four-point star. ‘Bring me back a story.’ Sora promises. The tower door opens.”

**Home / tower screen:**
- Seven windows; dark until cleared; the top window is the dragon's eye.
- Grandpa Ren's porch: a warm light, a chair, a fishing rod.
- After the true wish: the tower is a lighthouse; all windows lit; the top window open.
- Replay: all windows lit; the tower remembers.

**Implementation:** background art only; no gameplay changes. The map agent can add the exterior after the maze pass. If the HomeScreen cannot show seven windows in the current layout, use a small tower illustration with seven dots; the story still works.

### 11.6 Finale roll call and ensemble

The roll call is the emotional payoff of the party. It happens before the wish, after the dragon rises. It is one line per friend, not a cutscene.

**Staging:**
- The seven friends step out of the party line and stand in a half-circle with Sora.
- Each holds one object from their floor: Mira's bolt, Bo's steamer, Pico's seed, Roku's star chart, Taro's shell, Nova's plant, Kiko's drawing.
- The dragon coils around the tower; its head lowers to their level.
- The Hollow Wish is a gray shape at the edge, listening.

**Lines:** see §5.1 table. The order is rescue order: Mira, Bo, Pico, Roku, Taro, Nova, Kiko. Sora speaks last.

**Rules:**
- The friends do not vote on the wish. The choice is Sora's.
- The friends do not explain the theme. Their promises show it.
- The dragon addresses the group, not just Sora: “Seven orbs. Seven friends. One wish.”
- The Hollow Wish's final offer is to Sora alone; the friends' presence is the answer.
- If the game cannot show seven friends at once, show three active friends and a party bar; the lines can appear as a single roll-call card.

**Why it matters:** the finale is not “Sora wins.” It is “Sora arrives with everyone.” That is the visual and emotional answer to his lie.

### 11.7 Copy budget and priorities

**Priority tiers:**

| Tier | What ships | Examples | Rule |
|---|---|---|---|
| **P0** | Required to understand the story | Floor intro, rescue, orb, sealed door, completion, finale wish cards, epilogue | Must ship in Phase 1/2 |
| **P1** | Makes the story land | Radar line, wrong-answer hint, teaser, prologue, roll call, Sora's flaw lines | Ship with the mission if the text budget allows |
| **P2** | Delight and replay | Echoes, scout banter, chapter cards, all-echo bonus, post-credits | Polish; cut first if the budget is tight |

Grumblin and blocked-friend alerts (“Help {name}!”, “A friend needs help first!”, “Phew! Thanks!”) are P1 but owned by `FRIENDS_PLAN.md`; they are listed in the copy deck §10 so the decks never drift.

**Max lengths:**

| Slot | Max words | Max sentences | Why |
|---|---|---|---|
| Floor intro | 40 | 2 | Existing intro modal |
| Rescue toast | 30 | 2 | One line per toast |
| Orb toast | 22 | 2 | One line per toast |
| Sealed door | 22 | 2 | One line per toast |
| Completion | 30 | 2 | Completion modal |
| Echo | 14 | 1 | Optional memory |
| Scout banter | 10 | 1 | Optional, P2 |
| Roll call line | 12 | 1 | Seven lines in a row |
| Wish card | 20 | 2 | Finale card |

**Cut list (in order):**
1. Scout banter (P2).
2. All-echo bonus lines (P2).
3. Chapter cards (P2; the chapter title already rides the intro modal).
4. Echoes on Floors 4–7 (P2; keep the mission lines).
5. Post-credits teaser (P2; keep the true wish epilogue).

**Never cut:** Floor 1 rescue, Floor 4 marble/orb reveal, Floor 6 “hold it together,” Floor 7 “finish alone” offer, finale roll call (or a condensed version), true wish epilogue.

### 11.8 Replay, endings, and the loop

**First clear:**
- Full prologue, full floor story, full roll call, chosen wish, epilogue.
- The true wish unlocks the child king scene and the lighthouse.

**Replay:**
- Skip the long intro; show a “story so far” card: one line per cleared floor.
- Keep `completed`, `rescuedFriends`, `echoes`, and settings.
- Let the player choose a different wish at the top.
- The dragon says: “You again. Good. Every telling is a new wish.”
- The true wish can be chosen again; it does not erase the other endings.

**Story-so-far card (P1, one line per floor):**
- F1: “Mira crashed; you found the first orb.”
- F2: “Bo set the table; you counted twelve.”
- F3: “Pico rested; the garden opened.”
- F4: “Roku kept the real star; you kept the marble.”
- F5: “Taro let the children help; the storm broke.”
- F6: “Nova left the forge door open.”
- F7: “Kiko shared the last wish.”

**Endings:**
- Feast / stars / adventure: the tower stays open; the Hollow Wish is quieter; the king's story waits.
- True wish: the child king is released; the dragon says goodbye; the tower becomes a lighthouse.
- All four are valid. The dragon says: “Every wish is a door. Some open outward. Some open inward. All of them are real.”

**Post-credits teaser (P2):**
- A new door in the stars; the dragon's eye opens; “The tower is always open.”
- It is a visual + one line, not a new mode.

**Why the loop is not a failure:** the tower is a story. A story can be retold. The true wish ends one telling; replay begins another. That is the difference between a loop that traps and a story that grows.

### 11.9 Voice, language, and localization

**Current state:** `speak(text, enabled)` in `src/game/audio.ts` is fixed `en-US`, rate 0.92, pitch 1.08. It cannot do per-character voices or locales today.

**P0 (no code change):**
- Use the existing narrator voice for intro, rescue, and completion.
- Keep toasts text-only; do not queue seven voice lines.
- Write every line to be read aloud by one warm narrator.

**P1 (later code change):**
- Add a `speakAs` layer with per-character pitch/rate. This is a plan, not current scope.

| Character | Pitch | Rate | Voice note |
|---|---|---|---|
| Narrator | 1.00 | 0.92 | Warm, unhurried |
| Sora | 1.10 | 1.00 | Earnest, bright |
| Mira | 1.15 | 1.05 | Fast, technical |
| Bo | 1.05 | 1.00 | Cheerful, food metaphors |
| Pico | 0.85 | 0.95 | Clipped, grumpy |
| Roku | 0.80 | 0.85 | Slow, wry |
| Taro | 0.75 | 0.90 | Warm, careful |
| Nova | 0.95 | 0.95 | Proud, dry |
| Kiko | 1.20 | 1.05 | Bright, purring |
| Grandpa Ren | 0.90 | 0.90 | Warm, teasing |
| Hollow Wish | 0.70 | 0.80 | Soft, sad, never loud |
| Dragon | 0.65 | 0.80 | Low, slow, rumbling |
| Child king | 1.25 | 0.95 | Small, quiet, one scene |

**Pronunciation guide:** Sora (SOR-ah), Mira (MEER-ah), Bo (BOH), Pico (PEE-koh), Roku (ROH-koo), Taro (TAH-roh), Nova (NOH-vah), Kiko (KEE-koh), Ren (REN), Long (LONG).

**Rules:**
- Do not rely on voice differences for comprehension. Text and visuals carry the story.
- Test `speechSynthesis` on iPad/Safari and Chrome; voice availability varies.
- Do not queue more than one line at a time. The current voice button is a read-aloud, not a radio play.
- Keep the Hollow Wish quiet; never use a jump-scare audio sting.
- Localization: `speak(text, enabled, lang?)` later; text expansion can break buttons, so test the longest string.
- The A=1 code door is language-dependent; see §11.10.

### 11.10 Localizing the code door (A=1)

**English (current):** A=1, B=2, ..., Z=26. The three carrot villagers are **Bram (2)**, **Uma (21)**, **Gus (7)**. Their initials spell **BUG**, the ladybug gate's word.

**Problem:** the code is a literacy mechanic. It cannot be machine-translated. A different language needs a different word and possibly different carrot numbers.

**Options:**

| Option | How it works | Pros | Cons |
|---|---|---|---|
| **Locale word** | Author a 3-letter word in the target language and assign three carrot numbers/names that spell it | Keeps the A=1 literacy hook | Requires per-locale content authoring and testing |
| **Symbol code** | Carrots show symbols (★, ●, ▲); the gate shows the same symbols | Language-neutral | Loses the alphabet hook |
| **Number lock** | The gate asks for three numbers; no letters | Language-neutral, simple | Loses the literacy hook entirely |

**Recommendation:** keep A=1 + BUG for English. For non-English locales, use the **symbol code** as the default fallback, and let a locale team author a word if they want the literacy hook. Do not ship a machine-translated BUG.

**Translator note:** the carrot names are content, not UI strings. Changing the word means changing the names, the numbers, the gate hint, and the voice line together. Mark it P2; English ships first.

### 11.11 Accessibility, sensitivity, and performance

**Accessibility:**
- **Shape first:** every landmark has a distinct shape, not just a color.
- **Colorblind:** test protanopia and deuteranopia; the red X must also be a shape; the chalk X must be white/cream and on the floor.
- **Motion:** reduced-motion mode removes fog drift, pulsing, and camera shake.
- **Sound-off:** every story beat has a visual cue; no audio-only information.
- **Pre-reader:** friend diorama glow, orb pulse, door seal, mural. A child can point to the story without reading.
- **Captions:** if voice is added, show the text at the same time; do not auto-hide too fast.
- **Contrast:** check the red X, the chalk X, and the orb glow against each floor palette.

**Sensitivity:**
- **The king is a child.** Never a tyrant; never mocked. The tone is gentle.
- **The dragon is a friend.** It made a mistake out of love, not malice.
- **The Hollow Wish is sad, not scary.** No face, no chase, no jump scare, no boss fight.
- **Bo's dumplings and monk imagery** are affectionate, not a joke about his culture.
- **The “everyone goes home” ending** is optional; no child is told their family must look a certain way.
- **Sensitivity read:** have a children's editor or sensitivity reader review the child-king scene and the Hollow Wish's “Thank you.”
- **No death on screen.** Grandpa Ren is alive; the king's “ending” is a release, not a death.
- **The grumblin is comedy, not peril.** The blocked friend is safe and talking; the grumblin flees in a puff of smoke when Sora arrives; no timer, no damage; the door simply waits. It never appears on Floor 1.

**Performance:**
- Reuse SVG symbols; cap props per cell (max 3).
- No per-frame filters or blur on the fog; use a static gradient + slow opacity.
- Test on a low-end iPad and a small phone.
- Ambient audio optional; the game must work muted.
- The seven-window tower exterior is one SVG, not seven animated layers.

**Wordless playtest:** mute text and audio. Can a child retell the floor from the map alone? If not, the map is not doing its job.

### 11.12 One copy deck and one save v2

**Copy deck:** `STORY_COPY_DECK.md` is the canonical string list. If it disagrees with §4 or §5, the copy deck wins for implementation; update the plan to match.

**Save v2 schema (merged with `FRIENDS_PLAN.md` §8):**

```ts
interface SaveDataV2 {
  version: 2;
  completed: number;
  settings: Settings & {
    friendHelp: "auto" | "manual" | "off";
  };
  seenTutorial: boolean;
  seenScoutTutorial: boolean;
  rescuedFriends: string[];   // character IDs, rescue order
  echoes: string[];           // echo IDs, story plan addition
}
```

**Why these names:** `rescuedFriends`, `settings.friendHelp`, and `seenScoutTutorial` are already specified in `FRIENDS_PLAN.md` §8. Do not rename them in the story pass; one schema, one migration. `echoes` is the only story-specific addition.

**`echoes` scope:** it may store all 15 story-line IDs for the memory book. The 3 carrot IDs are also mission progress, so do not treat their presence as optional progress. The 12 coin IDs on Floors 4–7 are the true optional echoes.

**Migration:**
- Add `STORAGE_KEY_V2 = "dragon-orb-tower-save-v2"`. Read v2 first, then v1; migrate in memory; write v2 on the next save. Keep v1 read-only for rollback. `clearSave` clears both.
- `rescuedFriends`: infer from `FLOORS.slice(0, completed).map(f => f.config.friendId)`; union with any existing list; dedupe; preserve rescue order; filter unknown IDs.
- `settings.friendHelp`: default `"auto"`.
- `echoes`: default `[]`; filter unknown IDs.
- `seenScoutTutorial`: default `false`.
- `completed`: keep the 0–7 clamp.
- If storage is unavailable, fall back to a fresh v2 save; the game still works.

**Current-string diff (what changes in Phase 1/2):**

| Current field | Current use | Revision 2 change | Phase |
|---|---|---|---|
| `FloorStory.intro` | Intro modal | Replace with the new intro (≤40 words) | 1 |
| `FloorStory.orbHint` | Orb hint | Replace with the new hint | 1 |
| `Character.greeting` | Rescue toast **and** completion modal | Split into `greeting` (rescue) and `completeLine` (completion) | 2 |
| `completeTitle` | Computed in `PlayScreen` | Keep; add `completeLine` | 2 |
| `friend.name` | UI | Keep; no change | — |
| `WISHES` | Three finale cards | Add the fourth wish later; keep all three | 5 |
| `SaveData` | v1 | v2 merged schema above | 3 |
| `speak(text, enabled)` | Fixed en-US | Add optional `lang`/`speakAs` later | 3+ |

**Do not change:** `Character.id`, character colors, `FloorConfig` fields, ring counts, mission logic, item placement, or the generator. The story rides on existing slots.

**Merge order and ownership:**

| Order | Work | Owner | Gate |
|---|---|---|---|
| 1 | Map redesign (geometry) — **landed 2026-10-25, `3d0fdc0`** | map agent | Story visuals remain open |
| 2 | Story content (floors/characters) | story/content | No engine changes |
| 3 | Story UI wiring (toasts/completion) | story/UI | Uses existing slots |
| 4 | Scouting incl. grumblins (`FRIENDS_PLAN.md`) | friends agent | Feature flag; party bar reserved; map redesign already landed |
| 5 | Save v2 (one migration) | shared | After scouting schema is stable |
| 6 | Finale fourth wish + roll call | story/UI | After save v2 |
| 7 | Voice/localization | later | After English content is frozen |

**Feature flags:** `scouting` (party bar/scout overlay), `storyCards` (chapter cards/echoes), `fourthWish` (finale). The game must work with all three off.

### 11.13 Playtest rubric

**Comprehension (ages 5–8):**
- Can the child retell each floor in one sentence?
- Can they name what the friend wanted (not just the mission)?
- Do they understand why the door is sealed?
- Do they know the difference between the marble and the real 4-star orb? (Simpler: “Which one is Grandpa's copy?”)
- Can they explain why the king wished for the story never to end?

**Emotional:**
- Do they feel sorry for the Hollow Wish, not scared of it?
- Do they understand that the dragon was the king's friend?
- Do they feel the roll call is a happy moment, not a sad one?
- Do they have a favorite friend and can they say why?

**Map (wordless):**
- Point to the friend, radar, orb, and door by shape alone.
- Retell the floor with the text muted.
- Tell the difference between the chalk X and the red X.

**Wish:**
- Can they choose a wish and say why?
- Do they understand that all four wishes are real?
- Do they see the true wish as kind, not scary?

**Session plan:** 5 children, 20–30 minutes each, one adult reading aloud, one observer. Record:
- Time to first rescue.
- Number of prompts needed.
- The child's retelling (verbatim).
- Any fear reaction to the Hollow Wish.
- The chosen wish and the reason.

**Pass criteria:** 4/5 can retell the floor; 5/5 are not scared; 4/5 can explain the marble; 3/5 can explain why the king wished. If the Hollow Wish scares more than one child, soften the fog/voice before ship.

### 11.14 What changed in the old sections

| Section | Change |
|---|---|
| At a glance | New one-page pitch |
| §1.3 | Child king, dragon as friend, seven stars, glass marble |
| §1.4 | Sora's lie added |
| §1.7 | Matching glass star, marble, real orb reveal |
| §1.8 | Sora's flaw, marble/real orb split |
| §2 | Sora's need, child king, dragon's guilt, note |
| §2.1 | First full encounter, child voice |
| §2.2 | Dragon's friendship/guilt |
| §2.3 | King rewritten as a child |
| §3 | Floor 4/7 twists fixed |
| §3.2 | Canon reference appendix |
| §4 F1 | Marble, crown, scale, dialogue |
| §4 F2 | Coin count corrected to **12** to match `floors.ts` and `README.md` (the earlier draft said 8); ring count corrected to **15** |
| §4 F3 | Ring count corrected to **10** to match `floors.ts` |
| §4 F4 | Marble vs real orb fixed throughout |
| §4 F6 | “Hold it together” beat |
| §4 F7 | Child king, “finish alone,” party |
| §5.1 | Dragon's guilt, roll call |
| §5.2 | Fourth wish keeps the marble |
| §5.4 | Marble/real orb epilogue, child king |
| §5.5 | Child voice |
| §5.6–5.7 | Replay and post-credits |
| §6.7–6.11 | Ring narrative, placement contract, tower exterior, scout banter, accessibility |
| §7.2 | Acceptance criteria updated |
| §8 | Canon table fixed |
| §9 | New locked decisions |
| §10 | Summary updated |
| §11 | Revisions 2 & 3 |
| §11.16 | Revision 3: codebase sync + the grumblin |
| §4 F2 (Rev 3) | Intro no longer says “12”; coin toasts no longer reveal the count (matches the committed `PlayScreen`) |
| §4 F3 (Rev 3) | Ears updated to the landed 5×9 spiral mini-mazes with `earRow` |
| §6.6 (Rev 3) | Grumblin compatibility: blocked-friend beat, three-marks rule, pacing by floor |
| §6.8 (Rev 3) | Ear bands (`earRow`) and merged-wall-path placement rules |

### 11.15 What is intentionally not in scope

- No code changes in this pass. No `src/` edits.
- No new blocking cutscenes, no new screens.
- No per-character voice implementation now; plan only.
- No localization implementation now; note the A=1 risk.
- No change to the game's ring counts, mission logic, item placement, or the generator by the story plan. Ring/sector counts are the map agent's tuning; `floors.ts` is the source of truth (see §11.16's volatility rule).
- No scouting implementation; `FRIENDS_PLAN.md` owns it. The map redesign it was blocked on landed in `3d0fdc0` (2026-10-25), so scouting can start whenever the friends agent picks it up.
- No grumblin art, audio, or logic in the story plan; `FRIENDS_PLAN.md` owns the mechanic. This plan only fixes its story rules and voice.
- No sensitivity review yet; schedule it before ship.
- No final art; the map agent owns the visual layer.

### 11.16 Revision 3 (2026-10-25) — the grumblin and the codebase sync

**What changed in the code (commit `3d0fdc0`):**

| Change | Story consequence |
|---|---|
| Per-floor constant `sectors`; bigger rings | Ring bands are even widths; the ring narrative (§6.7) reads more cleanly |
| Floor 2 confirmed at 12 coins with opposite portals | Matches the plan; the counting door stays the test |
| Floor 3 ears rebuilt as tall 5×9 spiral mini-mazes with `earRow`; carrots avoid ear rims | Ear props get a tip/middle/base band; ear lanes read as hand-drawn carrot rows |
| The renderer merges collinear wall edges into long SVG paths | Props must stay at cell centers; never place anything on a wall segment |
| Floor 2 coin toast hides the running count (“Dragon Coin found! Keep exploring.”) | **Copy rule:** Floor 2 copy never reveals the coin count or total — no “That's {n}…”, no “12” in the intro |

**Tuning pass in flight (2026-10-25 working tree, after `3d0fdc0`):** the map agent retuned Floor 1–3 geometry — F1 12 rings / 10 sectors, F2 18 rings / 16 sectors, F3 12 rings / 10 sectors — and switched the generator to recursive division, so each new wall is one long arc or radial spoke with a single doorway. Story consequence: the long lanes make the ring narrative (§6.7) and the “bamboo slats” / “shockwave” motifs read even better; nothing else changes.

**How to read volatile numbers (Revision 3 rule):** ring counts, sector counts, and dead-end minimums are **tuning**, owned by the map agent, and may change again. `src/content/floors.ts` is the single source of truth for them. The story never depends on an exact count: placements band by thirds of the actual `rings` value (§6.8), and no story string references a ring or sector number. Only the **12 coins**, the **3 carrots**, the **3 optional coins on Floors 4–7**, and the **5×9 ears** are story-load-bearing, and none of those changed.

**The grumblin (accepted in `FRIENDS_PLAN.md`, folded into the story):**

- **What it is in this story:** a small, grumpy mischief-maker that lives in the tower's corridors — comic, harmless, and a little loud. It is the only “bad character” the game needs, and it is never bad, only in the way.
- **What it does:** after a friend successfully marks a dead end, a grumblin may pop up on the friend's way back. The friend is stuck behind it with a “!” — safe, visible, and talking. The door stays sealed: “A friend needs help first!” Sora walks over, the grumblin grumbles, poofs, and flees. The friend says “Phew! Thanks!” and runs back.
- **Why it belongs in this story:** Sora's lie is “a story only counts if you finish it alone.” The grumblin makes helping unavoidable — the climb literally pauses until Sora goes to a friend. It is the same thesis as Floor 6's forge, played for comedy.
- **Pacing (matches `FRIENDS_PLAN.md` and the story's floors):** never on Floor 1 (the tutorial stays clean); a scripted, gentle first encounter on Floor 2 — right where Bo learns strength is shared; from Floor 3 on, the first successful scout of a floor is safe, then encounters are seeded and capped (max one blocked friend, max two per floor).
- **Canon north star:** the gag monsters of the Red Ribbon arc (Muscle Tower's creatures, Pilaf's machines) — comic obstacles, never villains. Keep it original; do not name canon characters.
- **Voice:** it never gets a full sentence on screen. It grumbles (audio), poofs (visual), and flees. All kid-facing lines belong to the friend (“Phew! Thanks!”) and the door (“A friend needs help first!”).
- **Copy ownership:** the grumblin's strings are owned by `FRIENDS_PLAN.md` and are listed in `STORY_COPY_DECK.md` §10 for drift control only.
- **Hard rules:** it never blocks Sora; it never hurts anyone; there is no timer, damage, or lost progress; the friend is always reachable; the hint button always points to it; it never appears on Floor 1; it never appears in the finale (the top of the tower is the dragon's, not the grumblin's).
- **Distinctness:** chalk X (white/cream, floor) = safe to skip; red X (red, door) = locked by the story; grumblin (a small creature in a corridor) = a friend needs help. Three marks, three meanings; they must never look alike.
