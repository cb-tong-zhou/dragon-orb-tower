# The Doodle Tower — Procedural Puzzle Plan

## 0. Goal

Recreate the charm and difficulty of the hand-drawn "tower floor" puzzle sheets, but generate new floors automatically, and wrap them in a small game for children.

Working assumptions:

- Ages **5–8** (two difficulty modes: 4–6 and 6–8).
- **Web / PWA first** (iPad, tablet, desktop), optional native wrapper later.
- 10 floors, 1–2 minutes per floor, 10–15 minutes total.
- No backend, no accounts, no ads, no data collection.
- Same generator can also export printable worksheets — the examples are paper puzzles, so print is a natural second product.

---

## 1. What the three examples actually are

| Example | Maze | Mission | Learning hook |
|---|---|---|---|
| Floor 2 | Circular ring maze, star entrance, door exit, side chambers | "How many coins can you collect?" | Counting |
| Floor 3 | Bunny-head maze (ring maze in head + long ear corridors) | "Collect carrots to crack the code" | Number → letter mapping (A = 1) |
| Floor 1 | Circular ring maze, X-marked side chambers, star in center | "Save your friends first!" | Exploration / planning |

Common DNA:

- **Concentric-ring ("theta") maze**, not a rectangular grid.
- Start is outside the maze; goal is a door/star at the other side or center.
- **Small side chambers** protrude from the outer rim; they hold collectibles, friends, or locked doors.
- Sparse, meaningful objects: coins, carrots, animals, hearts, star.
- One **narrative wrapper** ("Floor 2 of the tower") plus one clear task.
- Hand-drawn ink, cream paper, one or two highlighter accent colors.
- Very few rules; the puzzle is the maze plus a tiny learning twist.

**Key insight:** the random part is not just the maze. The product is a **puzzle-sheet generator**: pick a mission template, generate a suitable maze, place objectives fairly, give it a theme, and render it in a hand-drawn style. A random maze by itself will feel generic and often unfair.

---

## 2. Product concept

**The Doodle Tower** (working title): children climb a tower one floor at a time. Each floor is a new hand-drawn puzzle. Completing a floor rescues a friend / earns a stamp and unlocks the next floor.

Design pillars:

1. **One mission, one small learning twist.** Never stack three new rules on a floor.
2. **No fail state.** No timer, no lives, no losing. Dead ends are just wrong turns.
3. **Spacious and legible.** Wide corridors, large touch targets, icons before text.
4. **Handmade, not "app-like".** Wobbly ink, paper texture, marker colors, warm sounds.
5. **Generated layout, authored experience.** Story beats, tutorial, and finale are handcrafted; mazes and item placement are generated.

Mission templates:

1. **Coin Count** (from Floor 2): collect all coins, then answer "How many?" at the door.
2. **Rescue** (from Floor 1): find 2–3 friends in dead ends/side chambers; the exit unlocks when all are saved; friends follow the player.
3. **Code** (from Floor 3): find numbered carrots, use `A = 1` to decode a short word, then choose the matching picture or type the word.
4. Later (not MVP): delivery, matching pairs, simple arithmetic locks.

Each floor has a **fixed curated seed** in the campaign. A "New Puzzle" mode can generate fresh seeds after the campaign is complete.

---

## 3. Generation pipeline

```
difficulty profile
  → polar grid (rings + sectors)
  → carve maze
  → add outer portals / chambers / silhouette
  → solve + measure
  → place mission objectives
  → validate against constraints
  → render (game + print)
```

### 3.1 Polar grid

- Rings from center outward; each ring is divided into sectors.
- Sector count grows with radius so cells stay roughly square. Cap outer sectors (approx. 24–32) for readability.
- Cell neighbors: inward, outward, clockwise, counter-clockwise.
- If a ring has more sectors than the previous one, a cell can have two outward neighbors; the carver picks one or both. This is a graph problem, not a special case.
- Minimum cell width must be checked at render size (e.g. ≥ 44 px on tablet, ≥ 10 mm in print).

### 3.2 Carving

- Use a **randomized depth-first search / recursive backtracker** through the cell graph. It creates long, winding corridors like the examples.
- Optional **braiding**: remove a small percentage of dead-end walls to create loops and reduce frustration for younger players. Keep enough dead ends for hidden friends.
- Start carving from the entrance cell so the path structure feels natural from the player's point of view.
- Store walls as canonical edges between cells; shared walls are drawn once.

### 3.3 Portals and silhouette

- Pick 3–5 perimeter angles: start, exit, and 1–3 side chambers.
- Entrance/exit: remove the outer wall segment and add an exterior "tab" with a star/door icon.
- Side chambers: add a small rounded bump-out cell outside the rim, connected to one outer cell. Place a friend or a locked door there.
- Keep portals at least ~60° apart to avoid visual collisions.
- MVP shape: circle. Later: composite shapes (bunny head + ear corridors, cat ears, rocket fins) by stitching a theta-maze "body" to small rectangular-grid appendages through defined anchors. This is more reliable than clipping one polar grid to an arbitrary silhouette.

### 3.4 Solve and measure

Before placing anything, compute:

- BFS from start to every cell (connectivity check).
- Dead ends (degree 1 cells).
- Shortest start → exit path.
- Junction count and branch depth.
- For mandatory items: an approximate required route (brute-force order for ≤ 6 items) and **detour ratio** versus the shortest start → exit path.

These metrics drive both validation and difficulty tuning.

### 3.5 Place objectives

- **Friends / code carrots:** dead ends or side chambers, far from start, spread around the maze, each in a different branch.
- **Coins:** spread across the reachable graph, including some on the main path and some in optional branches; minimum spacing so they do not clump.
- Never place an item on the start or exit cell; never hide two different item types in one cell.
- Ensure the "collect all" route is meaningfully longer than the direct route, otherwise the mission is trivial.
- Ensure the exit is reachable and visibly gated if objectives are mandatory.

### 3.6 Validate; retry if needed

Generate with a seed, validate, and retry with a derived seed up to N attempts. Reject a floor if:

- Any cell or item is unreachable.
- Required route is too short / too long for the age profile.
- Too few dead ends for the rescue mission.
- Item spacing or corridor width is below the readable threshold.
- Portals overlap or the exit is adjacent to the start.
- The maze has an unintended trivial shortcut that skips all objectives.
- The answer key cannot be generated exactly (e.g. duplicate/ambiguous code).

### 3.7 Suggested difficulty table

| Profile | Rings | Outer sectors | Braid | Mandatory items | Typical floor |
|---|---|---|---|---|---|
| 4–6 | 4–5 | 10–16 | 20–25% | 2–4 | 45–90 sec |
| 6–8 | 5–7 | 16–24 | 5–15% | 4–6 | 1.5–3 min |
| 8–10 | 7–9 | 24–32 | 0–10% | 5–8 | 2–4 min |

Treat these as starting values; tune with real children.

### 3.8 Generator pseudocode

```ts
function generateFloor(seed: string, profile: Profile, mission: MissionSpec) {
  const rng = mulberry32(hash(seed));
  for (let attempt = 0; attempt < 50; attempt++) {
    const grid = buildPolarGrid(profile, rng);
    const maze = carve(grid, rng, { braid: profile.braid });
    const portals = placePortals(maze, rng);
    const solved = solve(maze, portals.start);

    const plan = placeObjectives(maze, solved, mission, rng);
    const metrics = measure(maze, solved, plan);

    if (validate(maze, plan, metrics, profile)) {
      return { version: 1, seed, profile, maze, portals, plan, metrics };
    }
  }
  throw new GenerationError("No valid floor for seed");
}
```

---

## 4. Children's game design

### Core loop

1. Tower map: pick an unlocked floor.
2. Narrated intro: one sentence, e.g. "The bunnies are lost! Can you find them?"
3. Play: tap a reachable spot; the character auto-walks the corridor. (No joystick; forgiving for small hands.)
4. Collect / rescue; gentle sound and animation.
5. Exit: answer the mission question (count, choose the decoded word, etc.).
6. Celebration, stamp, elevator to the next floor.

### Input and hints

- **Tap-to-move** along the maze graph. Also support drag-to-draw for older children.
- Generous hit areas; no precision steering required.
- After ~12 seconds without progress, softly pulse the next objective. After another ~15 seconds, show a dotted path. Hints are always free.
- No negative feedback for wrong turns. A dead end just gets a friendly "Hmm, not here!" and the child walks back.

### Mission-specific UX

- **Coins:** do not show a running total (that spoils the counting question). Show a pouch that fills up. At the exit, ask "How many coins?" with a large number pad, or count aloud with the narrator for the youngest mode.
- **Rescue:** HUD shows friend silhouettes; rescued friends follow in a little line. Exit stays crossed/locked until everyone is safe.
- **Code:** collected carrots appear in a code panel. Show the `A = 1` helper. For 5–7, answer by choosing one of three pictures; for 8+, type or tap letters.

### Progression and replay

- 10-floor campaign with a handcrafted tutorial (Floor 1) and ending.
- Floors 2–9 use curated generated seeds; the story introduces a new friend and a new mission type gradually.
- After the campaign: "New Tower" generates a fresh set of validated seeds; optionally a daily puzzle.
- Rewards are stickers/stamps, not scores or leaderboards.

### Accessibility and safety

- Icons + voice narration so pre-readers can play.
- Body text in a clear rounded sans; handwriting font only for titles and decorative labels.
- Color is never the only signal; every item also has a distinct shape.
- Sound/music toggles, reduced motion, larger UI, slower walk speed.
- No ads, no analytics on children, no accounts, no chat, no external links without a parental gate.
- If released in app stores: Kids Category requirements, privacy policy, parental gate for purchases/links.

---

## 5. Technical plan

### Recommended stack

- **Vite + React + TypeScript** — UI, progression, and SVG rendering.
- **rough.js** — seeded hand-drawn strokes for walls and outlines.
- **Zustand** (or React state) — game state.
- **Zod** — validate generated level JSON.
- **Vitest + fast-check** — generator invariants and property tests.
- **Playwright** — end-to-end flows.
- **Howler** or Web Audio — sound effects and narration.
- **vite-plugin-pwa** — offline install on tablets.
- **Browser print CSS** — printable worksheet from the same level data (vector, no screenshot).
- Deploy as static files (Cloudflare Pages / Netlify). No backend for MVP.

Why not a game engine: the game is a static maze with a token that walks along a graph. SVG + CSS/requestAnimationFrame is simpler, sharper, and easier to print. Keep the generator renderer-agnostic in case you later want Phaser or Unity.

### Architecture

```
src/
  app/            screens, navigation, parent zone
  game/           play loop, input, hints, audio, save state
  generator/
    rng.ts        seeded PRNG
    grid.ts       polar cells + geometry
    carve.ts      maze carving + braid
    portals.ts    entrances, exits, chambers
    shapes.ts     optional composite silhouettes
    solver.ts     BFS, routes, metrics
    objectives.ts mission placement
    validate.ts   constraints and retries
    types.ts      Level schema
  render/
    MazeSvg.tsx   walls, chambers, items
    RoughStyle.ts hand-drawn look
    PrintSheet.tsx
  content/
    themes.ts     animals, palettes, names
    missions.ts   templates and difficulty
    words.ts      code words
    strings.ts    localization
  state/
```

Key rule: **the generator is pure and returns serializable `Level` JSON**. The game and print renderer are consumers. This makes tests, seed sharing, and a level-gallery debug page easy.

### Level data model (sketch)

```ts
type Level = {
  version: 1;
  seed: string;
  theme: ThemeId;
  profile: DifficultyProfile;
  grid: { rings: number; sectors: number[] };
  portals: Portal[];
  walls: WallEdge[];
  items: ItemPlacement[];
  mission: Mission;
  solution: CellId[];
  metrics: {
    pathLength: number;
    deadEnds: number;
    requiredRoute: number;
    detourRatio: number;
  };
  answer: string | number;
};
```

### Rendering/print notes

- Draw arcs and radial walls as merged SVG paths; use round caps.
- Add low-frequency jitter to the outer silhouette; use rough.js with a per-level seed so the same floor looks identical every session and in print.
- Keep the palette sparse: ink, paper, one green highlighter, orange coins/carrots, red hearts, yellow star.
- Print at A4/Letter with 10–12 mm margins and a 10 mm minimum corridor width. Include instructions and an answer key page.
- A dev-only **level gallery** showing 50 generated floors with metrics is the fastest way to tune the generator.

---

## 6. Art and audio direction

- **Look:** activity-book ink on cream paper; wobbly lines; marker fills; slight rotations; visible paper grain.
- **Palette:** ink `#2B2A26`, paper `#FAF6EC`, green `#C7E38A`, orange `#F2A33A`, yellow `#F6D35B`, red `#E76F51`.
- **Type:** a hand-lettered display font for titles (OFL-licensed, e.g. Patrick Hand / Caveat) and a rounded sans for instructions (e.g. Nunito). Do not use handwriting for critical instructions.
- **Icons:** custom 2 px ink-stroke SVGs with simple marker fills. Consistent visual weight matters more than detail.
- **Audio:** pencil scratches, paper turns, soft chimes, animal greetings, one warm narrator. Short lines; record or license professional voice, not browser TTS for the final product.
- **Motion:** gentle walking bob, item pop, confetti; honor reduced motion.

---

## 7. Roadmap

### Phase 0 — Generator spike (2–4 days)

- Build the polar grid, carver, and SVG renderer.
- Output 20 floors across all three missions; print them.
- Solve them by hand; check whether they feel as charming and readable as the examples.
- **Decision gate:** if the generated sheets are not fun on paper, do not build the app yet.

### Phase 1 — Playable core (1–2 weeks)

- One maze shape, coin mission, tap-to-move, collect, count answer, hints.
- Rough hand-drawn style, 3 floors, basic sound, save progress.
- Test on an iPad and a low-end Android tablet.

### Phase 2 — Content and charm (2–3 weeks)

- Rescue and code missions; 3 themes; characters; narrator.
- 10-floor campaign with tutorial and finale; sticker rewards.
- Parent settings, print export, PWA/offline.
- Level gallery + seed curation.

### Phase 3 — Test and polish (1–2 weeks)

- Playtests with 3–5 children per age band.
- Tune difficulty, corridor size, hint timing, item counts.
- Accessibility, performance, privacy review, release build.
- Optional: Capacitor wrapper for App Store / Play Store.

**Rough total:** 3–4 weeks full-time for a solid MVP; 5–8 weeks part-time. A print-only pack can ship in 1–2 weeks from the same generator.

---

## 8. Testing

- **Generator property tests:** every cell reachable; item count exact; deterministic by seed; no overlapping walls; solution route valid; all missions solvable.
- **Golden seeds:** snapshot SVG and metrics for a set of approved floors.
- **Visual QA:** gallery review; print at 100% scale; check corridor width and text fit.
- **Kid testing:** completion rate, time, hint usage, whether they can explain the answer, and whether they ask to play again.
- **Device testing:** touch accuracy, SVG performance, audio unlock, offline mode.
- **Release checks:** no ads/tracking, parental gate, privacy policy, app-store kids rules.

---

## 9. Main risks and mitigations

| Risk | Mitigation |
|---|---|
| Random mazes feel generic or unfair | Mission templates + metrics + validation + curated seeds |
| Too hard / too easy | Age profiles, real playtests, adaptive hints |
| Hand-drawn style looks fake | Human logo/title, custom icons, paper/audio texture, curated imperfection |
| Scope creep | Fixed mission set, one platform, no backend, no accounts |
| Child privacy | No data collection, no ads, parental gate, local-only save |
| Performance on old tablets | Cap cells/walls; canvas fallback only if needed |
| Procedural content lacks heart | Authored story, characters, tutorial, and finale around generated floors |

---

## 10. Decisions to make before coding

1. **Age range:** 4–6, 6–8, or both? (Recommended: 5–8 with two modes.)
2. **Format:** web/PWA, native app, printable pack, or both web + print? (Recommended: web first; print from the same engine.)
3. **Campaign vs endless:** curated 10-floor campaign plus optional new seeds? (Recommended.)
4. **Art/audio:** custom commission or in-house? The handmade look is the differentiator; budget for it.
5. **First milestone:** approve a Phase 0 generator spike before any game UI work.

---

## 11. Immediate next step

Build the Phase 0 spike:

1. Scaffold Vite + React + TypeScript.
2. Implement `rng`, `grid`, `carve`, `solver`, and an SVG renderer.
3. Generate 10 circular floors with coins, friends, and code carrots.
4. Print them and playtest on paper.
5. Only then wrap the approved levels in the tap-to-move game.

The first question to answer is not "which game engine?" — it is **"are the generated puzzle sheets fun and readable on paper?"** That validates the core of the product cheaply.
