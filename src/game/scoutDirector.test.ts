import { describe, expect, it } from "vitest";
import {
  applyPlayerStep,
  canDispatch,
  createScoutState,
  dispatchScout,
  eligibleBranches,
  hasBlockedMember,
  hasTickWork,
  makeHighlight,
  planAutoDispatch,
  recallFriend,
  resolveScoutTap,
  selectFriend,
  syncParty,
  tickScouts,
  checkRescue,
  waitingGremlins,
} from "./scoutDirector";
import { branchKey } from "./scouting";
import { testCell, testEdge, testLevel } from "./testLevel";

/**
 * 0 is the junction with three branches:
 *   A: 0-1-4           (2 cells, normal leaf)
 *   B: 0-2-5-6-7       (4 cells, normal leaf)
 *   C: 0-3-8-9-10-11   (5 cells, ends at junction 11)
 */
function scoutLevel(floor = 3) {
  const cells = Array.from({ length: 14 }, (_, id) => testCell(id));
  const edges = [
    testEdge(0, 1),
    testEdge(1, 4),
    testEdge(0, 2),
    testEdge(2, 5),
    testEdge(5, 6),
    testEdge(6, 7),
    testEdge(0, 3),
    testEdge(3, 8),
    testEdge(8, 9),
    testEdge(9, 10),
    testEdge(10, 11),
    testEdge(11, 12),
    testEdge(11, 13),
  ];
  return testLevel({ cells, edges, floor, startCell: 0 });
}

function runToIdle(state: ReturnType<typeof createScoutState>, level = scoutLevel()) {
  let current = state;
  for (let i = 0; i < 40; i++) {
    if (!hasTickWork(current)) break;
    current = tickScouts(current, level).state;
  }
  return current;
}

describe("dispatchScout", () => {
  it("reserves the charge and sends the friend down the branch", () => {
    const level = scoutLevel();
    const state = createScoutState(["mira"], 0);
    const { state: next, events } = dispatchScout(state, level, "mira", 1);

    expect(events).toEqual([{ type: "sent", characterId: "mira" }]);
    const mira = next.party[0];
    expect(mira.mode).toBe("scout");
    expect(mira.hasCharge).toBe(false);
    expect(mira.scoutPath).toEqual([0, 1, 4]);
  });

  it("rejects an unavailable or used friend", () => {
    const level = scoutLevel();
    const state = createScoutState(["mira", "bo"], 0);
    const spent = dispatchScout(state, level, "mira", 1).state;

    // bo tries the same corridor: busy branch, no dispatch.
    const sameBranch = dispatchScout(spent, level, "bo", 1);
    expect(sameBranch.events).toEqual([]);
    expect(sameBranch.state.party[1].mode).toBe("follow");

    // An unknown branch is rejected outright.
    const unknown = dispatchScout(state, level, "bo", 99);
    expect(unknown.events).toEqual([]);
  });

  it("refuses a third concurrent scout and pauses while a friend is blocked", () => {
    const level = scoutLevel();
    const state = createScoutState(["mira", "bo", "pico"], 0);
    const two = dispatchScout(
      dispatchScout(state, level, "mira", 1).state,
      level,
      "bo",
      2,
    ).state;
    expect(two.party.filter((m) => m.mode === "scout")).toHaveLength(2);

    const third = dispatchScout(two, level, "pico", 3);
    expect(third.events).toEqual([]);
    expect(third.state.party[2].mode).toBe("follow");

    const blocked = {
      ...two,
      gremlins: [
        { id: "g1", cellId: 5, blockedFriendId: "mira", state: "waiting" as const },
      ],
    };
    expect(canDispatch(blocked, level)).toBe(false);
  });
});

describe("tickScouts", () => {
  it("walks to a dead end, chalks a mark, spends the charge, and returns", () => {
    const level = scoutLevel(3);
    const dispatched = dispatchScout(createScoutState(["mira"], 0), level, "mira", 1).state;

    const stepOne = tickScouts(dispatched, level);
    expect(stepOne.state.party[0].cellId).toBe(1);

    const arrived = tickScouts(stepOne.state, level);
    expect(arrived.events).toEqual([
      { type: "mark", characterId: "mira", deadEndCellId: 4 },
    ]);
    expect(arrived.state.marks).toHaveLength(1);
    expect(arrived.state.marks[0].cells).toEqual([0, 1, 4]);
    expect(arrived.state.marks[0].deadEndCellId).toBe(4);
    expect(arrived.state.party[0].hasCharge).toBe(false);
    expect(arrived.state.party[0].mode).toBe("return");

    const home = runToIdle(arrived.state, level);
    expect(home.party[0].mode).toBe("follow");
    expect(home.marks).toHaveLength(1);
  });

  it("refunds the charge and marks the branch checked at a junction", () => {
    const level = scoutLevel(3);
    const dispatched = dispatchScout(createScoutState(["bo"], 0), level, "bo", 3).state;

    let current = dispatched;
    let events: unknown[] = [];
    for (let i = 0; i < 10; i++) {
      const result = tickScouts(current, level);
      current = result.state;
      events = [...events, ...result.events];
      if (current.party[0].mode === "return") break;
    }

    expect(current.party[0].hasCharge).toBe(true);
    expect(current.checkedBranches).toContain(branchKey(0, 3));
    expect(events).toContainEqual({
      type: "no-mark",
      characterId: "bo",
      ending: "junction",
    });
    expect(current.marks).toHaveLength(0);
  });

  it("excludes marked and busy branches from eligibility", () => {
    const level = scoutLevel(3);
    const marked = runToIdle(
      dispatchScout(createScoutState(["mira", "bo"], 0), level, "mira", 1).state,
      level,
    );

    const branches = eligibleBranches(marked, level, "manual").map((b) => b.firstCell);
    expect(branches).not.toContain(1);

    const busy = dispatchScout(marked, level, "bo", 2).state;
    const whileScouting = eligibleBranches(busy, level, "manual").map((b) => b.firstCell);
    expect(whileScouting).not.toContain(2);
  });
});

describe("grumblin blocks", () => {
  it("spawns the floor-2 tutorial grumblin on the return leg", () => {
    const level = scoutLevel(2);
    const dispatched = dispatchScout(createScoutState(["mira"], 0), level, "mira", 2).state;

    let current = dispatched;
    for (let i = 0; i < 6; i++) {
      current = tickScouts(current, level).state;
    }

    expect(current.marks).toHaveLength(1);
    expect(current.gremlins).toHaveLength(1);
    const gremlin = current.gremlins[0];
    expect(gremlin.state).toBe("waiting");
    expect([5, 6]).toContain(gremlin.cellId);
    expect(current.party[0].mode).toBe("blocked");
    expect(current.party[0].blockedBy).toBe(gremlin.id);
    expect(hasBlockedMember(current)).toBe(true);
  });

  it("never spawns on floor 1 or on the first floor-3+ scout", () => {
    const floor1 = scoutLevel(1);
    const floor1State = runToIdle(
      dispatchScout(createScoutState(["mira"], 0), floor1, "mira", 2).state,
      floor1,
    );
    expect(floor1State.gremlins).toHaveLength(0);

    const floor3 = scoutLevel(3);
    const floor3State = runToIdle(
      dispatchScout(createScoutState(["mira"], 0), floor3, "mira", 2).state,
      floor3,
    );
    expect(floor3State.gremlins).toHaveLength(0);
  });

  it("is deterministic for the same seed, friend, and dead end", () => {
    const level = scoutLevel(2);
    const run = () =>
      runToIdle(dispatchScout(createScoutState(["mira"], 0), level, "mira", 2).state, level);

    const first = run();
    const second = run();
    expect(first.gremlins[0]?.cellId).toBe(second.gremlins[0]?.cellId);
  });

  it("cannot be recalled while blocked, then freed by Sora's arrival", () => {
    const level = scoutLevel(2);
    let current = createScoutState(["mira"], 0);
    current = dispatchScout(current, level, "mira", 2).state;
    current = runToIdle(current, level);
    expect(current.party[0].mode).toBe("blocked");

    const recalled = recallFriend(current, "mira");
    expect(recalled.state.party[0].mode).toBe("blocked");

    const gremlin = current.gremlins[0];
    const rescueCell = gremlin.cellId === 5 ? 6 : 5;
    const freed = checkRescue(current, level, rescueCell);

    expect(freed.events).toEqual([{ type: "freed", characterId: "mira" }]);
    expect(freed.state.gremlins[0].state).toBe("fleeing");
    expect(freed.state.party[0].mode).toBe("return");
    expect(hasBlockedMember(freed.state)).toBe(false);
    expect(waitingGremlins(freed.state)).toHaveLength(0);

    const poofed = tickScouts(freed.state, level);
    expect(poofed.state.gremlins).toHaveLength(0);
  });

  it("ignores a rescue attempt that is not adjacent through an open edge", () => {
    const level = scoutLevel(2);
    let current = createScoutState(["mira"], 0);
    current = dispatchScout(current, level, "mira", 2).state;
    current = runToIdle(current, level);

    const far = checkRescue(current, level, 12);
    expect(far.events).toEqual([]);
    expect(far.state.party[0].mode).toBe("blocked");
  });
});

describe("recallFriend", () => {
  it("refunds when recalled before a mark", () => {
    const level = scoutLevel(3);
    const dispatched = dispatchScout(createScoutState(["mira"], 0), level, "mira", 1).state;
    const recalled = recallFriend(dispatched, "mira");

    expect(recalled.state.party[0].mode).toBe("follow");
    expect(recalled.state.party[0].hasCharge).toBe(true);
  });

  it("keeps the charge spent after a mark was made", () => {
    const level = scoutLevel(3);
    const state = createScoutState(["mira"], 0);
    const dispatched = dispatchScout(state, level, "mira", 1).state;
    const arrived = tickScouts(tickScouts(dispatched, level).state, level).state;

    const recalled = recallFriend(arrived, "mira");
    expect(recalled.state.party[0].hasCharge).toBe(false);
    expect(recalled.state.marks).toHaveLength(1);
  });
});

describe("manual selection taps", () => {
  it("dispatches on a branch tap, cancels on Sora, ignores far cells", () => {
    const level = scoutLevel(3);
    const selected = selectFriend(createScoutState(["mira"], 0), "mira");

    const dispatch = resolveScoutTap(selected, level, 6);
    expect(dispatch.action).toBe("dispatched");
    expect(dispatch.result.state.party[0].mode).toBe("scout");
    expect(dispatch.result.state.selectedFriendId).toBeNull();

    const boSelected = selectFriend(createScoutState(["mira", "bo"], 0), "bo");
    expect(boSelected.selectedFriendId).toBe("bo");
    expect(resolveScoutTap(boSelected, level, 0).action).toBe("cancelled");

    const selectedAgain = selectFriend(createScoutState(["mira"], 0), "mira");
    expect(resolveScoutTap(selectedAgain, level, 13).action).toBe("ignored");
    expect(selectedAgain.selectedFriendId).toBe("mira");
  });

  it("highlights only eligible branches for the selected friend", () => {
    const level = scoutLevel(3);
    const selected = selectFriend(createScoutState(["mira"], 0), "mira");
    const highlight = makeHighlight(selected, level);

    expect(highlight?.friendId).toBe("mira");
    expect(highlight?.targets.sort()).toEqual([1, 2, 3]);
  });
});

describe("planAutoDispatch", () => {
  it("picks the shortest unchecked branch and skips the way Sora came", () => {
    const level = scoutLevel(3);
    const state = createScoutState(["mira"], 0);
    expect(planAutoDispatch(state, level)).toEqual({
      characterId: "mira",
      firstCell: 1,
    });

    const arrivedFromOne = { ...state, playerTrail: [0, 1] };
    expect(planAutoDispatch(arrivedFromOne, level)?.firstCell).toBe(2);
  });

  it("skips checked branches and offers one scout per junction", () => {
    const level = scoutLevel(3);
    const state = createScoutState(["mira"], 0);
    const checked = { ...state, checkedBranches: [branchKey(0, 1)] };
    expect(planAutoDispatch(checked, level)?.firstCell).toBe(2);

    const auto = dispatchScout(state, level, "mira", 1, "auto").state;
    expect(auto.lastAutoJunction).toBe(0);
    expect(planAutoDispatch(auto, level)).toBeNull();
  });

  it("waits while a friend is blocked or nobody has a charge", () => {
    const level = scoutLevel(3);
    const spent = createScoutState(["mira"], 0);
    const used = {
      ...spent,
      party: spent.party.map((member) => ({ ...member, hasCharge: false })),
    };
    expect(planAutoDispatch(used, level)).toBeNull();

    const blocked = {
      ...spent,
      gremlins: [
        { id: "g1", cellId: 5, blockedFriendId: "mira", state: "waiting" as const },
      ],
    };
    expect(planAutoDispatch(blocked, level)).toBeNull();
  });
});

describe("party bookkeeping", () => {
  it("slides the conga line along the player trail", () => {
    const state = createScoutState(["mira", "bo"], 0);
    const one = applyPlayerStep(state, 1);
    expect(one.playerTrail).toEqual([1, 0]);
    expect(one.party.map((member) => member.cellId)).toEqual([0, 0]);

    const two = applyPlayerStep(one, 4);
    expect(two.playerTrail).toEqual([4, 1, 0]);
    expect(two.party.map((member) => member.cellId)).toEqual([1, 0]);
  });

  it("syncs membership while preserving charges, marks, and modes", () => {
    const level = scoutLevel(3);
    const state = createScoutState(["mira"], 0);
    const used = runToIdle(dispatchScout(state, level, "mira", 1).state, level);
    expect(used.party[0].hasCharge).toBe(false);

    const grown = syncParty(used, ["mira", "bo"]);
    expect(grown.party).toHaveLength(2);
    expect(grown.party[0].hasCharge).toBe(false);
    expect(grown.party[1].hasCharge).toBe(true);
    expect(grown.marks).toHaveLength(1);

    const shrunken = syncParty(grown, ["bo"]);
    expect(shrunken.party.map((member) => member.characterId)).toEqual(["bo"]);
  });

  it("drops a selection whose friend left the active party", () => {
    const state = createScoutState(["mira"], 0);
    const selected = selectFriend(state, "mira");
    const shrunken = syncParty(selected, []);
    expect(shrunken.selectedFriendId).toBeNull();
  });
});
