import { FRIENDS } from "../content/characters";
import { FLOORS, TOTAL_FLOORS } from "../content/floors";

export type FriendHelpMode = "auto" | "manual" | "off";

export interface PartyMember {
  characterId: string;
  cellId: number;
  slot: number;
  mode: "follow" | "scout" | "return" | "blocked";
  /** One scout per friend per floor. */
  hasCharge: boolean;
  /** Cells including the starting cell. */
  scoutPath: number[];
  scoutIndex: number;
  markId?: string;
  /** Gremlin id while blocked. */
  blockedBy?: string;
}

const FRIEND_IDS = new Set(FRIENDS.map((friend) => friend.id));

export function isFriendId(id: string): boolean {
  return FRIEND_IDS.has(id);
}

export function clampCompleted(completed: unknown): number {
  const numeric = typeof completed === "number" ? completed : Number(completed);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(TOTAL_FLOORS, Math.floor(numeric)));
}

export function inferRescuedFriends(completed: number): string[] {
  return FLOORS.slice(0, clampCompleted(completed)).map((story) => story.config.friendId);
}

/**
 * Union stored and inferred friends, filter unknown IDs, dedupe, and keep the
 * canonical rescue order. Inferred friends come first so a partially written
 * save still recovers earlier rescues.
 */
export function normalizeRescuedFriends(
  rescuedFriends: readonly string[] | undefined,
  inferred: readonly string[] = [],
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const id of [...inferred, ...(rescuedFriends ?? [])]) {
    if (!FRIEND_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }

  return result;
}

export function addRescuedFriend(roster: readonly string[], friendId: string): string[] {
  if (!FRIEND_IDS.has(friendId) || roster.includes(friendId)) return [...roster];
  return [...roster, friendId];
}

export function hasRescuedFriend(roster: readonly string[], friendId: string): boolean {
  return roster.includes(friendId);
}

/**
 * The active party is the most recently rescued friends, up to `max`.
 * Pass currentFriendId only after that friend has been rescued this run.
 */
export function activeParty(
  roster: readonly string[],
  currentFriendId?: string,
  max = 3,
): string[] {
  const limit = Math.floor(max);
  if (limit <= 0) return [];

  const available = [...roster];
  if (
    currentFriendId &&
    FRIEND_IDS.has(currentFriendId) &&
    !available.includes(currentFriendId)
  ) {
    available.push(currentFriendId);
  }

  return available.slice(-limit);
}

export function createPartyMember(
  characterId: string,
  cellId: number,
  slot: number,
): PartyMember {
  return {
    characterId,
    cellId,
    slot,
    mode: "follow",
    hasCharge: true,
    scoutPath: [],
    scoutIndex: 0,
  };
}
