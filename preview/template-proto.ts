// Prototype only (preview). Template-style polar maze inspired by the hand-drawn floors:
// - Most ring boundaries are full concentric walls, each with 1-2 doors.
// - Radial walls are short (1-3 rings) and staggered between neighbouring rings.
// Walls are drawn by closing edges; passages are the remaining open edges.
import type { Cell, Edge, Level } from "../src/generator/types";

const TAU = Math.PI * 2;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildTemplateLevel(rings: number, sectors: number, seed: string): Level {
  const rng = mulberry(hash(seed));
  const cells: Cell[] = [
    { id: 0, kind: "center", ring: 0, sector: 0, sectors: 1, a0: 0, a1: TAU, r0: 0, r1: 1, cx: 0, cy: 0, angle: 0 },
  ];
  const byRing: number[][] = [[0]];
  for (let ring = 1; ring < rings; ring++) {
    byRing[ring] = [];
    for (let s = 0; s < sectors; s++) {
      const a0 = (TAU * s) / sectors;
      const a1 = (TAU * (s + 1)) / sectors;
      const angle = (a0 + a1) / 2;
      const id = cells.length;
      cells.push({
        id, kind: "normal", ring, sector: s, sectors, a0, a1, r0: ring, r1: ring + 1,
        cx: Math.cos(angle) * (ring + 0.5), cy: Math.sin(angle) * (ring + 0.5), angle,
      });
      byRing[ring].push(id);
    }
  }

  // Candidate walls, same geometry as the real generator.
  const cand: Array<{ a: number; b: number; kind: Edge["kind"]; wall: Edge["wall"]; ring: number; sector: number }> = [];
  for (let ring = 1; ring < rings; ring++) {
    for (let s = 0; s < sectors; s++) {
      const a = byRing[ring][s];
      const b = byRing[ring][(s + 1) % sectors];
      const angle = cells[a].a1;
      cand.push({
        a, b, kind: "tangential", ring, sector: s,
        wall: {
          type: "line",
          x1: Math.cos(angle) * ring, y1: Math.sin(angle) * ring,
          x2: Math.cos(angle) * (ring + 1), y2: Math.sin(angle) * (ring + 1),
        },
      });
    }
  }
  for (const id of byRing[1]) {
    const c = cells[id];
    cand.push({ a: 0, b: id, kind: "radial", ring: 0, sector: c.sector, wall: { type: "arc", radius: 1, a0: c.a0, a1: c.a1 } });
  }
  for (let ring = 1; ring < rings - 1; ring++) {
    for (const innerId of byRing[ring]) {
      const inner = cells[innerId];
      for (const outerId of byRing[ring + 1]) {
        const outer = cells[outerId];
        const a0 = Math.max(inner.a0, outer.a0);
        const a1 = Math.min(inner.a1, outer.a1);
        if (a1 - a0 < 1e-7) continue;
        cand.push({ a: innerId, b: outerId, kind: "radial", ring, sector: inner.sector, wall: { type: "arc", radius: ring + 1, a0, a1 } });
      }
    }
  }

  // Template rule: every other ring boundary is a full concentric wall with 1-2 doors.
  // Concentric wall at boundary `ring` = the radial arcs between ring and ring+1
  // (kind "radial" where cand.ring === ring and the cells are on adjacent rings).
  // Start with every wall closed, then open passages that the template allows.
  const open = new Array<boolean>(cand.length).fill(false);
  const bySet = new Map<number, number[]>(); // ring -> candidate indexes of radial walls at that boundary
  cand.forEach((c, idx) => {
    if (c.kind !== "radial" || c.ring === 0) return;
    const list = bySet.get(c.ring) ?? [];
    list.push(idx);
    bySet.set(c.ring, list);
  });

  // Carve a spanning tree with random DFS, but only through allowed walls:
  // tangential walls are always allowed; a radial wall at boundary r is allowed
  // on a sector s if it is one of the template doors for that boundary.
  // Template doors: boundary r gets 1-2 doors (random), kept as a spanning tree.
  const doorsAt = new Map<number, Set<number>>();
  for (const [ring] of bySet) {
    // Every ring boundary is a full concentric wall, so rings read as dense bands.
    // One small doorway per ring boundary, so the big rings stay closed.
    const count = 1;
    const chosen = new Set<number>();
    while (chosen.size < count) chosen.add(Math.floor(rng() * sectors));
    doorsAt.set(ring, chosen);
  }

  const adj: Array<Array<{ to: number; idx: number }>> = cells.map(() => []);
  cand.forEach((c, idx) => {
    adj[c.a].push({ to: c.b, idx });
    adj[c.b].push({ to: c.a, idx });
  });


  const seen = new Uint8Array(cells.length);
  const stack = [0];
  seen[0] = 1;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const next = adj[cur].filter((e) => {
      if (seen[e.to]) return false;
      const c = cand[e.idx];
      if (c.kind === "tangential") return true;
      if (c.ring === 0) return true; // centre spokes
      // Full concentric boundary: only door sectors are open.
      return doorsAt.get(c.ring)?.has(c.sector) ?? false;
    });
    if (next.length === 0) {
      stack.pop();
      continue;
    }
    const pick = next[Math.floor(rng() * next.length)];
    seen[pick.to] = 1;
    open[pick.idx] = true;
    stack.push(pick.to);
  }

  const edges: Edge[] = cand.map((c, idx) => ({
    id: `t:${idx}`, a: c.a, b: c.b, kind: c.kind, open: open[idx], wall: c.wall,
  }));

  return {
    version: 1, seed, floor: 1, mission: "rescue", rings, outerRadius: rings,
    cells, edges, portals: [], startCell: 0, exitCell: 0, friendCell: 0,
    orbCell: 0, radarCell: -1, coinCells: [], coinChoices: [], carrotCells: [],
    carrotNumbers: [], codeWord: "", codeChoices: [], extraTop: 0, headWallGaps: [],
    earShapes: [], earInnerShapes: [], orbStars: 1,
    metrics: { cellCount: cells.length, deadEnds: 0, pathToFriend: 0, pathToOrb: 0, pathToExit: 0, braidCount: 0, attempt: 0 },
  };
}
