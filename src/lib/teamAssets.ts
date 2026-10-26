// Maps team names (as used in standings.json / teamColors.ts) to logo file slugs.
// Drop files into public/logos/teams/<slug>.svg (or .png) and public/headshots/<code>.png
// (code lowercase, e.g. ant.png). Missing files fall back to a generated badge.

export const TEAM_LOGO_SLUGS: Record<string, string> = {
  'Red Bull Racing': 'red_bull',
  Mercedes: 'mercedes',
  Ferrari: 'ferrari',
  McLaren: 'mclaren',
  'Racing Bulls': 'racing_bulls',
  Alpine: 'alpine',
  Haas: 'haas',
  'Haas F1 Team': 'haas',
  Audi: 'audi',
  Williams: 'williams',
  'Aston Martin': 'aston_martin',
  Cadillac: 'cadillac',
};

export const TEAM_BADGE_TEXT: Record<string, string> = {
  red_bull: 'RB',
  mercedes: 'MB',
  ferrari: 'SF',
  mclaren: 'MC',
  racing_bulls: 'VCARB',
  alpine: 'A',
  haas: 'HAAS',
  audi: 'AUDI',
  williams: 'W',
  aston_martin: 'AM',
  cadillac: 'CAD',
};

export function teamSlug(teamName: string | null | undefined): string | null {
  if (!teamName) return null;
  return TEAM_LOGO_SLUGS[teamName] ?? null;
}

export const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
