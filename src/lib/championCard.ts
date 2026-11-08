// Draws the shareable "World Champion" card (1080x1350, 4:5 portrait) on a canvas.
// Pure drawing code: no React, so it can also be exercised outside the app.

export interface ChampionCardData {
  name: string;
  team: string;
  teamColor: string;
  code: string;
  number?: number | null;
  points: number;
  wins: number;
  podiums: number;
  pointsFinishes: number;
  dnfs: number;
  chips: Array<{ round: number; label: string; kind: 'p1' | 'p2' | 'p3' | 'pts' | 'dnf' | 'other' }>;
  headline: string; // e.g. "Title clinched with 4 races to spare"
  sprintPoints?: number | null; // part of `points` that came from sprints
  headshotUrls: string[]; // tried in order; falls back to initials
}

export const CARD_W = 1080;
export const CARD_H = 1350;
const GOLD = '#F5C542';
const DISPLAY = "900 {s}px Orbitron, system-ui, sans-serif";
const BODY = "{w} {s}px 'Vazirmatn', system-ui, sans-serif";
const f = (tpl: string, s: number, w = 500) => tpl.replace('{s}', String(s)).replace('{w}', String(w));

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // keeps the canvas exportable; a failed CORS load just falls back
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function firstImage(urls: string[]) {
  for (const u of urls) {
    const img = await loadImage(u);
    if (img) return img;
  }
  return null;
}

function rgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shrinks the font until the text fits maxW, then draws it. */
function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, size: number, min = 36) {
  let s = size;
  ctx.font = f(DISPLAY, s);
  while (ctx.measureText(text).width > maxW && s > min) {
    s -= 2;
    ctx.font = f(DISPLAY, s);
  }
  ctx.fillText(text, x, y);
}

const CHIP_STYLE: Record<ChampionCardData['chips'][number]['kind'], { fg: string; bg: string; bd: string }> = {
  p1: { fg: GOLD, bg: 'rgba(245,197,66,.16)', bd: 'rgba(245,197,66,.6)' },
  p2: { fg: '#C9CFDB', bg: 'rgba(201,207,219,.08)', bd: 'rgba(201,207,219,.45)' },
  p3: { fg: '#D9915F', bg: 'rgba(217,145,95,.09)', bd: 'rgba(217,145,95,.5)' },
  pts: { fg: '#FFFFFF', bg: 'rgba(255,255,255,.05)', bd: 'rgba(255,255,255,.14)' },
  dnf: { fg: '#FF7A7A', bg: 'rgba(255,90,90,.1)', bd: 'rgba(255,90,90,.4)' },
  other: { fg: '#9CA3AF', bg: 'rgba(255,255,255,.03)', bd: 'rgba(255,255,255,.1)' },
};

export async function renderChampionCard(canvas: HTMLCanvasElement, d: ChampionCardData): Promise<void> {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    await Promise.all([document.fonts.load(f(DISPLAY, 64)), document.fonts.load(f(BODY, 28, 700))]);
  } catch {
    /* fonts are a nicety; system fonts are used when they are not available */
  }
  const photo = await firstImage(d.headshotUrls);

  // --- background ---
  ctx.fillStyle = '#0B0B14';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  let g = ctx.createRadialGradient(120, 80, 0, 120, 80, 900);
  g.addColorStop(0, rgba(d.teamColor, 0.42));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  g = ctx.createRadialGradient(CARD_W, CARD_H, 0, CARD_W, CARD_H, 800);
  g.addColorStop(0, 'rgba(245,197,66,.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.025)';
  ctx.lineWidth = 2;
  for (let i = -CARD_H; i < CARD_W; i += 26) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + CARD_H, CARD_H);
    ctx.stroke();
  }
  ctx.restore();

  // ghost code watermark
  ctx.save();
  ctx.font = f(DISPLAY, 420);
  ctx.textAlign = 'right';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.strokeText(d.code, CARD_W - 30, 800);
  ctx.restore();

  // frame
  roundRect(ctx, 28, 28, CARD_W - 56, CARD_H - 56, 36);
  ctx.strokeStyle = 'rgba(245,197,66,.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // --- header ---
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9CA3AF';
  ctx.font = f(BODY, 26, 700);
  ctx.fillText('FORMULA 1  ·  2026 SEASON', 84, 110);
  ctx.fillStyle = GOLD;
  fitText(ctx, 'WORLD CHAMPION', 84, 190, CARD_W - 168, 84);

  // --- avatar ---
  const cx = 230;
  const cy = 430;
  const R = 130;
  ctx.save();
  g = ctx.createConicGradient ? ctx.createConicGradient(3.5, cx, cy) : (ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R) as unknown as CanvasGradient);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.3, rgba(d.teamColor, 0.85));
  g.addColorStop(0.6, '#C9CFDB');
  g.addColorStop(1, '#FFFFFF');
  ctx.shadowColor = rgba(d.teamColor, 0.45);
  ctx.shadowBlur = 36;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = d.teamColor;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  if (photo) {
    const scale = (R * 2) / Math.min(photo.width, photo.height);
    const w = photo.width * scale;
    const h = photo.height * scale;
    ctx.drawImage(photo, cx - w / 2, cy - R, w, h); // top-aligned, like the on-page avatar
  } else {
    ctx.fillStyle = '#0B0B14';
    ctx.font = f(DISPLAY, 96);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.code, cx, cy);
  }
  ctx.restore();

  // --- name block ---
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const nx = 410;
  const nameParts = d.name.toUpperCase().split(' ');
  const first = nameParts.slice(0, -1).join(' ');
  const last = nameParts[nameParts.length - 1];
  ctx.fillStyle = '#E5E7EB';
  fitText(ctx, first, nx, 372, CARD_W - nx - 70, 46, 28);
  ctx.fillStyle = '#FFFFFF';
  fitText(ctx, last, nx, 446, CARD_W - nx - 70, 78, 40);
  ctx.fillStyle = d.teamColor;
  ctx.font = f(BODY, 32, 700);
  ctx.fillText(`${d.team}${d.number ? `  ·  #${d.number}` : ''}`, nx, 498);

  // --- points ---
  ctx.fillStyle = '#FFFFFF';
  ctx.font = f(DISPLAY, 150);
  ctx.fillText(String(d.points), 84, 700);
  const pw = ctx.measureText(String(d.points)).width;
  ctx.fillStyle = '#9CA3AF';
  ctx.font = f(BODY, 34, 700);
  ctx.fillText('POINTS', 84 + pw + 24, 700);
  ctx.fillStyle = GOLD;
  ctx.font = f(BODY, 30, 500);
  ctx.fillText(d.headline, 84, 756);

  // --- stat tiles ---
  const tiles: Array<[string, number]> = [['GP WINS', d.wins], ['PODIUMS', d.podiums], ['POINTS FINISHES', d.pointsFinishes], ['RETIREMENTS', d.dnfs]];
  const gap = 18;
  const tw = (CARD_W - 168 - gap * 3) / 4;
  tiles.forEach(([label, value], i) => {
    const x = 84 + i * (tw + gap);
    roundRect(ctx, x, 800, tw, 150, 22);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = f(DISPLAY, 64);
    ctx.fillText(String(value), x + 22, 884);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = f(BODY, 19, 700);
    ctx.fillText(label, x + 22, 925);
  });

  // --- season run ---
  ctx.fillStyle = '#9CA3AF';
  ctx.font = f(BODY, 22, 700);
  ctx.fillText('SEASON RUN  ·  GRAND PRIX FINISHES', 84, 1012);
  const cols = 10;
  const cgap = 12;
  const cw = (CARD_W - 168 - cgap * (cols - 1)) / cols;
  const ch = 84;
  d.chips.forEach((c, i) => {
    const x = 84 + (i % cols) * (cw + cgap);
    const y = 1036 + Math.floor(i / cols) * (ch + cgap);
    const st = CHIP_STYLE[c.kind];
    roundRect(ctx, x, y, cw, ch, 14);
    ctx.fillStyle = st.bg;
    ctx.fill();
    ctx.strokeStyle = st.bd;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = st.fg;
    ctx.globalAlpha = 0.7;
    ctx.font = f(BODY, 15, 700);
    ctx.fillText(`R${c.round}`, x + cw / 2, y + 30);
    ctx.globalAlpha = 1;
    ctx.font = f(DISPLAY, 24);
    ctx.fillText(c.label, x + cw / 2, y + 64);
    ctx.textAlign = 'left';
  });

  // --- footer ---
  ctx.fillStyle = '#6B7280';
  ctx.font = f(BODY, 22, 500);
  ctx.fillText(`F1 Dashboard 2026  ·  ${d.sprintPoints ? `${d.points} points include ${d.sprintPoints} from sprints` : 'Grand Prix finishes shown above'}`, 84, CARD_H - 70);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not export the card'))), 'image/png');
  });
}
