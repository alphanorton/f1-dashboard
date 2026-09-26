const COUNTRY_CODES: Record<string, string> = {
  'Australia': 'au',
  'Austria': 'at',
  'Azerbaijan': 'az',
  'Bahrain': 'bh',
  'Belgium': 'be',
  'Brazil': 'br',
  'Canada': 'ca',
  'China': 'cn',
  'France': 'fr',
  'Germany': 'de',
  'Hungary': 'hu',
  'Italy': 'it',
  'Japan': 'jp',
  'Malaysia': 'my',
  'Mexico': 'mx',
  'Monaco': 'mc',
  'Netherlands': 'nl',
  'Qatar': 'qa',
  'Russia': 'ru',
  'Saudi Arabia': 'sa',
  'Singapore': 'sg',
  'Spain': 'es',
  'Turkey': 'tr',
  'UAE': 'ae',
  'United Arab Emirates': 'ae',
  'United Kingdom': 'gb',
  'UK': 'gb',
  'USA': 'us',
  'United States': 'us',
};

export function getFlagUrl(country: string): string | null {
  const code = COUNTRY_CODES[country];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

export function getFlagEmoji(country: string): string {
  const code = COUNTRY_CODES[country];
  if (!code) return '🏁';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 0x1f1a5 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
