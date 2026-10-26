import json, glob, os, math
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# Usage: python3 tools/trace-track-paths.py  (needs numpy, pillow, scikit-image, scipy)
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize
from scipy import ndimage as ndi

NB = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]


def walk_greedy(pts):
    """Original walker: never revisits a pixel. Works for simple loops."""
    start = min(pts)
    path = [start]; seen = {start}; cur = start
    while True:
        cands = [(cur[0]+dy, cur[1]+dx) for dy,dx in NB if (cur[0]+dy, cur[1]+dx) in pts and (cur[0]+dy, cur[1]+dx) not in seen]
        if not cands: break
        if len(cands) > 1 and len(path) > 6:
            ref = path[-6]
            vy, vx = cur[0]-ref[0], cur[1]-ref[1]
            def score(c):
                dy, dx = c[0]-cur[0], c[1]-cur[1]
                return -(dy*vy + dx*vx) / (math.hypot(dy,dx)*math.hypot(vy,vx) + 1e-9)
            cands.sort(key=score)
        else:
            cands.sort(key=lambda c: abs(c[0]-cur[0]) + abs(c[1]-cur[1]))
        cur = cands[0]; path.append(cur); seen.add(cur)
    return path, seen

def walk_cross(pts):
    """Direction-keeping walker that may cross itself (figure-8 layouts) or double back."""
    start = min(pts)
    path = [start]; visits = {start: 1}; cur = start; LOOK = 14
    for _ in range(len(pts) * 3):
        recent = set(path[-6:])
        cands = [(cur[0]+dy, cur[1]+dx) for dy,dx in NB
                 if (cur[0]+dy, cur[1]+dx) in pts and (cur[0]+dy, cur[1]+dx) not in recent
                 and visits.get((cur[0]+dy, cur[1]+dx), 0) < 2]
        if not cands: break
        if len(path) > LOOK:
            ref = path[-LOOK]
            vy, vx = cur[0]-ref[0], cur[1]-ref[1]
            def score(c):
                dy, dx = c[0]-cur[0], c[1]-cur[1]
                return -(dy*vy + dx*vx) / (math.hypot(dy,dx)*math.hypot(vy,vx) + 1e-9) + 0.6 * visits.get(c, 0)
            cands.sort(key=score)
        else:
            cands.sort(key=lambda c: abs(c[0]-cur[0]) + abs(c[1]-cur[1]))
        cur = cands[0]; path.append(cur); visits[cur] = visits.get(cur, 0) + 1
        if len(path) > 200 and math.hypot(cur[0]-start[0], cur[1]-start[1]) < 4 and len(visits) >= 0.85 * len(pts): break
    return path, set(visits)

def walk_look(pts):
    """Junction-aware walker: at every fork, look ~25 px down each branch and keep going straight.
    Lets the line cross itself (Suzuka's figure-8) and pass over a crossing link twice."""
    start = min(pts)
    path = [start]; visits = {start: 1}; cur = start
    IN, AHEAD = 25, 25
    def nbrs(q, banned):
        return [(q[0]+dy, q[1]+dx) for dy, dx in NB if (q[0]+dy, q[1]+dx) in pts and (q[0]+dy, q[1]+dx) not in banned]
    def look(c, came_from):
        banned = set(path[-10:]) | {came_from}
        q = c; seen_local = {c}
        for _ in range(AHEAD):
            n = [m for m in nbrs(q, banned) if m not in seen_local]
            if not n: break
            n.sort(key=lambda m: abs(m[0]-q[0]) + abs(m[1]-q[1]))
            seen_local.add(n[0]); q = n[0]
        return q
    for _ in range(len(pts) * 3):
        recent = set(path[-6:])
        cands = [m for m in nbrs(cur, recent) if visits.get(m, 0) < 2]
        if not cands:
            # sharp U-turn (hairpin tip): allow unvisited pixels even if they touch the last few steps
            cands = [m for m in nbrs(cur, set(path[-2:])) if visits.get(m, 0) == 0]
        if not cands: break
        if len(cands) > 1 and len(path) > IN:
            ref = path[-IN]
            vy, vx = cur[0]-ref[0], cur[1]-ref[1]
            def score(c):
                end = look(c, cur)
                dy, dx = end[0]-cur[0], end[1]-cur[1]
                straight = -(dy*vy + dx*vx) / (math.hypot(dy, dx)*math.hypot(vy, vx) + 1e-9)
                return straight + 0.6 * visits.get(c, 0)
            cands.sort(key=score)
        else:
            cands.sort(key=lambda c: abs(c[0]-cur[0]) + abs(c[1]-cur[1]) + 3 * visits.get(c, 0))
        cur = cands[0]; path.append(cur); visits[cur] = visits.get(cur, 0) + 1
        if len(path) > 200 and math.hypot(cur[0]-start[0], cur[1]-start[1]) < 4 and len(visits) >= 0.85 * len(pts): break
    return path, set(visits)

def trace(png):
    a = np.array(Image.open(png).convert('RGBA'))
    opaque = a[...,3] > 128
    lum = a[...,:3].astype(float).mean(axis=2)
    if lum[opaque].max() > 200:
        mask = opaque & (a[...,0] > 200) & (a[...,1] > 200) & (a[...,2] > 200)
    else:
        # Hungaroring / Monaco style: a dark halo with the track cut out as a transparent ribbon.
        # The ribbon is the thin, enclosed (non-border) transparent component.
        tr = ~opaque
        tl, k = ndi.label(tr)
        if k < 2: return None
        dt = ndi.distance_transform_edt(tr)
        border = set(np.unique(np.concatenate([tl[0], tl[-1], tl[:, 0], tl[:, -1]])))
        ids = [i for i in range(1, k + 1) if i not in border]
        if not ids: return None
        best = min(ids, key=lambda i: ndi.maximum(dt, tl, i))
        mask = tl == best
    it = max(2, a.shape[1] // 480)
    mask = ndi.binary_closing(mask, iterations=it)
    lab, n = ndi.label(mask, structure=np.ones((3,3)))
    if n == 0: return None
    sizes = ndi.sum(mask, lab, range(1, n+1))
    mask = lab == (1 + int(np.argmax(sizes)))
    sk = skeletonize(mask)
    # prune short spurs
    def endpoints(s):
        cnt = ndi.convolve(s.astype(int), np.ones((3,3),int), mode='constant') - 1
        return s & (cnt == 1)
    for _ in range(400):  # strip every dead-end branch (pit lane, stray spurs); loops are untouched
        e = endpoints(sk)
        if not e.any(): break
        sk = sk & ~e
    pts = set(zip(*np.nonzero(sk)))
    # drop redundant corner pixels (exactly two neighbours that touch each other): removes 1-px stubs at
    # hairpin tips without ever breaking connectivity
    changed = True
    while changed:
        changed = False
        for q in sorted(pts):
            nb = [(q[0]+dy, q[1]+dx) for dy, dx in NB if (q[0]+dy, q[1]+dx) in pts]
            if len(nb) == 2 and max(abs(nb[0][0]-nb[1][0]), abs(nb[0][1]-nb[1][1])) <= 1:
                pts.discard(q); changed = True
    if len(pts) < 50: return None
    best = None
    for walker in (walk_greedy, walk_cross, walk_look):
        path, seen = walker(pts)
        cov = len(seen) / len(pts)
        cl = math.hypot(path[0][0]-path[-1][0], path[0][1]-path[-1][1]) < 14
        score = (cov > 0.9 and cl, cov)
        if best is None or score > best[0]:
            best = (score, path, seen)
        if score[0]: break
    _, path, seen = best
    coverage = len(seen) / len(pts)
    closed = math.hypot(path[0][0]-path[-1][0], path[0][1]-path[-1][1]) < 14
    return a.shape[1], a.shape[0], path, coverage, closed

def smooth_path(path, step=12):
    p = np.array([(x, y) for y, x in path], float)
    p = p[::step]
    if len(p) < 8: return None
    # circular moving average to de-pixelate
    k = 2
    q = np.array([np.mean([p[(i+j) % len(p)] for j in range(-k, k+1)], axis=0) for i in range(len(p))])
    n = len(q)
    d = f"M{q[0][0]:.1f},{q[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = q[(i-1) % n], q[i], q[(i+1) % n], q[(i+2) % n]
        c1 = p1 + (p2 - p0) / 6
        c2 = p2 - (p3 - p1) / 6
        d += f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d + "Z", q

out = {}
for png in sorted(glob.glob(ROOT + '/public/data/track-maps/*.png')):
    slug = os.path.basename(png)[:-4]
    try:
        r = trace(png)
        if not r: print(slug, 'FAIL none'); continue
        w, h, path, cov, closed = r
        sm = smooth_path(path)
        if not sm: print(slug, 'FAIL short'); continue
        d, q = sm
        x0, y0 = q.min(axis=0); x1, y1 = q.max(axis=0)
        ok = cov > 0.9 and closed
        print(f"{slug:15s} cov={cov:.2f} closed={closed} len={len(path)} {'OK' if ok else 'CHECK'}")
        if ok:
            out[slug] = {"w": w, "h": h, "d": d, "bbox": [round(x0,1), round(y0,1), round(x1,1), round(y1,1)]}
    except Exception as e:
        print(slug, 'ERR', e)
json.dump(out, open(ROOT + '/public/data/track-paths.json', 'w'), separators=(',', ':'))
print('ok circuits:', sorted(out))
