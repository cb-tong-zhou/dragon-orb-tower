import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(({key,value}) => localStorage.setItem(key, JSON.stringify(value)), { key: "dragon-orb-tower-save-v1", value: { version:1, completed:7, settings:{sound:false,voice:false,easyWalk:false}, seenTutorial:true } });
const page = await context.newPage();
page.on("console", m => { if (m.type()==="error") console.log("console", m.text()); });
page.on("pageerror", e => console.log("pageerror", e.message));
await page.goto("http://127.0.0.1:5173/");
await page.getByRole("button", { name: "Tower map" }).click();
for (const floor of [1,2,3,4]) {
  await page.getByRole("button", { name: new RegExp(`^Floor ${floor},`) }).click();
  await page.screenshot({ path: `screenshots/qa-floor${floor}-intro.png` });
  await page.getByRole("button", { name: "Let's go!" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `screenshots/qa-floor${floor}.png` });
  const info = await page.evaluate(() => {
    const l = window.__dragonTowerLevel;
    return l ? { mission:l.mission, rings:l.rings, dead:l.metrics.deadEnds, cells:l.cells.length, start:l.startCell, friend:l.friendCell, exit:l.exitCell, orb:l.orbCell, radar:l.radarCell, coins:l.coinCells, carrots:l.carrotCells, numbers:l.carrotNumbers, ears:l.earShapes.length, extraTop:l.extraTop } : null;
  });
  console.log("floor", floor, info);
  await page.getByRole("button", { name: "Back to the tower" }).click();
}
await browser.close();
