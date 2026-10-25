const INK = "#231A15";

function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * i) / 5;
    points.push(
      `${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`,
    );
  }
  return `M ${points.join(" L ")} Z`;
}

interface Props {
  size?: number;
}

export function DragonCoinGlyph({ size = 30 }: Props) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="coin-glyph">
      <circle cx="50" cy="50" r="44" fill="#FFC93C" stroke={INK} strokeWidth="6" />
      <circle cx="50" cy="50" r="33" fill="#FFE08A" stroke={INK} strokeWidth="2.5" opacity="0.8" />
      <path d={starPath(50, 50, 23, 10)} fill="#FF7A1A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M25 30 C31 22 40 17 49 16" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
