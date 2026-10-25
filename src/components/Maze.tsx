import { useId, useMemo } from "react";
import type { Character } from "../content/characters";
import type { Cell, Level } from "../generator/types";
import { CAPSULE_RADIUS, openNeighborIds, PORTAL_OFFSET } from "../generator/generate";
import { AvatarGlyph } from "./CharacterAvatar";
import { DragonCarrotGlyph } from "./DragonCarrot";
import { DragonCoinGlyph } from "./DragonCoin";
import { DragonOrbGlyph } from "./DragonOrb";
import { DragonRadarGlyph } from "./DragonRadar";

const INK = "#231A15";
const PAPER = "#FFF6E2";
const TWO_PI = Math.PI * 2;

function pointAt(radius: number, angle: number): [number, number] {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function arcPath(radius: number, a0: number, a1: number): string {
  const [x0, y0] = pointAt(radius, a0);
  const [x1, y1] = pointAt(radius, a1);
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0.toFixed(4)} ${y0.toFixed(4)} A ${radius} ${radius} 0 ${largeArc} 1 ${x1.toFixed(4)} ${y1.toFixed(4)}`;
}

function cellPath(cell: Cell): string {
  if (cell.outline) return cell.outline;
  if (cell.kind === "center") {
    return `M 0 -0.98 A 0.98 0.98 0 1 1 0 0.98 A 0.98 0.98 0 1 1 0 -0.98 Z`;
  }
  if (cell.kind === "start" || cell.kind === "exit" || cell.kind === "chamber") {
    return `M ${cell.cx - CAPSULE_RADIUS} ${cell.cy} a ${CAPSULE_RADIUS} ${CAPSULE_RADIUS} 0 1 0 ${CAPSULE_RADIUS * 2} 0 a ${CAPSULE_RADIUS} ${CAPSULE_RADIUS} 0 1 0 ${-CAPSULE_RADIUS * 2} 0 Z`;
  }
  const [ox0, oy0] = pointAt(cell.r1, cell.a0);
  const [ox1, oy1] = pointAt(cell.r1, cell.a1);
  const [ix1, iy1] = pointAt(cell.r0, cell.a1);
  const [ix0, iy0] = pointAt(cell.r0, cell.a0);
  const largeArc = cell.a1 - cell.a0 > Math.PI ? 1 : 0;
  return [
    `M ${ox0.toFixed(4)} ${oy0.toFixed(4)}`,
    `A ${cell.r1} ${cell.r1} 0 ${largeArc} 1 ${ox1.toFixed(4)} ${oy1.toFixed(4)}`,
    `L ${ix1.toFixed(4)} ${iy1.toFixed(4)}`,
    `A ${cell.r0} ${cell.r0} 0 ${largeArc} 0 ${ix0.toFixed(4)} ${iy0.toFixed(4)}`,
    "Z",
  ].join(" ");
}

function capsuleOutline(cell: Cell): string {
  const gap = 0.58;
  const start = cell.angle + Math.PI + gap;
  const end = cell.angle + Math.PI - gap + Math.PI * 2;
  const [sx, sy] = [
    cell.cx + Math.cos(start) * CAPSULE_RADIUS,
    cell.cy + Math.sin(start) * CAPSULE_RADIUS,
  ];
  const [ex, ey] = [
    cell.cx + Math.cos(end) * CAPSULE_RADIUS,
    cell.cy + Math.sin(end) * CAPSULE_RADIUS,
  ];
  const span = end - start;
  const largeArc = span > Math.PI ? 1 : 0;
  return `M ${sx.toFixed(4)} ${sy.toFixed(4)} A ${CAPSULE_RADIUS} ${CAPSULE_RADIUS} 0 ${largeArc} 1 ${ex.toFixed(4)} ${ey.toFixed(4)}`;
}

function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * i) / 5;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(3)},${(cy + Math.sin(angle) * radius).toFixed(3)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

function seedNumber(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i++) value = (value * 31 + seed.charCodeAt(i)) % 997;
  return value;
}

interface Props {
  level: Level;
  playerCell: number;
  followerCell: number | null;
  friend: Character;
  player: Character;
  accent: string;
  friendRescued: boolean;
  radarCollected: boolean;
  orbCollected: boolean;
  coinsCollected: number[];
  carrotsCollected: number[];
  doorReady: boolean;
  hintPath: number[];
  moving: boolean;
  showMoves: boolean;
  onCellTap: (cellId: number) => void;
}

export function Maze({
  level,
  playerCell,
  followerCell,
  friend,
  player,
  accent,
  friendRescued,
  radarCollected,
  orbCollected,
  coinsCollected,
  carrotsCollected,
  doorReady,
  hintPath,
  moving,
  showMoves,
  onCellTap,
}: Props) {
  const uid = useId().replace(/[:]/g, "");
  const wobbleId = `wobble-${uid}`;
  const paperId = `paper-${uid}`;
  const dotsId = `dots-${uid}`;
  const exitGlowId = `exit-glow-${uid}`;

  const R = level.outerRadius;
  const pad = PORTAL_OFFSET + CAPSULE_RADIUS + 0.25;
  const topPad = R + pad + level.extraTop;
  const bottomPad = R + pad;
  const viewBox = `${-(R + pad)} ${-topPad} ${(R + pad) * 2} ${topPad + bottomPad}`;

  const wallPaths = useMemo(() => {
    const earWalls: string[] = [];
    const headWalls: string[] = [];
    for (const edge of level.edges) {
      if (edge.open || edge.wall.type === "none") continue;
      let d = "";
      if (edge.wall.type === "line") {
        d = `M ${edge.wall.x1.toFixed(4)} ${edge.wall.y1.toFixed(4)} L ${edge.wall.x2.toFixed(4)} ${edge.wall.y2.toFixed(4)}`;
      } else if (edge.wall.type === "path") {
        d = edge.wall.d;
      } else {
        d = arcPath(edge.wall.radius, edge.wall.a0, edge.wall.a1);
      }
      (edge.kind === "ear" ? earWalls : headWalls).push(d);
    }
    return { earWalls, headWalls };
  }, [level.edges]);

  const headOuterWall = useMemo(() => {
    if (level.headWallGaps.length === 0) return [];
    const gaps = level.headWallGaps
      .map((gap) => ({
        a0: ((gap.a0 % TWO_PI) + TWO_PI) % TWO_PI,
        a1: ((gap.a1 % TWO_PI) + TWO_PI) % TWO_PI,
      }))
      .sort((a, b) => a.a0 - b.a0);
    const segments: string[] = [];
    let cursor = 0;
    for (const gap of gaps) {
      if (gap.a0 > cursor) segments.push(arcPath(R, cursor, gap.a0));
      cursor = Math.max(cursor, gap.a1);
    }
    if (cursor < TWO_PI) segments.push(arcPath(R, cursor, TWO_PI));
    return segments;
  }, [level.headWallGaps, R]);

  const cells = level.cells;
  const playerPosition = cells[playerCell];
  const follower = followerCell === null ? null : cells[followerCell];
  const orb = level.orbCell >= 0 ? cells[level.orbCell] : null;
  const radar = level.radarCell >= 0 ? cells[level.radarCell] : null;
  const friendCell = cells[level.friendCell];
  // Keep collectible tokens readable as the tower grows more rings.
  const tokenScale = Math.max(0.95, Math.min(1.35, level.rings / 9));
  const orbScale = Math.max(1.15, Math.min(1.65, level.rings / 6));
  const missionLabel =
    level.mission === "rescue"
      ? `Rescue ${friend.name} and reach the ${level.orbStars}-star Dragon Orb in the centre.`
      : level.mission === "coins"
        ? `Rescue ${friend.name}, collect every Dragon Coin, and count them at the door.`
        : level.mission === "code"
          ? `Rescue ${friend.name}, collect the numbered carrots, and crack the code at the door.`
          : `Find the Dragon Radar, rescue ${friend.name}, and use the radar to find the ${level.orbStars}-star Dragon Orb.`;

  const followerIsWithPlayer = follower !== null && playerPosition !== null && follower.id === playerPosition.id;
  const followerSpot = follower
    ? (() => {
        if (!followerIsWithPlayer) return follower;
        const distance = Math.hypot(follower.cx, follower.cy);
        if (distance < 0.01) return { ...follower, cx: follower.cx + 0.28, cy: follower.cy + 0.16 };
        return {
          ...follower,
          cx: follower.cx - (follower.cx / distance) * 0.42,
          cy: follower.cy - (follower.cy / distance) * 0.42,
        };
      })()
    : null;

  const hintD = useMemo(() => {
    if (hintPath.length < 2) return "";
    return hintPath
      .map((id, index) => {
        const cell = cells[id];
        return `${index === 0 ? "M" : "L"} ${cell.cx.toFixed(3)} ${cell.cy.toFixed(3)}`;
      })
      .join(" ");
  }, [hintPath, cells]);

  const moveTargets = useMemo(() => {
    if (!showMoves || moving) return [];
    return openNeighborIds(level, playerCell).map((id) => cells[id]);
  }, [showMoves, moving, level, playerCell, cells]);

  const portalCells = level.portals
    .map((portal) => cells[portal.externalCell])
    .filter(Boolean);

  return (
    <svg
      className="maze-svg"
      viewBox={viewBox}
      role="group"
      aria-label={`Floor ${level.floor} maze. ${missionLabel}`}
    >
      <defs>
        <radialGradient id={paperId} cx="44%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#FFFDF4" />
          <stop offset="72%" stopColor={PAPER} />
          <stop offset="100%" stopColor="#F3E1BF" />
        </radialGradient>
        <pattern id={dotsId} width="0.22" height="0.22" patternUnits="userSpaceOnUse">
          <circle cx="0.05" cy="0.05" r="0.012" fill="#6B4A2E" opacity="0.28" />
        </pattern>
        <filter id={wobbleId} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.055"
            numOctaves="2"
            seed={seedNumber(level.seed)}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.018" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={exitGlowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="0.09" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {level.earShapes.map((d, index) => (
        <path
          key={`ear-shape-${index}`}
          d={d}
          fill={`url(#${paperId})`}
          stroke={INK}
          strokeWidth="5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {level.earInnerShapes.map((d, index) => (
        <path
          key={`ear-inner-${index}`}
          d={d}
          fill="#FFC2D1"
          opacity="0.5"
        />
      ))}

      <g filter={`url(#${wobbleId})`} pointerEvents="none">
        {wallPaths.earWalls.map((d, index) => (
          <path
            key={`ear-wall-${index}`}
            d={d}
            fill="none"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      <circle cx="0" cy="0" r={R + 0.32} fill={`url(#${paperId})`} />
      <circle cx="0" cy="0" r={R + 0.32} fill={`url(#${dotsId})`} opacity="0.3" />
      <circle
        cx="0"
        cy="0"
        r={R + 0.33}
        fill="none"
        stroke={INK}
        strokeWidth="2.2"
        opacity="0.18"
        vectorEffect="non-scaling-stroke"
      />

      <g filter={`url(#${wobbleId})`} pointerEvents="none">
        {level.headWallGaps.length === 0 ? (
          <circle
            cx="0"
            cy="0"
            r={R}
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          headOuterWall.map((d, index) => (
            <path
              key={`head-wall-${index}`}
              d={d}
              fill="none"
              stroke={INK}
              strokeWidth="5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))
        )}
        <circle
          cx="0"
          cy="0"
          r={R + 0.24}
          fill="none"
          stroke={INK}
          strokeWidth="1.4"
          strokeDasharray="0.02 0.08"
          opacity="0.4"
          vectorEffect="non-scaling-stroke"
        />
        {wallPaths.headWalls.map((d, index) => (
          <path
            key={`head-inner-${index}`}
            d={d}
            fill="none"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {hintD ? (
        <path
          d={hintD}
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.16 0.18"
          opacity="0.85"
          pointerEvents="none"
          className="hint-path"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {level.radarCell >= 0 && !radarCollected && radar ? (
        <g pointerEvents="none" data-radar-token data-radar-cell={level.radarCell}>
          <circle
            cx={radar.cx}
            cy={radar.cy}
            r={0.5 * tokenScale}
            fill="#2C7DA0"
            opacity="0.24"
            className="target-pulse"
          />
          <g transform={`translate(${radar.cx} ${radar.cy})`}>
            <g transform={`scale(${0.0086 * tokenScale}) translate(-50 -50)`}>
              <DragonRadarGlyph size={100} active />
            </g>
          </g>
        </g>
      ) : null}

      {level.coinCells.map((cellId) => {
        if (coinsCollected.includes(cellId)) return null;
        const coin = cells[cellId];
        if (!coin) return null;
        return (
          <g key={`coin-${cellId}`} pointerEvents="none" data-coin-token data-coin-cell={cellId}>
            <circle
              cx={coin.cx}
              cy={coin.cy}
              r={0.32 * tokenScale}
              fill="#FFC93C"
              opacity="0.24"
              className="target-pulse"
            />
            <g transform={`translate(${coin.cx} ${coin.cy})`}>
              <g transform={`scale(${0.0065 * tokenScale}) translate(-50 -50)`}>
                <DragonCoinGlyph size={100} />
              </g>
            </g>
          </g>
        );
      })}

      {level.carrotCells.map((cellId, index) => {
        if (carrotsCollected.includes(cellId)) return null;
        const carrot = cells[cellId];
        if (!carrot) return null;
        return (
          <g key={`carrot-${cellId}`} pointerEvents="none" data-carrot-token data-carrot-cell={cellId}>
            <circle
              cx={carrot.cx}
              cy={carrot.cy}
              r={0.46 * tokenScale}
              fill="#FF9A3C"
              opacity="0.26"
              className="target-pulse"
            />
            <g transform={`translate(${carrot.cx} ${carrot.cy})`}>
              <g transform={`scale(${0.0112 * tokenScale}) translate(-50 -50)`}>
                <DragonCarrotGlyph size={100} number={level.carrotNumbers[index]} />
              </g>
            </g>
          </g>
        );
      })}

      {level.orbCell >= 0 && !orbCollected && orb && (level.radarCell < 0 || radarCollected) ? (
        <g pointerEvents="none" data-orb-token data-orb-cell={level.orbCell}>
          <circle
            cx={orb.cx}
            cy={orb.cy}
            r={0.48 * orbScale}
            fill="#FFC93C"
            opacity="0.34"
            className="target-pulse"
          />
          <g transform={`translate(${orb.cx} ${orb.cy})`}>
            <g transform={`scale(${0.0086 * orbScale}) translate(-50 -50)`}>
              <DragonOrbGlyph stars={level.orbStars} glow />
            </g>
          </g>
        </g>
      ) : null}

      {portalCells.map((cell) => {
        const isStart = cell.kind === "start";
        const isExit = cell.kind === "exit";
        const isChamber = cell.kind === "chamber";
        return (
          <g key={cell.id} pointerEvents="none">
            <circle cx={cell.cx} cy={cell.cy} r={CAPSULE_RADIUS} fill={PAPER} />
            <path
              d={capsuleOutline(cell)}
              fill="none"
              stroke={INK}
              strokeWidth="3.6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M ${cell.cx - 0.31} ${cell.cy - 0.24} C ${cell.cx - 0.42} ${cell.cy + 0.05} ${cell.cx - 0.24} ${cell.cy + 0.34} ${cell.cx + 0.02} ${cell.cy + 0.38}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.55"
              vectorEffect="non-scaling-stroke"
            />
            {isStart ? (
              <path
                d={starPath(cell.cx, cell.cy + 0.02, 0.25, 0.11)}
                fill="#FFC93C"
                stroke={INK}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {isExit ? (
              <>
                <circle
                  cx={cell.cx}
                  cy={cell.cy}
                  r="0.36"
                  fill={doorReady ? "#B9E769" : "#F3E1BF"}
                  stroke={INK}
                  strokeWidth="2.6"
                  vectorEffect="non-scaling-stroke"
                  filter={doorReady ? `url(#${exitGlowId})` : undefined}
                />
                <path
                  d={`M ${cell.cx - 0.15} ${cell.cy + 0.21} V ${cell.cy - 0.12} Q ${cell.cx - 0.15} ${cell.cy - 0.2} ${cell.cx - 0.07} ${cell.cy - 0.2} H ${cell.cx + 0.07} Q ${cell.cx + 0.15} ${cell.cy - 0.2} ${cell.cx + 0.15} ${cell.cy - 0.12} V ${cell.cy + 0.21}`}
                  fill="none"
                  stroke={doorReady ? "#1F5B24" : INK}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={`M ${cell.cx - 0.15} ${cell.cy + 0.21} H ${cell.cx + 0.15}`}
                  fill="none"
                  stroke={doorReady ? "#1F5B24" : INK}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={cell.cx + 0.075} cy={cell.cy + 0.02} r="0.03" fill={doorReady ? "#1F5B24" : INK} />
                {!doorReady ? (
                  <path
                    d={`M ${cell.cx - 0.3} ${cell.cy - 0.3} L ${cell.cx + 0.3} ${cell.cy + 0.3} M ${cell.cx + 0.3} ${cell.cy - 0.3} L ${cell.cx - 0.3} ${cell.cy + 0.3}`}
                    stroke="#E8482D"
                    strokeWidth="4"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
              </>
            ) : null}
            {isChamber ? (
              <>
                <circle cx={cell.cx} cy={cell.cy} r="0.34" fill={friend.aura} opacity="0.5" />
                {!friendRescued ? (
                  <>
                    <g transform={`translate(${cell.cx} ${cell.cy + 0.08}) scale(0.0048) translate(-50 -52)`}>
                      <AvatarGlyph character={friend} />
                    </g>
                    <path
                      d={`M ${cell.cx - 0.28} ${cell.cy - 0.25} C ${cell.cx - 0.4} ${cell.cy + 0.02} ${cell.cx - 0.2} ${cell.cy + 0.31} ${cell.cx + 0.05} ${cell.cy + 0.33}`}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.75"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : (
                  <path
                    d={starPath(cell.cx, cell.cy, 0.16, 0.07)}
                    fill={accent}
                    stroke={INK}
                    strokeWidth="1.4"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </>
            ) : null}
          </g>
        );
      })}

      {!friendRescued && friendCell ? (
        <circle
          cx={friendCell.cx}
          cy={friendCell.cy}
          r="0.62"
          fill="none"
          stroke={friend.aura}
          strokeWidth="3"
          opacity="0.55"
          className="target-pulse"
          pointerEvents="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {moveTargets.map((cell) => (
        <circle
          key={`move-${cell.id}`}
          cx={cell.cx}
          cy={cell.cy}
          r={cell.kind === "start" || cell.kind === "exit" || cell.kind === "chamber" ? 0.13 : 0.1}
          fill={accent}
          opacity="0.7"
          className="move-dot"
          pointerEvents="none"
        />
      ))}

      {followerSpot ? (
        <g pointerEvents="none" data-follower-token data-follower-cell={followerCell ?? undefined}>
          <circle cx={followerSpot.cx} cy={followerSpot.cy} r="0.3" fill={PAPER} stroke={INK} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <g transform={`translate(${followerSpot.cx} ${followerSpot.cy}) scale(0.0056) translate(-50 -52)`}>
            <AvatarGlyph character={friend} />
          </g>
        </g>
      ) : null}

      {playerPosition ? (
        <g pointerEvents="none" data-player-token data-player-cell={playerCell}>
          <circle
            cx={playerPosition.cx}
            cy={playerPosition.cy}
            r="0.44"
            fill="none"
            stroke={player.aura}
            strokeWidth="3"
            opacity="0.5"
            className="player-halo"
            vectorEffect="non-scaling-stroke"
          />
          <g transform={`translate(${playerPosition.cx} ${playerPosition.cy})`}>
            <ellipse cx="0" cy="0.38" rx="0.27" ry="0.08" fill="#3A2412" opacity="0.18" />
            <circle r="0.37" fill={PAPER} stroke={INK} strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
            <g transform="scale(0.007) translate(-50 -52)">
              <AvatarGlyph character={player} />
            </g>
          </g>
        </g>
      ) : null}

      {cells.map((cell) => (
        <path
          key={`hit-${cell.id}`}
          d={cellPath(cell)}
          fill="transparent"
          className={`cell-hit ${cell.kind === "start" || cell.kind === "exit" || cell.kind === "chamber" ? "cell-hit-portal" : ""}`}
          data-cell-id={cell.id}
          data-cell-kind={cell.kind}
          onClick={() => onCellTap(cell.id)}
          style={{ cursor: moving ? "default" : "pointer" }}
        />
      ))}
    </svg>
  );
}
