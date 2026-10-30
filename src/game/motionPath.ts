import type { Cell, Level } from "../generator/types";
import { bfsPath } from "../generator/graph";
import { openNeighborIds } from "../generator/generate";
import {
  collides,
  containPoint,
  nearestCellId,
  pushOutOfWalls,
  BODY_RADIUS,
  type Point,
  type WallField,
} from "./freeMove";

/**
 * Furthest walk, in maze units, a single tap may ask for. The length is
 * measured along the corridors from Sora's exact position, so taps that look
 * close but sit behind a wall are rejected instead of being auto-walked
 * around. Taps farther than this do nothing, so the player cannot hand the
 * whole route to the walker by spamming the exit.
 */
export const TAP_REACH = 8;

/**
 * Clearance a planned walk keeps from every wall. It is deliberately the body
 * radius (minus a hair for floating point) rather than a token value: Sora's
 * whole body must stay out of the walls, not just the point at his centre, or
 * the token visibly sinks into the ink as he walks.
 */
const WALK_CLEARANCE = BODY_RADIUS - 0.002;

/**
 * Radius of a fingertip on glass, in CSS pixels. A tap is read as "somewhere
 * under my finger", never as one exact pixel: on a phone a whole floor is
 * squeezed into ~375px, so one fingertip covers three to five corridors.
 */
export const FINGER_RADIUS_PX = 22;

/**
 * How much each unit of walking counts against a candidate, relative to a
 * unit of distance from the fingertip's centre. Small: the corridor under the
 * middle of the finger wins, and walking only breaks near-ties, such as a
 * finger resting on a wall between Sora's corridor and one far behind it.
 */
const WALK_WEIGHT = 0.1;

export interface TapTarget {
  cellId: number;
  point: Point;
}

/**
 * Walking distance from Sora's exact position to every cell centre within
 * `limit`, along open doors (Dijkstra over cell centres).
 */
function walkDistances(level: Level, from: Point, limit: number): Map<number, number> {
  // Measured like routeDistance: from Sora's exact position straight to the
  // next cell centre, so the picker and the reach gate always agree.
  const start = nearestCellId(level, from);
  const best = new Map<number, number>([[start, 0]]);
  const queue: Array<[number, number]> = [[start, 0]];
  while (queue.length > 0) {
    let pick = 0;
    for (let index = 1; index < queue.length; index++) {
      if (queue[index][1] < queue[pick][1]) pick = index;
    }
    const [id, walked] = queue.splice(pick, 1)[0];
    if (walked > (best.get(id) ?? Infinity)) continue;
    const cell = level.cells[id];
    if (!cell) continue;
    const origin = id === start ? from : { x: cell.cx, y: cell.cy };
    for (const next of openNeighborIds(level, id)) {
      const other = level.cells[next];
      if (!other) continue;
      const total = walked + distance(origin, { x: other.cx, y: other.cy });
      if (total > limit || total >= (best.get(next) ?? Infinity)) continue;
      best.set(next, total);
      queue.push([next, total]);
    }
  }
  return best;
}

/**
 * Turn a fingertip press into the spot Sora should walk to. Every reachable
 * corridor under the finger is a candidate; the one nearest the fingertip's
 * centre wins, with walk length breaking near-ties, so a tap that half-covers
 * a wall goes to the open side instead of detouring round to the cell behind. Returns null when nothing under
 * the finger is within one tap's reach: spamming a far spot (the exit) must
 * not walk the maze for the player.
 */
export function pickTapTarget(
  level: Level,
  from: Point,
  tap: Point,
  fingerRadius: number,
  reach = TAP_REACH,
): TapTarget | null {
  const reachable = walkDistances(level, from, reach);
  const under = nearestCellId(level, tap);

  let bestId = -1;
  let bestScore = Infinity;
  for (const [id, walked] of reachable) {
    const cell = level.cells[id];
    if (!cell) continue;
    const off = distance(tap, { x: cell.cx, y: cell.cy });
    if (off > fingerRadius && id !== under) continue;
    const score = off + walked * WALK_WEIGHT;
    if (score < bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  if (bestId >= 0) {
    const cell = level.cells[bestId];
    // The cell right under the finger keeps the exact pixel; a neighbour
    // chosen for the player gets its calm centre.
    const point = bestId === under ? { x: tap.x, y: tap.y } : { x: cell.cx, y: cell.cy };
    return { cellId: bestId, point };
  }

  return null;
}

/** True when a corridor walk of `distance` fits inside one tap's reach. */
export function withinTapReach(distance: number, limit = TAP_REACH): boolean {
  return distance <= limit + 1e-6;
}

/**
 * Length of the corridor walk from Sora's exact position through the centres
 * of the cells in a BFS route. Mirrors `routeToPoints` so the tap gate and the
 * route the player actually walks agree.
 */
export function routeDistance(level: Level, route: number[], from: Point): number {
  let total = 0;
  let previous = from;
  for (let index = 1; index < route.length; index++) {
    const cell = level.cells[route[index]];
    if (!cell) continue;
    const next = { x: cell.cx, y: cell.cy };
    total += distance(previous, next);
    previous = next;
  }
  return total;
}

/** A polyline with cumulative lengths, ready to be walked by distance. */
export interface Polyline {
  points: Point[];
  lengths: number[];
  total: number;
}

export interface PathSample {
  point: Point;
  direction: Point;
}

const EPSILON = 1e-6;

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function dedupe(points: Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const previous = result[result.length - 1];
    if (!previous || distance(previous, point) > EPSILON) result.push(point);
  }
  return result;
}

/**
 * Turn a BFS cell route into a path of cell centres that starts at Sora's
 * actual position, not the centre of the cell he happens to be in.
 */
export function routeToPoints(level: Level, route: number[], from: Point): Point[] {
  const points: Point[] = [from];
  for (let index = 1; index < route.length; index++) {
    const cell = level.cells[route[index]];
    if (!cell) continue;
    points.push({ x: cell.cx, y: cell.cy });
  }
  return dedupe(points);
}

/**
 * Round the corners of a cell-centre path with short quadratic fillets. The
 * corridor is a full unit wide, so a 0.3-unit fillet always stays inside it.
 */
export function roundCorners(points: Point[], radius = 0.3): Point[] {
  const cleaned = dedupe(points);
  if (cleaned.length < 3) return cleaned;

  const result: Point[] = [cleaned[0]];

  for (let index = 1; index < cleaned.length - 1; index++) {
    const previous = cleaned[index - 1];
    const corner = cleaned[index];
    const next = cleaned[index + 1];

    const inLength = distance(previous, corner);
    const outLength = distance(corner, next);
    if (inLength < EPSILON || outLength < EPSILON) continue;

    const inDir = {
      x: (previous.x - corner.x) / inLength,
      y: (previous.y - corner.y) / inLength,
    };
    const outDir = {
      x: (next.x - corner.x) / outLength,
      y: (next.y - corner.y) / outLength,
    };

    // Nearly straight: no fillet needed.
    const turn = inDir.x * outDir.x + inDir.y * outDir.y;
    if (turn < -0.985) {
      result.push({ ...corner });
      continue;
    }

    const cut = Math.min(radius, inLength * 0.45, outLength * 0.45);
    const start = { x: corner.x + inDir.x * cut, y: corner.y + inDir.y * cut };
    const end = { x: corner.x + outDir.x * cut, y: corner.y + outDir.y * cut };

    result.push(start);

    // Four samples of the quadratic Bézier start → corner → end.
    const samples = 4;
    for (let step = 1; step <= samples; step++) {
      const t = step / samples;
      const oneMinus = 1 - t;
      result.push({
        x: oneMinus * oneMinus * start.x + 2 * oneMinus * t * corner.x + t * t * end.x,
        y: oneMinus * oneMinus * start.y + 2 * oneMinus * t * corner.y + t * t * end.y,
      });
    }
  }

  result.push(cleaned[cleaned.length - 1]);
  return dedupe(result);
}

/** Precompute segment lengths so sampling is a lookup, not a scan. */
export function makePolyline(points: Point[]): Polyline {
  const cleaned = dedupe(points);
  const lengths: number[] = [];
  let total = 0;
  for (let index = 1; index < cleaned.length; index++) {
    const length = distance(cleaned[index - 1], cleaned[index]);
    lengths.push(length);
    total += length;
  }
  return { points: cleaned, lengths, total };
}

function pointOnCircle(radius: number, angle: number): Point {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

/**
 * A point deep inside a cell that is safe to route through. Polar cells use
 * the middle of their annulus at their mid-angle (which is their centre);
 * ears and portal capsules use their centre too. Cell centres are always
 * clear of walls, so this is the reliable way into a cell after a doorway.
 */
function cellSafePoint(cell: Cell): Point {
  return { x: cell.cx, y: cell.cy };
}

/** Middle of the open edge between two cells: the doorway a route crosses. */
export function doorPoint(level: Level, firstId: number, secondId: number): Point {
  const edge = level.edges.find(
    (candidate) =>
      candidate.open &&
      ((candidate.a === firstId && candidate.b === secondId) ||
        (candidate.a === secondId && candidate.b === firstId)),
  );
  const wall = edge?.wall;
  if (wall?.type === "line") {
    const r1 = Math.hypot(wall.x1, wall.y1);
    const r2 = Math.hypot(wall.x2, wall.y2);
    const radial =
      Math.abs(r1 - r2) > 0.5 &&
      Math.abs(Math.atan2(wall.y1, wall.x1) - Math.atan2(wall.y2, wall.x2)) < 1e-6;
    if (radial) {
      // A tangential doorway is a radial line between two rings. Cross it
      // three quarters of the way out: the straight legs from the neighbouring
      // cell centres then bow outward and keep Sora's whole body off the
      // inner arc. Crossing at the midpoint makes those legs sag toward the
      // inner wall, which grazes the body on wide growing-sector cells.
      const inner = r1 <= r2 ? { x: wall.x1, y: wall.y1 } : { x: wall.x2, y: wall.y2 };
      const outer = r1 <= r2 ? { x: wall.x2, y: wall.y2 } : { x: wall.x1, y: wall.y1 };
      return { x: inner.x + (outer.x - inner.x) * 0.75, y: inner.y + (outer.y - inner.y) * 0.75 };
    }
    return { x: (wall.x1 + wall.x2) / 2, y: (wall.y1 + wall.y2) / 2 };
  }
  if (wall?.type === "arc") {
    return pointOnCircle(wall.radius, (wall.a0 + wall.a1) / 2);
  }
  const first = level.cells[firstId];
  const second = level.cells[secondId];
  if (first && second) {
    return { x: (first.cx + second.cx) / 2, y: (first.cy + second.cy) / 2 };
  }
  return first ? { x: first.cx, y: first.cy } : { x: 0, y: 0 };
}

function sameRingNeighbours(a: Cell, b: Cell): boolean {
  return a.kind === "normal" && b.kind === "normal" && a.ring >= 1 && a.ring === b.ring;
}

/**
 * Waypoints through the doorway between the head and a bunny ear: along the
 * outer ring at mid-depth to the doorway's angle, then out through the middle
 * of the rim gap. The ear sits right on the rim, so cutting straight between
 * the two cell centres would clip the rim or the ear's bottom wall. Null when
 * the two cells are not a head/ear pair.
 */
function earDoorway(level: Level, from: Cell, to: Cell): Point[] | null {
  const ear = from.earId !== undefined ? from : to.earId !== undefined ? to : null;
  const head = ear === from ? to : from;
  if (!ear || head.earId !== undefined || head.kind !== "normal") return null;

  const earAngle = Math.atan2(ear.cy, ear.cx);
  let gapMiddle: number | null = null;
  let closest = Infinity;
  for (const gap of level.headWallGaps) {
    const middle = (gap.a0 + gap.a1) / 2;
    const off = Math.abs(Math.atan2(Math.sin(middle - earAngle), Math.cos(middle - earAngle)));
    if (off < closest) {
      closest = off;
      gapMiddle = middle;
    }
  }
  if (gapMiddle === null) return null;

  const depth = (head.r0 + head.r1) / 2;
  let delta = gapMiddle - head.angle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const steps = Math.max(1, Math.ceil((Math.abs(delta) * depth) / 0.2));
  const points: Point[] = [];
  for (let step = 1; step <= steps; step++) {
    points.push(pointOnCircle(depth, head.angle + (delta * step) / steps));
  }
  points.push(pointOnCircle(level.outerRadius, gapMiddle));
  return from === head ? points : points.reverse();
}

/** Points along the mid-depth arc between two neighbouring ring cells, ends excluded. */
function ringArc(from: Cell, to: Cell): Point[] {
  const radius = (from.r0 + from.r1) / 2;
  let delta = to.angle - from.angle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const steps = Math.max(2, Math.ceil((Math.abs(delta) * radius) / 0.2));
  const points: Point[] = [];
  for (let step = 1; step < steps; step++) {
    points.push(pointOnCircle(radius, from.angle + (delta * step) / steps));
  }
  return points;
}

/**
 * True when a walk keeps the whole body clear of every wall. Samples fine
 * enough that a wall crossing cannot slip between two probes.
 */
function lineClear(field: WallField, from: Point, to: Point): boolean {
  const length = distance(from, to);
  const steps = Math.max(1, Math.ceil(length / 0.05));
  for (let index = 0; index <= steps; index++) {
    const ratio = index / steps;
    const x = from.x + (to.x - from.x) * ratio;
    const y = from.y + (to.y - from.y) * ratio;
    if (collides(field, x, y, WALK_CLEARANCE)) return false;
  }
  return true;
}

/** True when every segment of a polyline keeps the body clear of walls. */
function polylineClear(field: WallField, points: Point[]): boolean {
  for (let index = 1; index < points.length; index++) {
    if (!lineClear(field, points[index - 1], points[index])) return false;
  }
  return true;
}

/**
 * Turn a BFS route into a walk that finishes on the exact tapped point. It
 * passes through every shared doorway and cell centre, so each straight leg
 * stays inside one cell of the polar grid. Walking straight between the
 * centres of two neighbouring ring cells would otherwise cut the inside of
 * the curved corridor.
 */
export function routeToPoint(
  level: Level,
  route: number[],
  from: Point,
  target: Point,
  field?: WallField,
): Point[] {
  const points: Point[] = [from];
  const targetCell = level.cells[route[route.length - 1]];
  if (!targetCell) {
    points.push(target);
    return dedupe(points);
  }

  if (route.length < 2) {
    // The tap is in Sora's own cell. The cell is convex, so a straight line
    // is normally clear; if a wall does sit across it, route through the
    // centre rather than hugging the cell edge.
    if (field && !lineClear(field, from, target)) {
      const safe = cellSafePoint(targetCell);
      if (distance(from, safe) > 1e-4 && distance(safe, target) > 1e-4) {
        points.push(safe);
      }
    }
    points.push(target);
    return dedupe(points);
  }

  for (let index = 1; index < route.length; index++) {
    const previous = level.cells[route[index - 1]];
    const cell = level.cells[route[index]];
    if (!previous || !cell) continue;

    const door = doorPoint(level, previous.id, cell.id);
    const earDoor = earDoorway(level, previous, cell);
    if (earDoor) {
      points.push(...earDoor);
    } else if (sameRingNeighbours(previous, cell)) {
      // Along a ring corridor, follow its curve at mid-depth instead of
      // zig-zagging through the doorway line.
      points.push(...ringArc(previous, cell));
    } else {
      points.push(door);
    }

    if (index < route.length - 1) {
      points.push(cellSafePoint(cell));
      continue;
    }

    // From the final doorway the tap is inside one cell. Go straight to the
    // pixel when possible; otherwise step via the cell centre, which is
    // always in open space and keeps the body off every wall.
    if (field && !lineClear(field, door, target)) {
      const safe = cellSafePoint(cell);
      if (distance(door, safe) > 1e-4 && distance(safe, target) > 1e-4) {
        points.push(safe);
      }
    }
  }
  points.push(target);
  return dedupe(points);
}

export interface TapPath {
  /** Cell route used by the walk; empty for a straight pixel walk. */
  route: number[];
  line: Polyline;
}

/**
 * Plan the walk for one tap. A tap in clear sight walks straight to the exact
 * pixel; a tap around a wall follows the corridors and still finishes on the
 * exact pixel. Returns null when the tap asks for no movement.
 */
export function planTapPath(
  level: Level,
  field: WallField,
  from: Point,
  target: Point,
  targetCellId: number | null = null,
): TapPath | null {
  const targetCell = targetCellId ?? nearestCellId(level, target);
  const cell = level.cells[targetCell];
  let destination = { x: target.x, y: target.y };

  if (field.area && !containPoint(field.area, destination.x, destination.y)) {
    if (!cell) return null;
    destination = { x: cell.cx, y: cell.cy };
  } else {
    // Taps right against a wall would put Sora's body inside it. Nudge the
    // destination into open space instead of rejecting the tap or clipping.
    destination = pushOutOfWalls(field, destination, BODY_RADIUS + 0.004);
    if (collides(field, destination.x, destination.y, WALK_CLEARANCE)) {
      if (!cell) return null;
      destination = { x: cell.cx, y: cell.cy };
    }
  }

  if (distance(from, destination) < 1e-4) return null;

  if (lineClear(field, from, destination)) {
    return { route: [], line: makePolyline([from, destination]) };
  }

  const fromCell = nearestCellId(level, from);
  const route = bfsPath(level, fromCell, targetCell);
  if (route.length === 0) return null;

  // Round corners only as much as the corridor allows: a 0.3-unit fillet fits
  // a wide ring corridor but can shave a wall in a narrow ear lane.
  const raw = routeToPoint(level, route, from, destination, field);
  let line = makePolyline(roundCorners(raw, 0.3));
  if (!polylineClear(field, line.points)) {
    line = makePolyline(roundCorners(raw, 0.16));
  }
  if (!polylineClear(field, line.points)) {
    line = makePolyline(roundCorners(raw, 0.08));
  }
  if (!polylineClear(field, line.points)) {
    line = makePolyline(raw);
  }
  if (!polylineClear(field, line.points)) return null;
  if (line.total < 1e-4) return null;
  return { route, line };
}

/** Point and heading at `distance` along the polyline. */
export function samplePolyline(line: Polyline, distanceAlong: number): PathSample {
  const { points, lengths, total } = line;
  if (points.length < 2) {
    return {
      point: points[0] ?? { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
  }

  const target = Math.max(0, Math.min(total, distanceAlong));
  let travelled = 0;

  for (let index = 0; index < lengths.length; index++) {
    const length = lengths[index];
    if (travelled + length >= target || index === lengths.length - 1) {
      const from = points[index];
      const to = points[index + 1];
      const ratio = length > EPSILON ? Math.max(0, Math.min(1, (target - travelled) / length)) : 1;
      const direction =
        length > EPSILON
          ? { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
          : { x: 1, y: 0 };
      return {
        point: {
          x: from.x + (to.x - from.x) * ratio,
          y: from.y + (to.y - from.y) * ratio,
        },
        direction,
      };
    }
    travelled += length;
  }

  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const length = distance(previous, last) || 1;
  return {
    point: { ...last },
    direction: { x: (last.x - previous.x) / length, y: (last.y - previous.y) / length },
  };
}

/**
 * Speed for a route that eases in at the start and brakes exactly onto the last
 * point, so tapping a far cell never starts or ends with a jerk.
 */
export function routeSpeed(
  current: number,
  remaining: number,
  dt: number,
  cruise: number,
  acceleration: number,
  braking: number,
): number {
  const speedUp = Math.min(cruise, current + acceleration * dt);
  const slowDown = Math.sqrt(Math.max(0, 2 * braking * Math.max(0, remaining)));
  return Math.max(0, Math.min(speedUp, slowDown, cruise));
}
