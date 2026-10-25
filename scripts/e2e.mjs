import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/";
const KEY = "dragon-orb-tower-save-v1";
const outDir = "screenshots";
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
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: KEY, value: save },
  );
  return context;
}

async function playerCell(page) {
  return Number(await page.locator("[data-player-token]").getAttribute("data-player-cell"));
}

async function waitForWalkEnd(page) {
  let last = null;
  let stable = 0;
  for (let i = 0; i < 160; i++) {
    const current = await playerCell(page);
    if (current === last) stable += 1;
    else {
      stable = 0;
      last = current;
    }
    if (stable >= 3) return current;
    await page.waitForTimeout(100);
  }
  return last;
}

async function tapCell(page, cellId) {
  await page.locator(`[data-cell-id="${cellId}"]`).click({ force: true });
  return waitForWalkEnd(page);
}

async function planStop(page, target) {
  return page.evaluate(({ target }) => {
    const level = window.__dragonTowerLevel;
    const start = Number(document.querySelector("[data-player-token]").getAttribute("data-player-cell"));
    const adjacency = level.cells.map(() => []);
    for (const edge of level.edges) {
      if (!edge.open) continue;
      adjacency[edge.a].push(edge.b);
      adjacency[edge.b].push(edge.a);
    }
    const previous = new Array(level.cells.length).fill(-1);
    const visited = new Uint8Array(level.cells.length);
    visited[start] = 1;
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      for (const next of adjacency[current]) {
        if (visited[next]) continue;
        visited[next] = 1;
        previous[next] = current;
        queue.push(next);
      }
    }
    const path = [];
    let cursor = target;
    while (cursor !== -1) {
      path.push(cursor);
      cursor = previous[cursor];
    }
    path.reverse();
    let stop = target;
    for (let i = 1; i < path.length; i++) {
      if (adjacency[path[i]].length >= 3) {
        stop = path[i];
        break;
      }
    }
    return { start, path, stop, stopDegree: adjacency[stop].length };
  }, { target });
}

// ---------- helpers for mission flows ----------
async function chipDone(page, mission) {
  const chip = page.locator(`[data-mission="${mission}"]`);
  if ((await chip.count()) === 0) return false;
  return (((await chip.first().getAttribute("class")) ?? "").includes("is-done"));
}

async function walkTo(page, target, attempts = 60) {
  let last = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const current = await playerCell(page);
    if (current === target) return current;
    const next = await tapCell(page, target);
    if (next === target) return next;
    if (next === last && next === current) await page.waitForTimeout(120);
    last = next;
  }
  throw new Error(`Could not reach cell ${target}; stopped at ${await playerCell(page)}`);
}

async function openFloor(completed, floor, settings = { sound: false, voice: false, easyWalk: true }) {
  const context = await contextWithSave({
    version: 1,
    completed,
    settings,
    seenTutorial: true,
  });
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

// ---------- floor 1: rescue + center star, default walking, tutorial, hints ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 0,
    settings: { sound: false, voice: false, easyWalk: false },
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
  let stopPlan = null;
  for (const cell of level.cells) {
    if (avoid.has(cell.id)) continue;
    const plan = await planStop(page, cell.id);
    if (plan.path.length > 2 && plan.stop !== cell.id) {
      stopPlan = { target: cell.id, ...plan };
      break;
    }
  }
  if (!stopPlan) throw new Error("No corridor-stop target found on Floor 1");
  const stopCell = await tapCell(page, stopPlan.target);
  console.log("floor 1 corridor stop", {
    target: stopPlan.target,
    expected: stopPlan.stop,
    actual: stopCell,
    path: stopPlan.path.length,
  });
  if (stopCell !== stopPlan.stop) {
    throw new Error(`Corridor stop mismatch: expected ${stopPlan.stop}, got ${stopCell}`);
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
  if (level.coinCells.length !== 8) throw new Error("Floor 2 should have 8 Dragon Coins");
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

  await walkTo(page, level.friendCell);
  if (!(await chipDone(page, "friend"))) throw new Error("Bo was not rescued");
  for (const coin of level.coinCells) {
    await walkTo(page, coin);
  }
  if (!(await chipDone(page, "coins"))) throw new Error("Not all Floor 2 coins were collected");
  if ((await page.locator("[data-coin-token]").count()) !== 0) {
    throw new Error("Collected Floor 2 coins were still visible");
  }
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/16-floor2-all-coins.png` });

  await walkTo(page, level.exitCell);
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
  if (!/You counted 8 Dragon Coins/i.test(bonusText)) {
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

  await walkTo(page, level.friendCell);
  if (!(await chipDone(page, "friend"))) throw new Error("Pico was not rescued");
  for (const carrot of level.carrotCells) {
    await walkTo(page, carrot);
  }
  if (!(await chipDone(page, "carrots"))) throw new Error("Not all Floor 3 carrots were collected");
  console.log("floor 3 carrot chip", await page.locator('[data-mission="carrots"]').innerText());
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/20-floor3-all-carrots.png` });

  await walkTo(page, level.exitCell);
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

  await walkTo(page, level.radarCell);
  if (!(await chipDone(page, "radar"))) throw new Error("Floor 4 radar was not collected");
  if ((await page.locator("[data-radar-token]").count()) !== 0) {
    throw new Error("Floor 4 radar stayed visible after collection");
  }
  if ((await page.locator("[data-orb-token]").count()) !== 1) {
    throw new Error("Floor 4 orb did not appear after the radar");
  }
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/24-floor4-radar-found.png` });

  await walkTo(page, level.friendCell);
  await walkTo(page, level.orbCell);
  if (!(await chipDone(page, "orb"))) throw new Error("Floor 4 orb was not collected");
  if (!/Door open/i.test(await page.locator('[data-mission="door"]').innerText())) {
    throw new Error("Floor 4 door did not open");
  }
  await walkTo(page, level.exitCell);
  await page.waitForSelector(".complete-card", { timeout: 10000 });
  await page.waitForTimeout(500);
  const bonusText = await page.locator(".complete-bonus").innerText();
  console.log("floor 4 completion bonus", bonusText);
  if (!/Radar found/i.test(bonusText)) throw new Error("Floor 4 completion missed the radar");
  await page.screenshot({ path: `${outDir}/25-floor4-complete.png` });
  await context.close();
}

// ---------- every entry builds a fresh maze ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 1,
    settings: { sound: false, voice: false, easyWalk: true },
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
    settings: { sound: false, voice: false, easyWalk: false },
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
  await page.getByRole("button", { name: "Done" }).click();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
  console.log("settings saved", saved.settings);
  if (!saved.settings.easyWalk) throw new Error("Easy walking was not persisted");

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: /Reset all progress/i }).click();
  await page.getByRole("button", { name: /Yes, reset/i }).click();
  await page.waitForSelector(".home-screen");
  await page.waitForTimeout(450);
  const orbText = await page.locator(".hero-badge").innerText();
  const resetSave = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
  console.log("reset", { orbText, completed: resetSave.completed, settings: resetSave.settings });
  if (resetSave.completed !== 0) throw new Error("Progress did not reset");
  await page.screenshot({ path: `${outDir}/16-home-after-reset.png` });
  await context.close();
}

// ---------- finale and wish ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 7,
    settings: { sound: false, voice: false, easyWalk: true },
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
  const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
  console.log("play again", { orbText, completed: save.completed });
  if (save.completed !== 0) throw new Error("Play again did not reset progress");
  await context.close();
}

// ---------- seventh floor to finale ----------
{
  const context = await contextWithSave({
    version: 1,
    completed: 6,
    settings: { sound: false, voice: false, easyWalk: true },
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
  await tapCell(page, level.exitCell);
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
      settings: { sound: false, voice: false, easyWalk: false },
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
      settings: { sound: false, voice: false, easyWalk: true },
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
