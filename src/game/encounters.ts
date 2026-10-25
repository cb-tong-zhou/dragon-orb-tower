import { bfsDistances, openNeighbors } from "../generator/graph";
import { makeRng, pick, type Rng } from "../generator/rng";
import type { Level } from "../generator/types";
import type { ScoutMark } from "./scouting";

export const MAX_ENCOUNTERS_PER_FLOOR = 2;
export const MAX_BLOCKED_AT_ONCE = 1;
export const ENCOUNTER_CHANCE = 0.3;

export interface EncounterFriend {
  characterId: string;
}

export interface GremlinToken {
  id: string;
  cellId: number;
  blockedFriendId: string;
  state: "waiting" | "fleeing";
}

export interface EncounterContext {
  playerCell: number;
  /** Dead-end marks on this floor, including the mark that triggered this roll. */
  successfulScoutCount: number;
  /** Gremlins already spawned on this floor. */
  encountersThisFloor: number;
  /** Gremlins currently in state "waiting". */
  activeBlockCount: number;
  rng: Rng;
}

export function makeEncounterRng(
  level: Level,
  friendId: string,
  deadEndCellId: number,
  successfulScoutCount: number,
): Rng {
  return makeRng(
    level.seed,
    `gremlin:${friendId}:${deadEndCellId}:${successfulScoutCount}`,
  );
}

/**
 * Decide whether a successful dead-end scout attracts a grumblin, then place
 * it 1-3 cells from the friend on the return path. Returns null for no
 * encounter. This function is pure and deterministic for a given context.
 */
export function planEncounter(
  level: Level,
  friend: EncounterFriend,
  mark: ScoutMark,
  context: EncounterContext,
): GremlinToken | null {
  const {
    playerCell,
    successfulScoutCount,
    encountersThisFloor,
    activeBlockCount,
    rng,
  } = context;

  if (level.floor === 1) return null;
  if (encountersThisFloor >= MAX_ENCOUNTERS_PER_FLOOR) return null;
  if (activeBlockCount >= MAX_BLOCKED_AT_ONCE) return null;

  const isFirstScout = successfulScoutCount === 1;
  const tutorial = level.floor === 2 && encountersThisFloor === 0;
  const firstScoutSafe = level.floor >= 3 && isFirstScout;

  if (!tutorial) {
    if (firstScoutSafe) return null;
    if (rng() >= ENCOUNTER_CHANCE) return null;
  }

  // mark.cells runs junction -> leaf. Reverse to get leaf -> junction.
  const returnPath = [...mark.cells].reverse();
  const playerDistances = bfsDistances(level, playerCell);
  const valid = returnPath
    .slice(1, Math.min(4, returnPath.length - 1)) // 1-3 cells from the friend; never the fork
    .filter((cellId) => playerDistances[cellId] >= 2)
    .filter((cellId) => {
      const kind = level.cells[cellId]?.kind;
      return kind === "normal" || kind === "ear";
    });

  if (valid.length === 0) return null;

  const cellId = pick(valid, rng);
  return {
    id: `gremlin-${friend.characterId}-${mark.deadEndCellId}`,
    cellId,
    blockedFriendId: friend.characterId,
    state: "waiting",
  };
}

/** Sora frees a blocked friend from the grumblin's cell or an open neighbor. */
export function isRescueProximity(
  level: Level,
  gremlinCellId: number,
  playerCell: number,
): boolean {
  if (gremlinCellId === playerCell) return true;
  return openNeighbors(level, gremlinCellId).includes(playerCell);
}
