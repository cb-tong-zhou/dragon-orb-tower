const INK = "#231A15";

interface Props {
  size?: number;
  active?: boolean;
}

export function DragonRadarGlyph({ size = 36, active = false }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={active ? "radar-glyph is-active" : "radar-glyph"}
    >
      <circle cx="50" cy="50" r="45" fill="#2C7DA0" stroke={INK} strokeWidth="6" />
      <circle cx="50" cy="50" r="35" fill="#D9F2E6" stroke={INK} strokeWidth="3" />
      <circle cx="50" cy="50" r="24" fill="none" stroke="#2C7DA0" strokeWidth="2" opacity="0.5" />
      <circle cx="50" cy="50" r="13" fill="none" stroke="#2C7DA0" strokeWidth="2" opacity="0.65" />
      <path d="M50 15 V23 M50 77 V85 M15 50 H23 M77 50 H85" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M50 50 L74 28" stroke="#E8482D" strokeWidth="4" strokeLinecap="round" />
      <circle cx="67" cy="61" r="5" fill="#E8482D" stroke={INK} strokeWidth="2" />
      <circle cx="50" cy="50" r="4.5" fill={INK} />
      <path d="M27 27 C32 22 38 18 45 17" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
