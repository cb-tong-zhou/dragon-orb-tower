// Renders every campaign floor with the real generator (mixed carvers).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
import { generateFloor } from "../src/generator/generate";
import { FLOORS } from "../src/content/floors";
import { getCharacter } from "../src/content/characters";
import { Maze } from "../src/components/Maze";

const sora = getCharacter("sora");

function renderFloor(story: (typeof FLOORS)[number]): string {
  const level = generateFloor(story.config);
  const NAMES: Record<string, string> = {
    divide: "分割法",
    ring: "同心圈",
    growing: "递增回廊",
    hybrid: "混合（外圈同心 + 内圈回廊）",
  };
  // Bunny floors are forced onto the divide carver (their ears are a template).
  const carver = story.config.bunny ? "divide" : story.config.generator ?? "auto";
  const svg = renderToStaticMarkup(
    createElement(Maze, {
      level,
      playerCell: level.startCell,
      followerCell: null,
      friend: getCharacter(story.config.friendId),
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
  const label = `F${story.config.floor} ${NAMES[carver] ?? carver}`;
  return `<figure style="margin:8px;width:460px">
<figcaption style="font-size:20px;font-family:sans-serif">${label}</figcaption>
<div style="width:460px;height:520px">${svg}</div></figure>`;
}

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#FFF6E2">
<div style="display:flex;flex-wrap:wrap;width:2900px">${FLOORS.map(renderFloor).join("")}</div>
</body>`;

writeFileSync("preview/campaign.html", page);
console.log("wrote preview/campaign.html");
