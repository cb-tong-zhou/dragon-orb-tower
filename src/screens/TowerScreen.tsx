import { FLOORS, TOTAL_FLOORS } from "../content/floors";
import { getCharacter } from "../content/characters";
import type { Settings } from "../game/storage";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { DragonOrb } from "../components/DragonOrb";
import { DragonArt } from "../components/DragonArt";
import {
  IconBack,
  IconCheck,
  IconGear,
  IconHelp,
  IconLock,
  IconSound,
  IconStar,
} from "../components/Icons";

interface Props {
  completed: number;
  settings: Settings;
  onBack: () => void;
  onPlayFloor: (floor: number) => void;
  onFinale: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  onToggleSound: () => void;
}

export function TowerScreen({
  completed,
  settings,
  onBack,
  onPlayFloor,
  onFinale,
  onHowTo,
  onSettings,
  onToggleSound,
}: Props) {
  const allCleared = completed >= TOTAL_FLOORS;

  return (
    <div className="screen tower-screen">
      <div className="sky-decor tower-sky" aria-hidden="true">
        <div className="sun-disc sun-small" />
        <div className="cloud cloud-a" />
        <div className="cloud cloud-c" />
        <div className="halftone-field" />
      </div>

      <header className="tower-top">
        <button className="icon-btn" aria-label="Back to home" onClick={onBack}>
          <IconBack />
        </button>
        <div className="tower-heading">
          <span className="eyebrow">The tower</span>
          <h1>Choose a floor</h1>
        </div>
        <div className="tower-top-actions">
          <button
            className="icon-btn"
            aria-label={settings.sound ? "Mute sound" : "Turn sound on"}
            onClick={onToggleSound}
          >
            <IconSound muted={!settings.sound} />
          </button>
          <button className="icon-btn help-btn" aria-label="How to play" onClick={onHowTo}>
            <IconHelp />
          </button>
          <button className="icon-btn" aria-label="Settings" onClick={onSettings}>
            <IconGear />
          </button>
        </div>
      </header>

      <div className="orb-progress" aria-label={`${completed} of ${TOTAL_FLOORS} Dragon Orbs found`}>
        {Array.from({ length: TOTAL_FLOORS }, (_, index) => {
          const found = index < completed;
          return (
            <div className={`orb-slot ${found ? "is-found" : ""}`} key={index}>
              {found ? (
                <DragonOrb stars={index + 1} size={44} glow={false} />
              ) : (
                <span className="orb-slot-empty">
                  <IconStar size={16} />
                  {index + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <main className="tower-main">
        {allCleared ? (
          <div className="dragon-roost">
            <div className="dragon-roost-art">
              <DragonArt />
            </div>
            <div>
              <span className="eyebrow">All seven orbs!</span>
              <h2>The dragon is awake</h2>
              <p>Seven friends are safe. It&apos;s time to make a wish.</p>
            </div>
            <button className="btn btn-primary" onClick={onFinale}>
              <IconStar size={20} />
              Meet the dragon
            </button>
          </div>
        ) : null}

        <div className="tower-list">
          {FLOORS.map((story, index) => {
            const floor = index + 1;
            const friend = getCharacter(story.config.friendId);
            const cleared = floor <= completed;
            const available = floor === completed + 1;
            const locked = !cleared && !available;
            const status = cleared ? "cleared" : available ? "available" : "locked";
            return (
              <div className={`tower-row ${index % 2 === 0 ? "row-left" : "row-right"}`} key={floor}>
                <button
                  className={`floor-card ${status}`}
                  onClick={() => onPlayFloor(floor)}
                  disabled={locked}
                  aria-label={
                    locked
                      ? `Floor ${floor}, locked. Clear floor ${floor - 1} first.`
                      : `Floor ${floor}, ${story.config.title}. ${cleared ? "Replay" : "Play"}.`
                  }
                >
                  <span className="floor-number">{String(floor).padStart(2, "0")}</span>
                  <div className="floor-friend">
                    <CharacterAvatar character={friend} size={58} />
                    <span className="floor-friend-name">{friend.name}</span>
                  </div>
                  <div className="floor-copy">
                    <span className="floor-label">Floor {floor}</span>
                    <strong>{story.config.title}</strong>
                    <span className="floor-sub">{story.config.subtitle}</span>
                  </div>
                  <div className="floor-right">
                    <div className={`floor-orb ${cleared ? "is-lit" : ""}`}>
                      <DragonOrb stars={story.config.orbStars} size={38} glow={cleared} />
                    </div>
                    <span className={`floor-state ${status}`}>
                      {cleared ? <IconCheck size={16} /> : available ? <IconStar size={16} /> : <IconLock size={15} />}
                      {cleared ? "Clear" : available ? "Play" : "Locked"}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <p className="tower-hint">Clear a floor to unlock the next one. Every visit builds a fresh maze, so replaying a cleared floor always gives you a new one.</p>
      </main>
    </div>
  );
}
