import { FRIENDS, SORA } from "../content/characters";
import { TOTAL_FLOORS } from "../content/floors";
import type { Settings } from "../game/storage";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { DragonOrb } from "../components/DragonOrb";
import { IconGear, IconHelp, IconMap, IconSound, IconSparkle, IconStar } from "../components/Icons";

interface Props {
  completed: number;
  settings: Settings;
  onEnterTower: () => void;
  onFinale: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  onToggleSound: () => void;
}

export function HomeScreen({
  completed,
  settings,
  onEnterTower,
  onFinale,
  onHowTo,
  onSettings,
  onToggleSound,
}: Props) {
  const finished = completed >= TOTAL_FLOORS;

  return (
    <div className="screen home-screen">
      <div className="sky-decor" aria-hidden="true">
        <div className="sun-disc" />
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
        <div className="cloud cloud-c" />
        <div className="halftone-field" />
      </div>

      <header className="home-top">
        <div className="mini-brand">
          <DragonOrb stars={7} size={30} glow={false} />
          <span>Dragon Orb Tower</span>
        </div>
        <div className="home-top-actions">
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

      <main className="home-main">
        <div className="logo-lockup">
          <span className="logo-kicker">A 7-floor maze quest</span>
          <h1 className="game-logo">
            <span>Dragon Orb</span>
            <span className="logo-tower">Tower</span>
          </h1>
          <p className="logo-sub">Rescue seven friends. Find seven Dragon Orbs. Wake the dragon!</p>
        </div>

        <div className="hero-stack">
          <div className="orb-arc" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                className="orb-arc-item"
                key={index}
                style={{
                  transform: `rotate(${index * 51.4}deg) translateY(calc(var(--orb-radius, 132px) * -1)) rotate(-${index * 51.4}deg)`,
                }}
              >
                <DragonOrb stars={index + 1} size={44} glow={false} />
              </span>
            ))}
          </div>
          <div className="hero-aura" />
          <CharacterAvatar character={SORA} size={210} aura className="hero-avatar" />
          <div className="hero-badge">
            <IconSparkle size={16} />
            <span>{completed} / {TOTAL_FLOORS} orbs</span>
          </div>
        </div>

        <div className="home-actions">
          {finished ? (
            <>
              <button className="btn btn-primary btn-hero" onClick={onFinale}>
                <IconStar size={20} />
                Meet the dragon!
              </button>
              <button className="btn btn-secondary" onClick={onEnterTower}>
                Tower map
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-hero" onClick={onEnterTower}>
              {completed === 0 ? (
                <>
                  <IconSparkle size={20} />
                  Start adventure
                </>
              ) : (
                <>
                  <IconMap size={20} />
                  Continue · Floor {completed + 1}
                </>
              )}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onHowTo}>
            <IconHelp size={18} />
            How to play
          </button>
        </div>

        <div className="friend-lineup" aria-label="Sora's friends">
          {FRIENDS.map((friend, index) => (
            <div
              className={`friend-lineup-item ${index < completed ? "is-saved" : ""}`}
              key={friend.id}
              title={friend.name}
            >
              <CharacterAvatar character={friend} size={54} />
              <span>{friend.name}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="home-footer">
        <span>Works offline</span>
        <span aria-hidden="true">•</span>
        <span>No ads</span>
        <span aria-hidden="true">•</span>
        <span>Made for little heroes</span>
      </footer>
    </div>
  );
}
