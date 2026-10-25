import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await context.addInitScript(({key,value}) => localStorage.setItem(key, JSON.stringify(value)), { key: "dragon-orb-tower-save-v1", value: { version:1, completed:7, settings:{sound:false,voice:false,easyWalk:false}, seenTutorial:true } });
const page = await context.newPage();
await page.goto("http://127.0.0.1:5173/");
await page.getByRole("button", { name: "Tower map" }).click();
for (const floor of [1,2,3]) {
  await page.getByRole("button", { name: new RegExp(`^Floor ${floor},`) }).click();
  await page.getByRole("button", { name: "Let's go!" }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `screenshots/qa-mobile-floor${floor}.png` });
  await page.getByRole("button", { name: "Back to the tower" }).click();
}
await browser.close();
