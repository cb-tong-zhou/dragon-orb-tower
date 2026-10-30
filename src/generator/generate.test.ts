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
  expect(level.cells[level.startCell]?.kind).toBe("start");
  expect(level.cells[level.exitCell]?.kind).toBe("exit");
  expect(level.cells[level.friendCell]?.kind).toBe("normal");
  expect(level.cells[level.friendCell]?.ring ?? 0).toBeLessThan(level.rings - 1);
  expect(level.metrics.pathToFriend).toBeGreaterThanOrEqual(config.rings * 2);
  // Radar floors place the exit on the rim, so its walk is one arc away rather
  // than a dive back through the middle of the maze. Keep it at least one ring
  // deep; the orb and radar already carry the long journey.
  const exitFloor =
    config.mission === "radar" ? config.rings : Math.floor(config.rings * 1.3);
  expect(level.metrics.pathToExit).toBeGreaterThanOrEqual(exitFloor);
  expect(level.metrics.deadEnds).toBeGreaterThanOrEqual(config.deadEndMin ?? config.rings * 2.5);

  if (config.mission === "rescue") {
    expect(level.orbCell).toBe(0);
    expect(level.radarCell).toBe(-1);
    expect(level.coinCells).toHaveLength(0);
    expect(level.carrotCells).toHaveLength(0);
    expect(level.metrics.pathToOrb).toBeGreaterThanOrEqual(config.rings * 1.8);
    expect(level.metrics.pathToFriend).toBeGreaterThanOrEqual(config.rings * 2);
  }

  if (config.mission === "coins") {
    expect(level.orbCell).toBe(-1);
    expect(level.radarCell).toBe(-1);
    expect(level.coinCells).toHaveLength(config.coinCount ?? 0);
    expect(level.coinChoices).toHaveLength(4);
    expect(level.coinChoices).toContain(level.coinCells.length);
    expect(level.metrics.pathToFriend).toBeGreaterThanOrEqual(config.rings * 3);
    expect(level.metrics.pathToExit).toBeGreaterThanOrEqual(config.rings * 2.5);
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
    expect(level.metrics.pathToOrb).toBeGreaterThanOrEqual(config.rings * 3.5);
    expect(bfsPath(level, level.startCell, level.radarCell).length - 1).toBeGreaterThanOrEqual(
      config.rings * 4.5,
    );
    expect(level.metrics.pathToFriend).toBeGreaterThanOrEqual(config.rings * 4);
    expect(level.coinCells).toHaveLength(config.coinCount ?? 3);
    for (const cellId of level.coinCells) {
      expect(level.cells[cellId]?.kind).toBe("normal");
      expect(bfsPath(level, level.startCell, cellId).length).toBeGreaterThan(1);
    }
  }
}

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
    expect(first.rings).toBe(14);
    expect(second.rings).toBeGreaterThanOrEqual(18);
    expect(third.earShapes).toHaveLength(2);
    expect(first.cells.length).toBeGreaterThan(100);
    expect(second.cells.length).toBeGreaterThan(250);
    expect(third.cells.length).toBeGreaterThan(180);
    expect(third.cells.filter((cell) => cell.kind === "ear").length).toBeGreaterThanOrEqual(70);
    expect(third.edges.filter((edge) => edge.kind === "ear" && !edge.open).length).toBeGreaterThan(40);
    expect(first.mission).toBe("rescue");
    expect(second.mission).toBe("coins");
    expect(second.coinCells).toHaveLength(12);
    expect(third.mission).toBe("code");
  });

  it("builds every floor on a theta grid of near-square cells", () => {
    for (const story of FLOORS) {
      const level = generateFloor(story.config);
      for (const cell of level.cells) {
        if (cell.kind !== "normal" || cell.ring < 1) continue;
        // Inner arc width: also the narrowest doorway into the cell.
        const width = ((cell.a1 - cell.a0) * cell.r0);
        expect(width, `floor ${story.config.floor} ring ${cell.ring}`).toBeGreaterThan(0.9);
        expect(width, `floor ${story.config.floor} ring ${cell.ring}`).toBeLessThan(2.2);
      }
    }
  });

  it("gets bushier, with more side branches, on later floors", () => {
    const ratio = (index: number) => {
      const level = generateFloor(FLOORS[index].config);
      return level.metrics.deadEnds / level.metrics.cellCount;
    };
    expect(ratio(6)).toBeGreaterThan(ratio(0) * 1.3);
    expect(ratio(0)).toBeGreaterThan(0.1);
  });

  it("builds the bunny ears from long straight wall runs", () => {
    const bunny = generateFloor(FLOORS[2].config);
    expect(Math.max(...straightRunLengths(bunny))).toBeGreaterThan(5);
  });
});
