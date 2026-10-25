import { FLOORS } from "../src/content/floors";
import { generateFloor, validateLevel } from "../src/generator/generate";
import { bfsPath, deadEnds } from "../src/generator/graph";

for (const story of FLOORS) {
  const level = generateFloor(story.config);
  const radar = level.radarCell >= 0 ? bfsPath(level, level.startCell, level.radarCell).length - 1 : -1;
  console.log(`floor ${level.floor} ${level.mission} rings=${level.rings} cells=${level.cells.length} dead=${level.metrics.deadEnds} friend=${level.metrics.pathToFriend} orb=${level.metrics.pathToOrb} exit=${level.metrics.pathToExit} radar=${radar} coins=${level.coinCells.length} carrots=${level.carrotCells.length} ears=${level.earShapes.length} valid=${validateLevel(level, story.config)}`);
}
