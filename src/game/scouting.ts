import { isJunction, openNeighbors } from "../generator/graph";
import type { Cell, Level } from "../generator/types";

export const MAX_SCOUT_STEPS = 24;
export const MAX_ACTIVE_SCOUTS = 2;

export type CorridorEnding = "dead-end" | "junction" | "portal" | "too-far";

export interface CorridorWalk {
  /** The junction first, then every cell walked, ending at the first stop. */
  path: number[];
  ending: CorridorEnding;
}

export interface ScoutBranch {
  /** The first cell after the junction. */
  firstCell: number;
  /** Walkable cells from firstCell to the first stop, excluding the junction. */
  cells: number[];
  ending: CorridorEnding;
}

export interface ScoutHighlight {
  friendId: string;
  branches: ScoutBranch[];
  /** The first cell of each eligible branch, convenient for simple markers. */
  targets: number[];
}

export interface ScoutMark {
  id: string;
  friendId: string;
  /** The corridor from the junction to the dead-end leaf. */
  cells: number[];
  deadEndCellId: number;
  kind: "dead-end";
  createdAt: number;
}

function isPortal(cell: Cell | undefined): boolean {
  return cell?.kind === "start" || cell?.kind === "exit" || cell?.kind === "chamber";
}

export function branchKey(from: number, firstCell: number): string {
  return `${from}:${firstCell}`;
}

/**
 * Walk a single corridor until the first junction, portal, dead end, or the
 * scout step limit. The path includes `from`, matching ScoutMark.cells.
 */
export function traverseCorridor(
  level: Level,
  from: number,
  first: number,
  maxSteps = MAX_SCOUT_STEPS,
): CorridorWalk {
  const path = [from, first];
  let previous = from;
  let current = first;

  while (path.length < maxSteps) {
    const cell = level.cells[current];

    if (isPortal(cell)) {
      return { path, ending: "portal" };
    }

    const neighbors = openNeighbors(level, current).filter((id) => id !== previous);

    if (neighbors.length === 0) {
      return { path, ending: "dead-end" };
    }

    if (neighbors.length >= 2) {
      return { path, ending: "junction" };
    }

    previous = current;
    current = neighbors[0];
    path.push(current);
  }

  return { path, ending: "too-far" };
}

/** True only for a normal or bunny-ear leaf that friends are allowed to chalk. */
export function isMarkableDeadEnd(level: Level, walk: CorridorWalk): boolean {
  if (walk.ending !== "dead-end") return false;
  const cell = level.cells[walk.path[walk.path.length - 1]];
  return cell?.kind === "normal" || cell?.kind === "ear";
}

export function createScoutMark(
  level: Level,
  friendId: string,
  walk: CorridorWalk,
  createdAt = 0,
): ScoutMark | null {
  if (!isMarkableDeadEnd(level, walk)) return null;

  const deadEndCellId = walk.path[walk.path.length - 1];
  return {
    id: `scout-${friendId}-${deadEndCellId}`,
    friendId,
    cells: [...walk.path],
    deadEndCellId,
    kind: "dead-end",
    createdAt,
  };
}

/**
 * List the adjacent corridors from a junction. `checkedBranches` contains
 * branchKey(from, firstCell) entries. Pass lastCell for auto scouting so the
 * branch Sora came from is not immediately re-scouted.
 */
export function listScoutBranches(
  level: Level,
  from: number,
  checkedBranches: ReadonlySet<string>,
  lastCell: number | null = null,
  maxSteps = MAX_SCOUT_STEPS,
): ScoutBranch[] {
  if (!isJunction(level, from)) return [];

  return openNeighbors(level, from)
    .filter((firstCell) => firstCell !== lastCell)
    .filter((firstCell) => !checkedBranches.has(branchKey(from, firstCell)))
    .map((firstCell) => {
      const walk = traverseCorridor(level, from, firstCell, maxSteps);
      return {
        firstCell,
        cells: walk.path.slice(1),
        ending: walk.ending,
      };
    });
}

export function makeScoutHighlight(
  friendId: string,
  branches: ScoutBranch[],
): ScoutHighlight {
  return {
    friendId,
    branches,
    targets: branches.map((branch) => branch.firstCell),
  };
}

/**
 * Pick the shortest unchecked adjacent corridor, walking it like a friend
 * would. Returns the first cell, or null when there is nothing to scout.
 */
export function chooseAutoTarget(
  level: Level,
  from: number,
  checkedBranches: ReadonlySet<string>,
  lastCell: number | null = null,
  maxSteps = MAX_SCOUT_STEPS,
): number | null {
  const branches = listScoutBranches(level, from, checkedBranches, lastCell, maxSteps);
  return (
    branches
      .slice()
      .sort((a, b) => a.cells.length - b.cells.length || a.firstCell - b.firstCell)[0]
      ?.firstCell ?? null
  );
}
