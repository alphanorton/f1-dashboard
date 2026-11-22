#!/usr/bin/env python3
"""Reads inbox/race.txt (a header + text pasted from formula1.com), adds the race to the dashboard data,
checks it, and writes the outcome to inbox/STATUS.md. Run by the GitHub Action; can also be run by hand.

  python3 tools/inbox.py [--root DIR] [--file inbox/race.txt] [--dry-run] [--no-audit]
"""
import argparse, datetime, json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = """round: 
official: 
fastest: 
--- 
(Paste the formula1.com race results below this line. You can paste the standings table after it too.)
"""
DATA_FILES = ('results', 'standings', 'calendar', 'fastest_laps_2026')


class InboxError(Exception):
    pass


def parse_header(lines):
    h = {}
    for ln in lines:
        m = re.match(r'^\s*([A-Za-z]+)\s*:\s*(.*?)\s*$', ln)
        if m and m.group(2) != '': h[m.group(1).lower()] = m.group(2)
    return h


def parse_results(tokens, classified_extra):
    """Finds the first run of (position, CODE) pairs, e.g. 1 ANT 2 LEC ... NC BOT."""
    start = next((i for i in range(len(tokens) - 1) if tokens[i] == '1' and re.fullmatch(r'[A-Z]{3}', tokens[i + 1])), None)
    if start is None: raise InboxError('Could not find the race result list (a "1" followed by a 3-letter driver code like ANT).')
    rows, j, expect = [], start, 1
    while j + 1 < len(tokens) and re.fullmatch(r'[A-Z]{3}', tokens[j + 1]):
        t, code = tokens[j], tokens[j + 1]
        if t.isdigit():
            if int(t) != expect: break
            rows.append({'pos': expect, 'code': code, 'status': 'Finished'}); expect += 1
        elif t in ('NC', 'DQ', 'DNS'):
            rows.append({'pos': None, 'code': code, 'status': {'NC': 'DNF', 'DQ': 'DSQ', 'DNS': 'DNS'}[t]})
        else:
            break
        j += 2
    if len(rows) < 10: raise InboxError(f'Only {len(rows)} drivers found in the result list; expected at least 10.')
    nxt = expect
    for r in rows:  # a retirement that was still classified (completed 90% of the race)
        if r['pos'] is None and r['status'] == 'DNF' and r['code'] in classified_extra:
            r['pos'] = nxt; nxt += 1
    return rows


def parse_standings(paste):
    flat = re.sub(r'\s+', ' ', paste)
    k = flat.find("Drivers' Standings")
    if k == -1: k = flat.find('Standings')
    if k == -1: return {}
    pat = re.compile(r'(\d{1,2}) ([A-Z]{3}) [A-Z]{3} ([A-Za-z0-9 .&\-]+?) (\d{1,3})(?= \d{1,2} [A-Z]{3} [A-Z]{3} |$)')
    return {m.group(2): int(m.group(4)) for m in pat.finditer(flat[k:])}


def parse_fastest(text):
    m = re.match(r'^([A-Z]{3})\s+(\d+:\d{2}\.\d{3}|\d+\.\d{3})(?:\s+lap\s+(\d+))?(.*)$', text.strip(), re.I)
    if not m: raise InboxError('fastest: should look like  fastest: LEC 1:37.976 lap 42  (optional: s1=25.1 s2=38.0 s3=34.8)')
    f = {'code': m.group(1).upper(), 'lap_time': m.group(2)}
    if m.group(3): f['lap_number'] = int(m.group(3))
    for k in ('s1', 's2', 's3'):
        mm = re.search(rf'{k}\s*=\s*([\d.]+)', m.group(4))
        if mm: f[k] = float(mm.group(1))
    f['source'] = 'inbox/race.txt'
    return f


def build_race(text):
    lines = text.splitlines()
    sep = next((i for i, l in enumerate(lines) if l.strip().startswith('---')), None)
    if sep is None: raise InboxError('The line "---" is missing: header lines go above it, the pasted results below it.')
    h = parse_header(lines[:sep]); paste = '\n'.join(lines[sep + 1:])
    if 'undo' in h:
        if not h['undo'].isdigit(): raise InboxError(f'undo must be a round number, got "{h["undo"]}"')
        return {'undo': int(h['undo'])}
    if 'round' not in h: return None  # empty template: nothing to do
    if not h['round'].isdigit(): raise InboxError(f'round must be a number, got "{h["round"]}"')
    tokens = [t.strip() for t in paste.splitlines() if t.strip()]
    extra = set(re.findall(r'[A-Z]{3}', h.get('classified', '')))
    race = {'round': int(h['round']), 'results': parse_results(tokens, extra)}
    if h.get('replace', '').lower() in ('yes', 'true', '1', 'y'): race['replace'] = True
    if 'guest' in h:  # guest: HIR=Ryo Hirakawa|Haas ; XXX=Name|Team
        guests = {}
        for part in h['guest'].split(';'):
            m = re.match(r'^\s*([A-Z]{3})\s*=\s*([^|]+?)\s*\|\s*(.+?)\s*$', part)
            if not m: raise InboxError('guest: should look like  guest: HIR=Ryo Hirakawa|Haas  (separate several with ;)')
            guests[m.group(1)] = {'name': m.group(2), 'team': m.group(3)}
        race['guests'] = guests
    if 'official' in h and h['official'].isdigit(): race['officialRound'] = int(h['official'])
    if 'date' in h: race['date'] = h['date']
    if 'laps' in h and h['laps'].isdigit(): race['raceLaps'] = int(h['laps'])
    if 'distance' in h: race['distanceKm'] = float(h['distance'])
    if 'winnertime' in h: race['winnerTime'] = h['winnertime']
    if 'pole' in h: race['poleTime'] = h['pole']
    if 'note' in h: race['note'] = h['note']
    if 'sprint' in h: race['sprintResults'] = re.findall(r'[A-Z]{3}', h['sprint'])
    if 'fastest' in h: race['fastestLap'] = parse_fastest(h['fastest'])
    exp = parse_standings(paste)
    if len(exp) >= 10: race['expectPoints'] = exp
    return race


def auto_guests(race, root):
    """Codes that are not in standings.json and have no guest: line are treated as one-off guest drivers.
    Name and team come from earlier rounds in results.json when the driver raced before; otherwise, if exactly one
    unknown code is in the result and exactly one regular driver is missing from it, the guest takes that driver's
    team (name = the code; add a guest: line to set a full name). Returns a list of notes for STATUS.md."""
    data = os.path.join(root, 'public', 'data')
    standings = json.load(open(os.path.join(data, 'standings.json'), encoding='utf-8-sig'))
    results = json.load(open(os.path.join(data, 'results.json'), encoding='utf-8-sig'))
    regular = {d['code']: d for d in standings['drivers']}
    guests = race.setdefault('guests', {}) if 'guests' in race else {}
    seen = [r['code'] for r in race['results']] + list(race.get('sprintResults', []))
    unknown = []
    for c in seen:
        if c not in regular and c not in guests and c not in unknown: unknown.append(c)
    if not unknown: return []
    history = {}
    for rnd in sorted(results.get('races', {}), key=lambda x: int(x)):
        for row in results['races'][rnd].get('results', []):
            if row.get('code') and row.get('team') and row.get('driver'): history[row['code']] = (row['driver'], row['team'])
    teams = {t['shortName'] for t in standings['constructors']}
    absent = [d for c, d in regular.items() if c not in seen]
    notes = []
    for c in unknown:
        if c in history and history[c][1] in teams:
            name, team = history[c]; how = 'taken from an earlier round'
        elif len(unknown) == 1 and len(absent) == 1:
            name, team = c, absent[0]['team']; how = f"team taken from {absent[0]['code']}, who is not in this race"
        else:
            continue  # add-race.py reports it with the usual hint to add a guest: line
        guests[c] = {'name': name, 'team': team}
        notes.append(f'Guest driver {c} added automatically as {name} ({team}); {how}.')
    if guests: race['guests'] = guests
    return notes


def write_status(root, ok, title, body):
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    text = f"# {'OK' if ok else 'ERROR'} - {title}\n\n_{stamp}_\n\n```\n{body.strip()}\n```\n"
    if not ok: text += "\nNothing was changed. Fix `inbox/race.txt` and save it again.\n"
    open(os.path.join(root, 'inbox', 'STATUS.md'), 'w', encoding='utf-8').write(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.path.abspath(os.path.join(HERE, '..')))
    ap.add_argument('--file'); ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--no-audit', action='store_true')
    a = ap.parse_args()
    root = a.root; inbox = a.file or os.path.join(root, 'inbox', 'race.txt')
    os.makedirs(os.path.join(root, 'inbox', 'archive'), exist_ok=True)
    text = open(inbox, encoding='utf-8-sig').read()

    try:
        race = build_race(text)
    except InboxError as e:
        write_status(root, False, 'could not read inbox/race.txt', str(e)); print('ERROR:', e); return
    if race is None:
        print('Inbox is empty (no "round:" line) - nothing to do.'); return
    guest_notes = []
    if 'undo' not in race:
        try:
            guest_notes = auto_guests(race, root)
        except (OSError, ValueError, KeyError) as e:
            guest_notes = []  # never block the race on this helper; add-race.py will report any real problem

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

    undo_round = race.get('undo')
    if undo_round is not None:
        cmd = [sys.executable, os.path.join(HERE, 'add-race.py'), '--undo', str(undo_round), '--root', root]
    else:
        rj = os.path.join(backup, 'race.json'); json.dump(race, open(rj, 'w', encoding='utf-8'), ensure_ascii=False)
        cmd = [sys.executable, os.path.join(HERE, 'add-race.py'), rj, '--root', root] + (['--dry-run'] if a.dry_run else [])
    p = subprocess.run(cmd, capture_output=True, text=True)
    out = (p.stdout + p.stderr).strip()
    title = f"round {undo_round} undone" if undo_round is not None else f"round {race['round']}"
    if p.returncode != 0:
        restore(); write_status(root, False, title, out); print(out); return
    if not a.dry_run and shutil.which('node') and os.path.exists(os.path.join(root, 'tools', 'derive-standings-stats.cjs')):
        dv = subprocess.run(['node', os.path.join('tools', 'derive-standings-stats.cjs'), '--write'], cwd=root, capture_output=True, text=True)
        if dv.returncode != 0:
            restore(); write_status(root, False, title + ' (could not update wins/podiums)', dv.stdout + dv.stderr); print(dv.stdout + dv.stderr); return
    if not a.dry_run and not a.no_audit and shutil.which('node') and os.path.exists(os.path.join(root, 'audit-data.cjs')):
        au = subprocess.run(['node', 'audit-data.cjs'], cwd=root, capture_output=True, text=True)
        if au.returncode != 0:
            restore(); msg = '\n'.join(l for l in (au.stdout + au.stderr).splitlines() if not l.startswith('PASS'))
            write_status(root, False, title + ' (data check failed)', msg); print(msg); return
        out += '\n\nData audit: passed'
    if guest_notes: out += '\n\n' + '\n'.join(guest_notes)
    if undo_round is None and 'expectPoints' not in race: out += '\n\nNote: no standings table found in the paste, so the points were not cross-checked.'
    print(out)
    if a.dry_run: return
    if undo_round is not None:
        write_status(root, True, title, out)
        old_archive = os.path.join(root, 'inbox', 'archive', f'round-{undo_round:02d}.txt')
        if os.path.exists(old_archive): os.remove(old_archive)
    else:
        write_status(root, True, title + (' replaced' if race.get('replace') else ' added'), out)
        shutil.copy(inbox, os.path.join(root, 'inbox', 'archive', f"round-{race['round']:02d}.txt"))
    open(inbox, 'w', encoding='utf-8').write(TEMPLATE)


if __name__ == '__main__':
    main()
