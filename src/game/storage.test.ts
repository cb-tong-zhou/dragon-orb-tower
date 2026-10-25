import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SAVE,
  STORAGE_KEY_V1,
  STORAGE_KEY_V2,
  clearSave,
  loadSave,
  migrateSave,
  saveProgress,
  type SaveDataV2,
} from "./storage";

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  get length(): number {
    return this.data.size;
  }
}

const storage = new MemoryStorage();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadSave", () => {
  it("returns a fresh v2 save when storage is empty", () => {
    const save = loadSave();

    expect(save).toEqual(DEFAULT_SAVE);
    expect(save.version).toBe(2);
    expect(save.settings.friendHelp).toBe("auto");
    expect(save.rescuedFriends).toEqual([]);
  });

  it("migrates a v1 save and infers rescued friends", () => {
    storage.setItem(
      STORAGE_KEY_V1,
      JSON.stringify({
        version: 1,
        completed: 3,
        settings: { sound: false, voice: true, easyWalk: true },
        seenTutorial: true,
      }),
    );

    const save = loadSave();

    expect(save.version).toBe(2);
    expect(save.completed).toBe(3);
    expect(save.seenTutorial).toBe(true);
    expect(save.seenScoutTutorial).toBe(false);
    expect(save.rescuedFriends).toEqual(["mira", "bo", "pico"]);
    expect(save.settings).toEqual({
      sound: false,
      voice: true,
      easyWalk: true,
      friendHelp: "auto",
    });
  });

  it("prefers v2 and unions a partial stored roster with inferred friends", () => {
    storage.setItem(
      STORAGE_KEY_V1,
      JSON.stringify({
        version: 1,
        completed: 1,
        settings: { sound: true, voice: false, easyWalk: false },
        seenTutorial: true,
      }),
    );
    storage.setItem(
      STORAGE_KEY_V2,
      JSON.stringify({
        version: 2,
        completed: 3,
        settings: {
          sound: true,
          voice: false,
          easyWalk: false,
          friendHelp: "manual",
        },
        seenTutorial: false,
        rescuedFriends: ["mira", "bo"],
        seenScoutTutorial: true,
      }),
    );

    const save = loadSave();

    expect(save.completed).toBe(3);
    expect(save.seenTutorial).toBe(false);
    expect(save.settings.friendHelp).toBe("manual");
    expect(save.rescuedFriends).toEqual(["mira", "bo", "pico"]);
    expect(save.seenScoutTutorial).toBe(true);
  });

  it("clamps completed progress and handles string values", () => {
    storage.setItem(
      STORAGE_KEY_V2,
      JSON.stringify({ version: 2, completed: 99, settings: {} }),
    );
    expect(loadSave().completed).toBe(7);
    expect(loadSave().rescuedFriends).toEqual([
      "mira",
      "bo",
      "pico",
      "roku",
      "taro",
      "nova",
      "kiko",
    ]);

    storage.setItem(
      STORAGE_KEY_V2,
      JSON.stringify({ version: 2, completed: -5, settings: {} }),
    );
    expect(loadSave().completed).toBe(0);

    storage.setItem(
      STORAGE_KEY_V2,
      JSON.stringify({ version: 2, completed: "2", settings: {} }),
    );
    expect(loadSave().completed).toBe(2);
  });

  it("falls back to defaults for invalid settings and friend values", () => {
    storage.setItem(
      STORAGE_KEY_V2,
      JSON.stringify({
        version: 2,
        completed: 2,
        settings: { sound: "yes", voice: 1, easyWalk: null, friendHelp: "sometimes" },
        seenTutorial: "yes",
        rescuedFriends: [1, "mira", null, "bo", "zoe"],
        seenScoutTutorial: 1,
      }),
    );

    const save = loadSave();

    expect(save.settings).toEqual({
      sound: true,
      voice: false,
      easyWalk: false,
      friendHelp: "auto",
    });
    expect(save.rescuedFriends).toEqual(["mira", "bo"]);
    expect(save.seenTutorial).toBe(false);
    expect(save.seenScoutTutorial).toBe(false);
  });

  it("falls back to v1 when the v2 payload is corrupt", () => {
    storage.setItem(STORAGE_KEY_V2, "{not json");
    storage.setItem(
      STORAGE_KEY_V1,
      JSON.stringify({
        version: 1,
        completed: 2,
        settings: { sound: true, voice: false, easyWalk: false },
        seenTutorial: false,
      }),
    );

    const save = loadSave();

    expect(save.version).toBe(2);
    expect(save.completed).toBe(2);
    expect(save.rescuedFriends).toEqual(["mira", "bo"]);
  });

  it("falls back to v1 when v2 is valid JSON but not a save", () => {
    storage.setItem(STORAGE_KEY_V2, "null");
    storage.setItem(
      STORAGE_KEY_V1,
      JSON.stringify({
        version: 1,
        completed: 1,
        settings: { sound: true, voice: false, easyWalk: false },
        seenTutorial: false,
      }),
    );

    expect(loadSave().completed).toBe(1);

    storage.setItem(STORAGE_KEY_V2, JSON.stringify({ completed: 4, rescuedFriends: [] }));
    expect(loadSave().completed).toBe(1);
  });

  it("works without window storage", () => {
    vi.unstubAllGlobals();

    const save = loadSave();
    expect(save.version).toBe(2);
    expect(save.completed).toBe(0);
    expect(save.rescuedFriends).toEqual([]);
    expect(() => saveProgress(DEFAULT_SAVE)).not.toThrow();
    expect(() => clearSave()).not.toThrow();
  });
});

describe("migrateSave", () => {
  it("returns a fresh save for a null JSON payload", () => {
    expect(migrateSave("null")).toEqual(DEFAULT_SAVE);
  });

  it("throws on malformed JSON so callers can fall back", () => {
    expect(() => migrateSave("{not json")).toThrow();
  });
});

describe("saveProgress and clearSave", () => {
  it("writes v2 without deleting the v1 rollback key", () => {
    storage.setItem(STORAGE_KEY_V1, "legacy");
    const save: SaveDataV2 = {
      ...DEFAULT_SAVE,
      completed: 2,
      rescuedFriends: ["mira", "bo"],
    };

    saveProgress(save);

    expect(JSON.parse(storage.getItem(STORAGE_KEY_V2) as string)).toEqual(save);
    expect(storage.getItem(STORAGE_KEY_V1)).toBe("legacy");
  });

  it("clears both save keys", () => {
    storage.setItem(STORAGE_KEY_V1, "legacy");
    storage.setItem(STORAGE_KEY_V2, "current");

    clearSave();

    expect(storage.getItem(STORAGE_KEY_V1)).toBeNull();
    expect(storage.getItem(STORAGE_KEY_V2)).toBeNull();
  });
});
