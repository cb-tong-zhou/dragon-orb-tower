# Friends Who Scout — Design & Implementation Plan

**Status:** implemented and merged — Phase 1 engine, Phase 2 UI (party bar, marks, overlays), grumblin blocks, and auto/manual scouting are live behind `FRIENDS_SCOUTING`/`GREMLIN_BLOCKS` (both on), integrated with the redesigned map.
**Date:** 2026-10-24
**Revision:** 2026-10-24 — added grumblin blocks on the scouting return path
**Scope:** the rescued characters inside *Dragon Orb Tower* (Mira, Bo, Pico, Roku, Taro, Nova, Kiko)

> If by "friends" you mean real-world or online friends (accounts, remote co-op, invites), that is a different feature. It needs a backend, identity, moderation, and a child-privacy review, which conflicts with the current "no accounts, no backend, local-only save" design. This plan is for the in-game friends the player rescues.

---

## 1. One-paragraph summary

Rescued friends become a persistent party. At a junction, the player can send a friend down one corridor, or a friend can volunteer automatically. The friend walks the corridor **at the same time** the player is free to keep moving, and if the corridor is a true dead end, the friend leaves a chalk **X** and a faint dotted trail on the map, then returns to the party. Friends never collect items, open doors, or solve the route. Each friend can help once per floor (max three helpers), so the feature removes wasted backtracking without turning the maze into a solved line.

A successful scout can also attract a **grumblin**, a harmless grumpy mischief-maker that blocks the friend's way back. The dead-end mark is already earned. Sora must walk over and shoo the grumblin; the friend is never hurt, and the door waits until every friend is free. This adds a small rescue beat and makes scouting feel like a team adventure instead of a free map reveal.

The renderer only needs a new overlay, a party token list, and a gremlin token; it does not need new maze geometry.

---

## 2. Why this fits the existing game

| Current fact | Opportunity |
| --- | --- |
| One friend is rescued per floor (`config.friendId`) and follows Sora via one `followerCell`. | Generalize the single follower into a small party, then give party members a job. |
| The maze is a perfect maze (`braid: 0`) with 16+ dead ends per floor. | Dead ends are the main source of wasted walking; marking a few is genuinely useful. |
| Floors are large (hundreds of cells) and regenerate on every run. | A per-run scout state is enough; nothing needs to persist except the rescued roster. |
| Missions are "rescue, collect, count, decode, find radar". | Friends must not collect, count, or decode; they can only mark topology. This keeps every learning beat intact. |
| The game has no fail state and no timers. | Scouting must be optional, usually recallable, and never punish a wrong choice; a grumblin block is a short rescue beat, not a fail. |
| The map is being redesigned. | Scouting and grumblins need only cell IDs and cell centers. They should be separate SVG layers, not a change to wall or portal drawing. |
| Save data is version 1 with `completed` only. | Add a version 2 save with a rescued-friends roster and a help setting, with an inference-based migration. |

**Value estimate:** on a floor with 20+ dead ends, the player might walk 5–10 wrong branches. Three helper marks save roughly 30–60 taps and two to four minutes of frustration for a 5–8 year old, while still leaving the majority of the maze to explore. A grumblin rescue adds a short, telegraphed walk; the target is that the net time is still lower than without helpers.

---

## 3. Player experience

### 3.1 The fantasy

> "My friends are here now. They can run ahead and check the paths while I keep walking."

The friends should feel like a small team, not a hint button. The child sees them physically leave the line, walk a corridor, chalk an X, and run back.

### 3.2 First-time flow

1. Sora reaches the trapped friend's chamber. The friend is rescued, joins the party line, and gets one "helper" charge.
2. A short tutorial (floor 1 only) says: **"Mira can check one path for you. Tap Mira, then tap a path."**
3. The player reaches a fork. The party bar shows Mira with a chalk-star badge.
4. The player taps Mira, then taps a corridor. The route highlights; Mira walks it while Sora stays free to move.
5. If it is a dead end, Mira stamps a chalk **X** at the end and a faint dotted trail back to the fork. A soft chalk sound plays. Mira returns.
6. If the corridor reaches another fork, Mira comes back with no mark and says, "That way keeps going!" (No dead-end mark, no spoiler.)
7. The charge is reserved when the friend leaves and committed only when a dead end is actually marked. If no mark was made, the charge is refunded.

### 3.3 Modes

| Mode | Behavior | Default |
| --- | --- | --- |
| **Auto** | When Sora stops at a new junction, one available friend volunteers after a short pause and checks the shortest adjacent corridor that has not been checked at that junction. The child can recall the friend unless a grumblin is blocking them. | Yes for ages 5–8 |
| **Manual** | The player taps a friend, then taps a branch. Up to two friends may scout different branches at once. | Available always |
| **Off** | Friends still follow, but never scout. Classic maze behavior. | Setting option |

Auto mode should feel like a friend volunteering, not the game taking over. It only fires once per junction arrival, only when the player is stationary, and only if the child has not already moved.

### 3.4 What friends will and will not do

**Will:**
- Walk through corridors, including corridors that contain collectibles.
- Mark a corridor as a dead end only when it truly terminates at a normal/ear leaf.
- Return to the party after marking.
- Be recalled by tapping them, unless a grumblin is blocking them.

**Will not:**
- Collect coins, carrots, the radar, or the orb.
- Rescue the trapped friend.
- Open the exit door or trigger the counting/code lock.
- Mark a portal (start/exit/chamber) as a dead end.
- Reveal the hidden orb token before the radar is found.
- Reveal the whole maze or choose the route for the player.

### 3.5 A deliberate non-spoiler

The hidden orb cell may be a dead end. A friend can walk that corridor and mark it as a dead end, but the orb token remains invisible until the radar is found. This is **not** a leak: the child learns "this path is a dead end", not "the orb is here". When the radar is collected, the orb appears in an already-marked dead end, which is a nice payoff for scouting rather than a shortcut.

### 3.6 What the player still does

- Chooses every junction.
- Walks to every item.
- Collects every mission item.
- Opens every door.
- Counts, decodes, and finds the radar.

That is the line that keeps the game a game.

### 3.7 When a friend gets blocked

A successful scout can attract a **grumblin** — the tower's harmless "bad character" — a small, grumpy mischief-maker that plants itself in the corridor on the friend's way back. The dead-end X is already on the map. The friend is not hurt, just stuck behind the grumblin.

1. The friend marks the dead end and turns back.
2. A grumblin pops up 1–3 cells down the corridor, between the friend and the fork. The friend stops with a **"!"** bubble; the party bar shows **Help Mira!**
3. The player walks to the grumblin's cell, or an adjacent cell. It grumbles, disappears in a puff of smoke, and runs away. Sora never fights it.
4. The friend says **"Phew! Thanks!"** and runs back to the party. The dead-end mark stays.
5. Until the friend is free, the exit door stays sealed: **"A friend needs help first!"** The hint button points to the grumblin. No timer, no damage, no lost progress.

Floor 1 never spawns a grumblin (it teaches scouting). The first eligible successful scout on floor 2 is a gentle scripted encounter. From floor 3 onward, the first successful scout of a floor is safe; after that, encounters are seeded and capped. This makes the mechanic a friendly rescue beat, not a punishment for exploring.

---

## 4. Rules and tuning

| Rule | Default | Why |
| --- | --- | --- |
| Scout target | One corridor from the current junction to the next junction, leaf, or portal | Precise: a dead-end mark is only applied when the corridor has no intermediate junction. |
| Maximum steps per scout | 24 cells | Prevents a friend from crossing most of the maze on one charge. |
| Junction hops | 0 in MVP (stop at first junction) | Keeps every mark truthful. A later tuning option may allow one hop, but must mark only the final corridor, not the stem. |
| Charges | 1 per active friend per floor, cap 3 | Scales with the party and keeps the helper scarce. |
| Refund | Charge returns if no dead end is marked | No punishment for exploring a corridor that keeps going. |
| Active scouts | 2 at once | Delivers the "team splits up" fantasy without visual chaos. |
| Visible party | 3 friends maximum | Keeps the maze readable on tablets; the party bar can show the full roster. |
| Auto delay | 1.2 s after stopping at a new junction | Gives the child time to act first; cancels if they move. |
| Auto target | Shortest adjacent unchecked corridor | Likely to find a short dead end, but does not consult the dead-end list. |
| Marks persist | For the current run only | Fresh maze on every visit; no stale marks. |
| Marking the hidden orb dead end | Allowed | The orb stays hidden; see 3.5. |
| Marking a portal leaf | Never | A door or chamber is not a false trail. |
| Friends stepping on items | Allowed, but no pickup | Collection is still driven only by `playerCell`. |
| Grumblin encounter trigger | Only after a successful dead-end mark, on the return leg | The player always gets the mark; the block is a cost of success, not a wasted scout. |
| First scout safe | On floors 3+, no encounter on the first successful scout of the floor | Gives a safe first scout before the twist. |
| Tutorial encounter | First eligible successful scout on floor 2 | Introduces the grumblin with a short, controlled rescue. |
| Encounter chance | 30% after the tutorial, seeded | Predictable for tests, surprising for players. |
| Encounter caps | Max 1 blocked friend at a time; max 2 per floor | Keeps the map readable and the rescue from becoming a chore. |
| Blocked friend | Cannot be recalled; scouting pauses | The player must go help; no remote escape. |
| Rescue trigger | Sora enters the grumblin's cell or an adjacent cell through an open edge | Forgiving on touch, but never through a wall. |
| Door while blocked | Sealed; toast and hint point to the friend | Keeps the "everyone safe" promise without a fail state. |
| Hint priority | Blocked friend first, then mission goals | The child always knows what to do next. |
| Grumblin behavior | Never blocks Sora, never hurts anyone, flees when Sora arrives | Comedy, not combat. |

### Why a blocked friend is not a fail state

- The friend is safe, visible, and talking; nothing bad happens to them.
- The dead-end mark is already earned before the block.
- Sora can always reach the grumblin; it never blocks Sora's path.
- There is no timer, health bar, damage, or item loss.
- The hint button always points to the blocked friend.
- The door waits; progress is not lost. The walk to help is the only cost.

### Why this does not solve the maze

- A dispatch explores **one corridor**, not a subtree.
- A corridor that reaches another junction produces **no mark**.
- At most **three** dead ends can be marked on a floor with 16–30+ dead ends.
- The player still has to choose at every remaining junction and walk to every item.
- Auto mode only offers one check per junction arrival and never retries a checked branch.

The helper should feel like a friend saying, "I checked that one, it's a dead end", not like a map hack.

---

## 5. Interaction specification

### 5.1 Manual scouting

```
Player at a junction, at least one friend has a charge
  -> tap friend avatar in the party bar
  -> scout mode: that avatar gets a ring; eligible branch starts pulse
  -> tap any cell in an eligible branch
  -> friend leaves the party line and walks the corridor
  -> player may keep walking, tap Hint, or send a second friend
  -> friend reaches leaf: chalk X pop + soft sound + optional voice line
  -> friend returns (2x walk speed; catches up to the player)
```

Cancel paths:
- Tap the selected avatar again.
- Tap Sora.
- Tap empty space outside the maze.
- Open a modal, complete the floor, or press Escape.

If the tapped cell is deeper in the branch, use the first step from the player's cell toward that cell. This is forgiving on touch. If the tap is outside every highlighted branch, ignore it and stay in scout mode rather than moving Sora by accident.

### 5.2 Auto scouting

```
Player stops at a junction (not moving, no modal)
  -> 1.2 s pause
  -> if mode is auto, a friend has a charge, and this junction has an unchecked adjacent corridor
  -> friend volunteers; one scout at a time in auto mode
  -> if the player moves first, the pending offer is cancelled
```

The auto policy should never call `deadEnds(level)` to choose a target. It walks the corridors like the friend would. It may use `openDegree` locally when it arrives at a cell.

### 5.3 Recall and collisions

- Tapping the scouting friend's avatar in the party bar recalls them, unless a grumblin is blocking them. If they had already marked a dead end, the mark stays; the charge stays spent. The map token itself can remain non-interactive to avoid competing with cell taps.
- Recalling before a mark refunds the charge.
- Two friends cannot scout the same corridor at the same time.
- A friend cannot scout a corridor already marked dead.
- If the player enters a corridor being scouted, the friend finishes or returns; no collision logic, no player-blocking.
- If the player moves far away while a friend is returning, the friend does a short "catch-up" hop after the return animation rather than walking the entire maze back.

### 5.4 Party line

- Party order is rescue order, newest friend closest to Sora or at the tail (decide visually with the map redesign).
- On each player step, each following friend takes the previous cell of the friend ahead (the current single-follower behavior, generalized).
- Scouting or blocked friends are removed from the conga line until they return.
- If two friends share a cell, offset them radially, as the current `followerSpot` logic already does for one.
- Render at most three followers; extra rescued friends live in the party bar.

### 5.5 Party bar

- A new `PartyBar` outside the SVG (below the maze, above the footer, or a compact rail).
- Shows every rescued friend; the active three are highlighted.
- Each active friend shows a chalk-star badge when their charge is available, a faded badge when used.
- Shows "2 helpers ready" for pre-readers via icons, not text alone.
- 44 px minimum touch targets.
- The bar must not cover the maze, the hint button, or the mission bar. Final placement should be agreed with the map redesign.
- A blocked friend's avatar pulses amber and shows a **"!"** badge with the label "Mira needs help".

### 5.6 Blocked friend rescue

```
friend marks a dead end
  -> return leg
  -> seeded encounter roll (floor 1 none; floor 2 tutorial; floors 3+ first scout safe)
  -> grumblin spawns 1-3 cells from the friend, between friend and fork
  -> friend mode = blocked; "!" marker; party bar alert
  -> scouting pauses; door sealed; hint targets the grumblin
  -> Sora enters the grumblin's cell or an adjacent cell through an open edge
  -> grumblin poofs; friend mode = return; friend runs back
  -> door can open again
```

- The grumblin is not a wall. It only blocks the friend it cornered; Sora and other friends pass freely.
- The spawn cell is always at least two cells from Sora and 1-3 cells from the leaf. If no valid cell exists (short corridor or Sora too close), skip the encounter.
- The charge stays spent because the dead-end mark was earned; the block never costs an extra charge.
- Tapping a blocked friend's avatar shows "Mira needs help!" and draws the hint path; it does not recall.
- Auto-scout and manual dispatch pause while a friend is blocked. Any friend already mid-scout finishes their corridor and returns. Walking, collecting, hints, and the map all remain available.
- No grumblin spawns while a tutorial, lock, or completion modal is open; the roll waits until play resumes.
- If Sora reaches the exit while a friend is blocked, the door stays sealed with the blocked-friend message.
- The completion modal cannot open while a friend is blocked.
- If the player leaves the floor or resets progress, the encounter disappears with the run; nothing is saved.

---

## 6. Architecture

### 6.1 New pure modules

| File | Responsibility |
| --- | --- |
| `src/game/friends.ts` | Roster from save, active-party window, rescue-order helpers, add/remove friend. |
| `src/game/scouting.ts` | Corridor traversal, leaf classification, auto-target choice, mark creation. Pure functions over `Level` + graph helpers. |
| `src/game/encounters.ts` | Seeded grumblin roll, valid spawn-cell choice (`bfsDistances`), encounter caps, rescue proximity. Pure functions; uses `makeRng`/`pick` from `generator/rng.ts`. |
| `src/game/useScoutDirector.ts` | React hook: party positions, scout state machine, blocked state, one timer, charge accounting, mark list, gremlin state, callbacks. |
| `src/components/PartyBar.tsx` | Avatar strip, charge badges, blocked alert, manual selection. |
| `src/components/ScoutLayer.tsx` | SVG overlay: dotted trails, chalk X, optional pulse on eligible branches. |
| `src/components/GremlinLayer.tsx` | SVG overlay: grumblin token, blocked-friend alert, rescue pulse. |
| `src/components/mazeTypes.ts` | Shared `PartyToken` (characterId, cellId, slot, mode, hasCharge, blockedBy), `ScoutMark`, `ScoutHighlight`, `GremlinToken` contracts. |
| `src/game/features.ts` | `FRIENDS_SCOUTING` and `GREMLIN_BLOCKS` flags, default off until the map lands. |

### 6.2 Proposed data model (not implemented)

```ts
export interface PartyMember {
  characterId: string;
  cellId: number;
  slot: number;                 // 0 = closest to Sora
  mode: "follow" | "scout" | "return" | "blocked";
  hasCharge: boolean;           // one scout per friend per floor
  scoutPath: number[];          // cells, including the starting cell
  scoutIndex: number;
  markId?: string;
  blockedBy?: string;           // gremlin id while blocked
}

export interface ScoutMark {
  id: string;
  friendId: string;
  cells: number[];              // corridor from junction to dead-end leaf
  deadEndCellId: number;
  kind: "dead-end";
  createdAt: number;
}

export interface ScoutHighlight {
  friendId: string;
  targets: number[];            // first cell of each eligible adjacent corridor
}

export interface GremlinToken {
  id: string;
  cellId: number;
  blockedFriendId: string;
  state: "waiting" | "fleeing";
}
```

```ts
// Maze props addition, after the redesign
party?: PartyToken[];
scoutMarks?: ScoutMark[];
scoutHighlight?: ScoutHighlight | null;
gremlins?: GremlinToken[];
```

Keep `followerCell` as an optional backwards-compatible prop during the transition. If `party` is present, ignore `followerCell`. Keep `data-follower-token` as an alias for the first party member so existing visual scripts do not break.

### 6.3 Scout state machine

```
follow
  --sendScout--> scout
  --rescue? no--> (unchanged)

scout
  --advance to leaf--> mark --> return
  --advance to junction/portal--> return (refund)
  --max steps--> return (refund)
  --recall--> return (refund if no mark)

return (mark made)
  --seeded encounter roll--> blocked
  --reaches player / catch-up--> follow

return (no mark)
  --reaches player / catch-up--> follow

blocked
  --Sora enters gremlin cell / adjacent--> return
```

One interval drives all active scouts (~110 ms per cell, matching the existing walk cadence). No per-frame React updates; the hook commits a snapshot per tick. At most two scouts are active, so re-render cost is bounded.

The encounter roll happens once, at the start of the return leg after a successful dead-end mark. The friend's cell and the remaining return path are preserved while blocked. When Sora frees the friend, the return resumes from the current cell.

### 6.4 Corridor traversal

```ts
function traverseCorridor(level, from, first, maxSteps) {
  const path = [from, first];
  let previous = from;
  let current = first;

  for (let step = 1; step < maxSteps; step++) {
    const cell = level.cells[current];

    if (isPortal(cell)) {
      return { path, ending: "portal" };
    }

    const neighbors = openNeighbors(level, current).filter((id) => id !== previous);

    if (neighbors.length === 0) {
      return { path, ending: "dead-end" };
    }

    if (neighbors.length >= 2) {
      return { path, ending: "junction" };
    }

    previous = current;
    current = neighbors[0];
    path.push(current);
  }

  return { path, ending: "too-far" };
}
```

- `isPortal(cell)` is the existing kind check: `start`, `exit`, or `chamber`.
- `dead-end` is markable only if `cell.kind === "normal" || cell.kind === "ear"`.
- `junction`, `portal`, and `too-far` return the friend without a mark and with a refund.
- The friend learns the leaf by arriving. The engine never precomputes the full dead-end list to decide what to mark; `deadEnds()` is useful in tests, not in the runtime policy.

### 6.5 Auto target choice

```ts
function chooseAutoTarget(level, from, checkedBranches, lastCell) {
  const branches = openNeighbors(level, from)
    .filter((id) => id !== lastCell)
    .filter((id) => !checkedBranches.has(`${from}:${id}`));

  // Walk each branch to its end to measure length, but do not classify
  // "dead" vs "junction" for the choice. Shortest first is a friendly
  // heuristic, not an oracle.
  return branches
    .map((id) => ({ id, length: traverseCorridor(level, from, id, MAX_STEPS).path.length }))
    .sort((a, b) => a.length - b.length)[0]?.id ?? null;
}
```

If the chosen branch ends in a junction, mark it as "checked" at this junction so auto does not retry it. The player can still choose it manually.

### 6.6 Encounter roll and placement

```ts
function planEncounter(
  level: Level,
  friend: PartyMember,
  mark: ScoutMark,
  playerCell: number,
  successfulScoutCount: number, // dead-end marks on this floor, including this one
  encountersThisFloor: number,  // grumblins already spawned on this floor
  rng: Rng,
): GremlinToken | null {
  if (level.floor === 1) return null;
  if (encountersThisFloor >= MAX_ENCOUNTERS_PER_FLOOR) return null;
  if (activeBlockCount >= MAX_BLOCKED_AT_ONCE) return null;

  const isFirstScout = successfulScoutCount === 1;
  const tutorial = level.floor === 2 && encountersThisFloor === 0;
  const firstScoutSafe = level.floor >= 3 && isFirstScout;

  if (!tutorial) {
    if (firstScoutSafe) return null;
    if (rng() >= ENCOUNTER_CHANCE) return null;
  }

  // mark.cells runs junction -> leaf. Reverse to get leaf -> junction.
  const returnPath = [...mark.cells].reverse();
  const playerDistances = bfsDistances(level, playerCell);
  const valid = returnPath
    .slice(1, Math.min(4, returnPath.length - 1)) // 1-3 cells from the friend; never the fork
    .filter((cellId) => playerDistances[cellId] >= 2)
    .filter((cellId) => {
      const kind = level.cells[cellId]?.kind;
      return kind === "normal" || kind === "ear";
    });

  if (valid.length === 0) return null;

  const index = Math.floor(rng() * valid.length);
  return {
    id: `gremlin-${friend.characterId}-${mark.deadEndCellId}`,
    cellId: valid[index],
    blockedFriendId: friend.characterId,
    state: "waiting",
  };
}
```

- Build the RNG with `makeRng(level.seed, "gremlin:" + friend.characterId + ":" + mark.deadEndCellId + ":" + successfulScoutCount)` and pick the spawn cell with `pick(valid, rng)`. This makes tests reproducible and keeps a run internally consistent; do not use `Math.random()`.
- `MAX_ENCOUNTERS_PER_FLOOR = 2`, `MAX_BLOCKED_AT_ONCE = 1`, `ENCOUNTER_CHANCE = 0.3`.
- Track `successfulScoutCount` per floor as the number of dead-end marks including the current one; the first mark passes `1`. Track `encountersThisFloor` and increment it only when a grumblin actually spawns. `activeBlockCount` counts gremlins in state `"waiting"` only.
- Floor 1 has encounters disabled. Floor 2's first eligible successful scout is a guaranteed tutorial encounter. On floors 3+, the first successful scout of the floor is safe. After that, the roll uses `ENCOUNTER_CHANCE`.
- If the floor-2 tutorial has no valid spawn, the next eligible successful scout remains the tutorial until one spawns.
- The spawn cell is always at least two cells from Sora. If no valid spawn cell exists, skip the encounter.
- The grumblin never occupies a portal cell, a leaf, or the fork at the start of the corridor.

---

## 7. Integration with the map redesign

### 7.1 Contract for the map agent

No action is needed now. When the redesign is ready, please confirm:

1. `Level.cells[].cx/cy` is still the cell-center contract.
2. `Maze` can accept optional `scoutMarks`, `party`, and `gremlins` props, or expose stable overlay slots inside the same `<svg>`.
3. `data-player-token`, `data-player-cell`, `data-cell-id`, and `data-cell-kind` remain.
4. The maze still renders a token group above the wall layer, so scout and gremlin overlays can sit between walls and tokens.
5. The map component still uses the `Level` type (or provides an adapter).

The scouting and gremlin layers do not need wall geometry, portal shapes, ring counts, or bunny-ear outlines. They only draw polylines through `cell.cx/cy`, an X at a cell center, and small tokens at cell centers. The grumblin is **not** a wall or a collision object; it is a token.

### 7.2 Where the overlay goes

```tsx
<svg className="maze-svg" viewBox={viewBox}>
  {/* walls, paper, portals — owned by the map redesign */}
  <ScoutLayer marks={scoutMarks} cells={level.cells} />
  {/* collectibles */}
  <GremlinLayer gremlins={gremlins} party={party} cells={level.cells} />
  {/* party tokens, player token */}
  {/* hit targets */}
</svg>
```

- `ScoutLayer` and `GremlinLayer` have `pointerEvents="none"`.
- Trail: dashed polyline, ink at ~0.22 opacity, round caps, `vectorEffect="non-scaling-stroke"`.
- X: two short strokes in a small circle, friend accent color, ink outline, 300 ms pop.
- Highlight for manual mode: reuse the existing move-dot visual language, but a different shape/pulse so it does not read as "tap to walk".
- Grumblin: small plum puff with a "grr" bubble at `cellId`; blocked friend gets an amber **"!"** bubble. Put `data-gremlin-cell` on the grumblin token and `data-blocked-friend` on the blocked friend's token.
- Stable e2e hooks: mark group `data-scout-mark` + `data-scout-dead-end`; party token `data-party-member` + `data-party-charge`; party bar button `data-party-member` + `data-party-blocked`; blocked alert `data-blocked-friend`; gremlin `data-gremlin-cell`.
- Do not add labels inside the maze; the party bar and voice carry the text.

### 7.3 Merge order

1. **Map redesign lands.** Freeze the `Level`/`Cell` contract.
2. **Phase 1 (safe pre-work, no Maze edits):** pure `scouting.ts` + `encounters.ts` + `friends.ts` + save v2 migration + tests, feature flag off.
3. **Phase 2 (small Maze patch):** `mazeTypes.ts`, `ScoutLayer`, party tokens, prop wiring; coordinate one commit with the map agent.
4. **PlayScreen wiring:** hook, manual mode, party bar, toasts.
5. **Grumblin integration:** `GremlinLayer`, blocked state, rescue proximity, door gate, hint priority; coordinate one more small overlay commit.
6. **Auto mode + polish:** settings, voice, reduced motion, character mark styles.
7. **Playtest + tuning.**

If the redesign slips, Phase 1 can still ship invisibly behind the flag. Do not build a separate absolutely-positioned overlay on top of the old maze; it will drift from the new viewBox and scaling.

---

## 8. Save data and progression

### 8.1 Version 2 schema

```ts
interface SaveDataV2 {
  version: 2;
  completed: number;
  settings: Settings & {
    friendHelp: "auto" | "manual" | "off";
  };
  seenTutorial: boolean;
  rescuedFriends: string[];       // character IDs, rescue order
  seenScoutTutorial: boolean;
}
```

The default v2 save has `completed: 0`, `rescuedFriends: []`, `friendHelp: "auto"`, and `seenScoutTutorial: false`.

### 8.2 Migration from v1

- Add `STORAGE_KEY_V2 = "dragon-orb-tower-save-v2"`. `loadSave` tries v2 first, then the existing v1 key. If it reads v1, migrate in memory and write v2 on the next save. Keep the v1 key read-only so a rollback can still read it. `clearSave` clears both keys.
- If `rescuedFriends` is missing, infer it from completed floors:
  `FLOORS.slice(0, completed).map((story) => story.config.friendId)`.
- If `rescuedFriends` is present, union it with the inferred list so a partially written save does not lose friends. Dedupe and preserve rescue order.
- Filter out unknown character IDs.
- Default `settings.friendHelp` to `"auto"`.
- Keep the existing `completed` clamp (0–7).
- If storage is unavailable, fall back to a fresh v2 save; the game must still work.

### 8.3 Roster rules

- Completing a floor adds `config.friendId` idempotently. The completion path (`App.tsx` `onComplete` / `PlayScreen` `finishFloor`) calls `addRescuedFriend` and persists the v2 save; Phase 1 provides the pure helper and tests, Phase 2 wires it.
- The current floor's friend is **not** in the party until rescued, even on a replay.
- Other rescued friends are available on replay.
- Active party = up to three most recently rescued available friends. The current floor's friend joins when rescued and may push the oldest friend to the party bar.
- Full roster is shown in the party bar; the active three follow and can scout.
- Future option: let the player choose the active three on the tower screen. Not MVP.

### 8.4 Why marks and grumblins are not saved

The maze is regenerated on every visit, so saved marks would be meaningless and could reveal a future layout. Marks and grumblin encounters live in `useScoutDirector` for the lifetime of `PlayScreen` and reset on replay. Leaving the floor abandons the encounter; nothing about the block is persisted.

---

## 9. Visual and audio language

### 9.1 Dead-end mark

- **Trail:** dotted line through the scouted corridor, low-contrast ink.
- **X:** chalk X at the leaf, with a friend-accent halo; a small circle keeps it readable on busy backgrounds.
- **Animation:** stamp pop (scale 0.8 → 1.05 → 1) over ~300 ms.
- **Reduced motion:** no pop; draw the mark immediately.
- **Persistence:** until the floor ends.

### 9.2 Party tokens

- Existing `AvatarGlyph` inside a paper circle, same visual weight as the player token.
- Slightly smaller than Sora (0.7–0.8×) so the player remains the hero.
- Scouting friend gets a thin dashed ring and a small "walking" bob.
- Returning friend moves at 2× speed; optionally a small dust puff.
- If three friends share a cell, offset them around the player with fixed slots, not physics.

### 9.3 Audio

- Soft chalk scratch when the X appears.
- Friendly line on a dead end: "Nobody there!" / "That one's a dead end!"
- Neutral line on a junction: "That way keeps going!"
- No error sound, no sad trombone. A dead end is information, not failure.
- Respect `settings.voice` and `settings.sound`. One voice line per mark, with a cooldown so three friends do not talk over each other.

### 9.4 Accessibility

- X shape + dotted trail + badge, never color alone.
- Party avatars are real buttons with labels: "Send Mira to check a path".
- Scout mode announces via `aria-live`: "Choose a path for Mira."
- Mark group has an accessible label: "Mira marked a dead end."
- Keyboard: party bar is tabbable; maze cells need a keyboard path if the redesign supports it. If not, the manual scout mode should offer a list of branch choices as buttons.
- 44 px touch targets in the party bar.
- Reduced motion disables bob/pop, not position updates.
- Big-maze mode must not hide the party bar or the recall control.
- A blocked friend's alert is announced: "Mira is blocked. Go help her!" The grumblin has an accessible label and is not focusable.

### 9.5 Grumblins and blocked friends

- **Working name:** Grumblin. Final name/art can change without touching the logic. The code uses `Gremlin*` as the internal name (for example `GremlinToken`, `GremlinLayer`, `GREMLIN_BLOCKS`); kid-facing copy says "grumblin".
- **Look:** a small plum-colored round puff with big grumpy eyebrows, tiny feet, and a **"grr"** speech bubble. No weapons, no sharp teeth, no scary eyes. It should read as a grumpy cartoon, not a threat.
- **Blocked friend:** the friend's token gets an amber **"!"** bubble and a slow pulse; the party bar avatar pulses amber. The friend is visibly waiting, not hurt.
- **Rescue:** when Sora arrives, the grumblin does a comedic **poof** and scampers off-screen. No hit, no defeat animation, no loot.
- **Audio:** a silly grumble, a soft poof, and the friend's relieved "Phew! Thanks!" No scary sting, no damage sound.
- **Reduced motion:** static "!" and grumblin; no pulse or bob. The poof becomes an instant disappear.
- **Big-maze mode:** if the party bar is hidden, show a floating **"Help Mira"** chip at the edge of the maze that points to the grumblin.
- **Color is not the only signal:** "!" shape, grumblin silhouette, and voice/text all carry the meaning.

---

## 10. Testing plan

### 10.1 Unit tests (`vitest`)

- `traverseCorridor` stops at the first junction.
- Only `normal`/`ear` leaves produce a dead-end mark.
- Start/exit/chamber portal leaves never produce a mark.
- A corridor longer than `MAX_STEPS` returns `too-far` and no mark.
- Charge is spent on a mark and refunded on junction/portal/too-far/recall-before-mark.
- Two scouts cannot target the same corridor.
- Auto target excludes the previous cell and checked branches.
- Auto target is deterministic and never calls `deadEnds()`.
- Adding a rescued friend is idempotent.
- v1 save migrates to v2 with the correct roster; unknown IDs are dropped; completed is clamped.
- Feature flags off leave gameplay untouched (the save may migrate to v2).
- A grumblin only rolls after a successful dead-end mark; no mark means no encounter.
- Floor 1 never spawns a grumblin; floor 2's first eligible successful scout is the tutorial encounter; on floors 3+, the first successful scout is safe.
- Encounter caps hold: max one blocked friend at a time, max two per floor.
- No valid spawn cell (corridor too short, Sora too close) means no encounter.
- A blocked friend cannot be recalled, scouting pauses, and the door stays sealed.
- The hint target is the gremlin cell while a friend is blocked.
- Entering the gremlin cell or an adjacent cell through an open edge frees the friend; the gremlin state becomes `fleeing` and then disappears.
- The encounter roll is deterministic for a given `level.seed` + friend + dead-end cell + successful-scout count.
- A pending encounter roll is deferred while a tutorial, lock, or completion modal is open and resolves when play resumes.
- Blocked-state transitions do not collect items, change charges, or open the door.

### 10.2 E2E (`playwright`)

Add a `scripts/e2e-friends.mjs` or extend the existing suite:

1. Start a floor with the dev-level hook.
2. Walk to the trapped friend and rescue them; assert the party bar gains an avatar and a charge.
3. Find a junction and a dead-end branch from `window.__dragonTowerLevel`.
4. Tap the friend, tap the branch; wait for `[data-scout-mark][data-scout-dead-end]`.
5. Assert the marked cell has `openDegree === 1`, is `normal`/`ear`, and is not a portal.
6. Assert item counts did not change and no orb token appeared before the radar.
7. Walk into the marked dead end; assert movement is still allowed.
8. Replay the floor; assert marks are gone.
9. Complete the floor (or seed a v2 save with `rescuedFriends`), reload; assert the rescued roster and active party persist.
10. Load a hand-written v1 save; assert migration and the correct friends.

**Encounter path:**

11. Force the floor-2 tutorial encounter (or use a seeded dev hook); assert `[data-gremlin-cell]` appears and the friend has `data-blocked-friend`.
12. Assert scouting is paused, the party bar shows the alert, and the door says "A friend needs help first!"
13. Press Hint; assert the hint path targets the gremlin cell.
14. Walk to the gremlin cell; assert the gremlin disappears, the friend returns, and the blocked-friend door condition clears.
15. Assert no item counts changed, no health/lives UI exists, and the dead-end mark is still present.
16. Replay the floor; assert no gremlin or blocked state persists.

### 10.3 Visual QA

- Screenshot a floor 2 with two friends, one scouting, one dead-end mark, and a party bar.
- Screenshot a blocked friend + grumblin + dead-end X on the same corridor, at phone and tablet widths.
- Check the alert in big-maze mode (floating "Help Mira" chip if the party bar is hidden).
- Check the bunny floor (ear cells) and the largest floor (currently floor 7; re-check the ring/cell count after the redesign).
- Check reduced motion and voice off.
- Check that the mark and gremlin do not cover a coin, carrot, radar, or the player token.

### 10.4 Playtest (no telemetry)

Five children, ages 5–8, on floors 2–4. Counterbalance with/without the feature. Observe:

- Time to complete.
- Wrong-turn backtracking and hint presses.
- Whether the child sends a friend without prompting.
- Whether the child can explain: "Mira checks paths; Sora collects."
- Whether the blocked-friend rescue feels funny and fair, or like a punishment.
- Whether the child goes to help without prompting, and whether the hint is enough.
- Delight, re-play requests, and any "the game did it for me" reaction.

Targets:
- 15–25% fewer wrong turns after the feature.
- No increase in completion time without a block; at most a short, understood detour with one.
- 80% of children use at least one helper.
- 90% can explain the division of labor.
- 90% of children can explain "the grumblin blocks my friend; I go shoo it" without fear.

---

## 11. Acceptance criteria

- [ ] Rescued friends persist across floors and reloads.
- [ ] The current floor's friend joins immediately on rescue and receives a charge.
- [ ] Up to three friends follow in a line; no layout shift or overlap bug.
- [ ] Manual scout: tap friend → eligible branches highlight → tap branch → friend walks.
- [ ] Auto scout: one volunteer per new junction, respects the 1.2 s delay and cancellation.
- [ ] A dead-end mark appears only for a true normal/ear leaf.
- [ ] Junction, portal, and too-far scouts produce no mark and refund the charge.
- [ ] Friends never collect, rescue, open the door, or trigger a lock.
- [ ] The hidden orb stays hidden until the radar is found, even if its corridor is marked.
- [ ] Charges are one per friend, capped at three, and shown in the party bar.
- [ ] Marks reset on replay and on a new run.
- [ ] v1 saves migrate to v2; v2 saves round-trip.
- [ ] Feature flags off reproduce today's gameplay exactly (save shape may migrate).
- [ ] Works in reduced motion, with voice off, at phone and tablet widths.
- [ ] `data-*` hooks allow the e2e suite to assert marks, party cells, and the gremlin.
- [ ] No changes to wall/portal geometry are required from the map redesign.
- [ ] A successful scout may spawn a grumblin on the return leg; the dead-end X stays.
- [ ] The blocked friend is visible and labeled; scouting pauses; recall is disabled.
- [ ] Sora frees the friend by entering the grumblin's cell or an adjacent cell through an open edge; it flees and the friend returns.
- [ ] The exit door stays sealed while any friend is blocked, with clear toast and hint feedback.
- [ ] The hint button prioritizes the blocked friend over mission goals.
- [ ] Floor 1 has no encounters, floor 2's first eligible scout is the tutorial encounter, floors 3+ first scout is safe, max 1 blocked and max 2 per floor.
- [ ] No combat, health, damage, losing, timer, or item loss is introduced.
- [ ] Leaving the floor abandons the encounter; nothing about the block is saved.

---

## 12. Phases and effort

| Phase | Work | Effort | Depends on |
| --- | --- | --- | --- |
| 0 | This plan; decisions accepted in §14 | done | — |
| 1 | Pure engine: `scouting.ts`, `encounters.ts`, `friends.ts`, v2 storage migration, feature flags, unit tests. No UI. | 1.5–2 days | Nothing; can start before the map lands |
| 2 | Map integration: `mazeTypes.ts`, `ScoutLayer`, party tokens, `Maze` props, `PlayScreen` hook, `PartyBar`, manual mode, `App.tsx` roster wiring. | 2–3 days | Map redesign merged |
| 2.5 | Grumblin rescue: blocked state, `GremlinLayer`, rescue proximity, door gate, hint priority, toast/voice hooks, tests. | 1–1.5 days | Phase 2 |
| 3 | Auto mode, settings toggle, voice lines, character mark styles, reduced-motion polish. | 1–2 days | Phase 2.5 |
| 4 | Playtest, tuning, screenshots, e2e hardening. | 0.5–1 day + playtest | Phase 3 |
| 5 (optional) | Choose active party, fetch optional coins, per-friend perks. | later | Post-MVP |

**MVP total:** roughly 6–9.5 dev days from a standing start. If Phase 1 is already done before the map lands, the remaining work is about 4.5–7.5 dev days, plus playtest time.

### 12.1 Phase 1 implementation brief (ready when unblocked)

**Goal:** a pure, invisible scouting + encounter engine behind `FRIENDS_SCOUTING = false` and `GREMLIN_BLOCKS = false`. It must not change how the game looks or plays.

**Order of work:**

1. `src/game/features.ts` — add `FRIENDS_SCOUTING` and `GREMLIN_BLOCKS` flags (default `false`).
2. `src/game/scouting.ts` — `traverseCorridor`, leaf classification, auto-target choice, mark factory. Depends only on `Level`, `Cell`, `openNeighbors`, `isJunction`, and `openDegree`.
3. `src/game/encounters.ts` — seeded grumblin roll, valid spawn-cell selection, caps, rescue proximity. Pure functions; reuse `makeRng`/`pick` from `generator/rng.ts` and `bfsDistances` from `generator/graph.ts`.
4. `src/game/friends.ts` — `rosterFromSave`, `activeParty`, `addRescuedFriend`, rescue-order handling.
5. `src/game/storage.ts` — v2 schema and v1 migration. Keep the v1 read path.
6. Tests: `src/game/scouting.test.ts`, `src/game/encounters.test.ts`, `src/game/friends.test.ts`, `src/game/storage.test.ts`.
7. Run `npm test`; confirm no e2e or visual changes.

Do not wire the roster into `App.tsx` or `PlayScreen` yet; Phase 2 calls `addRescuedFriend` from the completion path.

**Do not touch in Phase 1:**

- `src/components/Maze.tsx`
- `src/screens/PlayScreen.tsx`
- `src/styles.css`
- any generator file
- any visual snapshot or screenshot

**Done when:**

- every unit test passes, including the encounter roll, caps, spawn validity, and rescue proximity;
- a hand-written v1 save migrates to v2 with the correct roster;
- unknown friend IDs are dropped and `completed` stays clamped;
- `FRIENDS_SCOUTING = false` and `GREMLIN_BLOCKS = false` leave gameplay identical to today (only the persisted save shape changes);
- the full `npm test` suite is green.

---

## 13. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Feature solves the maze | One corridor per dispatch; no mark on junctions; three charges; no auto-collect; player still chooses every junction. |
| Hidden orb leak | Keep the orb renderer gated by `radarCollected`; scouting changes no token visibility. A marked dead end is not an orb reveal. |
| Map redesign conflict | Overlay-only contract, feature flag, Phase 1 touches no Maze file, merge after the redesign. |
| Visual clutter on the largest maze | Cap three followers and two active scouts; subtle chalk strokes; no labels inside the SVG. |
| Performance on old tablets | One 110 ms timer, max two actors, memoized overlay, no per-frame React state. |
| Child does not understand manual mode | Auto default; tap-avatar-then-path; voice; recall; first-floor tutorial. |
| Child feels the game cheated | Friends only mark; they never collect or open. The player still does the mission. |
| Long return walks | 2× return speed; catch-up hop if the player moved far; no collision blocking. |
| Save migration breaks existing players | Versioned migration, inference from `completed`, clamp, unknown-ID filter, fallback save. |
| Duplicate or stale marks | Marks are runtime-only; one per corridor; recompute on replay. |
| Audio overlap | One voice line per mark with a short cooldown; respect voice/sound settings. |
| Blocked friend feels punitive | Only after a successful mark; floors 3+ first scout safe; max one blocked; max two per floor; dead-end X already earned; no timer/damage. |
| Soft-lock or frustration | The grumblin never blocks Sora; the maze is connected; the hint always targets the friend; the door waits without losing progress. |
| Grumblin reads as scary | Plum cartoon puff, big eyebrows, no weapons/teeth, comedic grumble and poof, no combat or chase. |
| Encounter spam | 30% chance, max one blocked at a time, max two per floor, scouting pauses while blocked. |
| Player ignores a blocked friend | Door stays sealed, completion modal blocked, party bar + hint + toast all point to the rescue. |
| Encounter randomness feels unfair | Seeded rolls; only after success; floor 1 safe; floor 2 scripted tutorial; no extra item or charge loss from the block. |
| Map redesign gets another overlay dependency | One optional `gremlins` prop and one token layer; no geometry or wall changes. |

---

## 14. Decisions (accepted 2026-10-24)

All core defaults are approved. Rows 11–17 capture the new bad-character requirement; their cadence and rescue details are the recommended defaults and remain tuning knobs. No design question blocks Phase 1.

| # | Decision | Choice |
| --- | --- | --- |
| 1 | Roster model | Cumulative rescued friends, three active |
| 2 | Default help mode | Auto, with manual tap-to-send and an off setting |
| 3 | Charges | One per active friend, cap three, refund if no dead end |
| 4 | Scout depth | Stop at the first junction for MVP; revisit one-hop later |
| 5 | Items | Friends never collect; only Sora collects |
| 6 | Marks | Current run only; reset on replay |
| 7 | Hidden orb | A friend may mark its dead-end corridor; the orb stays invisible until the radar |
| 8 | Auto target | Shortest adjacent unchecked corridor, deterministic |
| 9 | Party selection | Auto-pick the three most recent for MVP; chooser later |
| 10 | Party bar | Below the maze; final placement agreed with the map redesign |
| 11 | Bad character | Harmless comedic grumblin; no combat, damage, or chase |
| 12 | Block trigger | Only after a successful dead-end mark, on the return leg |
| 13 | Block cadence | Floor 1 none; floor 2 tutorial; floors 3+ first scout safe; 30% after; max 1 blocked and max 2 per floor |
| 14 | Rescue | Sora enters the grumblin's cell or an adjacent cell through an open edge; the grumblin flees |
| 15 | Door while blocked | Sealed until every friend is free; completion modal waits |
| 16 | Hint while blocked | The blocked friend/grumblin is the first hint target |
| 17 | Recall while blocked | Disabled; scouting pauses; walking, collecting, and hints still work |

**Tuning candidates after playtest:** charges (2 vs 3), scout depth (0 vs 1 junction hop), auto delay (1.2 s vs 2 s), max scout steps (18 vs 24), encounter chance (20% vs 30%), encounter caps (1 vs 2 per floor), and whether the floor-2 grumblin tutorial repeats on replay or is saved as once-per-save. These are balance knobs, not open design questions.

---

## 15. Non-goals

- Online friends, accounts, invites, chat, or remote co-op.
- Real-time multiplayer or shared mazes.
- A friend AI that solves the maze, collects items, or opens doors.
- Persistent marks across runs.
- New maze geometry, generator changes, or new missions.
- Friend leveling, stats, or perks.
- Combat, health, damage, defeat, enemy AI, chase sequences, or scary villains.
- Grumblins that take friends away, hide them, or block Sora's own path.
- Roaming grumblins outside scouting in the MVP (future option).
- Analytics or child data collection.

---

## 16. Handoff note for the map redesign agent

No action is required now. When your branch is ready, please confirm the five points in §7.1. The intended integration is:

- one optional `party` prop,
- one optional `scoutMarks` prop,
- one optional `gremlins` prop,
- one overlay group between walls and tokens (a second small token layer for the grumblin/blocked alert),
- no changes to wall paths, portals, or the generator.

The grumblin is a token, not a wall or a collision object. It never blocks Sora's movement.

I will keep the scouting and grumblin work behind feature flags and in new files until then, so the map redesign is never blocked by this feature.

---

*This plan did not modify `src/`; the map-redesign changes in the working tree belong to the other agent. This document is the only artifact from this plan.*
