import type { FloorConfig } from "../generator/types";

export interface FloorStory {
  config: FloorConfig;
  accent: string;
  intro: string;
  orbHint: string;
}

export const FLOORS: FloorStory[] = [
  {
    config: {
      floor: 1,
      title: "Mira's Crash Landing",
      subtitle: "The first floor",
      friendId: "mira",
      mission: "rescue",
      orbStars: 1,
      rings: 10,
      braid: 0,
      orbAtCenter: true,
      sectors: 16,
      coinCount: 0,
      newestChance: 0.9,
      deadEndMin: 20,
      seed: "dragon-orb-tower-v1-floor-1",
    },
    accent: "#8ED1FC",
    intro:
      "Mira's capsule crash-landed on the first floor. Rescue her, then reach the 1-star Dragon Orb glowing in the middle of the maze.",
    orbHint: "The 1-star orb is glowing in the middle of the maze.",
  },
  {
    config: {
      floor: 2,
      title: "Bo's Dumpling Dojo",
      subtitle: "The second floor",
      friendId: "bo",
      mission: "coins",
      orbStars: 2,
      rings: 15,
      braid: 0,
      orbAtCenter: false,
      sectors: 24,
      coinCount: 12,
      newestChance: 0.9,
      deadEndMin: 30,
      portalStyle: "opposite",
      seed: "dragon-orb-tower-v1-floor-2",
    },
    accent: "#FFB347",
    intro:
      "Bo's dumpling dojo is a maze today. Rescue Bo, collect every Dragon Coin, then count them at the door to earn the 2-star Dragon Orb!",
    orbHint: "Collect every coin and answer the counting question at the door.",
  },
  {
    config: {
      floor: 3,
      title: "Pico's Bunny Garden",
      subtitle: "The third floor",
      friendId: "pico",
      mission: "code",
      orbStars: 3,
      rings: 10,
      braid: 0,
      orbAtCenter: false,
      sectors: 16,
      coinCount: 0,
      bunny: true,
      newestChance: 0.86,
      deadEndMin: 22,
      code: {
        word: "BUG",
        numbers: [2, 21, 7],
        choices: ["BUG", "BAT", "BIG"],
      },
      seed: "dragon-orb-tower-v1-floor-3",
    },
    accent: "#B9E769",
    intro:
      "Pico's garden grew into a giant bunny maze! Rescue Pico, collect the three numbered carrots, and crack the A = 1 code at the door to earn the 3-star Dragon Orb.",
    orbHint: "The 3-star orb is behind the code-locked door.",
  },
  {
    config: {
      floor: 4,
      title: "Roku's Sky Library",
      subtitle: "The fourth floor",
      friendId: "roku",
      mission: "radar",
      orbStars: 4,
      rings: 11,
      braid: 0,
      orbAtCenter: false,
      sectors: 28,
      coinCount: 3,
      newestChance: 0.8,
      deadEndMin: 27,
      seed: "dragon-orb-tower-v1-floor-4",
    },
    accent: "#A8E6CF",
    intro:
      "Roku fell asleep in the sky library. Wake him, find the Dragon Radar, and uncover the 4-star Dragon Orb!",
    orbHint: "The 4-star orb is on a shelf at the end of a winding path.",
  },
  {
    config: {
      floor: 5,
      title: "Taro's Sandcastle",
      subtitle: "The fifth floor",
      friendId: "taro",
      mission: "radar",
      orbStars: 5,
      rings: 11,
      braid: 0,
      orbAtCenter: false,
      sectors: 28,
      coinCount: 3,
      newestChance: 0.8,
      deadEndMin: 27,
      seed: "dragon-orb-tower-v1-floor-5",
    },
    accent: "#FFD9A0",
    intro:
      "Taro's sandcastle turned into a labyrinth. Help him, find the Dragon Radar, and grab the 5-star Dragon Orb!",
    orbHint: "The 5-star orb is tucked into a sandy dead end.",
  },
  {
    config: {
      floor: 6,
      title: "Nova's Star Forge",
      subtitle: "The sixth floor",
      friendId: "nova",
      mission: "radar",
      orbStars: 6,
      rings: 12,
      braid: 0,
      orbAtCenter: false,
      sectors: 28,
      coinCount: 3,
      newestChance: 0.8,
      deadEndMin: 30,
      seed: "dragon-orb-tower-v1-floor-6",
    },
    accent: "#FF9EC4",
    intro:
      "Nova's star forge is spinning. Get her out, find the Dragon Radar, and find the 6-star Dragon Orb!",
    orbHint: "The 6-star orb sparkles at the edge of the forge.",
  },
  {
    config: {
      floor: 7,
      title: "Kiko's Wish Room",
      subtitle: "The top floor",
      friendId: "kiko",
      mission: "radar",
      orbStars: 7,
      rings: 12,
      braid: 0,
      orbAtCenter: false,
      sectors: 28,
      coinCount: 3,
      newestChance: 0.8,
      deadEndMin: 30,
      seed: "dragon-orb-tower-v1-floor-7",
    },
    accent: "#FFC2D1",
    intro:
      "Kiko is waiting at the top. Rescue her, find the Dragon Radar, and take the 7-star Dragon Orb!",
    orbHint: "The last orb is deep in the tower. You can do it!",
  },
];

export const TOTAL_FLOORS = FLOORS.length;

export function floorStory(floor: number): FloorStory {
  return FLOORS[Math.min(Math.max(floor, 1), TOTAL_FLOORS) - 1];
}
