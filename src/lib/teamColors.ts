// 2026 constructor colours.
//
// Values are the teams' 2026 livery colours. Where a team's livery is carried by a light or
// neutral shade (Cadillac runs black and white) the visible-on-dark surface colour is used
// and flagged in the note below, because a black stripe is invisible on the dashboard's dark
// background. Racing Bulls runs race-specific liveries; the season colour is used.
//
// Cadillac's white has no note field in the data, so the reason lives here rather than being
// silently baked into the value.

export const TEAM_COLORS_2026: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  Mercedes: '#27F4D2',
  Ferrari: '#E80020',
  McLaren: '#FF8000',
  'Racing Bulls': '#6692FF',
  Alpine: '#0090FF',
  Haas: '#E6002B',
  Audi: '#F50537',
  Williams: '#64C4FF',
  'Aston Martin': '#00665E',
  // Black and white livery - white is the part that reads on a dark background.
  Cadillac: '#FFFFFF',
};

export const UNKNOWN_TEAM_COLOR = '#6B7280';

// Team colours read as text on the dashboard's dark surface (gray-900/60 over gray-900, #111827).
// Aston Martin's livery teal sits at roughly 2.5:1 there, too low to read as small bold text, so
// only its text colour is lifted along the same hue. Chips, bars and fills keep the livery value.
const TEAM_TEXT_COLOR_OVERRIDES_2026: Record<string, string> = {
  'Aston Martin': '#00A17E',
};

export function getTeamColor2026(teamName: string | null | undefined): string {
  if (!teamName) return UNKNOWN_TEAM_COLOR;
  return TEAM_COLORS_2026[teamName] ?? UNKNOWN_TEAM_COLOR;
}

// The same colours, with the legibility fix applied, for team names set as text.
export function getTeamTextColor2026(teamName: string | null | undefined): string {
  if (!teamName) return UNKNOWN_TEAM_COLOR;
  return TEAM_TEXT_COLOR_OVERRIDES_2026[teamName] ?? getTeamColor2026(teamName);
}

// A translucent fill for table rows and chips: keeps the team colour visible while leaving the
// dark surface readable underneath.
export function teamTint(color: string, alpha = 0.14): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Picks black or white text for a chip filled with the team colour, so light team colours
// (Mercedes turquoise, Williams, Cadillac) stay legible.
export function contrastText(color: string): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0B0B12' : '#FFFFFF';
}