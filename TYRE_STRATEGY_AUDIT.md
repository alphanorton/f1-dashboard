# Tyre Strategy update and audit

## Changes
- Removed the user-facing `Unknown` tyre compound option. Unsupported or absent compound values now normalize to `null` and are excluded from compound legends, charts, and stint timelines instead of being rendered as a tyre type.
- Added a 2026 race-by-race Pirelli nomination dataset with Hard / Medium / Soft compound codes.
- Added a highlighted selected-event allocation card and a collapsible all-season overview with source links.
- Marked cancelled events as cancelled and nominations not yet published as pending. No compound is guessed for those events.
- Kept actual driver stint visualizations separate from official weekend nominations. Actual stints continue to come from OpenF1/local curated data when available.
- Added tests for allocation matching, the Madrid/Barcelona distinction, and the Sepang replacement vs cancelled Bahrain race.

## Data interpretation
The C1-C5 codes below are the official dry compounds nominated for a weekend, mapped to Hard / Medium / Soft for that event. This is not a claim that every driver used all three compounds during the race. Driver-by-driver use requires session stint data. For future events, or where OpenF1 has no published stints, the interface shows the known nomination and does not fabricate race usage.

## Sources
- Pirelli 2026 nominations for Australia, China, Japan: https://press.pirelli.com/complete-f1-tyre-range-for-the-first-three-grands-prix-of-2026/
- Miami and Canada: https://press.pirelli.com/the-softest-trio-for-the-challenges-of-miami-and-montreal/
- Monaco and Barcelona: https://press.pirelli.com/the-tyre-compound-selections-for-monte-carlo-and-barcelona/
- Austria and Britain: https://press.pirelli.com/the-full-pirelli-range-for-spielberg-and-silverstone/
- Belgium and Hungary: https://press.pirelli.com/the-compounds-selected-for-belgium-and-hungary/
- Netherlands, Italy and Madrid: https://press.pirelli.com/tyre-compounds-selected-for-zandvoort-monza-and-madrid/
- Azerbaijan, Sepang replacement and Singapore: https://press.pirelli.com/tyre-compound-selections-for-baku-sepang-and-singapore/
- Austin, Mexico and São Paulo: https://press.pirelli.com/the-compound-selection-for-austin-mexico-city-and-so-paulo/
- General tyre compound explanation: https://www.formula1.com/en/latest/article/the-beginners-guide-to-f1-tyres.61SvF0Kfg29UR2SPhakDqd

## Checks
- Tyre strategy helper tests: 13 passed.
- Preset parsing tests: 5 passed.
- Allocation mapping tests: passed.
- Data integrity audit: 0 errors, 0 warnings.
- TypeScript check and production build could not be completed in this environment because dependencies are incomplete and package installation timed out. Run `npm ci`, then `npm run typecheck` and `npm run build` locally before deployment.
