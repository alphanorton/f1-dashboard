"""Build a track-map PNG (white line, dark halo, transparent bg, 960x720) from a reference layout image.
Usage: python3 tools/make-track-map.py <slug> <source-image> <mode>
  mode 'black'  : track drawn as a thick black line on white (e.g. Spa)
  mode 'colour' : track drawn as black outline + coloured centre line (e.g. Madring)
  optional 4th arg: closing radius (bridges label boxes; lower it if parallel strands merge)
Needs numpy, pillow, scikit-image, scipy."""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import warnings; warnings.filterwarnings('ignore')
from skimage.morphology import skeletonize, disk, binary_opening, binary_closing


def colour_centreline(mask):
    """Coloured-centre maps: the coloured line is thin and keeps parallel strands apart (the black outlines
    touch and merge). Keep each coloured piece, drop text/boxes, then bridge the gaps left by label boxes."""
    mask = ndi.binary_opening(mask, structure=np.ones((3, 3)), iterations=1)
    lab, n = ndi.label(mask, structure=np.ones((3, 3)))
    keep = np.zeros_like(mask)
    for i in range(1, n + 1):
        comp = lab == i
        area = comp.sum()
        if area < 400: continue
        sk_i = skeletonize(comp)
        if area / max(sk_i.sum(), 1) > 7.4: continue      # thick filled box (speed-trap label etc.)
        keep |= comp
    sk = skeletonize(keep)
    for _ in range(40):                                      # trim tiny spurs
        e = endpoints(sk)
        if not e.any(): break
        sk = sk & ~e if _ < 6 else sk
    # bridge gaps: join each loose end to the nearest end of a different piece
    for _ in range(12):
        lab2, n2 = ndi.label(sk, structure=np.ones((3, 3)))
        ends = np.argwhere(endpoints(sk))
        if len(ends) < 2: break
        best = None
        for a_i in range(len(ends)):
            for b_i in range(a_i + 1, len(ends)):
                pa, pb = ends[a_i], ends[b_i]
                if lab2[tuple(pa)] == lab2[tuple(pb)]: continue
                d = np.hypot(*(pa - pb))
                if best is None or d < best[0]: best = (d, pa, pb)
        if best is None or best[0] > 260: break
        _, pa, pb = best
        for t in np.linspace(0, 1, int(best[0]) + 2):
            q = (pa + (pb - pa) * t).round().astype(int); sk[q[0], q[1]] = True
    ends = np.argwhere(endpoints(sk))
    if len(ends) == 2:                                   # the lap is one chain: close it
        pa, pb = ends
        for t in np.linspace(0, 1, int(np.hypot(*(pa - pb))) + 2):
            q = (pa + (pb - pa) * t).round().astype(int); sk[q[0], q[1]] = True
    print('  open ends after bridging:', int(endpoints(sk).sum()))
    return sk

def endpoints(s):
    c = ndi.convolve(s.astype(int), np.ones((3, 3), int), mode='constant') - 1
    return s & (c == 1)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
slug, src, mode = sys.argv[1:4]
im = Image.open(src).convert('RGBA')
bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
scale = 3 if im.size[0] < 1200 else 1
if scale > 1: bg = bg.resize((im.size[0]*scale, im.size[1]*scale), Image.LANCZOS)
rgb = np.array(bg.convert('RGB')).astype(int)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
lum = rgb.mean(axis=2)
mx, mn = rgb.max(axis=2), rgb.min(axis=2)
sat = (mx - mn)
if mode == 'black':
    mask = (lum < 70) & (sat < 40)
else:
    pink = (r > 180) & (g < 110) & (b > 70) & (b < 190) & (r - b > 60)       # magenta/pink centre
    yellow = (r > 200) & (g > 170) & (b < 110)
    blue = (b > 150) & (r < 120) & (g > 90)
    mask = pink | yellow | blue
h, w = mask.shape
open_r = max(3, int(w / 3780 * 8)) if mode == 'black' else 6
if mode == 'black':
    close_r = open_r
    mask = binary_closing(mask, disk(close_r))
    mask = binary_opening(mask, disk(open_r))                 # strips thin text / numbers
    lab, n = ndi.label(mask, structure=np.ones((3, 3)))
    sizes = ndi.sum(mask, lab, range(1, n + 1))
    mask = lab == (1 + int(np.argmax(sizes)))
    sk = skeletonize(mask)
else:
    sk = colour_centreline(mask)

def endpoints(s):
    c = ndi.convolve(s.astype(int), np.ones((3, 3), int), mode='constant') - 1
    return s & (c == 1)
for _ in range(600):
    e = endpoints(sk)
    if not e.any(): break
    sk = sk & ~e

# fit into 960x720 with margin, redraw with uniform width
ys, xs = np.nonzero(sk)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
W, H, M = 960, 720, 70
s = min((W - 2*M) / (x1 - x0), (H - 2*M) / (y1 - y0))
ox = (W - (x1 - x0) * s) / 2 - x0 * s
oy = (H - (y1 - y0) * s) / 2 - y0 * s
canvas = np.zeros((H, W), bool)
px = np.clip((xs * s + ox).round().astype(int), 0, W-1)
py = np.clip((ys * s + oy).round().astype(int), 0, H-1)
canvas[py, px] = True
canvas = ndi.binary_closing(ndi.binary_dilation(canvas, iterations=2), iterations=2)
line = ndi.binary_dilation(canvas, iterations=3)
halo = ndi.binary_dilation(line, iterations=12)
out = np.zeros((H, W, 4), np.uint8)
out[halo] = (21, 21, 30, 255)
out[line] = (240, 240, 240, 255)
Image.fromarray(out, 'RGBA').save(f'{ROOT}/public/data/track-maps/{slug}.png')
print(slug, 'skeleton px', int(sk.sum()), 'saved')
