import { useEffect, useState } from "react";
import { FLOORS, TOTAL_FLOORS } from "./content/floors";
import { HowToPlayModal } from "./components/HowToPlayModal";
import { SettingsModal } from "./components/SettingsModal";
import { FinaleScreen } from "./screens/FinaleScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { TowerScreen } from "./screens/TowerScreen";
import { setSoundEnabled } from "./game/audio";
import { addRescuedFriend } from "./game/friends";
import {
  DEFAULT_SAVE,
  loadSave,
  saveProgress,
  type SaveData,
  type Settings,
} from "./game/storage";

type Screen = "home" | "tower" | "play" | "finale";

function makeRunSeed(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>("home");
  const [currentFloor, setCurrentFloor] = useState(1);
  const [playRun, setPlayRun] = useState(() => makeRunSeed());
  const [howToOpen, setHowToOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveProgress(save);
    setSoundEnabled(save.settings.sound);
  }, [save]);

  const updateSettings = (patch: Partial<Settings>) => {
    setSave((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  };

  const enterTower = () => setScreen("tower");

  const playFloor = (floor: number) => {
    if (floor > save.completed + 1 && floor > save.completed) return;
    setPlayRun(makeRunSeed());
    setCurrentFloor(floor);
    setScreen("play");
  };

  const completeFloor = (floor: number) => {
    setSave((current) => ({
      ...current,
      completed: Math.max(current.completed, Math.min(TOTAL_FLOORS, floor)),
      rescuedFriends: addRescuedFriend(
        current.rescuedFriends,
        FLOORS[floor - 1].config.friendId,
      ),
    }));
  };

  const goToNextFloor = (floor: number) => {
    const nextFloor = Math.min(TOTAL_FLOORS, Math.max(1, floor));
    setPlayRun(makeRunSeed());
    setCurrentFloor(nextFloor);
    setScreen("play");
  };

  const openFinale = () => {
    if (save.completed >= TOTAL_FLOORS) {
      setScreen("finale");
    } else {
      setScreen("tower");
    }
  };

  const resetProgress = () => {
    setSave((current) => ({
      ...DEFAULT_SAVE,
      settings: current.settings,
      seenTutorial: false,
    }));
    setPlayRun(makeRunSeed());
    setCurrentFloor(1);
    setScreen("home");
  };

  const markTutorialSeen = () => {
    setSave((current) => (current.seenTutorial ? current : { ...current, seenTutorial: true }));
  };

  const markScoutTutorialSeen = () => {
    setSave((current) =>
      current.seenScoutTutorial ? current : { ...current, seenScoutTutorial: true },
    );
  };

  return (
    <div className="app-shell">
      {screen === "home" ? (
        <HomeScreen
          completed={save.completed}
          settings={save.settings}
          onEnterTower={enterTower}
          onFinale={openFinale}
          onHowTo={() => setHowToOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onToggleSound={() => updateSettings({ sound: !save.settings.sound })}
        />
      ) : null}

      {screen === "tower" ? (
        <TowerScreen
          completed={save.completed}
          settings={save.settings}
          onBack={() => setScreen("home")}
          onPlayFloor={playFloor}
          onFinale={openFinale}
          onHowTo={() => setHowToOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onToggleSound={() => updateSettings({ sound: !save.settings.sound })}
        />
      ) : null}

      {screen === "play" ? (
        <PlayScreen
          key={`play-${currentFloor}-${playRun}`}
          floor={currentFloor}
          runSeed={playRun}
          completed={save.completed}
          settings={save.settings}
          seenTutorial={save.seenTutorial}
          rescuedFriends={save.rescuedFriends}
          seenScoutTutorial={save.seenScoutTutorial}
          onBack={() => setScreen("tower")}
          onComplete={completeFloor}
          onNext={goToNextFloor}
          onFinale={openFinale}
          onTutorialSeen={markTutorialSeen}
          onScoutTutorialSeen={markScoutTutorialSeen}
          onSettingsChange={updateSettings}
        />
      ) : null}

      {screen === "finale" ? (
        <FinaleScreen onTower={() => setScreen("tower")} onRestart={resetProgress} />
      ) : null}

      {howToOpen ? <HowToPlayModal onClose={() => setHowToOpen(false)} /> : null}
      {settingsOpen ? (
        <SettingsModal
          settings={save.settings}
          completed={save.completed}
          onChange={updateSettings}
          onReset={resetProgress}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </div>
  );
}
