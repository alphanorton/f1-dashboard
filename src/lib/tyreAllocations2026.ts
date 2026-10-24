/**
 * Official 2026 Pirelli dry-compound nominations (Hard / Medium / Soft).
 * These are the compounds nominated for each race weekend, not a claim that every
 * driver used every compound in the race. Actual driver stints remain sourced from OpenF1.
 * A null allocation means Pirelli had not published that nomination as of 25 Oct 2026.
 */
export interface TyreAllocation2026 {
  id: string;
  label: string;
  aliases: string[];
  hard: string | null;
  medium: string | null;
  soft: string | null;
  status: 'confirmed' | 'pending' | 'cancelled';
  source: string;
}

const PIRELLI_OPENING = 'https://press.pirelli.com/complete-f1-tyre-range-for-the-first-three-grands-prix-of-2026/';
const PIRELLI_MIAMI_CANADA = 'https://press.pirelli.com/the-softest-trio-for-the-challenges-of-miami-and-montreal/';
const PIRELLI_MONACO_BARCELONA = 'https://press.pirelli.com/the-tyre-compound-selections-for-monte-carlo-and-barcelona/';
const PIRELLI_AUSTRIA_UK = 'https://press.pirelli.com/the-full-pirelli-range-for-spielberg-and-silverstone/';
const PIRELLI_BELGIUM_HUNGARY = 'https://press.pirelli.com/the-compounds-selected-for-belgium-and-hungary/';
const PIRELLI_DUTCH_ITALIAN_MADRID = 'https://press.pirelli.com/tyre-compounds-selected-for-zandvoort-monza-and-madrid/';
const PIRELLI_BAKU_SEPANG_SINGAPORE = 'https://press.pirelli.com/tyre-compound-selections-for-baku-sepang-and-singapore/';
const PIRELLI_AMERICAS = 'https://press.pirelli.com/the-compound-selection-for-austin-mexico-city-and-so-paulo/';

export const TYRE_ALLOCATIONS_2026: TyreAllocation2026[] = [
  { id: 'australia', label: 'Australian Grand Prix', aliases: ['australian grand prix', 'melbourne', 'albert park'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_OPENING },
  { id: 'china', label: 'Chinese Grand Prix', aliases: ['chinese grand prix', 'shanghai'], hard: 'C2', medium: 'C3', soft: 'C4', status: 'confirmed', source: PIRELLI_OPENING },
  { id: 'japan', label: 'Japanese Grand Prix', aliases: ['japanese grand prix', 'suzuka'], hard: 'C1', medium: 'C2', soft: 'C3', status: 'confirmed', source: PIRELLI_OPENING },
  { id: 'bahrain-cancelled', label: 'Bahrain Grand Prix', aliases: ['bahrain grand prix', 'bahrain international circuit', 'sakhir'], hard: null, medium: null, soft: null, status: 'cancelled', source: 'https://www.formula1.com/en/racing/2026' },
  { id: 'saudi-cancelled', label: 'Saudi Arabian Grand Prix', aliases: ['saudi arabian grand prix', 'jeddah corniche'], hard: null, medium: null, soft: null, status: 'cancelled', source: 'https://www.formula1.com/en/racing/2026' },
  { id: 'miami', label: 'Miami Grand Prix', aliases: ['miami grand prix', 'miami international'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_MIAMI_CANADA },
  { id: 'canada', label: 'Canadian Grand Prix', aliases: ['canadian grand prix', 'montreal', 'gilles-villeneuve'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_MIAMI_CANADA },
  { id: 'monaco', label: 'Monaco Grand Prix', aliases: ['monaco grand prix', 'monte carlo', 'circuit de monaco'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_MONACO_BARCELONA },
  { id: 'barcelona', label: 'Barcelona-Catalunya Grand Prix', aliases: ['barcelona-catalunya', 'barcelona-catalunya grand prix', 'circuit de barcelona-catalunya', 'montmelo'], hard: 'C2', medium: 'C3', soft: 'C4', status: 'confirmed', source: PIRELLI_MONACO_BARCELONA },
  { id: 'austria', label: 'Austrian Grand Prix', aliases: ['austrian grand prix', 'spielberg', 'red bull ring'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_AUSTRIA_UK },
  { id: 'britain', label: 'British Grand Prix', aliases: ['british grand prix', 'silverstone'], hard: 'C1', medium: 'C2', soft: 'C3', status: 'confirmed', source: PIRELLI_AUSTRIA_UK },
  { id: 'belgium', label: 'Belgian Grand Prix', aliases: ['belgian grand prix', 'spa-francorchamps', 'spa francorchamps', 'stavelot'], hard: 'C2', medium: 'C3', soft: 'C4', status: 'confirmed', source: PIRELLI_BELGIUM_HUNGARY },
  { id: 'hungary', label: 'Hungarian Grand Prix', aliases: ['hungarian grand prix', 'hungaroring', 'budapest'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_BELGIUM_HUNGARY },
  { id: 'netherlands', label: 'Dutch Grand Prix', aliases: ['dutch grand prix', 'zandvoort'], hard: 'C2', medium: 'C3', soft: 'C4', status: 'confirmed', source: PIRELLI_DUTCH_ITALIAN_MADRID },
  { id: 'italy', label: 'Italian Grand Prix', aliases: ['italian grand prix', 'monza', 'autodromo nazionale monza'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_DUTCH_ITALIAN_MADRID },
  { id: 'madrid', label: 'Spanish Grand Prix · Madrid', aliases: ['madring', 'madrid', 'spanish grand prix'], hard: 'C2', medium: 'C3', soft: 'C4', status: 'confirmed', source: PIRELLI_DUTCH_ITALIAN_MADRID },
  { id: 'azerbaijan', label: 'Azerbaijan Grand Prix', aliases: ['azerbaijan grand prix', 'baku', 'baku city'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_BAKU_SEPANG_SINGAPORE },
  { id: 'malaysia-replacement', label: 'Bahrain Grand Prix · Sepang replacement', aliases: ['bahrain grand prix in malaysia', 'sepang', 'malaysia'], hard: 'C2', medium: 'C3', soft: 'C4', status: 'confirmed', source: PIRELLI_BAKU_SEPANG_SINGAPORE },
  { id: 'singapore', label: 'Singapore Grand Prix', aliases: ['singapore grand prix', 'marina bay'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_BAKU_SEPANG_SINGAPORE },
  { id: 'usa', label: 'United States Grand Prix', aliases: ['united states grand prix', 'circuit of the americas', 'austin'], hard: 'C2', medium: 'C3', soft: 'C4', status: 'confirmed', source: PIRELLI_AMERICAS },
  { id: 'mexico', label: 'Mexico City Grand Prix', aliases: ['mexico city grand prix', 'autodromo hermanos rodriguez', 'mexico city'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_AMERICAS },
  { id: 'brazil', label: 'São Paulo Grand Prix', aliases: ['sao paulo grand prix', 'são paulo grand prix', 'interlagos', 'jose carlos pace'], hard: 'C3', medium: 'C4', soft: 'C5', status: 'confirmed', source: PIRELLI_AMERICAS },
  { id: 'las-vegas', label: 'Las Vegas Grand Prix', aliases: ['las vegas grand prix', 'las vegas strip'], hard: null, medium: null, soft: null, status: 'pending', source: 'https://press.pirelli.com/?h=1&t=2026+tyre+compound+choices' },
  { id: 'qatar', label: 'Qatar Grand Prix', aliases: ['qatar grand prix', 'lusail'], hard: null, medium: null, soft: null, status: 'pending', source: 'https://press.pirelli.com/?h=1&t=2026+tyre+compound+choices' },
  { id: 'abu-dhabi', label: 'Abu Dhabi Grand Prix', aliases: ['abu dhabi grand prix', 'yas marina'], hard: null, medium: null, soft: null, status: 'pending', source: 'https://press.pirelli.com/?h=1&t=2026+tyre+compound+choices' },
];

function normalize(value: string | null | undefined): string {
  return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function findTyreAllocation2026(values: Array<string | null | undefined>): TyreAllocation2026 | null {
  const text = normalize(values.filter(Boolean).join(' '));
  if (!text) return null;
  // Avoid confusing the cancelled original Bahrain event with its Sepang replacement.
  if (text.includes('sepang') || text.includes('malaysia')) {
    return TYRE_ALLOCATIONS_2026.find((item) => item.id === 'malaysia-replacement') ?? null;
  }
  if (text.includes('barcelona') || text.includes('catalunya') || text.includes('montmelo')) {
    return TYRE_ALLOCATIONS_2026.find((item) => item.id === 'barcelona') ?? null;
  }
  if (text.includes('madring') || text.includes('madrid') || text.includes('spanish grand prix')) {
    return TYRE_ALLOCATIONS_2026.find((item) => item.id === 'madrid') ?? null;
  }
  return TYRE_ALLOCATIONS_2026.find((item) => item.aliases.some((alias) => text.includes(normalize(alias)))) ?? null;
}
