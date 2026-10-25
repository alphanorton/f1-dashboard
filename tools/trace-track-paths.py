import json, glob, os, math
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# Usage: python3 tools/trace-track-paths.py  (needs numpy, pillow, scikit-image, scipy)
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize
from scipy import ndimage as ndi

NB = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]

def trace(png):
    a = np.array(Image.open(png).convert('RGBA'))
    mask = (a[...,3] > 128) & (a[...,0] > 200) & (a[...,1] > 200) & (a[...,2] > 200)
    mask = ndi.binary_closing(mask, iterations=2)
    lab, n = ndi.label(mask, structure=np.ones((3,3)))
    if n == 0: return None
    sizes = ndi.sum(mask, lab, range(1, n+1))
    mask = lab == (1 + int(np.argmax(sizes)))
    sk = skeletonize(mask)
    # prune short spurs
    def endpoints(s):
        cnt = ndi.convolve(s.astype(int), np.ones((3,3),int), mode='constant') - 1
        return s & (cnt == 1)
    for _ in range(12):
        sk = sk & ~endpoints(sk)
    pts = set(zip(*np.nonzero(sk)))
    if len(pts) < 50: return None
    start = min(pts)
    path = [start]; seen = {start}
    cur = start
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
