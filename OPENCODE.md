# F1 Dashboard 2026 - OpenCode Workflow Guide

**Last Updated**: October 23, 2026  
**Current Season**: 2026  
**Completed Races**: Round 1-19  
**Next Race**: Round 20 - United States Grand Prix (Circuit of the Americas, October 25, 2026)

---

## Overview

This F1 dashboard is a **data-driven application** where race results are stored in JSON files and automatically displayed throughout the UI. There is **no manual results editor** in the dashboard interface.

All race result updates are made by **editing source data files** and running validation scripts.

---

## Architecture Summary

### Data Flow
```
public/data/results.json (source of truth)
    ↓
src/services/f1DataService.ts (loads results)
    ↓
Dashboard displays results automatically
    ↓
calc-standings.cjs (recalculates points)
    ↓
public/data/standings.json (updated standings)
```

### Key Files

**Race Data (SOURCE OF TRUTH)**
- `public/data/results.json` - All race results (Round 1-19 currently)
- `public/data/calendar.json` - Race schedule, dates, circuits
- `public/data/standings.json` - Driver and constructor standings

**Calculation Scripts**
- `calc-standings.cjs` - Calculates championship standings from results.json

**UI Components (DO NOT EDIT FOR ROUTINE UPDATES)**
- `src/pages/GrandPrix.tsx` - Race calendar and results display
- `src/pages/Standings.tsx` - Championship standings display
- `src/services/f1DataService.ts` - Data loading service
- All other React components

**Models and Utilities**
- `src/models/grandPrix.ts` - Type definitions, driver lineup, points system
- `DRIVERS_2026` - Current 22-driver lineup with codes and teams

---

## How to Add or Update Race Results

### Step 1: Prepare Race Results Data

Obtain verified official race results including:
- Finishing positions (1-22)
- Driver codes (VER, HAM, LEC, etc.)
- Team names (must match existing results.json format)
- Race status for each driver: "Finished", "DNF", "DNS", "DSQ", or "NC"
- Points awarded (usually auto-calculated from position)
- Optional: gap to leader, laps completed

**IMPORTANT**: Use driver **codes**, not full names. See `DRIVERS_2026` in `src/models/grandPrix.ts` for the official list.

### Step 2: Edit `public/data/results.json`

Open `public/data/results.json` and add a new race entry under `"races"` object:

```json
"20": {
  "round": 20,
  "name": "United States Grand Prix",
  "date": "2026-10-25",
  "circuit": "Circuit of the Americas",
  "results": [
    {
      "pos": 1,
      "driver": "Max Verstappen",
      "code": "VER",
      "team": "Red Bull Racing",
      "status": "Finished",
      "points": 25,
      "gap": "1:34:12.345",
      "laps": 56
    },
    {
      "pos": 2,
      "driver": "Charles Leclerc",
      "code": "LEC",
      "team": "Ferrari",
      "status": "Finished",
      "points": 18,
      "gap": "+5.123",
      "laps": 56
    }
    // ... continue for all drivers
  ]
}
```

**Field Requirements**:
- `pos` - Required for classified finishers, use `null` for unclassified (DNS, DSQ, NC)
- `driver` - Full name (e.g., "Max Verstappen")
- `code` - Three-letter driver code (VER, HAM, LEC, etc.)
- `team` - Team name (match existing format exactly)
- `status` - "Finished", "DNF", "DNS", "DSQ", or "NC"
- `points` - Integer 0-25 (use 0 for non-point scorers)
- `gap` - Optional, string like "+5.123" or "+1 lap" or "DNF"
- `laps` - Optional, integer for laps completed

### Step 3: Update Metadata

At the top of `results.json`, update:
```json
{
  "season": 2026,
  "asOfRound": 20,  // <-- Increment this
  "asOfDate": "2026-10-25",  // <-- Update date
  "source": "Official FIA Classification 2026",
  "pointsSystem": "25-18-15-12-10-8-6-4-2-1",
  "races": { ... }
}
```

### Step 4: Recalculate Championship Standings

Run the standings calculator:

```bash
node calc-standings.cjs
```

This will:
1. Read all races from `results.json`
2. Calculate driver championship standings
3. Calculate constructor championship standings
4. Print results to console

**IMPORTANT**: The current `calc-standings.cjs` is hardcoded to process rounds 1-14 only. You must update the loop range:

```javascript
// OLD:
for (let r = 1; r <= 14; r++) {

// NEW (after Round 20):
for (let r = 1; r <= 20; r++) {
```

### Step 5: Update `public/data/standings.json`

Manually update `standings.json` based on calc-standings.cjs output, or write a script to generate it automatically.

Update:
- `asOfRound` to current round
- `asOfRace` to current race name
- `lastUpdated` to current date
- `remainingRaces` count
- Driver standings array
- Constructor standings array

### Step 6: Update `public/data/calendar.json`

Mark the completed race in `calendar.json`:

```json
{
  "round": 20,
  "name": "United States Grand Prix",
  "status": "completed",  // <-- Change from "next" to "completed"
  "winner": "Max Verstappen (Red Bull Racing)",  // <-- Add winner
  "podium": [  // <-- Add podium
    "Max Verstappen (Red Bull Racing)",
    "Charles Leclerc (Ferrari)",
    "Lando Norris (McLaren)"
  ]
}
```

And mark the next race as `"status": "next"`.

### Step 7: Validate and Test

```bash
# TypeScript type check
npm run typecheck

# Build the application
npm run build

# Start dev server to visually verify
npm run dev
```

Check:
- Grand Prix page shows the new result
- Standings page reflects updated points
- Podium displays correctly
- No console errors

---

## Common Update Scenarios

### Scenario 1: Add Results for Next Race

```bash
# Example: United States Grand Prix (Round 20)

1. Obtain official results from FIA or trusted source
2. Edit public/data/results.json - add "20": { ... }
3. Update asOfRound to 20 at top of results.json
4. Update calc-standings.cjs loop to: for (let r = 1; r <= 20; r++)
5. Run: node calc-standings.cjs
6. Update public/data/standings.json with new totals
7. Update public/data/calendar.json - mark R20 as completed, R21 as next
8. Run: npm run typecheck && npm run build
9. Verify in browser
```

### Scenario 2: Correct a Result

```bash
# Example: Fix position for driver in Round 18

1. Edit public/data/results.json
2. Find "18": { "results": [ ... ] }
3. Update the incorrect driver entry
4. Re-run: node calc-standings.cjs
5. Update public/data/standings.json with corrected totals
6. Run: npm run typecheck && npm run build
7. Verify changes
```

### Scenario 3: Add DNF or DSQ

```json
{
  "pos": null,  // <-- Use null for unclassified
  "driver": "Lewis Hamilton",
  "code": "HAM",
  "team": "Ferrari",
  "status": "DNF",  // <-- Or "DNS", "DSQ", "NC"
  "points": 0,
  "gap": "DNF (43 laps)",
  "laps": 43
}
```

---

## Data Validation

### Driver Code Validation

Before adding results, verify all driver codes are in `DRIVERS_2026`:

```
VER, HAD, NOR, PIA, LEC, HAM, RUS, ANT, ALO, STR,
GAS, COL, SAI, ALB, BEA, OCO, HUL, BOR, LAW, LIN,
PER, BOT
```

### Team Name Consistency

Use **exact** team names as they appear in previous results:
- `"Red Bull Racing"` (not "Oracle Red Bull Racing" in results.json)
- `"Mercedes"` (not "Mercedes-AMG Petronas F1 Team")
- `"Ferrari"` (not "Scuderia Ferrari HP")
- `"McLaren"` (short form)

**Check existing results.json for the correct format used in this project.**

### Points Validation

Official F1 2026 points system:
```
P1:  25 points
P2:  18 points
P3:  15 points
P4:  12 points
P5:  10 points
P6:   8 points
P7:   6 points
P8:   4 points
P9:   2 points
P10:  1 point
P11+: 0 points
```

Only drivers with `status: "Finished"` and `pos <= 10` score points.

### Duplicate Detection

Before committing, check:
- No duplicate driver codes in same race
- No duplicate positions (except null)
- Round number not already used
- All 22 drivers accounted for (or explain absences in notes)

---

## Files Changed During Routine Updates

**ALWAYS EDIT**:
- ✅ `public/data/results.json`
- ✅ `public/data/standings.json`
- ✅ `public/data/calendar.json`
- ✅ `calc-standings.cjs` (loop range only)

**NEVER EDIT FOR ROUTINE UPDATES**:
- ❌ `src/pages/GrandPrix.tsx`
- ❌ `src/pages/Standings.tsx`
- ❌ `src/services/f1DataService.ts`
- ❌ Any React component files
- ❌ `src/models/grandPrix.ts` (unless driver lineup changes)

---

## Next 5 Races

Based on `calendar.json`:

| Round | Race | Circuit | Date | Status |
|-------|------|---------|------|--------|
| 20 | United States GP | Circuit of the Americas | 2026-10-25 | Next |
| 21 | Mexico City GP | Autódromo Hermanos Rodríguez | 2026-11-01 | Upcoming |
| 22 | São Paulo GP | Interlagos | 2026-11-08 | Upcoming |
| 23 | Las Vegas GP | Las Vegas Street Circuit | 2026-11-22 | Upcoming |
| 24 | Qatar GP | Losail International Circuit | 2026-11-29 | Upcoming |

---

## Troubleshooting

### Dashboard Not Showing New Results

**Cause**: Browser cache or localStorage
**Fix**: 
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check browser console for errors

### calc-standings.cjs Shows Wrong Totals

**Cause**: Loop not updated to include new rounds
**Fix**: Update `for (let r = 1; r <= X; r++)` to include all completed rounds

### TypeScript Errors After Update

**Cause**: Data structure mismatch
**Fix**: 
1. Run `npm run typecheck` to see exact errors
2. Verify JSON structure matches existing format
3. Check all required fields are present

### Standings Not Matching Official

**Cause**: Missing race data or calculation error
**Fix**:
1. Verify all races in results.json
2. Check points calculations
3. Verify no duplicate counting
4. Re-run calc-standings.cjs

---

## Testing Workflow

After updating race results:

```bash
# 1. Type check
npm run typecheck

# 2. Build production bundle
npm run build

# 3. Start dev server for visual check
npm run dev
# Navigate to http://localhost:5173

# 4. Verify:
# - Grand Prix page shows new race result
# - Race appears in calendar with "completed" status
# - Standings page updated correctly
# - Podium displays correctly
# - No console errors in browser
```

---

## Advanced: Automated Standings Generation

Current `calc-standings.cjs` only prints to console. For automation:

```javascript
// Add at the end of calc-standings.cjs:

const fs = require('fs');
const standingsData = {
  season: 2026,
  asOfRound: 20, // Update this
  asOfRace: "United States Grand Prix",
  lastUpdated: "2026-10-25",
  remainingRaces: 5,
  drivers: sorted.map(([code, pts], i) => ({
    position: i + 1,
    code,
    name: driverNames[code], // Need to add name mapping
    team: driverTeam[code],
    points: pts,
    wins: driverWins[code],
    podiums: driverPodiums[code],
    gap: i === 0 ? 0 : sorted[0][1] - pts
  })),
  constructors: sortedCon.map(([team, pts], i) => ({
    position: i + 1,
    name: team,
    points: pts,
    wins: constructorWins[team],
    podiums: constructorPodiums[team],
    gap: i === 0 ? 0 : sortedCon[0][1] - pts
  }))
};

fs.writeFileSync('public/data/standings.json', JSON.stringify(standingsData, null, 2));
console.log('✅ Standings written to public/data/standings.json');
```

---

## LocalStorage Cleanup

The removed manual editor used localStorage keys like:
```
race_results_2026_[round]
```

If old editor data exists, clear it:
```javascript
// Run in browser console:
Object.keys(localStorage)
  .filter(k => k.startsWith('race_results_'))
  .forEach(k => localStorage.removeItem(k));
```

Or simply clear all site data in browser dev tools.

---

## Summary: Quick Reference

**To add race results through OpenCode:**

```
"Add official results for [Race Name]. 
The race was won by [Winner], with [P2] second and [P3] third. 
[Include any DNFs or notable events].
Update results.json, recalculate standings, update calendar.json, 
run typecheck and build, report files changed."
```

OpenCode should then:
1. ✅ Edit `public/data/results.json` (add race entry)
2. ✅ Update metadata (asOfRound, asOfDate)
3. ✅ Update `calc-standings.cjs` loop range
4. ✅ Run `node calc-standings.cjs`
5. ✅ Update `public/data/standings.json`
6. ✅ Update `public/data/calendar.json` (status, winner, podium)
7. ✅ Run `npm run typecheck`
8. ✅ Run `npm run build`
9. ✅ Report exactly which files changed
10. ✅ Report if tests/build passed or failed

**Files typically modified per race update**: 3-4 files
- `results.json` (add race)
- `standings.json` (update totals)
- `calendar.json` (mark completed, update next)
- `calc-standings.cjs` (extend loop range)

---

## Notes

- This dashboard uses **static JSON files** as the source of truth, not a database
- Results are loaded by `f1DataService.ts` from `/data/*.json`
- The UI automatically reflects changes when JSON files are updated
- No API calls are made for 2026 data (custom season)
- Sprint races use same points system as main races in this implementation
- Fastest lap bonus points are **not** implemented (2026 rules may differ)

---

**End of OpenCode Workflow Guide**
