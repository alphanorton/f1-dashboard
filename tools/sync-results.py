#!/usr/bin/env python3
"""Automatic race-result sync from the free Jolpica-Ergast API (https://api.jolpi.ca/ergast/f1/).

Runs from a GitHub Action (.github/workflows/sync-results.yml). It does NOT replace the offline JSON files or
the manual inbox/race.txt flow: it only builds the same race description that inbox.py builds and hands it to
tools/add-race.py, so every rule (points, standings, guests, calendar, audit, rollback) is shared.

Safety rules
  * Zero API calls unless calendar.json has a race that is due (status "next" and its date is today or earlier).
  * While waiting for results: one request per run. When results exist: results + standings (+ sprint) only.
  * A race is applied only after the API returned the SAME classification on two runs at least SETTLE_MINUTES
    apart (so preliminary results that are changed by post-race penalties are not taken), and only if
      - the classification is complete and its points follow 25-18-15-12-10-8-6-4-2-1,
      - the computed championship points equal the API's official driver standings,
      - the usual data audit passes.
    Anything else leaves every data file untouched (automatic rollback) and is explained in inbox/SYNC-STATUS.md.
  * If the API is down or answers with something unexpected, nothing changes and the run ends normally.
  * For 2 days after an automatic add, the classification is re-checked every 3 hours; if the FIA changed it
    (late penalties) the race is replaced, with the same checks.

  python3 tools/sync-results.py [--root DIR] [--dry-run] [--now 2026-11-22T10:00:00Z] [--base URL] [--settle-minutes N]
"""
import argparse, datetime as dt, hashlib, json, os, shutil, subprocess, sys, tempfile, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
BASE_DEFAULT = 'https://api.jolpi.ca/ergast/f1'
UA = 'ehi-f1-dashboard-sync/1.0 (GitHub Action; free API, low volume)'
DATA_FILES = ('results', 'standings', 'calendar', 'fastest_laps_2026')
GP_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
SETTLE_MINUTES = 90          # classification must be unchanged for this long before it is applied
STANDINGS_PATIENCE_H = 24    # if the API standings still lag after this long, apply without that cross-check
RECHECK_WINDOW_H = 48        # after an automatic add, look for late penalties for this long
RECHECK_EVERY_H = 3
MAX_RACES_PER_RUN = 3


class ApiDown(Exception):   # network / HTTP problem: change nothing, finish quietly
    pass


class Wait(Exception):      # data not ready yet: change nothing, finish quietly
    pass


class Refuse(Exception):    # data present but not acceptable: change nothing, explain in SYNC-STATUS.md
    pass


# ---------------------------------------------------------------- small helpers
def utcnow():
    return dt.datetime.now(dt.timezone.utc)


def parse_ts(s):
    return dt.datetime.fromisoformat(s.replace('Z', '+00:00'))


def iso(t):
    return t.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def read_json(path, default=None):
    if not os.path.exists(path): return default
    return json.load(open(path, encoding='utf-8-sig'))


def pause(sec):
    time.sleep(float(os.environ.get('SYNC_PAUSE', sec)))


def get_json(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            last = f'HTTP {e.code}'
            if e.code not in (429, 500, 502, 503, 504): break
            ra = e.headers.get('Retry-After') if e.headers else None
            pause(min(int(ra), 30) if ra and ra.isdigit() else 2 * (i + 1))
        except (urllib.error.URLError, TimeoutError, ConnectionError, ValueError) as e:
            last = f'{type(e).__name__}: {e}'
            pause(2 * (i + 1))
    raise ApiDown(f'{url} -> {last}')


def mrdata(j):
    if not isinstance(j, dict) or not isinstance(j.get('MRData'), dict): raise Refuse('the API answer has an unexpected shape (no MRData)')
    return j['MRData']


# ---------------------------------------------------------------- API -> race description
def fetch_results(base, season, rnd):
    md = mrdata(get_json(f'{base}/{season}/{rnd}/results.json?limit=100'))
    races = (md.get('RaceTable') or {}).get('Races') or []
    if not races: raise Wait(f'official round {rnd}: results are not published yet')
    race = races[0]
    if str(race.get('round')) != str(rnd): raise Refuse(f'asked for round {rnd} but the API returned round {race.get("round")}')
    if not race.get('Results'): raise Wait(f'official round {rnd}: the race exists but has no results yet')
    return race


def fetch_schedule_round(base, season, date):
    """Only used when round numbers disagree: find the API round whose date equals the calendar date."""
    md = mrdata(get_json(f'{base}/{season}.json?limit=40'))
    for r in (md.get('RaceTable') or {}).get('Races') or []:
        if r.get('date') == date: return int(r['round'])
    return None


def fetch_sprint(base, season, rnd):
    md = mrdata(get_json(f'{base}/{season}/{rnd}/sprint.json?limit=40'))
    races = (md.get('RaceTable') or {}).get('Races') or []
    if not races or not races[0].get('SprintResults'): raise Wait(f'official round {rnd}: sprint results are not published yet')
    return races[0]['SprintResults']


def fetch_standings(base, season, rnd):
    """{code: points} after this round, or None while the API standings still show an earlier round."""
    md = mrdata(get_json(f'{base}/{season}/{rnd}/driverStandings.json?limit=60'))
    lists = (md.get('StandingsTable') or {}).get('StandingsLists') or []
    if not lists or str(lists[0].get('round')) != str(rnd): return None
    out = {}
    for s in lists[0].get('DriverStandings') or []:
        code = (s.get('Driver') or {}).get('code')
        if code: out[code] = int(round(float(s['points'])))
    return out or None


def classify_status(position_text, status):
    st = (status or '').strip()
    if position_text.isdigit(): return 'Finished' if st == 'Finished' or st.startswith('+') else 'DNF'
    if position_text in ('D', 'E'): return 'DSQ'
    if position_text == 'W' or 'did not start' in st.lower() or 'withdrew' in st.lower(): return 'DNS'
    return 'DNF'


def build_race(api_race, cal, calendar_races, standings_local, results_local, sprint_rows, expect):
    rows_in = api_race['Results']
    regular = {d['code']: d for d in standings_local['drivers']}
    teams = {t['shortName'] for t in standings_local['constructors']}

    classified, others = [], []
    for r in rows_in:
        code = (r.get('Driver') or {}).get('code')
        if not code: raise Refuse(f"a driver in the API result has no 3-letter code ({(r.get('Driver') or {}).get('familyName')})")
        pt = str(r.get('positionText', ''))
        st = classify_status(pt, r.get('status'))
        item = {'code': code, 'status': st, 'api': r}
        if pt.isdigit(): item['pos'] = int(pt); classified.append(item)
        else: others.append(item)
    classified.sort(key=lambda x: x['pos'])
    if len(classified) < 10: raise Refuse(f'only {len(classified)} classified drivers in the API result; expected at least 10')
    if [c['pos'] for c in classified] != list(range(1, len(classified) + 1)): raise Refuse('classified positions in the API result are not 1..N without gaps')
    seen = set()
    for it in classified + others:
        if it['code'] in seen: raise Refuse(f"driver {it['code']} appears twice in the API result")
        seen.add(it['code'])
    for it in classified + others:   # the project awards 25-18-...-1 only; anything else (half points, a changed system) is not automatic
        want = GP_POINTS[it['pos'] - 1] if it.get('pos') and it['pos'] <= 10 else 0
        got = float(it['api'].get('points', 0) or 0)
        if abs(got - want) > 1e-9: raise Refuse(f"API gives {it['code']} {got:g} points but the project's points system gives {want}: shortened race or a rule change, add this race by hand with inbox/race.txt")

    # guests: drivers who are not in the 22-driver standings (one-off or replacement drivers)
    ctor_teams = {}
    for it in classified + others:
        if it['code'] in regular:
            cid = (it['api'].get('Constructor') or {}).get('constructorId')
            if cid: ctor_teams.setdefault(cid, set()).add(regular[it['code']]['team'])
    history = {}
    for k in sorted(results_local.get('races', {}), key=int):
        for row in results_local['races'][k].get('results', []):
            if row.get('code') and row.get('team') and row.get('driver'): history[row['code']] = (row['driver'], row['team'])
    guests = {}
    for it in classified + others:
        c = it['code']
        if c in regular: continue
        d = it['api'].get('Driver') or {}
        cid = (it['api'].get('Constructor') or {}).get('constructorId')
        name = history[c][0] if c in history else f"{d.get('givenName', '')} {d.get('familyName', '')}".strip() or c
        team = next(iter(ctor_teams[cid])) if cid in ctor_teams and len(ctor_teams[cid]) == 1 else (history[c][1] if c in history else None)
        if team not in teams: raise Refuse(f'driver {c} ({name}) is not in the standings and his team could not be matched; add the race by hand with a guest: line')
        guests[c] = {'name': name, 'team': team}

    results = []
    for it in classified + others:
        row = {'code': it['code'], 'status': it['status']}
        if it.get('pos'): row['pos'] = it['pos']
        results.append(row)
    race = {'round': cal['round'], 'officialRound': int(api_race['round']), 'results': results}
    if guests: race['guests'] = guests
    win = classified[0]['api']
    if (win.get('Time') or {}).get('time'): race['winnerTime'] = win['Time']['time']
    if str(win.get('laps', '')).isdigit(): race['raceLaps'] = int(win['laps'])
    if sprint_rows:
        codes = [(s.get('Driver') or {}).get('code') for s in sprint_rows if str(s.get('positionText', '')).isdigit()]
        if not codes or None in codes: raise Refuse('the API sprint result has missing driver codes')
        race['sprintResults'] = codes
    fl = next((it for it in classified + others if str(((it['api'].get('FastestLap') or {}).get('rank'))) == '1'), None)
    if fl and fl['code'] in regular and (fl['api']['FastestLap'].get('Time') or {}).get('time'):
        f = fl['api']['FastestLap']
        race['fastestLap'] = {'code': fl['code'], 'lap_time': f['Time']['time'], 'source': 'Jolpica-Ergast API (sector times not provided)'}
        if str(f.get('lap', '')).isdigit(): race['fastestLap']['lap_number'] = int(f['lap'])
    if expect: race['expectPoints'] = expect
    return race


def fingerprint(race):
    core = {k: race[k] for k in ('round', 'officialRound', 'results', 'sprintResults', 'guests') if k in race}
    core['fastest'] = (race.get('fastestLap') or {}).get('code')
    return hashlib.sha1(json.dumps(core, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()[:16]


# ---------------------------------------------------------------- apply with rollback (same steps as inbox.py)
def apply_race(root, race, replace=False, dry=False):
    data = os.path.join(root, 'public', 'data')
    backup = tempfile.mkdtemp()
    snap = os.path.join(root, 'inbox', 'undo-snapshot.json')
    for n in DATA_FILES: shutil.copy(os.path.join(data, n + '.json'), backup)
    had_snap = os.path.exists(snap)
    if had_snap: shutil.copy(snap, os.path.join(backup, 'undo-snapshot.json'))

    def restore():
        for n in DATA_FILES: shutil.copy(os.path.join(backup, n + '.json'), os.path.join(data, n + '.json'))
        if had_snap: shutil.copy(os.path.join(backup, 'undo-snapshot.json'), snap)
        elif os.path.exists(snap): os.remove(snap)

    payload = dict(race); payload.pop('_hash', None)
    if replace: payload['replace'] = True
    rj = os.path.join(backup, 'race.json')
    json.dump(payload, open(rj, 'w', encoding='utf-8'), ensure_ascii=False)
    cmd = [sys.executable, os.path.join(HERE, 'add-race.py'), rj, '--root', root] + (['--dry-run'] if dry else [])
    p = subprocess.run(cmd, capture_output=True, text=True)
    out = (p.stdout + p.stderr).strip()
    if p.returncode != 0:
        restore(); return False, out
    if dry: return True, out
    if shutil.which('node') and os.path.exists(os.path.join(root, 'tools', 'derive-standings-stats.cjs')):
        dv = subprocess.run(['node', os.path.join('tools', 'derive-standings-stats.cjs'), '--write'], cwd=root, capture_output=True, text=True)
        if dv.returncode != 0:
            restore(); return False, 'could not update wins/podiums:\n' + dv.stdout + dv.stderr
    if shutil.which('node') and os.path.exists(os.path.join(root, 'audit-data.cjs')):
        au = subprocess.run(['node', 'audit-data.cjs'], cwd=root, capture_output=True, text=True)
        if au.returncode != 0:
            restore(); return False, 'data audit failed:\n' + '\n'.join(l for l in (au.stdout + au.stderr).splitlines() if not l.startswith('PASS'))
        out += '\n\nData audit: passed'
    return True, out


# ---------------------------------------------------------------- state + status files
def state_path(root): return os.path.join(root, 'inbox', 'sync-state.json')


def load_state(root): return read_json(state_path(root), {}) or {}


def save_state(root, st):
    os.makedirs(os.path.join(root, 'inbox'), exist_ok=True)
    json.dump(st, open(state_path(root), 'w', encoding='utf-8'), indent=2, ensure_ascii=False)


def set_status(root, title, body, now):
    p = os.path.join(root, 'inbox', 'SYNC-STATUS.md')
    text = f"# {title}\n\n```\n{body.strip()}\n```\n"
    old = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
    if old.split('\n_updated ')[0] == text.rstrip('\n') + '\n' or old.startswith(text): return
    open(p, 'w', encoding='utf-8').write(text + f"\n_updated {iso(now)}_\n")


# ---------------------------------------------------------------- one race
def fetch_and_build(base, season, root, cal, off_round, now, first_seen=None):
    data = os.path.join(root, 'public', 'data')
    calendar = read_json(os.path.join(data, 'calendar.json'))
    standings_local = read_json(os.path.join(data, 'standings.json'))
    results_local = read_json(os.path.join(data, 'results.json'))
    api_race = fetch_results(base, season, off_round)
    d_api, d_cal = dt.date.fromisoformat(api_race['date']), dt.date.fromisoformat(cal['date'])
    if abs((d_api - d_cal).days) > 1:
        alt = fetch_schedule_round(base, season, cal['date'])
        if alt is None: raise Refuse(f"calendar.json says round {cal['round']} ({cal['name']}) is on {cal['date']} but API round {off_round} is on {api_race['date']}; the schedules disagree")
        pause(0.3); api_race = fetch_results(base, season, alt); off_round = alt
    pause(0.3)
    sprint = None
    if cal.get('isSprint'):
        sprint = fetch_sprint(base, season, off_round); pause(0.3)
    expect = fetch_standings(base, season, off_round)
    if expect is None:
        overdue = first_seen is not None and (now - first_seen) >= dt.timedelta(hours=STANDINGS_PATIENCE_H)
        if not overdue: raise Wait(f'official round {off_round}: API driver standings do not include this race yet')
    race = build_race(api_race, cal, calendar['races'], standings_local, results_local, sprint, expect)
    race['_hash'] = fingerprint(race)
    race['_expect_checked'] = expect is not None
    return race


def log(msg): print(msg, flush=True)


def process_due_race(root, base, season, now, dry, settle, state):
    """Returns 'applied', 'waiting', 'idle' or 'refused'."""
    data = os.path.join(root, 'public', 'data')
    calendar = read_json(os.path.join(data, 'calendar.json'))
    results = read_json(os.path.join(data, 'results.json'))
    cal = next((r for r in sorted(calendar['races'], key=lambda r: r['round']) if r['status'] == 'next'), None)
    if not cal: log('Season finished: no "next" race in calendar.json.'); return 'idle'
    if dt.date.fromisoformat(cal['date']) > now.date(): log(f"Next race ({cal['name']}, {cal['date']}) is not due yet; no API request."); return 'idle'
    if str(cal['round']) in results['races']: log(f"Round {cal['round']} is already in results.json."); return 'idle'
    off = results.get('officialAsOfRound')
    if off is None: off = max([r.get('officialRound') or 0 for r in calendar['races'] if r['status'] == 'completed'] or [0])
    if not off: raise Refuse('cannot work out the official round number (no officialAsOfRound in results.json)')
    off_round = int(off) + 1
    pend = state.get('pending') or {}
    first_seen = parse_ts(pend['firstSeen']) if pend.get('round') == cal['round'] and pend.get('firstSeen') else None
    title = f"round {cal['round']} ({cal['name']})"
    try:
        race = fetch_and_build(base, season, root, cal, off_round, now, first_seen)
    except Wait as e:
        log(f'Waiting: {e}'); return 'waiting'
    h = race['_hash']
    if not first_seen or pend.get('hash') != h:
        state['pending'] = {'round': cal['round'], 'hash': h, 'firstSeen': iso(now)}
        if not dry: save_state(root, state)
        log(f'{title}: results found; waiting {settle} min to confirm they stay unchanged.')
        if not dry: set_status(root, f'WAITING - {title}', f'Results found on the API at {iso(now)}.\nThey are applied automatically if they stay unchanged for {settle} minutes.', now)
        return 'waiting'
    if now - first_seen < dt.timedelta(minutes=settle):
        log(f'{title}: unchanged, but not {settle} min old yet.'); return 'waiting'
    expect_checked = race.pop('_expect_checked'); race.pop('_hash')
    ok, out = apply_race(root, race, dry=dry)
    if not ok:
        log(f'REFUSED {title}:\n{out}')
        if not dry: set_status(root, f'REFUSED - {title}', out + '\n\nNothing was changed. It is retried on the next run; or add the race by hand with inbox/race.txt.', now)
        return 'refused'
    log(out)
    if dry: return 'applied'
    note = '' if expect_checked else '\n\nNote: the API standings did not include this race yet, so the points were not cross-checked.'
    set_status(root, f'OK - {title} added automatically', out + note, now)
    os.makedirs(os.path.join(root, 'inbox', 'archive'), exist_ok=True)
    json.dump(race, open(os.path.join(root, 'inbox', 'archive', f"api-round-{cal['round']:02d}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    state.pop('pending', None)
    state['applied'] = {'round': cal['round'], 'officialRound': race['officialRound'], 'hash': h, 'at': iso(now), 'raceDate': cal['date']}
    save_state(root, state)
    return 'applied'


def recheck_applied(root, base, season, now, dry, state):
    """Late penalties: replace the last automatic race if the API classification changed within RECHECK_WINDOW_H."""
    ap = state.get('applied')
    if not ap or now.hour % RECHECK_EVERY_H != 0: return
    if now - parse_ts(ap['at']) > dt.timedelta(hours=RECHECK_WINDOW_H): return
    data = os.path.join(root, 'public', 'data')
    results = read_json(os.path.join(data, 'results.json'))
    if str(results.get('asOfRound')) != str(ap['round']): return   # a later race was added by hand: leave it alone
    calendar = read_json(os.path.join(data, 'calendar.json'))
    cal = next(r for r in calendar['races'] if r['round'] == ap['round'])
    try:
        race = fetch_and_build(base, season, root, cal, ap['officialRound'], now, parse_ts(ap['at']))
    except (Wait, Refuse) as e:
        log(f'Re-check of round {ap["round"]} skipped: {e}'); return
    h = race.pop('_hash'); expect_checked = race.pop('_expect_checked')
    if h == ap['hash']: log(f"Re-check of round {ap['round']}: classification unchanged."); return
    if not expect_checked: log('Re-check: classification changed but API standings are not updated yet; will look again.'); return
    ok, out = apply_race(root, race, replace=True, dry=dry)
    title = f"round {ap['round']} ({cal['name']})"
    if not ok:
        log(f'Re-check REFUSED the changed classification of {title}:\n{out}')
        if not dry: set_status(root, f'REFUSED - changed classification of {title}', out + '\n\nThe earlier automatic result was kept.', now)
        return
    log(out)
    if dry: return
    set_status(root, f'OK - {title} replaced (classification changed after the race)', out, now)
    json.dump(race, open(os.path.join(root, 'inbox', 'archive', f"api-round-{ap['round']:02d}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    state['applied'] = dict(ap, hash=h, at=ap['at'])
    save_state(root, state)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.path.abspath(os.path.join(HERE, '..')))
    ap.add_argument('--base', default=os.environ.get('JOLPICA_BASE', BASE_DEFAULT))
    ap.add_argument('--now'); ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--settle-minutes', type=int, default=SETTLE_MINUTES)
    a = ap.parse_args()
    now = parse_ts(a.now) if a.now else utcnow()
    base = a.base.rstrip('/')
    results = read_json(os.path.join(a.root, 'public', 'data', 'results.json'))
    season = results.get('season', now.year)
    state = load_state(a.root)
    try:
        for _ in range(MAX_RACES_PER_RUN):
            res = process_due_race(a.root, base, season, now, a.dry_run, a.settle_minutes, state)
            if res != 'applied' or a.dry_run: break
            pause(0.5)
        else:
            pass
        recheck_applied(a.root, base, season, now, a.dry_run, state)
    except ApiDown as e:
        log(f'API not reachable, nothing changed: {e}')
    except Refuse as e:
        log(f'REFUSED: {e}')
        if not a.dry_run: set_status(a.root, 'REFUSED - automatic sync', f'{e}\n\nNothing was changed. Add the race by hand with inbox/race.txt if needed.', now)
    except Exception as e:  # never let an unexpected problem break the data or the workflow
        log(f'Unexpected problem, nothing changed: {type(e).__name__}: {e}')


if __name__ == '__main__':
    main()
