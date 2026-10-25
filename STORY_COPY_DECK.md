# Story Copy Deck — Dragon Orb Tower

**Status:** draft for the Phase 1 content pass. No code is wired to these strings yet.
**Canonical:** if this deck and `STORY_PLAN.md` disagree, this deck wins for implementation. Update the plan to match.
**Scope:** all player-facing story strings for the seven floors, prologue, finale, replay, and optional scout banter.
**Rules:** one line per toast; no blocking cutscenes; every line must work when read aloud by one warm narrator.
**Priority:** **P0** = required to understand the story; **P1** = makes the story land; **P2** = polish, cut first.
**Voice flags:** `N` narrator, `S` Sora, `M` Mira, `B` Bo, `P` Pico, `R` Roku, `T` Taro, `V` Nova, `K` Kiko, `G` Grandpa Ren, `H` Hollow Wish, `D` Dragon, `C` child king, `—` text only.
**Max:** approximate word limit, not a hard character count.

---

## 1. Global / prologue / home

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `GLOBAL-CHAPTER` | Intro modal subtitle | P1 | — | 6 | `Chapter {n}: {chapter}` |
| `PROLOGUE-CARD` | First play, before Floor 1 | P0 | N | 35 | “At the foot of the tower, Grandpa Ren gives Sora a glass marble with a four-point star. ‘Bring me back a story.’ Sora promises. The tower door opens.” |
| `PROLOGUE-MARBLE` | Prologue card, second line | P1 | — | 12 | “The marble is warm. It has a four-point star inside.” |
| `HOME-PORCH` | Home screen, first visit | P1 | N | 12 | “Grandpa Ren waits on the porch. The tower has seven dark windows.” |
| `HOME-WINDOW` | Home screen, after a floor | P2 | — | 8 | “A window lights up.” |
| `REPLAY-DRAGON` | Replay, at the top | P1 | D | 12 | “You again. Good. Every telling is a new wish.” |
| `REPLAY-SKIP` | Replay, intro skip | P2 | — | 10 | “The tower remembers. The story begins again.” |

---

## 2. Floor 1 — Mira's Crash Landing

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `F1-CHAPTER` | Intro modal | P1 | — | 4 | “The First Memory” |
| `F1-INTRO` | Floor intro | P0 | N | 32 | “A capsule just crashed into the tower! Mira the inventor is trapped inside. Find her, then reach the 1-star Dragon Orb in the crater's heart.” |
| `F1-ORB-HINT` | Orb hint | P0 | N | 14 | “The 1-star orb glows in the middle of the crater.” |
| `F1-RESCUE` | Rescue toast | P0 | M | 26 | “You found me! I knew you'd come. My capsule hit a story on the way down. This whole floor is a memory.” |
| `F1-MARBLE` | After rescue | P1 | M | 14 | “That marble... it's warm.” / “Grandpa made it. It has a four-point star inside.” |
| `F1-RADAR` | Radar mention | P1 | M | 18 | “My Dragon Radar broke in the crash. Its lens fell somewhere upstairs. We'll find it.” |
| `F1-ORB` | Orb collect | P0 | N | 16 | “The 1-star orb! It's warm. It remembers the very first wish.” |
| `F1-SEALED` | Sealed door | P0 | H | 16 | “The door is sealed. A voice in the wall whispers: ‘A story cannot begin alone.’” |
| `F1-COMPLETE` | Floor complete | P0 | N | 24 | “Floor 1 clear! Mira is safe, and the first orb is yours. The tower's next door creaks open.” |
| `F1-TEASER` | Next-floor button | P1 | N | 16 | “A smell of dumplings drifts down the stairs. Someone is training upstairs.” |
| `F1-SORA-ALONE` | Optional, first rescue | P2 | S | 8 | “Sora. Just Sora. I'm doing this alone.” |

**Floor 1 notes:** no optional echoes. The paper crown, dragon scale, and photo are visual props only; no copy.

---

## 3. Floor 2 — Bo's Dumpling Dojo

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `F2-CHAPTER` | Intro modal | P1 | — | 4 | “The Shared Feast” |
| `F2-INTRO` | Floor intro | P0 | N | 32 | “Bo's dumpling dojo is a maze of steam and chopsticks! Rescue Bo, collect all 12 Dragon Coins, and count them at the door to earn the 2-star orb.” |
| `F2-ORB-HINT` | Orb hint | P0 | N | 14 | “Collect every coin and answer the counting question at the door.” |
| `F2-RESCUE` | Rescue toast | P0 | B | 26 | “Nice moves! I've been training solo so long I forgot how to share a meal. Let's count the dumplings together.” |
| `F2-COIN-FIRST` | First coin | P1 | B | 12 | “Dragon Coin! It smells like a dumpling. One for the feast!” |
| `F2-COIN-NEXT` | Later coin | P1 | B | 8 | “That's {n} for the feast!” |
| `F2-PLACES` | After rescue, optional | P1 | B | 18 | “Twelve places. One for every dumpling. Four are for the next friends.” |
| `F2-SORA-COUNT` | After `F2-PLACES` | P1 | S | 8 | “There are only eight of us.” |
| `F2-DOOR` | Code door | P0 | N | 10 | “How many Dragon Coins did you collect?” |
| `F2-WRONG` | Wrong answer | P1 | B | 12 | “Not quite. Count the empty steamer baskets — one, two...” |
| `F2-ORB` | Orb collect | P0 | N | 18 | “The 2-star orb! It was in the trophy cabinet all along. Bo laughs. ‘I never looked up.’” |
| `F2-SEALED` | Sealed door | P0 | H | 18 | “The dojo gate is sealed. A voice whispers: ‘A strong hero never needs anyone.’ Bo's smile slips.” |
| `F2-COMPLETE` | Floor complete | P0 | N | 18 | “Twelve coins, twelve dumplings, one shared feast. The 2-star orb is yours!” |
| `F2-TEASER` | Next-floor button | P1 | N | 16 | “A carrot rolls down the stairs. Something is hopping in the garden above.” |
| `F2-SORA-LIE` | Optional, after feast | P2 | S | 10 | “I could have done it alone.” / “You could have. It wouldn't have been a feast.” |

---

## 4. Floor 3 — Pico's Bunny Garden

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `F3-CHAPTER` | Intro modal | P1 | — | 5 | “The Sleeping Guardian” |
| `F3-INTRO` | Floor intro | P0 | N | 34 | “Pico's garden grew into a giant bunny maze! Rescue Pico, find the three numbered carrots, and crack the A = 1 code at the gate to earn the 3-star orb.” |
| `F3-ORB-HINT` | Orb hint | P0 | N | 12 | “The 3-star orb is sleeping in the carrot patch.” |
| `F3-RESCUE` | Rescue toast | P0 | P | 18 | “Hmph. Took you long enough. I don't need help... but the carrots do.” |
| `F3-CARROT-2` | Carrot 2 | P1 | P | 16 | “Carrot 2! Bram the baker is free. A = 1, so 2 = B.” |
| `F3-CARROT-21` | Carrot 21 | P1 | P | 16 | “Carrot 21! Uma the drummer is free. 21 = U. Two letters so far.” |
| `F3-CARROT-7` | Carrot 7 | P1 | P | 16 | “Carrot 7! Gus the gardener is free. 7 = G. B... U... G. Bug!” |
| `F3-DOOR` | Code door | P0 | N | 12 | “The ladybug gate asks for the garden's secret word.” |
| `F3-WRONG` | Wrong answer | P1 | P | 14 | “Not quite. 2 is B, 21 is U, 7 is G. Read it again.” |
| `F3-ORB` | Orb collect | P0 | N | 16 | “The 3-star orb! It was sleeping under the carrots. The ladybug gate clicks open.” |
| `F3-SEALED` | Sealed door | P0 | H | 16 | “The garden gate is sealed. A voice whispers: ‘A guardian never rests.’ Pico grips his staff.” |
| `F3-COMPLETE` | Floor complete | P0 | N | 20 | “BUG! The ladybug gate opens. The 3-star orb is yours — and Pico finally sits down.” |
| `F3-TEASER` | Next-floor button | P1 | N | 14 | “Dust falls from the ceiling. Above, a library floats in the clouds.” |
| `F3-SORA-LIE` | Optional, after rescue | P2 | S | 10 | “I know. Neither do I.” |
| `F3-ECHO-2` | Carrot 2, P2 alt | P2 | P | 10 | “Bram's bakery smells like the whole garden.” |
| `F3-ECHO-21` | Carrot 21, P2 alt | P2 | P | 10 | “Uma's drum sounds like a heartbeat.” |
| `F3-ECHO-7` | Carrot 7, P2 alt | P2 | P | 10 | “Gus says the garden missed you.” |

**Floor 3 notes:** the three carrots are the mission, not optional echoes. The P2 echo lines can replace the mission lines only if the mission feedback is moved elsewhere; do not lose the A=1 teaching.

---

## 5. Floor 4 — Roku's Sky Library

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `F4-CHAPTER` | Intro modal | P1 | — | 4 | “The Four-Star Promise” |
| `F4-INTRO` | Floor intro | P0 | N | 26 | “Roku fell asleep in the sky library. Wake him, find the Dragon Radar, and uncover the real 4-star Dragon Orb.” |
| `F4-ORB-HINT` | Orb hint | P0 | N | 16 | “The real 4-star orb is on a pedestal at the end of a winding path.” |
| `F4-RESCUE` | Rescue toast | P0 | R | 30 | “Ah, youth. My back was getting stiff. I knew your grandfather. He climbed this tower once, carrying a wish and the real four-star orb. That marble in your hand is his copy.” |
| `F4-MARBLE` | After rescue | P1 | R | 14 | “The marble is a good copy. The real one is here.” |
| `F4-RADAR` | Radar collect | P0 | N | 18 | “The Dragon Radar! Its lens was lost in Mira's crash. Now the library can show you what you're missing.” |
| `F4-ORB` | Orb collect | P0 | N | 18 | “The real 4-star orb hums. The marble in your pocket answers. It remembers a promise: ‘One more day together.’” |
| `F4-SEALED` | Sealed door | P0 | H | 18 | “The archive door is sealed. The Hollow Wish whispers: ‘Keep the memory. Don't let go.’” |
| `F4-COMPLETE` | Floor complete | P0 | N | 24 | “You carry the memory without letting it carry you. The real 4-star Dragon Orb is yours; the marble stays with you.” |
| `F4-TEASER` | Next-floor button | P1 | N | 16 | “A warm wind smells of sand. Below, a castle is holding back a storm.” |
| `F4-ECHO-ROD` | Coin 1 | P2 | R | 12 | “Grandpa Ren caught a star here once. He threw it back.” |
| `F4-ECHO-PHOTO` | Coin 2 | P2 | R | 12 | “He looks like you, but with worse hair.” |
| `F4-ECHO-CHART` | Coin 3 | P2 | R | 12 | “He drew a line from the tower to home. He always meant to come back.” |
| `F4-ECHO-BONUS` | All 3 coins found | P2 | R | 10 | “He always meant to come back. Now he has.” |
| `F4-SORA-LIE` | Optional, at pedestal | P2 | S | 10 | “If I keep it, I won't lose it.” / “You can keep it and still let it go.” |

---

## 6. Floor 5 — Taro's Sandcastle

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `F5-CHAPTER` | Intro modal | P1 | — | 4 | “The Castle That Cares” |
| `F5-INTRO` | Floor intro | P0 | N | 28 | “Taro's sandcastle is crumbling in a magic sandstorm! Help him, find the Dragon Radar, and dig out the 5-star Dragon Orb.” |
| `F5-ORB-HINT` | Orb hint | P0 | N | 12 | “The 5-star orb is buried in the castle's heart.” |
| `F5-RESCUE` | Rescue toast | P0 | T | 30 | “Whoa! This maze is bigger than my lunchbox. I built these walls to keep the little ones safe... but the storm keeps getting in.” |
| `F5-RADAR` | Radar collect | P0 | N | 18 | “The radar! It was buried in the sandbox. The kids must have been playing treasure hunt.” |
| `F5-ORB` | Orb collect | P0 | N | 18 | “The 5-star orb glows in the castle heart. The storm calms when you hold it.” |
| `F5-SEALED` | Sealed door | P0 | H | 16 | “The drawbridge is sealed. The Hollow Wish howls: ‘A wall can't love you back.’ Taro looks at the children.” |
| `F5-COMPLETE` | Floor complete | P0 | N | 18 | “Taro opens the gate. The children cheer. The 5-star orb is yours!” |
| `F5-TEASER` | Next-floor button | P1 | N | 14 | “Sparks rise through the floor. Above, a forge is hammering stars.” |
| `F5-ECHO-DRAWING` | Coin 1 | P2 | T | 10 | “The drawing says ‘My dad is a castle.’” |
| `F5-ECHO-SWORD` | Coin 2 | P2 | T | 10 | “Someone has been practicing. The blade is covered in teeth marks.” |
| `F5-ECHO-SHELL` | Coin 3 | P2 | T | 10 | “You can hear the sea. Taro says the desert was an ocean once.” |
| `F5-ECHO-BONUS` | All 3 coins found | P2 | T | 10 | “The kids say you're part of the castle now.” |
| `F5-SORA-LIE` | Optional, at gate | P2 | S | 12 | “Let them help.” / “I'm not good at that.” |

---

## 7. Floor 6 — Nova's Star Forge

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `F6-CHAPTER` | Intro modal | P1 | — | 4 | “The Last Smith” |
| `F6-INTRO` | Floor intro | P0 | N | 22 | “Nova's star forge is going cold. Get her out, find the Dragon Radar, and find the 6-star Dragon Orb.” |
| `F6-ORB-HINT` | Orb hint | P0 | N | 14 | “The 6-star orb is the forge's heart, cold at the edge of the star.” |
| `F6-RESCUE` | Rescue toast | P0 | V | 22 | “About time. I already found the exit. ...I just couldn't reach it alone. Don't tell anyone.” |
| `F6-RADAR` | Radar collect | P0 | N | 16 | “The radar? I recalibrated it to ignore the forge's noise. You're welcome.” |
| `F6-ORB` | Orb collect | P0 | N | 16 | “The 6-star orb is the forge's heart. It's been cold for a hundred years.” |
| `F6-HOLD` | Forge relight | P0 | S/V | 18 | “I can hold it.” / “No. You can't. That's not a failure. That's a forge. Together.” |
| `F6-SEALED` | Sealed door | P0 | H | 18 | “The blast door is sealed. The Hollow Wish whispers: ‘Take the star for yourself. You could be the strongest.’ Nova looks away.” |
| `F6-COMPLETE` | Floor complete | P0 | N | 22 | “Nova strikes the anvil. You hold the light together. The forge roars back to life. The 6-star orb is yours.” |
| `F6-TEASER` | Next-floor button | P1 | N | 14 | “The stairs end at a quiet door. Someone has been waiting a very long time.” |
| `F6-ECHO-SCOUTER` | Coin 1 | P2 | V | 12 | “The last reading says ‘power level: 1 friend.’ Nova swears it's broken.” |
| `F6-ECHO-SEAL` | Coin 2 | P2 | V | 10 | “The crest of a star kingdom. Nova's name is on the back.” |
| `F6-ECHO-LETTER` | Coin 3 | P2 | V | 12 | “‘I don't need anyone.’ The ink is smudged where she crossed it out.” |
| `F6-ECHO-BONUS` | All 3 coins found | P2 | V | 10 | “Fine. I admit it. You're on the list of people I need.” |

---

## 8. Floor 7 — Kiko's Wish Room

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `F7-CHAPTER` | Intro modal | P1 | — | 4 | “The Last Story” |
| `F7-INTRO` | Floor intro | P0 | N | 22 | “Kiko is waiting at the top. Rescue her, find the Dragon Radar, and take the 7-star Dragon Orb.” |
| `F7-ORB-HINT` | Orb hint | P0 | N | 12 | “The last orb isn't hidden. It's waiting on the altar.” |
| `F7-RESCUE` | Rescue toast | P0 | K | 30 | “The dragon is waking up! I can feel it! I've been keeping the last wish safe... but I couldn't make it myself. The king was just a kid, you know. He got left alone with a wish that was too big.” |
| `F7-RADAR` | Radar collect | P0 | N | 12 | “The radar points at the altar. The last orb isn't hidden. It's waiting.” |
| `F7-ORB` | Orb collect | P0 | N | 14 | “The 7-star orb! The dragon's heart. Seven stories, one wish. The marble in your pocket is warm.” |
| `F7-SEALED` | Sealed door | P0 | H | 20 | “The dragon's door is sealed. The Hollow Wish sighs: ‘If you end the story, no one will remember. Finish alone. Keep it for yourself.’ Kiko squeezes your hand.” |
| `F7-COMPLETE` | Floor complete | P0 | N | 18 | “The seventh orb is yours. Your friends are with you. The tower trembles — not with fear, but with hope.” |
| `F7-TEASER` | Next-floor button | P1 | N | 8 | “The dragon rises. So do your friends.” |
| `F7-ECHO-CROWN` | Coin 1 | P2 | K | 12 | “It's too small for a king. It looks like a child's paper crown.” |
| `F7-ECHO-DRAWING` | Coin 2 | P2 | K | 12 | “The dragon has seven stars in its heart. The drawing is signed ‘K.’” |
| `F7-ECHO-LETTER` | Coin 3 | P2 | K | 12 | “‘Bring me back a story. Any story. I already have the best one: you.’” |
| `F7-ECHO-BONUS` | All 3 coins found | P2 | K | 12 | “You listened to every story. The tower will remember you.” |
| `F7-SORA-TABLE` | Before the door | P1 | S | 12 | “A story isn't a trophy. It's a table. Everyone gets a seat.” |

---

## 9. Finale — The Wish Room

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `FIN-DRAGON-1` | Dragon rises | P0 | D | 10 | “Seven orbs. Seven friends. One wish. Speak it, little hero.” |
| `FIN-DRAGON-2` | Dragon rises | P0 | D | 24 | “I granted a wish for a story that would never end. I forgot that endings are how stories grow. I have been waiting for someone to help me say goodbye.” |
| `FIN-KIKO` | Dragon rises | P0 | K | 8 | “Whatever you choose, I'll remember it.” |
| `FIN-HOLLOW` | Before the wish | P0 | H | 12 | “Or you could stay. No one would ever have to leave. Finish alone. Keep the story.” |
| `FIN-SORA-TABLE` | Before the wish | P0 | S | 12 | “A story isn't a trophy. It's a table. Everyone gets a seat.” |
| `FIN-ROLL-MIRA` | Roll call | P1 | M | 10 | “I'll build a door that always opens for friends.” |
| `FIN-ROLL-BO` | Roll call | P1 | B | 8 | “I'll save you a seat at the feast.” |
| `FIN-ROLL-PICO` | Roll call | P1 | P | 10 | “I'll rest. Then I'll guard the garden again.” |
| `FIN-ROLL-ROKU` | Roll call | P1 | R | 10 | “I'll keep the stories, but I'll let them grow.” |
| `FIN-ROLL-TARO` | Roll call | P1 | T | 8 | “I'll build with more hands next time.” |
| `FIN-ROLL-NOVA` | Roll call | P1 | V | 8 | “I'll leave the forge door open.” |
| `FIN-ROLL-KIKO` | Roll call | P1 | K | 10 | “I'll keep the wish, but I'll share it.” |
| `FIN-WISH-FEAST` | Wish card | P0 | N | 20 | “The tower smells of dumplings forever.” |
| `FIN-WISH-STARS` | Wish card | P0 | N | 12 | “Every story has a star.” |
| `FIN-WISH-ADVENTURE` | Wish card | P0 | N | 10 | “The tower is always open.” |
| `FIN-WISH-END` | Wish card (fourth) | P0 | N | 12 | “The end is a door, too.” |
| `FIN-WISH-DRAGON` | After any wish | P1 | D | 16 | “Every wish is a door. Some open outward. Some open inward. All of them are real.” |
| `FIN-EPILOGUE-SORA` | Epilogue | P0 | S | 6 | “I brought you a story.” |
| `FIN-EPILOGUE-REN` | Epilogue | P0 | G | 6 | “I knew you would.” |
| `FIN-EPILOGUE-NARRATOR` | Epilogue | P0 | N | 8 | “The end is a door, too.” |
| `FIN-TRUE-KING` | True wish only | P0 | C | 10 | “I only wanted someone to remember me.” |
| `FIN-TRUE-DRAGON` | True wish only | P0 | D | 18 | “I remember you. That was never the problem. The problem was letting you go.” |
| `FIN-TRUE-THANK` | True wish only | P0 | H | 4 | “Thank you.” |
| `FIN-POST-CREDITS` | Post-credits | P2 | D | 6 | “The tower is always open.” |

**Finale notes:** the roll call is P1; if the text budget is tight, keep the seven promises and cut the individual staging lines. The wish cards are P0. The true-wish child scene is P0 when the fourth wish is implemented.

---

## 10. Scout banter (optional, P2)

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `SCOUT-MIRA` | Dead end | P2 | M | 8 | “Dead end. I could invent a sign.” |
| `SCOUT-BO` | Dead end | P2 | B | 8 | “Nothing here. ...Is it lunchtime?” |
| `SCOUT-PICO` | Dead end | P2 | P | 8 | “Hmph. I could have told you.” |
| `SCOUT-ROKU` | Dead end | P2 | R | 8 | “Ah, the scenic route.” |
| `SCOUT-TARO` | Dead end | P2 | T | 8 | “Oops. Sorry, little path.” |
| `SCOUT-NOVA` | Dead end | P2 | V | 6 | “Obviously a dead end.” |
| `SCOUT-KIKO` | Dead end | P2 | K | 6 | “My whiskers say no.” |

**Rules:** one line per dead end; no new mechanics; the friends' chalk X is white/cream on the floor, the Hollow Wish's seal is red on the door.

---

## 11. Replay / story so far (P1)

| ID | Trigger | Pri | Voice | Max | Text |
|---|---|---|---|---|---|
| `RECAP-F1` | Replay card | P1 | N | 10 | “Mira crashed; you found the first orb.” |
| `RECAP-F2` | Replay card | P1 | N | 10 | “Bo set the table; you counted twelve.” |
| `RECAP-F3` | Replay card | P1 | N | 10 | “Pico rested; the garden opened.” |
| `RECAP-F4` | Replay card | P1 | N | 10 | “Roku kept the real star; you kept the marble.” |
| `RECAP-F5` | Replay card | P1 | N | 10 | “Taro let the children help; the storm broke.” |
| `RECAP-F6` | Replay card | P1 | N | 10 | “Nova left the forge door open.” |
| `RECAP-F7` | Replay card | P1 | N | 10 | “Kiko shared the last wish.” |

---

## 12. Voice and localization notes

- **Current voice:** `speak(text, enabled)` is fixed `en-US`, rate 0.92, pitch 1.08. P0 uses the narrator for intro/rescue/completion; toasts stay text-only.
- **Per-character voices:** a later `speakAs` layer. Do not block the content pass on it. Text and visuals must carry the story without voice differences.
- **Pronunciation:** Sora (SOR-ah), Mira (MEER-ah), Bo (BOH), Pico (PEE-koh), Roku (ROH-koo), Taro (TAH-roh), Nova (NOH-vah), Kiko (KEE-koh), Ren (REN), Long (LONG).
- **A = 1:** English uses **BUG** (Bram 2, Uma 21, Gus 7). Do not machine-translate the code word. For non-English locales, use the symbol code (★, ●, ▲) or author a locale-specific word and matching carrot numbers. Mark P2; English ships first.
- **Text expansion:** German/French/Spanish strings can be 30–40% longer. Test the longest intro, sealed-door line, and wish card at the smallest width.
- **No audio-only information:** every story beat has a visual cue in the map.

---

## 13. Current-string diff (implementation map)

| Current field | Current use | Deck change | Phase |
|---|---|---|---|
| `FloorStory.intro` | Intro modal | Replace with `F*-INTRO` | 1 |
| `FloorStory.orbHint` | Orb hint | Replace with `F*-ORB-HINT` | 1 |
| `Character.greeting` | Rescue toast and completion modal | Split: `greeting` = `F*-RESCUE`, `completeLine` = `F*-COMPLETE` | 2 |
| `completeTitle` | Computed in `PlayScreen` | Keep; add `completeLine` | 2 |
| *(new)* `FloorStory.soraLine` | Optional Sora beat | `F*-SORA-*` / `F*-PLACES` / `F*-MARBLE` / `F*-HOLD` / `F7-SORA-TABLE` | 2 |
| *(new)* `FloorStory.echoes` | Story lines per collectible | `F*-ECHO-*` (+ `F*-CARROT-*` on Floor 3) | 3 |
| `friend.name` | UI | Keep; no change | — |
| `WISHES` | Three finale cards | Add `FIN-WISH-END` later; keep all three | 5 |
| `SaveData` | v1 | v2 merged schema (`rescuedFriends`, `settings.friendHelp`, `seenScoutTutorial`, `echoes`) | 3 |
| `speak(text, enabled)` | Fixed en-US | Optional `lang` / `speakAs` later | 3+ |

**Do not change:** `Character.id`, character colors, `FloorConfig` fields, ring counts, mission logic, item placement, or the generator.

**Known current-config facts this deck follows:**
- Floor 2 has **12** coins (`coinCount: 12`), not 8. The earlier story draft said 8; this deck uses 12.
- Floor 2 has **15** rings; Floor 3 has **10** rings.
- Floor 3 uses the `A = 1` code word **BUG** with carrots 2, 21, 7.
- Floors 4–7 have 3 optional coins each; plus Floor 3's 3 mandatory carrot lines = **15** total story lines. Only the 12 coin echoes are optional pickups; the carrots are mission progress.
- Floor 1 has no optional echoes.
