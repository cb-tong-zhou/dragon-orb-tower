import { DragonRadarGlyph } from "./DragonRadar";
import { IconBulb, IconHelp, IconLock, IconMap, IconStar } from "./Icons";

interface Props {
  onClose: () => void;
}

export function HowToPlayModal({ onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-card howto-card" role="dialog" aria-modal="true" aria-labelledby="howto-title">
        <span className="eyebrow">
          <IconHelp size={16} /> How to play
        </span>
        <h2 id="howto-title">A circular maze adventure</h2>
        <div className="howto-steps">
          <div className="howto-step">
            <span className="howto-icon">
              <IconMap size={24} />
            </span>
            <div>
              <strong>Tap to walk, or steer with your thumb</strong>
              <p>
                Tap anywhere near Sora — within a short walk — and he walks to
                that exact spot, pixel by pixel, so you never have to aim at a
                cell. Taps farther away do nothing, so you find the way
                yourself. For hands-on control, press and hold anywhere on the
                maze: a little joystick appears under your thumb, and sliding
                it steers him round bends and forks. Every visit builds a fresh
                maze.
              </p>
            </div>
          </div>
          <div className="howto-step">
            <span className="howto-icon">
              <DragonRadarGlyph size={26} active />
            </span>
            <div>
              <strong>Every floor has a mission</strong>
              <p>
                Floor 1 is a rescue with a star in the center. Later floors add the Dragon
                Radar, Dragon Coin counting, and carrot code puzzles.
              </p>
            </div>
          </div>
          <div className="howto-step">
            <span className="howto-icon">
              <IconLock size={24} />
            </span>
            <div>
              <strong>Open the sealed door</strong>
              <p>
                The door unlocks when that floor&apos;s mission is complete. Dragon Coins are
                bonus treasure on radar floors.
              </p>
            </div>
          </div>
          <div className="howto-step">
            <span className="howto-icon">
              <IconStar size={24} />
            </span>
            <div>
              <strong>Friends check paths for you</strong>
              <p>
                Rescued friends follow you and can scout one path per floor. Tap a friend
                below the maze, then tap a glowing path. A true dead end gets a chalk X, so
                you walk less.
              </p>
            </div>
          </div>
          <div className="howto-step">
            <span className="howto-icon">
              <IconBulb size={24} />
            </span>
            <div>
              <strong>Stuck? Use a hint</strong>
              <p>Tap Hint for a dotted path. There are no timers and no losing.</p>
            </div>
          </div>
        </div>
        <p className="howto-note">
          <IconStar size={16} />
          <span>
            Tap <strong>Big maze</strong> above the puzzle to let it fill the screen, so there is
            more room for your thumb. There are no timers and no losing.
          </span>
        </p>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose} autoFocus>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
