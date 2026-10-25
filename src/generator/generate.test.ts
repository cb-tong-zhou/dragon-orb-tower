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
      expect(["normal", "ear"]).toContain(level.cells[cellId]?.kind);
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
    expect(first.rings).toBe(9);
    expect(second.rings).toBeGreaterThan(first.rings);
    expect(third.earShapes).toHaveLength(2);
    expect(first.mission).toBe("rescue");
    expect(second.mission).toBe("coins");
    expect(third.mission).toBe("code");
  });
});
