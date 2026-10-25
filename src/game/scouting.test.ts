import { describe, expect, it } from "vitest";
import type { CellKind } from "../generator/types";
import {
  branchKey,
  chooseAutoTarget,
  createScoutMark,
  isMarkableDeadEnd,
  listScoutBranches,
  makeScoutHighlight,
  traverseCorridor,
} from "./scouting";
import { testCell, testEdge, testLevel } from "./testLevel";

function corridor(length: number, leafKind: CellKind = "normal") {
  const cells = Array.from({ length }, (_, id) =>
    testCell(id, id === length - 1 ? leafKind : "normal"),
  );
  const edges = Array.from({ length: length - 1 }, (_, id) => testEdge(id, id + 1));
  return testLevel({ cells, edges });
}

/**
 * 0 is the junction.
 * Branch 1: 0-1-2 (2 cells)
 * Branch 3: 0-3 (1 cell)
 * Branch 4: 0-4-5-6 (3 cells)
 */
function branchyLevel() {
  const cells = Array.from({ length: 7 }, (_, id) => testCell(id));
  const edges = [
    testEdge(0, 1),
    testEdge(1, 2),
    testEdge(0, 3),
    testEdge(0, 4),
    testEdge(4, 5),
    testEdge(5, 6),
  ];
  return testLevel({ cells, edges });
}

/** 0 is a junction; the 0-1-2 corridor ends at another junction at 2. */
function forkAtEndLevel() {
  const cells = Array.from({ length: 7 }, (_, id) => testCell(id));
  const edges = [
    testEdge(0, 1),
    testEdge(1, 2),
    testEdge(2, 3),
    testEdge(2, 4),
    testEdge(0, 5),
    testEdge(0, 6),
  ];
  return testLevel({ cells, edges });
}

describe("traverseCorridor", () => {
  it("walks a corridor to a normal dead end", () => {
    const level = corridor(5);
    const walk = traverseCorridor(level, 0, 1);

    expect(walk.path).toEqual([0, 1, 2, 3, 4]);
    expect(walk.ending).toBe("dead-end");
    expect(isMarkableDeadEnd(level, walk)).toBe(true);
  });

  it("treats bunny-ear leaves as markable", () => {
    const level = corridor(4, "ear");
    const walk = traverseCorridor(level, 0, 1);

    expect(walk.ending).toBe("dead-end");
    expect(isMarkableDeadEnd(level, walk)).toBe(true);
  });

  it("does not mark a center leaf", () => {
    const level = corridor(4, "center");
    const walk = traverseCorridor(level, 0, 1);

    expect(walk.ending).toBe("dead-end");
    expect(isMarkableDeadEnd(level, walk)).toBe(false);
    expect(createScoutMark(level, "mira", walk)).toBeNull();
  });

  it("stops at a portal cell", () => {
    const level = corridor(4, "exit");
    const walk = traverseCorridor(level, 0, 1);

    expect(walk.path).toEqual([0, 1, 2, 3]);
    expect(walk.ending).toBe("portal");
    expect(isMarkableDeadEnd(level, walk)).toBe(false);
    expect(createScoutMark(level, "mira", walk)).toBeNull();
  });

  it("stops at a junction without walking down either forward branch", () => {
    const level = forkAtEndLevel();
    const walk = traverseCorridor(level, 0, 1);

    expect(walk.path).toEqual([0, 1, 2]);
    expect(walk.ending).toBe("junction");
    expect(createScoutMark(level, "mira", walk)).toBeNull();
  });

  it("stops at the step limit", () => {
    const level = corridor(10);
    const walk = traverseCorridor(level, 0, 1, 3);

    expect(walk.path).toEqual([0, 1, 2]);
    expect(walk.ending).toBe("too-far");
  });
});

describe("scout marks", () => {
  it("creates a mark at a normal dead end", () => {
    const level = corridor(4);
    const walk = traverseCorridor(level, 0, 1);

    expect(createScoutMark(level, "mira", walk, 123)).toEqual({
      id: "scout-mira-3",
      friendId: "mira",
      cells: [0, 1, 2, 3],
      deadEndCellId: 3,
      kind: "dead-end",
      createdAt: 123,
    });
  });
});

describe("scout branches", () => {
  it("lists every eligible branch from a junction", () => {
    const level = branchyLevel();
    const branches = listScoutBranches(level, 0, new Set());

    expect(branches).toEqual([
      { firstCell: 1, cells: [1, 2], ending: "dead-end" },
      { firstCell: 3, cells: [3], ending: "dead-end" },
      { firstCell: 4, cells: [4, 5, 6], ending: "dead-end" },
    ]);
    expect(makeScoutHighlight("mira", branches).targets).toEqual([1, 3, 4]);
  });

  it("picks the shortest branch, with a stable tie break", () => {
    expect(chooseAutoTarget(branchyLevel(), 0, new Set())).toBe(3);

    const tied = testLevel({
      cells: [0, 1, 2, 3, 4].map((id) => testCell(id)),
      edges: [testEdge(0, 1), testEdge(0, 2), testEdge(0, 3), testEdge(3, 4)],
    });
    expect(chooseAutoTarget(tied, 0, new Set())).toBe(1);
  });

  it("skips the branch Sora came from", () => {
    expect(chooseAutoTarget(branchyLevel(), 0, new Set(), 3)).toBe(1);
  });

  it("skips branches already checked at this junction", () => {
    const checked = new Set([branchKey(0, 3)]);
    expect(chooseAutoTarget(branchyLevel(), 0, checked)).toBe(1);

    checked.add(branchKey(0, 1));
    expect(chooseAutoTarget(branchyLevel(), 0, checked)).toBe(4);
  });

  it("returns null when every branch is checked", () => {
    const checked = new Set([1, 3, 4].map((firstCell) => branchKey(0, firstCell)));
    expect(chooseAutoTarget(branchyLevel(), 0, checked)).toBeNull();
  });

  it("only offers branches when Sora is at a junction", () => {
    const level = corridor(4);
    expect(listScoutBranches(level, 0, new Set())).toEqual([]);
    expect(chooseAutoTarget(level, 0, new Set())).toBeNull();
  });

  it("reports a branch that ends at another junction", () => {
    const level = forkAtEndLevel();
    const branches = listScoutBranches(level, 0, new Set());
    const firstBranch = branches.find((branch) => branch.firstCell === 1);

    expect(firstBranch).toEqual({
      firstCell: 1,
      cells: [1, 2],
      ending: "junction",
    });
  });
});
