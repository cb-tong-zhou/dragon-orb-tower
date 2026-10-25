import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = "screenshots";
const BASE = "http://127.0.0.1:5173/";
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

async function walkTo(page, target) {
  await page.locator(`[data-cell-id="${target}"]`).click({ force: true });
  await page.waitForFunction(
    (cell) =>
      Number(document.querySelector("[data-player-token]")?.getAttribute("data-player-cell")) === cell,
    target,
    { timeout: 25000 },
  );
}

async function chipDone(page, mission) {
  const chip = page.locator(`[data-mission="${mission}"]`);
  if ((await chip.count()) === 0) return false;
  return (((await chip.first().getAttribute("class")) ?? "").includes("is-done"));
}

const desktop = await contextWithSave({
  version: 1,
  completed: 0,
  settings: { sound: false, voice: false, easyWalk: true },
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
if (floor2.coinCells.length !== 8) throw new Error("Floor 2 should have 8 coins");
const coinChip = await page.locator('[data-mission="coins"]').innerText();
if (/\d+\s*\/\s*\d+/.test(coinChip)) throw new Error("Floor 2 coin chip reveals the count");

await walkTo(page, floor2.friendCell);
await page.waitForFunction(
  () => document.querySelector('[data-mission="friend"]')?.classList.contains("is-done"),
  null,
  { timeout: 10000 },
);
for (const coin of floor2.coinCells) {
  await walkTo(page, coin);
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
    settings: { sound: false, voice: false, easyWalk: true },
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
