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
              <strong>Tap a path beside Sora</strong>
              <p>
                Your hero walks to the next fork, then waits. Taps far away are
                ignored, so you choose every turn yourself. Every visit builds a
                fresh maze.
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
            Tap <strong>Big maze</strong> above the puzzle to let it fill the screen. Grown-ups can
            turn on <strong>Easy walking</strong> in Settings; then tapping anywhere walks the whole
            way, which is lovely for very small players.
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
