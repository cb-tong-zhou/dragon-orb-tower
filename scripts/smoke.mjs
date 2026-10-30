import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = "screenshots";
const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:5173/";
const KEY = "dragon-orb-tower-save-v1";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

async function makePage(context, label) {
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label} console: ${message.text()}`);
  });
  return page;
}

async function contextWithSave(save, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: KEY, value: save },
  );
  return context;
}

async function playerCell(page) {
  return Number(await page.locator("[data-player-token]").getAttribute("data-player-cell"));
}

async function playerPoint(page) {
  return page.evaluate(() => {
    const token = document.querySelector("[data-player-token]");
    const match = (token?.style.transform ?? "").match(
      /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/,
    );
    return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
  });
}

/** Keep in sync with TAP_REACH in src/game/motionPath.ts. */
const TAP_REACH = 8;

/** Tap a point that really resolves to `cellId` (ear cells overlap the ring). */
async function tapCell(page, cellId) {
  const point = await page.evaluate((id) => {
    const level = window.__dragonTowerLevel;
    const cell = level.cells[id];
    const svg = document.querySelector(".maze-svg");
    const ctm = svg.getScreenCTM();
    const centre = new DOMPoint(cell.cx, cell.cy).matrixTransform(ctm);
    const owns = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest?.("[data-cell-id]")?.getAttribute("data-cell-id") === String(id);
    };
    const candidates = [];
    if (owns(centre.x, centre.y)) candidates.push({ x: centre.x, y: centre.y });
    const hit = document.querySelector(`[data-cell-id="${id}"]`);
    if (hit) {
      const box = hit.getBoundingClientRect();
      for (let row = 1; row <= 21; row++) {
        for (let col = 1; col <= 21; col++) {
          const x = box.left + (box.width * col) / 22;
          const y = box.top + (box.height * row) / 22;
          if (owns(x, y)) candidates.push({ x, y });
        }
      }
    }
    if (candidates.length === 0) return { x: centre.x, y: centre.y };
    let best = candidates[0];
    let bestDistance = Infinity;
    for (const candidate of candidates) {
      const distance = Math.hypot(candidate.x - centre.x, candidate.y - centre.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
    return best;
  }, cellId);
  await page.mouse.click(point.x, point.y);
  return waitForWalkEnd(page);
}

/** Wait for walk to finish (complete card or movement stop). */
async function waitForWalkEnd(page, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  const settle = Date.now() + 300;
  while (Date.now() < settle) {
    if ((await page.getAttribute(".maze-svg", "data-moving")) === "true") break;
    await page.waitForTimeout(25);
  }
  while (Date.now() < deadline) {
    if ((await page.locator(".complete-card").count()) > 0) return playerCell(page);
    if ((await page.getAttribute(".maze-svg", "data-moving")) !== "true") return playerCell(page);
    await page.waitForTimeout(25);
  }
  return playerCell(page);
}

/** Next cell to tap toward `target`: farthest cell whose walk fits the reach. */
async function pickTapStep(page, target, limit = TAP_REACH - 1.2) {
  return page.evaluate(
    ({ targetId, limit }) => {
      const level = window.__dragonTowerLevel;
      const token = document.querySelector("[data-player-token]");
      const match = (token?.style.transform ?? "").match(
        /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/,
      );
      const point = match ? { x: Number(match[1]), y: Number(match[2]) } : null;
      const nearestCell = (p) => {
        let best = 0;
        let bestDistance = Infinity;
        for (const cell of level.cells) {
          const d = Math.hypot(cell.cx - p.x, cell.cy - p.y);
          if (d < bestDistance) {
            bestDistance = d;
            best = cell.id;
          }
        }
        return best;
      };
      const start = point
        ? nearestCell(point)
        : Number(document.querySelector("[data-player-token]").getAttribute("data-player-cell"));
      const from = point ?? { x: level.cells[start].cx, y: level.cells[start].cy };
      if (start === targetId) return { cell: targetId, length: 0, steps: 0 };

      const adjacency = level.cells.map(() => []);
      for (const edge of level.edges) {
        if (!edge.open) continue;
        adjacency[edge.a].push(edge.b);
        adjacency[edge.b].push(edge.a);
      }
      const previous = new Array(level.cells.length).fill(-1);
      const seen = new Uint8Array(level.cells.length);
      seen[start] = 1;
      const queue = [start];
      for (let head = 0; head < queue.length; head++) {
        const current = queue[head];
        if (current === targetId) break;
        for (const next of adjacency[current]) {
          if (seen[next]) continue;
          seen[next] = 1;
          previous[next] = current;
          queue.push(next);
        }
      }
      if (!seen[targetId]) return null;

      const path = [];
      let cursor = targetId;
      while (cursor !== start) {
        path.push(cursor);
        cursor = previous[cursor];
      }
      path.push(start);
      path.reverse();

      let length = 0;
      let pick = start;
      let steps = 0;
      let previousPoint = from;
      for (let index = 1; index < path.length; index++) {
        const cell = level.cells[path[index]];
        const leg = Math.hypot(cell.cx - previousPoint.x, cell.cy - previousPoint.y);
        if (length + leg > limit) break;
        length += leg;
        previousPoint = { x: cell.cx, y: cell.cy };
        pick = path[index];
        steps = index;
      }
      if (pick === start) return null;
      return { cell: pick, length, steps };
    },
    { targetId: target, limit },
  );
}

/** Walk to a cell with local taps: each tap stays inside the tap range and
 * the next tap continues from wherever Sora stopped.
 */
async function walkTo(page, target, attempts = 400) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if ((await page.locator(".complete-card").count()) > 0) return;
    const current = await playerCell(page);
    if (current === target) return;
    const before = await playerPoint(page);
    let step = await pickTapStep(page, target);
    if (!step) step = await pickTapStep(page, target, TAP_REACH - 0.15);
    if (!step) throw new Error(`smoke: no route from ${current} to ${target}`);
    const after = await tapCell(page, step.cell);
    if ((await page.locator(".complete-card").count()) > 0) return;
    if (after === target) return;
    const afterPoint = await playerPoint(page);
    const moved =
      before && afterPoint ? Math.hypot(afterPoint.x - before.x, afterPoint.y - before.y) : 0;
    if (after !== current || moved > 0.01) continue;
    const shortStep = await pickTapStep(page, target, TAP_REACH - 0.15);
    if (shortStep && shortStep.cell !== step.cell) {
      const retryAfter = await tapCell(page, shortStep.cell);
      if ((await page.locator(".complete-card").count()) > 0) return;
      if (retryAfter === target) return;
      const retryPoint = await playerPoint(page);
      const retryMoved =
        before && retryPoint
          ? Math.hypot(retryPoint.x - before.x, retryPoint.y - before.y)
          : 0;
      if (retryAfter !== current || retryMoved > 0.01) continue;
    }
    throw new Error(`smoke: Sora did not move from ${current} toward ${target}`);
  }
  throw new Error(`smoke walkTo could not reach cell ${target}`);
}

async function chipDone(page, mission) {
  const chip = page.locator(`[data-mission="${mission}"]`);
  if ((await chip.count()) === 0) return false;
  return (((await chip.first().getAttribute("class")) ?? "").includes("is-done"));
}

const desktop = await contextWithSave({
  version: 1,
  completed: 0,
  settings: { sound: false, voice: false },
  seenTutorial: false,
});
const page = await makePage(desktop, "desktop");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/01-home-desktop.png`, fullPage: true });

await page.getByRole("button", { name: /Start adventure/i }).click();
await page.waitForTimeout(350);
await page.screenshot({ path: `${outDir}/02-tower-desktop.png`, fullPage: true });

await page.locator(".floor-card.available").first().click();
await page.waitForSelector(".intro-card");
await page.waitForTimeout(350);
await page.screenshot({ path: `${outDir}/03-floor1-intro.png` });
await page.getByRole("button", { name: /Let's go!/i }).click();
await page.waitForTimeout(450);
await page.screenshot({ path: `${outDir}/04-floor1-play.png` });

const floor1 = await page.evaluate(() => window.__dragonTowerLevel);
console.log("floor 1", {
  mission: floor1.mission,
  metrics: floor1.metrics,
  friend: floor1.friendCell,
  orb: floor1.orbCell,
  radar: floor1.radarCell,
  exit: floor1.exitCell,
});
if (floor1.mission !== "rescue") throw new Error("Floor 1 is not a rescue mission");
if ((await page.locator("[data-radar-token]").count()) !== 0) {
  throw new Error("Floor 1 should not show a radar");
}
if ((await page.locator("[data-orb-token]").count()) !== 1) {
  throw new Error("Floor 1 center orb was not visible");
}

await walkTo(page, floor1.friendCell);
await page.waitForFunction(
  () => document.querySelector('[data-mission="friend"]')?.classList.contains("is-done"),
  null,
  { timeout: 10000 },
);
console.log("floor 1 friend rescued");
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/05-floor1-friend.png` });

await walkTo(page, floor1.orbCell);
await page.waitForFunction(
  () => document.querySelector('[data-mission="orb"]')?.classList.contains("is-done"),
  null,
  { timeout: 10000 },
);
console.log("floor 1 center orb collected");
await page.waitForTimeout(350);

await walkTo(page, floor1.exitCell);
await page.waitForSelector(".complete-card", { timeout: 15000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/06-floor1-complete.png` });
console.log("floor 1 complete", await page.locator(".complete-card h2").innerText());

await page.getByRole("button", { name: /Next floor/i }).click();
await page.waitForSelector(".intro-card");
await page.waitForTimeout(350);
await page.screenshot({ path: `${outDir}/07-floor2-intro.png` });
console.log("floor 2 intro", await page.locator(".intro-card h2").innerText());
await page.getByRole("button", { name: /Let's go!/i }).click();
await page.waitForTimeout(450);
await page.screenshot({ path: `${outDir}/08-floor2-play.png` });

const floor2 = await page.evaluate(() => window.__dragonTowerLevel);
console.log("floor 2", {
  mission: floor2.mission,
  rings: floor2.rings,
  coins: floor2.coinCells,
  choices: floor2.coinChoices,
  metrics: floor2.metrics,
});
if (floor2.mission !== "coins") throw new Error("Floor 2 is not a coin-counting mission");
if (floor2.coinCells.length !== 12) throw new Error("Floor 2 should have 12 coins");
const coinChip = await page.locator('[data-mission="coins"]').innerText();
if (/\d+\s*\/\s*\d+/.test(coinChip)) throw new Error("Floor 2 coin chip reveals the count");

await walkTo(page, floor2.friendCell);
await page.waitForFunction(
  () => document.querySelector('[data-mission="friend"]')?.classList.contains("is-done"),
  null,
  { timeout: 10000 },
);
let checkedCoinToast = false;
for (const coin of floor2.coinCells) {
  await walkTo(page, coin);
  if (!checkedCoinToast) {
    const toastText = await page.locator(".toast").innerText();
    console.log("floor 2 coin toast", toastText);
    if (/12/.test(toastText)) {
      throw new Error("Floor 2 coin toast revealed the total before the count question");
    }
    checkedCoinToast = true;
  }
}
await page.waitForFunction(
  () => document.querySelector('[data-mission="coins"]')?.classList.contains("is-done"),
  null,
  { timeout: 15000 },
);
console.log("floor 2 all coins collected");
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/09-floor2-coins.png` });

await walkTo(page, floor2.exitCell);
await page.waitForSelector(".lock-card", { timeout: 15000 });
await page.waitForTimeout(350);
await page.screenshot({ path: `${outDir}/10-floor2-count.png` });
console.log("floor 2 count question", await page.locator("#door-lock-title").innerText());
await page.locator(`[data-count-choice="${floor2.coinCells.length}"]`).click();
await page.waitForSelector(".complete-card", { timeout: 15000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/11-floor2-complete.png` });
console.log("floor 2 complete", await page.locator(".complete-card h2").innerText());

const mobile = await contextWithSave(
  {
    version: 1,
    completed: 0,
    settings: { sound: false, voice: false },
    seenTutorial: true,
  },
  { width: 390, height: 844 },
);
const mobilePage = await makePage(mobile, "mobile");
await mobilePage.goto(BASE, { waitUntil: "networkidle" });
await mobilePage.waitForTimeout(500);
await mobilePage.screenshot({ path: `${outDir}/12-home-mobile.png`, fullPage: true });
await mobilePage.getByRole("button", { name: /Start adventure/i }).click();
await mobilePage.waitForTimeout(350);
await mobilePage.screenshot({ path: `${outDir}/13-tower-mobile.png`, fullPage: true });
await mobilePage.locator(".floor-card.available").first().click();
await mobilePage.waitForSelector(".intro-card");
await mobilePage.waitForTimeout(300);
await mobilePage.screenshot({ path: `${outDir}/14-floor1-intro-mobile.png` });
await mobilePage.getByRole("button", { name: /Let's go!/i }).click();
await mobilePage.waitForTimeout(500);
await mobilePage.screenshot({ path: `${outDir}/15-floor1-play-mobile.png` });
console.log("mobile floor 1", await mobilePage.evaluate(() => window.__dragonTowerLevel?.metrics));

console.log("ERRORS", JSON.stringify(errors, null, 2));
if (errors.length) process.exitCode = 1;
await browser.close();
