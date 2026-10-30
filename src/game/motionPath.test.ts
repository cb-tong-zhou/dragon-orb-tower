import { describe, expect, it } from "vitest";
import { FLOORS } from "../content/floors";
import { generateFloor, openNeighborIds } from "../generator/generate";
import { bfsPath } from "../generator/graph";
import { buildWalls } from "./freeMove";
import { pickTapTarget, planTapPath, TAP_REACH } from "./motionPath";

const level = generateFloor(FLOORS[6].config, 0, "tap-intent");
const field = buildWalls(level);
const centre = (id: number) => ({ x: level.cells[id].cx, y: level.cells[id].cy });

describe("pickTapTarget", () => {
  it("keeps the exact pixel when the tap lands in a reachable corridor", () => {
    const from = centre(level.startCell);
    const next = openNeighborIds(level, level.startCell)[0];
    const tap = { x: centre(next).x + 0.05, y: centre(next).y };
    const target = pickTapTarget(level, from, tap, 0.3);
    expect(target).toEqual({ cellId: next, point: tap });
  });

  it("reads a fingertip over a wall as the open side, not the cell behind it", () => {
    // Pairs of same-ring neighbours split by a closed spoke and far apart on foot.
    const walled = level.edges.filter(
      (edge) =>
        !edge.open &&
        edge.kind === "tangential" &&
        bfsPath(level, edge.a, edge.b).length > 12,
    );
    expect(walled.length).toBeGreaterThan(5);
    for (const edge of walled.slice(0, 20)) {
      const from = centre(edge.a);
      const behind = centre(edge.b);
      // A fat fingertip resting on the wall between them.
      const tap = { x: (from.x + behind.x) / 2, y: (from.y + behind.y) / 2 };
      const target = pickTapTarget(level, from, tap, 1.5);
      expect(target?.cellId).not.toBe(edge.b);
    }
  });

  it("refuses taps beyond one tap's reach, so the exit cannot be spammed", () => {
    const from = centre(level.startCell);
    const exit = centre(level.exitCell);
    expect(bfsPath(level, level.startCell, level.exitCell).length).toBeGreaterThan(TAP_REACH * 2);
    expect(pickTapTarget(level, from, exit, 1)).toBeNull();
  });
});

describe("ring corridor walks", () => {
  it("follow the curve at mid-depth instead of zig-zagging", () => {
    // Find three same-ring cells joined by open spokes.
    let run: number[] | null = null;
    for (const cell of level.cells) {
      if (cell.kind !== "normal" || cell.ring < 3) continue;
      const along = openNeighborIds(level, cell.id).filter(
        (id) => level.cells[id].ring === cell.ring,
      );
      for (const middle of along) {
        const last = openNeighborIds(level, middle).find(
          (id) => id !== cell.id && level.cells[id].ring === cell.ring,
        );
        if (last !== undefined) run = [cell.id, middle, last];
      }
      if (run) break;
    }
    expect(run).not.toBeNull();
    const [first, , last] = run!;
    const ring = level.cells[first].ring;
    const plan = planTapPath(level, field, centre(first), centre(last), last);
    expect(plan).not.toBeNull();
    for (const point of plan!.line.points) {
      expect(Math.abs(Math.hypot(point.x, point.y) - (ring + 0.5))).toBeLessThan(0.05);
    }
  });
});

describe("bunny ear doorways", () => {
  it("plan every short walk between the head and an ear", () => {
    const bunny = generateFloor(FLOORS[2].config, 0, "ear-doorways");
    const bunnyField = buildWalls(bunny);
    let walks = 0;
    for (const a of bunny.cells) {
      for (const b of bunny.cells) {
        if ((a.earId === undefined) === (b.earId === undefined)) continue;
        const path = bfsPath(bunny, a.id, b.id);
        if (path.length < 2 || path.length > 6) continue;
        walks++;
        const plan = planTapPath(bunny, bunnyField, { x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }, b.id);
        expect(plan, `${a.id} -> ${b.id}`).not.toBeNull();
      }
    }
    expect(walks).toBeGreaterThan(20);
  });
});
