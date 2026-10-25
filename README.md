# Dragon Orb Tower

An all-ages circular-maze adventure PWA. Rescue seven friends, find the Dragon Radar, recover seven numbered Dragon Orbs, and wake the dragon at the top of the tower. Optional Dragon Coins reward exploring every side path.

The characters and art are original, with a classic adventure-cartoon spirit. They are intentionally isolated in `src/content/characters.ts` so the game can be reskinned easily.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually <http://127.0.0.1:5173/>.

To try the production build and offline service worker:

```bash
npm run build
npm run preview
```

Open <http://127.0.0.1:4173/>.

## How to play

- **Tap a corridor.** Sora walks to the next fork, then waits for your next tap.
- **Find the Dragon Radar first.** The numbered Dragon Orb stays hidden on the map until the radar is picked up.
- **Rescue the trapped friend and collect the orb.** The sealed door opens only when the friend is safe, the radar is found, and the orb is yours. The door has a red X while sealed.
- **Dragon Coins are optional bonus treasure.** Three are hidden in side paths on every floor; the mission bar tracks how many you have found.
- **Hint** draws a dotted route to the next goal, in order: friend, radar, orb, door.
- **Read aloud** speaks the floor story and mission.
- **Big maze** lets the puzzle fill the screen and hides the surrounding interface. Press Escape or tap Exit big maze to return.
- **Settings → Easy walking** makes one tap follow the whole route. This is best for very small players.
- There are no timers, ads, accounts, or losing. Progress is saved locally on the device.
- **Every visit builds a fresh maze.** The layout is generated and validated when you enter a floor, including the first play and every replay.

## Campaign

| Floor | Friend | Theme | Orb |
| --- | --- | --- | --- |
| 1 | Mira | Crash Landing | 1-star |
| 2 | Bo | Dumpling Dojo | 2-star |
| 3 | Pico | Green Garden | 3-star |
| 4 | Roku | Sky Library | 4-star |
| 5 | Taro | Sandcastle | 5-star |
| 6 | Nova | Star Forge | 6-star |
| 7 | Kiko | Wish Room | 7-star |

Every floor has a base seed for its theme and ring count, plus a random run seed each time it is opened. The result is a fresh, validated maze on the first play and on every replay, rather than a fixed campaign layout. Floor 1 has 9 rings and 180 cells; Floor 7 grows to 12 rings and 276 cells. The growing-tree carve mixes long routes with many short forks, and portal cells are chosen after carving so the start, friend, and exit are far apart. Braiding is disabled, so every floor is a perfect maze with many forks and false trails. The generator rejects easy layouts: the friend must be at least 6 rings away, the radar at least 8 rings away, the orb at least 5 rings away, and there must be at least 2.5 dead ends per ring (23+ on Floor 1). Every floor has one friend, one Dragon Radar, one numbered orb, and three optional Dragon Coins.

## Development

- React 19 + Vite + TypeScript
- Custom SVG polar-grid maze renderer
- Seeded generator with per-run random seeds, BFS solver, corridor-stop walking, validation
- `vite-plugin-pwa` service worker with offline precache
- Original SVG character avatars and dragon art

Useful files:

- `src/content/floors.ts` — campaign order, story text, base seeds
- `src/content/characters.ts` — Sora and the seven friends; reskin point
- `src/generator/generate.ts` — per-run seeded maze, radar, coin, and objective generation
- `src/generator/graph.ts` — paths and corridor stops
- `src/components/Maze.tsx` — maze art, doors, radar/coin/orb tokens, hints
- `src/components/DragonRadar.tsx` — radar collectible and mission icon
- `src/components/DragonCoin.tsx` — optional Dragon Coin collectible
- `src/screens/PlayScreen.tsx` — gameplay loop and mission HUD
- `src/styles.css` — visual system and responsive layouts

## Checks

```bash
npm test
npm run e2e       # needs the dev server on 127.0.0.1:5173
npm run smoke     # needs the dev server on 127.0.0.1:5173
npm run pwa:check # needs the preview server on 127.0.0.1:4173
```

The E2E suite covers default corridor-stop walking, hints, the hidden orb and radar reveal, all three door objectives, sealed-door feedback, dynamic per-run layouts, settings persistence, reset, floor 7, the finale wish, and Play Again. The PWA check covers manifest/icons, service-worker control, an offline reload, and offline play.

Screenshots from the checks are in `screenshots/`.
