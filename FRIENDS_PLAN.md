# Friends Who Scout — Design & Implementation Plan

**Status:** proposal, no code changes made
**Date:** 2026-10-24
**Scope:** the rescued characters inside *Dragon Orb Tower* (Mira, Bo, Pico, Roku, Taro, Nova, Kiko)
**Hard constraint:** the map is being redesigned by another agent. This plan deliberately avoids `src/` changes and is written around a small renderer contract so it can be picked up after that work lands.

> If by "friends" you mean real-world or online friends (accounts, remote co-op, invites), that is a different feature. It needs a backend, identity, moderation, and a child-privacy review, which conflicts with the current "no accounts, no backend, local-only save" design. This plan is for the in-game friends the player rescues.

---

## 1. One-paragraph summary

Rescued friends become a persistent party. At a junction, the player can send a friend down one corridor, or a friend can volunteer automatically. The friend walks the corridor **at the same time** the player is free to keep moving, and if the corridor is a true dead end, the friend leaves a chalk **X** and a faint dotted trail on the map, then returns to the party. Friends never collect items, open doors, or solve the route. Each friend can help once per floor (max three helpers), so the feature removes wasted backtracking without turning the maze into a solved line. The renderer only needs a new overlay and a party token list; it does not need new maze geometry.

---

## 2. Why this fits the existing game

| Current fact | Opportunity |
| --- | --- |
| One friend is rescued per floor (`config.friendId`) and follows Sora via one `followerCell`. | Generalize the single follower into a small party, then give party members a job. |
| The maze is a perfect maze (`braid: 0`) with 16–30+ dead ends per floor. | Dead ends are the main source of wasted walking; marking a few is genuinely useful. |
| Floors are 180–276 cells and regenerate on every run. | A per-run scout state is enough; nothing needs to persist except the rescued roster. |
| Missions are "rescue, collect, count, decode, find radar". | Friends must not collect, count, or decode; they can only mark topology. This keeps every learning beat intact. |
| The game has no fail state and no timers. | Scouting must be optional, recallable, and never punish a wrong choice. |
| The map is being redesigned. | Scouting needs only cell IDs and cell centers. It should be a separate SVG layer, not a change to wall or portal drawing. |
| Save data is version 1 with `completed` only. | Add a version 2 save with a rescued-friends roster and a help setting, with an inference-based migration. |

**Value estimate:** on a floor with 20+ dead ends, the player might walk 5–10 wrong branches. Three helper marks save roughly 30–60 taps and two to four minutes of frustration for a 5–8 year old, while still leaving the majority of the maze to explore.

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
| **Auto** | When Sora stops at a new junction, one available friend volunteers after a short pause and checks the shortest adjacent corridor that has not been checked at that junction. The child can recall the friend. | Yes for ages 5–8 |
| **Manual** | The player taps a friend, then taps a branch. Up to two friends may scout different branches at once. | Available always |
| **Off** | Friends still follow, but never scout. Classic maze behavior. | Setting option |

Auto mode should feel like a friend volunteering, not the game taking over. It only fires once per junction arrival, only when the player is stationary, and only if the child has not already moved.

### 3.4 What friends will and will not do

**Will:**
- Walk through corridors, including corridors that contain collectibles.
- Mark a corridor as a dead end only when it truly terminates at a normal/ear leaf.
- Return to the party after marking.
- Be recalled by tapping them.

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

- Tapping the scouting friend's avatar in the party bar recalls them. If they had already marked a dead end, the mark stays; the charge stays spent. The map token itself can remain non-interactive to avoid competing with cell taps.
- Recalling before a mark refunds the charge.
- Two friends cannot scout the same corridor at the same time.
- A friend cannot scout a corridor already marked dead.
- If the player enters a corridor being scouted, the friend finishes or returns; no collision logic, no blocking.
- If the player moves far away while a friend is returning, the friend does a short "catch-up" hop after the return animation rather than walking the entire maze back.

### 5.4 Party line

- Party order is rescue order, newest friend closest to Sora or at the tail (decide visually with the map redesign).
- On each player step, each following friend takes the previous cell of the friend ahead (the current single-follower behavior, generalized).
- Scouting friends are removed from the conga line until they return.
- If two friends share a cell, offset them radially, as the current `followerSpot` logic already does for one.
- Render at most three followers; extra rescued friends live in the party bar.

### 5.5 Party bar

- A new `PartyBar` outside the SVG (below the maze, above the footer, or a compact rail).
- Shows every rescued friend; the active three are highlighted.
- Each active friend shows a chalk-star badge when their charge is available, a faded badge when used.
- Shows "2 helpers ready" for pre-readers via icons, not text alone.
- 44 px minimum touch targets.
- The bar must not cover the maze, the hint button, or the mission bar. Final placement should be agreed with the map redesign.

---

## 6. Architecture

### 6.1 New pure modules

| File | Responsibility |
| --- | --- |
| `src/game/friends.ts` | Roster from save, active-party window, rescue-order helpers, add/remove friend. |
| `src/game/scouting.ts` | Corridor traversal, leaf classification, auto-target choice, mark creation. Pure functions over `Level` + graph helpers. |
| `src/game/useScoutDirector.ts` | React hook: party positions, scout state machine, one timer, charge accounting, mark list, callbacks. |
| `src/components/PartyBar.tsx` | Avatar strip, charge badges, manual selection. |
| `src/components/ScoutLayer.tsx` | SVG overlay: dotted trails, chalk X, optional pulse on eligible branches. |
| `src/components/mazeTypes.ts` | Shared `PartyToken`, `ScoutMark`, `ScoutHighlight` contracts. |
| `src/game/features.ts` | `FRIENDS_SCOUTING` flag, default off until the map lands. |

### 6.2 Proposed data model (not implemented)

```ts
export interface PartyMember {
  characterId: string;
  cellId: number;
  slot: number;                 // 0 = closest to Sora
  mode: "follow" | "scout" | "return";
  hasCharge: boolean;           // one scout per friend per floor
  scoutPath: number[];          // cells, including the starting cell
  scoutIndex: number;
  markId?: string;
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
```

```ts
// Maze props addition, after the redesign
party?: PartyToken[];
scoutMarks?: ScoutMark[];
scoutHighlight?: ScoutHighlight | null;
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

return
  --reaches player / catch-up--> follow
```

One interval drives all active scouts (~110 ms per cell, matching the existing walk cadence). No per-frame React updates; the hook commits a snapshot per tick. At most two scouts are active, so re-render cost is bounded.

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

---

## 7. Integration with the map redesign

### 7.1 Contract for the map agent

No action is needed now. When the redesign is ready, please confirm:

1. `Level.cells[].cx/cy` is still the cell-center contract.
2. `Maze` can accept an optional `scoutMarks`/`party` prop, or expose a stable overlay slot inside the same `<svg>`.
3. `data-player-token`, `data-player-cell`, `data-cell-id`, and `data-cell-kind` remain.
4. The maze still renders a token group above the wall layer, so a scout overlay can sit between walls and tokens.
5. The map component still uses the `Level` type (or provides an adapter).

The scouting layer does not need wall geometry, portal shapes, ring counts, or bunny-ear outlines. It only draws polylines through `cell.cx/cy` and an X at a cell center.

### 7.2 Where the overlay goes

```tsx
<svg className="maze-svg" viewBox={viewBox}>
  {/* walls, paper, portals — owned by the map redesign */}
  <ScoutLayer marks={scoutMarks} cells={level.cells} />
  {/* collectibles */}
  {/* party tokens, player token */}
  {/* hit targets */}
</svg>
```

- `ScoutLayer` has `pointerEvents="none"`.
- Trail: dashed polyline, ink at ~0.22 opacity, round caps, `vectorEffect="non-scaling-stroke"`.
- X: two short strokes in a small circle, friend accent color, ink outline, 300 ms pop.
- Highlight for manual mode: reuse the existing move-dot visual language, but a different shape/pulse so it does not read as "tap to walk".
- Do not add labels inside the maze; the party bar and voice carry the text.

### 7.3 Merge order

1. **Map redesign lands.** Freeze the `Level`/`Cell` contract.
2. **Phase 1 (safe pre-work, no Maze edits):** pure `scouting.ts` + `friends.ts` + save v2 migration + tests, feature flag off.
3. **Phase 2 (small Maze patch):** `mazeTypes.ts`, `ScoutLayer`, party tokens, prop wiring; coordinate one commit with the map agent.
4. **PlayScreen wiring:** hook, manual mode, party bar, toasts.
5. **Auto mode + polish:** settings, voice, reduced motion, character mark styles.
6. **Playtest + tuning.**

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

### 8.2 Migration from v1

- If `rescuedFriends` is missing, infer it from completed floors:
  `FLOORS.slice(0, completed).map((story) => story.config.friendId)`.
- Filter out unknown character IDs.
- Default `settings.friendHelp` to `"auto"`.
- Keep the existing `completed` clamp (0–7).
- If storage is unavailable, fall back to a fresh v2 save; the game must still work.

### 8.3 Roster rules

- Completing a floor adds `config.friendId` idempotently.
- The current floor's friend is **not** in the party until rescued, even on a replay.
- Other rescued friends are available on replay.
- Active party = up to three most recently rescued available friends. The current floor's friend joins when rescued and may push the oldest friend to the party bar.
- Full roster is shown in the party bar; the active three follow and can scout.
- Future option: let the player choose the active three on the tower screen. Not MVP.

### 8.4 Why marks are not saved

The maze is regenerated on every visit, so saved marks would be meaningless and could reveal a future layout. Marks live in `useScoutDirector` for the lifetime of `PlayScreen` and reset on replay.

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
- Feature flag off leaves the existing save and gameplay untouched.

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
9. Reload; assert the rescued roster persists.
10. Load a hand-written v1 save; assert migration and the correct friends.

### 10.3 Visual QA

- Screenshot a floor 2 with two friends, one scouting, one dead-end mark, and a party bar.
- Check the mark at tablet and phone widths, and in big-maze mode.
- Check the bunny floor (ear cells) and floor 7 (12 rings/276 cells).
- Check reduced motion and voice off.
- Check that the mark does not cover a coin, carrot, radar, or the player token.

### 10.4 Playtest (no telemetry)

Five children, ages 5–8, on floors 2–4. Counterbalance with/without the feature. Observe:

- Time to complete.
- Wrong-turn backtracking and hint presses.
- Whether the child sends a friend without prompting.
- Whether the child can explain: "Mira checks paths; Sora collects."
- Delight, re-play requests, and any "the game did it for me" reaction.

Targets:
- 15–25% fewer wrong turns after the feature.
- No increase in completion time.
- 80% of children use at least one helper.
- 90% can explain the division of labor.

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
- [ ] Feature flag off reproduces today's behavior exactly.
- [ ] Works in reduced motion, with voice off, at phone and tablet widths.
- [ ] `data-*` hooks allow the e2e suite to assert marks and party cells.
- [ ] No changes to wall/portal geometry are required from the map redesign.

---

## 12. Phases and effort

| Phase | Work | Effort | Depends on |
| --- | --- | --- | --- |
| 0 | This plan; agree on decisions in §14 | done | — |
| 1 | Pure engine: `scouting.ts`, `friends.ts`, v2 storage migration, feature flag, unit tests. No UI. | 1.5–2 days | Nothing; can start before the map lands |
| 2 | Map integration: `mazeTypes.ts`, `ScoutLayer`, party tokens, `Maze` props, `PlayScreen` hook, `PartyBar`, manual mode. | 2–3 days | Map redesign merged |
| 3 | Auto mode, settings toggle, voice lines, character mark styles, reduced-motion polish. | 1–2 days | Phase 2 |
| 4 | Playtest, tuning, screenshots, e2e hardening. | 0.5–1 day + playtest | Phase 3 |
| 5 (optional) | Choose active party, fetch optional coins, per-friend perks. | later | Post-MVP |

**MVP total:** roughly 4–6 dev days after the map lands, or 5–8 days including auto mode and polish.

---

## 13. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Feature solves the maze | One corridor per dispatch; no mark on junctions; three charges; no auto-collect; player still chooses every junction. |
| Hidden orb leak | Keep the orb renderer gated by `radarCollected`; scouting changes no token visibility. A marked dead end is not an orb reveal. |
| Map redesign conflict | Overlay-only contract, feature flag, Phase 1 touches no Maze file, merge after the redesign. |
| Visual clutter on a 276-cell maze | Cap three followers and two active scouts; subtle chalk strokes; no labels inside the SVG. |
| Performance on old tablets | One 110 ms timer, max two actors, memoized overlay, no per-frame React state. |
| Child does not understand manual mode | Auto default; tap-avatar-then-path; voice; recall; first-floor tutorial. |
| Child feels the game cheated | Friends only mark; they never collect or open. The player still does the mission. |
| Long return walks | 2× return speed; catch-up hop if the player moved far; no blocking. |
| Save migration breaks existing players | Versioned migration, inference from `completed`, clamp, unknown-ID filter, fallback save. |
| Duplicate or stale marks | Marks are runtime-only; one per corridor; recompute on replay. |
| Audio overlap | One voice line per mark with a short cooldown; respect voice/sound settings. |

---

## 14. Decisions to confirm before coding

Recommended defaults are listed first.

1. **Roster model:** cumulative rescued friends with a three-active window, or only the current floor's friend? → **Cumulative, three active.**
2. **Default help mode:** auto, manual, or off? → **Auto**, with a manual tap-to-send path and an off setting.
3. **Charges:** one per active friend, cap three, refund if no dead end? → **Yes.**
4. **Scout depth:** stop at the first junction, or allow one junction hop? → **Stop at the first junction for MVP.** Revisit if playtests show too few marks.
5. **Items:** may friends collect anything? → **No.** Only Sora collects.
6. **Marks:** persist across replays? → **No**, current run only.
7. **Hidden orb:** may a friend mark its dead-end corridor while the orb is hidden? → **Yes**, because the orb token remains invisible. This creates a nice radar payoff.
8. **Auto target:** shortest adjacent corridor, or random/nearest? → **Shortest adjacent**, deterministic and easy to explain.
9. **Party selection:** auto-pick the three most recent, or add a tower-screen chooser? → **Auto-pick for MVP**, chooser later.
10. **Party bar placement:** below the maze, or a collapsible rail? → **Below the maze**, finalized with the map redesign.

---

## 15. Non-goals

- Online friends, accounts, invites, chat, or remote co-op.
- Real-time multiplayer or shared mazes.
- A friend AI that solves the maze, collects items, or opens doors.
- Persistent marks across runs.
- New maze geometry, generator changes, or new missions.
- Friend leveling, stats, or combat.
- Analytics or child data collection.

---

## 16. Handoff note for the map redesign agent

No action is required now. When your branch is ready, please confirm the five points in §7.1. The intended integration is:

- one optional `party` prop,
- one optional `scoutMarks` prop,
- one overlay group between walls and tokens,
- no changes to wall paths, portals, or the generator.

I will keep the scouting work behind a feature flag and in new files until then, so the map redesign is never blocked by this feature.

---

*No files in `src/` were modified. This document is the only artifact.*
