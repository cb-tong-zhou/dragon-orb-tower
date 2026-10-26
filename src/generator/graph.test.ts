import { describe, expect, it } from "vitest";
import type { CellKind } from "./types";
import {
  localCorridor,
  localWalkPath,
  neighborToward,
  straightestOpenNeighbor,
} from "./graph";
import { testCell, testEdge, testLevel } from "../game/testLevel";

/**
 * 0-1-2 forms a corridor; 2 is a junction with branches 2-4-6 (dead end at 6)
 * and 2-5 (dead end at 5).
 */
function forkLevel() {
  const cells = Array.from({ length: 7 }, (_, id) => testCell(id));
  const edges = [
    testEdge(0, 1),
    testEdge(1, 2),
    testEdge(2, 4),
    testEdge(4, 6),
    testEdge(2, 5),
  ];
  return testLevel({ cells, edges });
}

function chainLevel(length: number, leafKind: CellKind = "normal") {
  const cells = Array.from({ length }, (_, id) =>
    testCell(id, id === length - 1 ? leafKind : "normal"),
  );
  const edges = Array.from({ length: length - 1 }, (_, id) => testEdge(id, id + 1));
  return testLevel({ cells, edges });
}

describe("localCorridor", () => {
  it("stops at the first junction and includes the fork cell", () => {
    const level = forkLevel();
    expect(localCorridor(level, 0, 1)).toEqual([1, 2]);
  });

  it("runs to a dead-end leaf", () => {
    const level = forkLevel();
    expect(localCorridor(level, 2, 4)).toEqual([4, 6]);
  });

  it("stops at a portal leaf", () => {
    const level = chainLevel(3, "exit");
    expect(localCorridor(level, 0, 1)).toEqual([1, 2]);
  });

  it("never crosses the fork into a far branch", () => {
    const level = forkLevel();
    expect(localCorridor(level, 0, 1)).not.toContain(6);
  });

  it("handles a ring corridor without looping forever", () => {
    const cells = Array.from({ length: 4 }, (_, id) => testCell(id));
    const edges = [testEdge(0, 1), testEdge(1, 2), testEdge(2, 3), testEdge(3, 0)];
    const level = testLevel({ cells, edges });

    expect(localCorridor(level, 0, 1)).toEqual([1, 2, 3]);
  });
});

describe("localWalkPath", () => {
  it("walks a mid-corridor tap to the next fork", () => {
    const level = forkLevel();
    expect(localWalkPath(level, 0, 1)).toEqual([1, 2]);
  });

  it("walks a tap on the fork cell itself", () => {
    const level = forkLevel();
    expect(localWalkPath(level, 0, 2)).toEqual([1, 2]);
  });

  it("ignores a tap beyond the fork so distant targets never auto-path", () => {
    const level = forkLevel();
    expect(localWalkPath(level, 0, 6)).toBeNull();
    expect(localWalkPath(level, 0, 5)).toBeNull();
    expect(localWalkPath(level, 0, 3)).toBeNull();
  });

  it("accepts any cell inside an adjacent branch when standing at a fork", () => {
    const level = forkLevel();
    expect(localWalkPath(level, 2, 4)).toEqual([4, 6]);
    expect(localWalkPath(level, 2, 6)).toEqual([4, 6]);
    expect(localWalkPath(level, 2, 5)).toEqual([5]);
  });

  it("still refuses branches two forks away", () => {
    const level = forkLevel();
    // From the leaf at 6, cell 5 is beyond the fork at 2: two corridors away.
    expect(localWalkPath(level, 6, 5)).toBeNull();
  });

  it("lets a player walk back to a portal behind them", () => {
    const level = chainLevel(4, "start");
    expect(localWalkPath(level, 2, 0)).toEqual([1, 0]);
  });

  it("rejects the player's own cell and unknown cells", () => {
    const level = forkLevel();
    expect(localWalkPath(level, 2, 2)).toBeNull();
    expect(localWalkPath(level, 2, 99)).toBeNull();
  });

  it("rejects a dead-end cell with no way toward the target", () => {
    const level = chainLevel(3);
    expect(localWalkPath(level, 2, 0)).toEqual([1, 0]);
    expect(localWalkPath(level, 2, 2)).toBeNull();
  });
});

/**
 * A corridor 0-1-2 running along +x, a side branch 1-3 running along +y, and a
 * dead end at 2-4. Holding a heading should glide along the corridor and stop
 * at the dead end instead of turning down the side branch.
 */
function bendLevel() {
  const cells = [
    testCell(0, "start", 0, 0),
    testCell(1, "normal", 1, 0),
    testCell(2, "normal", 2, 0),
    testCell(3, "normal", 1, 1),
    testCell(4, "normal", 2.5, 0.5),
  ];
  const edges = [
    testEdge(0, 1),
    testEdge(1, 2),
    testEdge(1, 3),
    testEdge(2, 4),
  ];
  return testLevel({ cells, edges });
}

describe("neighborToward", () => {
  it("steps toward the pressed direction", () => {
    const level = bendLevel();
    expect(neighborToward(level, 1, { x: 3, y: 0.4 })).toBe(2);
    expect(neighborToward(level, 1, { x: 0.8, y: 3 })).toBe(3);
  });

  it("turns instead of doubling back when the cell behind is known", () => {
    const level = bendLevel();
    expect(neighborToward(level, 1, { x: 0, y: 0 }, 0)).toBe(3);
  });

  it("stops at a dead end instead of bouncing back", () => {
    const level = chainLevel(2);
    expect(neighborToward(level, 1, { x: 3, y: 0.2 }, 0)).toBeNull();
  });

  it("can still step back when nothing has been walked yet", () => {
    const level = chainLevel(2);
    expect(neighborToward(level, 1, { x: 0.2, y: 0 })).toBe(0);
  });

  it("ignores a press on Sora's own centre", () => {
    const level = bendLevel();
    expect(neighborToward(level, 1, { x: 1, y: 0 })).toBeNull();
  });
});

describe("straightestOpenNeighbor", () => {
  it("keeps gliding along a corridor", () => {
    const level = bendLevel();
    expect(straightestOpenNeighbor(level, 1, { x: 1, y: 0 })).toBe(2);
  });

  it("ignores a perpendicular side branch at a junction", () => {
    const level = bendLevel();
    expect(straightestOpenNeighbor(level, 1, { x: 0, y: 1 })).toBe(3);
    expect(straightestOpenNeighbor(level, 2, { x: 1, y: 0 })).toBe(4);
  });

  it("stops at a dead end instead of turning back", () => {
    const level = bendLevel();
    expect(straightestOpenNeighbor(level, 4, { x: 1, y: 0 }, { avoid: 2 })).toBeNull();
  });

  it("follows a tight corner when the corridor is one-way", () => {
    const cells = [
      testCell(0, "start", 0, 0),
      testCell(1, "normal", 1, 0),
      testCell(2, "normal", 1, 1),
    ];
    const level = testLevel({ cells, edges: [testEdge(0, 1), testEdge(1, 2)] });
    expect(straightestOpenNeighbor(level, 1, { x: 1, y: 0 }, { avoid: 0 })).toBe(2);
  });

  it("stops at a fork with no straight continuation", () => {
    const cells = [
      testCell(0, "start", 0, 0),
      testCell(1, "normal", 1, 0),
      testCell(2, "normal", 1, 1),
      testCell(3, "normal", 1, -1),
    ];
    const level = testLevel({
      cells,
      edges: [testEdge(0, 1), testEdge(1, 2), testEdge(1, 3)],
    });
    expect(straightestOpenNeighbor(level, 1, { x: 1, y: 0 }, { avoid: 0 })).toBeNull();
  });

  it("never walks into a wall", () => {
    const cells = [testCell(0, "start", 0, 0), testCell(1, "normal", 1, 0)];
    const level = testLevel({ cells, edges: [testEdge(0, 1, false)] });
    expect(straightestOpenNeighbor(level, 0, { x: 1, y: 0 })).toBeNull();
  });
});
