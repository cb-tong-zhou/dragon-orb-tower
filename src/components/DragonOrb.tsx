import { useId } from "react";

const INK = "#7A2E0E";

const STAR_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [
    [42, 42],
    [58, 58],
  ],
  3: [
    [50, 38],
    [38, 58],
    [62, 58],
  ],
  4: [
    [38, 38],
    [62, 38],
    [38, 62],
    [62, 62],
  ],
  5: [
    [36, 36],
    [64, 36],
    [50, 50],
    [36, 64],
    [64, 64],
  ],
  6: [
    [36, 36],
    [50, 36],
    [64, 36],
    [36, 64],
    [50, 64],
    [64, 64],
  ],
  7: [
    [50, 33],
    [66, 41],
    [66, 59],
    [50, 67],
    [34, 59],
    [34, 41],
    [50, 50],
  ],
};

function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * i) / 5;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

interface GlyphProps {
  stars: number;
  glow?: boolean;
}

export function DragonOrbGlyph({ stars, glow = true }: GlyphProps) {
  const uid = useId().replace(/[:]/g, "");
  const gradientId = `orb-${uid}`;
  const glowId = `orb-glow-${uid}`;
  const positions = STAR_POSITIONS[Math.min(Math.max(stars, 1), 7)];

  return (
    <g>
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#FFF3B0" />
          <stop offset="28%" stopColor="#FFC93C" />
          <stop offset="62%" stopColor="#FF9F1C" />
          <stop offset="100%" stopColor="#E85D04" />
        </radialGradient>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {glow ? (
        <circle cx="50" cy="50" r="42" fill="#FFB347" opacity="0.35" filter={`url(#${glowId})`} />
      ) : null}
      <circle cx="50" cy="50" r="40" fill={`url(#${gradientId})`} stroke={INK} strokeWidth="4" />
      <path
        d="M26 31 C33 20 50 16 64 20"
        fill="none"
        stroke="#FFF7D6"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <ellipse cx="62" cy="67" rx="17" ry="10" fill="#D9480F" opacity="0.18" />
      {positions.map(([x, y], index) => (
        <path
          key={index}
          d={starPath(x, y, stars >= 6 ? 5.5 : 6.5, stars >= 6 ? 2.4 : 2.9)}
          fill="#C0261D"
          stroke="#8A1C14"
          strokeWidth="1"
        />
      ))}
      <circle cx="35" cy="33" r="5" fill="#FFF9DD" opacity="0.85" />
    </g>
  );
}

interface Props {
  stars: number;
  size?: number | string;
  glow?: boolean;
  className?: string;
}

export function DragonOrb({ stars, size = 64, glow = true, className }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${stars}-star Dragon Orb`}
    >
      <DragonOrbGlyph stars={stars} glow={glow} />
    </svg>
  );
}
