import { describe, expect, it } from "vitest";
import type { CellKind } from "./types";
import { localCorridor, localWalkPath } from "./graph";
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
