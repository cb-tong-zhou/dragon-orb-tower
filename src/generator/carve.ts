import type { Cell, Edge } from "./types";
import type { Rng } from "./rng";

const TWO_PI = Math.PI * 2;
const EPS = 1e-7;

/**
 * Polar grid where every ring can have its own sector count.
 * sectorCounts[ring] is used for ring >= 1; the centre disc is always one cell.
 */
export function buildPolarGrid(
  rings: number,
  sectorCounts: number[],
): { cells: Cell[]; edges: Edge[] } {
  const cells: Cell[] = [
    { id: 0, kind: "center", ring: 0, sector: 0, sectors: 1, a0: 0, a1: TWO_PI, r0: 0, r1: 1, cx: 0, cy: 0, angle: 0 },
  ];
  const byRing: number[][] = [[0]];
  const countOf = (ring: number) =>
    sectorCounts[ring] ?? sectorCounts[sectorCounts.length - 1] ?? 1;

  for (let ring = 1; ring < rings; ring++) {
    const n = Math.max(1, Math.round(countOf(ring)));
    byRing[ring] = [];
    for (let s = 0; s < n; s++) {
      const a0 = (TWO_PI * s) / n;
      const a1 = (TWO_PI * (s + 1)) / n;
      const angle = (a0 + a1) / 2;
      const id = cells.length;
      cells.push({
        id,
        kind: "normal",
        ring,
        sector: s,
        sectors: n,
        a0,
        a1,
        r0: ring,
        r1: ring + 1,
        cx: Math.cos(angle) * (ring + 0.5),
        cy: Math.sin(angle) * (ring + 0.5),
        angle,
      });
      byRing[ring].push(id);
    }
  }

  const edges: Edge[] = [];

  // Spokes between neighbouring sectors of one ring (straight radial walls).
  for (let ring = 1; ring < rings; ring++) {
    const ids = byRing[ring];
    const n = ids.length;
    for (let s = 0; s < n; s++) {
      const a = cells[ids[s]];
      const b = cells[ids[(s + 1) % n]];
      const angle = a.a1;
      edges.push({
        id: `t:${ring}:${s}`,
        a: a.id,
        b: b.id,
        kind: "tangential",
        open: false,
        wall: {
          type: "line",
          x1: Math.cos(angle) * ring,
          y1: Math.sin(angle) * ring,
          x2: Math.cos(angle) * (ring + 1),
          y2: Math.sin(angle) * (ring + 1),
        },
      });
    }
  }

  // Arcs between the centre and ring 1.
  for (const id of byRing[1]) {
    const c = cells[id];
    edges.push({
      id: `r:0:0:${c.sector}`,
      a: 0,
      b: id,
      kind: "radial",
      open: false,
      wall: { type: "arc", radius: 1, a0: c.a0, a1: c.a1 },
    });
  }

  // Arcs between every pair of overlapping rings.
  for (let ring = 1; ring < rings - 1; ring++) {
    for (const innerId of byRing[ring]) {
      const inner = cells[innerId];
      for (const outerId of byRing[ring + 1]) {
        const outer = cells[outerId];
        const a0 = Math.max(inner.a0, outer.a0);
        const a1 = Math.min(inner.a1, outer.a1);
        if (a1 - a0 < EPS) continue;
        edges.push({
          id: `r:${ring}:${inner.sector}:${outer.sector}`,
          a: innerId,
          b: outerId,
          kind: "radial",
          open: false,
          wall: { type: "arc", radius: ring + 1, a0, a1 },
        });
      }
    }
  }

  return { cells, edges };
}

/** Opens the fewest walls needed so every cell is reachable from the centre. */
export function repairConnectivity(cells: Cell[], edges: Edge[]): void {
  for (;;) {
    const reached = new Uint8Array(cells.length);
    const queue = [0];
    reached[0] = 1;
    const adjacency = buildOpenAdjacency(cells.length, edges);
    for (let head = 0; head < queue.length; head++) {
      for (const edge of adjacency[queue[head]]) {
        const to = edge.a === queue[head] ? edge.b : edge.a;
        if (!edge.open || reached[to]) continue;
        reached[to] = 1;
        queue.push(to);
      }
    }
    if (queue.length === cells.length) return;
    const fix = edges.find((edge) => !edge.open && reached[edge.a] !== reached[edge.b]);
    if (!fix) return;
    fix.open = true;
  }
}

function buildOpenAdjacency(count: number, edges: Edge[]): Edge[][] {
  const adjacency: Edge[][] = Array.from({ length: count }, () => []);
  for (const edge of edges) {
    adjacency[edge.a].push(edge);
    adjacency[edge.b].push(edge);
  }
  return adjacency;
}

/**
 * Concentric template: every ring boundary is a long continuous arc with only a
 * couple of small doors, and each ring is a long corridor that runs most of the
 * way round the circle. This is the dense, hand-drawn-looking layout.
 */
/**
 * Evenly spaced radial walls for one ring. About a third of the spokes become
 * walls (staggered per ring), which breaks each ring corridor into segments so
 * the route has to wind instead of running freely round the circle.
 */
function spokeWalls(n: number, ring: number, rng: Rng): Set<number> {
  const count = Math.max(2, Math.round(n / 3));
  const step = Math.max(1, Math.floor(n / count));
  const offset = Math.floor(rng() * step) + (ring * 2) % Math.max(1, step);
  const walls = new Set<number>();
  for (let index = 0; index < count; index++) {
    walls.add((offset + index * step) % n);
  }
  return walls;
}

export function carveRing(cells: Cell[], edges: Edge[], rings: number, rng: Rng): void {
  for (const edge of edges) edge.open = false;

  // Ring corridors: most spokes open, about a third closed as short radial walls.
  const wallsByRing = new Map<number, Set<number>>();
  for (let ring = 1; ring < rings; ring++) {
    wallsByRing.set(ring, spokeWalls(cells.find((cell) => cell.ring === ring)?.sectors ?? 1, ring, rng));
  }
  for (const edge of edges) {
    if (edge.kind !== "tangential") continue;
    const [, ringPart, sectorPart] = edge.id.split(":");
    const sector = Number(sectorPart);
    const walls = wallsByRing.get(Number(ringPart)) ?? new Set<number>();
    edge.open = !walls.has(sector);
  }

  // Concentric walls: two small doors per boundary, staggered per ring.
  const doorByBoundary = new Map<number, Set<number>>();
  for (let boundary = 1; boundary < rings; boundary++) {
    const n = cells.find((cell) => cell.ring === boundary)?.sectors ?? 1;
    const doors = new Set<number>();
    const first = Math.floor(rng() * n);
    doors.add(first);
    if (n > 3) doors.add((first + Math.floor(n / 2)) % n);
    doorByBoundary.set(boundary, doors);
  }
  for (const edge of edges) {
    if (edge.kind !== "radial") continue;
    const [, ringPart, sectorPart] = edge.id.split(":");
    const ring = Number(ringPart);
    const boundary = ring + 1;
    if (boundary < rings && doorByBoundary.get(boundary)?.has(Number(sectorPart))) {
      edge.open = true;
    }
  }

  repairConnectivity(cells, edges);
}

/**
 * Hybrid: the outer rings use the concentric template (long arcs, small doors)
 * while the inner rings are carved as winding single-cell corridors. Used by the
 * later floors so the two styles meet in one map.
 */
export function carveHybrid(
  cells: Cell[],
  edges: Edge[],
  rings: number,
  rng: Rng,
  split = Math.max(2, Math.floor(rings / 2)),
): void {
  for (const edge of edges) edge.open = false;

  const isInner = (cellId: number) => cells[cellId].ring < split;
  const crossing = (edge: Edge) => isInner(edge.a) !== isInner(edge.b);

  // --- Outer half: concentric template -------------------------------------
  const outerWalls = new Map<number, Set<number>>();
  for (let ring = split; ring < rings; ring++) {
    const n = cells.find((cell) => cell.ring === ring)?.sectors ?? 1;
    outerWalls.set(ring, spokeWalls(n, ring, rng));
  }
  const doorByBoundary = new Map<number, Set<number>>();
  for (let boundary = split; boundary < rings; boundary++) {
    const n = cells.find((cell) => cell.ring === boundary)?.sectors ?? 1;
    const doors = new Set<number>();
    const first = Math.floor(rng() * n);
    doors.add(first);
    if (n > 3) doors.add((first + Math.floor(n / 2)) % n);
    doorByBoundary.set(boundary, doors);
  }

  for (const edge of edges) {
    if (edge.kind === "tangential") {
      const ring = cells[edge.a].ring;
      if (ring < split) continue; // handled by the inner carve
      const walls = outerWalls.get(ring) ?? new Set<number>();
      edge.open = !walls.has(cells[edge.a].sector);
      continue;
    }
    if (edge.kind !== "radial" || crossing(edge)) continue;
    const boundary = Math.max(cells[edge.a].ring, cells[edge.b].ring);
    const innerSector = cells[edge.a].sector;
    if (boundary >= split && doorByBoundary.get(boundary)?.has(innerSector)) edge.open = true;
  }

  // --- Inner half: winding backtracker -------------------------------------
  const adjacency = buildOpenAdjacency(cells.length, edges);
  const seen = new Uint8Array(cells.length);
  const stack = [0];
  seen[0] = 1;
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const options = adjacency[current].filter((edge) => {
      if (crossing(edge)) return false;
      const to = edge.a === current ? edge.b : edge.a;
      return !seen[to] && isInner(to) && isInner(current);
    });
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(rng() * options.length)];
    const to = pick.a === current ? pick.b : pick.a;
    pick.open = true;
    seen[to] = 1;
    stack.push(to);
  }

  repairConnectivity(cells, edges);
}

/**
 * Growing corridors: sectors increase with radius, then a recursive backtracker
 * carves single-cell-wide winding passages.
 */
export function carveGrowing(
  cells: Cell[],
  edges: Edge[],
  rng: Rng,
  startCell = 0,
): void {
  for (const edge of edges) edge.open = false;
  const adjacency = buildOpenAdjacency(cells.length, edges);
  const seen = new Uint8Array(cells.length);
  const stack = [startCell];
  seen[startCell] = 1;
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const candidates = adjacency[current].filter((edge) => {
      const to = edge.a === current ? edge.b : edge.a;
      return !seen[to];
    });
    if (candidates.length === 0) {
      stack.pop();
      continue;
    }
    const pick = candidates[Math.floor(rng() * candidates.length)];
    const to = pick.a === current ? pick.b : pick.a;
    pick.open = true;
    seen[to] = 1;
    stack.push(to);
  }
  repairConnectivity(cells, edges);
}
