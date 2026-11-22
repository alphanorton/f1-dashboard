# ERROR - round 23 (data check failed)

_2026-11-22 06:49 UTC_

```
=== EHI F1 DATA INTEGRITY AUDIT ===

Completed events: 21; cancelled schedule slots: 2; race-result snapshots: 21
Audit result: 2 error(s), 2 warning(s).
WARN  TSU scored 1 point(s) in results.json but is missing from the drivers' standings
WARN  HIR scored 1 point(s) in results.json but is missing from the drivers' standings
FAIL  standings wins/podiums/sprintPoints are out of date: run `node tools/derive-standings-stats.cjs --write`
FAIL  some traced outlines run against the real lap direction: run `node tools/orient-track-paths.cjs --write`
```

Nothing was changed. Fix `inbox/race.txt` and save it again.
