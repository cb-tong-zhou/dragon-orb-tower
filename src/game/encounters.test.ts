import { describe, expect, it } from "vitest";
import type { CellKind } from "../generator/types";
import {
  isRescueProximity,
  makeEncounterRng,
  planEncounter,
  type EncounterContext,
} from "./encounters";
import { createScoutMark, traverseCorridor } from "./scouting";
import { testCell, testEdge, testLevel } from "./testLevel";

function markedCorridor(options?: {
  length?: number;
  floor?: number;
  specialKinds?: Partial<Record<number, CellKind>>;
}) {
  const length = options?.length ?? 6;
  const cells = Array.from({ length }, (_, id) =>
    testCell(id, options?.specialKinds?.[id] ?? "normal"),
  );
  const edges = Array.from({ length: length - 1 }, (_, id) => testEdge(id, id + 1));
  const level = testLevel({ cells, edges, floor: options?.floor ?? 3 });
  const walk = traverseCorridor(level, 0, 1);
  const mark = createScoutMark(level, "mira", walk, 1);
  if (!mark) throw new Error("Test fixture must produce a scout mark");
  return { level, mark };
}

function context(overrides: Partial<EncounterContext> = {}): EncounterContext {
  return {
    playerCell: 0,
    successfulScoutCount: 2,
    encountersThisFloor: 0,
    activeBlockCount: 0,
    rng: () => 0,
    ...overrides,
  };
}

const friend = { characterId: "mira" };

describe("planEncounter", () => {
  it("never spawns on floor 1", () => {
    const { level, mark } = markedCorridor({ floor: 1 });
    expect(planEncounter(level, friend, mark, context({ successfulScoutCount: 1 }))).toBeNull();
  });

  it("forces the first eligible floor-2 scout as the tutorial", () => {
    const { level, mark } = markedCorridor({ floor: 2 });
    const token = planEncounter(
      level,
      friend,
      mark,
      context({ successfulScoutCount: 1, encountersThisFloor: 0 }),
    );

    expect(token).toMatchObject({
      id: "gremlin-mira-5",
      cellId: 4,
      blockedFriendId: "mira",
      state: "waiting",
    });
  });

  it("keeps the first scout safe on floors 3 and above", () => {
    const { level, mark } = markedCorridor({ floor: 3 });
    expect(
      planEncounter(level, friend, mark, context({ successfulScoutCount: 1 })),
    ).toBeNull();
  });

  it("uses a 30% roll for later scouts", () => {
    const { level, mark } = markedCorridor({ floor: 3 });

    const lucky = planEncounter(
      level,
      friend,
      mark,
      context({ successfulScoutCount: 2, rng: () => 0.29 }),
    );
    expect(lucky).not.toBeNull();
    expect(lucky?.cellId).toBe(4);

    const unlucky = planEncounter(
      level,
      friend,
      mark,
      context({ successfulScoutCount: 2, rng: () => 0.3 }),
    );
    expect(unlucky).toBeNull();
  });

  it("rolls normally on floor 2 after the tutorial encounter slot", () => {
    const { level, mark } = markedCorridor({ floor: 2 });
    const lucky = planEncounter(
      level,
      friend,
      mark,
      context({ successfulScoutCount: 2, encountersThisFloor: 1, rng: () => 0.1 }),
    );
    expect(lucky).not.toBeNull();

    const unlucky = planEncounter(
      level,
      friend,
      mark,
      context({ successfulScoutCount: 2, encountersThisFloor: 1, rng: () => 0.3 }),
    );
    expect(unlucky).toBeNull();
  });

  it("caps encounters at two per floor", () => {
    const { level, mark } = markedCorridor({ floor: 3 });
    expect(
      planEncounter(
        level,
        friend,
        mark,
        context({ successfulScoutCount: 3, encountersThisFloor: 2 }),
      ),
    ).toBeNull();
  });

  it("allows only one active blocked friend at a time", () => {
    const { level, mark } = markedCorridor({ floor: 3 });
    expect(
      planEncounter(level, friend, mark, context({ activeBlockCount: 1 })),
    ).toBeNull();
  });

  it("places the grumblin one to three cells from the leaf, never at the fork", () => {
    const { level, mark } = markedCorridor({ floor: 3 });
    const token = planEncounter(level, friend, mark, context());

    expect(token).not.toBeNull();
    expect(token?.cellId).toBe(4);
    expect(token?.cellId).not.toBe(0);
    expect(token?.cellId).not.toBe(5);
    expect(mark.cells.slice(-4, -1)).toContain(token?.cellId);
  });

  it("keeps the grumblin at least two steps from Sora", () => {
    const { level, mark } = markedCorridor({ floor: 3 });
    const token = planEncounter(level, friend, mark, context({ playerCell: 0 }));

    expect(token).not.toBeNull();
    expect(token?.cellId).toBeGreaterThanOrEqual(2);
  });

  it("does not spawn when every candidate is too close to Sora", () => {
    const { level, mark } = markedCorridor({ floor: 2 });
    expect(
      planEncounter(level, friend, mark, context({ playerCell: 3, successfulScoutCount: 1 })),
    ).toBeNull();
  });

  it("does not spawn in a corridor too short for a safe encounter", () => {
    const { level, mark } = markedCorridor({ floor: 2, length: 3 });
    expect(
      planEncounter(level, friend, mark, context({ successfulScoutCount: 1 })),
    ).toBeNull();
  });

  it("only spawns on normal or ear cells", () => {
    const { level, mark } = markedCorridor({
      floor: 2,
      specialKinds: { 3: "center", 4: "ear" },
    });

    const first = planEncounter(
      level,
      friend,
      mark,
      context({ successfulScoutCount: 1, rng: () => 0 }),
    );
    expect(first?.cellId).toBe(4);
    expect(level.cells[4].kind).toBe("ear");

    const last = planEncounter(
      level,
      friend,
      mark,
      context({ successfulScoutCount: 1, rng: () => 0.99 }),
    );
    expect(last?.cellId).toBe(2);
    expect(level.cells[2].kind).toBe("normal");
  });

  it("is deterministic for the same rng seed", () => {
    const { level, mark } = markedCorridor({ floor: 3 });
    const run = () =>
      planEncounter(
        level,
        friend,
        mark,
        context({
          playerCell: 0,
          successfulScoutCount: 2,
          rng: makeEncounterRng(level, "mira", mark.deadEndCellId, 2),
        }),
      );

    expect(run()).toEqual(run());
  });
});

describe("makeEncounterRng", () => {
  it("returns the same sequence for the same inputs", () => {
    const { level, mark } = markedCorridor({ floor: 3 });
    const a = makeEncounterRng(level, "mira", mark.deadEndCellId, 2);
    const b = makeEncounterRng(level, "mira", mark.deadEndCellId, 2);

    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("isRescueProximity", () => {
  it("allows the grumblin cell and open neighbors only", () => {
    const level = testLevel({
      cells: [0, 1, 2, 3].map((id) => testCell(id)),
      edges: [testEdge(0, 1), testEdge(0, 2, false), testEdge(1, 3)],
    });

    expect(isRescueProximity(level, 0, 0)).toBe(true);
    expect(isRescueProximity(level, 0, 1)).toBe(true);
    expect(isRescueProximity(level, 1, 0)).toBe(true);
    expect(isRescueProximity(level, 0, 2)).toBe(false);
    expect(isRescueProximity(level, 0, 3)).toBe(false);
  });
});
