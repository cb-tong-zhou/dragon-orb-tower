import type { Cell, CellKind, Edge, Level } from "../generator/types";

/** A minimal cell for pure graph/scouting tests. */
export function testCell(id: number, kind: CellKind = "normal", cx = id, cy = 0): Cell {
  return {
    id,
    kind,
    ring: 0,
    sector: id,
    sectors: 1,
    a0: 0,
    a1: 1,
    r0: 0,
    r1: 1,
    cx,
    cy,
    angle: 0,
  };
}

/** A minimal edge for pure graph/scouting tests. */
export function testEdge(
  a: number,
  b: number,
  open = true,
  kind: Edge["kind"] = "radial",
): Edge {
  return {
    id: `e${a}-${b}`,
    a,
    b,
    kind,
    open,
    wall: { type: "none" },
  };
}

/** A complete-enough Level for tests that only touch cells, edges, and floor. */
export function testLevel(options: {
  cells: Cell[];
  edges: Edge[];
  floor?: number;
  seed?: string;
  mission?: Level["mission"];
  startCell?: number;
  exitCell?: number;
  friendCell?: number;
}): Level {
  const lastCell = Math.max(0, options.cells.length - 1);

  return {
    version: 1,
    seed: options.seed ?? "test-seed",
    floor: options.floor ?? 3,
    mission: options.mission ?? "rescue",
    rings: 1,
    outerRadius: 1,
    cells: options.cells,
    edges: options.edges,
    portals: [],
    startCell: options.startCell ?? 0,
    exitCell: options.exitCell ?? lastCell,
    friendCell: options.friendCell ?? lastCell,
    orbCell: -1,
    radarCell: -1,
    coinCells: [],
    coinChoices: [],
    carrotCells: [],
    carrotNumbers: [],
    codeWord: "",
    codeChoices: [],
    extraTop: 0,
    headWallGaps: [],
    earShapes: [],
    earInnerShapes: [],
    orbStars: 1,
    metrics: {
      cellCount: options.cells.length,
      deadEnds: 0,
      pathToFriend: 0,
      pathToOrb: 0,
      pathToExit: 0,
      braidCount: 0,
      attempt: 0,
    },
  };
}
