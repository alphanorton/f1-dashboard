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
    if 'round' not in h: return None  # empty template: nothing to do
    if not h['round'].isdigit(): raise InboxError(f'round must be a number, got "{h["round"]}"')
    tokens = [t.strip() for t in paste.splitlines() if t.strip()]
    extra = set(re.findall(r'[A-Z]{3}', h.get('classified', '')))
    race = {'round': int(h['round']), 'results': parse_results(tokens, extra)}
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

    data = os.path.join(root, 'public', 'data')
    backup = tempfile.mkdtemp()
    for n in DATA_FILES: shutil.copy(os.path.join(data, n + '.json'), backup)

    def restore():
        for n in DATA_FILES: shutil.copy(os.path.join(backup, n + '.json'), os.path.join(data, n + '.json'))

    rj = os.path.join(backup, 'race.json'); json.dump(race, open(rj, 'w', encoding='utf-8'), ensure_ascii=False)
    cmd = [sys.executable, os.path.join(HERE, 'add-race.py'), rj, '--root', root] + (['--dry-run'] if a.dry_run else [])
    p = subprocess.run(cmd, capture_output=True, text=True)
    out = (p.stdout + p.stderr).strip()
    title = f"round {race['round']}"
    if p.returncode != 0:
        restore(); write_status(root, False, title, out); print(out); return
    if not a.dry_run and not a.no_audit and shutil.which('node') and os.path.exists(os.path.join(root, 'audit-data.cjs')):
        au = subprocess.run(['node', 'audit-data.cjs'], cwd=root, capture_output=True, text=True)
        if au.returncode != 0:
            restore(); msg = '\n'.join(l for l in (au.stdout + au.stderr).splitlines() if not l.startswith('PASS'))
            write_status(root, False, title + ' (data check failed)', msg); print(msg); return
        out += '\n\nData audit: passed'
    if 'expectPoints' not in race: out += '\n\nNote: no standings table found in the paste, so the points were not cross-checked.'
    print(out)
    if a.dry_run: return
    write_status(root, True, title + ' added', out)
    shutil.copy(inbox, os.path.join(root, 'inbox', 'archive', f"round-{race['round']:02d}.txt"))
    open(inbox, 'w', encoding='utf-8').write(TEMPLATE)


if __name__ == '__main__':
    main()
