import { describe, expect, it } from "vitest";
import {
  BODY_RADIUS,
  buildWalls,
  collides,
  containPoint,
  moveCircle,
  nearestCellId,
  steerMove,
  type Point,
  type WallField,
} from "./freeMove";
import { makePolyline, roundCorners, planTapPath, routeDistance, routeSpeed, routeToPoints, samplePolyline, withinTapReach, TAP_REACH } from "./motionPath";
import { testCell, testEdge, testLevel } from "./testLevel";
import type { Level } from "../generator/types";
import { generateFloor } from "../generator/generate";
import { FLOORS } from "../content/floors";

const floorWall: WallField = {
  walls: [{ kind: "line", x1: -10, y1: 0, x2: 10, y2: 0 }],
};

describe("buildWalls", () => {
  it("keeps arcs as single primitives instead of chopping them into chords", () => {
    const level = testLevel({
      cells: [testCell(0), testCell(1)],
      edges: [
        {
          id: "line",
          a: 0,
          b: 1,
          kind: "tangential",
          open: false,
          wall: { type: "line", x1: 0, y1: 0, x2: 1, y2: 0 },
        },
        {
          id: "arc",
          a: 0,
          b: 1,
          kind: "radial",
          open: false,
          wall: { type: "arc", radius: 1, a0: 0, a1: Math.PI / 4 },
        },
      ],
    });
    const field = buildWalls(level, { boundary: false });
    expect(field.walls).toHaveLength(2);
    expect(field.walls.filter((wall) => wall.kind === "arc")).toHaveLength(1);
  });

  it("ignores open edges", () => {
    const level = testLevel({
      cells: [testCell(0), testCell(1)],
      edges: [testEdge(0, 1, true)],
    });
    expect(buildWalls(level, { boundary: false }).walls).toHaveLength(0);
  });
});

describe("collides", () => {
  it("blocks a circle that overlaps a wall", () => {
    expect(collides(floorWall, 5, BODY_RADIUS / 2)).toBe(true);
  });

  it("allows a circle clear of the wall", () => {
    expect(collides(floorWall, 5, 1)).toBe(false);
  });

  it("understands curved walls", () => {
    const ring: WallField = {
      walls: [{ kind: "arc", cx: 0, cy: 0, radius: 2, a0: 0, a1: Math.PI * 2 }],
    };
    // Just inside the ring: free. On the ring: blocked.
    expect(collides(ring, 1, 0)).toBe(false);
    expect(collides(ring, 1.95, 0)).toBe(true);
    // Outside the ring too: blocked.
    expect(collides(ring, 2.05, 0)).toBe(true);
  });
});

describe("moveCircle", () => {
  it("moves freely in open space", () => {
    const moved = moveCircle(floorWall, { x: 5, y: 2 }, { x: 0.5, y: 0 });
    expect(moved.point.x).toBeCloseTo(5.5);
    expect(moved.point.y).toBeCloseTo(2);
    expect(moved.touched).toBe(false);
  });

  it("slides along a wall when a diagonal step runs into it", () => {
    const from = { x: 5, y: 0.5 };
    const moved = moveCircle(floorWall, from, { x: 0.5, y: -0.45 });
    expect(moved.point.x).toBeGreaterThan(from.x);
    expect(moved.point.y).toBeGreaterThanOrEqual(BODY_RADIUS - 1e-9);
    expect(collides(floorWall, moved.point.x, moved.point.y)).toBe(false);
    expect(moved.touched).toBe(true);
  });

  it("never ends inside a wall, even with a big lag-spike step", () => {
    const moved = moveCircle(floorWall, { x: 5, y: 0.5 }, { x: 0, y: -3 });
    expect(collides(floorWall, moved.point.x, moved.point.y)).toBe(false);
  });

  it("slides around the inside of a curved wall", () => {
    const ring: WallField = {
      walls: [{ kind: "arc", cx: 0, cy: 0, radius: 2, a0: 0, a1: Math.PI * 2 }],
    };
    const from = { x: 2 - BODY_RADIUS - 0.02, y: 0 };
    // Push diagonally outward/upward: the circle should ride the arc, not stop.
    const moved = moveCircle(ring, from, { x: 0.15, y: 0.15 });
    expect(moved.touched).toBe(true);
    expect(moved.distance).toBeGreaterThan(0.1);
    expect(collides(ring, moved.point.x, moved.point.y)).toBe(false);
  });
});

describe("steerMove", () => {
  it("moves straight in open space", () => {
    const moved = steerMove(floorWall, { x: 0, y: 3 }, { x: 1, y: 0 }, 0.3);
    expect(moved.point.x).toBeCloseTo(0.3);
    expect(moved.point.y).toBeCloseTo(3);
  });

  it("keeps forward progress when scraping a wall at an angle", () => {
    const from = { x: 0, y: 0.2 };
    const moved = steerMove(floorWall, from, { x: 0.8, y: -0.6 }, 0.2);
    expect(moved.point.x).toBeGreaterThan(from.x + 0.1);
    expect(collides(floorWall, moved.point.x, moved.point.y)).toBe(false);
  });

  it("stops at a head-on wall instead of drifting sideways by itself", () => {
    const moved = steerMove(floorWall, { x: 5, y: BODY_RADIUS + 0.01 }, { x: 0, y: -1 }, 0.2);
    expect(moved.distance).toBeLessThan(0.02);
    expect(moved.point.x).toBeCloseTo(5);
    expect(collides(floorWall, moved.point.x, moved.point.y)).toBe(false);
  });
});

describe("nearestCellId", () => {
  it("finds the closest cell centre", () => {
    const level = testLevel({
      cells: [testCell(0, "normal", 0, 0), testCell(1, "normal", 5, 0)],
      edges: [testEdge(0, 1)],
    });
    expect(nearestCellId(level, { x: 1, y: 0 })).toBe(0);
    expect(nearestCellId(level, { x: 4, y: 0 })).toBe(1);
  });
});

describe("tap reach", () => {
  it("accepts walks up to the reach and rejects longer ones", () => {
    expect(withinTapReach(0)).toBe(true);
    expect(withinTapReach(TAP_REACH)).toBe(true);
    expect(withinTapReach(TAP_REACH + 0.01)).toBe(false);
  });

  it("measures the corridor walk from Sora's exact position", () => {
    const level = testLevel({
      cells: [
        testCell(0, "normal", 0, 0),
        testCell(1, "normal", 5, 0),
        testCell(2, "normal", 5, 12),
      ],
      edges: [testEdge(0, 1), testEdge(1, 2)],
    });
    expect(routeDistance(level, [0, 1], { x: 1, y: 0 })).toBeCloseTo(4);
    expect(routeDistance(level, [0, 1, 2], { x: 1, y: 0 })).toBeCloseTo(16);
    expect(routeDistance(level, [0], { x: 1, y: 0 })).toBe(0);
  });

  it("uses a sensible default for the tap reach", () => {
    expect(TAP_REACH).toBeGreaterThanOrEqual(6);
    expect(TAP_REACH).toBeLessThanOrEqual(10);
  });
});

describe("routeToPoints", () => {
  const level = testLevel({
    cells: [testCell(0, "normal", 0, 0), testCell(1, "normal", 1, 0), testCell(2, "normal", 2, 0)],
    edges: [testEdge(0, 1), testEdge(1, 2)],
  }) as Level;

  it("starts at Sora's real position instead of the cell centre", () => {
    const points = routeToPoints(level, [0, 1, 2], { x: 0.2, y: 0.1 });
    expect(points[0]).toEqual({ x: 0.2, y: 0.1 });
    expect(points[1]).toEqual({ x: 1, y: 0 });
    expect(points[2]).toEqual({ x: 2, y: 0 });
  });
});

describe("roundCorners", () => {
  it("keeps the ends and cuts the corner inside the corridor", () => {
    const corners = roundCorners(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
      0.3,
    );
    expect(corners[0]).toEqual({ x: 0, y: 0 });
    expect(corners[corners.length - 1]).toEqual({ x: 1, y: 1 });
    // The corner itself is replaced by a rounded arc.
    const hasSharpCorner = corners.some((p: Point) => p.x === 1 && p.y === 0);
    expect(hasSharpCorner).toBe(false);
    for (const point of corners) {
      // Never strays more than the fillet radius from the original path.
      expect(point.x).toBeLessThanOrEqual(1.0001);
      expect(point.y).toBeGreaterThanOrEqual(-0.0001);
    }
  });

  it("leaves a straight path alone", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    expect(roundCorners(points, 0.3)).toEqual(points);
  });
});

describe("polyline sampling", () => {
  it("walks a path by distance", () => {
    const line = makePolyline([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ]);
    expect(line.total).toBe(2);
    expect(samplePolyline(line, 0).point).toEqual({ x: 0, y: 0 });
    expect(samplePolyline(line, 1).point).toEqual({ x: 1, y: 0 });
    expect(samplePolyline(line, 9).point).toEqual({ x: 2, y: 0 });
  });

  it("returns a heading for the current segment", () => {
    const line = makePolyline([
      { x: 0, y: 0 },
      { x: 0, y: 2 },
    ]);
    const at = samplePolyline(line, 1);
    expect(at.direction.x).toBeCloseTo(0);
    expect(at.direction.y).toBeCloseTo(1);
  });
});

describe("routeSpeed", () => {
  it("accelerates, cruises, then brakes to a stop", () => {
    let speed = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) speed = routeSpeed(speed, 50, dt, 9, 55, 55);
    expect(speed).toBeCloseTo(9, 1);

    let braking = 9;
    for (let i = 0; i < 60; i++) braking = routeSpeed(braking, 0.2, dt, 9, 55, 55);
    expect(braking).toBeLessThan(9);
    expect(routeSpeed(9, 0, dt, 9, 55, 55)).toBe(0);
  });
});

describe("outer boundary", () => {
  const headLevel: Level = {
    ...testLevel({ cells: [testCell(0)], edges: [] }),
    outerRadius: 5,
  };

  it("keeps the play area with the head disc", () => {
    const field = buildWalls(headLevel);
    expect(field.area).toBeDefined();
    expect(containPoint(field.area!, 0, 0)).toBe(true);
    expect(containPoint(field.area!, 4.9, 0)).toBe(true);
    expect(containPoint(field.area!, 5.1, 0)).toBe(false);
  });

  it("stops a head-on escape at the rim", () => {
    const field = buildWalls(headLevel);
    const moved = moveCircle(field, { x: 0, y: 0 }, { x: 12, y: 0 });
    expect(moved.point.x).toBeCloseTo(5 - BODY_RADIUS, 2);
    expect(moved.point.y).toBeCloseTo(0, 6);
    expect(moved.touched).toBe(true);
    expect(collides(field, moved.point.x, moved.point.y)).toBe(false);
  });

  it("slides along the curved rim instead of sticking", () => {
    const field = buildWalls(headLevel);
    const from = { x: 0, y: 5 - BODY_RADIUS - 0.02 };
    const moved = moveCircle(field, from, { x: 0.35, y: 0.15 });
    expect(moved.touched).toBe(true);
    expect(moved.distance).toBeGreaterThan(0.25);
    expect(Math.hypot(moved.point.x, moved.point.y)).toBeLessThanOrEqual(5 - BODY_RADIUS + 1e-6);
  });

  it("keeps a wild diagonal inside the play area", () => {
    const field = buildWalls(headLevel);
    const moved = moveCircle(field, { x: 0, y: 0 }, { x: 8, y: 8 });
    expect(containPoint(field.area!, moved.point.x, moved.point.y)).toBe(true);
    expect(Math.hypot(moved.point.x, moved.point.y)).toBeLessThanOrEqual(5 - BODY_RADIUS + 0.01);
  });
});

describe("portal capsules", () => {
  const capsuleLevel: Level = {
    ...testLevel({
      cells: [testCell(0), testCell(1, "start", 5.02, 0)],
      edges: [],
    }),
    outerRadius: 5,
    portals: [{ kind: "start", angle: 0, outerCell: 0, externalCell: 1 }],
  };

  it("contains the capsule bubble", () => {
    const area = buildWalls(capsuleLevel).area!;
    expect(containPoint(area, 5.02, 0)).toBe(true);
    expect(containPoint(area, 5.45, 0)).toBe(true);
    expect(containPoint(area, 5.6, 0)).toBe(false);
  });

  it("lets Sora walk from the head into the capsule through the rim gap", () => {
    const field = buildWalls(capsuleLevel);
    const moved = moveCircle(field, { x: 4.5, y: 0 }, { x: 1.0, y: 0 });
    expect(moved.point.x).toBeCloseTo(5.52 - BODY_RADIUS, 2);
    expect(collides(field, moved.point.x, moved.point.y)).toBe(false);
  });

  it("blocks the rim beside the capsule doorway", () => {
    const field = buildWalls(capsuleLevel);
    const moved = moveCircle(field, { x: 4.4, y: 0.8 }, { x: 1.0, y: 0 });
    expect(moved.point.x).toBeLessThan(4.95);
    expect(containPoint(field.area!, moved.point.x, moved.point.y)).toBe(true);
  });

  it("wraps the capsule in its round wall", () => {
    const field = buildWalls(capsuleLevel);
    const moved = moveCircle(field, { x: 5.02, y: 0 }, { x: 3, y: 0 });
    expect(moved.point.x).toBeCloseTo(5.52 - BODY_RADIUS, 2);
    expect(moved.touched).toBe(true);
  });
});

describe("bunny ears", () => {
  const level = generateFloor(FLOORS[2].config);
  const field = buildWalls(level);

  it("derives both ear rectangles from the ear cells", () => {
    const ears = field.area!.ears;
    expect(ears).toHaveLength(2);
    expect(ears[0].right).toBeCloseTo(-ears[1].left);
    expect(ears[0].bottom).toBeCloseTo(ears[1].bottom);
    // The generator template is 3.6 wide and 9.6 tall.
    expect(ears[0].right - ears[0].left).toBeCloseTo(3.6, 1);
    expect(ears[0].bottom - ears[0].top).toBeCloseTo(9.6, 1);
    expect(ears.every((ear) => ear.door !== null)).toBe(true);
  });

  it("keeps every cell centre standable", () => {
    for (const cell of level.cells) {
      expect(containPoint(field.area!, cell.cx, cell.cy)).toBe(true);
      expect(collides(field, cell.cx, cell.cy)).toBe(false);
    }
  });

  it("walks from the head up into an ear through the doorway", () => {
    const ear = field.area!.ears[0];
    const doorX = (ear.door!.left + ear.door!.right) / 2;
    const moved = moveCircle(field, { x: doorX, y: ear.bottom + 0.25 }, { x: 0, y: -0.85 });
    expect(moved.point.y).toBeLessThan(ear.bottom - 0.3);
    expect(containPoint(field.area!, moved.point.x, moved.point.y)).toBe(true);

    const back = moveCircle(field, moved.point, { x: 0, y: 0.85 });
    expect(back.point.y).toBeGreaterThan(ear.bottom + 0.2);
    expect(containPoint(field.area!, back.point.x, back.point.y)).toBe(true);
  });

  it("stops Sora from squeezing past the ear walls", () => {
    const ear = field.area!.ears[0];
    const midX = (ear.left + ear.right) / 2;

    const left = moveCircle(field, { x: ear.left + 0.4, y: ear.top + 1.6 }, { x: -3, y: 0 });
    expect(containPoint(field.area!, left.point.x, left.point.y)).toBe(true);
    expect(left.point.x).toBeGreaterThanOrEqual(ear.left - 0.001);

    const top = moveCircle(field, { x: midX, y: ear.top + 0.4 }, { x: 0, y: -3 });
    expect(containPoint(field.area!, top.point.x, top.point.y)).toBe(true);
    expect(top.point.y).toBeGreaterThanOrEqual(ear.top - 0.001);
  });
});

describe("pixel tap paths", () => {
  it("finishes on the exact tapped pixel, even a few pixels away", () => {
    const level = generateFloor(FLOORS[0].config, 0, "pixel-tap-seed");
    const field = buildWalls(level);
    const cell = level.cells[level.startCell];
    const from = { x: cell.cx, y: cell.cy };
    const target = { x: from.x + 0.04, y: from.y };
    const plan = planTapPath(level, field, from, target, level.startCell);
    expect(plan).not.toBeNull();
    const last = plan!.line.points[plan!.line.points.length - 1];
    expect(last.x).toBeCloseTo(target.x, 6);
    expect(last.y).toBeCloseTo(target.y, 6);
    expect(plan!.line.total).toBeCloseTo(0.04, 6);
  });

  it("walks around a closed wall and still ends on the tapped pixel", () => {
    const level = generateFloor(FLOORS[0].config, 0, "pixel-tap-seed");
    const field = buildWalls(level);
    const edge = level.edges.find(
      (candidate) =>
        !candidate.open && candidate.kind !== "portal" && candidate.wall.type !== "none",
    );
    expect(edge).toBeDefined();
    const fromCell = level.cells[edge!.a];
    const targetCell = level.cells[edge!.b];
    const from = { x: fromCell.cx, y: fromCell.cy };
    const target = { x: targetCell.cx, y: targetCell.cy };

    const plan = planTapPath(level, field, from, target, targetCell.id);
    expect(plan).not.toBeNull();
    expect(plan!.route.length).toBeGreaterThan(1);
    const last = plan!.line.points[plan!.line.points.length - 1];
    expect(last.x).toBeCloseTo(target.x, 6);
    expect(last.y).toBeCloseTo(target.y, 6);

    for (let along = 0; along <= plan!.line.total; along += 0.04) {
      const point = samplePolyline(plan!.line, along).point;
      expect(
        collides(field, point.x, point.y, BODY_RADIUS - 1e-6),
        `Sora's body crosses a wall at ${along.toFixed(2)} units`,
      ).toBe(false);
    }
  });
});

describe("every floor keeps Sora contained", () => {
  for (const story of FLOORS) {
    it(`floor ${story.config.floor} keeps every cell standable`, () => {
      const level = generateFloor(story.config);
      const field = buildWalls(level);
      for (const cell of level.cells) {
        expect(containPoint(field.area!, cell.cx, cell.cy)).toBe(true);
        expect(collides(field, cell.cx, cell.cy)).toBe(false);
      }
    });
  }
});

