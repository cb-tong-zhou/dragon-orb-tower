import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(({key,value}) => localStorage.setItem(key, JSON.stringify(value)), { key: "dragon-orb-tower-save-v1", value: { version:1, completed:7, settings:{sound:false,voice:false,easyWalk:true}, seenTutorial:true } });
const page = await context.newPage();
page.on("console", m => { if (m.type()==="error") console.log("console", m.text()); });
page.on("pageerror", e => console.log("pageerror", e.message));
await page.goto("http://127.0.0.1:5173/");
await page.getByRole("button", { name: "Tower map" }).click();
await page.getByRole("button", { name: /^Floor 4,/ }).click();
await page.getByRole("button", { name: "Let's go!" }).click();
await page.waitForTimeout(250);
const level = await page.evaluate(() => window.__dragonTowerLevel);
console.log("level", {friend:level.friendCell, exit:level.exitCell, orb:level.orbCell, radar:level.radarCell, coins:level.coinCells, mission:level.mission});
console.log("tokens start", {radar:await page.locator('[data-radar-token]').count(), orb:await page.locator('[data-orb-token]').count()});
async function playerCell() { return Number(await page.locator("[data-player-token]").getAttribute("data-player-cell")); }
async function walkTo(target) { for (let i=0;i<12;i++){ if(await playerCell()===target) return; await page.locator(`[data-cell-id="${target}"]`).click({force:true}); let last=null,stable=0; for(let j=0;j<300;j++){const c=await playerCell(); if(c===last)stable++; else {stable=0;last=c;} if(stable>=3)break; await page.waitForTimeout(50);} } throw new Error("stuck "+target); }
await walkTo(level.radarCell);
console.log("after radar", {radar:await page.locator('[data-radar-token]').count(), orb:await page.locator('[data-orb-token]').count()});
await page.screenshot({path:"screenshots/qa-floor4-radar.png"});
await walkTo(level.friendCell);
await walkTo(level.orbCell);
console.log("after orb", {orb:await page.locator('[data-orb-token]').count()});
await page.screenshot({path:"screenshots/qa-floor4-orb.png"});
await walkTo(level.exitCell);
await page.waitForTimeout(500);
console.log("complete", await page.getByRole("heading", { name: /Dragon Orb found/ }).count());
await page.screenshot({path:"screenshots/qa-floor4-complete.png"});
await browser.close();
