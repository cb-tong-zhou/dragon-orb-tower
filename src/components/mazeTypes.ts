/**
 * Shared renderer contracts for the friends-scouting feature. The Maze
 * component accepts these as optional props; the game logic owns the real
 * types and the hook adapts them.
 */
export type { ScoutHighlight, ScoutMark, ScoutBranch } from "../game/scouting";
export type { GremlinToken } from "../game/encounters";
export type { FriendHelpMode, PartyMember } from "../game/friends";

export interface PartyToken {
  characterId: string;
  cellId: number;
  slot: number;
  mode: "follow" | "scout" | "return" | "blocked";
  hasCharge: boolean;
}
