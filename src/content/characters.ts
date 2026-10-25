export type HairStyle =
  | "spiky"
  | "bob"
  | "bald"
  | "antenna"
  | "mustache"
  | "headband"
  | "ponytail"
  | "cat";

export type Accessory = "none" | "goggles" | "headband" | "scouter" | "mustache" | "antenna";

export interface Character {
  id: string;
  name: string;
  role: string;
  greeting: string;
  hairStyle: HairStyle;
  accessory: Accessory;
  skin: string;
  hair: string;
  outfit: string;
  accent: string;
  aura: string;
}

export const SORA: Character = {
  id: "sora",
  name: "Sora",
  role: "the little hero",
  greeting: "Let's go!",
  hairStyle: "spiky",
  accessory: "none",
  skin: "#F2BC8A",
  hair: "#231A15",
  outfit: "#FF7A1A",
  accent: "#2C6FBB",
  aura: "#FFD166",
};

export const FRIENDS: Character[] = [
  {
    id: "mira",
    name: "Mira",
    role: "the inventor",
    greeting: "You found me! I knew you'd come.",
    hairStyle: "bob",
    accessory: "goggles",
    skin: "#F8CDA6",
    hair: "#4C8CD6",
    outfit: "#2C7DA0",
    accent: "#FFC93C",
    aura: "#8ED1FC",
  },
  {
    id: "bo",
    name: "Bo",
    role: "the dumpling monk",
    greeting: "Nice moves! Let's grab that orb.",
    hairStyle: "bald",
    accessory: "none",
    skin: "#E7B07A",
    hair: "#E7B07A",
    outfit: "#FF9F1C",
    accent: "#FFF4DC",
    aura: "#FFB347",
  },
  {
    id: "pico",
    name: "Pico",
    role: "the green guardian",
    greeting: "Hmph. Took you long enough.",
    hairStyle: "antenna",
    accessory: "antenna",
    skin: "#8BC34A",
    hair: "#5E8C31",
    outfit: "#6A4C93",
    accent: "#FFD166",
    aura: "#B9E769",
  },
  {
    id: "roku",
    name: "Roku",
    role: "the sky mentor",
    greeting: "Ah, youth. My back was getting stiff.",
    hairStyle: "mustache",
    accessory: "mustache",
    skin: "#E8B98B",
    hair: "#F5F1E8",
    outfit: "#4E8C6A",
    accent: "#F4A261",
    aura: "#A8E6CF",
  },
  {
    id: "taro",
    name: "Taro",
    role: "the gentle giant",
    greeting: "Whoa! This maze is bigger than my lunchbox.",
    hairStyle: "headband",
    accessory: "headband",
    skin: "#D99A64",
    hair: "#3A2A20",
    outfit: "#A0522D",
    accent: "#F2CC8F",
    aura: "#FFD9A0",
  },
  {
    id: "nova",
    name: "Nova",
    role: "the star smith",
    greeting: "About time. I already found the exit.",
    hairStyle: "ponytail",
    accessory: "scouter",
    skin: "#F3C7A5",
    hair: "#F06C9B",
    outfit: "#2B2D42",
    accent: "#FFD166",
    aura: "#FF9EC4",
  },
  {
    id: "kiko",
    name: "Kiko",
    role: "the wish keeper",
    greeting: "The dragon is waking up! I can feel it!",
    hairStyle: "cat",
    accessory: "none",
    skin: "#F7B2C4",
    hair: "#F7B2C4",
    outfit: "#FFE29A",
    accent: "#FF6B6B",
    aura: "#FFC2D1",
  },
];

export const CHARACTERS = [SORA, ...FRIENDS];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((character) => character.id === id) ?? SORA;
}
