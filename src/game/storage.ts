import {
  clampCompleted,
  inferRescuedFriends,
  normalizeRescuedFriends,
  type FriendHelpMode,
} from "./friends";

export interface Settings {
  sound: boolean;
  voice: boolean;
  friendHelp: FriendHelpMode;
}

export interface SaveDataV1 {
  version: 1;
  completed: number;
  settings: {
    sound: boolean;
    voice: boolean;
  };
  seenTutorial: boolean;
}

export interface SaveDataV2 {
  version: 2;
  completed: number;
  settings: Settings;
  seenTutorial: boolean;
  rescuedFriends: string[];
  seenScoutTutorial: boolean;
}

/** The app-level save shape. Kept as an alias so existing imports stay stable. */
export type SaveData = SaveDataV2;

export const STORAGE_KEY_V1 = "dragon-orb-tower-save-v1";
export const STORAGE_KEY_V2 = "dragon-orb-tower-save-v2";

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  voice: false,
  friendHelp: "auto",
};

export const DEFAULT_SAVE: SaveDataV2 = {
  version: 2,
  completed: 0,
  settings: { ...DEFAULT_SETTINGS },
  seenTutorial: false,
  rescuedFriends: [],
  seenScoutTutorial: false,
};

interface StoredSettings {
  sound?: unknown;
  voice?: unknown;
  friendHelp?: unknown;
}

interface StoredSave {
  version?: unknown;
  completed?: unknown;
  settings?: StoredSettings;
  seenTutorial?: unknown;
  rescuedFriends?: unknown;
  seenScoutTutorial?: unknown;
}

function freshSave(): SaveDataV2 {
  return {
    ...DEFAULT_SAVE,
    settings: { ...DEFAULT_SETTINGS },
    rescuedFriends: [],
  };
}

function parseFriendHelp(value: unknown): FriendHelpMode {
  return value === "manual" || value === "off" || value === "auto" ? value : "auto";
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function migrateParsed(parsed: StoredSave): SaveDataV2 {
  const completed = clampCompleted(parsed.completed);
  const inferred = inferRescuedFriends(completed);
  const storedFriends = Array.isArray(parsed.rescuedFriends)
    ? parsed.rescuedFriends.filter((id): id is string => typeof id === "string")
    : [];

  return {
    version: 2,
    completed,
    settings: {
      sound: parseBoolean(parsed.settings?.sound, DEFAULT_SETTINGS.sound),
      voice: parseBoolean(parsed.settings?.voice, DEFAULT_SETTINGS.voice),
      friendHelp: parseFriendHelp(parsed.settings?.friendHelp),
    },
    seenTutorial: parseBoolean(parsed.seenTutorial, false),
    rescuedFriends: normalizeRescuedFriends(storedFriends, inferred),
    seenScoutTutorial: parseBoolean(parsed.seenScoutTutorial, false),
  };
}

/**
 * Convert either a v1 or v2 payload into the current save shape. Missing
 * rescued friends are inferred from completed floors; stored friends are
 * unioned in so a partial v2 write cannot lose a rescue.
 */
export function migrateSave(raw: string): SaveDataV2 {
  const parsed = JSON.parse(raw) as StoredSave | null;
  if (!parsed || typeof parsed !== "object") return freshSave();
  return migrateParsed(parsed);
}

function readSave(key: string): SaveDataV2 | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSave | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== 1 && parsed.version !== 2) return null;
    return migrateParsed(parsed);
  } catch {
    return null;
  }
}

export function loadSave(): SaveDataV2 {
  if (typeof window === "undefined") return freshSave();
  try {
    return readSave(STORAGE_KEY_V2) ?? readSave(STORAGE_KEY_V1) ?? freshSave();
  } catch {
    return freshSave();
  }
}

export function saveProgress(save: SaveDataV2) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ ...save, version: 2 }));
  } catch {
    // The game still works if storage is unavailable.
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_V2);
    window.localStorage.removeItem(STORAGE_KEY_V1);
  } catch {
    // Ignore.
  }
}
