import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(({key,value}) => localStorage.setItem(key, JSON.stringify(value)), { key: "dragon-orb-tower-save-v1", value: { version:1, completed:7, settings:{sound:false,voice:false,easyWalk:true}, seenTutorial:true } });
const page = await context.newPage();
page.on("console", m => { if (m.type()==="error") console.log("console", m.text()); });
page.on("pageerror", e => console.log("pageerror", e.message));
await page.goto("http://127.0.0.1:5173/");
await page.getByRole("button", { name: "Tower map" }).click();
await page.getByRole("button", { name: /^Floor 3,/ }).click();
await page.getByRole("button", { name: "Let's go!" }).click();
await page.waitForTimeout(250);
const level = await page.evaluate(() => window.__dragonTowerLevel);
console.log("level", {friend:level.friendCell, exit:level.exitCell, carrots:level.carrotCells, ears:level.earShapes.length});
async function playerCell() { return Number(await page.locator("[data-player-token]").getAttribute("data-player-cell")); }
async function tap(id) {
  console.log("tap", id, "from", await playerCell());
  await page.locator(`[data-cell-id="${id}"]`).click({ force:true });
  let last=null, stable=0;
  for (let i=0;i<300;i++){ const cur=await playerCell(); if(cur===last) stable++; else {stable=0; last=cur;} if(stable>=3) break; await page.waitForTimeout(50);}
  console.log(" ->", await playerCell());
}
async function walkTo(target) {
  for (let i=0;i<12;i++) {
    if (await playerCell() === target) { console.log("reached", target); return; }
    await tap(target);
  }
  throw new Error("stuck at "+await playerCell()+" target "+target);
}
await walkTo(level.friendCell);
await page.screenshot({path:"screenshots/qa-floor3-friend.png"});
for (const carrot of level.carrotCells) await walkTo(carrot);
await page.screenshot({path:"screenshots/qa-floor3-carrots.png"});
await walkTo(level.exitCell);
await page.waitForTimeout(500);
console.log("code modal", await page.getByRole("heading", { name: /Crack the word/ }).count());
await page.screenshot({ path: "screenshots/qa-floor3-code.png" });
await page.locator(`[data-code-choice="${level.codeWord}"]`).click();
await page.waitForTimeout(500);
console.log("complete", await page.getByRole("heading", { name: /Code cracked/ }).count());
await page.screenshot({ path: "screenshots/qa-floor3-complete.png" });
await browser.close();
