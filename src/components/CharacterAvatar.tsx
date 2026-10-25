import type { Character } from "../content/characters";

const INK = "#231A15";

interface Props {
  character: Character;
  size?: number | string;
  aura?: boolean;
  className?: string;
}

function Hair({ character }: { character: Character }) {
  const { hairStyle, hair, accent, skin } = character;

  switch (hairStyle) {
    case "spiky":
      return (
        <>
          <path
            d="M23 45 L16 21 L29 30 L27 7 L39 23 L46 3 L55 23 L65 5 L68 29 L83 17 L76 45 C69 29 61 24 50 24 C38 24 29 31 23 45 Z"
            fill={hair}
          />
          <path d="M23 39 C29 27 38 23 50 23" fill="none" stroke={INK} strokeWidth={2} opacity={0.35} />
        </>
      );
    case "bob":
      return (
        <>
          <path
            d="M24 47 C21 23 33 15 50 15 C67 15 79 23 76 48 L77 57 C70 47 65 42 58 37 C50 45 40 45 32 39 L28 58 Z"
            fill={hair}
          />
          <path d="M33 28 C40 21 60 21 68 28" fill="none" stroke={INK} strokeWidth={2} opacity={0.25} />
        </>
      );
    case "bald":
      return (
        <>
          <path d="M32 22 C38 16 62 16 68 23" fill="none" stroke={INK} strokeWidth={2.5} opacity={0.25} />
          <circle cx="61" cy="21" r="2.4" fill="#FFF" opacity={0.65} />
        </>
      );
    case "antenna":
      return (
        <>
          <path
            d="M25 40 C24 21 36 15 50 15 C64 15 76 21 75 40 C68 28 61 24 50 24 C39 24 32 28 25 40 Z"
            fill={hair}
          />
          <path d="M38 16 C36 8 32 5 28 3" fill="none" stroke={INK} strokeWidth={3} />
          <circle cx="27" cy="2.5" r="3.2" fill={accent} />
          <path d="M62 16 C64 8 68 5 72 3" fill="none" stroke={INK} strokeWidth={3} />
          <circle cx="73" cy="2.5" r="3.2" fill={accent} />
        </>
      );
    case "mustache":
      return (
        <>
          <path
            d="M25 43 C23 27 32 20 50 20 C68 20 77 27 75 43 C68 32 60 28 50 28 C40 28 32 32 25 43 Z"
            fill={hair}
          />
          <path d="M22 40 C18 44 17 50 21 54 L25 48" fill={hair} />
          <path d="M78 40 C82 44 83 50 79 54 L75 48" fill={hair} />
        </>
      );
    case "headband":
      return (
        <>
          <path
            d="M24 44 C22 23 34 16 50 16 C66 16 78 23 76 44 C68 31 60 27 50 27 C40 27 32 31 24 44 Z"
            fill={hair}
          />
          <path
            d="M26 30 C36 23 64 23 74 30 L73 38 C63 32 37 32 27 38 Z"
            fill={accent}
          />
          <path d="M72 32 L84 28 L82 36 L74 39" fill={accent} />
        </>
      );
    case "ponytail":
      return (
        <>
          <path
            d="M25 45 C22 22 34 15 50 15 C67 15 78 23 76 46 L74 56 C69 44 64 39 57 35 C49 43 39 43 31 37 L27 56 Z"
            fill={hair}
          />
          <path
            d="M73 28 C85 27 91 35 89 47 C87 57 80 62 76 61 C81 52 80 42 70 37 Z"
            fill={hair}
          />
        </>
      );
    case "cat":
      return (
        <>
          <path d="M28 30 L26 10 L42 21 Z" fill={skin} />
          <path d="M72 30 L74 10 L58 21 Z" fill={skin} />
          <path d="M31 27 L30 16 L39 22 Z" fill={accent} opacity={0.8} />
          <path d="M69 27 L70 16 L61 22 Z" fill={accent} opacity={0.8} />
          <path
            d="M24 44 C23 26 34 19 50 19 C66 19 77 26 76 44 C70 35 61 31 50 31 C39 31 30 35 24 44 Z"
            fill={hair}
          />
        </>
      );
  }
}

function AccessoryLayer({ character }: { character: Character }) {
  switch (character.accessory) {
    case "goggles":
      return (
        <g>
          <path d="M23 32 C34 26 66 26 77 32" fill="none" stroke={INK} strokeWidth={3} />
          <circle cx="38" cy="31" r="8" fill="#CFF6FF" stroke={INK} strokeWidth={3} />
          <circle cx="62" cy="31" r="8" fill="#CFF6FF" stroke={INK} strokeWidth={3} />
          <circle cx="38" cy="31" r="4.5" fill={character.accent} opacity={0.9} />
          <circle cx="62" cy="31" r="4.5" fill={character.accent} opacity={0.9} />
          <path d="M46 31 L54 31" stroke={INK} strokeWidth={3} />
        </g>
      );
    case "headband":
      return null;
    case "scouter":
      return (
        <g>
          <path d="M24 38 C35 33 65 33 76 38" fill="none" stroke={INK} strokeWidth={3} />
          <rect x="54" y="38" width="22" height="13" rx="4" fill="#9CFF9C" stroke={INK} strokeWidth={3} />
          <path d="M58 44 H70" stroke={INK} strokeWidth={2} opacity={0.5} />
          <circle cx="66" cy="44" r="2.4" fill={INK} />
        </g>
      );
    case "mustache":
      return (
        <g>
          <path
            d="M39 51 C43 47 47 48 50 51 C53 48 57 47 61 51 C59 56 55 57 50 55 C45 57 41 56 39 51 Z"
            fill={character.hair}
          />
          <path d="M35 34 H46" stroke={INK} strokeWidth={3} opacity={0.7} />
          <path d="M54 34 H65" stroke={INK} strokeWidth={3} opacity={0.7} />
        </g>
      );
    case "antenna":
      return null;
    case "none":
      return null;
  }
}

export function AvatarGlyph({ character }: { character: Character }) {
  return (
      <g stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M17 97 C17 79 30 67 50 67 C70 67 83 79 83 97 Z"
          fill={character.outfit}
        />
        <path
          d="M31 72 C35 80 41 84 50 84 C59 84 65 80 69 72"
          fill="none"
          stroke={character.accent}
          strokeWidth={5}
        />
        <path d="M50 67 L50 84" fill="none" stroke={INK} strokeWidth={2} opacity={0.25} />
        <rect x="43" y="58" width="14" height="13" rx="5" fill={character.skin} />
        <circle cx="23" cy="44" r="6" fill={character.skin} />
        <circle cx="77" cy="44" r="6" fill={character.skin} />
        <circle cx="50" cy="43" r="25" fill={character.skin} />
        <Hair character={character} />
        <AccessoryLayer character={character} />
        {character.hairStyle !== "mustache" ? (
          <>
            <path d="M34 39 C38 37 42 37 45 39" fill="none" stroke={INK} strokeWidth={2.5} />
            <path d="M55 39 C58 37 62 37 66 39" fill="none" stroke={INK} strokeWidth={2.5} />
          </>
        ) : null}
        {character.accessory === "scouter" ? (
          <circle cx="41" cy="46" r="2.8" fill={INK} />
        ) : (
          <>
            <circle cx="41" cy="46" r="2.8" fill={INK} />
            <circle cx="59" cy="46" r="2.8" fill={INK} />
            <circle cx="41.8" cy="45.2" r="0.9" fill="#FFF" />
            <circle cx="59.8" cy="45.2" r="0.9" fill="#FFF" />
          </>
        )}
        {character.hairStyle === "cat" ? (
          <>
            <path d="M46 51 L50 54 L54 51" fill="none" stroke={INK} strokeWidth={2} />
            <path d="M34 53 L24 51 M34 57 L25 59 M66 53 L76 51 M66 57 L75 59" stroke={INK} strokeWidth={2} />
          </>
        ) : character.accessory === "mustache" ? null : (
          <path d="M43 54 Q50 59 57 54" fill="none" stroke={INK} strokeWidth={2.6} />
        )}
        {character.hairStyle !== "mustache" && character.accessory !== "scouter" ? (
          <>
            <circle cx="32" cy="52" r="3.2" fill="#F58A8A" opacity={0.45} />
            <circle cx="68" cy="52" r="3.2" fill="#F58A8A" opacity={0.45} />
          </>
        ) : null}
      </g>
  );
}

export function CharacterAvatar({ character, size = 96, aura = false, className }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${character.name}, ${character.role}`}
    >
      {aura ? (
        <circle cx="50" cy="48" r="45" fill={character.aura} opacity="0.45" />
      ) : null}
      <AvatarGlyph character={character} />
    </svg>
  );
}
