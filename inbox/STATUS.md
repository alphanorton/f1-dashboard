# ERROR - round 23 (data check failed)

_2026-11-22 08:11 UTC_

```
=== EHI F1 DATA INTEGRITY AUDIT ===

Completed events: 21; cancelled schedule slots: 2; race-result snapshots: 21
Audit result: 4 error(s), 0 warning(s).
FAIL  driver standings contain 22 drivers
FAIL  driver numbers agree between standings.json and drivers.json
FAIL  driver numbers are unique on the 2026 grid
FAIL  every driver in the standings has a headshot (missing: TSU, HIR, CAM)
```

Nothing was changed. Fix `inbox/race.txt` and save it again.
