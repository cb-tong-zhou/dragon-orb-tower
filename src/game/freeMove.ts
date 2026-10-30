import type { Cell, Level } from "../generator/types";
import { capsuleOpening, CAPSULE_RADIUS, EAR_CORNER, PORTAL_OFFSET } from "../generator/generate";

/**
 * Sora's body radius in maze units. It matches the drawn token (Maze.tsx), so
 * what the player sees touching a wall is exactly what the collision stops.
 * Corridors and doorways on the theta grid are a full unit wide; the
 * narrowest lane (an ear column, 0.72) still leaves room on both sides.
 */
export const BODY_RADIUS = 0.25;

const TAU = Math.PI * 2;

/**
 * How far the ear doorway corridor reaches down into the head, in maze
 * units. The corridor bridges the gap between the ear's bottom edge and the
 * head rim so the connector cell is comfortably walkable.
 */
const EAR_DOOR_REACH = 1;

export interface Point {
  x: number;
  y: number;
}

export interface WallBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * A wall kept in its original shape. Arcs stay arcs instead of being chopped
 * into chords, so sliding round a curved corridor is perfectly smooth.
 */
export type Wall =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; box?: WallBox }
  | { kind: "arc"; cx: number; cy: number; radius: number; a0: number; a1: number; box?: WallBox };

export interface CapsuleArea {
  x: number;
  y: number;
  radius: number;
}

export interface EarArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
  corner: number;
  /** X-range of the connector cell that links this ear to the head maze. */
  door: { left: number; right: number } | null;
}

/**
 * The union of shapes Sora is allowed to stand on: the head disc, the portal
 * capsules on the rim, and the bunny ears with their doorway corridors.
 */
export interface PlayArea {
  headRadius: number;
  capsules: CapsuleArea[];
  ears: EarArea[];
}

export interface WallField {
  walls: Wall[];
  /** Outer boundary of the floor. Absent in hand-built test fields. */
  area?: PlayArea;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function roundedRectContains(
  rect: { left: number; top: number; right: number; bottom: number; corner: number },
  x: number,
  y: number,
): boolean {
  const cx = clamp(x, rect.left + rect.corner, rect.right - rect.corner);
  const cy = clamp(y, rect.top + rect.corner, rect.bottom - rect.corner);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= rect.corner * rect.corner;
}

/** True when the point sits somewhere on the playable paper. */
export function containPoint(area: PlayArea, x: number, y: number): boolean {
  if (x * x + y * y <= area.headRadius * area.headRadius) return true;
  for (const capsule of area.capsules) {
    const dx = x - capsule.x;
    const dy = y - capsule.y;
    if (dx * dx + dy * dy <= capsule.radius * capsule.radius) return true;
  }
  for (const ear of area.ears) {
    if (roundedRectContains(ear, x, y)) return true;
    if (ear.door && y >= ear.bottom && y <= ear.bottom + EAR_DOOR_REACH && x >= ear.door.left && x <= ear.door.right) {
      return true;
    }
  }
  return false;
}

/** Derive each ear's outer rectangle from its grid of cells. */
function earAreas(level: Level): EarArea[] {
  const groups = new Map<number, Cell[]>();
  for (const cell of level.cells) {
    if (cell.earId === undefined) continue;
    const list = groups.get(cell.earId);
    if (list) list.push(cell);
    else groups.set(cell.earId, [cell]);
  }

  const ears: EarArea[] = [];
  for (const [earId, cells] of groups) {
    const xs = Array.from(new Set(cells.map((cell) => cell.cx))).sort((a, b) => a - b);
    const ys = Array.from(new Set(cells.map((cell) => cell.cy))).sort((a, b) => a - b);
    // Step between column/row centres; matches the generator's fixed grid.
    const colStep = xs.length > 1 ? (xs[xs.length - 1] - xs[0]) / (xs.length - 1) : 0.72;
    const rowStep = ys.length > 1 ? (ys[ys.length - 1] - ys[0]) / (ys.length - 1) : 1.07;

    // The single connector cell is the portal edge that touches an ear cell.
    let door: EarArea["door"] = null;
    for (const edge of level.edges) {
      if (edge.kind !== "portal" || !edge.open) continue;
      const a = level.cells[edge.a];
      const b = level.cells[edge.b];
      const connector = a?.earId === earId ? a : b?.earId === earId ? b : null;
      if (!connector) continue;
      const left = connector.cx - colStep / 2;
      const right = connector.cx + colStep / 2;
      door = door
        ? { left: Math.min(door.left, left), right: Math.max(door.right, right) }
        : { left, right };
    }

    ears.push({
      left: xs[0] - colStep / 2,
      right: xs[xs.length - 1] + colStep / 2,
      top: ys[0] - rowStep / 2,
      bottom: ys[ys.length - 1] + rowStep / 2,
      corner: EAR_CORNER,
      door,
    });
  }
  return ears;
}

export function buildPlayArea(level: Level): PlayArea {
  return {
    headRadius: level.outerRadius,
    capsules: level.portals.map((portal) => {
      const cell = level.cells[portal.externalCell];
      return { x: cell.cx, y: cell.cy, radius: CAPSULE_RADIUS };
    }),
    ears: earAreas(level),
  };
}

interface AngleGap {
  a0: number;
  a1: number;
}

/** Normalise a gap to the [0, 2π) range, splitting it if it wraps past zero. */
function normalizeGap(a0: number, a1: number): AngleGap[] {
  const start = ((a0 % TAU) + TAU) % TAU;
  let end = ((a1 % TAU) + TAU) % TAU;
  if (end < start) end += TAU;
  if (end - start >= TAU - 1e-9) return [{ a0: 0, a1: TAU }];
  if (end <= TAU) return [{ a0: start, a1: end }];
  return [
    { a0: start, a1: TAU },
    { a0: 0, a1: end - TAU },
  ];
}

function mergeGaps(gaps: AngleGap[]): AngleGap[] {
  const list: AngleGap[] = [];
  for (const gap of gaps) list.push(...normalizeGap(gap.a0, gap.a1));
  list.sort((a, b) => a.a0 - b.a0);
  const merged: AngleGap[] = [];
  for (const gap of list) {
    const last = merged[merged.length - 1];
    if (last && gap.a0 <= last.a1 + 1e-9) last.a1 = Math.max(last.a1, gap.a1);
    else merged.push({ ...gap });
  }
  return merged;
}

/** Head-rim arcs with doorway gaps cut out where capsules and ears attach. */
function rimWalls(radius: number, gaps: AngleGap[]): Wall[] {
  const merged = mergeGaps(gaps);
  if (merged.length === 1 && merged[0].a0 <= 1e-9 && merged[0].a1 >= TAU - 1e-9) return [];
  const walls: Wall[] = [];
  let cursor = 0;
  for (const gap of merged) {
    if (gap.a0 > cursor + 1e-9) {
      walls.push({ kind: "arc", cx: 0, cy: 0, radius, a0: cursor, a1: gap.a0 });
    }
    cursor = Math.max(cursor, gap.a1);
  }
  if (cursor < TAU - 1e-9) walls.push({ kind: "arc", cx: 0, cy: 0, radius, a0: cursor, a1: TAU });
  return walls;
}

/**
 * Where a portal capsule overlaps the rim, the rim is left open. The gap's
 * endpoints sit exactly on the capsule circle, so capsule wall and rim wall
 * meet with no leak between them.
 */
function portalRimGap(headRadius: number, angle: number): AngleGap {
  const outer = headRadius + PORTAL_OFFSET;
  const reach =
    (headRadius * headRadius + outer * outer - CAPSULE_RADIUS * CAPSULE_RADIUS) /
    (2 * headRadius * outer);
  const half = Math.acos(clamp(reach, -1, 1));
  return { a0: angle - half, a1: angle + half };
}

/** The capsule bubble wall, matching the outline drawn in Maze.tsx. */
function capsuleWall(cell: { cx: number; cy: number; angle: number }, outerRadius: number): Wall {
  const opening = capsuleOpening(outerRadius);
  return {
    kind: "arc",
    cx: cell.cx,
    cy: cell.cy,
    radius: CAPSULE_RADIUS,
    a0: cell.angle + Math.PI + opening,
    a1: cell.angle + Math.PI - opening + TAU,
  };
}

/**
 * Outer walls of a bunny ear: the sides, the top, and the bottom with the
 * doorway left open. The ear sits on the head rim, so the doorway column is
 * the only way between the two.
 */
function earWalls(ear: EarArea): Wall[] {
  const r = ear.corner;
  const walls: Wall[] = [
    { kind: "line", x1: ear.left + r, y1: ear.top, x2: ear.right - r, y2: ear.top },
    { kind: "line", x1: ear.left, y1: ear.top + r, x2: ear.left, y2: ear.bottom - r },
    { kind: "line", x1: ear.right, y1: ear.top + r, x2: ear.right, y2: ear.bottom - r },
    { kind: "arc", cx: ear.left + r, cy: ear.top + r, radius: r, a0: Math.PI, a1: Math.PI * 1.5 },
    { kind: "arc", cx: ear.right - r, cy: ear.top + r, radius: r, a0: Math.PI * 1.5, a1: TAU },
    { kind: "arc", cx: ear.right - r, cy: ear.bottom - r, radius: r, a0: 0, a1: Math.PI / 2 },
    { kind: "arc", cx: ear.left + r, cy: ear.bottom - r, radius: r, a0: Math.PI / 2, a1: Math.PI },
  ];
  const doorLeft = ear.door?.left ?? ear.right - r;
  const doorRight = ear.door?.right ?? ear.right - r;
  if (doorLeft > ear.left + r) {
    walls.push({ kind: "line", x1: ear.left + r, y1: ear.bottom, x2: doorLeft, y2: ear.bottom });
  }
  if (doorRight < ear.right - r) {
    walls.push({ kind: "line", x1: doorRight, y1: ear.bottom, x2: ear.right - r, y2: ear.bottom });
  }
  return walls;
}

export interface BuildWallsOptions {
  /** Include the outer boundary (rim, capsules, ears). Defaults to true. */
  boundary?: boolean;
}

/**
 * Build the collision field: every closed maze wall, plus the floor's outer
 * boundary, plus the play area used as a last-resort containment net.
 */
export function buildWalls(level: Level, options: BuildWallsOptions = {}): WallField {
  const walls: Wall[] = [];
  for (const edge of level.edges) {
    if (edge.open) continue;
    const wall = edge.wall;
    if (wall.type === "line") {
      walls.push({ kind: "line", x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 });
    } else if (wall.type === "arc") {
      walls.push({
        kind: "arc",
        cx: 0,
        cy: 0,
        radius: wall.radius,
        a0: wall.a0,
        a1: wall.a1,
      });
    }
  }
  if (options.boundary === false) return { walls: withBoxes(walls) };

  const area = buildPlayArea(level);
  const gaps: AngleGap[] = level.portals.map((portal) =>
    portalRimGap(level.outerRadius, portal.angle),
  );
  gaps.push(...level.headWallGaps);
  walls.push(...rimWalls(level.outerRadius, gaps));
  for (const portal of level.portals) {
    walls.push(capsuleWall(level.cells[portal.externalCell], level.outerRadius));
  }
  for (const ear of area.ears) {
    walls.push(...earWalls(ear));
  }
  return { walls: withBoxes(walls), area };
}

/** Angular span of an arc, tolerant of angles that wrap past 2π. */
export function arcSpan(a0: number, a1: number): number {
  const raw = a1 - a0;
  if (raw >= TAU - 1e-9) return TAU;
  return ((raw % TAU) + TAU) % TAU;
}

/** Bounding box of a wall, used to skip distant walls during collision tests. */
function wallBox(wall: Wall): WallBox {
  if (wall.kind === "line") {
    return {
      minX: Math.min(wall.x1, wall.x2),
      minY: Math.min(wall.y1, wall.y2),
      maxX: Math.max(wall.x1, wall.x2),
      maxY: Math.max(wall.y1, wall.y2),
    };
  }

  const span = arcSpan(wall.a0, wall.a1);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (angle: number) => {
    const x = wall.cx + Math.cos(angle) * wall.radius;
    const y = wall.cy + Math.sin(angle) * wall.radius;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  add(wall.a0);
  add(wall.a0 + span);
  for (let quarter = 0; quarter < 4; quarter++) {
    const angle = (quarter * Math.PI) / 2;
    const relative = ((angle - wall.a0) % TAU + TAU) % TAU;
    if (relative > 1e-9 && relative < span - 1e-9) add(angle);
  }
  return { minX, minY, maxX, maxY };
}

function withBoxes(walls: Wall[]): Wall[] {
  for (const wall of walls) wall.box = wallBox(wall);
  return walls;
}

function angleOnArc(angle: number, a0: number, a1: number): boolean {
  const span = arcSpan(a0, a1);
  const relative = ((angle - a0) % TAU + TAU) % TAU;
  return relative <= span + 1e-9;
}

/** Closest point on a wall to p. */
export function closestPointOnWall(wall: Wall, x: number, y: number): Point {
  if (wall.kind === "line") {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const length2 = dx * dx + dy * dy;
    let t = length2 > 0 ? ((x - wall.x1) * dx + (y - wall.y1) * dy) / length2 : 0;
    t = Math.max(0, Math.min(1, t));
    return { x: wall.x1 + dx * t, y: wall.y1 + dy * t };
  }

  const dx = x - wall.cx;
  const dy = y - wall.cy;
  const distance = Math.hypot(dx, dy);
  if (distance < 1e-9) {
    const middle = wall.a0 + arcSpan(wall.a0, wall.a1) / 2;
    return {
      x: wall.cx + Math.cos(middle) * wall.radius,
      y: wall.cy + Math.sin(middle) * wall.radius,
    };
  }

  const angle = Math.atan2(dy, dx);
  if (angleOnArc(angle, wall.a0, wall.a1)) {
    return {
      x: wall.cx + Math.cos(angle) * wall.radius,
      y: wall.cy + Math.sin(angle) * wall.radius,
    };
  }

  const p0 = {
    x: wall.cx + Math.cos(wall.a0) * wall.radius,
    y: wall.cy + Math.sin(wall.a0) * wall.radius,
  };
  const p1 = {
    x: wall.cx + Math.cos(wall.a1) * wall.radius,
    y: wall.cy + Math.sin(wall.a1) * wall.radius,
  };
  const d0 = Math.hypot(x - p0.x, y - p0.y);
  const d1 = Math.hypot(x - p1.x, y - p1.y);
  return d0 <= d1 ? p0 : p1;
}

/** Push-out direction when the circle sits exactly on a wall. */
function wallNormal(wall: Wall, x: number, y: number): Point {
  if (wall.kind === "arc") {
    const dx = x - wall.cx;
    const dy = y - wall.cy;
    const length = Math.hypot(dx, dy);
    if (length > 1e-9) return { x: dx / length, y: dy / length };
    return { x: 1, y: 0 };
  }
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const length = Math.hypot(dx, dy);
  if (length < 1e-9) return { x: 1, y: 0 };
  return { x: -dy / length, y: dx / length };
}

/** True when a circle at (x, y) overlaps any wall or leaves the play area. */
export function collides(field: WallField, x: number, y: number, radius = BODY_RADIUS): boolean {
  if (field.area && !containPoint(field.area, x, y)) return true;
  for (const wall of field.walls) {
    const box = wall.box;
    if (
      box &&
      (x < box.minX - radius ||
        x > box.maxX + radius ||
        y < box.minY - radius ||
        y > box.maxY + radius)
    ) {
      continue;
    }
    const point = closestPointOnWall(wall, x, y);
    if (Math.hypot(x - point.x, y - point.y) < radius) return true;
  }
  return false;
}

export interface MoveResult {
  point: Point;
  /** How far the circle actually travelled. Zero when a wall blocked it. */
  distance: number;
  touched: boolean;
}

/**
 * Move a circle by `delta`, sliding along walls. The movement is split into
 * sub-steps shorter than the body radius so it can never tunnel through a
 * wall, and arcs are pushed out radially so curved corridors stay smooth.
 */
export function moveCircle(
  field: WallField,
  from: Point,
  delta: Point,
  radius = BODY_RADIUS,
): MoveResult {
  const length = Math.hypot(delta.x, delta.y);
  if (length < 1e-12) return { point: { ...from }, distance: 0, touched: false };

  // Short sub-steps: half a body radius. A lag spike cannot skip a wall.
  const steps = Math.max(1, Math.ceil(length / (radius * 0.5)));
  const stepX = delta.x / steps;
  const stepY = delta.y / steps;

  let x = from.x;
  let y = from.y;
  let touched = false;

  for (let step = 0; step < steps; step++) {
    const beforeX = x;
    const beforeY = y;
    x += stepX;
    y += stepY;

    // Resolve contact with up to four walls meeting at a corner.
    for (let pass = 0; pass < 5; pass++) {
      let pushed = false;
      for (const wall of field.walls) {
        const box = wall.box;
        if (
          box &&
          (x < box.minX - radius ||
            x > box.maxX + radius ||
            y < box.minY - radius ||
            y > box.maxY + radius)
        ) {
          continue;
        }
        const point = closestPointOnWall(wall, x, y);
        let dx = x - point.x;
        let dy = y - point.y;
        let distance = Math.hypot(dx, dy);
        if (distance >= radius - 1e-9) continue;

        touched = true;
        if (distance < 1e-7) {
          const normal = wallNormal(wall, x, y);
          dx = normal.x;
          dy = normal.y;
          distance = 1;
        }
        const push = (radius - distance) / distance;
        x += dx * push;
        y += dy * push;
        pushed = true;
      }
      if (!pushed) break;
    }

    // If a pathological corner is still blocked, refuse this sub-step.
    if (collides(field, x, y, radius)) {
      x = beforeX;
      y = beforeY;
      break;
    }
  }

  return {
    point: { x, y },
    distance: Math.hypot(x - from.x, y - from.y),
    touched,
  };
}

/**
 * Steering angles tried when the straight path is blocked. Small deviations
 * only: this aligns Sora with a corridor he is scraping, it never decides to
 * take a turning on his behalf.
 */
const ASSIST_ANGLES = [9, -9, 17, -17, 25, -25];

/**
 * One frame of steering. The direct heading is used unless a small rotation
 * makes noticeably more forward progress, which gives a gentle "magnetic"
 * feel when Sora brushes a wall at an angle.
 */
export function steerMove(
  field: WallField,
  from: Point,
  direction: Point,
  distance: number,
  radius = BODY_RADIUS,
): { point: Point; distance: number; touched: boolean } {
  const direct = moveCircle(
    field,
    from,
    { x: direction.x * distance, y: direction.y * distance },
    radius,
  );
  const directProgress = (direct.point.x - from.x) * direction.x + (direct.point.y - from.y) * direction.y;
  if (directProgress > distance * 0.9) return direct;

  let best = direct;
  let bestScore = directProgress;

  for (const degrees of ASSIST_ANGLES) {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const heading = {
      x: direction.x * cos - direction.y * sin,
      y: direction.x * sin + direction.y * cos,
    };
    const moved = moveCircle(
      field,
      from,
      { x: heading.x * distance, y: heading.y * distance },
      radius,
    );
    const progress = (moved.point.x - from.x) * direction.x + (moved.point.y - from.y) * direction.y;
    // Strong preference for straight ahead: only a clearly better angle wins.
    const score = progress - Math.abs(degrees) * 0.0018;
    if (score > bestScore + 1e-9) {
      best = moved;
      bestScore = score;
    }
  }

  // Head-on wall: don't drift sideways on our own, just stop.
  const bestProgress = (best.point.x - from.x) * direction.x + (best.point.y - from.y) * direction.y;
  if (bestProgress < distance * 0.12) return direct;
  return best;
}

/**
 * Push a circle out of every wall it overlaps. Used to keep tap targets (and
 * route points) clear of walls even when the player taps right against one.
 */
export function pushOutOfWalls(
  field: WallField,
  point: Point,
  radius = BODY_RADIUS,
): Point {
  let x = point.x;
  let y = point.y;
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (const wall of field.walls) {
      const box = wall.box;
      if (
        box &&
        (x < box.minX - radius ||
          x > box.maxX + radius ||
          y < box.minY - radius ||
          y > box.maxY + radius)
      ) {
        continue;
      }
      const closest = closestPointOnWall(wall, x, y);
      let dx = x - closest.x;
      let dy = y - closest.y;
      let distance = Math.hypot(dx, dy);
      if (distance >= radius - 1e-9) continue;
      if (distance < 1e-7) {
        const normal = wallNormal(wall, x, y);
        dx = normal.x;
        dy = normal.y;
        distance = 1;
      }
      const push = (radius - distance) / distance + 1e-4;
      x += dx * push;
      y += dy * push;
      moved = true;
    }
    if (!moved) break;
  }
  return { x, y };
}

/** Cell whose centre is closest to a point. */
export function nearestCellId(level: Level, point: Point): number {
  let best = level.cells[0].id;
  let bestDistance = Infinity;
  for (const cell of level.cells) {
    const distance = Math.hypot(cell.cx - point.x, cell.cy - point.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = cell.id;
    }
  }
  return best;
}
