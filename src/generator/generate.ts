import {
  bfsDistances,
  bfsPath,
  buildAdjacency,
  deadEnds,
  getAdjacency,
  openDegree,
  reachableCount,
} from "./graph";
import { makeRng, pick, shuffle, type Rng } from "./rng";
import type {
  Cell,
  Edge,
  FloorConfig,
  HeadWallGap,
  Level,
  LevelMetrics,
  Portal,
} from "./types";

const TWO_PI = Math.PI * 2;
const PORTAL_OFFSET = 0.02;
const CAPSULE_RADIUS = 0.5;

// The reference bunny ears are tall, multi-lane mini-mazes rather than two
// simple boxes. A 5x9 grid gives each ear several nested turns while still
// leaving room for the character tokens on a phone.
const EAR_WIDTH = 3.6;
const EAR_HEIGHT = 9.6;
const EAR_COLS = 5;
const EAR_ROWS = 9;
const EAR_CENTER_X = 3.8;

function pointAt(radius: number, angle: number): [number, number] {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function angleDistance(a: number, b: number): number {
  const diff = Math.abs((a - b) % TWO_PI);
  return Math.min(diff, TWO_PI - diff);
}

function roundedRectPath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
): string {
  const r = Math.max(0, Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2));
  return [
    `M ${(x0 + r).toFixed(3)} ${y0.toFixed(3)}`,
    `L ${(x1 - r).toFixed(3)} ${y0.toFixed(3)}`,
    `Q ${x1.toFixed(3)} ${y0.toFixed(3)} ${x1.toFixed(3)} ${(y0 + r).toFixed(3)}`,
    `L ${x1.toFixed(3)} ${(y1 - r).toFixed(3)}`,
    `Q ${x1.toFixed(3)} ${y1.toFixed(3)} ${(x1 - r).toFixed(3)} ${y1.toFixed(3)}`,
    `L ${(x0 + r).toFixed(3)} ${y1.toFixed(3)}`,
    `Q ${x0.toFixed(3)} ${y1.toFixed(3)} ${x0.toFixed(3)} ${(y1 - r).toFixed(3)}`,
    `L ${x0.toFixed(3)} ${(y0 + r).toFixed(3)}`,
    `Q ${x0.toFixed(3)} ${y0.toFixed(3)} ${(x0 + r).toFixed(3)} ${y0.toFixed(3)}`,
    "Z",
  ].join(" ");
}

function buildCells(rings: number, sectors: number): Cell[] {
  const cells: Cell[] = [];
  cells.push({
    id: 0,
    kind: "center",
    ring: 0,
    sector: 0,
    sectors: 1,
    a0: 0,
    a1: TWO_PI,
    r0: 0,
    r1: 1,
    cx: 0,
    cy: 0,
    angle: 0,
  });

  for (let ring = 1; ring < rings; ring++) {
    for (let sector = 0; sector < sectors; sector++) {
      const a0 = (TWO_PI * sector) / sectors;
      const a1 = (TWO_PI * (sector + 1)) / sectors;
      const angle = (a0 + a1) / 2;
      const midRadius = ring + 0.5;
      const [cx, cy] = pointAt(midRadius, angle);
      cells.push({
        id: cells.length,
        kind: "normal",
        ring,
        sector,
        sectors,
        a0,
        a1,
        r0: ring,
        r1: ring + 1,
        cx,
        cy,
        angle,
      });
    }
  }
  return cells;
}

function buildEdges(cells: Cell[], rings: number): Edge[] {
  const edges: Edge[] = [];
  const byRing: Cell[][] = Array.from({ length: rings }, () => []);
  for (const cell of cells) {
    if (cell.ring >= 1) byRing[cell.ring][cell.sector] = cell;
  }

  // Tangential walls: radial lines between neighbouring sectors.
  for (let ring = 1; ring < rings; ring++) {
    const ringCells = byRing[ring];
    const sectors = ringCells.length;
    for (let sector = 0; sector < sectors; sector++) {
      const a = ringCells[sector];
      const b = ringCells[(sector + 1) % sectors];
      const angle = sector === sectors - 1 ? 0 : a.a1;
      const [x1, y1] = pointAt(ring, angle);
      const [x2, y2] = pointAt(ring + 1, angle);
      edges.push({
        id: `t:${ring}:${sector}`,
        a: a.id,
        b: b.id,
        kind: "tangential",
        open: false,
        wall: { type: "line", x1, y1, x2, y2 },
      });
    }
  }

  // Radial walls: arcs between the centre and ring 1.
  for (const outer of byRing[1]) {
    edges.push({
      id: `r:0:0:${outer.sector}`,
      a: 0,
      b: outer.id,
      kind: "radial",
      open: false,
      wall: { type: "arc", radius: 1, a0: outer.a0, a1: outer.a1 },
    });
  }

  // Radial walls: arcs between every pair of overlapping rings.
  for (let ring = 1; ring < rings - 1; ring++) {
    const innerCells = byRing[ring];
    const outerCells = byRing[ring + 1];
    for (const inner of innerCells) {
      for (const outer of outerCells) {
        const start = Math.max(inner.a0, outer.a0);
        const end = Math.min(inner.a1, outer.a1);
        if (end - start < 1e-7) continue;
        edges.push({
          id: `r:${ring}:${inner.sector}:${outer.sector}`,
          a: inner.id,
          b: outer.id,
          kind: "radial",
          open: false,
          wall: { type: "arc", radius: ring + 1, a0: start, a1: end },
        });
      }
    }
  }

  return edges;
}

function openEarSpiral(earCells: Cell[][], earEdges: Edge[]): void {
  // A single spiral lane through the ear leaves long nested U-shaped walls
  // between its turns, like the hand-drawn bunny ears. The lane is generated
  // first, then only its consecutive edges are opened.
  const order: Cell[] = [];
  let top = 0;
  let bottom = EAR_ROWS - 1;
  let left = 0;
  let right = EAR_COLS - 1;

  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col++) order.push(earCells[top][col]);
    top++;
    for (let row = top; row <= bottom; row++) order.push(earCells[row][right]);
    right--;
    if (top <= bottom) {
      for (let col = right; col >= left; col--) order.push(earCells[bottom][col]);
      bottom--;
    }
    if (left <= right) {
      for (let row = bottom; row >= top; row--) order.push(earCells[row][left]);
      left++;
    }
  }

  const edgeByPair = new Map<string, Edge>();
  for (const edge of earEdges) {
    edgeByPair.set(`${Math.min(edge.a, edge.b)}:${Math.max(edge.a, edge.b)}`, edge);
  }
  for (let index = 0; index < order.length - 1; index++) {
    const a = order[index].id;
    const b = order[index + 1].id;
    const edge = edgeByPair.get(`${Math.min(a, b)}:${Math.max(a, b)}`);
    if (edge) edge.open = true;
  }
}

/**
 * Add two playable bunny ears above the circular head. Each ear is a tall
 * 5x9 rectangular mini-maze joined to the head through a gap in the outer
 * wall, matching the tall nested lanes in the hand-drawn reference.
 */
function addEars(
  cells: Cell[],
  edges: Edge[],
  rings: number,
): { extraTop: number; headWallGaps: HeadWallGap[]; earShapes: string[]; earInnerShapes: string[] } {
  const earShapes: string[] = [];
  const earInnerShapes: string[] = [];
  const headWallGaps: HeadWallGap[] = [];
  const earBottom = -rings + 0.8;
  const earTop = earBottom - EAR_HEIGHT;
  const cellWidth = EAR_WIDTH / EAR_COLS;
  const cellHeight = EAR_HEIGHT / EAR_ROWS;

  for (let earIndex = 0; earIndex < 2; earIndex++) {
    const centerX = earIndex === 0 ? -EAR_CENTER_X : EAR_CENTER_X;
    const left = centerX - EAR_WIDTH / 2;
    const right = centerX + EAR_WIDTH / 2;
    earShapes.push(roundedRectPath(left, earTop, right, earBottom, 0.9));
    earInnerShapes.push(
      roundedRectPath(left + 0.5, earTop + 0.48, right - 0.5, earBottom - 0.9, 0.52),
    );

    const earCells: Cell[][] = [];
    for (let row = 0; row < EAR_ROWS; row++) {
      const rowCells: Cell[] = [];
      const y0 = earTop + row * cellHeight;
      const y1 = y0 + cellHeight;
      for (let col = 0; col < EAR_COLS; col++) {
        const x0 = left + col * cellWidth;
        const x1 = x0 + cellWidth;
        const cell: Cell = {
          id: cells.length,
          kind: "ear",
          ring: -1,
          sector: col,
          sectors: EAR_COLS,
          a0: 0,
          a1: 0,
          r0: 0,
          r1: 0,
          cx: (x0 + x1) / 2,
          cy: (y0 + y1) / 2,
          angle: 0,
          outline: roundedRectPath(x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04, 0.12),
          earId: earIndex,
          earRow: row,
        };
        cells.push(cell);
        rowCells.push(cell);
      }
      earCells.push(rowCells);
    }

    // Build every internal edge closed first. openEarSpiral then opens one
    // continuous spiral lane, leaving the other edges as long U-shaped walls.
    const earEdges: Edge[] = [];
    for (let row = 0; row < EAR_ROWS; row++) {
      for (let col = 0; col < EAR_COLS - 1; col++) {
        const a = earCells[row][col];
        const b = earCells[row][col + 1];
        const x = left + (col + 1) * cellWidth;
        const edge: Edge = {
          id: `e:${earIndex}:${row}:${col}:h`,
          a: a.id,
          b: b.id,
          kind: "ear",
          open: false,
          wall: {
            type: "line",
            x1: x,
            y1: a.cy - cellHeight / 2,
            x2: x,
            y2: a.cy + cellHeight / 2,
          },
        };
        edges.push(edge);
        earEdges.push(edge);
      }
    }
    for (let row = 0; row < EAR_ROWS - 1; row++) {
      const y = earTop + (row + 1) * cellHeight;
      for (let col = 0; col < EAR_COLS; col++) {
        const edge: Edge = {
          id: `e:${earIndex}:${row}:${col}:v`,
          a: earCells[row][col].id,
          b: earCells[row + 1][col].id,
          kind: "ear",
          open: false,
          wall: { type: "line", x1: left + col * cellWidth, y1: y, x2: left + (col + 1) * cellWidth, y2: y },
        };
        edges.push(edge);
        earEdges.push(edge);
      }
    }
    openEarSpiral(earCells, earEdges);

    // One open doorway into the head, with a matching gap in the head wall.
    // Mirror the doorway columns so the two ears sit symmetrically.
    const bottomCol = earIndex === 0 ? 1 : EAR_COLS - 2;
    const bottomCell = earCells[EAR_ROWS - 1][bottomCol];
    const connectorAngle = Math.atan2(bottomCell.cy, bottomCell.cx);
    const outer = nearestOuterCell(cells, rings, connectorAngle);
    edges.push({
      id: `p:ear-${earIndex}`,
      a: outer.id,
      b: bottomCell.id,
      kind: "portal",
      open: true,
      wall: { type: "none" },
    });
    headWallGaps.push({
      a0: connectorAngle - 0.2,
      a1: connectorAngle + 0.2,
    });
  }

  return { extraTop: EAR_HEIGHT - 0.8, headWallGaps, earShapes, earInnerShapes };
}

function carve(
  cells: Cell[],
  edges: Edge[],
  startCell: number,
  rng: Rng,
  newestChance: number,
): void {
  const adjacency = buildAdjacency(cells, edges);
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  const visited = new Set<number>([startCell]);
  const active = [startCell];

  // Growing-tree carve: mostly follow the newest branch, but sometimes jump to
  // a random active cell. A higher newestChance keeps longer, calmer routes.
  while (active.length > 0) {
    const useNewest = rng() < newestChance;
    const index = useNewest ? active.length - 1 : Math.floor(rng() * active.length);
    const current = active[index];
    const candidates = adjacency[current].filter((entry) => !visited.has(entry.to));
    if (candidates.length === 0) {
      active.splice(index, 1);
      continue;
    }
    const chosen = pick(candidates, rng);
    const edge = edgeById.get(chosen.edgeId);
    if (!edge) {
      active.splice(index, 1);
      continue;
    }
    edge.open = true;
    visited.add(chosen.to);
    active.push(chosen.to);
  }

  // If anything was disconnected (shouldn't happen with this grid), connect it
  // through the closest available edge so the level is always playable.
  for (const cell of cells) {
    if (visited.has(cell.id)) continue;
    const entries = adjacency[cell.id];
    const edge = edgeById.get(entries[0]?.edgeId ?? "");
    if (edge) edge.open = true;
    visited.add(cell.id);
  }
}

function braidMaze(cells: Cell[], edges: Edge[], braid: number, rng: Rng): number {
  if (braid <= 0) return 0;
  const adjacency = buildAdjacency(cells, edges);
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  const candidates = cells
    .filter((cell) => cell.kind !== "center" && cell.kind !== "start" && cell.kind !== "exit" && cell.kind !== "chamber")
    .filter((cell) => adjacency[cell.id].filter((entry) => entry.open).length === 1);

  const target = Math.min(
    Math.max(0, candidates.length - 3),
    Math.floor(candidates.length * braid),
  );
  let opened = 0;

  for (const cell of shuffle(candidates, rng)) {
    if (opened >= target) break;
    const closed = adjacency[cell.id].filter((entry) => !entry.open);
    if (closed.length === 0) continue;
    const chosen = pick(closed, rng);
    const edge = edgeById.get(chosen.edgeId);
    if (!edge) continue;
    edge.open = true;
    opened++;
  }
  return opened;
}

function nearestOuterCell(cells: Cell[], rings: number, targetAngle: number): Cell {
  const outerCells = cells.filter((cell) => cell.ring === rings - 1);
  let best = outerCells[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const cell of outerCells) {
    const distance = angleDistance(cell.angle, targetAngle);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = cell;
    }
  }
  return best;
}

function distancesFrom(cells: Cell[], edges: Edge[], from: number): number[] {
  const adjacency = buildAdjacency(cells, edges);
  const distances = new Array<number>(cells.length).fill(-1);
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

function chooseOuterCell(
  outerCells: Cell[],
  selected: Cell[],
  score: (cell: Cell) => number,
  rng: Rng,
): Cell {
  const separated = outerCells.filter((cell) =>
    selected.every((other) => angleDistance(cell.angle, other.angle) >= 0.35),
  );
  const available = separated.length > 0
    ? separated
    : outerCells.filter((cell) => selected.every((other) => cell.id !== other.id));
  const ranked = [...available].sort((a, b) => score(b) - score(a));
  const pool = ranked.slice(0, Math.min(6, ranked.length));
  return pick(pool, rng);
}

function makeExternalCell(
  id: number,
  kind: "start" | "exit" | "chamber",
  angle: number,
  outerRadius: number,
): Cell {
  const [cx, cy] = pointAt(outerRadius + PORTAL_OFFSET, angle);
  return {
    id,
    kind,
    ring: -1,
    sector: 0,
    sectors: 1,
    a0: angle,
    a1: angle,
    r0: outerRadius - 0.1,
    r1: outerRadius + CAPSULE_RADIUS + PORTAL_OFFSET,
    cx,
    cy,
    angle,
  };
}

function addPortals(
  cells: Cell[],
  edges: Edge[],
  rings: number,
  rng: Rng,
  config: FloorConfig,
): {
  cells: Cell[];
  edges: Edge[];
  portals: Portal[];
  startCell: number;
  exitCell: number;
  friendCell: number;
} {
  const outerRadius = rings;
  const outerCells = cells.filter((cell) => cell.ring === rings - 1);

  const centerDistances = distancesFrom(cells, edges, 0);
  let startOuter: Cell;
  let exitOuter: Cell;
  let chamberOuter: Cell;

  if (config.portalStyle === "opposite") {
    startOuter = nearestOuterCell(cells, rings, Math.PI);
    exitOuter = nearestOuterCell(cells, rings, 0);
    const startDistances = distancesFrom(cells, edges, startOuter.id);
    const exitDistances = distancesFrom(cells, edges, exitOuter.id);
    chamberOuter = chooseOuterCell(
      outerCells,
      [startOuter, exitOuter],
      (cell) => startDistances[cell.id] + exitDistances[cell.id] * 0.5,
      rng,
    );
  } else {
    // Pick portal cells after carving, using real maze distances. This keeps the
    // start, friend, and exit far apart even when the tree is very branchy.
    startOuter = chooseOuterCell(outerCells, [], (cell) => centerDistances[cell.id], rng);
    const startDistances = distancesFrom(cells, edges, startOuter.id);
    chamberOuter = chooseOuterCell(
      outerCells,
      [startOuter],
      (cell) => startDistances[cell.id],
      rng,
    );
    const chamberDistances = distancesFrom(cells, edges, chamberOuter.id);
    exitOuter = chooseOuterCell(
      outerCells,
      [startOuter, chamberOuter],
      (cell) => startDistances[cell.id] + chamberDistances[cell.id] * 0.5,
      rng,
    );
  }

  const nextCells = [...cells];
  const nextEdges = [...edges];
  const portals: Portal[] = [];

  const make = (
    kind: "start" | "exit" | "chamber",
    outer: Cell,
  ): number => {
    const external = makeExternalCell(nextCells.length, kind, outer.angle, outerRadius);
    nextCells.push(external);
    nextEdges.push({
      id: `p:${kind}`,
      a: outer.id,
      b: external.id,
      kind: "portal",
      open: true,
      wall: { type: "none" },
    });
    portals.push({
      kind,
      angle: outer.angle,
      outerCell: outer.id,
      externalCell: external.id,
    });
    return external.id;
  };

  const startCell = make("start", startOuter);
  const exitCell = make("exit", exitOuter);
  const friendCell = make("chamber", chamberOuter);

  return { cells: nextCells, edges: nextEdges, portals, startCell, exitCell, friendCell };
}

function chooseOrbCell(level: Level, config: FloorConfig, rng: Rng): number {
  if (config.orbAtCenter) return 0;
  if (config.mission !== "radar") return -1;

  const distances = bfsDistances(level, level.startCell);
  const friendDistances = bfsDistances(level, level.friendCell);
  const blocked = new Set([level.startCell, level.exitCell, level.friendCell, level.orbCell]);

  const internal = level.cells.filter(
    (cell) =>
      cell.kind === "normal" &&
      !blocked.has(cell.id) &&
      distances[cell.id] >= 4,
  );

  const scored = internal
    .map((cell) => ({
      id: cell.id,
      deadEnd: openDegree(level, cell.id) === 1,
      score: distances[cell.id] + friendDistances[cell.id] * 0.7,
    }))
    .sort((a, b) => b.score - a.score);

  const deadEndOptions = scored.filter((option) => option.deadEnd).slice(0, 5);
  const options = deadEndOptions.length > 0 ? deadEndOptions : scored.slice(0, 5);
  if (options.length === 0) {
    const fallback = internal.sort((a, b) => distances[b.id] - distances[a.id])[0];
    return fallback?.id ?? 0;
  }
  return pick(options, rng).id;
}

function chooseRadarCell(level: Level, config: FloorConfig, rng: Rng): number {
  if (config.mission !== "radar") return -1;

  const distances = bfsDistances(level, level.startCell);
  const friendDistances = bfsDistances(level, level.friendCell);
  const blocked = new Set([
    level.startCell,
    level.exitCell,
    level.friendCell,
    level.orbCell,
  ]);

  const candidates = level.cells.filter(
    (cell) =>
      cell.kind === "normal" &&
      !blocked.has(cell.id) &&
      distances[cell.id] >= 4,
  );

  const scored = candidates
    .map((cell) => ({
      id: cell.id,
      deadEnd: openDegree(level, cell.id) === 1,
      score: distances[cell.id] + friendDistances[cell.id] * 0.4,
    }))
    .sort((a, b) => b.score - a.score);

  const deadEndOptions = scored.filter((option) => option.deadEnd).slice(0, 8);
  const options = deadEndOptions.length > 0 ? deadEndOptions : scored.slice(0, 8);
  if (options.length > 0) return pick(options, rng).id;

  return (
    candidates[0]?.id ??
    level.cells.find((cell) => cell.kind === "normal" && !blocked.has(cell.id))?.id ??
    -1
  );
}

function chooseCoinCells(level: Level, config: FloorConfig, rng: Rng): number[] {
  const count = config.coinCount ?? (config.mission === "radar" ? 3 : 0);
  if (count <= 0) return [];

  const distances = bfsDistances(level, level.startCell);
  const blocked = new Set([
    level.startCell,
    level.exitCell,
    level.friendCell,
    level.orbCell,
    level.radarCell,
  ]);

  const candidates = level.cells.filter(
    (cell) =>
      cell.kind === "normal" &&
      !blocked.has(cell.id) &&
      distances[cell.id] >= 2,
  );
  const deadEndOptions = candidates.filter((cell) => openDegree(level, cell.id) === 1);
  const pool = deadEndOptions.length >= count ? deadEndOptions : candidates;
  const chosen = shuffle(pool, rng)
    .slice(0, count)
    .map((cell) => cell.id);

  if (chosen.length < count) {
    for (const cell of shuffle(candidates, rng)) {
      if (chosen.length >= count) break;
      if (!chosen.includes(cell.id)) chosen.push(cell.id);
    }
  }

  return chosen;
}

function makeCoinChoices(count: number, rng: Rng): number[] {
  const options = new Set<number>([count]);
  const offsets = shuffle([-2, -1, 1, 2], rng);
  for (const offset of offsets) {
    if (options.size >= 4) break;
    const value = count + offset;
    if (value > 0) options.add(value);
  }
  return shuffle([...options], rng);
}

function chooseCarrotCells(level: Level, config: FloorConfig, rng: Rng): number[] {
  if (config.mission !== "code") return [];

  const distances = bfsDistances(level, level.startCell);
  const blocked = new Set([
    level.startCell,
    level.exitCell,
    level.friendCell,
    level.orbCell,
    level.radarCell,
    ...level.coinCells,
  ]);

  const candidates = level.cells.filter(
    (cell) =>
      (cell.kind === "normal" || cell.kind === "ear") &&
      !blocked.has(cell.id) &&
      distances[cell.id] >= 2 &&
      // Keep carrots out of the rounded ear rim and the bottom row tucked
      // under the head, where a token would sit on top of the border.
      (cell.kind !== "ear" ||
        ((cell.earRow ?? EAR_ROWS - 1) < EAR_ROWS - 1 &&
          (cell.earRow ?? 0) > 0 &&
          cell.sector > 0 &&
          cell.sector < EAR_COLS - 1)),
  );

  const pickFrom = (pool: Cell[]): Cell => {
    const deadEndOptions = pool.filter((cell) => openDegree(level, cell.id) === 1);
    const ranked = [...(deadEndOptions.length > 0 ? deadEndOptions : pool)].sort(
      (a, b) => distances[b.id] - distances[a.id],
    );
    return pick(ranked.slice(0, Math.min(6, ranked.length)), rng);
  };

  const chosen: number[] = [];
  for (const earId of [0, 1]) {
    const earCells = candidates.filter((cell) => cell.earId === earId);
    if (earCells.length > 0) chosen.push(pickFrom(earCells).id);
  }
  const headCells = candidates.filter((cell) => cell.earId === undefined);
  if (headCells.length > 0) chosen.push(pickFrom(headCells).id);

  for (const cell of shuffle(candidates, rng)) {
    if (chosen.length >= 3) break;
    if (!chosen.includes(cell.id)) chosen.push(cell.id);
  }
  return chosen;
}

function measure(
  level: Level,
  config: FloorConfig,
  attempt: number,
  braidCount: number,
): LevelMetrics {
  const toFriend = bfsPath(level, level.startCell, level.friendCell);
  const toOrb = level.orbCell >= 0 ? bfsPath(level, level.startCell, level.orbCell) : [];
  const toExit = bfsPath(level, level.startCell, level.exitCell);
  return {
    cellCount: level.cells.length,
    deadEnds: deadEnds(level).length,
    pathToFriend: Math.max(0, toFriend.length - 1),
    pathToOrb: Math.max(0, toOrb.length - 1),
    pathToExit: Math.max(0, toExit.length - 1),
    braidCount,
    attempt,
  };
}

function validate(level: Level, config: FloorConfig): boolean {
  if (reachableCount(level, level.startCell) !== level.cells.length) return false;

  const keyCells = [
    level.startCell,
    level.exitCell,
    level.friendCell,
    level.orbCell,
    level.radarCell,
    ...level.coinCells,
    ...level.carrotCells,
  ].filter((id) => id >= 0);
  if (new Set(keyCells).size !== keyCells.length) return false;

  if (level.metrics.pathToFriend < 3) return false;
  if (level.metrics.pathToExit < 3) return false;

  const deadEndMin = config.deadEndMin ?? config.rings * 2.5;
  if (level.metrics.deadEnds < deadEndMin) return false;

  if (config.mission === "rescue") {
    if (level.orbCell !== 0) return false;
    if (level.radarCell >= 0) return false;
    if (level.coinCells.length !== 0) return false;
    if (level.metrics.pathToFriend < config.rings * 4) return false;
    if (level.metrics.pathToOrb < config.rings * 4) return false;
    if (level.metrics.pathToExit < config.rings * 3) return false;
  }

  if (config.mission === "coins") {
    const count = config.coinCount ?? 0;
    if (count <= 0 || level.coinCells.length !== count) return false;
    if (level.orbCell >= 0 || level.radarCell >= 0) return false;
    if (level.metrics.pathToFriend < config.rings * 4) return false;
    if (level.metrics.pathToExit < config.rings * 4) return false;
    if (level.coinChoices.length !== 4 || !level.coinChoices.includes(count)) return false;
    for (const coinCell of level.coinCells) {
      const cell = level.cells[coinCell];
      if (!cell || cell.kind !== "normal") return false;
      if (bfsPath(level, level.startCell, coinCell).length < 3) return false;
    }
  }

  if (config.mission === "code") {
    if (level.carrotCells.length !== 3) return false;
    if (level.carrotNumbers.length !== 3) return false;
    if (level.orbCell >= 0 || level.radarCell >= 0) return false;
    if (level.coinCells.length !== 0) return false;
    if (level.metrics.pathToFriend < config.rings * 3) return false;
    if (level.metrics.pathToExit < config.rings * 3) return false;
    if (!config.code || level.codeWord !== config.code.word) return false;
    if (level.codeChoices.length !== 3 || !level.codeChoices.includes(level.codeWord)) return false;
    const earsUsed = new Set<number>();
    let headCarrot = false;
    for (const carrotCell of level.carrotCells) {
      const cell = level.cells[carrotCell];
      if (!cell || (cell.kind !== "normal" && cell.kind !== "ear")) return false;
      if (cell.earId !== undefined) earsUsed.add(cell.earId);
      else headCarrot = true;
      if (bfsPath(level, level.startCell, carrotCell).length < 3) return false;
    }
    if (level.earShapes.length > 0 && (earsUsed.size < 2 || !headCarrot)) return false;
  }

  if (config.mission === "radar") {
    if (level.orbCell < 0 || level.radarCell < 0) return false;
    if (level.coinCells.length !== (config.coinCount ?? 3)) return false;
    if (level.metrics.pathToOrb < config.rings * 5) return false;
    if (bfsPath(level, level.startCell, level.radarCell).length - 1 < config.rings * 8) {
      return false;
    }
    if (level.metrics.pathToFriend < config.rings * 6) return false;
    if (level.cells[level.orbCell]?.kind === "start") return false;
    if (level.cells[level.orbCell]?.kind === "exit") return false;
    if (level.cells[level.orbCell]?.kind === "chamber") return false;

    const radar = level.cells[level.radarCell];
    if (!radar || radar.kind !== "normal") return false;
    if (bfsPath(level, level.startCell, level.radarCell).length < 3) return false;

    for (const coinCell of level.coinCells) {
      const cell = level.cells[coinCell];
      if (!cell || cell.kind !== "normal") return false;
      if (bfsPath(level, level.startCell, coinCell).length < 2) return false;
    }
  }

  return true;
}

function generateAttempt(
  config: FloorConfig,
  attempt: number,
  variant: number,
  runSeed: string,
): Level {
  const seed = runSeed
    ? `${config.seed}:run-${runSeed}:${attempt}`
    : variant === 0
      ? `${config.seed}:${attempt}`
      : `${config.seed}:replay-${variant}:${attempt}`;
  const rng = makeRng(seed, "maze");
  const rings = config.rings;
  const sectors = config.sectors ?? 24;
  const cells = buildCells(rings, sectors);
  const edges = buildEdges(cells, rings);

  const startOuter = nearestOuterCell(cells, rings, Math.PI);
  carve(cells, edges, startOuter.id, rng, config.newestChance ?? 0.8);
  const braidCount = braidMaze(cells, edges, config.braid, rng);

  let extraTop = 0;
  let headWallGaps: HeadWallGap[] = [];
  let earShapes: string[] = [];
  let earInnerShapes: string[] = [];
  if (config.bunny) {
    // Ears are appended after the head is carved: their long U-lanes are a
    // hand-authored template, not random cell-by-cell carving.
    const ears = addEars(cells, edges, rings);
    extraTop = ears.extraTop;
    headWallGaps = ears.headWallGaps;
    earShapes = ears.earShapes;
    earInnerShapes = ears.earInnerShapes;
  }

  const withPortals = addPortals(cells, edges, rings, rng, config);
  const level: Level = {
    version: 1,
    seed,
    floor: config.floor,
    mission: config.mission,
    rings,
    outerRadius: rings,
    cells: withPortals.cells,
    edges: withPortals.edges,
    portals: withPortals.portals,
    startCell: withPortals.startCell,
    exitCell: withPortals.exitCell,
    friendCell: withPortals.friendCell,
    orbCell: -1,
    radarCell: -1,
    coinCells: [],
    coinChoices: [],
    carrotCells: [],
    carrotNumbers: [],
    codeWord: config.code?.word ?? "",
    codeChoices: config.code?.choices ?? [],
    extraTop,
    headWallGaps,
    earShapes,
    earInnerShapes,
    orbStars: config.orbStars,
    metrics: {
      cellCount: 0,
      deadEnds: 0,
      pathToFriend: 0,
      pathToOrb: 0,
      pathToExit: 0,
      braidCount,
      attempt,
    },
  };

  level.orbCell = chooseOrbCell(level, config, rng);
  level.radarCell = chooseRadarCell(level, config, rng);
  level.coinCells = chooseCoinCells(level, config, rng);
  level.coinChoices = level.coinCells.length > 0 ? makeCoinChoices(level.coinCells.length, rng) : [];
  level.carrotCells = chooseCarrotCells(level, config, rng);
  level.carrotNumbers = config.code?.numbers.slice(0, level.carrotCells.length) ?? [];
  level.metrics = measure(level, config, attempt, braidCount);
  return level;
}

export function generateFloor(config: FloorConfig, variant = 0, runSeed = ""): Level {
  let last: Level | null = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const level = generateAttempt(config, attempt, variant, runSeed);
    last = level;
    if (validate(level, config)) return level;
  }
  if (last) return last;
  throw new Error(`Could not generate floor ${config.floor}`);
}

export function validateLevel(level: Level, config: FloorConfig): boolean {
  return validate(level, config);
}

export function walkPath(level: Level, from: number, to: number): number[] {
  return bfsPath(level, from, to);
}

export function openNeighborIds(level: Level, cellId: number): number[] {
  return getAdjacency(level)[cellId]
    .filter((entry) => entry.open)
    .map((entry) => entry.to);
}

export { CAPSULE_RADIUS, PORTAL_OFFSET };
