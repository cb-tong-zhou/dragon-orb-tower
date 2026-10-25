import { getCharacter } from "../content/characters";
import type { Cell } from "../generator/types";
import type { ScoutHighlight, ScoutMark } from "../game/scouting";

const INK = "#231A15";

interface Props {
  marks: ScoutMark[];
  highlight: ScoutHighlight | null;
  cells: Cell[];
  accent: string;
}

function trailPath(cells: Cell[], cellIds: number[]): string {
  return cellIds
    .map((id, index) => {
      const cell = cells[id];
      if (!cell) return "";
      return `${index === 0 ? "M" : "L"} ${cell.cx.toFixed(3)} ${cell.cy.toFixed(3)}`;
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Dead-end chalk marks (dotted trail + X at the leaf) and the pulsing
 * highlight of branches a selected friend may be sent down.
 */
export function ScoutLayer({ marks, highlight, cells, accent }: Props) {
  return (
    <g className="scout-layer" pointerEvents="none">
      {marks.map((mark) => {
        const leaf = cells[mark.deadEndCellId];
        if (!leaf) return null;
        const character = getCharacter(mark.friendId);

        return (
          <g
            key={mark.id}
            className="scout-mark"
            data-scout-mark
            data-scout-dead-end={mark.deadEndCellId}
            role="img"
            aria-label={`${character.name} marked a dead end`}
          >
            <path
              d={trailPath(cells, mark.cells)}
              fill="none"
              stroke={INK}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="0.02 0.16"
              opacity="0.26"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={leaf.cx}
              cy={leaf.cy}
              r="0.26"
              fill="#FFF6E2"
              stroke={INK}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M ${leaf.cx - 0.13} ${leaf.cy - 0.13} L ${leaf.cx + 0.13} ${leaf.cy + 0.13} M ${leaf.cx + 0.13} ${leaf.cy - 0.13} L ${leaf.cx - 0.13} ${leaf.cy + 0.13}`}
              fill="none"
              stroke={character.accent}
              strokeWidth="3.4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}

      {highlight
        ? highlight.branches.map((branch) => {
            const first = cells[branch.firstCell];
            if (!first) return null;
            const ids = branch.cells.length >= 2 ? branch.cells : [branch.firstCell];

            return (
              <g
                key={`highlight-${branch.firstCell}`}
                className="scout-highlight-group"
                data-scout-highlight={branch.firstCell}
              >
                <path
                  d={trailPath(cells, ids)}
                  fill="none"
                  stroke={accent}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="0.1 0.12"
                  opacity="0.55"
                  className="scout-highlight"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={first.cx}
                  cy={first.cy}
                  r="0.2"
                  fill={accent}
                  opacity="0.65"
                  className="scout-highlight-dot"
                />
              </g>
            );
          })
        : null}
    </g>
  );
}
