#!/usr/bin/env python3
"""Add a finished race to the dashboard data in one go.

Updates public/data/{results,standings,calendar,fastest_laps_2026}.json together so they can't drift apart.

Usage:
  python3 tools/add-race.py race.json            # apply
  python3 tools/add-race.py race.json --dry-run  # show what would change, write nothing
  python3 tools/add-race.py race.json --root /path/to/project

race.json (see tools/race.example.json):
  round            project round number (the calendar.json round)
  officialRound    optional, official FIA round number
  date, circuit, distanceKm, raceLaps, winnerTime, poleTime, note   (all optional but recommended)
  results          list in finishing order: {code, status ("Finished"|"DNF"|"DNS"), gap, laps}
                   - give "pos" only for classified drivers; leave it out for unclassified retirements
  sprintResults    optional, driver codes in sprint finishing order (sprint weekends); points go to the standings
  expectPoints     optional {code: points} from the official standings; the run is refused if any total differs
  fastestLap       optional {code, lap_number, lap_time ("1:37.976"), s1, s2, s3, source}
                   - s1..s3 in seconds; leave them out if unknown (they stay null, never guessed)

Points: 25-18-15-12-10-8-6-4-2-1 for the top ten classified drivers (no fastest-lap point in 2026),
8-7-6-5-4-3-2-1 for the sprint. Standings are updated by adding this race's points, because the existing
standings already include sprint points that results.json doesn't hold. Re-running the same round is refused.
"""
import argparse, json, os, sys, copy

GP_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1]


def load(path):
    raw = open(path, 'rb').read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    return json.loads(text), bom, text


def save(path, obj, bom, orig):
    indent = 2 if '\n  "' in orig else None
    s = json.dumps(obj, ensure_ascii=False, indent=indent)
    if orig.endswith('\n'): s += '\n'
    tmp = path + '.tmp'
    open(tmp, 'wb').write((b'\xef\xbb\xbf' if bom else b'') + s.encode('utf-8'))
    os.replace(tmp, path)


def parse_lap(v):
    if v is None: return None
    if isinstance(v, (int, float)): return float(v)
    m, s = v.split(':') if ':' in v else ('0', v)
    return round(int(m) * 60 + float(s), 3)


def f9_name(name):
    """'Charles Leclerc' -> 'Charles LECLERC' (the format fastest_laps_2026.json uses)."""
    parts = name.split()
    return ' '.join(parts[:-1] + [parts[-1].upper()])


def die(msg):
    print('ERROR:', msg); sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('race'); ap.add_argument('--root', default=os.path.join(os.path.dirname(__file__), '..'))
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    data = os.path.join(a.root, 'public', 'data')
    race = json.load(open(a.race, encoding='utf-8'))
    rnd = str(race['round'])

    files = {n: load(os.path.join(data, n + '.json')) for n in ('results', 'standings', 'calendar', 'fastest_laps_2026')}
    results, standings, calendar, fl = (files[n][0] for n in ('results', 'standings', 'calendar', 'fastest_laps_2026'))

    if rnd in results['races']: die(f'round {rnd} is already in results.json (refusing to add points twice)')
    cal = next((r for r in calendar['races'] if str(r['round']) == rnd), None)
    if not cal: die(f'round {rnd} is not in calendar.json')
    drivers = {d['code']: d for d in standings['drivers']}

    # ---- classification ----
    rows, pts_gp = [], {}
    classified = [r for r in race['results'] if r.get('pos') is not None]
    if [r['pos'] for r in classified] != list(range(1, len(classified) + 1)):
        die('classified positions must be 1..N in order with no gaps')
    seen = set()
    for r in race['results']:
        c = r['code']
        if c not in drivers: die(f'unknown driver code {c} (not in standings.json)')
        if c in seen: die(f'driver {c} listed twice')
        seen.add(c)
        p = r.get('pos')
        pts = GP_POINTS[p - 1] if p is not None and p <= len(GP_POINTS) and r.get('status', 'Finished') != 'DNS' else 0
        pts_gp[c] = pts
        row = dict(pos=p, driver=drivers[c]['name'], code=c, team=drivers[c]['team'], status=r.get('status', 'Finished'), points=pts)
        if 'gap' in r: row['gap'] = r['gap']
        if 'laps' in r: row['laps'] = r['laps']
        rows.append(row)
    if not any(r['pos'] == 1 for r in rows): die('no winner (pos 1) in results')

    sprint_pts = {}
    for i, c in enumerate(race.get('sprintResults', [])):
        if c not in drivers: die(f'unknown sprint driver code {c}')
        if i < len(SPRINT_POINTS): sprint_pts[c] = SPRINT_POINTS[i]
    delta = {c: pts_gp.get(c, 0) + sprint_pts.get(c, 0) for c in drivers}

    # ---- results.json ----
    entry = {"round": race['round'], "officialRound": race.get('officialRound'), "name": cal['name'],
             "date": race.get('date', cal['date']), "circuit": race.get('circuit', cal.get('circuit')),
             "distanceKm": race.get('distanceKm'), "raceLaps": race.get('raceLaps'),
             "winnerTime": race.get('winnerTime'), "poleTime": race.get('poleTime'),
             "resultsNote": race.get('note'), "results": rows}
    if sprint_pts: entry['sprintResults'] = race['sprintResults']
    results['races'][rnd] = {k: v for k, v in entry.items() if v is not None}
    results['asOfRound'] = race['round']; results['asOfDate'] = entry['date']
    if race.get('officialRound') is not None: results['officialAsOfRound'] = race['officialRound']

    # ---- standings.json ----
    prev_pos = {d['code']: d['position'] for d in standings['drivers']}
    for d in standings['drivers']: d['points'] += delta[d['code']]
    standings['drivers'].sort(key=lambda d: (-d['points'], prev_pos[d['code']]))
    lead = standings['drivers'][0]['points']
    for i, d in enumerate(standings['drivers'], 1): d['position'] = i; d['gap'] = lead - d['points']
    team_delta = {}
    for c, p in delta.items(): team_delta[drivers[c]['team']] = team_delta.get(drivers[c]['team'], 0) + p
    for t in standings['constructors']:
        t['points'] += team_delta.get(t['shortName'], 0)
    unknown = set(team_delta) - {t['shortName'] for t in standings['constructors']}
    if unknown: die(f'driver teams not found among constructors: {unknown}')
    standings['constructors'].sort(key=lambda t: (-t['points'], t['position']))
    tl = standings['constructors'][0]['points']
    for i, t in enumerate(standings['constructors'], 1): t['position'] = i; t['gap'] = tl - t['points']

    # ---- cross-check against the official standings pasted by the user (optional) ----
    expect = race.get('expectPoints') or {}
    bad = [f"{c}: computed {drivers_after[c]} vs official {v}" for c, v in expect.items() if c in (drivers_after := {d['code']: d['points'] for d in standings['drivers']}) and drivers_after[c] != v]
    if bad: die('points do not match the official standings -> ' + '; '.join(bad))
    missing = sorted(c for c in expect if c not in drivers)
    if missing: print('Note: in the official standings but not in this project (ignored):', ', '.join(missing))

    # ---- calendar.json ----
    winner = next(r for r in rows if r['pos'] == 1)
    fmt = lambda r: f"{r['driver']} ({r['team']})"
    cal['status'] = 'completed'
    if race.get('officialRound') is not None: cal['officialRound'] = race['officialRound']
    cal['winner'] = fmt(winner)
    cal['podium'] = [fmt(r) for r in rows if r['pos'] in (1, 2, 3)]
    if race.get('note'): cal['notes'] = race['note']
    later = sorted((r for r in calendar['races'] if r['status'] in ('upcoming', 'next') and r['round'] > cal['round']), key=lambda r: r['round'])
    for r in calendar['races']:
        if r['status'] == 'next': r['status'] = 'upcoming'
    if later: later[0]['status'] = 'next'
    calendar['asOfDate'] = entry['date']
    nxt = later[0] if later else None
    standings.update(asOfRound=race['round'], asOfRace=cal['name'],
                     asOfLocation=', '.join(x for x in (cal.get('locality'), cal.get('country')) if x),
                     asOfStatus='Completed', nextRound=nxt['round'] if nxt else None,
                     nextGrandPrix=nxt['name'] if nxt else None, lastUpdated=entry['date'], remainingRaces=len(later))
    if race.get('officialRound') is not None:
        standings['officialAsOfRound'] = race['officialRound']; standings['officialNextRound'] = race['officialRound'] + 1

    # ---- fastest lap ----
    if race.get('fastestLap'):
        f = race['fastestLap']; c = f['code']
        if c not in drivers: die(f'unknown fastest-lap driver {c}')
        lt = parse_lap(f['lap_time']); secs = [f.get('s1'), f.get('s2'), f.get('s3')]
        have = all(s is not None for s in secs)
        verified = bool(have and abs(sum(secs) - lt) <= 0.002)
        item = {"round": race.get('officialRound', race['round']), "projectRound": race['round'], "grand_prix": cal['name'],
                "circuit": f.get('circuit_id'), "date": entry['date'], "driver_name": f9_name(drivers[c]['name']),
                "driver_code": c, "team": drivers[c]['team'], "lap_number": f.get('lap_number'), "lap_time": lt,
                "s1": secs[0], "s2": secs[1], "s3": secs[2], "source": f.get('source', 'add-race.py input'), "verified": verified}
        fl['races'].append(item)
        if not verified:
            why = 'sector times missing' if not have else f'sectors sum to {sum(secs):.3f} but lap time is {lt:.3f}'
            fl.setdefault('needs_review', []).append({"round": item['round'], "grand_prix": cal['name'], "reason": why,
                                                       "driver_code": c, "lap_time": lt, "lap_number": f.get('lap_number')})
        fl['asOfDate'] = entry['date']

    # ---- report ----
    print(f"Round {rnd}: {cal['name']} - winner {winner['driver']}")
    print('Points added:', ', '.join(f"{c} +{p}" for c, p in sorted(delta.items(), key=lambda x: -x[1]) if p))
    print('Top 5 drivers:', ', '.join(f"{d['code']} {d['points']}" for d in standings['drivers'][:5]))
    print('Constructors:', ', '.join(f"{t['shortName']} {t['points']}" for t in standings['constructors'][:4]), '...')
    print('Next race:', nxt['name'] if nxt else '- (season finished)', '| races left:', len(later))
    if race.get('fastestLap'): print('Fastest lap:', item['driver_code'], item['lap_time'], 'verified' if item['verified'] else 'NOT verified (see needs_review)')
    if a.dry_run: print('\n--dry-run: nothing written'); return
    for n, key in (('results', results), ('standings', standings), ('calendar', calendar), ('fastest_laps_2026', fl)):
        _, bom, orig = files[n]
        save(os.path.join(data, n + '.json'), key, bom, orig)
    print('\nWritten: results, standings, calendar, fastest_laps_2026')


if __name__ == '__main__':
    main()
