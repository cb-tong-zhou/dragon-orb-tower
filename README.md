# Dragon Orb Tower

[![Deploy to Vercel](https://github.com/cb-tong-zhou/dragon-orb-tower/actions/workflows/deploy.yml/badge.svg)](https://github.com/cb-tong-zhou/dragon-orb-tower/actions/workflows/deploy.yml)

An all-ages circular-maze adventure PWA. Rescue seven friends, solve each floor's mission, recover seven numbered Dragon Orbs, and wake the dragon at the top of the tower. The first three floors follow a hand-drawn difficulty ladder: a center-star rescue, a coin-counting maze, and a bunny-shaped carrot code. Floors 4–7 use the Dragon Radar to reveal their hidden orbs.

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

- **Tap a path right beside Sora.** He walks to the next fork, then waits for your next tap. Taps on far-away coins, orbs, or doors are ignored on purpose — you make every choice at every fork.
- **Every floor has its own mission.** Floor 1 is a rescue with a star in the center. Floor 2 asks you to collect every Dragon Coin and count them at the door. Floor 3 hides numbered carrots in a bunny-shaped maze and asks you to crack an `A = 1` code. Floors 4–7 bring back the Dragon Radar, which reveals the hidden orb.
- **Rescue the trapped friend and complete the mission.** The sealed door has a red X until that floor's goals are finished, then turns green.
- **Rescued friends scout for you.** Up to three friends walk behind Sora and each can check one path per floor. By default they volunteer at forks; in Settings you can switch to tap-to-send or turn it off. A true dead end gets a chalk X so you avoid it. Friends never collect items, rescue anyone, or open doors — that is still your job.
- **A grumblin may block a friend.** Sometimes a successful scout attracts a grumpy little grumblin on the way back. Walk to it and it runs away — no combat, no timer, nothing lost. Until every friend is free the exit door stays sealed and the Hint button points at the grumblin. Floor 1 has no grumblins, and on floors 3+ the first scout of a floor is always safe.
- **Dragon Coins are bonus treasure on radar floors.** Three are hidden in side paths on Floors 4–7. Floor 2's twelve coins are the main counting mission, so its mission chip deliberately hides the total.
- **Hint** draws a dotted route to the next goal: friend, then the floor's collectible or orb, then the door.
- **Read aloud** speaks the floor story and mission.
- **Big maze** lets the puzzle fill the screen and hides the surrounding interface. Press Escape or tap Exit big maze to return.
- **Settings → Easy walking** makes one tap follow the whole route. This is best for very small players.
- There are no timers, ads, accounts, or losing. Progress is saved locally on the device.
- **Every visit builds a fresh maze.** The layout is generated and validated when you enter a floor, including the first play and every replay.

## Campaign

| Floor | Friend | Theme | Mission | Orb |
| --- | --- | --- | --- | --- |
| 1 | Mira | Crash Landing | Rescue + center star | 1-star |
| 2 | Bo | Dumpling Dojo | Collect 12 coins + count | 2-star |
| 3 | Pico | Bunny Garden | 3 numbered carrots + `A = 1` code | 3-star |
| 4 | Roku | Sky Library | Dragon Radar + hidden orb | 4-star |
| 5 | Taro | Sandcastle | Dragon Radar + hidden orb | 5-star |
| 6 | Nova | Star Forge | Dragon Radar + hidden orb | 6-star |
| 7 | Kiko | Wish Room | Dragon Radar + hidden orb | 7-star |

Every floor has a base seed for its theme and ring count, plus a random run seed each time it is opened. The result is a fresh, validated maze on the first play and on every replay, rather than a fixed campaign layout. Floor 1 has 10 rings, 16 sectors per ring, and about 148 cells. Floor 2 grows to 15 rings, 24 sectors per ring, and about 340 cells with 12 coins and opposite start/exit portals. Floor 3 has a 10-ring, 16-sector head plus two tall 5×9 ear mini-mazes with long nested U-lanes (about 238 cells total), three numbered carrots, and a multiple-choice code door. Floors 4–7 use 11–12 rings at 28 sectors (about 284–312 cells), the radar/orb loop, and 3 optional coins. Keeping the sector count constant within a floor is deliberate: it lets radial walls and concentric arcs run continuously across many rings, like the hand-drawn reference maps, instead of breaking into tiny stair-stepped segments. The renderer also merges touching collinear wall edges into single long SVG paths. The growing-tree carve mixes long routes with short forks, and portal cells are chosen after carving so the start, friend, and exit are far apart. Braiding is disabled, so every floor is a perfect maze with many forks and false trails. The generator rejects easy layouts with floor-specific thresholds for friend/exit distance, orb/radar distance, and dead ends. Every floor has one friend and one numbered orb; the first three floors award the orb at the door or center, while radar floors hide it until the radar is found.

## Development

- React 19 + Vite + TypeScript
- Custom SVG polar-grid maze renderer
- Seeded generator with per-run random seeds, BFS solver, corridor-stop walking, validation
- `vite-plugin-pwa` service worker with offline precache
- Original SVG character avatars and dragon art

Useful files:

- `src/content/floors.ts` — campaign order, mission configs, story text, per-floor tuning
- `src/content/characters.ts` — Sora and the seven friends; reskin point
- `src/generator/generate.ts` — per-run seeded maze, mission objectives, spiral bunny ears, radar/coin/carrot generation
- `src/generator/graph.ts` — paths and corridor stops
- `src/components/Maze.tsx` — maze art, doors, bunny ears, radar/coin/orb/carrot tokens, hints
- `src/components/DragonRadar.tsx` — radar collectible and mission icon
- `src/components/DragonCoin.tsx` — Dragon Coin collectible
- `src/components/DragonCarrot.tsx` — numbered carrot collectible
- `src/screens/PlayScreen.tsx` — gameplay loop, mission HUD, counting/code doors
- `src/styles.css` — visual system and responsive layouts

## Checks

```bash
npm test
npm run e2e       # needs the dev server on 127.0.0.1:5173
npm run smoke     # needs the dev server on 127.0.0.1:5173
npm run pwa:check # needs the preview server on 127.0.0.1:4173
```

The E2E suite covers default corridor-stop walking on Floor 1, hints, the center-star rescue, Floor 2's hidden coin total and counting door, Floor 3's bunny ears and code door, a radar floor's hide/reveal orb flow, dynamic per-run layouts, settings persistence, reset, floor 7, the finale wish, and Play Again. The PWA check covers manifest/icons, service-worker control, an offline reload, and offline play.

Screenshots from the checks are in `screenshots/`.
