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
