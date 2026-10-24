# Ehi F1 project — audit and fixes

## Fixed in this pass

- Replaced stale, hard-coded result comparison fixtures in `check-all.cjs`, `verify-results.cjs`, and `verify-final.cjs`. Those fixtures disagreed with the project's current calendar/round mapping and incorrectly marked valid snapshots as wrong. The commands now delegate to the cross-file integrity audit.
- Added `audit-data.cjs`, covering calendar rows and status, completed-race coverage, calendar/result names and dates, winner consistency, 22-driver classifications, duplicate driver codes/positions, points/status fields, championship standings ordering/gaps, source-data shape, detailed Sepang round mapping, and tyre-stint ranges/confidence.
- Corrected championship validation to treat gaps as leader points minus each driver's/team's points (the displayed gap is a positive deficit, not a negative delta).
- Updated the detailed round-16 verifier to respect the explicit mapping between official round 16 (Bahrain GP in Malaysia) and project calendar round 18, while standings are correctly current through Singapore (project round 19 / official round 17).
- Corrected season progress to exclude cancelled races from its denominator, and corrected `calendar.json.totalRounds` to count active scheduled races rather than all schedule rows including cancelled slots.
- Added repeatable npm scripts for data audit and tyre helper tests, and documented them in the README.

## Checks run

- `npm run test`: PASS (13 tyre helper assertions plus data-integrity audit, 0 errors / 0 warnings).
- `node verify-round-16.cjs`: PASS (all detailed classification, fastest-lap, tyre-stint, standings and cross-file checks).
- `node verify-rounds.cjs`: PASS (calendar/result round mapping).
- `npm run typecheck`: BLOCKED because the existing `node_modules` is incomplete; TypeScript type packages are missing.
- `npm run build`: BLOCKED because Vite is absent from the incomplete `node_modules` and `npx` could not complete within the environment timeout. `npm ci` also timed out, so a clean build could not be honestly certified here.

## Important limitation

The checks establish internal data consistency, not that every historical race result has been independently re-scraped from Formula 1/FIA. The files contain a dated snapshot; refresh/verify race classifications against official sources before publishing newer data. No missing race classification was invented for the two cancelled original calendar slots.
