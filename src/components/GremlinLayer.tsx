import type { Cell } from "../generator/types";
import type { GremlinToken } from "../game/encounters";

const INK = "#231A15";

interface Props {
  gremlins: GremlinToken[];
  cells: Cell[];
}

/**
 * The grumblin: a small plum puff with grumpy eyebrows and a "grr" bubble.
 * It is a token, never a wall — Sora walks straight up to it and shoos it.
 */
export function GremlinLayer({ gremlins, cells }: Props) {
  if (gremlins.length === 0) return null;

  return (
    <g className="gremlin-layer" pointerEvents="none">
      {gremlins.map((gremlin) => {
        const cell = cells[gremlin.cellId];
        if (!cell) return null;
        const fleeing = gremlin.state === "fleeing";

        return (
          <g
            key={gremlin.id}
            className={`gremlin-token ${fleeing ? "is-fleeing" : ""}`}
            data-gremlin-cell={gremlin.cellId}
            role="img"
            aria-label="A grumpy grumblin is blocking the path"
          >
            <circle
              cx={cell.cx}
              cy={cell.cy}
              r="0.3"
              fill="#7D5BA6"
              stroke={INK}
              strokeWidth="2.2"
              vectorEffect="non-scaling-stroke"
            />
            {/* Grumpy eyebrows */}
            <path
              d={`M ${cell.cx - 0.16} ${cell.cy - 0.14} L ${cell.cx - 0.05} ${cell.cy - 0.07} M ${cell.cx + 0.05} ${cell.cy - 0.07} L ${cell.cx + 0.16} ${cell.cy - 0.14}`}
              fill="none"
              stroke={INK}
              strokeWidth="2.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* Tiny feet */}
            <path
              d={`M ${cell.cx - 0.12} ${cell.cy + 0.28} h 0.08 M ${cell.cx + 0.04} ${cell.cy + 0.28} h 0.08`}
              stroke={INK}
              strokeWidth="2.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* "grr" bubble */}
            <g transform={`translate(${cell.cx + 0.3} ${cell.cy - 0.34})`}>
              <circle
                r="0.17"
                fill="#FFF6E2"
                stroke={INK}
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
              />
              <path d="M -0.17 0.1 L -0.3 0.22 L -0.06 0.15 Z" fill="#FFF6E2" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="0.13"
                fontWeight="900"
                fill={INK}
                style={{ fontFamily: "var(--font-display), Nunito, sans-serif" }}
              >
                grr
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
