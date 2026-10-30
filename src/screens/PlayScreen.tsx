import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { floorStory, TOTAL_FLOORS } from "../content/floors";
import { nearestCellId, buildWalls, steerMove } from "../game/freeMove";
import {
  FINGER_RADIUS_PX,
  pickTapTarget,
  planTapPath,
  routeSpeed,
  samplePolyline,
  withinTapReach,
  type Polyline,
} from "../game/motionPath";
import { getCharacter, SORA } from "../content/characters";
import { bfsPath, isJunction } from "../generator/graph";
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
import { Maze, TAP_MAX_MS, type MazeCamera } from "../components/Maze";
import { PartyBar } from "../components/PartyBar";
import {
  IconBack,
  IconBulb,
  IconCheck,
  IconCollapse,
  IconExpand,
  IconLock,
  IconMap,
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

interface MotionState {
  mode: "idle" | "steer" | "route";
  /** Sora's exact position, kept between gestures so he never snaps to a cell. */
  point: { x: number; y: number };
  velocity: { x: number; y: number };
  /** The heading from the initial press, used until the thumb actually drags. */
  initial: { x: number; y: number } | null;
  route: { line: Polyline; travelled: number; speed: number } | null;
  raf: number | null;
  last: number;
  /** Distance travelled since the last footstep sound. */
  footstep: number;
  /** Actual movement speed of the last frame (after wall contact). */
  actualSpeed: number;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Sora's cruising speed in maze units per second (one corridor width / 0.12s). */
const WALK_SPEED = 9;
/** Time constants for the velocity easing. Short enough to feel direct. */
const STEER_ACCEL_TAU = 0.05;
const STEER_STOP_TAU = 0.022;
/** Route walking: how hard the auto-walker accelerates and brakes. */
const ROUTE_ACCEL = 55;
const ROUTE_BRAKE = 55;
/** Play a footstep every this many maze units travelled. */
const FOOTSTEP_DISTANCE = 2.1;
/** How far a cell must win by before the player's cell changes, to stop flicker. */
const CELL_HYSTERESIS = 0.03;

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
  /** Phones zoom in on Sora; this shows the whole floor instead. */
  const [wholeMaze, setWholeMaze] = useState(false);
  const [zoomable, setZoomable] = useState(false);
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
  const holdingRef = useRef(false);
  const lastReleaseRef = useRef(0);
  const playerTokenRef = useRef<SVGGElement | null>(null);
  const cameraRef = useRef<MazeCamera | null>(null);
  const gestureRef = useRef<{ selection: boolean; routed: boolean } | null>(null);
  /** A press outside tap reach waits for a drag or a hold before steering. */
  const holdRef = useRef<{ timer: number } | null>(null);
  const joystickRef = useRef<{
    direction: { x: number; y: number } | null;
    dragging: boolean;
    point: { x: number; y: number } | null;
    origin: { x: number; y: number } | null;
  }>({ direction: null, dragging: false, point: null, origin: null });
  const motionRef = useRef<MotionState>({
    mode: "idle",
    point: {
      x: level.cells[level.startCell].cx,
      y: level.cells[level.startCell].cy,
    },
    velocity: { x: 0, y: 0 },
    initial: null,
    route: null,
    raf: null,
    last: 0,
    footstep: 0,
    actualSpeed: 0,
  });

  const walls = useMemo(() => buildWalls(level), [level]);

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
      if (holdRef.current) {
        window.clearTimeout(holdRef.current.timer);
        holdRef.current = null;
      }
      const motion = motionRef.current;
      if (motion.raf !== null) {
        cancelAnimationFrame(motion.raf);
        motion.raf = null;
      }
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

  /**
   * Write Sora's transform straight to the DOM. Doing this outside React is
   * what keeps steering at 60fps: the maze only re-renders when he enters a new
   * cell, not on every frame.
   */
  const paintPlayer = useCallback(
    (point: { x: number; y: number }, direction: { x: number; y: number }, active: boolean) => {
      const token = playerTokenRef.current;
      if (!token) return;
      const lean =
        active && Math.hypot(direction.x, direction.y) > 0.1
          ? Math.max(-9, Math.min(9, direction.x * 9))
          : 0;
      token.style.transform = `translate(${point.x}px, ${point.y}px) rotate(${lean}deg)`;
      cameraRef.current?.follow(point);
    },
    [],
  );

  /** Flip the logical cell only when the new one is clearly closer. */
  const updatePlayerCell = useCallback(
    (point: { x: number; y: number }) => {
      const next = nearestCellId(level, point);
      if (next === playerRef.current) return;
      const current = level.cells[playerRef.current];
      const candidate = level.cells[next];
      if (!current || !candidate) return;
      const currentDistance = Math.hypot(point.x - current.cx, point.y - current.cy);
      const nextDistance = Math.hypot(point.x - candidate.cx, point.y - candidate.cy);
      if (nextDistance + CELL_HYSTERESIS > currentDistance) return;
      if (friendRescuedRef.current) setFollowerCell(playerRef.current);
      playerRef.current = next;
      setPlayerCell(next);
    },
    [level],
  );

  const finishMotion = useCallback(() => {
    const motion = motionRef.current;
    if (motion.raf !== null) {
      cancelAnimationFrame(motion.raf);
      motion.raf = null;
    }
    motion.mode = "idle";
    motion.route = null;
    motion.initial = null;
    motion.velocity.x = 0;
    motion.velocity.y = 0;
    motion.actualSpeed = 0;
    movingRef.current = false;
    setMoving(false);
    paintPlayer(motion.point, { x: 0, y: 0 }, false);
  }, [paintPlayer]);

  const tick = useCallback(
    (now: number) => {
      const motion = motionRef.current;
      motion.raf = null;
      const dt = Math.min(0.05, Math.max(0.001, (now - motion.last) / 1000));
      motion.last = now;

      if (!aliveRef.current || completedRef.current || lockOpenRef.current) {
        finishMotion();
        return;
      }

      const previous = motion.point;
      let keep = false;
      let travelDirection = { x: 0, y: 0 };
      motion.actualSpeed = 0;

      if (motion.mode === "steer") {
        const joystick = joystickRef.current;
        const heading = holdingRef.current
          ? joystick.dragging && joystick.direction
            ? joystick.direction
            : motion.initial
          : null;

        if (heading) {
          const k = 1 - Math.exp(-dt / STEER_ACCEL_TAU);
          motion.velocity.x += (heading.x * WALK_SPEED - motion.velocity.x) * k;
          motion.velocity.y += (heading.y * WALK_SPEED - motion.velocity.y) * k;
        } else {
          const k = 1 - Math.exp(-dt / STEER_STOP_TAU);
          motion.velocity.x += (0 - motion.velocity.x) * k;
          motion.velocity.y += (0 - motion.velocity.y) * k;
        }

        const speed = Math.hypot(motion.velocity.x, motion.velocity.y);
        if (speed > 1e-6) {
          const moved = steerMove(
            walls,
            motion.point,
            { x: motion.velocity.x / speed, y: motion.velocity.y / speed },
            speed * dt,
          );
          motion.point = moved.point;
          motion.actualSpeed = moved.distance / dt;
          if (moved.distance > 1e-6) {
            travelDirection = {
              x: (moved.point.x - previous.x) / moved.distance,
              y: (moved.point.y - previous.y) / moved.distance,
            };
          }
          // A wall absorbed the whole step: stop pushing into it.
          if (moved.distance < speed * dt * 0.02) {
            motion.velocity.x = 0;
            motion.velocity.y = 0;
          }
        }

        keep = holdingRef.current || speed > 0.08;
        if (!holdingRef.current && speed <= 0.08) {
          finishMotion();
          return;
        }
      } else if (motion.mode === "route" && motion.route) {
        const route = motion.route;
        const remaining = route.line.total - route.travelled;
        route.speed = routeSpeed(route.speed, remaining, dt, WALK_SPEED, ROUTE_ACCEL, ROUTE_BRAKE);
        route.travelled = Math.min(route.line.total, route.travelled + route.speed * dt);

        const sample = samplePolyline(route.line, route.travelled);
        motion.point = sample.point;
        motion.velocity.x = sample.direction.x * route.speed;
        motion.velocity.y = sample.direction.y * route.speed;
        motion.actualSpeed = route.speed;
        travelDirection = sample.direction;
        keep = true;

        if (route.travelled >= route.line.total - 1e-9) {
          const last = route.line.points[route.line.points.length - 1];
          motion.point = { x: last.x, y: last.y };
          updatePlayerCell(motion.point);
          finishMotion();
          return;
        }
      }

      motion.footstep += motion.actualSpeed * dt;
      if (motion.footstep >= FOOTSTEP_DISTANCE) {
        motion.footstep = 0;
        playStep();
      }

      updatePlayerCell(motion.point);
      paintPlayer(motion.point, travelDirection, motion.actualSpeed > 0.4);

      if (keep) motion.raf = requestAnimationFrame(tick);
      else finishMotion();
    },
    [finishMotion, paintPlayer, updatePlayerCell, walls],
  );

  const startLoop = useCallback(() => {
    const motion = motionRef.current;
    if (motion.raf !== null) cancelAnimationFrame(motion.raf);
    motion.last = performance.now();
    motion.raf = requestAnimationFrame(tick);
  }, [tick]);

  /** Start (or take over) thumb steering from Sora's exact current position. */
  const startSteer = useCallback(
    (initial: { x: number; y: number } | null) => {
      const motion = motionRef.current;
      motion.mode = "steer";
      motion.route = null;
      motion.initial = initial;
      movingRef.current = true;
      setMoving(true);
      initAudio();
      playTap();
      setHintPath([]);
      startLoop();
    },
    [startLoop],
  );

  /**
   * Tap-to-walk: a tap within TAP_REACH units of corridor walks to that exact
   * pixel, not to a cell centre. When a wall sits between Sora and the tap the
   * walk follows the corridors and still finishes on the tapped spot. Taps
   * farther than the reach are rejected, so the maze cannot be handed to the
   * walker by spamming the exit.
   */
  const startRoute = useCallback(
    (cellId: number, target: { x: number; y: number }, complain = true): boolean => {
      const motion = motionRef.current;
      const plan = planTapPath(level, walls, motion.point, target, cellId);
      if (!plan) return false;

      if (!withinTapReach(plan.line.total)) {
        if (complain) {
          playError();
          showToast("That's too far — tap nearer to Sora!");
        }
        return false;
      }

      const line = plan.line;
      initAudio();
      playTap();
      setHintPath([]);

      const startDirection = samplePolyline(line, 0).direction;
      const carriedSpeed = Math.max(
        0,
        motion.velocity.x * startDirection.x + motion.velocity.y * startDirection.y,
      );
      const speed = Math.min(carriedSpeed, WALK_SPEED);

      motion.mode = "route";
      motion.initial = null;
      motion.velocity.x = startDirection.x * speed;
      motion.velocity.y = startDirection.y * speed;
      motion.route = { line, travelled: 0, speed };
      movingRef.current = true;
      setMoving(true);
      startLoop();
      return true;
    },
    [finishMotion, level, showToast, startLoop, walls],
  );

  /**
   * Two ways to move:
   * - tap: Sora sets off the instant the finger lands, toward the corridor
   *   under the fingertip he can reach soonest (see pickTapTarget). Taps
   *   beyond one tap's reach are refused, so the maze is not solved by
   *   tapping the exit;
   * - press and drag: a joystick appears under the thumb and takes over from
   *   wherever Sora is, without his finger ever covering him.
   */
  const handleMazePointerDown = ({
    cellId,
    point,
    pixelsPerUnit,
  }: {
    cellId: number | null;
    point: { x: number; y: number };
    pixelsPerUnit: number;
  }) => {
    gestureRef.current = { selection: false, routed: false };
    if (introOpen || showComplete || lockOpenRef.current) return;

    // A selected friend is waiting for a branch: the tap picks the branch.
    if (scouting.enabled && scouting.selection) {
      gestureRef.current = { selection: true, routed: false };
      return;
    }

    const motion = motionRef.current;
    holdingRef.current = true;
    joystickRef.current = { direction: null, dragging: false, point, origin: point };

    // Taps in the padding around the board are not walk requests.
    const onBoard = cellId !== null || Math.hypot(point.x, point.y) <= level.outerRadius + 0.6;
    const target = onBoard
      ? pickTapTarget(level, motion.point, point, FINGER_RADIUS_PX / pixelsPerUnit)
      : null;
    const routed = target !== null && startRoute(target.cellId, target.point, false);
    gestureRef.current = { selection: false, routed };

    // A press that stays put past the tap window becomes the thumb stick,
    // unless it already set Sora walking.
    holdRef.current = {
      timer: window.setTimeout(() => {
        if (!holdingRef.current || joystickRef.current.dragging) return;
        holdRef.current = null;
        if (gestureRef.current?.routed) return;
        const current = motionRef.current;
        const origin = joystickRef.current.origin;
        if (!origin) {
          startSteer(null);
          return;
        }
        const ox = origin.x - current.point.x;
        const oy = origin.y - current.point.y;
        const distance = Math.hypot(ox, oy);
        startSteer(distance > 0.08 ? { x: ox / distance, y: oy / distance } : null);
      }, TAP_MAX_MS),
    };
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
    const joystick = joystickRef.current;
    if (!joystick.origin) return;
    joystick.point = point;
    joystick.dragging = dragging;
    if (!dragging) return;
    joystick.direction = direction;

    // A drag starts steering immediately, so the thumb stick stays responsive
    // even though a plain press waits for the tap window to close.
    const hold = holdRef.current;
    if (hold) {
      window.clearTimeout(hold.timer);
      holdRef.current = null;
      startSteer(direction);
    }
  };

  const handleMazePointerUp = ({
    tap,
    cellId,
    point,
  }: {
    tap: boolean;
    cellId: number | null;
    point: { x: number; y: number };
  }) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    holdingRef.current = false;
    lastReleaseRef.current = Date.now();
    joystickRef.current = { direction: null, dragging: false, point: null, origin: null };

    const hold = holdRef.current;
    if (hold) {
      window.clearTimeout(hold.timer);
      holdRef.current = null;
    }

    if (gesture?.selection) {
      if (cellId !== null) scouting.handleCellTap(cellId);
      return;
    }

    // The press already set Sora walking. A tap that could not route on the
    // press says why now, once the finger has lifted.
    if (gesture?.routed) return;
    if (tap && cellId !== null && !introOpen && !showComplete && !lockOpenRef.current) {
      startRoute(cellId, point);
    }
  };

  const handleCellClick = (cellId: number) => {
    // Browsers fire a click right after the finger lifts. The pointer handler
    // already routed that tap, so only honor programmatic/assistive clicks.
    if (holdingRef.current || Date.now() - lastReleaseRef.current < 400) return;
    if (introOpen || showComplete || lockOpenRef.current) return;

    if (scouting.enabled && scouting.selection) {
      scouting.handleCellTap(cellId);
      return;
    }

    const cell = level.cells[cellId];
    if (cell) startRoute(cellId, { x: cell.cx, y: cell.cy });
  };

  // Paint Sora at his exact start position before the first frame.
  useLayoutEffect(() => {
    paintPlayer(motionRef.current.point, { x: 0, y: 0 }, false);
  }, [paintPlayer]);


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
        {zoomable ? (
          <button
            type="button"
            className="maze-size-btn maze-view-btn"
            aria-pressed={wholeMaze}
            aria-label={wholeMaze ? "Zoom back in on Sora" : "Show the whole maze"}
            onClick={() => setWholeMaze((value) => !value)}
          >
            <IconMap size={18} />
            <span>{wholeMaze ? "Follow Sora" : "Whole maze"}</span>
          </button>
        ) : null}
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
            playerTokenRef={playerTokenRef}
            cameraRef={cameraRef}
            overview={wholeMaze || introOpen || showComplete}
            onZoomableChange={setZoomable}
            onCellTap={handleCellClick}
            onMazePointerDown={handleMazePointerDown}
            onMazePointerMove={handleMazePointerMove}
            onMazePointerUp={handleMazePointerUp}
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
                <p>Tap anywhere near Sora and he walks to that exact spot — pixel by pixel, with no cell to aim at. Farther taps do nothing, so you find the way yourself. Or press and hold anywhere on the maze: a joystick pops up under your thumb, and you slide it to steer him round bends and forks.</p>
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
