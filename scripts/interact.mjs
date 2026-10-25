import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const KEY = "dragon-orb-tower-save-v1";
async function ctx(completed) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(({key,value}) => localStorage.setItem(key, JSON.stringify(value)), { key: KEY, value: { version:1, completed, settings:{sound:false,voice:false,easyWalk:false}, seenTutorial:true } });
  const page = await context.newPage();
  page.on("console", m => { if (m.type()==="error") console.log("console", m.text()); });
  page.on("pageerror", e => console.log("pageerror", e.message));
  return { context, page };
}
async function playerCell(page) { return Number(await page.locator("[data-player-token]").getAttribute("data-player-cell")); }
async function waitForWalkEnd(page) { let last=null, stable=0; for (let i=0;i<200;i++){ const cur=await playerCell(page); if(cur===last) stable++; else {stable=0; last=cur;} if(stable>=3) return cur; await page.waitForTimeout(80);} return last; }
async function tapCell(page, id) { await page.locator(`[data-cell-id="${id}"]`).click({ force:true }); return waitForWalkEnd(page); }
async function walkTo(page, target) {
  for (let i=0;i<40;i++) {
    if (await playerCell(page) === target) return;
    const before = await playerCell(page);
    await tapCell(page, target);
    if (await playerCell(page) === target) return;
    if (await playerCell(page) === before) { await page.waitForTimeout(100); }
  }
  throw new Error(`Could not walk to ${target}, at ${await playerCell(page)}`);
}
async function openFloor(completed, floor) {
  const { context, page } = await ctx(completed);
  await page.goto("http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Tower map" }).click();
  await page.getByRole("button", { name: new RegExp(`^Floor ${floor},`) }).click();
  await page.getByRole("button", { name: "Let's go!" }).click();
  await page.waitForTimeout(250);
  return { context, page };
}

// Floor 1 rescue
{
  const { context, page } = await openFloor(7,1);
  const level = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("floor1", level.mission, level.orbCell, await page.locator("[data-orb-token]").count());
  await walkTo(page, level.friendCell);
  await walkTo(page, level.orbCell);
  await walkTo(page, level.exitCell);
  await page.waitForTimeout(500);
  console.log("floor1 complete", await page.getByRole("heading", { name: /Center star found/ }).count());
  await page.screenshot({ path: "screenshots/qa-floor1-complete.png" });
  await context.close();
}

// Floor 2 coins
{
  const { context, page } = await openFloor(7,2);
  const level = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("floor2", level.mission, level.coinCells.length, "choices", level.coinChoices);
  await walkTo(page, level.friendCell);
  for (const coin of level.coinCells) await walkTo(page, coin);
  console.log("coins chip", await page.locator('[data-mission="coins"]').innerText());
  await walkTo(page, level.exitCell);
  await page.waitForTimeout(350);
  console.log("count modal", await page.getByRole("heading", { name: /How many/ }).count());
  await page.screenshot({ path: "screenshots/qa-floor2-count.png" });
  await page.locator(`[data-count-choice="${level.coinCells.length}"]`).click();
  await page.waitForTimeout(500);
  console.log("floor2 complete", await page.getByRole("heading", { name: /Coins counted/ }).count());
  await page.screenshot({ path: "screenshots/qa-floor2-complete.png" });
  await context.close();
}

// Floor 3 code
{
  const { context, page } = await openFloor(7,3);
  const level = await page.evaluate(() => window.__dragonTowerLevel);
  console.log("floor3", level.mission, level.carrotCells, level.carrotNumbers, level.codeChoices, "ears", level.earShapes.length);
  await walkTo(page, level.friendCell);
  for (const carrot of level.carrotCells) await walkTo(page, carrot);
  console.log("carrot chip", await page.locator('[data-mission="carrots"]').innerText());
  await walkTo(page, level.exitCell);
  await page.waitForTimeout(350);
  console.log("code modal", await page.getByRole("heading", { name: /Crack the word/ }).count());
  await page.screenshot({ path: "screenshots/qa-floor3-code.png" });
  await page.locator(`[data-code-choice="${level.codeWord}"]`).click();
  await page.waitForTimeout(500);
  console.log("floor3 complete", await page.getByRole("heading", { name: /Code cracked/ }).count());
  await page.screenshot({ path: "screenshots/qa-floor3-complete.png" });
  await context.close();
}
await browser.close();
