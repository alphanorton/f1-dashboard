# Dashboard and Grand Prix UI update

## Changes
- Removed the Next Race countdown timer from the dashboard.
- Replaced it with the race date/weekend and the official 2026 Grand Prix lights-out time in the circuit's local timezone. The UI shows `TBA` rather than inventing a time if a race cannot be matched.
- Replaced the previous country-derived image URL (which pointed to nonexistent files such as `united-states.png`) with an explicit mapping to local circuit-map assets. The current United States GP resolves to `public/data/track-maps/cota.png`; Mexico, Brazil, Las Vegas, Qatar, Abu Dhabi, Spa and Madrid also map to the matching local assets.
- Added animated entrance, staggered reveal, hover lift, track-image glow, soft shine and team-colour standings accents for Dashboard, Grand Prix and Standings.
- Added reduced-motion handling for users who disable animation in their operating system.
- Made Grand Prix race cards keyboard-operable using Enter and Space.
- Corrected the CircuitImage fallback message to describe missing local assets instead of incorrectly blaming an external CDN.

## Race-time source
The 2026 local start times follow Formula 1's published start-time table: https://www.formula1.com/en/latest/article/official-grand-prix-start-times-for-2026-f1-season-confirmed.2UgPfArqH76tzlOYh21jSG.2UgPfArqH76tzlOYh21jSG

## Verification
- Reviewed all new asset mappings against files in `public/data/track-maps/`.
- The current Next Race entry (United States GP) maps to `cota.png` and the displayed local start time is 15:00 CDT.
- `npm run typecheck` / `npm run build` could not be completed in this environment because the checked-in `node_modules` tree is incomplete and npm offline cache lacks packages (for example `vite`, `@types/react`, and `zustand`). Run `npm ci`, then `npm run typecheck`, `npm run build`, and the test suite in an environment with registry access.

## Motion system v2 (telemetry-style)
- New: `src/lib/motion.ts`, `src/hooks/useCountUp.ts`, `src/hooks/useSpotlight.ts`, `src/components/motion/{AnimatedNumber,PageTransition}.tsx`; CSS block "Telemetry-style motion + glass system" in `src/index.css`; `neon.*`/`carbon` colours in `tailwind.config.js`.
- Applied to: App (backdrop, route transition, spotlight), Dashboard (counting stats/points, growing progress bar, glass+spotlight+lift leader cards with stagger), Fastest Laps (purple lap times, pulse on latest race).
- Fix: `formatLapTime` could print `0:60.000` for values like 59.9996 s; now rounds to ms first (moved to `src/lib/motion.ts`, tested).
- Data: Tsunoda removed from `public/data/drivers.json` again (22 grid drivers).
- Tests: `npm run test:motion` (7 tests). See `DESIGN_CONCEPT.md` for the full concept.
