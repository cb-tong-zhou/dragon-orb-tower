import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { floorStory, TOTAL_FLOORS } from "../content/floors";
import { getCharacter, SORA } from "../content/characters";
import {
  bfsPath,
  isJunction,
  neighborToward,
  straightestOpenNeighbor,
} from "../generator/graph";
import { generateFloor } from "../generator/generate";
import type { Level } from "../generator/types";
import type { Settings } from "../game/storage";
import { FRIENDS_SCOUTING } from "../game/features";
import { activeParty } from "../game/friends";
import { useScoutDirector } from "../game/useScoutDirector";
import type { ScoutEvent } from "../game/scoutDirector";
import {
  initAudio,
  playChalk,
  playCoin,
  playError,
  playOrb,
  playPage,
  playPoof,
  playRadar,
  playRescue,
  playStep,
  playTap,
  playWin,
  speak,
  stopSpeaking,
} from "../game/audio";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { DragonCarrotGlyph } from "../components/DragonCarrot";
import { DragonCoinGlyph } from "../components/DragonCoin";
import { DragonOrb } from "../components/DragonOrb";
import { DragonRadarGlyph } from "../components/DragonRadar";
import { Maze } from "../components/Maze";
import { PartyBar } from "../components/PartyBar";
import {
  IconBack,
  IconBulb,
  IconCheck,
  IconCollapse,
  IconExpand,
  IconLock,
  IconSound,
  IconSpeaker,
  IconStar,
} from "../components/Icons";

interface Props {
  floor: number;
  runSeed: string;
  completed: number;
  settings: Settings;
  seenTutorial: boolean;
  rescuedFriends: string[];
  seenScoutTutorial: boolean;
  onBack: () => void;
  onComplete: (floor: number) => void;
  onNext: (floor: number) => void;
  onFinale: () => void;
  onTutorialSeen: () => void;
  onScoutTutorialSeen: () => void;
  onSettingsChange: (patch: Partial<Settings>) => void;
}

interface Toast {
  id: number;
  text: string;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
/** One cell per step; the maze glide uses the same value so motion never stalls. */
const WALK_STEP_MS = 120;
/** How far (in corridor steps) a grabbed Sora will follow the finger. */
const GRAB_FOLLOW_MAX_STEPS = 3;
/** Easy walking stays slower and calmer for the youngest players. */
const EASY_STEP_MS = 100;

function fireConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#FF7A1A", "#FFC93C", "#2C7DA0", "#B9E769", "#E8482D", "#FFF4DC"];
  confetti({
    particleCount: 90,
    spread: 72,
    origin: { y: 0.68 },
    colors,
    scalar: 0.9,
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 55,
      angle: 120,
      spread: 60,
      origin: { x: 0.1, y: 0.72 },
      colors,
      scalar: 0.8,
    });
    confetti({
      particleCount: 55,
      angle: 60,
      spread: 60,
      origin: { x: 0.9, y: 0.72 },
      colors,
      scalar: 0.8,
    });
  }, 180);
}

export function PlayScreen({
  floor,
  runSeed,
  completed,
  settings,
  seenTutorial,
  rescuedFriends,
  seenScoutTutorial,
  onBack,
  onComplete,
  onNext,
  onFinale,
  onTutorialSeen,
  onScoutTutorialSeen,
  onSettingsChange,
}: Props) {
  const story = floorStory(floor);
  const config = story.config;
  const friend = getCharacter(config.friendId);
  const level = useMemo<Level>(() => generateFloor(config, 0, runSeed), [config, runSeed]);

  const [playerCell, setPlayerCell] = useState(level.startCell);
  const [followerCell, setFollowerCell] = useState<number | null>(null);
  const [friendRescued, setFriendRescued] = useState(false);
  const [radarCollected, setRadarCollected] = useState(level.radarCell < 0);
  const [orbCollected, setOrbCollected] = useState(level.orbCell < 0);
  const [coinsCollected, setCoinsCollected] = useState<number[]>([]);
  const [carrotsCollected, setCarrotsCollected] = useState<number[]>([]);
  const [moving, setMoving] = useState(false);
  const [hintPath, setHintPath] = useState<number[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [introOpen, setIntroOpen] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const [bigMaze, setBigMaze] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [lockError, setLockError] = useState("");

  const playerRef = useRef(level.startCell);
  const movingRef = useRef(false);
  const friendRescuedRef = useRef(false);
  const radarCollectedRef = useRef(level.radarCell < 0);
  const orbCollectedRef = useRef(level.orbCell < 0);
  const coinsCollectedRef = useRef<number[]>([]);
  const carrotsCollectedRef = useRef<number[]>([]);
  const lockOpenRef = useRef(false);
  const completedRef = useRef(false);
  const aliveRef = useRef(true);
  const runIdRef = useRef(0);
  const holdingRef = useRef(false);
  const lastReleaseRef = useRef(0);
  const joystickRef = useRef<{
    direction: { x: number; y: number } | null;
    dragging: boolean;
    point: { x: number; y: number } | null;
  }>({ direction: null, dragging: false, point: null });

  const showToast = useCallback((text: string) => {
    setToast({ id: Date.now() + Math.random(), text });
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as { __dragonTowerLevel?: Level }).__dragonTowerLevel = level;
      console.debug("[Dragon Orb Tower] level", level.metrics);
    }
  }, [level]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Hold-to-walk ends when the finger lifts, so listen globally: the pointer
  // often leaves the tapped cell while Sora is still moving.
  useEffect(() => {
    const release = () => {
      holdingRef.current = false;
      lastReleaseRef.current = Date.now();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, []);

  useEffect(() => {
    if (hintPath.length === 0) return;
    const timer = window.setTimeout(() => setHintPath([]), 6500);
    return () => window.clearTimeout(timer);
  }, [hintPath]);

  useEffect(() => {
    if (!bigMaze) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBigMaze(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bigMaze]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      runIdRef.current += 1;
      stopSpeaking();
      confetti.reset();
    };
  }, []);

  // ---- Friends who scout ----
  const scoutingEnabled = FRIENDS_SCOUTING && settings.friendHelp !== "off";

  const partyIds = useMemo(
    () => activeParty(rescuedFriends, friendRescued ? config.friendId : undefined),
    [rescuedFriends, friendRescued, config.friendId],
  );

  const rosterIds = useMemo(() => {
    const ids = [...rescuedFriends];
    if (friendRescued && !ids.includes(config.friendId)) ids.push(config.friendId);
    return ids;
  }, [rescuedFriends, friendRescued, config.friendId]);

  const handleScoutEvent = useCallback(
    (event: ScoutEvent) => {
      const name = getCharacter(event.characterId).name;
      if (event.type === "sent") {
        playTap();
        return;
      }
      if (event.type === "mark") {
        playChalk();
        showToast(`${name} marked a dead end!`);
        if (settings.voice) speak("That one's a dead end!", true);
        return;
      }
      if (event.type === "no-mark") {
        showToast(`${name}: that way keeps going!`);
        if (settings.voice) speak("That way keeps going!", true);
        return;
      }
      if (event.type === "blocked") {
        playError();
        showToast(`${name} is stuck behind a grumblin! Walk over and shoo it!`);
        if (settings.voice) speak(`${name} is blocked. Go help!`, true);
        return;
      }
      if (event.type === "freed") {
        playPoof();
        showToast(`The grumblin ran away! ${name} says thanks!`);
        if (settings.voice) speak("Phew! Thanks!", true);
        return;
      }
    },
    [showToast, settings.voice],
  );

  const scouting = useScoutDirector({
    enabled: scoutingEnabled,
    level,
    partyIds,
    playerCell,
    playerMoving: moving,
    helpMode: settings.friendHelp,
    modalsOpen: introOpen || lockOpen || showComplete,
    onEvent: handleScoutEvent,
  });

  const handlePartySelect = useCallback(
    (characterId: string) => {
      initAudio();
      playTap();
      const name = getCharacter(characterId).name;

      if (scouting.blockedGremlin?.blockedFriendId === characterId) {
        const path = bfsPath(level, playerRef.current, scouting.blockedGremlin.cellId);
        setHintPath(path);
        showToast(`${name} needs help! Follow the dots to shoo the grumblin.`);
        return;
      }

      const member = scouting.state.party.find((m) => m.characterId === characterId);
      if (member && (member.mode === "scout" || member.mode === "return")) {
        scouting.recallFriend(characterId);
        showToast(`${name} is coming back!`);
        return;
      }

      if (settings.friendHelp === "off") {
        showToast("Friend help is switched off in Settings.");
        return;
      }

      if (!member || !member.hasCharge) {
        showToast(`${name} already checked a path this floor.`);
        return;
      }

      if (!isJunction(level, playerRef.current)) {
        scouting.selectFriend(characterId);
        showToast(`Walk to a fork to send ${name} down a path.`);
        return;
      }

      const selection = scouting.selectFriend(characterId);
      showToast(selection ? `Tap a glowing path for ${name}!` : `${name} stays with you.`);
    },
    [scouting, level, settings.friendHelp, showToast],
  );

  useEffect(() => {
    if (!scouting.selection) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") scouting.cancelSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scouting.selection, scouting.cancelSelection]);

  const closeLock = useCallback(() => {
    lockOpenRef.current = false;
    setLockOpen(false);
    setLockError("");
  }, []);

  const finishFloor = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    lockOpenRef.current = false;
    movingRef.current = false;
    setMoving(false);
    setLockOpen(false);
    setShowComplete(true);
    onComplete(floor);
    playWin();
    fireConfetti();
  }, [floor, onComplete]);

  const allCoins = level.coinCells.length > 0 && coinsCollected.length === level.coinCells.length;
  const allCarrots = level.carrotCells.length > 0 && carrotsCollected.length === level.carrotCells.length;
  const scoutBlocked = scouting.enabled && scouting.hasBlockedFriend;
  const doorReady =
    friendRescued &&
    (level.mission === "rescue"
      ? orbCollected
      : level.mission === "coins"
        ? allCoins
        : level.mission === "code"
          ? allCarrots
          : radarCollected && orbCollected) &&
    !scoutBlocked;

  useEffect(() => {
    if (introOpen || showComplete || lockOpenRef.current) return;
    const cellId = playerCell;

    if (cellId === level.friendCell && !friendRescuedRef.current) {
      friendRescuedRef.current = true;
      setFriendRescued(true);
      setFollowerCell(cellId);
      playRescue();
      const scoutTutorialDue = scoutingEnabled && !seenScoutTutorial;
      showToast(
        scoutTutorialDue
          ? `${friend.name} is safe! Tap ${friend.name} below, then tap a glowing path.`
          : `${friend.name} is safe!`,
      );
      if (scoutTutorialDue) onScoutTutorialSeen();
      if (settings.voice) speak(friend.greeting, true);
    }

    if (cellId === level.radarCell && !radarCollectedRef.current) {
      radarCollectedRef.current = true;
      setRadarCollected(true);
      playRadar();
      showToast("Dragon Radar found! The orb is now on the map.");
    }

    if (
      level.orbCell >= 0 &&
      cellId === level.orbCell &&
      !orbCollectedRef.current &&
      radarCollectedRef.current
    ) {
      orbCollectedRef.current = true;
      setOrbCollected(true);
      playOrb();
      showToast(`${level.orbStars}-star Dragon Orb found!`);
    }

    if (level.coinCells.includes(cellId) && !coinsCollectedRef.current.includes(cellId)) {
      const nextCoins = [...coinsCollectedRef.current, cellId];
      coinsCollectedRef.current = nextCoins;
      setCoinsCollected(nextCoins);
      playCoin();
      showToast(
        nextCoins.length === level.coinCells.length
          ? "All Dragon Coins found! Head to the door."
          : level.mission === "coins"
            ? "Dragon Coin found! Keep exploring."
            : `Dragon Coin ${nextCoins.length} of ${level.coinCells.length}!`,
      );
    }

    if (level.carrotCells.includes(cellId) && !carrotsCollectedRef.current.includes(cellId)) {
      const nextCarrots = [...carrotsCollectedRef.current, cellId];
      carrotsCollectedRef.current = nextCarrots;
      setCarrotsCollected(nextCarrots);
      playCoin();
      const number = level.carrotNumbers[level.carrotCells.indexOf(cellId)];
      showToast(
        nextCarrots.length === level.carrotCells.length
          ? "All numbered carrots found! Head to the door."
          : `Carrot ${nextCarrots.length} of ${level.carrotCells.length}: number ${number}`,
      );
    }

    if (cellId === level.exitCell) {
      if (scoutBlocked) {
        playError();
        showToast("A friend needs help first! Shoo the grumblin to open the door.");
      } else if (!doorReady) {
        playError();
        const missing = !friendRescuedRef.current
          ? `Find ${friend.name} first`
          : level.mission === "rescue"
            ? "Reach the center Dragon Orb first"
            : level.mission === "coins"
              ? "Collect every Dragon Coin first"
              : level.mission === "code"
                ? "Collect all three numbered carrots first"
                : !radarCollectedRef.current
                  ? "Find the Dragon Radar first"
                  : `Find the ${level.orbStars}-star orb first`;
        showToast(`The door is sealed. ${missing}!`);
      } else if (level.mission === "coins" || level.mission === "code") {
        lockOpenRef.current = true;
        setLockError("");
        setLockOpen(true);
      } else {
        finishFloor();
      }
    }
  }, [
    playerCell,
    introOpen,
    showComplete,
    level,
    friend,
    settings.voice,
    showToast,
    finishFloor,
    doorReady,
    scoutBlocked,
    scoutingEnabled,
    seenScoutTutorial,
    onScoutTutorialSeen,
  ]);

  const missionBrief =
    level.mission === "rescue"
      ? `Rescue ${friend.name} and reach the ${level.orbStars}-star Dragon Orb in the centre.`
      : level.mission === "coins"
        ? `Rescue ${friend.name}, collect every Dragon Coin, then answer the counting question at the door.`
        : level.mission === "code"
          ? `Rescue ${friend.name}, collect the three numbered carrots, then crack the A equals 1 code at the door.`
          : `Find the Dragon Radar to reveal the ${level.orbStars}-star Dragon Orb, rescue ${friend.name}, and reach the door.`;

  const missionFooter =
    level.mission === "rescue"
      ? `Rescue ${friend.name}, then reach the ${level.orbStars}-star orb in the centre.`
      : level.mission === "coins"
        ? `Rescue ${friend.name}, collect every Dragon Coin, then count them at the door.`
        : level.mission === "code"
          ? `Rescue ${friend.name}, collect all three numbered carrots, then crack the A = 1 code at the door.`
          : `Rescue ${friend.name}, find the Dragon Radar, then use it to find the ${level.orbStars}-star orb.`;

  const startFloor = () => {
    setIntroOpen(false);
    onTutorialSeen();
    initAudio();
    playPage();
    if (settings.voice) speak(`${story.intro} ${missionBrief}`, true);
  };

  const readMission = () => {
    initAudio();
    playPage();
    const orbClue =
      level.mission === "radar" && !radarCollected
        ? "The orb stays hidden until you find the Dragon Radar."
        : story.orbHint;
    speak(`${story.intro} ${missionBrief} ${orbClue}`, true);
  };

  const nearestUncollected = (cellIds: number[], collected: number[]): number => {
    const remaining = cellIds.filter((id) => !collected.includes(id));
    if (remaining.length === 0) return level.exitCell;
    return remaining.sort(
      (a, b) =>
        bfsPath(level, playerRef.current, a).length -
        bfsPath(level, playerRef.current, b).length,
    )[0];
  };

  const handleHint = () => {
    if (introOpen || showComplete || lockOpenRef.current || movingRef.current) return;
    initAudio();
    playPage();

    // A blocked friend always comes first: the hint points to the grumblin.
    if (scouting.enabled && scouting.blockedGremlin) {
      const gremlinPath = bfsPath(level, playerRef.current, scouting.blockedGremlin.cellId);
      setHintPath(gremlinPath);
      showToast(
        gremlinPath.length <= 1
          ? "You are right there! Shoo the grumblin!"
          : "Follow the dots to shoo the grumblin!",
      );
      return;
    }

    const target = !friendRescuedRef.current
      ? level.friendCell
      : level.mission === "rescue"
        ? !orbCollectedRef.current
          ? level.orbCell
          : level.exitCell
        : level.mission === "coins"
          ? allCoins
            ? level.exitCell
            : nearestUncollected(level.coinCells, coinsCollectedRef.current)
          : level.mission === "code"
            ? allCarrots
              ? level.exitCell
              : nearestUncollected(level.carrotCells, carrotsCollectedRef.current)
            : !radarCollectedRef.current
              ? level.radarCell
              : !orbCollectedRef.current
                ? level.orbCell
                : level.exitCell;
    const path = bfsPath(level, playerRef.current, target);
    setHintPath(path);
    if (path.length <= 1) {
      showToast("You are already there!");
      return;
    }
    const label = !friendRescuedRef.current
      ? friend.name
      : level.mission === "rescue"
        ? !orbCollectedRef.current
          ? "the centre orb"
          : "the open door"
        : level.mission === "coins"
          ? allCoins
            ? "the counting door"
            : "the next Dragon Coin"
          : level.mission === "code"
            ? allCarrots
              ? "the code door"
              : "the next numbered carrot"
            : !radarCollectedRef.current
              ? "the Dragon Radar"
              : !orbCollectedRef.current
                ? `the ${level.orbStars}-star orb`
                : "the open door";
    showToast(`Follow the dots to ${label}.`);
  };

  const targetFrom = (cellId: number, direction: { x: number; y: number }) => {
    const cell = level.cells[cellId];
    return { x: cell.cx + direction.x, y: cell.cy + direction.y };
  };

  /**
   * Two ways to move:
   * - press Sora himself and drag: Sora is grabbed and follows the finger,
   *   walking the corridors to stay under it;
   * - press anywhere else: he walks toward the thumb and keeps going while the
   *   finger is down, steering like a joystick when the thumb slides.
   */
  const handleMazePointerDown = ({
    direction,
    cellId,
    onPlayer,
  }: {
    direction: { x: number; y: number } | null;
    cellId: number | null;
    onPlayer: boolean;
  }) => {
    holdingRef.current = true;
    joystickRef.current = { direction: null, dragging: false, point: null };

    if (introOpen || showComplete || lockOpenRef.current || movingRef.current) return;

    // A selected friend is waiting for a branch: the press picks the branch.
    if (scouting.enabled && scouting.selection) {
      if (cellId !== null) scouting.handleCellTap(cellId);
      return;
    }

    if (onPlayer) {
      startWalk([], true, undefined, true);
      return;
    }

    // Easy walking is the opt-in that walks a whole route in one press.
    if (settings.easyWalk) {
      if (cellId === null || cellId === playerRef.current) return;
      const route = bfsPath(level, playerRef.current, cellId).slice(1);
      if (route.length > 0) startWalk(route, false);
      return;
    }

    if (!direction) return;
    const first = neighborToward(
      level,
      playerRef.current,
      targetFrom(playerRef.current, direction),
    );
    if (first === null) return;
    startWalk([first], true, direction);
  };

  const handleMazePointerMove = ({
    direction,
    dragging,
    point,
  }: {
    direction: { x: number; y: number } | null;
    dragging: boolean;
    point: { x: number; y: number };
  }) => {
    joystickRef.current = { direction, dragging, point };
  };

  const handleMazePointerRelease = () => {
    holdingRef.current = false;
    lastReleaseRef.current = Date.now();
    joystickRef.current = { direction: null, dragging: false, point: null };
  };

  const handleCellClick = (cellId: number) => {
    // Browsers fire a click right after the finger lifts. Playing it would add
    // one more step every time a drag ends, so only honor clicks that arrive
    // without a pointer release (programmatic activation, assistive tech).
    if (holdingRef.current || Date.now() - lastReleaseRef.current < 400) return;
    if (introOpen || showComplete || lockOpenRef.current || movingRef.current) return;
    if (cellId === playerRef.current) return;

    if (scouting.enabled && scouting.selection) {
      scouting.handleCellTap(cellId);
      return;
    }

    if (settings.easyWalk) {
      const route = bfsPath(level, playerRef.current, cellId).slice(1);
      if (route.length > 0) startWalk(route, false);
      return;
    }

    const target = level.cells[cellId];
    const first = neighborToward(level, playerRef.current, { x: target.cx, y: target.cy });
    if (first === null) return;
    startWalk([first], false);
  };

  /**
   * Advance Sora along `route` immediately (no initial dead time) and keep the
   * avatar gliding from cell to cell: when `followHeld` is set, each finished
   * step looks for the straightest continuation and takes it while the finger
   * is still down. The step interval matches the token's CSS glide so the
   * motion never stops and starts between cells.
   */
  /** The cell whose centre is closest to a point in maze coordinates. */
  const nearestCell = (point: { x: number; y: number }): number | null => {
    let best: number | null = null;
    let bestDistance = Infinity;
    for (const cell of level.cells) {
      const distance = Math.hypot(cell.cx - point.x, cell.cy - point.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = cell.id;
      }
    }
    return best;
  };

  const startWalk = (
    route: number[],
    followHeld: boolean,
    direction?: { x: number; y: number },
    drag = false,
  ) => {
    initAudio();
    playTap();
    setHintPath([]);
    setToast(null);
    setMoving(true);
    movingRef.current = true;

    const runId = ++runIdRef.current;
    const cells = level.cells;
    const duration = settings.easyWalk ? EASY_STEP_MS : WALK_STEP_MS;
    let previous = playerRef.current;
    let cameFrom: number | null = null;
    let heading = { x: 0, y: 0 };
    // The thumb keeps a compass heading: the corridor is followed first, and
    // where it turns away this heading decides which fork to take.
    let compass = drag ? null : (direction ?? null);

    const advance = (next: number) => {
      const fromCell = cells[previous];
      const toCell = cells[next];
      const dx = toCell.cx - fromCell.cx;
      const dy = toCell.cy - fromCell.cy;
      const length = Math.hypot(dx, dy);
      if (length > 1e-6) heading = { x: dx / length, y: dy / length };
      if (friendRescuedRef.current) setFollowerCell(previous);
      playerRef.current = next;
      setPlayerCell(next);
      playStep();
      cameFrom = previous;
      previous = next;
    };

    const stopped = () =>
      !aliveRef.current ||
      runIdRef.current !== runId ||
      completedRef.current ||
      lockOpenRef.current;

    /** The next cell in the direction the thumb is pulling. */
    const stepFromThumb = (): number | null => {
      const joystick = joystickRef.current;
      if (drag) {
        // Grabbed Sora: walk the shortest corridor route toward the cell under
        // the finger, so he goes where the finger is instead of drifting at forks.
        if (!joystick.point) return null;
        const under = nearestCell(joystick.point);
        if (under === null || under === previous) return null;
        const route = bfsPath(level, previous, under);
        // Only follow a finger that stays close along the corridors; a far
        // finger (across a wall) would walk Sora on a long detour, so he waits.
        if (route.length < 2 || route.length - 1 > GRAB_FOLLOW_MAX_STEPS) return null;
        return route[1];
      }
      if (joystick.dragging && joystick.direction) compass = joystick.direction;
      if (!compass) return null;
      // Follow the corridor first; when it turns sharply, keep walking the way
      // the thumb points instead of stalling at the fork.
      const straight = straightestOpenNeighbor(level, previous, heading, { avoid: cameFrom });
      if (straight !== null) return straight;
      return neighborToward(level, previous, targetFrom(previous, compass), cameFrom);
    };

    const run = async () => {
      if (followHeld) {
        // A grab waits for the finger to pull away before the first step; a
        // directional press steps immediately.
        if (!drag) {
          const first = route[0];
          if (first !== undefined) advance(first);
        }
        while (holdingRef.current) {
          await wait(duration);
          if (stopped() || !holdingRef.current) break;
          // A dead end pauses the walk instead of ending it, so dragging on
          // still steers Sora out without lifting the finger.
          const next = stepFromThumb();
          if (next === null) continue;
          advance(next);
        }
      } else {
        for (let index = 0; index < route.length; index++) {
          if (stopped()) break;
          advance(route[index]);
          // Wait only between steps: the last step must clear the walk flag
          // immediately so a quick follow-up tap is not swallowed.
          if (index < route.length - 1) await wait(duration);
        }
      }

      // Always clear the walk flag for this run, even when the walk ended on
      // the door or the exit, or Sora would stay stuck in "moving".
      if (aliveRef.current && runIdRef.current === runId) {
        movingRef.current = false;
        setMoving(false);
      }
    };

    void run();
  };

  const answerCount = (value: number) => {
    initAudio();
    playTap();
    if (value === level.coinCells.length) {
      closeLock();
      finishFloor();
    } else {
      playError();
      setLockError("Not quite. Count the Dragon Coins again!");
    }
  };

  const answerCode = (value: string) => {
    initAudio();
    playTap();
    if (value === level.codeWord) {
      closeLock();
      finishFloor();
    } else {
      playError();
      setLockError("Not quite. Check the numbers with A = 1 and try again!");
    }
  };

  const toggleSound = () => {
    initAudio();
    onSettingsChange({ sound: !settings.sound });
    playPage();
  };

  const nextFloor = () => {
    if (floor >= TOTAL_FLOORS) {
      onFinale();
    } else {
      onNext(floor + 1);
    }
  };

  const orbsFound = Math.max(completed, floor);
  const completeTitle =
    floor === TOTAL_FLOORS
      ? "The seventh orb is yours!"
      : level.mission === "coins"
        ? "Coins counted!"
        : level.mission === "code"
          ? "Code cracked!"
          : level.mission === "rescue"
            ? "Center star found!"
            : "Dragon Orb found!";

  return (
    <div className={`screen play-screen ${bigMaze ? "is-big-maze" : ""}`}>
      <header className="play-top">
        <button className="icon-btn" aria-label="Back to the tower" onClick={onBack}>
          <IconBack />
        </button>
        <div className="play-heading">
          <span className="eyebrow">Floor {floor} of {TOTAL_FLOORS}</span>
          <h1>{config.title}</h1>
        </div>
        <button
          className="icon-btn"
          aria-label={settings.sound ? "Mute sound" : "Turn sound on"}
          onClick={toggleSound}
        >
          <IconSound muted={!settings.sound} />
        </button>
      </header>

      <div className="mission-bar">
        <div className={`mission-chip ${friendRescued ? "is-done" : ""}`} data-mission="friend">
          <CharacterAvatar character={friend} size={36} />
          <span>{friend.name}</span>
          {friendRescued ? <IconCheck size={16} /> : null}
        </div>

        {level.mission === "radar" ? (
          <div className={`mission-chip ${radarCollected ? "is-done" : ""}`} data-mission="radar">
            <DragonRadarGlyph size={30} active={!radarCollected} />
            <span>Radar</span>
            {radarCollected ? <IconCheck size={16} /> : null}
          </div>
        ) : null}

        {level.orbCell >= 0 ? (
          <div
            className={`mission-chip ${orbCollected ? "is-done" : ""} ${level.mission === "radar" && !radarCollected ? "is-locked" : ""}`}
            data-mission="orb"
          >
            <DragonOrb stars={level.orbStars} size={34} glow={false} />
            <span>{level.mission === "rescue" ? "Center Orb" : `${level.orbStars}-Star Orb`}</span>
            {orbCollected ? <IconCheck size={16} /> : null}
          </div>
        ) : null}

        {level.coinCells.length > 0 ? (
          <div
            className={`mission-chip coin-chip ${allCoins ? "is-done" : ""}`}
            data-mission="coins"
            aria-label={
              level.mission === "coins"
                ? `Dragon Coins collected: ${coinsCollected.length}`
                : `Optional Dragon Coins: ${coinsCollected.length} of ${level.coinCells.length} collected`
            }
          >
            <DragonCoinGlyph size={27} />
            <span>{level.mission === "coins" ? "Coins" : `${coinsCollected.length}/${level.coinCells.length}`}</span>
            {level.mission === "coins" && allCoins ? <IconCheck size={16} /> : null}
          </div>
        ) : null}

        {level.mission === "code" ? (
          <div className={`mission-chip carrot-chip ${allCarrots ? "is-done" : ""}`} data-mission="carrots">
            <DragonCarrotGlyph size={28} />
            <span>{carrotsCollected.length}/{level.carrotCells.length}</span>
            {allCarrots ? <IconCheck size={16} /> : null}
          </div>
        ) : null}

        <div className={`mission-chip door-chip ${doorReady ? "is-done" : ""}`} data-mission="door">
          {doorReady ? <IconStar size={18} /> : <IconLock size={18} />}
          <span>{doorReady ? "Door open" : "Door sealed"}</span>
        </div>
        <button className="hint-btn" onClick={handleHint}>
          <IconBulb size={20} />
          <span>Hint</span>
        </button>
      </div>

      <main className="maze-stage">
        <button
          type="button"
          className="maze-size-btn"
          aria-pressed={bigMaze}
          aria-label={bigMaze ? "Exit big maze" : "Make the maze fill the screen"}
          onClick={() => setBigMaze((value) => !value)}
        >
          {bigMaze ? <IconCollapse size={18} /> : <IconExpand size={18} />}
          <span>{bigMaze ? "Exit big maze" : "Big maze"}</span>
        </button>
        <div className="maze-board">
          <Maze
            level={level}
            playerCell={playerCell}
            followerCell={scouting.enabled ? null : followerCell}
            friend={friend}
            player={SORA}
            accent={story.accent}
            friendRescued={friendRescued}
            radarCollected={radarCollected}
            orbCollected={orbCollected}
            coinsCollected={coinsCollected}
            carrotsCollected={carrotsCollected}
            doorReady={doorReady}
            hintPath={hintPath}
            moving={moving}
            showMoves={!moving && !introOpen && !showComplete && !lockOpen}
            glideMs={settings.easyWalk ? EASY_STEP_MS : WALK_STEP_MS}
            onCellTap={handleCellClick}
            onMazePointerDown={handleMazePointerDown}
            onMazePointerMove={handleMazePointerMove}
            onMazePointerRelease={handleMazePointerRelease}
            party={scouting.enabled ? scouting.partyTokens : null}
            scoutMarks={scouting.enabled ? scouting.marks : null}
            scoutHighlight={scouting.enabled ? scouting.highlight : null}
            gremlins={scouting.enabled ? scouting.gremlins : null}
          />
        </div>
        {toast ? (
          <div className="toast" role="status" aria-live="polite" key={toast.id}>
            {toast.text}
          </div>
        ) : null}
      </main>

      {FRIENDS_SCOUTING && rosterIds.length > 0 ? (
        <PartyBar
          roster={rosterIds}
          party={scouting.state.party}
          activeIds={partyIds}
          selectedFriendId={scouting.selection}
          helpMode={settings.friendHelp}
          onSelect={handlePartySelect}
        />
      ) : null}

      <footer className="play-footer">
        <p>{missionFooter}</p>
        <button className="read-btn" onClick={readMission}>
          <IconSpeaker size={18} />
          Read aloud
        </button>
      </footer>

      {introOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card intro-card" role="dialog" aria-modal="true" aria-labelledby="floor-intro-title">
            <span className="eyebrow">Floor {floor} of {TOTAL_FLOORS}</span>
            <h2 id="floor-intro-title">{config.title}</h2>
            <div className="intro-friend">
              <CharacterAvatar character={friend} size={112} aura />
              <div>
                <span className="intro-name">{friend.name}</span>
                <span className="intro-role">{friend.role}</span>
              </div>
            </div>
            <p className="intro-copy">{story.intro}</p>
            <div className="mission-list">
              <div className="mission-list-item">
                <CharacterAvatar character={friend} size={28} />
                <span>Rescue {friend.name}</span>
              </div>
              {level.mission === "rescue" ? (
                <>
                  <div className="mission-list-item">
                    <DragonOrb stars={level.orbStars} size={28} glow={false} />
                    <span>Reach the {level.orbStars}-star orb in the center</span>
                  </div>
                  <div className="mission-list-item">
                    <IconLock size={20} />
                    <span>Open the door together</span>
                  </div>
                </>
              ) : null}
              {level.mission === "coins" ? (
                <>
                  <div className="mission-list-item">
                    <DragonCoinGlyph size={26} />
                    <span>Collect every Dragon Coin</span>
                  </div>
                  <div className="mission-list-item">
                    <IconLock size={20} />
                    <span>Count the coins at the door</span>
                  </div>
                </>
              ) : null}
              {level.mission === "code" ? (
                <>
                  <div className="mission-list-item">
                    <DragonCarrotGlyph size={26} />
                    <span>Collect the three numbered carrots</span>
                  </div>
                  <div className="mission-list-item">
                    <span className="mini-code">A = 1</span>
                    <span>Crack the word code at the door</span>
                  </div>
                </>
              ) : null}
              {level.mission === "radar" ? (
                <>
                  <div className="mission-list-item">
                    <DragonRadarGlyph size={28} active />
                    <span>Find the Dragon Radar</span>
                  </div>
                  <div className="mission-list-item">
                    <DragonOrb stars={level.orbStars} size={28} glow={false} />
                    <span>Use the radar to find the {level.orbStars}-star Dragon Orb</span>
                  </div>
                  <div className="mission-list-item">
                    <DragonCoinGlyph size={26} />
                    <span>Collect 3 Dragon Coins (bonus)</span>
                  </div>
                  <div className="mission-list-item">
                    <IconLock size={20} />
                    <span>Open the sealed door</span>
                  </div>
                </>
              ) : null}
            </div>
            {floor === 1 && !seenTutorial ? (
              <div className="tutorial-box">
                <strong>How to play</strong>
                <p>Press anywhere on the maze and Sora walks that way; keep your finger down to keep walking, and slide it to steer him round bends and forks. Or put your finger on Sora himself and drag him along the corridor.</p>
                <p>
                  Rescue your friend, reach the center star, then head for the door. This first
                  floor does not need the Dragon Radar.
                </p>
              </div>
            ) : null}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={readMission}>
                <IconSpeaker size={18} />
                Read
              </button>
              <button className="btn btn-primary" onClick={startFloor} autoFocus>
                Let&apos;s go!
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {lockOpen && !showComplete ? (
        <div className="modal-backdrop lock-backdrop">
          <div
            className="modal-card lock-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="door-lock-title"
          >
            {level.mission === "coins" ? (
              <>
                <span className="eyebrow">Counting door</span>
                <h2 id="door-lock-title">How many Dragon Coins did you collect?</h2>
                <div className="count-grid">
                  {level.coinChoices.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="count-choice"
                      data-count-choice={value}
                      onClick={() => answerCount(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">Carrot code</span>
                <h2 id="door-lock-title">Crack the word!</h2>
                <p className="lock-help">Use A = 1, B = 2, C = 3 ... to turn the numbers into letters.</p>
                <div className="code-numbers" aria-label="Carrot numbers">
                  {level.carrotNumbers.map((value, index) => (
                    <span key={`${value}-${index}`}>{value}</span>
                  ))}
                </div>
                <div className="code-alphabet" aria-hidden="true">
                  {ALPHABET.map((letter, index) => (
                    <span key={letter}>
                      <b>{letter}</b>
                      <small>{index + 1}</small>
                    </span>
                  ))}
                </div>
                <div className="code-choices">
                  {level.codeChoices.map((word) => (
                    <button
                      key={word}
                      type="button"
                      className="code-choice"
                      data-code-choice={word}
                      onClick={() => answerCode(word)}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </>
            )}
            {lockError ? (
              <p className="lock-error" role="alert">
                {lockError}
              </p>
            ) : null}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closeLock}>
                Back to maze
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showComplete ? (
        <div className="modal-backdrop complete-backdrop">
          <div className="modal-card complete-card" role="dialog" aria-modal="true" aria-labelledby="floor-complete-title">
            <span className="eyebrow">Floor {floor} clear!</span>
            <h2 id="floor-complete-title">{completeTitle}</h2>
            <div className="complete-row">
              <DragonOrb stars={level.orbStars} size={120} />
              <CharacterAvatar character={friend} size={120} aura />
            </div>
            <p className="complete-copy">
              {friend.name} is safe. {friend.greeting}
            </p>
            <div className="orb-total">
              <IconStar size={18} />
              <span>{orbsFound} of {TOTAL_FLOORS} Dragon Orbs</span>
            </div>
            <div className="complete-bonus">
              {level.mission === "radar" ? (
                <span>
                  <DragonRadarGlyph size={22} />
                  Radar found
                </span>
              ) : null}
              {level.mission === "rescue" ? (
                <span>
                  <DragonOrb stars={level.orbStars} size={20} />
                  Center star found
                </span>
              ) : null}
              {level.mission === "coins" ? (
                <span>
                  <DragonCoinGlyph size={20} />
                  You counted {level.coinCells.length} Dragon Coins
                </span>
              ) : null}
              {level.mission === "code" ? (
                <span>
                  <DragonCarrotGlyph size={20} />
                  Code cracked: {level.codeWord}
                </span>
              ) : null}
              {level.coinCells.length > 0 && level.mission !== "coins" ? (
                <span>
                  <DragonCoinGlyph size={20} />
                  {coinsCollected.length}/{level.coinCells.length} bonus coins
                </span>
              ) : null}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onBack}>
                Tower map
              </button>
              <button className="btn btn-primary" onClick={nextFloor} autoFocus>
                {floor >= TOTAL_FLOORS ? "Meet the dragon!" : "Next floor"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
