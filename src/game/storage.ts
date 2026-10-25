export interface Settings {
  sound: boolean;
  voice: boolean;
  easyWalk: boolean;
}

export interface SaveData {
  version: 1;
  completed: number;
  settings: Settings;
  seenTutorial: boolean;
}

const STORAGE_KEY = "dragon-orb-tower-save-v1";

export const DEFAULT_SAVE: SaveData = {
  version: 1,
  completed: 0,
  settings: {
    sound: true,
    voice: false,
    easyWalk: false,
  },
  seenTutorial: false,
};

export function loadSave(): SaveData {
  if (typeof window === "undefined") return { ...DEFAULT_SAVE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, settings: { ...DEFAULT_SAVE.settings } };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const completed = Number.isFinite(parsed.completed)
      ? Math.max(0, Math.min(7, Number(parsed.completed)))
      : 0;
    return {
      version: 1,
      completed,
      settings: {
        sound: parsed.settings?.sound ?? DEFAULT_SAVE.settings.sound,
        voice: parsed.settings?.voice ?? DEFAULT_SAVE.settings.voice,
        easyWalk: parsed.settings?.easyWalk ?? DEFAULT_SAVE.settings.easyWalk,
      },
      seenTutorial: parsed.seenTutorial ?? false,
    };
  } catch {
    return { ...DEFAULT_SAVE, settings: { ...DEFAULT_SAVE.settings } };
  }
}

export function saveProgress(save: SaveData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // The game still works if storage is unavailable.
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
