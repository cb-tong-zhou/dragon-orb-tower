import { isJunction } from "../generator/graph";
import type { Level } from "../generator/types";
import { GREMLIN_BLOCKS } from "./features";
import {
  branchKey,
  createScoutMark,
  listScoutBranches,
  makeScoutHighlight,
  traverseCorridor,
  MAX_ACTIVE_SCOUTS,
  type CorridorEnding,
  type ScoutBranch,
  type ScoutHighlight,
  type ScoutMark,
} from "./scouting";
import {
  isRescueProximity,
  makeEncounterRng,
  planEncounter,
  type GremlinToken,
} from "./encounters";
import { createPartyMember, type PartyMember } from "./friends";

/**
 * Pure scouting state machine. The React hook (useScoutDirector) owns timers
 * and commits snapshots; every rule below is plain data-in/data-out so the
 * whole feature is unit-testable without a DOM.
 */

export interface ScoutState {
  party: PartyMember[];
  marks: ScoutMark[];
  gremlins: GremlinToken[];
  /** `${junction}:${firstCell}` keys auto scouting must not retry. */
  checkedBranches: string[];
  /** Most recent player cells; index 0 is the current cell. */
  playerTrail: number[];
  /** Dead-end marks on this floor, including pending ones. */
  successfulScoutCount: number;
  encountersThisFloor: number;
  selectedFriendId: string | null;
  /** Junction where an auto offer already fired this floor. */
  lastAutoJunction: number | null;
  /** Logical clock for mark ids/createdAt. */
  tick: number;
}

export type ScoutEvent =
  | { type: "sent"; characterId: string }
  | { type: "mark"; characterId: string; deadEndCellId: number }
  | { type: "no-mark"; characterId: string; ending: CorridorEnding }
  | { type: "blocked"; characterId: string; gremlinId: string }
  | { type: "freed"; characterId: string }
  | { type: "returned"; characterId: string };

export interface ScoutResult {
  state: ScoutState;
  events: ScoutEvent[];
}

export type ScoutTapAction = "dispatched" | "cancelled" | "ignored";

const NO_EVENTS: ScoutEvent[] = [];

function trailCell(trail: readonly number[], slot: number): number {
  const index = slot + 1;
  if (index < trail.length) return trail[index];
  return trail[trail.length - 1] ?? 0;
}

function activeScoutCount(state: ScoutState): number {
  return state.party.filter((member) => member.mode === "scout").length;
}

export function waitingGremlins(state: ScoutState): GremlinToken[] {
  return state.gremlins.filter((gremlin) => gremlin.state === "waiting");
}

export function hasBlockedMember(state: ScoutState): boolean {
  return state.party.some((member) => member.mode === "blocked");
}

export function hasTickWork(state: ScoutState): boolean {
  return (
    state.party.some((member) => member.mode === "scout" || member.mode === "return") ||
    state.gremlins.some((gremlin) => gremlin.state === "fleeing")
  );
}

export function createScoutState(partyIds: readonly string[], startCell: number): ScoutState {
  return {
    party: partyIds.map((characterId, slot) => createPartyMember(characterId, startCell, slot)),
    marks: [],
    gremlins: [],
    checkedBranches: [],
    playerTrail: [startCell],
    successfulScoutCount: 0,
    encountersThisFloor: 0,
    selectedFriendId: null,
    lastAutoJunction: null,
    tick: 0,
  };
}

/** Reconcile membership (rescues, party-window shifts) with the running state. */
export function syncParty(
  state: ScoutState,
  partyIds: readonly string[],
): ScoutState {
  const party: PartyMember[] = partyIds.map((characterId, slot) => {
    const existing = state.party.find((member) => member.characterId === characterId);
    if (existing) {
      return {
        ...existing,
        slot,
        cellId: existing.mode === "follow" ? trailCell(state.playerTrail, slot) : existing.cellId,
      };
    }
    return createPartyMember(characterId, trailCell(state.playerTrail, slot), slot);
  });

  const selectionAlive = party.some(
    (member) => member.characterId === state.selectedFriendId,
  );

  return { ...state, party, selectedFriendId: selectionAlive ? state.selectedFriendId : null };
}

/** Record a player step and slide the conga line forward along the trail. */
export function applyPlayerStep(state: ScoutState, playerCell: number): ScoutState {
  if (state.playerTrail[0] === playerCell) return state;

  const trail = [playerCell, ...state.playerTrail].slice(
    0,
    Math.max(4, state.party.length + 1),
  );
  const party = state.party.map((member) =>
    member.mode === "follow"
      ? { ...member, cellId: trailCell(trail, member.slot) }
      : member,
  );

  return { ...state, playerTrail: trail, party };
}

/** Sora frees a blocked friend by reaching the grumblin or an open neighbor. */
export function checkRescue(
  state: ScoutState,
  level: Level,
  playerCell: number,
): ScoutResult {
  const events: ScoutEvent[] = [];
  const freedIds = new Set<string>();

  const gremlins = state.gremlins.map((gremlin) => {
    if (gremlin.state !== "waiting") return gremlin;
    if (!isRescueProximity(level, gremlin.cellId, playerCell)) return gremlin;
    freedIds.add(gremlin.blockedFriendId);
    events.push({ type: "freed", characterId: gremlin.blockedFriendId });
    return { ...gremlin, state: "fleeing" as const };
  });

  if (freedIds.size === 0) return { state, events };

  const party = state.party.map((member) =>
    freedIds.has(member.characterId) && member.mode === "blocked"
      ? { ...member, mode: "return" as const, blockedBy: undefined }
      : member,
  );

  return { state: { ...state, gremlins, party }, events };
}

function markedBranchKeys(marks: readonly ScoutMark[]): Set<string> {
  const keys = new Set<string>();
  for (const mark of marks) {
    if (mark.cells.length >= 2) {
      keys.add(branchKey(mark.cells[0], mark.cells[1]));
    }
  }
  return keys;
}

function busyBranchKeys(party: readonly PartyMember[]): Set<string> {
  const keys = new Set<string>();
  for (const member of party) {
    if (member.mode === "follow") continue;
    if (member.scoutPath.length >= 2) {
      keys.add(branchKey(member.scoutPath[0], member.scoutPath[1]));
    }
  }
  return keys;
}

/**
 * Adjacent corridors a friend may be sent down right now. Manual mode may
 * retry "keeps going" corridors; auto mode skips branches it already checked
 * and the corridor Sora just walked from.
 */
export function eligibleBranches(
  state: ScoutState,
  level: Level,
  purpose: "manual" | "auto",
): ScoutBranch[] {
  const playerCell = state.playerTrail[0];
  if (!isJunction(level, playerCell)) return [];

  const checked =
    purpose === "auto" ? new Set(state.checkedBranches) : new Set<string>();
  const lastCell = purpose === "auto" ? (state.playerTrail[1] ?? null) : null;
  const marked = markedBranchKeys(state.marks);
  const busy = busyBranchKeys(state.party);

  return listScoutBranches(level, playerCell, checked, lastCell).filter(
    (branch) => {
      const key = branchKey(playerCell, branch.firstCell);
      return !marked.has(key) && !busy.has(key);
    },
  );
}

export function makeHighlight(state: ScoutState, level: Level): ScoutHighlight | null {
  if (!state.selectedFriendId) return null;
  const branches = eligibleBranches(state, level, "manual");
  if (branches.length === 0) return null;
  return makeScoutHighlight(state.selectedFriendId, branches);
}

export function canDispatch(state: ScoutState, level: Level): boolean {
  if (!isJunction(level, state.playerTrail[0])) return false;
  if (waitingGremlins(state).length > 0) return false;
  if (activeScoutCount(state) >= MAX_ACTIVE_SCOUTS) return false;
  return state.party.some((member) => member.mode === "follow" && member.hasCharge);
}

export function dispatchScout(
  state: ScoutState,
  level: Level,
  characterId: string,
  firstCell: number,
  source: "manual" | "auto" = "manual",
): ScoutResult {
  const member = state.party.find((candidate) => candidate.characterId === characterId);
  if (!member || member.mode !== "follow" || !member.hasCharge) {
    return { state, events: NO_EVENTS };
  }
  if (!canDispatch(state, level)) return { state, events: NO_EVENTS };

  const branch = eligibleBranches(state, level, "manual").find(
    (candidate) => candidate.firstCell === firstCell,
  );
  if (!branch) return { state, events: NO_EVENTS };

  const walk = traverseCorridor(level, state.playerTrail[0], firstCell);
  const party = state.party.map((candidate) =>
    candidate.characterId === characterId
      ? {
          ...candidate,
          mode: "scout" as const,
          hasCharge: false,
          scoutPath: walk.path,
          scoutIndex: 0,
          cellId: walk.path[0],
          scoutEnding: walk.ending,
          blockedBy: undefined,
        }
      : candidate,
  );

  return {
    state: {
      ...state,
      party,
      selectedFriendId: null,
      lastAutoJunction: source === "auto" ? state.playerTrail[0] : state.lastAutoJunction,
    },
    events: [{ type: "sent", characterId }],
  };
}

/** Toggle manual-mode selection. Returns the new selection (or null). */
export function selectFriend(state: ScoutState, characterId: string): ScoutState {
  if (state.selectedFriendId === characterId) {
    return { ...state, selectedFriendId: null };
  }
  const member = state.party.find((candidate) => candidate.characterId === characterId);
  if (!member || member.mode !== "follow" || !member.hasCharge) return state;
  return { ...state, selectedFriendId: characterId };
}

export function cancelSelection(state: ScoutState): ScoutState {
  if (!state.selectedFriendId) return state;
  return { ...state, selectedFriendId: null };
}

/**
 * Recall a scouting or returning friend. Recalling before a mark refunds the
 * charge; the mark (if any) stays on the map.
 */
export function recallFriend(state: ScoutState, characterId: string): ScoutResult {
  const member = state.party.find((candidate) => candidate.characterId === characterId);
  if (!member) return { state, events: NO_EVENTS };
  if (member.mode !== "scout" && member.mode !== "return") {
    return { state, events: NO_EVENTS };
  }

  const refund = member.mode === "scout" || !member.markId;
  const checkedBranches =
    member.mode === "scout" && member.scoutPath.length >= 2
      ? [...state.checkedBranches, branchKey(member.scoutPath[0], member.scoutPath[1])]
      : state.checkedBranches;

  const party = state.party.map((candidate) =>
    candidate.characterId === characterId
      ? {
          ...candidate,
          mode: "follow" as const,
          hasCharge: refund ? true : candidate.hasCharge,
          cellId: trailCell(state.playerTrail, candidate.slot),
          scoutPath: [],
          scoutIndex: 0,
          scoutEnding: undefined,
          blockedBy: undefined,
        }
      : candidate,
  );

  return { state: { ...state, party, checkedBranches }, events: NO_EVENTS };
}

export function resolveScoutTap(
  state: ScoutState,
  level: Level,
  cellId: number,
): { action: ScoutTapAction; result: ScoutResult } {
  if (!state.selectedFriendId) {
    return { action: "ignored", result: { state, events: NO_EVENTS } };
  }
  if (cellId === state.playerTrail[0]) {
    return {
      action: "cancelled",
      result: { state: cancelSelection(state), events: NO_EVENTS },
    };
  }

  const branch = eligibleBranches(state, level, "manual").find((candidate) =>
    candidate.cells.includes(cellId),
  );
  if (!branch) {
    return { action: "ignored", result: { state, events: NO_EVENTS } };
  }

  const dispatch = dispatchScout(state, level, state.selectedFriendId, branch.firstCell);
  if (dispatch.events.length === 0) {
    return { action: "ignored", result: dispatch };
  }
  return { action: "dispatched", result: dispatch };
}

/**
 * Advance every scout/return by one tick. Arrival at the corridor end either
 * chalks a dead-end mark (spending the charge, possibly attracting a
 * grumblin) or refunds the charge and marks the branch checked.
 */
export function tickScouts(state: ScoutState, level: Level): ScoutResult {
  const events: ScoutEvent[] = [];
  const marks = [...state.marks];
  const gremlins = state.gremlins.filter((gremlin) => gremlin.state !== "fleeing");
  let checkedBranches = state.checkedBranches;
  let successfulScoutCount = state.successfulScoutCount;
  let encountersThisFloor = state.encountersThisFloor;
  const now = state.tick + 1;

  const party = state.party.map((member): PartyMember => {
    if (member.mode === "scout") {
      const path = member.scoutPath;
      const nextIndex = member.scoutIndex + 1;

      if (nextIndex < path.length - 1) {
        return { ...member, scoutIndex: nextIndex, cellId: path[nextIndex] };
      }

      // Arrived at the corridor's end cell.
      const ending =
        member.scoutEnding ??
        (path.length >= 2
          ? traverseCorridor(level, path[0], path[1]).ending
          : "junction");
      const walk = { path, ending };
      const mark = createScoutMark(level, member.characterId, walk, now);

      if (mark) {
        marks.push(mark);
        successfulScoutCount += 1;
        events.push({
          type: "mark",
          characterId: member.characterId,
          deadEndCellId: mark.deadEndCellId,
        });

        if (GREMLIN_BLOCKS) {
          const rng = makeEncounterRng(
            level,
            member.characterId,
            mark.deadEndCellId,
            successfulScoutCount,
          );
          const gremlin = planEncounter(level, { characterId: member.characterId }, mark, {
            playerCell: state.playerTrail[0],
            successfulScoutCount,
            encountersThisFloor,
            activeBlockCount: gremlins.filter((token) => token.state === "waiting").length,
            rng,
          });

          if (gremlin) {
            gremlins.push(gremlin);
            encountersThisFloor += 1;
            events.push({
              type: "blocked",
              characterId: member.characterId,
              gremlinId: gremlin.id,
            });
            return {
              ...member,
              mode: "blocked" as const,
              scoutIndex: path.length - 1,
              cellId: path[path.length - 1],
              markId: mark.id,
              blockedBy: gremlin.id,
            };
          }
        }

        return {
          ...member,
          mode: "return" as const,
          scoutIndex: path.length - 1,
          cellId: path[path.length - 1],
          markId: mark.id,
        };
      }

      // Junction, portal, too-far, or an unmarkable leaf: no mark, refund.
      if (path.length >= 2) {
        checkedBranches = [...checkedBranches, branchKey(path[0], path[1])];
      }
      events.push({ type: "no-mark", characterId: member.characterId, ending });
      return {
        ...member,
        mode: "return" as const,
        hasCharge: true,
        scoutIndex: path.length - 1,
        cellId: path[path.length - 1],
      };
    }

    if (member.mode === "return") {
      const nextIndex = Math.max(0, member.scoutIndex - 2);
      if (nextIndex > 0) {
        return {
          ...member,
          scoutIndex: nextIndex,
          cellId: member.scoutPath[nextIndex],
        };
      }
      events.push({ type: "returned", characterId: member.characterId });
      return {
        ...member,
        mode: "follow" as const,
        scoutIndex: 0,
        cellId: trailCell(state.playerTrail, member.slot),
        scoutPath: [],
        scoutEnding: undefined,
      };
    }

    return member;
  });

  return {
    state: {
      ...state,
      party,
      marks,
      gremlins,
      checkedBranches,
      successfulScoutCount,
      encountersThisFloor,
      tick: now,
    },
    events,
  };
}

/**
 * Pick the auto volunteer and its target for the junction the player is
 * standing on: shortest unchecked adjacent corridor, never the one Sora came
 * from, never a corridor already marked, at most one offer per junction.
 */
export function planAutoDispatch(
  state: ScoutState,
  level: Level,
): { characterId: string; firstCell: number } | null {
  const playerCell = state.playerTrail[0];
  if (state.lastAutoJunction === playerCell) return null;
  if (waitingGremlins(state).length > 0) return null;
  if (activeScoutCount(state) >= MAX_ACTIVE_SCOUTS) return null;

  const volunteer = state.party.find(
    (member) => member.mode === "follow" && member.hasCharge,
  );
  if (!volunteer) return null;

  const branches = eligibleBranches(state, level, "auto");
  if (branches.length === 0) return null;

  const target = branches
    .slice()
    .sort(
      (a, b) => a.cells.length - b.cells.length || a.firstCell - b.firstCell,
    )[0];

  return { characterId: volunteer.characterId, firstCell: target.firstCell };
}
