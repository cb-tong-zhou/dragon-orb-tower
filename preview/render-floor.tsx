// Renders the real game Maze for floor 1 at two sector counts, side by side.
// Build & run: see preview/README step (esbuild bundle, then node).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
import { generateFloor } from "../src/generator/generate";
import { FLOORS } from "../src/content/floors";
import { getCharacter } from "../src/content/characters";
import { Maze } from "../src/components/Maze";
import { buildGrowingLevel } from "./growing-proto";
import { buildTemplateLevel } from "./template-proto";

const story = FLOORS[0];
const sora = getCharacter("sora");
const friend = getCharacter(story.config.friendId);// Template preview uses more, tighter rings so the bands read as dense.
const TEMPLATE_RINGS = 18;

function renderMaze(sectors: number, label: string, growing = false, template = false, hand = false): string {
  const config = { ...story.config, sectors };
  const level = hand
    ? buildHandOuterLevel(TEMPLATE_RINGS, sectors)
    : template
    ? buildTemplateLevel(TEMPLATE_RINGS, sectors, config.seed)
    : growing
      ? buildGrowingLevel(config.rings, (ring) => Math.round(6 + (ring - 1) * 2), config.seed)
      : generateFloor(config);
  const html = renderToStaticMarkup(
    createElement(Maze, {
      level,
      playerCell: level.startCell,
      followerCell: null,
      friend,
      player: sora,
      accent: story.accent,
      friendRescued: false,
      radarCollected: false,
      orbCollected: false,
      coinsCollected: [],
      carrotsCollected: [],
      doorReady: false,
      hintPath: [],
      moving: false,
      showMoves: false,
      onCellTap: () => {},
    }),
  );
  return `<figure style="display:inline-block;width:820px;margin:12px;font-family:sans-serif">
<figcaption style="font-size:26px;margin-bottom:8px">${label}</figcaption>
<div style="width:820px;height:820px">${html}</div></figure>`;
}

const page = `<!doctype html><meta charset="utf-8"><body style="background:#FFF6E2;margin:0;padding:12px">
<div style="display:flex;flex-wrap:wrap">
${renderMaze(16, "现在：每圈 16 格（游戏当前配置）")}
${renderMaze(0, "新：每圈格子数递增（外圈更密）", true)}
${renderMaze(16, "模板原型：隔两圈一道同心墙、留门", false, true)}
</div>
</body>`;

writeFileSync("preview/floor1-compare.html", page);
console.log("wrote preview/floor1-compare.html");
