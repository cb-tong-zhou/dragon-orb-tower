import { useState, type ReactNode } from "react";
import type { Settings } from "../game/storage";
import { TOTAL_FLOORS } from "../content/floors";
import { IconBulb, IconGear, IconSound, IconSpeaker, IconStar } from "./Icons";

interface Props {
  settings: Settings;
  completed: number;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onClose: () => void;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <button
      className={`setting-row ${checked ? "is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="setting-icon">{icon}</span>
      <span className="setting-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      <span className="switch-track" aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  );
}

export function SettingsModal({ settings, completed, onChange, onReset, onClose }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-card settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <span className="eyebrow">
          <IconGear size={16} /> Settings
        </span>
        <h2 id="settings-title">Make it yours</h2>

        <div className="settings-list">
          <Toggle
            checked={settings.sound}
            onChange={(value) => onChange({ sound: value })}
            label="Sound effects"
            description="Chimes, footsteps and happy fanfares."
            icon={<IconSound size={22} />}
          />
          <Toggle
            checked={settings.voice}
            onChange={(value) => onChange({ voice: value })}
            label="Read aloud automatically"
            description="Reads the floor story when you start."
            icon={<IconSpeaker size={22} />}
          />
          <Toggle
            checked={settings.easyWalk}
            onChange={(value) => onChange({ easyWalk: value })}
            label="Easy walking"
            description="Tap anywhere and walk all the way. Best for very small players."
            icon={<IconBulb size={22} />}
          />
        </div>

        <div className="progress-box">
          <div className="progress-box-head">
            <span>
              <IconStar size={17} /> Progress
            </span>
            <strong>{completed} / {TOTAL_FLOORS} orbs</strong>
          </div>
          <p>Progress is saved on this device. No accounts, no ads, no tracking.</p>
          {!confirmReset ? (
            <button className="text-danger" onClick={() => setConfirmReset(true)}>
              Reset all progress
            </button>
          ) : (
            <div className="reset-confirm">
              <span>Reset everything and start from Floor 1?</span>
              <div>
                <button className="btn btn-small btn-ghost" onClick={() => setConfirmReset(false)}>
                  Keep playing
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => {
                    onReset();
                    onClose();
                  }}
                >
                  Yes, reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose} autoFocus>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
