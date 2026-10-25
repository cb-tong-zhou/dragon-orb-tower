const INK = "#231A15";
const PAPER = "#FFF6E2";

interface Props {
  size?: number;
  number?: number;
}

export function DragonCarrotGlyph({ size = 30, number }: Props) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="carrot-glyph">
      <path
        d="M50 25 C66 25 74 39 69 56 L58 85 Q50 98 42 85 L31 56 C26 39 34 25 50 25 Z"
        fill="#FF9A3C"
        stroke={INK}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M42 25 C36 15 26 12 18 15 C23 24 31 28 42 27 Z"
        fill="#6DBE45"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M50 24 C50 12 56 5 66 4 C67 15 61 23 50 27 Z"
        fill="#8ED15A"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M58 25 C66 17 76 16 83 21 C77 30 69 32 58 29 Z"
        fill="#6DBE45"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M38 45 C41 56 43 66 47 77"
        fill="none"
        stroke="#FFD08A"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {number !== undefined ? (
        <>
          <circle cx="50" cy="54" r="24" fill={PAPER} stroke={INK} strokeWidth="4" />
          <text
            x="50"
            y="64"
            textAnchor="middle"
            fontFamily="Nunito, system-ui, sans-serif"
            fontSize="34"
            fontWeight="900"
            fill={INK}
          >
            {number}
          </text>
        </>
      ) : null}
    </svg>
  );
}
