import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Level } from "../generator/types";
import type { PartyToken } from "../components/mazeTypes";
import type { FriendHelpMode } from "./friends";
import * as director from "./scoutDirector";
import type { ScoutEvent, ScoutState, ScoutTapAction } from "./scoutDirector";
import type { GremlinToken } from "./encounters";
import type { ScoutHighlight, ScoutMark } from "./scouting";

export const AUTO_SCOUT_DELAY_MS = 1200;
export const SCOUT_TICK_MS = 110;

export interface UseScoutDirectorOptions {
  enabled: boolean;
  level: Level;
  /** Active party ids in slot order (most recent rescue last). */
  partyIds: string[];
  playerCell: number;
  playerMoving: boolean;
  helpMode: FriendHelpMode;
  modalsOpen: boolean;
  onEvent: (event: ScoutEvent) => void;
}

export interface ScoutDirector {
  enabled: boolean;
  state: ScoutState;
  partyTokens: PartyToken[];
  marks: ScoutMark[];
  gremlins: GremlinToken[];
  highlight: ScoutHighlight | null;
  selection: string | null;
  hasBlockedFriend: boolean;
  blockedGremlin: GremlinToken | null;
  selectFriend: (characterId: string) => string | null;
  recallFriend: (characterId: string) => void;
  handleCellTap: (cellId: number) => ScoutTapAction;
  cancelSelection: () => void;
}

/**
 * React glue for the pure scout director: one interval drives every active
 * scout at the same cadence as the player's walk, one timer implements the
 * auto-scout offer, and every commit is a plain snapshot so renders stay
 * bounded (at most two friends are ever out at once).
 */
export function useScoutDirector(options: UseScoutDirectorOptions): ScoutDirector {
  const { enabled, level, partyIds, playerCell, playerMoving, helpMode, modalsOpen, onEvent } =
    options;

  const [state, setState] = useState<ScoutState>(() =>
    director.createScoutState(partyIds, level.startCell),
  );
  const stateRef = useRef(state);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const latestRef = useRef({ playerMoving, modalsOpen });
  latestRef.current = { playerMoving, modalsOpen };

  const commit = useCallback((next: ScoutState, events: ScoutEvent[]) => {
    stateRef.current = next;
    setState(next);
    for (const event of events) onEventRef.current(event);
  }, []);

  const commitState = useCallback(
    (next: ScoutState) => {
      commit(next, []);
    },
    [commit],
  );

  // Reconcile membership when friends are rescued or the active window shifts.
  const partyKey = partyIds.join(",");
  useEffect(() => {
    if (!enabled) return;
    commitState(director.syncParty(stateRef.current, partyIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, partyKey, commitState]);

  // Record player steps (conga line + auto context) and check grumblin rescues.
  useEffect(() => {
    if (!enabled) return;
    const stepped = director.applyPlayerStep(stateRef.current, playerCell);
    const rescue = director.checkRescue(stepped, level, playerCell);
    commit(rescue.state, rescue.events);
  }, [enabled, playerCell, level, commit]);

  // One interval for every walking actor; it idles when there is no work.
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      if (latestRef.current.modalsOpen) return;
      if (!director.hasTickWork(stateRef.current)) return;
      commit(...bundleTick(stateRef.current, level));
    }, SCOUT_TICK_MS);
    return () => window.clearInterval(timer);
  }, [enabled, level, commit]);

  // Auto mode: offer one volunteer per new junction after a short pause.
  useEffect(() => {
    if (!enabled || helpMode !== "auto" || playerMoving || modalsOpen) return;
    if (playerCell !== stateRef.current.playerTrail[0]) return;

    const plan = director.planAutoDispatch(stateRef.current, level);
    if (!plan) return;

    const timer = window.setTimeout(() => {
      const current = stateRef.current;
      if (latestRef.current.playerMoving || latestRef.current.modalsOpen) return;
      if (current.playerTrail[0] !== playerCell) return;
      const fresh = director.planAutoDispatch(current, level);
      if (!fresh) return;
      const dispatch = director.dispatchScout(
        current,
        level,
        fresh.characterId,
        fresh.firstCell,
        "auto",
      );
      commit(dispatch.state, dispatch.events);
    }, AUTO_SCOUT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, helpMode, playerCell, playerMoving, modalsOpen, level, commit]);

  // Modals cancel a pending manual selection.
  useEffect(() => {
    if (!modalsOpen) return;
    const next = director.cancelSelection(stateRef.current);
    if (next !== stateRef.current) commitState(next);
  }, [modalsOpen, commitState]);

  const selectFriend = useCallback(
    (characterId: string): string | null => {
      if (!enabled) return null;
      const next = director.selectFriend(stateRef.current, characterId);
      if (next !== stateRef.current) commitState(next);
      return next.selectedFriendId;
    },
    [enabled, commitState],
  );

  const recallFriend = useCallback(
    (characterId: string) => {
      if (!enabled) return;
      const result = director.recallFriend(stateRef.current, characterId);
      commit(result.state, result.events);
    },
    [enabled, commit],
  );

  const handleCellTap = useCallback(
    (cellId: number): ScoutTapAction => {
      if (!enabled || !stateRef.current.selectedFriendId) return "ignored";
      const outcome = director.resolveScoutTap(stateRef.current, level, cellId);
      if (outcome.action !== "ignored") {
        commit(outcome.result.state, outcome.result.events);
      }
      return outcome.action;
    },
    [enabled, level, commit],
  );

  const cancelSelection = useCallback(() => {
    if (!enabled) return;
    const next = director.cancelSelection(stateRef.current);
    if (next !== stateRef.current) commitState(next);
  }, [enabled, commitState]);

  const partyTokens = useMemo<PartyToken[]>(
    () =>
      state.party.map((member) => ({
        characterId: member.characterId,
        cellId: member.cellId,
        slot: member.slot,
        mode: member.mode,
        hasCharge: member.hasCharge,
      })),
    [state.party],
  );

  const highlight = useMemo<ScoutHighlight | null>(
    () => (enabled ? director.makeHighlight(state, level) : null),
    [enabled, state, level],
  );

  const blockedGremlin = useMemo<GremlinToken | null>(
    () => state.gremlins.find((gremlin) => gremlin.state === "waiting") ?? null,
    [state.gremlins],
  );

  const hasBlockedFriend = enabled && blockedGremlin !== null;

  return {
    enabled,
    state,
    partyTokens,
    marks: state.marks,
    gremlins: state.gremlins,
    highlight,
    selection: enabled ? state.selectedFriendId : null,
    hasBlockedFriend,
    blockedGremlin,
    selectFriend,
    recallFriend,
    handleCellTap,
    cancelSelection,
  };
}

function bundleTick(state: ScoutState, level: Level): [ScoutState, ScoutEvent[]] {
  const result = director.tickScouts(state, level);
  return [result.state, result.events];
}
