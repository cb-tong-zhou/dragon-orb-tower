import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { FRIENDS } from "../content/characters";
import { TOTAL_FLOORS } from "../content/floors";
import { DragonArt } from "../components/DragonArt";
import { DragonOrb } from "../components/DragonOrb";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { IconBack, IconSparkle, IconStar } from "../components/Icons";

interface Props {
  onTower: () => void;
  onRestart: () => void;
}

const WISHES = [
  {
    id: "feast",
    label: "A feast for everyone!",
    result: "The dragon laughs. A mountain of dumplings appears!",
  },
  {
    id: "stars",
    label: "A sky full of stars!",
    result: "The tower glows. Constellations dance above.",
  },
  {
    id: "adventure",
    label: "One more adventure!",
    result: "The dragon grins. A brand-new door appears in the tower...",
  },
];

export function FinaleScreen({ onTower, onRestart }: Props) {
  const [wish, setWish] = useState<(typeof WISHES)[number] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#FF7A1A", "#FFC93C", "#6FC36B", "#8ED1FC", "#FFF4DC"];
    confetti({ particleCount: 130, spread: 90, origin: { y: 0.55 }, colors });
    const timer = window.setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  const chooseWish = (choice: (typeof WISHES)[number]) => {
    setWish(choice);
    if (typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#FF7A1A", "#FFC93C", "#6FC36B", "#8ED1FC", "#FFF4DC"],
      });
    }
  };

  return (
    <div className="screen finale-screen">
      <div className="sky-decor finale-sky" aria-hidden="true">
        <div className="sun-disc finale-sun" />
        <div className="star-field" />
        <div className="halftone-field" />
      </div>

      <header className="finale-top">
        <button className="icon-btn" aria-label="Back to the tower" onClick={onTower}>
          <IconBack />
        </button>
        <span className="eyebrow">The top of the tower</span>
        <span className="finale-top-spacer" />
      </header>

      <main className="finale-main">
        <div className="finale-copy">
          <span className="eyebrow">
            <IconStar size={16} /> {TOTAL_FLOORS} of {TOTAL_FLOORS} Dragon Orbs
          </span>
          <h1>The dragon rises!</h1>
          <p>Seven orbs. Seven friends. One wish.</p>
        </div>

        <div className="dragon-stage">
          <DragonArt className="dragon-art" />
          <div className="dragon-orbs" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                className="dragon-orb-float"
                key={index}
                style={{
                  transform: `rotate(${index * 51.4}deg) translateY(calc(var(--dragon-orb-radius, 178px) * -1)) rotate(-${index * 51.4}deg)`,
                  animationDelay: `${index * 0.18}s`,
                }}
              >
                <DragonOrb stars={index + 1} size={54} />
              </span>
            ))}
          </div>
        </div>

        <div className="friend-finale" aria-label="All seven friends are safe">
          {FRIENDS.map((friend) => (
            <div className="friend-finale-item" key={friend.id}>
              <CharacterAvatar character={friend} size={46} />
              <span>{friend.name}</span>
            </div>
          ))}
        </div>

        {wish === null ? (
          <section className="wish-box">
            <h2>What will you wish for?</h2>
            <div className="wish-options">
              {WISHES.map((choice) => (
                <button className="wish-btn" key={choice.id} onClick={() => chooseWish(choice)}>
                  <IconSparkle size={18} />
                  {choice.label}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="wish-box wish-made">
            <span className="eyebrow">Your wish</span>
            <h2>{wish.label}</h2>
            <p>{wish.result}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onTower}>
                Tower map
              </button>
              <button className="btn btn-primary" onClick={onRestart}>
                <IconStar size={18} />
                Play again
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
