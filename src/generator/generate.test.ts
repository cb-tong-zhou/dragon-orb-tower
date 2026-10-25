import { describe, expect, it } from "vitest";
import { FLOORS } from "../content/floors";
import { bfsPath, deadEnds, reachableCount } from "./graph";
import { generateFloor, validateLevel } from "./generate";
import type { FloorConfig, Level } from "./types";

function expectPlayable(level: Level, config: FloorConfig) {
  expect(validateLevel(level, config)).toBe(true);
  expect(reachableCount(level, level.startCell)).toBe(level.cells.length);

  const specialCells = [
    level.startCell,
    level.exitCell,
    level.friendCell,
    level.orbCell,
    level.radarCell,
    ...level.coinCells,
    ...level.carrotCells,
  ].filter((id) => id >= 0);
  expect(new Set(specialCells).size).toBe(specialCells.length);

  for (const cellId of specialCells) {
    expect(level.cells[cellId]).toBeDefined();
  }

  expect(bfsPath(level, level.startCell, level.friendCell).length).toBeGreaterThan(1);
  expect(bfsPath(level, level.startCell, level.exitCell).length).toBeGreaterThan(1);
  expect(level.metrics.pathToFriend).toBeGreaterThanOrEqual(config.rings * 3);
  expect(level.metrics.pathToExit).toBeGreaterThanOrEqual(config.rings * 3);
  expect(level.metrics.deadEnds).toBeGreaterThanOrEqual(config.deadEndMin ?? config.rings * 2.5);

  if (config.mission === "rescue") {
    expect(level.orbCell).toBe(0);
    expect(level.radarCell).toBe(-1);
    expect(level.coinCells).toHaveLength(0);
    expect(level.carrotCells).toHaveLength(0);
    expect(level.metrics.pathToOrb).toBeGreaterThanOrEqual(config.rings * 4);
    expect(level.metrics.pathToFriend).toBeGreaterThanOrEqual(config.rings * 4);
  }

  if (config.mission === "coins") {
    expect(level.orbCell).toBe(-1);
    expect(level.radarCell).toBe(-1);
    expect(level.coinCells).toHaveLength(config.coinCount ?? 0);
    expect(level.coinChoices).toHaveLength(4);
    expect(level.coinChoices).toContain(level.coinCells.length);
    expect(level.metrics.pathToFriend).toBeGreaterThanOrEqual(config.rings * 4);
    expect(level.metrics.pathToExit).toBeGreaterThanOrEqual(config.rings * 4);
    for (const cellId of level.coinCells) {
      expect(level.cells[cellId]?.kind).toBe("normal");
      expect(bfsPath(level, level.startCell, cellId).length).toBeGreaterThan(1);
    }
  }

  if (config.mission === "code") {
    expect(level.orbCell).toBe(-1);
    expect(level.radarCell).toBe(-1);
    expect(level.coinCells).toHaveLength(0);
    expect(level.carrotCells).toHaveLength(3);
    expect(level.carrotNumbers).toEqual(config.code?.numbers);
    expect(level.codeWord).toBe(config.code?.word);
    expect(level.codeChoices).toEqual(config.code?.choices);
    expect(level.earShapes).toHaveLength(2);
    const carrotEars = level.carrotCells
      .map((cellId) => level.cells[cellId])
      .filter((cell) => cell.earId !== undefined);
    const headCarrots = level.carrotCells
      .map((cellId) => level.cells[cellId])
      .filter((cell) => cell.earId === undefined);
    expect(new Set(carrotEars.map((cell) => cell.earId)).size).toBe(2);
    expect(headCarrots.length).toBeGreaterThanOrEqual(1);
    for (const cellId of level.carrotCells) {
      const cell = level.cells[cellId];
      expect(["normal", "ear"]).toContain(cell?.kind);
      // Keep ear carrots out of the bottom row tucked under the head.
      if (cell?.kind === "ear") expect(cell.earRow).toBeLessThan(8);
      expect(bfsPath(level, level.startCell, cellId).length).toBeGreaterThan(1);
    }
  }

  if (config.mission === "radar") {
    expect(level.orbCell).toBeGreaterThanOrEqual(0);
    expect(level.radarCell).toBeGreaterThanOrEqual(0);
    expect(level.cells[level.radarCell]?.kind).toBe("normal");
    expect(level.metrics.pathToOrb).toBeGreaterThanOrEqual(config.rings * 5);
    expect(bfsPath(level, level.startCell, level.radarCell).length - 1).toBeGreaterThanOrEqual(
      config.rings * 8,
    );
    expect(level.metrics.pathToFriend).toBeGreaterThanOrEqual(config.rings * 6);
    expect(level.coinCells).toHaveLength(config.coinCount ?? 3);
    for (const cellId of level.coinCells) {
      expect(level.cells[cellId]?.kind).toBe("normal");
      expect(bfsPath(level, level.startCell, cellId).length).toBeGreaterThan(1);
    }
  }
}

const TWO_PI = Math.PI * 2;
const WALL_EPS = 1e-6;

interface WallRun {
  start: number;
  end: number;
}

function mergeWallRuns(runs: WallRun[]): WallRun[] {
  const sorted = [...runs].sort((a, b) => a.start - b.start);
  const merged: WallRun[] = sorted.length > 0 ? [{ ...sorted[0] }] : [];
  for (const run of sorted.slice(1)) {
    const current = merged[merged.length - 1];
    if (run.start <= current.end + WALL_EPS) current.end = Math.max(current.end, run.end);
    else merged.push({ ...run });
  }
  return merged;
}

function arcRunLengths(level: Level): number[] {
  const byRadius = new Map<number, WallRun[]>();
  for (const edge of level.edges) {
    if (edge.open || edge.wall.type !== "arc") continue;
    const runs = byRadius.get(edge.wall.radius) ?? [];
    runs.push({ start: edge.wall.a0, end: edge.wall.a1 });
    byRadius.set(edge.wall.radius, runs);
  }
  return [...byRadius.entries()].flatMap(([radius, runs]) =>
    mergeWallRuns(runs).map((run) => (run.end - run.start) * radius),
  );
}

function radialRunLengths(level: Level): number[] {
  const byAngle = new Map<string, WallRun[]>();
  for (const edge of level.edges) {
    if (edge.open || edge.wall.type !== "line") continue;
    const angle = Math.atan2(edge.wall.y1, edge.wall.x1);
    const r1 = Math.hypot(edge.wall.x1, edge.wall.y1);
    const r2 = Math.hypot(edge.wall.x2, edge.wall.y2);
    if (r1 < WALL_EPS || r2 < WALL_EPS) continue;
    const wrapped = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
    const key = wrapped.toFixed(6);
    const runs = byAngle.get(key) ?? [];
    runs.push({ start: Math.min(r1, r2), end: Math.max(r1, r2) });
    byAngle.set(key, runs);
  }
  return [...byAngle.values()].flatMap((runs) =>
    mergeWallRuns(runs).map((run) => run.end - run.start),
  );
}

function straightRunLengths(level: Level): number[] {
  const byLine = new Map<string, WallRun[]>();
  for (const edge of level.edges) {
    if (edge.open || edge.wall.type !== "line") continue;
    const horizontal = Math.abs(edge.wall.y1 - edge.wall.y2) < WALL_EPS;
    const vertical = Math.abs(edge.wall.x1 - edge.wall.x2) < WALL_EPS;
    if (!horizontal && !vertical) continue;
    const coord = horizontal ? edge.wall.y1 : edge.wall.x1;
    const key = `${horizontal ? "h" : "v"}:${coord.toFixed(6)}`;
    const runs = byLine.get(key) ?? [];
    runs.push({
      start: horizontal ? Math.min(edge.wall.x1, edge.wall.x2) : Math.min(edge.wall.y1, edge.wall.y2),
      end: horizontal ? Math.max(edge.wall.x1, edge.wall.x2) : Math.max(edge.wall.y1, edge.wall.y2),
    });
    byLine.set(key, runs);
  }
  return [...byLine.values()].flatMap((runs) =>
    mergeWallRuns(runs).map((run) => run.end - run.start),
  );
}

describe("campaign floors", () => {
  for (const story of FLOORS) {
    it(`generates a playable floor ${story.config.floor}`, () => {
      const level = generateFloor(story.config);
      expectPlayable(level, story.config);
      expect(level.floor).toBe(story.config.floor);
      expect(level.orbStars).toBe(story.config.orbStars);
      expect(level.mission).toBe(story.config.mission);
      expect(level.metrics.cellCount).toBe(level.cells.length);
      expect(level.metrics.deadEnds).toBe(deadEnds(level).length);
    });
  }

  it("is deterministic for the same seed", () => {
    const config = FLOORS[2].config;
    const first = generateFloor(config);
    const second = generateFloor(config);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it("generates a fresh, playable layout for a replay", () => {
    const config = FLOORS[0].config;
    const campaign = generateFloor(config);
    const replay = generateFloor(config, 1);
    expectPlayable(replay, config);
    expect(replay.seed).toContain("replay-1");
    expect(replay.seed).not.toBe(campaign.seed);
    expect(replay.edges.map((edge) => edge.open)).not.toEqual(
      campaign.edges.map((edge) => edge.open),
    );
    expect(JSON.stringify(generateFloor(config, 1))).toBe(JSON.stringify(replay));
  });

  it("generates a playable replay variant for every floor", () => {
    for (const story of FLOORS) {
      expectPlayable(generateFloor(story.config, 7), story.config);
    }
  });

  it("generates a fresh, playable layout for a run seed", () => {
    const config = FLOORS[0].config;
    const first = generateFloor(config, 0, "alpha");
    const second = generateFloor(config, 0, "beta");
    expectPlayable(first, config);
    expectPlayable(second, config);
    expect(first.seed).toContain("run-alpha");
    expect(second.seed).toContain("run-beta");
    expect(first.seed).not.toBe(second.seed);
    expect(first.edges.map((edge) => edge.open)).not.toEqual(
      second.edges.map((edge) => edge.open),
    );
    expect(JSON.stringify(generateFloor(config, 0, "alpha"))).toBe(JSON.stringify(first));
  });

  it("survives many alternate seeds", () => {
    for (const story of FLOORS) {
      for (let index = 0; index < 16; index++) {
        const config: FloorConfig = {
          ...story.config,
          seed: `${story.config.seed}-alternate-${index}`,
        };
        const level = generateFloor(config);
        expectPlayable(level, config);
      }
    }
  });

  it("keeps the first three floors as a clear difficulty ladder", () => {
    const [first, second, third] = FLOORS.slice(0, 3).map((story) => generateFloor(story.config));
    expect(first.rings).toBe(10);
    expect(second.rings).toBeGreaterThanOrEqual(15);
    expect(third.earShapes).toHaveLength(2);
    expect(first.cells.length).toBeGreaterThan(140);
    expect(second.cells.length).toBeGreaterThan(330);
    expect(third.cells.length).toBeGreaterThan(210);
    expect(third.cells.filter((cell) => cell.kind === "ear").length).toBeGreaterThanOrEqual(70);
    expect(third.edges.filter((edge) => edge.kind === "ear" && !edge.open).length).toBeGreaterThan(40);
    expect(first.mission).toBe("rescue");
    expect(second.mission).toBe("coins");
    expect(second.coinCells).toHaveLength(12);
    expect(third.mission).toBe("code");
  });

  it("uses one sector count per floor so arcs and radial walls can run long", () => {
    const [first, second, third] = FLOORS.slice(0, 3).map((story) => generateFloor(story.config));
    for (const level of [first, second, third]) {
      const sectorCounts = new Set(
        level.cells.filter((cell) => cell.kind === "normal").map((cell) => cell.sectors),
      );
      expect(sectorCounts.size).toBe(1);
    }
    expect(first.cells.find((cell) => cell.kind === "normal")?.sectors).toBe(16);
    expect(second.cells.find((cell) => cell.kind === "normal")?.sectors).toBe(24);
    expect(third.cells.find((cell) => cell.kind === "normal")?.sectors).toBe(16);
  });

  it("keeps long continuous wall runs like the hand-drawn reference maps", () => {
    const [first, second, third] = FLOORS.slice(0, 3).map((story) => generateFloor(story.config));

    expect(Math.max(...arcRunLengths(first))).toBeGreaterThan(12);
    expect(Math.max(...radialRunLengths(first))).toBeGreaterThan(4);
    expect(Math.max(...arcRunLengths(second))).toBeGreaterThan(14);
    expect(Math.max(...radialRunLengths(second))).toBeGreaterThan(4);
    expect(Math.max(...arcRunLengths(third))).toBeGreaterThan(10);
    expect(Math.max(...radialRunLengths(third))).toBeGreaterThan(2);
    expect(Math.max(...straightRunLengths(third))).toBeGreaterThan(5);
  });
});
