// Pure motion helpers (no React, no DOM) so they can be unit-tested with plain node.

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

// Fast start, soft landing - the "ticker" feel used by counting numbers.
export function easeOutExpo(t: number): number {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function decimalPlaces(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  if (s.includes('e-')) return Math.min(6, Number(s.split('e-')[1]));
  const i = s.indexOf('.');
  return i === -1 ? 0 : Math.min(6, s.length - i - 1);
}

// Value shown `progress` (0..1) of the way from `from` to `to`. Exactly `to` at progress >= 1,
// so the final frame never drifts from the real figure.
export function countUpValue(from: number, to: number, progress: number, decimals = 0): number {
  if (progress >= 1) return to;
  const raw = from + (to - from) * easeOutExpo(progress);
  const f = Math.pow(10, decimals);
  return Math.round(raw * f) / f;
}

export function formatCount(value: number, decimals = 0, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Lap time in seconds -> m:ss.mmm. Rounds to whole milliseconds first so 59.9996 becomes
// 1:00.000 instead of the invalid 0:60.000.
export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return '—';
  const totalMs = Math.round(seconds * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const rest = (totalMs - minutes * 60000) / 1000;
  return `${minutes}:${rest.toFixed(3).padStart(6, '0')}`;
}
