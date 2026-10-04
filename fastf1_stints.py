import json
import sys

import fastf1

fastf1.Cache.enable_cache('cache/fastf1')

try:
    schedule = fastf1.get_event_schedule(2026)
    name = None
    for _, r in schedule.iterrows():
        ev = str(r.get('EventName', ''))
        if 'Malaysia' in ev or 'Bahrain' in ev:
            name = ev
            print('event:', name, '| round', r.get('RoundNumber'), '| date', r.get('EventDate'))
    if name is None:
        print('event not found in 2026 schedule')
        sys.exit(0)
    session = fastf1.get_session(2026, name, 'R')
    session.load()
    stints = session.stints
    rows = []
    for _, r in stints.iterrows():
        rows.append({
            'driver': str(r.get('Driver')),
            'stint': int(r.get('StintNumber')),
            'compound': str(r.get('Compound')),
            'start': int(r.get('LapNumber')),
            'end': int(r.get('LapEnd')),
            'tyres': str(r.get('Tyres')),
        })
    print('stint rows:', len(rows))
    print(json.dumps(rows[:6], indent=1))
    with open('cache/round-16-bahrain-malaysia/fastf1_stints.json', 'w') as f:
        json.dump(rows, f, indent=1)
except Exception as exc:  # noqa: BLE001
    print('FASTF1 ERROR:', type(exc).__name__, exc)
    sys.exit(0)
