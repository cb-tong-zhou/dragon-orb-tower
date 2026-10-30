export type MissionKind = "rescue" | "coins" | "code" | "radar";

export type CellKind = "center" | "normal" | "start" | "exit" | "chamber" | "ear";

export interface Cell {
  id: number;
  kind: CellKind;
  /** -1 for portal cells and ear cells that sit outside the polar head. */
  ring: number;
  sector: number;
  sectors: number;
  a0: number;
  a1: number;
  r0: number;
  r1: number;
  cx: number;
  cy: number;
  /** Mid-angle, used for drawing and portal placement. */
  angle: number;
  /** Ear cells use a custom rectangular outline. */
  outline?: string;
  /** Which bunny ear a cell belongs to. */
  earId?: number;
  /** Row inside a bunny ear, counted from the tip (0) to the head. */
  earRow?: number;
}

export type Wall =
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "arc"; radius: number; a0: number; a1: number }
  | { type: "path"; d: string }
  | { type: "none" };

export type EdgeKind = "tangential" | "radial" | "portal" | "ear";

export interface Edge {
  id: string;
  a: number;
  b: number;
  kind: EdgeKind;
  open: boolean;
  wall: Wall;
}

export interface Portal {
  kind: "start" | "exit" | "chamber";
  angle: number;
  outerCell: number;
  externalCell: number;
}

export interface HeadWallGap {
  a0: number;
  a1: number;
}

export interface LevelMetrics {
  cellCount: number;
  deadEnds: number;
  pathToFriend: number;
  pathToOrb: number;
  pathToExit: number;
  braidCount: number;
  attempt: number;
}

export interface Level {
  version: 1;
  seed: string;
  floor: number;
  mission: MissionKind;
  rings: number;
  outerRadius: number;
  cells: Cell[];
  edges: Edge[];
  portals: Portal[];
  startCell: number;
  exitCell: number;
  friendCell: number;
  /** -1 when the orb is awarded at the door instead of hidden in the maze. */
  orbCell: number;
  /** -1 when this floor does not use the Dragon Radar. */
  radarCell: number;
  coinCells: number[];
  /** Choices shown by the coin-count door lock. */
  coinChoices: number[];
  carrotCells: number[];
  carrotNumbers: number[];
  codeWord: string;
  codeChoices: string[];
  /** Extra space above the head for bunny ears. */
  extraTop: number;
  headWallGaps: HeadWallGap[];
  earShapes: string[];
  earInnerShapes: string[];
  orbStars: number;
  metrics: LevelMetrics;
}

export interface CodePuzzle {
  word: string;
  numbers: number[];
  choices: string[];
}

export interface FloorConfig {
  floor: number;
  title: string;
  subtitle: string;
  friendId: string;
  mission: MissionKind;
  orbStars: number;
  rings: number;
  braid: number;
  orbAtCenter: boolean;
  /**
   * Number of sectors in every ring. Keeping this constant (instead of growing
   * it ring by ring) is what lets hand-drawn mazes carry long radial walls and
   * long concentric arcs all the way through the floor.
   */
  sectors?: number;
  seed: string;
  /** Number of optional/required coins in the maze. */
  coinCount?: number;
  code?: CodePuzzle;
  bunny?: boolean;
  /**
   * Which carving strategy builds this floor's passages. "auto" (the default)
   * picks one deterministically from the seed, so different floors get a
   * different feel while replays stay reproducible.
   */
  generator?: "divide" | "ring" | "growing" | "hybrid" | "tree" | "auto";
  /**
   * Tree carver only: chance each step extends the newest cell instead of a
   * random one. High values make long winding corridors; low values make
   * bushy mazes with many short branches. Defaults to 0.6.
   */
  treeBias?: number;
  /**
   * Chance that a divide-carver cut is a concentric arc instead of a radial
   * spoke. Lower values make later floors turn more and spend less time
   * circling one ring corridor. Defaults to 0.8.
   */
  divideBias?: number;
  /** Absolute minimum dead ends for this floor. */
  deadEndMin?: number;
  portalStyle?: "auto" | "opposite";
}
