import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:5173/";
const KEY = "dragon-orb-tower-save-v1";
const KEY2 = "dragon-orb-tower-save-v2";
const outDir = "screenshots/e2e";
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

function watch(page, label) {
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label} console: ${message.text()}`);
  });
}

async function contextWithSave(save, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(
    ({ v1, v2, value }) => {
      localStorage.setItem(value.version === 2 ? v2 : v1, JSON.stringify(value));
    },
    { v1: KEY, v2: KEY2, value: save },
  );
  return context;
}

async function playerCell(page) {
  const token = page.locator("[data-player-token]");
  if ((await token.count()) === 0) return -1;
  return Number(await token.getAttribute("data-player-cell"));
}

async function isMoving(page) {
  return (await page.getAttribute(".maze-svg", "data-moving")) === "true";
}

async function waitForWalkEnd(page, timeoutMs = 12000) {
  // The maze reports its own walk state, so a walk is finished when that flag
  // drops back to false. Give the state a moment to flip to true first.
  const deadline = Date.now() + timeoutMs;
  const settle = Date.now() + 300;
  while (Date.now() < settle) {
    if (await isMoving(page)) break;
    await page.waitForTimeout(25);
  }
  while (Date.now() < deadline) {
    if ((await page.locator(".complete-card").count()) > 0) return playerCell(page);
    if (!(await isMoving(page))) return playerCell(page);
    await page.waitForTimeout(25);
  }
  return playerCell(page);
}

async function tapCell(page, cellId) {
  await page.locator(`[data-cell-id="${cellId}"]`).click({ force: true });
  return waitForWalkEnd(page);
}

/**
 * BFS + local-corridor route info for a target, mirroring the runtime rules:
 * `step` is the first cell on the shortest route, `localStop` is where a tap
 * on the target would actually walk to (the end of the corridor containing
 * the target), or null when the target lies beyond a fork.
 */
async function routeInfo(page, target) {
  return page.evaluate(
    ({ target }) => {
      const level = window.__dragonTowerLevel;
      const start = Number(
        document.querySelector("[data-player-token]").getAttribute("data-player-cell"),
      );
      const adjacency = level.cells.map(() => []);
      for (const edge of level.edges) {
        if (!edge.open) continue;
        adjacency[edge.a].push(edge.b);
        adjacency[edge.b].push(edge.a);
      }

      const previous = new Array(level.cells.length).fill(-1);
      const distance = new Array(level.cells.length).fill(-1);
      const visited = new Uint8Array(level.cells.length);
      visited[start] = 1;
      distance[start] = 0;
      const queue = [start];
      let head = 0;
      while (head < queue.length) {
        const current = queue[head++];
        for (const next of adjacency[current]) {
          if (visited[next]) continue;
          visited[next] = 1;
          previous[next] = current;
          distance[next] = distance[current] + 1;
          queue.push(next);
        }
      }

      const segments = [];
      for (const first of adjacency[start]) {
        const path = [];
        const seen = new Set([start]);
        let prev = start;
        let current = first;
        while (!seen.has(current)) {
          path.push(current);
          seen.add(current);
          const cell = level.cells[current];
          if (cell.kind === "start" || cell.kind === "exit" || cell.kind === "chamber") break;
          const next = adjacency[current].filter((id) => id !== prev);
          if (next.length === 0 || next.length >= 2) break;
          prev = current;
          current = next[0];
        }
        segments.push(path);
      }

      const containing = segments.find((path) => path.includes(target)) ?? null;
      const path = [];
      let cursor = target;
      while (cursor !== -1) {
        path.push(cursor);
        cursor = previous[cursor];
      }
      path.reverse();

      return {
        start,
        distance: distance[target],
        step: distance[target] >= 1 ? path[1] : null,
        localStop: containing ? containing[containing.length - 1] : null,
      };
    },
    { target },
  );
}

/**
 * The first step a press on `target` takes, mirroring neighborToward: the open
 * neighbour closest to the direction from Sora to the pressed cell.
 */
async function firstStepToward(page, target) {
  return page.evaluate((targetCell) => {
    const level = window.__dragonTowerLevel;
    const from = Number(
      document.querySelector("[data-player-token]").getAttribute("data-player-cell"),
    );
    const origin = level.cells[from];
    const goal = level.cells[targetCell];
    const dx = goal.cx - origin.cx;
    const dy = goal.cy - origin.cy;
    const length = Math.hypot(dx, dy) || 1;
    const neighbours = [];
    for (const edge of level.edges) {
      if (!edge.open) continue;
      if (edge.a === from) neighbours.push(edge.b);
      else if (edge.b === from) neighbours.push(edge.a);
    }
    let best = null;
    let bestScore = -Infinity;
    for (const id of neighbours) {
      const cell = level.cells[id];
      const segment = Math.hypot(cell.cx - origin.cx, cell.cy - origin.cy) || 1;
      const score =
        ((cell.cx - origin.cx) / segment) * (dx / length) +
        ((cell.cy - origin.cy) / segment) * (dy / length);
      if (score > bestScore) {
        bestScore = score;
        best = id;
      }
    }
    return best;
  }, target);
}

/**
 * Walk to a target one press at a time: press the next cell on the shortest
 * route, which is exactly the direction the press control turns into a step.
 */
async function walkTo(page, target, attempts = 900) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if ((await page.locator(".complete-card").count()) > 0) return target;
    const current = await playerCell(page);
    if (current === target) return current;

    const before = await routeInfo(page, target);
    if (before.step === null) {
      throw new Error(`No route from ${current} to ${target}`);
    }

    const after = await tapCell(page, before.step);
    if ((await page.locator(".complete-card").count()) > 0) return target;
    if (after === current) {
      throw new Error(`Sora did not move from ${current} toward ${target}`);
    }
  }
  throw new Error(`Could not reach cell ${target}; stopped at ${await playerCell(page)}`);
}

/** Walk to a target with Easy walking on: one tap follows the whole route. */
async function walkToEasy(page, target, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if ((await page.locator(".complete-card").count()) > 0) return target;
    const current = await playerCell(page);
    if (current === target) return current;
    const after = await tapCell(page, target);
    if ((await page.locator(".complete-card").count()) > 0) return target;
    if (after === target) return after;
  }
  throw new Error(`Could not reach cell ${target}; stopped at ${await playerCell(page)}`);
}

// ---------- helpers for mission flows ----------
async function chipDone(page, mission) {
  const chip = page.locator(`[data-mission="${mission}"]`);
  if ((await chip.count()) === 0) return false;
  return (((await chip.first().getAttribute("class")) ?? "").includes("is-done"));
}

async function openFloorWithSave(save, floor, viewport) {
  const context = await contextWithSave(save, viewport);
  const page = await context.newPage();
  watch(page, `floor-${floor}`);
  await page.goto(BASE, { waitUntil: "networkidle" });
  const continueButton = page.getByRole("button", { name: new RegExp(`Continue · Floor ${floor}`, "i") });
  if ((await continueButton.count()) > 0) {
    await continueButton.click();
  } else {
    await page.getByRole("button", { name: /Start adventure/i }).click();
  }
  await page.locator(".floor-card.available").first().click();
  await page.waitForSelector(".intro-card");
  await page.getByRole("button", { name: /Let's go!/i }).click();
  await page.waitForTimeout(320);
  return { context, page };
}

async function openFloor(
  completed,
  floor,
  settings = { sound: false, voice: false, easyWalk: true, friendHelp: "off" },
) {
  return openFloorWithSave(
    {
      version: 1,
      completed,
      settings,
      seenTutorial: true,
    },
    floor,
  );
}

/**
 * Find the nearest junction with a dead-end branch (optionally one long
 * enough for a grumblin to sit 1-3 cells from the leaf). Returns
 * { junction, firstCell, deadEnd, pathLength } or null.
 */
function findDeadEndBranch(minPathLength = 2) {
  return (page) =>
    page.evaluate((minPathLength) => {
      const level = window.__dragonTowerLevel;
      const start = Number(
        document.querySelector("[data-player-token]").getAttribute("data-player-cell"),
      );
      const adjacency = level.cells.map(() => []);
      for (const edge of level.edges) {
        if (!edge.open) continue;
        adjacency[edge.a].push(edge.b);
        adjacency[edge.b].push(edge.a);
      }
      const isPortal = (cell) =>
        cell.kind === "start" || cell.kind === "exit" || cell.kind === "chamber";

      const order = [start];
      const visited = new Uint8Array(level.cells.length);
      visited[start] = 1;
      let head = 0;
      while (head < order.length) {
        const current = order[head++];
        for (const next of adjacency[current]) {
          if (visited[next]) continue;
          visited[next] = 1;
          order.push(next);
        }
      }

      for (const junction of order) {
        if (adjacency[junction].length < 3) continue;
        for (const first of adjacency[junction]) {
          const path = [junction, first];
          let prev = junction;
          let current = first;
          let ending = null;
          while (path.length < 60) {
            const cell = level.cells[current];
            if (isPortal(cell)) {
              ending = "portal";
              break;
            }
            const next = adjacency[current].filter((id) => id !== prev);
            if (next.length === 0) {
              ending = "dead-end";
              break;
            }
            if (next.length >= 2) {
              ending = "junction";
              break;
            }
            prev = current;
            current = next[0];
            path.push(current);
          }
          if (path.length >= 60) continue;
          if (
            ending === "dead-end" &&
            (level.cells[current].kind === "normal" || level.cells[current].kind === "ear") &&
            path.length >= minPathLength
          ) {
            return { junction, firstCell: first, deadEnd: current, pathLength: path.length };
          }
        }
      }
      return null;
    }, minPathLength);
}

// ---------- floor 1: rescue + center star, default walking, tutorial, hints ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 0,
    settings: { sound: false, voice: false, easyWalk: false, friendHelp: "off" },
    seenTutorial: false,
  });
  const page = await context.newPage();
  watch(page, "floor1-rescue");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Start adventure/i }).click();
  await page.locator(".floor-card.available").first().click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${outDir}/11-floor1-tutorial-intro.png` });
  await page.getByRole("button", { name: /Let's go!/i }).click();
  await page.waitForTimeout(300);

  const level = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("floor 1 level", {
    mission: level.mission,
    metrics: level.metrics,
    friend: level.friendCell,
    orb: level.orbCell,
    radar: level.radarCell,
    coins: level.coinCells,
  });
  if (level.mission !== "rescue") throw new Error("Floor 1 is not a rescue mission");
  if ((await page.locator("[data-radar-token]").count()) !== 0) {
    throw new Error("Floor 1 should not show a Dragon Radar");
  }
  if ((await page.locator("[data-orb-token]").count()) !== 1) {
    throw new Error("Floor 1 center orb was not visible at the start");
  }
  if ((await page.locator('[data-mission="coins"]').count()) !== 0) {
    throw new Error("Floor 1 should not show a coin mission chip");
  }

  const start = await playerCell(page);
  const avoid = new Set([start, level.friendCell, level.orbCell, level.exitCell]);

  // Walk to the nearest junction first so local corridors have real length.
  const junction = await page.evaluate(() => {
    const level = window.__dragonTowerLevel;
    const start = Number(
      document.querySelector("[data-player-token]").getAttribute("data-player-cell"),
    );
    const adjacency = level.cells.map(() => []);
    for (const edge of level.edges) {
      if (!edge.open) continue;
      adjacency[edge.a].push(edge.b);
      adjacency[edge.b].push(edge.a);
    }
    const visited = new Uint8Array(level.cells.length);
    visited[start] = 1;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      if (adjacency[current].length >= 3 && current !== start) return current;
      for (const next of adjacency[current]) {
        if (visited[next]) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }
    return -1;
  });
  if (junction === -1) throw new Error("No junction found on Floor 1");
  await walkTo(page, junction);

  // One step per press: a press on a mid-corridor cell moves exactly one cell,
  // toward the direction of the press (never the whole corridor).
  let stopPlan = null;
  for (const cell of level.cells) {
    if (avoid.has(cell.id)) continue;
    const info = await routeInfo(page, cell.id);
    if (info.localStop !== null && info.step !== null && info.step !== cell.id) {
      stopPlan = { target: cell.id, expected: await firstStepToward(page, cell.id) };
      break;
    }
  }
  if (!stopPlan) throw new Error("No walkable press target found on Floor 1");
  const beforeStepCell = await playerCell(page);
  const stopCell = await tapCell(page, stopPlan.target);
  console.log("floor 1 one-step walk", {
    from: beforeStepCell,
    target: stopPlan.target,
    expected: stopPlan.expected,
    actual: stopCell,
  });
  if (stopCell !== stopPlan.expected) {
    throw new Error(`One-step walk mismatch: expected ${stopPlan.expected}, got ${stopCell}`);
  }

  // The press direction rules: a press beyond a fork still takes exactly one
  // step toward the thumb, without pathfinding the whole way.
  let farPlan = null;
  for (const cell of level.cells) {
    if (avoid.has(cell.id) || cell.id === stopPlan.target) continue;
    const info = await routeInfo(page, cell.id);
    if (info.localStop === null && info.distance >= 2) {
      farPlan = { target: cell.id, expected: await firstStepToward(page, cell.id) };
      break;
    }
  }
  if (!farPlan) throw new Error("No beyond-fork target found on Floor 1");
  const beforeFarTap = await playerCell(page);
  const afterFarTap = await tapCell(page, farPlan.target);
  console.log("floor 1 distant press", {
    from: beforeFarTap,
    target: farPlan.target,
    expected: farPlan.expected,
    actual: afterFarTap,
  });
  if (afterFarTap !== farPlan.expected) {
    throw new Error(
      `Distant press should take one step to ${farPlan.expected}, went from ${beforeFarTap} to ${afterFarTap}`,
    );
  }


  await page.getByRole("button", { name: /^Hint$/ }).click();
  await page.waitForSelector(".hint-path", { timeout: 3000 });
  console.log("floor 1 hint", await page.locator(".toast").innerText());
  await page.screenshot({ path: `${outDir}/12-floor1-hint.png` });

  const doorTextAtStart = await page.locator('[data-mission="door"]').innerText();
  if (!/Door sealed/i.test(doorTextAtStart)) throw new Error("Floor 1 door should start sealed");

  await walkTo(page, level.friendCell);
  if (!(await chipDone(page, "friend"))) throw new Error("Mira was not rescued");
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/13-floor1-friend-rescued.png` });

  // A dense layout may route the walk to Mira straight through the centre, so
  // accept the orb being collected on the way to the rescue.
  const orbOnRoute = (await page.locator("[data-orb-token]").count()) === 0;
  if (orbOnRoute) {
    if (!(await chipDone(page, "orb"))) throw new Error("Floor 1 orb token vanished without being collected");
    if (!/Door open/i.test(await page.locator('[data-mission="door"]').innerText())) {
      throw new Error("Floor 1 door did not open after the center orb was collected");
    }
  } else {
    if ((await page.locator("[data-orb-token]").count()) !== 1) {
      throw new Error("Floor 1 center orb disappeared before collection");
    }
    if (!/Door sealed/i.test(await page.locator('[data-mission="door"]').innerText())) {
      throw new Error("Floor 1 door opened before the center orb was collected");
    }

    await walkTo(page, level.orbCell);
    if (!(await chipDone(page, "orb"))) throw new Error("Floor 1 center orb was not collected");
    if (!/Door open/i.test(await page.locator('[data-mission="door"]').innerText())) {
      throw new Error("Floor 1 door did not open after rescue and center orb");
    }
  }

  await walkTo(page, level.exitCell);
  await page.waitForSelector(".complete-card", { timeout: 10000 });
  await page.waitForTimeout(500);
  const bonusText = await page.locator(".complete-bonus").innerText();
  console.log("floor 1 completion bonus", bonusText);
  if (!/Center star found/i.test(bonusText)) throw new Error("Floor 1 completion missed the center star");
  if (/Radar found/i.test(bonusText)) throw new Error("Floor 1 should not award a radar");
  await page.screenshot({ path: `${outDir}/14-floor1-complete.png` });

  await page.getByRole("button", { name: /Next floor/i }).click();
  await page.waitForSelector(".intro-card");
  console.log("next floor", await page.locator(".intro-card h2").innerText());
  await page.screenshot({ path: `${outDir}/15-floor2-intro.png` });
  await context.close();
}

// ---------- floor 2: rescue, collect every coin, count at the door ----------
{
  const { context, page } = await openFloor(1, 2);
  const level = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("floor 2 level", {
    mission: level.mission,
    rings: level.rings,
    coins: level.coinCells,
    choices: level.coinChoices,
    metrics: level.metrics,
  });
  if (level.mission !== "coins") throw new Error("Floor 2 is not a coin-counting mission");
  if (level.coinCells.length !== 12) throw new Error("Floor 2 should have 12 Dragon Coins");
  if ((await page.locator("[data-radar-token]").count()) !== 0) {
    throw new Error("Floor 2 should not show a radar");
  }
  if ((await page.locator("[data-orb-token]").count()) !== 0) {
    throw new Error("Floor 2 orb should be awarded at the door, not shown in the maze");
  }
  if ((await page.locator("[data-coin-token]").count()) !== level.coinCells.length) {
    throw new Error("Not all Floor 2 coins were visible");
  }
  const coinChipText = await page.locator('[data-mission="coins"]').innerText();
  console.log("floor 2 coin chip", coinChipText);
  if (/\d+\s*\/\s*\d+/.test(coinChipText)) {
    throw new Error("Floor 2 coin chip should not reveal the total before the count question");
  }

  await walkToEasy(page, level.friendCell);
  if (!(await chipDone(page, "friend"))) throw new Error("Bo was not rescued");
  for (const coin of level.coinCells) {
    await walkToEasy(page, coin);
  }
  if (!(await chipDone(page, "coins"))) throw new Error("Not all Floor 2 coins were collected");
  if ((await page.locator("[data-coin-token]").count()) !== 0) {
    throw new Error("Collected Floor 2 coins were still visible");
  }
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/16-floor2-all-coins.png` });

  await walkToEasy(page, level.exitCell);
  await page.waitForSelector(".lock-card", { timeout: 10000 });
  await page.waitForTimeout(300);
  console.log("floor 2 count question", await page.locator("#door-lock-title").innerText());
  await page.screenshot({ path: `${outDir}/17-floor2-count-question.png` });

  const wrongCount = level.coinChoices.find((value) => value !== level.coinCells.length);
  if (wrongCount !== undefined) {
    await page.locator(`[data-count-choice="${wrongCount}"]`).click();
    await page.waitForSelector(".lock-error", { timeout: 3000 });
    console.log("floor 2 wrong count feedback", await page.locator(".lock-error").innerText());
  }
  await page.locator(`[data-count-choice="${level.coinCells.length}"]`).click();
  await page.waitForSelector(".complete-card", { timeout: 10000 });
  await page.waitForTimeout(500);
  const bonusText = await page.locator(".complete-bonus").innerText();
  console.log("floor 2 completion bonus", bonusText);
  if (!/You counted 12 Dragon Coins/i.test(bonusText)) {
    throw new Error("Floor 2 completion did not record the coin count");
  }
  await page.screenshot({ path: `${outDir}/18-floor2-complete.png` });

  await page.getByRole("button", { name: /Next floor/i }).click();
  await page.waitForSelector(".intro-card");
  await page.screenshot({ path: `${outDir}/19-floor3-intro.png` });
  await context.close();
}

// ---------- floor 3: bunny maze, numbered carrots, A = 1 code ----------
{
  const { context, page } = await openFloor(2, 3);
  const level = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("floor 3 level", {
    mission: level.mission,
    rings: level.rings,
    ears: level.earShapes.length,
    carrots: level.carrotCells,
    numbers: level.carrotNumbers,
    code: level.codeWord,
    choices: level.codeChoices,
    metrics: level.metrics,
  });
  if (level.mission !== "code") throw new Error("Floor 3 is not a code mission");
  if (level.earShapes.length !== 2) throw new Error("Floor 3 bunny ears were not generated");
  if (level.carrotCells.length !== 3) throw new Error("Floor 3 should have 3 numbered carrots");
  if ((await page.locator("[data-carrot-token]").count()) !== 3) {
    throw new Error("Floor 3 carrots were not visible");
  }
  if ((await page.locator('[data-mission="carrots"]').count()) !== 1) {
    throw new Error("Floor 3 carrot mission chip was missing");
  }

  await walkToEasy(page, level.friendCell);
  if (!(await chipDone(page, "friend"))) throw new Error("Pico was not rescued");
  for (const carrot of level.carrotCells) {
    await walkToEasy(page, carrot);
  }
  if (!(await chipDone(page, "carrots"))) throw new Error("Not all Floor 3 carrots were collected");
  console.log("floor 3 carrot chip", await page.locator('[data-mission="carrots"]').innerText());
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/20-floor3-all-carrots.png` });

  await walkToEasy(page, level.exitCell);
  await page.waitForSelector(".lock-card", { timeout: 10000 });
  await page.waitForTimeout(300);
  console.log("floor 3 code question", await page.locator("#door-lock-title").innerText());
  await page.screenshot({ path: `${outDir}/21-floor3-code-question.png` });

  const wrongWord = level.codeChoices.find((word) => word !== level.codeWord);
  if (wrongWord !== undefined) {
    await page.locator(`[data-code-choice="${wrongWord}"]`).click();
    await page.waitForSelector(".lock-error", { timeout: 3000 });
    console.log("floor 3 wrong code feedback", await page.locator(".lock-error").innerText());
  }
  await page.locator(`[data-code-choice="${level.codeWord}"]`).click();
  await page.waitForSelector(".complete-card", { timeout: 10000 });
  await page.waitForTimeout(500);
  const bonusText = await page.locator(".complete-bonus").innerText();
  console.log("floor 3 completion bonus", bonusText);
  if (!/Code cracked: BUG/i.test(bonusText)) {
    throw new Error("Floor 3 completion did not record the code");
  }
  await page.screenshot({ path: `${outDir}/22-floor3-complete.png` });

  await page.getByRole("button", { name: /Next floor/i }).click();
  await page.waitForSelector(".intro-card");
  await page.screenshot({ path: `${outDir}/23-floor4-intro.png` });
  await context.close();
}

// ---------- floor 4: radar hides and then reveals the orb ----------
{
  const { context, page } = await openFloor(3, 4);
  const level = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("floor 4 level", {
    mission: level.mission,
    radar: level.radarCell,
    orb: level.orbCell,
    coins: level.coinCells,
    metrics: level.metrics,
  });
  if (level.mission !== "radar") throw new Error("Floor 4 is not a radar mission");
  if ((await page.locator("[data-radar-token]").count()) !== 1) {
    throw new Error("Floor 4 radar was not visible at the start");
  }
  if ((await page.locator("[data-orb-token]").count()) !== 0) {
    throw new Error("Floor 4 orb should be hidden before the radar");
  }

  await walkToEasy(page, level.radarCell);
  if (!(await chipDone(page, "radar"))) throw new Error("Floor 4 radar was not collected");
  if ((await page.locator("[data-radar-token]").count()) !== 0) {
    throw new Error("Floor 4 radar stayed visible after collection");
  }
  if ((await page.locator("[data-orb-token]").count()) !== 1) {
    throw new Error("Floor 4 orb did not appear after the radar");
  }
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/24-floor4-radar-found.png` });

  await walkToEasy(page, level.friendCell);
  await walkToEasy(page, level.orbCell);
  if (!(await chipDone(page, "orb"))) throw new Error("Floor 4 orb was not collected");
  if (!/Door open/i.test(await page.locator('[data-mission="door"]').innerText())) {
    throw new Error("Floor 4 door did not open");
  }
  await walkToEasy(page, level.exitCell);
  await page.waitForSelector(".complete-card", { timeout: 10000 });
  await page.waitForTimeout(500);
  const bonusText = await page.locator(".complete-bonus").innerText();
  console.log("floor 4 completion bonus", bonusText);
  if (!/Radar found/i.test(bonusText)) throw new Error("Floor 4 completion missed the radar");
  await page.screenshot({ path: `${outDir}/25-floor4-complete.png` });
  await context.close();
}

// ---------- friends scouting: manual dispatch, mark, charge, recall rules ----------
{
  const { context, page } = await openFloorWithSave(
    {
      version: 2,
      completed: 0,
      settings: { sound: false, voice: false, easyWalk: false, friendHelp: "manual" },
      seenTutorial: true,
      rescuedFriends: [],
      seenScoutTutorial: true,
    },
    1,
  );
  const level = await page.evaluate(() => window.__dragonTowerLevel);

  await walkTo(page, level.friendCell);
  if (!(await chipDone(page, "friend"))) throw new Error("Mira was not rescued for scouting");

  await page.waitForSelector("[data-party-bar]");
  const miraChip = page.locator('[data-party-bar] [data-party-member="mira"]');
  if ((await miraChip.getAttribute("data-party-charge")) !== "true") {
    throw new Error("Mira should start with a scout charge");
  }
  if ((await page.locator("[data-party-cell]").count()) < 1) {
    throw new Error("Mira is not following inside the maze");
  }

  const plan = await findDeadEndBranch()(page);
  if (!plan) throw new Error("No dead-end branch found near Mira");
  console.log("floor 1 scout plan", plan);
  await walkTo(page, plan.junction);

  await miraChip.click();
  await page.waitForTimeout(150);
  if ((await page.locator("[data-scout-highlight]").count()) < 1) {
    throw new Error("Eligible branches did not highlight after selecting Mira");
  }
  await tapCell(page, plan.firstCell);
  await page.waitForSelector("[data-scout-mark]", { timeout: 9000 });
  if ((await page.locator(`[data-scout-dead-end="${plan.deadEnd}"]`).count()) !== 1) {
    throw new Error("The dead-end mark is missing or on the wrong cell");
  }
  if ((await miraChip.getAttribute("data-party-charge")) !== "false") {
    throw new Error("Mira's charge did not spend after a mark");
  }

  await page
    .locator('.party-token[data-party-member="mira"][data-party-mode="follow"]')
    .waitFor({ timeout: 9000 });

  // Sora can still walk into the marked corridor and the mark stays.
  await walkTo(page, plan.deadEnd);
  if ((await page.locator("[data-scout-mark]").count()) !== 1) {
    throw new Error("The dead-end mark vanished after Sora walked in");
  }

  // A used charge explains itself instead of re-selecting.
  await walkTo(page, plan.junction);
  await miraChip.click();
  const usedToast = await page.locator(".toast").innerText();
  if (!/already checked a path/i.test(usedToast)) {
    throw new Error(`Used-charge feedback missing, got: ${usedToast}`);
  }
  await page.screenshot({ path: `${outDir}/30-floor1-scout-mark.png` });
  await context.close();
}

// ---------- grumblin rescue: floor 2 tutorial encounter ----------
{
  const { context, page } = await openFloorWithSave(
    {
      version: 2,
      completed: 1,
      settings: { sound: false, voice: false, easyWalk: false, friendHelp: "manual" },
      seenTutorial: true,
      rescuedFriends: ["mira"],
      seenScoutTutorial: true,
    },
    2,
  );
  const level = await page.evaluate(() => window.__dragonTowerLevel);

  await walkTo(page, level.friendCell);
  if (!(await chipDone(page, "friend"))) throw new Error("Bo was not rescued for the grumblin test");

  // A valid tutorial spawn needs a branch long enough for the grumblin to
  // sit at least two cells away from Sora (path length >= 4).
  const plan = await findDeadEndBranch(4)(page);
  if (!plan) {
    console.log("grumblin block skipped: no long dead-end branch near Bo");
  } else {
    console.log("floor 2 grumblin plan", plan);
    await walkTo(page, plan.junction);
    await page.locator('[data-party-bar] [data-party-member="bo"]').click();
    await page.waitForTimeout(150);
    await tapCell(page, plan.firstCell);

    const gremlin = page.locator("[data-gremlin-cell]").first();
    await gremlin.waitFor({ timeout: 12000 });
    const gremlinCell = Number(await gremlin.getAttribute("data-gremlin-cell"));
    if ((await page.locator('[data-party-bar] [data-party-member="bo"][data-party-blocked="true"]').count()) !== 1) {
      throw new Error("Bo is not flagged as blocked in the party bar");
    }
    if ((await page.locator("[data-blocked-friend]").count()) < 1) {
      throw new Error("Bo's maze token is not flagged as blocked");
    }

    // The hint points at the grumblin while a friend is blocked.
    await page.getByRole("button", { name: /^Hint$/ }).click();
    const hintText = await page.locator(".toast").innerText();
    if (!/grumblin/i.test(hintText)) {
      throw new Error(`Hint did not target the grumblin, got: ${hintText}`);
    }
    const doorText = await page.locator('[data-mission="door"]').innerText();
    if (/Door open/i.test(doorText)) {
      throw new Error("The door opened while a friend is blocked");
    }

    // Walk over and shoo it; the mark survives and Bo comes home.
    await walkTo(page, gremlinCell);
    await page.locator("[data-gremlin-cell]").first().waitFor({ state: "detached", timeout: 6000 });
    await page
      .locator(
        '.party-token[data-party-member="bo"][data-party-mode="return"], .party-token[data-party-member="bo"][data-party-mode="follow"]',
      )
      .first()
      .waitFor({ timeout: 12000 });
    if ((await page.locator("[data-scout-mark]").count()) !== 1) {
      throw new Error("The dead-end mark did not survive the rescue");
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/31-floor2-grumblin-rescue.png` });
  }
  await context.close();
}

// ---------- every entry builds a fresh maze ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 1,
    settings: { sound: false, voice: false, easyWalk: true, friendHelp: "off" },
    seenTutorial: true,
  });
  const page = await context.newPage();
  watch(page, "replay");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Continue · Floor 2/i }).click();
  await page.locator(".floor-card").nth(0).click();
  await page.waitForSelector(".intro-card");
  await page.getByRole("button", { name: /Let's go!/i }).click();
  await page.waitForTimeout(300);
  const firstReplay = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("fresh maze one", { seed: firstReplay.seed, metrics: firstReplay.metrics });
  if (!firstReplay.seed.includes(":run-")) throw new Error("First entry did not use a run seed");
  await page.screenshot({ path: `${outDir}/27-replay.png` });

  await page.getByRole("button", { name: /Back to the tower/i }).click();
  await page.locator(".floor-card").nth(0).click();
  await page.waitForSelector(".intro-card");
  await page.getByRole("button", { name: /Let's go!/i }).click();
  await page.waitForTimeout(300);
  const secondReplay = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("fresh maze two", { seed: secondReplay.seed, metrics: secondReplay.metrics });
  if (!secondReplay.seed.includes(":run-")) throw new Error("Second entry did not use a run seed");
  if (firstReplay.seed === secondReplay.seed) throw new Error("Re-entering the floor reused the same seed");
  if (JSON.stringify(firstReplay.edges.map((edge) => edge.open)) === JSON.stringify(secondReplay.edges.map((edge) => edge.open))) {
    throw new Error("Re-entering the floor reused the same maze layout");
  }

  await page.getByRole("button", { name: /Make the maze fill the screen/i }).click();
  const bigClass = (await page.locator(".play-screen").getAttribute("class")) ?? "";
  if (!bigClass.includes("is-big-maze")) throw new Error("Big maze mode did not open");
  await page.getByRole("button", { name: /Exit big maze/i }).click();
  const normalClass = (await page.locator(".play-screen").getAttribute("class")) ?? "";
  if (normalClass.includes("is-big-maze")) throw new Error("Big maze mode did not close");
  await context.close();
}

// ---------- settings and reset ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 3,
    settings: { sound: false, voice: false, easyWalk: false, friendHelp: "off" },
    seenTutorial: true,
  });
  const page = await context.newPage();
  watch(page, "settings");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Settings" }).click();
  await page.waitForSelector(".settings-card");
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${outDir}/15-settings.png` });
  const progress = await page.locator(".progress-box-head strong").innerText();
  console.log("settings progress", progress);
  await page.getByRole("switch", { name: /Easy walking/i }).click();
  await page.getByRole("radio", { name: /I tap to send/i }).click();
  await page.getByRole("button", { name: "Done" }).click();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY2);
  console.log("settings saved", saved);
  if (saved.version !== 2) throw new Error("The v1 save did not migrate to v2");
  if (!saved.settings.easyWalk) throw new Error("Easy walking was not persisted");
  if (saved.settings.friendHelp !== "manual") throw new Error("Friend help mode was not persisted");
  if (JSON.stringify(saved.rescuedFriends) !== JSON.stringify(["mira", "bo", "pico"])) {
    throw new Error(`v2 migration inferred the wrong roster: ${JSON.stringify(saved.rescuedFriends)}`);
  }

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: /Reset all progress/i }).click();
  await page.getByRole("button", { name: /Yes, reset/i }).click();
  await page.waitForSelector(".home-screen");
  await page.waitForTimeout(450);
  const orbText = await page.locator(".hero-badge").innerText();
  const resetSave = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY2);
  console.log("reset", { orbText, completed: resetSave.completed, settings: resetSave.settings });
  if (resetSave.completed !== 0) throw new Error("Progress did not reset");
  if (resetSave.rescuedFriends.length !== 0) throw new Error("Rescued friends did not reset");
  await page.screenshot({ path: `${outDir}/16-home-after-reset.png` });
  await context.close();
}

// ---------- finale and wish ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 7,
    settings: { sound: false, voice: false, easyWalk: true, friendHelp: "off" },
    seenTutorial: true,
  });
  const page = await context.newPage();
  watch(page, "finale");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/17-home-finished.png` });
  await page.getByRole("button", { name: /Meet the dragon!/i }).click();
  await page.waitForSelector(".finale-screen");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outDir}/18-finale.png` });
  console.log("finale title", await page.locator(".finale-copy h1").innerText());
  await page.getByRole("button", { name: /A feast for everyone!/i }).click();
  await page.waitForSelector(".wish-made");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/19-wish-made.png` });
  console.log("wish result", await page.locator(".wish-made p").innerText());
  await page.getByRole("button", { name: /Play again/i }).click();
  await page.waitForSelector(".home-screen");
  await page.waitForTimeout(450);
  const orbText = await page.locator(".hero-badge").innerText();
  const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY2);
  console.log("play again", { orbText, completed: save.completed });
  if (save.completed !== 0) throw new Error("Play again did not reset progress");
  if (save.rescuedFriends.length !== 0) throw new Error("Play again kept rescued friends");
  await context.close();
}

// ---------- seventh floor to finale ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 6,
    settings: { sound: false, voice: false, easyWalk: true, friendHelp: "off" },
    seenTutorial: true,
  });
  const page = await context.newPage();
  watch(page, "floor7");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Continue · Floor 7/i }).click();
  await page.locator(".floor-card").nth(6).click();
  await page.waitForSelector(".intro-card");
  console.log("floor 7 intro", await page.locator(".intro-card h2").innerText());
  await page.getByRole("button", { name: /Let's go!/i }).click();
  await page.waitForTimeout(300);
  const level = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("floor 7 level", {
    friend: level.friendCell,
    radar: level.radarCell,
    orb: level.orbCell,
    exit: level.exitCell,
    coins: level.coinCells,
    metrics: level.metrics,
  });

  const friendChip = page.locator('[data-mission="friend"]');
  const radarChip = page.locator('[data-mission="radar"]');
  const orbChip = page.locator('[data-mission="orb"]');
  const chipDone = async (chip) => ((await chip.getAttribute("class")) ?? "").includes("is-done");

  let rescued = await chipDone(friendChip);
  for (let attempt = 0; attempt < 5 && !rescued; attempt++) {
    await tapCell(page, level.friendCell);
    rescued = await chipDone(friendChip);
  }
  let radarFound = await chipDone(radarChip);
  for (let attempt = 0; attempt < 5 && !radarFound; attempt++) {
    await tapCell(page, level.radarCell);
    radarFound = await chipDone(radarChip);
  }
  let orbFound = await chipDone(orbChip);
  for (let attempt = 0; attempt < 5 && !orbFound; attempt++) {
    await tapCell(page, level.orbCell);
    orbFound = await chipDone(orbChip);
  }
  if (!rescued || !radarFound || !orbFound) throw new Error("Floor 7 objectives were not completed");
  await walkToEasy(page, level.exitCell);
  await page.waitForSelector(".complete-card");
  const completeTitle = await page.locator("#floor-complete-title").innerText();
  console.log("floor 7 complete", completeTitle);
  await page.screenshot({ path: `${outDir}/22-floor7-complete.png` });
  await page.getByRole("button", { name: /Meet the dragon!/i }).click();
  await page.waitForSelector(".finale-screen");
  console.log("floor 7 finale", await page.locator(".finale-copy h1").innerText());
  await context.close();
}

// ---------- mobile settings and how-to ----------
{
  const context = await contextWithSave(
    {
      version: 1,
      completed: 2,
      settings: { sound: false, voice: false, easyWalk: false, friendHelp: "off" },
      seenTutorial: true,
    },
    { width: 390, height: 844 },
  );
  const page = await context.newPage();
  watch(page, "mobile-modals");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Settings" }).click();
  await page.waitForSelector(".settings-card");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/23-settings-mobile.png` });
  const settingsBox = await page.locator(".settings-card").boundingBox();
  console.log("mobile settings card", settingsBox);
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: /How to play/i }).click();
  await page.waitForSelector(".howto-card");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/24-howto-mobile.png` });
  const howtoBox = await page.locator(".howto-card").boundingBox();
  console.log("mobile howto card", howtoBox);
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: innerHeight,
  }));
  console.log("mobile modals overflow", overflow);
  await context.close();
}

// ---------- mobile finale ----------
{
  const context = await contextWithSave(
    {
      version: 1,
      completed: 7,
      settings: { sound: false, voice: false, easyWalk: true, friendHelp: "off" },
      seenTutorial: true,
    },
    { width: 390, height: 844 },
  );
  const page = await context.newPage();
  watch(page, "finale-mobile");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Meet the dragon!/i }).click();
  await page.waitForSelector(".finale-screen");
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/20-finale-mobile.png` });
  await page.screenshot({ path: `${outDir}/21-finale-mobile-full.png`, fullPage: true });
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: innerHeight,
  }));
  console.log("finale mobile layout", overflow);
  await context.close();
}

console.log("ERRORS", JSON.stringify(errors, null, 2));
if (errors.length) process.exitCode = 1;
await browser.close();
