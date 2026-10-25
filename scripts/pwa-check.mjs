import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173/";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});

await page.goto(BASE, { waitUntil: "networkidle" });
const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
const manifest = await page.evaluate(async (href) => {
  const response = await fetch(href);
  return { status: response.status, body: await response.json() };
}, manifestHref);
const iconStatuses = [];
for (const icon of manifest.body.icons ?? []) {
  const status = await page.evaluate(async (src) => (await fetch(src)).status, icon.src);
  iconStatuses.push({ src: icon.src, sizes: icon.sizes, status });
}
console.log("manifest", { href: manifestHref, name: manifest.body.name, status: manifest.status, icons: iconStatuses });

const swReady = await page.evaluate(async () => {
  const registration = await navigator.serviceWorker.ready;
  return { scope: registration.scope, active: Boolean(registration.active) };
});
console.log("service worker ready", swReady);

await page.reload({ waitUntil: "networkidle" });
const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
const cacheInfo = await page.evaluate(async () => {
  const keys = await caches.keys();
  const entries = [];
  for (const key of keys) {
    const cache = await caches.open(key);
    entries.push({ key, count: (await cache.keys()).length });
  }
  return entries;
});
console.log("service worker control", { controlled, cacheInfo });

await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".home-screen");
const offlineTitle = await page.locator(".game-logo").innerText();
const offlineStart = await page.getByRole("button", { name: /Start adventure/i }).innerText();
console.log("offline home", { title: offlineTitle.replace(/\n/g, " "), start: offlineStart });
await page.screenshot({ path: "screenshots/25-pwa-offline.png" });

await page.getByRole("button", { name: /Start adventure/i }).click();
await page.locator(".floor-card.available").first().click();
await page.getByRole("button", { name: /Let's go!/i }).click();
await page.waitForSelector("[data-player-token]");
console.log("offline playable", {
  title: await page.locator(".play-heading h1").innerText(),
  cells: await page.locator("[data-cell-id]").count(),
});
await page.screenshot({ path: "screenshots/26-pwa-offline-play.png" });

console.log("ERRORS", JSON.stringify(errors, null, 2));
if (errors.length) process.exitCode = 1;
await browser.close();
