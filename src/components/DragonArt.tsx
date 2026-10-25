const INK = "#173A2A";

export function DragonArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 420"
      className={className}
      role="img"
      aria-label="A friendly green dragon"
    >
      <g stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M150 410 C130 330 180 285 260 295 C340 305 390 280 390 240 L470 260 C470 340 400 410 310 410 Z" fill="#5DAE5A" />
        <path d="M145 120 L95 35 L190 78 Z" fill="#FFE7A3" />
        <path d="M455 120 L505 35 L410 78 Z" fill="#FFE7A3" />
        <path d="M95 35 L120 58 L108 72" fill="none" stroke="#D9B45B" strokeWidth="6" />
        <path d="M505 35 L480 58 L492 72" fill="none" stroke="#D9B45B" strokeWidth="6" />
        <path d="M160 145 C120 135 92 150 78 180 C112 174 140 180 165 194 Z" fill="#F4A261" />
        <path d="M440 145 C480 135 508 150 522 180 C488 174 460 180 435 194 Z" fill="#F4A261" />
        <ellipse cx="300" cy="190" rx="145" ry="132" fill="#6FC36B" />
        <path d="M300 58 C250 58 210 88 190 130 C230 112 270 108 300 108 C330 108 370 112 410 130 C390 88 350 58 300 58 Z" fill="#4E9F4A" />
        <path d="M225 90 C245 78 265 74 300 74 C335 74 355 78 375 90" fill="none" stroke="#A7E39A" strokeWidth="8" opacity="0.6" />
        <ellipse cx="300" cy="245" rx="92" ry="64" fill="#A7E39A" />
        <ellipse cx="300" cy="190" rx="58" ry="24" fill="#8BD47F" opacity="0.6" />
        <circle cx="245" cy="180" r="38" fill="#FFFDF4" />
        <circle cx="355" cy="180" r="38" fill="#FFFDF4" />
        <circle cx="254" cy="184" r="18" fill={INK} />
        <circle cx="346" cy="184" r="18" fill={INK} />
        <circle cx="260" cy="177" r="6" fill="#FFF" />
        <circle cx="352" cy="177" r="6" fill="#FFF" />
        <path d="M210 155 C225 145 245 142 260 148" fill="none" stroke={INK} strokeWidth="6" />
        <path d="M340 148 C355 142 375 145 390 155" fill="none" stroke={INK} strokeWidth="6" />
        <path d="M300 216 C312 210 324 210 334 216" fill="none" stroke={INK} strokeWidth="6" />
        <circle cx="272" cy="235" r="6" fill={INK} />
        <circle cx="328" cy="235" r="6" fill={INK} />
        <path d="M270 265 C285 280 315 280 330 265" fill="none" stroke={INK} strokeWidth="7" />
        <path d="M270 265 C260 258 252 260 246 266" fill="none" stroke={INK} strokeWidth="5" />
        <path d="M330 265 C340 258 348 260 354 266" fill="none" stroke={INK} strokeWidth="5" />
        <path d="M210 238 C170 238 145 250 128 268" fill="none" stroke={INK} strokeWidth="5" />
        <path d="M210 252 C176 258 158 272 150 290" fill="none" stroke={INK} strokeWidth="5" />
        <path d="M390 238 C430 238 455 250 472 268" fill="none" stroke={INK} strokeWidth="5" />
        <path d="M390 252 C424 258 442 272 450 290" fill="none" stroke={INK} strokeWidth="5" />
        <path d="M300 250 C292 270 292 292 300 308" fill="none" stroke="#4E9F4A" strokeWidth="5" opacity="0.6" />
        <path d="M245 300 C245 325 260 340 280 342" fill="none" stroke="#4E9F4A" strokeWidth="5" opacity="0.5" />
        <path d="M355 300 C355 325 340 340 320 342" fill="none" stroke="#4E9F4A" strokeWidth="5" opacity="0.5" />
      </g>
    </svg>
  );
}
