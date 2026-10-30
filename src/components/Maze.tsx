import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { getCharacter, type Character } from "../content/characters";
import type { Cell, Edge, Level, Wall } from "../generator/types";
import { capsuleOpening, CAPSULE_RADIUS, openNeighborIds, PORTAL_OFFSET } from "../generator/generate";
import { nearestCellId } from "../game/freeMove";
import type { GremlinToken, PartyToken, ScoutHighlight, ScoutMark } from "./mazeTypes";
import { AvatarGlyph } from "./CharacterAvatar";
import { DragonCarrotGlyph } from "./DragonCarrot";
import { DragonCoinGlyph } from "./DragonCoin";
import { DragonOrbGlyph } from "./DragonOrb";
import { DragonRadarGlyph } from "./DragonRadar";
import { GremlinLayer } from "./GremlinLayer";
import { ScoutLayer } from "./ScoutLayer";

const INK = "#231A15";
const PAPER = "#FFF6E2";
const TWO_PI = Math.PI * 2;

function pointAt(radius: number, angle: number): [number, number] {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function arcPath(radius: number, a0: number, a1: number): string {
  const [x0, y0] = pointAt(radius, a0);
  const [x1, y1] = pointAt(radius, a1);
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0.toFixed(4)} ${y0.toFixed(4)} A ${radius} ${radius} 0 ${largeArc} 1 ${x1.toFixed(4)} ${y1.toFixed(4)}`;
}

const MERGE_EPS = 1e-6;

interface Interval {
  start: number;
  end: number;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [{ ...sorted[0] }];
  for (const interval of sorted.slice(1)) {
    const current = merged[merged.length - 1];
    if (interval.start <= current.end + MERGE_EPS) {
      current.end = Math.max(current.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

function normalizeAngle(angle: number): number {
  const wrapped = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
  return wrapped > TWO_PI - MERGE_EPS ? 0 : wrapped;
}

/**
 * Hand-drawn mazes use long continuous walls. A cell-edge renderer produces
 * hundreds of tiny segments, so combine touching collinear edges into one
 * path before drawing. Gameplay still uses the original edge graph.
 */
function mergeWallPaths(edges: Edge[], ear: boolean): string[] {
  const arcs = new Map<number, Interval[]>();
  const radials = new Map<string, { angle: number; intervals: Interval[] }>();
  const straights = new Map<string, { axis: "h" | "v"; coord: number; intervals: Interval[] }>();
  const loose: Wall[] = [];

  for (const edge of edges) {
    if (edge.open || edge.wall.type === "none") continue;
    if ((edge.kind === "ear") !== ear) continue;
    const wall = edge.wall;

    if (wall.type === "arc") {
      const intervals = arcs.get(wall.radius) ?? [];
      intervals.push({ start: wall.a0, end: wall.a1 });
      arcs.set(wall.radius, intervals);
      continue;
    }

    if (wall.type === "line") {
      const angle1 = Math.atan2(wall.y1, wall.x1);
      const angle2 = Math.atan2(wall.y2, wall.x2);
      const r1 = Math.hypot(wall.x1, wall.y1);
      const r2 = Math.hypot(wall.x2, wall.y2);
      const sameRay =
        r1 > MERGE_EPS &&
        r2 > MERGE_EPS &&
        Math.abs(Math.sin(angle1 - angle2)) < MERGE_EPS &&
        Math.cos(angle1 - angle2) > 0;

      if (sameRay) {
        const angle = normalizeAngle(angle1);
        const key = angle.toFixed(6);
        const group = radials.get(key) ?? { angle, intervals: [] };
        group.intervals.push({
          start: Math.min(r1, r2),
          end: Math.max(r1, r2),
        });
        radials.set(key, group);
      } else if (Math.abs(wall.y1 - wall.y2) < MERGE_EPS) {
        const coord = wall.y1;
        const key = `h:${coord.toFixed(6)}`;
        const group = straights.get(key) ?? { axis: "h" as const, coord, intervals: [] };
        group.intervals.push({
          start: Math.min(wall.x1, wall.x2),
          end: Math.max(wall.x1, wall.x2),
        });
        straights.set(key, group);
      } else if (Math.abs(wall.x1 - wall.x2) < MERGE_EPS) {
        const coord = wall.x1;
        const key = `v:${coord.toFixed(6)}`;
        const group = straights.get(key) ?? { axis: "v" as const, coord, intervals: [] };
        group.intervals.push({
          start: Math.min(wall.y1, wall.y2),
          end: Math.max(wall.y1, wall.y2),
        });
        straights.set(key, group);
      } else {
        loose.push(wall);
      }
      continue;
    }

    loose.push(wall);
  }

  const paths: string[] = [];
  for (const [radius, intervals] of arcs) {
    for (const interval of mergeIntervals(intervals)) {
      paths.push(arcPath(radius, interval.start, interval.end));
    }
  }
  for (const group of radials.values()) {
    for (const interval of mergeIntervals(group.intervals)) {
      const [x1, y1] = pointAt(interval.start, group.angle);
      const [x2, y2] = pointAt(interval.end, group.angle);
      paths.push(
        `M ${x1.toFixed(4)} ${y1.toFixed(4)} L ${x2.toFixed(4)} ${y2.toFixed(4)}`,
      );
    }
  }
  for (const group of straights.values()) {
    for (const interval of mergeIntervals(group.intervals)) {
      if (group.axis === "h") {
        paths.push(
          `M ${interval.start.toFixed(4)} ${group.coord.toFixed(4)} L ${interval.end.toFixed(4)} ${group.coord.toFixed(4)}`,
        );
      } else {
        paths.push(
          `M ${group.coord.toFixed(4)} ${interval.start.toFixed(4)} L ${group.coord.toFixed(4)} ${interval.end.toFixed(4)}`,
        );
      }
    }
  }
  for (const wall of loose) {
    if (wall.type === "path") paths.push(wall.d);
  }
  return paths;
}

function cellPath(cell: Cell): string {
  if (cell.outline) return cell.outline;
  if (cell.kind === "center") {
    return `M 0 -0.98 A 0.98 0.98 0 1 1 0 0.98 A 0.98 0.98 0 1 1 0 -0.98 Z`;
  }
  if (cell.kind === "start" || cell.kind === "exit" || cell.kind === "chamber") {
    return `M ${cell.cx - CAPSULE_RADIUS} ${cell.cy} a ${CAPSULE_RADIUS} ${CAPSULE_RADIUS} 0 1 0 ${CAPSULE_RADIUS * 2} 0 a ${CAPSULE_RADIUS} ${CAPSULE_RADIUS} 0 1 0 ${-CAPSULE_RADIUS * 2} 0 Z`;
  }
  const [ox0, oy0] = pointAt(cell.r1, cell.a0);
  const [ox1, oy1] = pointAt(cell.r1, cell.a1);
  const [ix1, iy1] = pointAt(cell.r0, cell.a1);
  const [ix0, iy0] = pointAt(cell.r0, cell.a0);
  const largeArc = cell.a1 - cell.a0 > Math.PI ? 1 : 0;
  return [
    `M ${ox0.toFixed(4)} ${oy0.toFixed(4)}`,
    `A ${cell.r1} ${cell.r1} 0 ${largeArc} 1 ${ox1.toFixed(4)} ${oy1.toFixed(4)}`,
    `L ${ix1.toFixed(4)} ${iy1.toFixed(4)}`,
    `A ${cell.r0} ${cell.r0} 0 ${largeArc} 0 ${ix0.toFixed(4)} ${iy0.toFixed(4)}`,
    "Z",
  ].join(" ");
}

function capsuleOutline(cell: Cell, outerRadius: number): string {
  const gap = capsuleOpening(outerRadius);
  const start = cell.angle + Math.PI + gap;
  const end = cell.angle + Math.PI - gap + Math.PI * 2;
  const [sx, sy] = [
    cell.cx + Math.cos(start) * CAPSULE_RADIUS,
    cell.cy + Math.sin(start) * CAPSULE_RADIUS,
  ];
  const [ex, ey] = [
    cell.cx + Math.cos(end) * CAPSULE_RADIUS,
    cell.cy + Math.sin(end) * CAPSULE_RADIUS,
  ];
  const span = end - start;
  const largeArc = span > Math.PI ? 1 : 0;
  return `M ${sx.toFixed(4)} ${sy.toFixed(4)} A ${CAPSULE_RADIUS} ${CAPSULE_RADIUS} 0 ${largeArc} 1 ${ex.toFixed(4)} ${ey.toFixed(4)}`;
}

function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * i) / 5;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(3)},${(cy + Math.sin(angle) * radius).toFixed(3)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

function seedNumber(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i++) value = (value * 31 + seed.charCodeAt(i)) % 997;
  return value;
}

/**
 * Follow camera for phones. The whole floor squeezed onto a phone leaves each
 * corridor only 9-13px wide, far thinner than a fingertip, so touch screens
 * zoom in and keep Sora framed. Mouse screens always see the whole maze.
 */
/** Zoom in when a corridor would be drawn narrower than this, in CSS pixels. */
const ZOOM_BELOW_PX = 24;
/** Corridor width the follow camera aims for, in CSS pixels. */
const FOLLOW_PX = 26;
/** Never zoom in further than this multiple of the whole-maze fit. */
const MAX_ZOOM = 4.5;
/**
 * Sora roams freely inside the middle of the view (this fraction of the half
 * width/height on each side); the camera only moves once he nears the edge,
 * so what the player is about to tap does not slide under the finger.
 */
const CAMERA_DEAD_ZONE = 0.45;
/** Camera easing time constant, in seconds. */
const CAMERA_TAU = 0.16;

/** Imperative camera handle: the walk loop feeds Sora's position every frame. */
export interface MazeCamera {
  follow(point: { x: number; y: number }, snap?: boolean): void;
}

/** Size of the tap ripple, in CSS pixels. */
const FINGER_RIPPLE_PX = 16;

/** Longest press that still counts as a tap, shared with the walk controller. */
export const TAP_MAX_MS = 320;

interface Props {
  level: Level;  playerCell: number;
  followerCell: number | null;
  friend: Character;
  player: Character;
  accent: string;
  friendRescued: boolean;
  radarCollected: boolean;
  orbCollected: boolean;
  coinsCollected: number[];
  carrotsCollected: number[];
  doorReady: boolean;
  hintPath: number[];
  moving: boolean;
  showMoves: boolean;
  onCellTap: (cellId: number) => void;
  /** A press anywhere on the board: walks there at once, or becomes a thumb stick on drag. */
  onMazePointerDown?: (info: {
    cellId: number | null;
    point: { x: number; y: number };
    /** Screen scale, so a fingertip can be measured in CSS pixels. */
    pixelsPerUnit: number;
  }) => void;
  /** Dragging while pressed works like a joystick; a null direction is the dead zone. */
  onMazePointerMove?: (info: {
    direction: { x: number; y: number } | null;
    dragging: boolean;
    point: { x: number; y: number };
  }) => void;
  /** `tap` is true for a short press without a drag, so the board can auto-walk. */
  onMazePointerUp?: (info: {
    tap: boolean;
    cellId: number | null;
    point: { x: number; y: number };
  }) => void;
  /** Friends walking with Sora; when present it replaces the single follower. */
  party?: PartyToken[] | null;
  scoutMarks?: ScoutMark[] | null;
  scoutHighlight?: ScoutHighlight | null;
  gremlins?: GremlinToken[] | null;
  /** Sora's token is positioned imperatively by the motion loop, not by React. */
  playerTokenRef?: React.RefObject<SVGGElement | null>;
  /** Filled with the follow camera; feed it Sora's position as he moves. */
  cameraRef?: React.MutableRefObject<MazeCamera | null>;
  /** Show the whole maze even where the follow camera would zoom in. */
  overview?: boolean;
  /** Told whether this screen zooms in at all, so a "whole maze" toggle can show. */
  onZoomableChange?: (zoomable: boolean) => void;
}

export function Maze({
  level,
  playerCell,
  followerCell,
  friend,
  player,
  accent,
  friendRescued,
  radarCollected,
  orbCollected,
  coinsCollected,
  carrotsCollected,
  doorReady,
  hintPath,
  moving,
  showMoves,
  onCellTap,
  onMazePointerDown,
  onMazePointerMove,
  onMazePointerUp,
  party = null,
  scoutMarks = null,
  scoutHighlight = null,
  gremlins = null,
  playerTokenRef,
  cameraRef,
  overview = false,
  onZoomableChange,
}: Props) {
  const uid = useId().replace(/[:]/g, "");
  const wobbleId = `wobble-${uid}`;
  const paperId = `paper-${uid}`;
  const dotsId = `dots-${uid}`;
  const exitGlowId = `exit-glow-${uid}`;

  const R = level.outerRadius;
  const pad = PORTAL_OFFSET + CAPSULE_RADIUS + 0.25;
  const topPad = R + pad + level.extraTop;
  const bottomPad = R + pad;
  const viewBox = `${-(R + pad)} ${-topPad} ${(R + pad) * 2} ${topPad + bottomPad}`;

  const wallPaths = useMemo(
    () => ({
      earWalls: mergeWallPaths(level.edges, true),
      headWalls: mergeWallPaths(level.edges, false),
    }),
    [level.edges],
  );

  const headOuterWall = useMemo(() => {
    if (level.headWallGaps.length === 0) return [];
    const gaps = level.headWallGaps
      .map((gap) => ({
        a0: ((gap.a0 % TWO_PI) + TWO_PI) % TWO_PI,
        a1: ((gap.a1 % TWO_PI) + TWO_PI) % TWO_PI,
      }))
      .sort((a, b) => a.a0 - b.a0);
    const segments: string[] = [];
    let cursor = 0;
    for (const gap of gaps) {
      if (gap.a0 > cursor) segments.push(arcPath(R, cursor, gap.a0));
      cursor = Math.max(cursor, gap.a1);
    }
    if (cursor < TWO_PI) segments.push(arcPath(R, cursor, TWO_PI));
    return segments;
  }, [level.headWallGaps, R]);

  const cells = level.cells;
  const playerPosition = cells[playerCell];
  const follower = followerCell === null ? null : cells[followerCell];
  const orb = level.orbCell >= 0 ? cells[level.orbCell] : null;
  const radar = level.radarCell >= 0 ? cells[level.radarCell] : null;
  const friendCell = cells[level.friendCell];
  // Keep collectible tokens readable as the tower grows more rings.
  const tokenScale = Math.max(0.95, Math.min(1.35, level.rings / 9));
  const orbScale = Math.max(1.15, Math.min(1.65, level.rings / 6));
  const missionLabel =
    level.mission === "rescue"
      ? `Rescue ${friend.name} and reach the ${level.orbStars}-star Dragon Orb in the centre.`
      : level.mission === "coins"
        ? `Rescue ${friend.name}, collect every Dragon Coin, and count them at the door.`
        : level.mission === "code"
          ? `Rescue ${friend.name}, collect the numbered carrots, and crack the code at the door.`
          : `Find the Dragon Radar, rescue ${friend.name}, and use the radar to find the ${level.orbStars}-star Dragon Orb.`;

  const followerIsWithPlayer = follower !== null && playerPosition !== null && follower.id === playerPosition.id;
  const followerSpot = follower
    ? (() => {
        if (!followerIsWithPlayer) return follower;
        const distance = Math.hypot(follower.cx, follower.cy);
        if (distance < 0.01) return { ...follower, cx: follower.cx + 0.28, cy: follower.cy + 0.16 };
        return {
          ...follower,
          cx: follower.cx - (follower.cx / distance) * 0.42,
          cy: follower.cy - (follower.cy / distance) * 0.42,
        };
      })()
    : null;

  const hintD = useMemo(() => {
    if (hintPath.length < 2) return "";
    return hintPath
      .map((id, index) => {
        const cell = cells[id];
        return `${index === 0 ? "M" : "L"} ${cell.cx.toFixed(3)} ${cell.cy.toFixed(3)}`;
      })
      .join(" ");
  }, [hintPath, cells]);

  const moveTargets = useMemo(() => {
    if (!showMoves || moving) return [];
    return openNeighborIds(level, playerCell).map((id) => cells[id]);
  }, [showMoves, moving, level, playerCell, cells]);

  const partySpots = useMemo(() => {
    if (!party || party.length === 0) return [];
    return party.map((member) => {
      const cell = cells[member.cellId];
      if (!cell) return null;
      if (member.mode !== "follow" || cell.id !== playerCell) {
        return { member, cell };
      }
      // Followers stack behind Sora along the radial line: a conga line.
      const distance = Math.hypot(cell.cx, cell.cy);
      const pull = 0.42 + member.slot * 0.13;
      if (distance < 0.01) {
        return {
          member,
          cell: { ...cell, cx: cell.cx + 0.28 + member.slot * 0.2, cy: cell.cy + 0.16 },
        };
      }
      return {
        member,
        cell: {
          ...cell,
          cx: cell.cx - (cell.cx / distance) * pull,
          cy: cell.cy - (cell.cy / distance) * pull,
        },
      };
    });
  }, [party, cells, playerCell]);

  // ---- Press-and-drag steering -------------------------------------------------
  const joyRef = useRef<SVGGElement | null>(null);
  const rippleRef = useRef<SVGCircleElement | null>(null);
  const joyRingRef = useRef<SVGCircleElement | null>(null);
  const joyKnobRef = useRef<SVGCircleElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    origin: { x: number; y: number };
    point: { x: number; y: number };
    /**
     * The thumb stick lives in screen pixels: the follow camera may pan while
     * the thumb rests, and the stick must stay put under it.
     */
    originClient: { x: number; y: number };
    pointClient: { x: number; y: number };
    dragging: boolean;
    deadZone: number;
    pixelsPerUnit: number;
    startedAt: number;
    cellId: number | null;
    pointerId: number;
  } | null>(null);
  const pointerUpRef = useRef(onMazePointerUp);

  /** Screen sizes, converted to maze units at paint time. */
  const JOY_RADIUS_PX = 42;
  const JOY_KNOB_PX = 15;
  const JOY_TRAVEL_PX = 32;
  const DEAD_ZONE_PX = 9;

  useEffect(() => {
    pointerUpRef.current = onMazePointerUp;
  }, [onMazePointerUp]);

  const directionBetween = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length < 1e-6) return null;
    return { x: dx / length, y: dy / length };
  };

  const toLevelPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    // Return a plain point: DOMPoint keeps x/y on the prototype, so spreading
    // it later would silently produce an empty object.
    return { x: point.x, y: point.y };
  };

  /** Draw the thumb ring without re-rendering a single maze node. */
  const paintJoystick = () => {
    const group = joyRef.current;
    const drag = dragRef.current;
    const svg = svgRef.current;
    if (!group) return;
    if (!drag || !svg) {
      group.setAttribute("opacity", "0");
      return;
    }
    const origin = toLevelPoint(svg, drag.originClient.x, drag.originClient.y);
    const ctm = svg.getScreenCTM();
    const pixelsPerUnit = ctm ? Math.hypot(ctm.a, ctm.b) || 1 : 1;
    if (!origin) return;
    const dx = drag.pointClient.x - drag.originClient.x;
    const dy = drag.pointClient.y - drag.originClient.y;
    const length = Math.hypot(dx, dy);
    const ratio = length > JOY_TRAVEL_PX ? JOY_TRAVEL_PX / length : 1;

    group.setAttribute("transform", `translate(${origin.x} ${origin.y})`);
    group.setAttribute("opacity", drag.dragging ? "0.95" : "0.55");
    joyRingRef.current?.setAttribute("r", String(JOY_RADIUS_PX / pixelsPerUnit));
    joyKnobRef.current?.setAttribute("r", String(JOY_KNOB_PX / pixelsPerUnit));
    joyKnobRef.current?.setAttribute(
      "transform",
      `translate(${(dx * ratio) / pixelsPerUnit} ${(dy * ratio) / pixelsPerUnit})`,
    );
  };

  // ---- Follow camera -------------------------------------------------------------
  const full = useMemo(
    () => ({ x: -(R + pad), y: -topPad, w: (R + pad) * 2, h: topPad + bottomPad }),
    [R, pad, topPad, bottomPad],
  );
  const cameraState = useRef({
    view: { ...full },
    centre: { x: 0, y: 0 },
    player: null as { x: number; y: number } | null,
    raf: null as number | null,
    last: 0,
    zoomable: null as boolean | null,
  });
  const overviewRef = useRef(overview);
  const zoomCallbackRef = useRef(onZoomableChange);
  zoomCallbackRef.current = onZoomableChange;

  /** Where the camera wants to be right now: whole maze, or a window on Sora. */
  const cameraGoal = () => {
    const camera = cameraState.current;
    const svg = svgRef.current;
    const width = svg?.clientWidth ?? 0;
    const height = svg?.clientHeight ?? 0;
    const coarse =
      typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true;
    const fit = width > 0 && height > 0 ? Math.min(width / full.w, height / full.h) : 0;
    const zoomable = coarse && fit > 0 && fit < ZOOM_BELOW_PX;
    if (camera.zoomable !== zoomable) {
      camera.zoomable = zoomable;
      zoomCallbackRef.current?.(zoomable);
    }
    if (!zoomable || overviewRef.current || !camera.player) return { ...full };

    const scale = Math.min(FOLLOW_PX, fit * MAX_ZOOM);
    const w = width / scale;
    const h = height / scale;
    const centre = camera.centre;
    const player = camera.player;
    // Dead zone: only drag the frame along once Sora nears its edge.
    const slackX = (w / 2) * CAMERA_DEAD_ZONE;
    const slackY = (h / 2) * CAMERA_DEAD_ZONE;
    if (player.x > centre.x + slackX) centre.x = player.x - slackX;
    if (player.x < centre.x - slackX) centre.x = player.x + slackX;
    if (player.y > centre.y + slackY) centre.y = player.y - slackY;
    if (player.y < centre.y - slackY) centre.y = player.y + slackY;
    // Keep the frame on the paper.
    const clampAxis = (value: number, size: number, start: number, span: number) =>
      size >= span ? start + span / 2 : Math.max(start + size / 2, Math.min(start + span - size / 2, value));
    centre.x = clampAxis(centre.x, w, full.x, full.w);
    centre.y = clampAxis(centre.y, h, full.y, full.h);
    return { x: centre.x - w / 2, y: centre.y - h / 2, w, h };
  };

  const applyView = () => {
    const view = cameraState.current.view;
    svgRef.current?.setAttribute(
      "viewBox",
      `${view.x.toFixed(4)} ${view.y.toFixed(4)} ${view.w.toFixed(4)} ${view.h.toFixed(4)}`,
    );
    if (dragRef.current) paintJoystick();
  };

  const stepCamera = (now: number) => {
    const camera = cameraState.current;
    camera.raf = null;
    const dt = Math.min(0.05, Math.max(0.001, (now - camera.last) / 1000));
    camera.last = now;
    const goal = cameraGoal();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const k = reduce ? 1 : 1 - Math.exp(-dt / CAMERA_TAU);
    const view = camera.view;
    view.x += (goal.x - view.x) * k;
    view.y += (goal.y - view.y) * k;
    view.w += (goal.w - view.w) * k;
    view.h += (goal.h - view.h) * k;
    const settled =
      Math.abs(goal.x - view.x) + Math.abs(goal.y - view.y) +
        Math.abs(goal.w - view.w) + Math.abs(goal.h - view.h) <
      1e-3;
    if (settled) Object.assign(view, goal);
    applyView();
    if (!settled) camera.raf = requestAnimationFrame(stepCamera);
  };

  const kickCamera = () => {
    const camera = cameraState.current;
    if (camera.raf !== null) return;
    camera.last = performance.now();
    camera.raf = requestAnimationFrame(stepCamera);
  };

  useLayoutEffect(() => {
    if (!cameraRef) return;
    cameraRef.current = {
      follow(point, snap = false) {
        const camera = cameraState.current;
        const first = camera.player === null;
        camera.player = { x: point.x, y: point.y };
        if (first) camera.centre = { x: point.x, y: point.y };
        if (snap) {
          Object.assign(camera.view, cameraGoal());
          applyView();
          return;
        }
        kickCamera();
      },
    };
    return () => {
      cameraRef.current = null;
    };
  });

  // A new floor starts from the whole-maze view, then eases in.
  useLayoutEffect(() => {
    const camera = cameraState.current;
    camera.view = { ...full };
    camera.player = null;
    applyView();
    kickCamera();
  }, [full]);

  useEffect(() => {
    overviewRef.current = overview;
    kickCamera();
  }, [overview]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => kickCamera());
    observer.observe(svg);
    const coarse = window.matchMedia?.("(pointer: coarse)");
    coarse?.addEventListener?.("change", kickCamera);
    return () => {
      observer.disconnect();
      coarse?.removeEventListener?.("change", kickCamera);
      const camera = cameraState.current;
      if (camera.raf !== null) cancelAnimationFrame(camera.raf);
      camera.raf = null;
    };
  }, []);

  const handleMazePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // One thumb steers. A second finger resting on the glass is ignored.
    if (dragRef.current) return;

    const svg = event.currentTarget;
    const point = toLevelPoint(svg, event.clientX, event.clientY);
    if (!point) return;

    const ctm = svg.getScreenCTM();
    const pixelsPerUnit = ctm ? Math.hypot(ctm.a, ctm.b) || 1 : 1;
    const cellEl = (event.target as Element | null)?.closest?.("[data-cell-id]");
    const cellId = cellEl ? Number(cellEl.getAttribute("data-cell-id")) : null;

    dragRef.current = {
      origin: point,
      point,
      originClient: { x: event.clientX, y: event.clientY },
      pointClient: { x: event.clientX, y: event.clientY },
      dragging: false,
      deadZone: DEAD_ZONE_PX,
      pixelsPerUnit,
      startedAt: performance.now(),
      cellId,
      pointerId: event.pointerId,
    };
    paintJoystick();

    // Instant feedback under the finger, restarted on every press.
    const ripple = rippleRef.current;
    if (ripple) {
      ripple.setAttribute("cx", String(point.x));
      ripple.setAttribute("cy", String(point.y));
      ripple.setAttribute("r", String(FINGER_RIPPLE_PX / pixelsPerUnit));
      ripple.classList.remove("is-on");
      void ripple.getBoundingClientRect();
      ripple.classList.add("is-on");
    }

    try {
      svg.setPointerCapture(event.pointerId);
    } catch {
      // Older browsers only: the window listener still ends the gesture.
    }

    onMazePointerDown?.({ cellId, point, pixelsPerUnit });
  };

  const handleMazePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = toLevelPoint(event.currentTarget, event.clientX, event.clientY);
    if (!point) return;
    drag.point = point;
    drag.pointClient = { x: event.clientX, y: event.clientY };

    const dx = drag.pointClient.x - drag.originClient.x;
    const dy = drag.pointClient.y - drag.originClient.y;
    if (!drag.dragging && Math.hypot(dx, dy) > drag.deadZone) drag.dragging = true;

    paintJoystick();
    onMazePointerMove?.({
      direction: drag.dragging ? directionBetween(drag.originClient, drag.pointClient) : null,
      dragging: drag.dragging,
      point,
    });
  };

  const handleMazePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const elapsed = performance.now() - drag.startedAt;
    const tap = event.type !== "pointercancel" && !drag.dragging && elapsed <= TAP_MAX_MS;
    const point =
      toLevelPoint(event.currentTarget, event.clientX, event.clientY) ?? drag.point;
    // Taps that land on a wall or in a gap still count: snap to the nearest
    // cell, so the player never has to hit a tiny target exactly. Taps in the
    // padding around the maze are ignored.
    const cellId =
      drag.cellId ??
      (Math.hypot(point.x, point.y) <= level.outerRadius + 0.6
        ? nearestCellId(level, point)
        : null);
    drag.point = point;
    dragRef.current = null;
    paintJoystick();
    pointerUpRef.current?.({ tap, cellId, point });
  };

  // If the finger leaves the board without a pointer event reaching the SVG
  // (older Safari), still clear the thumb ring and stop the walk.
  useEffect(() => {
    const release = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      paintJoystick();
      pointerUpRef.current?.({ tap: false, cellId: null, point: drag.point });
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  const portalCells = level.portals
    .map((portal) => cells[portal.externalCell])
    .filter(Boolean);

  return (
    <svg
      ref={svgRef}
      className="maze-svg"
      data-moving={moving ? "true" : "false"}
      viewBox={viewBox}
      role="group"
      aria-label={`Floor ${level.floor} maze. ${missionLabel}`}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={handleMazePointerDown}
      onPointerMove={handleMazePointerMove}
      onPointerUp={handleMazePointerUp}
      onPointerCancel={handleMazePointerUp}
    >
      <defs>
        <radialGradient id={paperId} cx="44%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#FFFDF4" />
          <stop offset="72%" stopColor={PAPER} />
          <stop offset="100%" stopColor="#F3E1BF" />
        </radialGradient>
        <pattern id={dotsId} width="0.22" height="0.22" patternUnits="userSpaceOnUse">
          <circle cx="0.05" cy="0.05" r="0.012" fill="#6B4A2E" opacity="0.28" />
        </pattern>
        <filter id={wobbleId} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.055"
            numOctaves="2"
            seed={seedNumber(level.seed)}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.018" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={exitGlowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="0.09" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {level.earShapes.map((d, index) => (
        <path
          key={`ear-shape-${index}`}
          d={d}
          fill={`url(#${paperId})`}
          stroke={INK}
          strokeWidth="5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {level.earInnerShapes.map((d, index) => (
        <path
          key={`ear-inner-${index}`}
          d={d}
          fill="#FFC2D1"
          opacity="0.5"
        />
      ))}

      <g filter={`url(#${wobbleId})`} pointerEvents="none">
        {wallPaths.earWalls.map((d, index) => (
          <path
            key={`ear-wall-${index}`}
            className="wall-path wall-ear"
            d={d}
            fill="none"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      <circle cx="0" cy="0" r={R + 0.32} fill={`url(#${paperId})`} />
      <circle cx="0" cy="0" r={R + 0.32} fill={`url(#${dotsId})`} opacity="0.3" />
      <circle
        cx="0"
        cy="0"
        r={R + 0.33}
        fill="none"
        stroke={INK}
        strokeWidth="2.2"
        opacity="0.18"
        vectorEffect="non-scaling-stroke"
      />

      <g filter={`url(#${wobbleId})`} pointerEvents="none">
        {level.headWallGaps.length === 0 ? (
          <circle
            cx="0"
            cy="0"
            r={R}
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          headOuterWall.map((d, index) => (
            <path
              key={`head-wall-${index}`}
              d={d}
              fill="none"
              stroke={INK}
              strokeWidth="5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))
        )}
        <circle
          cx="0"
          cy="0"
          r={R + 0.24}
          fill="none"
          stroke={INK}
          strokeWidth="1.4"
          strokeDasharray="0.02 0.08"
          opacity="0.4"
          vectorEffect="non-scaling-stroke"
        />
        {wallPaths.headWalls.map((d, index) => (
          <path
            key={`head-inner-${index}`}
            className="wall-path wall-head"
            d={d}
            fill="none"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {hintD ? (
        <path
          d={hintD}
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.16 0.18"
          opacity="0.85"
          pointerEvents="none"
          className="hint-path"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {scoutMarks || scoutHighlight ? (
        <ScoutLayer
          marks={scoutMarks ?? []}
          highlight={scoutHighlight}
          cells={cells}
          accent={accent}
        />
      ) : null}

      {level.radarCell >= 0 && !radarCollected && radar ? (
        <g pointerEvents="none" data-radar-token data-radar-cell={level.radarCell}>
          <circle
            cx={radar.cx}
            cy={radar.cy}
            r={0.5 * tokenScale}
            fill="#2C7DA0"
            opacity="0.24"
            className="target-pulse"
          />
          <g transform={`translate(${radar.cx} ${radar.cy})`}>
            <g transform={`scale(${0.0086 * tokenScale}) translate(-50 -50)`}>
              <DragonRadarGlyph size={100} active />
            </g>
          </g>
        </g>
      ) : null}

      {level.coinCells.map((cellId) => {
        if (coinsCollected.includes(cellId)) return null;
        const coin = cells[cellId];
        if (!coin) return null;
        return (
          <g key={`coin-${cellId}`} pointerEvents="none" data-coin-token data-coin-cell={cellId}>
            <circle
              cx={coin.cx}
              cy={coin.cy}
              r={0.32 * tokenScale}
              fill="#FFC93C"
              opacity="0.24"
              className="target-pulse"
            />
            <g transform={`translate(${coin.cx} ${coin.cy})`}>
              <g transform={`scale(${0.0065 * tokenScale}) translate(-50 -50)`}>
                <DragonCoinGlyph size={100} />
              </g>
            </g>
          </g>
        );
      })}

      {level.carrotCells.map((cellId, index) => {
        if (carrotsCollected.includes(cellId)) return null;
        const carrot = cells[cellId];
        if (!carrot) return null;
        // Ear lanes are narrower than the head rings, so keep the carrot just
        // inside the lane instead of letting it cover the walls.
        const carrotScale = carrot.kind === "ear" ? 0.0086 : 0.0112;
        return (
          <g key={`carrot-${cellId}`} pointerEvents="none" data-carrot-token data-carrot-cell={cellId}>
            <circle
              cx={carrot.cx}
              cy={carrot.cy}
              r={(carrot.kind === "ear" ? 0.38 : 0.46) * tokenScale}
              fill="#FF9A3C"
              opacity="0.26"
              className="target-pulse"
            />
            <g transform={`translate(${carrot.cx} ${carrot.cy})`}>
              <g transform={`scale(${carrotScale * tokenScale}) translate(-50 -50)`}>
                <DragonCarrotGlyph size={100} number={level.carrotNumbers[index]} />
              </g>
            </g>
          </g>
        );
      })}

      {level.orbCell >= 0 && !orbCollected && orb && (level.radarCell < 0 || radarCollected) ? (
        <g pointerEvents="none" data-orb-token data-orb-cell={level.orbCell}>
          <circle
            cx={orb.cx}
            cy={orb.cy}
            r={0.48 * orbScale}
            fill="#FFC93C"
            opacity="0.34"
            className="target-pulse"
          />
          <g transform={`translate(${orb.cx} ${orb.cy})`}>
            <g transform={`scale(${0.0086 * orbScale}) translate(-50 -50)`}>
              <DragonOrbGlyph stars={level.orbStars} glow />
            </g>
          </g>
        </g>
      ) : null}

      {portalCells.map((cell) => {
        const isStart = cell.kind === "start";
        const isExit = cell.kind === "exit";
        const isChamber = cell.kind === "chamber";
        return (
          <g key={cell.id} pointerEvents="none">
            <circle cx={cell.cx} cy={cell.cy} r={CAPSULE_RADIUS} fill={PAPER} />
            <path
              d={capsuleOutline(cell, level.outerRadius)}
              fill="none"
              stroke={INK}
              strokeWidth="3.6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M ${cell.cx - 0.31} ${cell.cy - 0.24} C ${cell.cx - 0.42} ${cell.cy + 0.05} ${cell.cx - 0.24} ${cell.cy + 0.34} ${cell.cx + 0.02} ${cell.cy + 0.38}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.55"
              vectorEffect="non-scaling-stroke"
            />
            {isStart ? (
              <path
                d={starPath(cell.cx, cell.cy + 0.02, 0.25, 0.11)}
                fill="#FFC93C"
                stroke={INK}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {isExit ? (
              <>
                <circle
                  cx={cell.cx}
                  cy={cell.cy}
                  r="0.36"
                  fill={doorReady ? "#B9E769" : "#F3E1BF"}
                  stroke={INK}
                  strokeWidth="2.6"
                  vectorEffect="non-scaling-stroke"
                  filter={doorReady ? `url(#${exitGlowId})` : undefined}
                />
                <path
                  d={`M ${cell.cx - 0.15} ${cell.cy + 0.21} V ${cell.cy - 0.12} Q ${cell.cx - 0.15} ${cell.cy - 0.2} ${cell.cx - 0.07} ${cell.cy - 0.2} H ${cell.cx + 0.07} Q ${cell.cx + 0.15} ${cell.cy - 0.2} ${cell.cx + 0.15} ${cell.cy - 0.12} V ${cell.cy + 0.21}`}
                  fill="none"
                  stroke={doorReady ? "#1F5B24" : INK}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={`M ${cell.cx - 0.15} ${cell.cy + 0.21} H ${cell.cx + 0.15}`}
                  fill="none"
                  stroke={doorReady ? "#1F5B24" : INK}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={cell.cx + 0.075} cy={cell.cy + 0.02} r="0.03" fill={doorReady ? "#1F5B24" : INK} />
                {!doorReady ? (
                  <path
                    d={`M ${cell.cx - 0.3} ${cell.cy - 0.3} L ${cell.cx + 0.3} ${cell.cy + 0.3} M ${cell.cx + 0.3} ${cell.cy - 0.3} L ${cell.cx - 0.3} ${cell.cy + 0.3}`}
                    stroke="#E8482D"
                    strokeWidth="4"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
              </>
            ) : null}
            {isChamber ? (
              <>
                <circle cx={cell.cx} cy={cell.cy} r="0.34" fill={friend.aura} opacity="0.5" />
                {!friendRescued ? (
                  <>
                    <g transform={`translate(${cell.cx} ${cell.cy + 0.08}) scale(0.0048) translate(-50 -52)`}>
                      <AvatarGlyph character={friend} />
                    </g>
                    <path
                      d={`M ${cell.cx - 0.28} ${cell.cy - 0.25} C ${cell.cx - 0.4} ${cell.cy + 0.02} ${cell.cx - 0.2} ${cell.cy + 0.31} ${cell.cx + 0.05} ${cell.cy + 0.33}`}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.75"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : (
                  <path
                    d={starPath(cell.cx, cell.cy, 0.16, 0.07)}
                    fill={accent}
                    stroke={INK}
                    strokeWidth="1.4"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </>
            ) : null}
          </g>
        );
      })}

      {!friendRescued && friendCell ? (
        <circle
          cx={friendCell.cx}
          cy={friendCell.cy}
          r="0.62"
          fill="none"
          stroke={friend.aura}
          strokeWidth="3"
          opacity="0.55"
          className="target-pulse"
          pointerEvents="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {/* The friend waiting in the maze needs a visible token, not just an aura. */}
      {!friendRescued && friendCell && friendCell.kind !== "chamber" ? (
        <g pointerEvents="none" data-friend-token data-friend-cell={friendCell.id}>
          <circle
            cx={friendCell.cx}
            cy={friendCell.cy}
            r="0.3"
            fill={PAPER}
            stroke={friend.aura}
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
          <g transform={`translate(${friendCell.cx} ${friendCell.cy}) scale(0.0056) translate(-50 -52)`}>
            <AvatarGlyph character={friend} />
          </g>
        </g>
      ) : null}

      {gremlins && gremlins.length > 0 ? (
        <GremlinLayer gremlins={gremlins} cells={cells} />
      ) : null}

      {moveTargets.map((cell) => (
        <circle
          key={`move-${cell.id}`}
          cx={cell.cx}
          cy={cell.cy}
          r={cell.kind === "start" || cell.kind === "exit" || cell.kind === "chamber" ? 0.13 : 0.1}
          fill={accent}
          opacity="0.7"
          className="move-dot"
          pointerEvents="none"
        />
      ))}

      {!party && followerSpot ? (
        <g
          pointerEvents="none"
          className="token-glide"
          data-follower-token
          data-follower-cell={followerCell ?? undefined}
          style={{ transform: `translate(${followerSpot.cx}px, ${followerSpot.cy}px)` }}
        >
          <circle r="0.3" fill={PAPER} stroke={INK} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <g transform="scale(0.0056) translate(-50 -52)">
            <AvatarGlyph character={friend} />
          </g>
        </g>
      ) : null}

      {partySpots.map((spot) => {
        if (!spot) return null;
        const character = getCharacter(spot.member.characterId);
        const isBlocked = spot.member.mode === "blocked";
        const isOut =
          spot.member.mode === "scout" || spot.member.mode === "return" || isBlocked;
        const isFirstFollower = spot.member.mode === "follow" && spot.member.slot === 0;

        return (
          <g
            key={`party-${spot.member.characterId}`}
            pointerEvents="none"
            className={`party-token token-glide ${isOut ? "is-out" : ""} ${isBlocked ? "is-blocked" : ""}`}
            style={{ transform: `translate(${spot.cell.cx}px, ${spot.cell.cy}px)` }}
            data-party-member={spot.member.characterId}
            data-party-cell={spot.member.cellId}
            data-party-mode={spot.member.mode}
            data-party-charge={spot.member.hasCharge}
            {...(isFirstFollower
              ? {
                  "data-follower-token": true,
                  "data-follower-cell": spot.member.cellId,
                }
              : {})}
            {...(isBlocked ? { "data-blocked-friend": true } : {})}
          >
            {isOut ? (
              <circle
                r="0.34"
                fill="none"
                stroke={character.aura}
                strokeWidth="2"
                strokeDasharray="0.06 0.06"
                opacity="0.8"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <circle
              r="0.27"
              fill={PAPER}
              stroke={INK}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <g transform="scale(0.0052) translate(-50 -52)">
              <AvatarGlyph character={character} />
            </g>
            {isBlocked ? (
              <g className="party-blocked-alert" transform="translate(0.3 -0.36)">
                <circle
                  r="0.15"
                  fill="#FFC93C"
                  stroke={INK}
                  strokeWidth="1.8"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="0.19"
                  fontWeight="900"
                  fill={INK}
                >
                  !
                </text>
              </g>
            ) : null}
          </g>
        );
      })}

      {playerPosition ? (
        <g
          ref={playerTokenRef}
          pointerEvents="none"
          className="player-token"
          data-player-token
          data-player-cell={playerCell}
        >
          {/* Sized to BODY_RADIUS (freeMove.ts): the outline touches a wall exactly when Sora does. */}
          <circle
            r="0.34"
            fill="none"
            stroke={player.aura}
            strokeWidth="3"
            opacity="0.5"
            className="player-halo"
            vectorEffect="non-scaling-stroke"
          />
          <ellipse cx="0" cy="0.27" rx="0.2" ry="0.06" fill="#3A2412" opacity="0.18" />
          <circle r="0.27" fill={PAPER} stroke={INK} strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
          <g transform="scale(0.0051) translate(-50 -52)">
            <AvatarGlyph character={player} />
          </g>
        </g>
      ) : null}

      <circle
        ref={rippleRef}
        className="tap-ripple"
        r="0.5"
        fill="none"
        stroke={accent}
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />

      <g ref={joyRef} className="maze-joystick" data-maze-joystick pointerEvents="none" opacity="0">
        <circle
          ref={joyRingRef}
          r="2"
          fill={PAPER}
          fillOpacity="0.35"
          stroke={accent}
          strokeWidth="2"
          strokeDasharray="0.18 0.14"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          ref={joyKnobRef}
          data-joystick-knob
          r="0.72"
          fill={accent}
          fillOpacity="0.85"
          stroke={INK}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {cells.map((cell) => (
        <path
          key={`hit-${cell.id}`}
          d={cellPath(cell)}
          fill="transparent"
          className={`cell-hit ${cell.kind === "start" || cell.kind === "exit" || cell.kind === "chamber" ? "cell-hit-portal" : ""}`}
          data-cell-id={cell.id}
          data-cell-kind={cell.kind}
          onClick={() => onCellTap(cell.id)}
          style={{ cursor: moving ? "default" : "pointer" }}
        />
      ))}
    </svg>
  );
}
