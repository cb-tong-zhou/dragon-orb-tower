// Prototype only (preview). Polar maze whose sector count grows with ring index.
// Carved with a recursive backtracker, so every cell is reachable and the maze is perfect.
// Output matches the Level fields the real Maze component reads.
import type { Cell, Edge, Level } from "../src/generator/types";
import { bfsDistances } from "../src/generator/graph";

const TAU = Math.PI * 2;

function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** sectorsFor(ring) gives the cell count of a ring (ring >= 1). */
/** Dead ends = normal cells with exactly one open passage. */
function deadEndCount(level: Level): number {
  const degree = new Array<number>(level.cells.length).fill(0);
  for (const e of level.edges) {
    if (!e.open) continue;
    degree[e.a]++;
    degree[e.b]++;
  }
  return level.cells.filter((c) => c.kind === "normal" && degree[c.id] === 1).length;
}

/** Regenerates with new seeds until the maze has at least `minDeadEnds` side ends. */
function longestPathFromCentre(level: Level): number {
  return Math.max(...bfsDistances(level, 0));
}

/**
 * Regenerates with new seeds until the maze has enough side dead ends AND a
 * long route from the centre. The carve itself is unchanged (no loops), so the
 * maze stays a single-solution tree.
 */
export function buildGrowingLevel(
  rings: number,
  sectorsFor: (ring: number) => number,
  seed: string,
  minDeadEnds = 35,
  minPath = 90,
): Level {
  let level = buildAttempt(rings, sectorsFor, seed);
  for (let attempt = 1; attempt < 400; attempt++) {
    if (deadEndCount(level) >= minDeadEnds && longestPathFromCentre(level) >= minPath) break;
    level = buildAttempt(rings, sectorsFor, `${seed}:${attempt}`);
  }
  return level;
}

function buildAttempt(rings: number, sectorsFor: (ring: number) => number, seed: string): Level {
  const rng = mulberry(hash(seed));
  const cells: Cell[] = [];
  const byRing: number[][] = [];

  cells.push({
    id: 0, kind: "center", ring: 0, sector: 0, sectors: 1,
    a0: 0, a1: TAU, r0: 0, r1: 1, cx: 0, cy: 0, angle: 0,
  });
  byRing[0] = [0];

  for (let ring = 1; ring < rings; ring++) {
    const n = sectorsFor(ring);
    byRing[ring] = [];
    for (let s = 0; s < n; s++) {
      const a0 = (TAU * s) / n;
      const a1 = (TAU * (s + 1)) / n;
      const angle = (a0 + a1) / 2;
      const [cx, cy] = [Math.cos(angle) * (ring + 0.5), Math.sin(angle) * (ring + 0.5)];
      const id = cells.length;
      cells.push({
        id, kind: "normal", ring, sector: s, sectors: n,
        a0, a1, r0: ring, r1: ring + 1, cx, cy, angle,
      });
      byRing[ring].push(id);
    }
  }

  // All possible passages between neighbours: same-ring sides and overlapping radial arcs.
  const candidates: Array<{ a: number; b: number; kind: Edge["kind"]; wall: Edge["wall"] }> = [];
  for (let ring = 1; ring < rings; ring++) {
    const ids = byRing[ring];
    const n = ids.length;
    for (let s = 0; s < n; s++) {
      const a = cells[ids[s]];
      const b = cells[ids[(s + 1) % n]];
      const angle = a.a1;
      const [x1, y1] = [Math.cos(angle) * ring, Math.sin(angle) * ring];
      const [x2, y2] = [Math.cos(angle) * (ring + 1), Math.sin(angle) * (ring + 1)];
      candidates.push({ a: a.id, b: b.id, kind: "tangential", wall: { type: "line", x1, y1, x2, y2 } });
    }
  }
  for (const id of byRing[1]) {
    const c = cells[id];
    candidates.push({ a: 0, b: id, kind: "radial", wall: { type: "arc", radius: 1, a0: c.a0, a1: c.a1 } });
  }
  for (let ring = 1; ring < rings - 1; ring++) {
    for (const innerId of byRing[ring]) {
      const inner = cells[innerId];
      for (const outerId of byRing[ring + 1]) {
        const outer = cells[outerId];
        const a0 = Math.max(inner.a0, outer.a0);
        const a1 = Math.min(inner.a1, outer.a1);
        if (a1 - a0 < 1e-7) continue;
        candidates.push({ a: innerId, b: outerId, kind: "radial", wall: { type: "arc", radius: ring + 1, a0, a1 } });
      }
    }
  }

  // Pure recursive backtracker: carve a spanning tree from the centre.
  // This is the original growing-ring version the user liked.
  const open = new Array<boolean>(candidates.length).fill(false);
  const adj: Array<Array<{ to: number; idx: number }>> = cells.map(() => []);
  candidates.forEach((c, idx) => {
    adj[c.a].push({ to: c.b, idx });
    adj[c.b].push({ to: c.a, idx });
  });
  const seen = new Uint8Array(cells.length);
  const stack = [0];
  seen[0] = 1;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const next = adj[cur].filter((e) => !seen[e.to]);
    if (next.length === 0) {
      stack.pop();
      continue;
    }
    const pick = next[Math.floor(rng() * next.length)];
    seen[pick.to] = 1;
    open[pick.idx] = true;
    stack.push(pick.to);
  }

  const edges: Edge[] = candidates.map((c, idx) => ({
    id: `g:${idx}`, a: c.a, b: c.b, kind: c.kind, open: open[idx], wall: c.wall,
  }));

  return {
    version: 1, seed, floor: 1, mission: "rescue", rings, outerRadius: rings,
    cells, edges, portals: [], startCell: 0, exitCell: 0, friendCell: 0,
    orbCell: 0, radarCell: -1, coinCells: [], coinChoices: [], carrotCells: [],
    carrotNumbers: [], codeWord: "", codeChoices: [], extraTop: 0, headWallGaps: [],
    earShapes: [], earInnerShapes: [], orbStars: 1,
    metrics: { cellCount: cells.length, deadEnds: 0, pathToFriend: 0, pathToOrb: 0, pathToExit: 0, braidCount: 0, attempt: 0 },
  };
}
