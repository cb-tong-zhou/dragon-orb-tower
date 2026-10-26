import type { Cell, Edge, Level } from "./types";

export interface AdjacencyEntry {
  to: number;
  edgeId: string;
  open: boolean;
}

const adjacencyCache = new WeakMap<Level, AdjacencyEntry[][]>();

export function buildAdjacency(cells: Cell[], edges: Edge[]): AdjacencyEntry[][] {
  const adjacency: AdjacencyEntry[][] = cells.map(() => []);
  for (const edge of edges) {
    adjacency[edge.a].push({ to: edge.b, edgeId: edge.id, open: edge.open });
    adjacency[edge.b].push({ to: edge.a, edgeId: edge.id, open: edge.open });
  }
  return adjacency;
}

export function getAdjacency(level: Level): AdjacencyEntry[][] {
  const cached = adjacencyCache.get(level);
  if (cached) return cached;
  const adjacency = buildAdjacency(level.cells, level.edges);
  adjacencyCache.set(level, adjacency);
  return adjacency;
}

export function openNeighbors(level: Level, cellId: number): number[] {
  return getAdjacency(level)[cellId]
    .filter((entry) => entry.open)
    .map((entry) => entry.to);
}

export function openDegree(level: Level, cellId: number): number {
  return openNeighbors(level, cellId).length;
}

export function isJunction(level: Level, cellId: number): boolean {
  return openDegree(level, cellId) >= 3;
}

export function bfsDistances(level: Level, from: number): number[] {
  const adjacency = getAdjacency(level);
  const distances = new Array<number>(level.cells.length).fill(-1);
  distances[from] = 0;
  const queue = [from];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    for (const entry of adjacency[current]) {
      if (!entry.open || distances[entry.to] !== -1) continue;
      distances[entry.to] = distances[current] + 1;
      queue.push(entry.to);
    }
  }
  return distances;
}

export function bfsPath(level: Level, from: number, to: number): number[] {
  if (from === to) return [from];
  const adjacency = getAdjacency(level);
  const previous = new Array<number>(level.cells.length).fill(-1);
  const visited = new Uint8Array(level.cells.length);
  visited[from] = 1;
  const queue = [from];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    for (const entry of adjacency[current]) {
      if (!entry.open || visited[entry.to]) continue;
      visited[entry.to] = 1;
      previous[entry.to] = current;
      if (entry.to === to) {
        const path: number[] = [];
        let cursor = to;
        while (cursor !== -1) {
          path.push(cursor);
          cursor = previous[cursor];
        }
        return path.reverse();
      }
      queue.push(entry.to);
    }
  }
  return [];
}

/** Walk the path until the first fork, so tapping a distant cell still leaves choices. */
export function corridorPath(level: Level, path: number[]): number[] {
  if (path.length <= 2) return path;
  for (let i = 1; i < path.length; i++) {
    if (isJunction(level, path[i])) {
      return path.slice(0, i + 1);
    }
  }
  return path;
}

/**
 * The local corridor a tap is allowed to use: from `from` in one direction
 * until the first junction, portal, or dead end. Nothing past a fork is ever
 * included, so a distant tap can never auto-path Sora across the maze.
 */
export function localCorridor(level: Level, from: number, first: number): number[] {
  const path: number[] = [];
  const visited = new Set<number>([from]);
  let previous = from;
  let current = first;

  while (!visited.has(current)) {
    path.push(current);
    visited.add(current);

    const cell = level.cells[current];
    if (
      !cell ||
      cell.kind === "start" ||
      cell.kind === "exit" ||
      cell.kind === "chamber"
    ) {
      break;
    }

    const next = openNeighbors(level, current).filter((id) => id !== previous);
    if (next.length === 0 || next.length >= 2) break;

    previous = current;
    current = next[0];
  }

  return path;
}

/**
 * Resolve a tap into a local walk. Returns the cells Sora may walk (excluding
 * his own cell) when the tapped cell lies inside the corridor he occupies or
 * an adjacent branch, or null when the tap is too far away to honor without
 * pathfinding. Repeated distant taps therefore never chain into a route.
 */
export function localWalkPath(level: Level, from: number, tapped: number): number[] | null {
  if (from === tapped) return null;
  if (tapped < 0 || tapped >= level.cells.length) return null;

  for (const first of openNeighbors(level, from)) {
    const corridor = localCorridor(level, from, first);
    if (corridor.includes(tapped)) return corridor;
  }

  return null;
}

/**
 * The open neighbour that continues best along `heading` (a unit vector).
 * Hold-to-walk uses it to glide down a corridor: a gentle bend keeps enough
 * alignment to continue, a forced corner in a one-way corridor is followed even
 * when it is sharp, and at a real fork with no straight continuation the walk
 * stops so the player still chooses the branch. `avoid` is the cell just left,
 * so a glide never doubles back.
 */
export function straightestOpenNeighbor(
  level: Level,
  from: number,
  heading: { x: number; y: number },
  options: { avoid?: number | null; minimumAlignment?: number } = {},
): number | null {
  const { avoid = null, minimumAlignment = 0.25 } = options;
  const origin = level.cells[from];
  if (!origin) return null;

  const candidates = openNeighbors(level, from).filter((id) => id !== avoid);
  let best: number | null = null;
  let bestScore = -Infinity;
  for (const id of candidates) {
    const cell = level.cells[id];
    const dx = cell.cx - origin.cx;
    const dy = cell.cy - origin.cy;
    const length = Math.hypot(dx, dy);
    if (length < 1e-6) continue;
    const score = (dx / length) * heading.x + (dy / length) * heading.y;
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  if (best === null) return null;
  if (bestScore >= minimumAlignment) return best;

  // A tight corner is still the only way forward when the corridor is one-way.
  return candidates.length === 1 ? best : null;
}

/**
 * The open neighbour pointing closest to `target`. Used when the player presses
 * on Sora himself: the press point says which way to walk, even though the
 * finger is sitting on his own cell. `avoid` keeps a holding walk from
 * immediately doubling back unless that is the only way out.
 */
export function neighborToward(
  level: Level,
  from: number,
  target: { x: number; y: number },
  avoid: number | null = null,
): number | null {
  const origin = level.cells[from];
  if (!origin) return null;
  const dx = target.x - origin.cx;
  const dy = target.y - origin.cy;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return null;

  const open = openNeighbors(level, from);
  const pool = avoid === null ? open : open.filter((id) => id !== avoid);
  // A dead end is a stop, not a bounce: the walk pauses so the thumb can steer.
  if (pool.length === 0) return null;

  let best: number | null = null;
  let bestScore = -Infinity;
  for (const id of pool) {
    const cell = level.cells[id];
    const segment = Math.hypot(cell.cx - origin.cx, cell.cy - origin.cy) || 1;
    // Cosine of the angle between the wanted direction and this neighbour.
    const score =
      ((cell.cx - origin.cx) / segment) * (dx / length) +
      ((cell.cy - origin.cy) / segment) * (dy / length);
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

export function reachableCount(level: Level, from: number): number {
  return bfsDistances(level, from).filter((distance) => distance >= 0).length;
}

export function deadEnds(level: Level): number[] {
  return level.cells
    .filter(
      (cell) =>
        cell.kind !== "start" &&
        cell.kind !== "exit" &&
        cell.kind !== "chamber" &&
        openDegree(level, cell.id) === 1,
    )
    .map((cell) => cell.id);
}

export function allInternalConnected(level: Level): boolean {
  return reachableCount(level, level.startCell) === level.cells.length;
}

export function cellMidRadius(cell: Cell): number {
  return (cell.r0 + cell.r1) / 2;
}
