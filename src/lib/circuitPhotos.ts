/**
 * Circuit photography for the 2026 calendar.
 *
 * All 25 calendar rounds have a bundled photograph. Most are aerial views; Las Vegas and Yas Marina
 * are trackside race photos. Check licensing before publishing the site.
 */

export interface CircuitPhoto {
  /** Path under /public. */
  src: string;
  /** Circuit the photo was verified against. */
  circuit: string;
  /** Grand Prix round in the 2026 calendar. */
  round: number;
  /** Provenance note. Never put local file paths here: this module ships in the public bundle. */
  source: string;
}

const PHOTOS: CircuitPhoto[] = [
  { src: '/circuits/melbourne.webp', circuit: 'Albert Park Circuit', round: 1, source: 'bundled asset' },
  { src: '/circuits/shanghai.webp', circuit: 'Shanghai International Circuit', round: 2, source: 'bundled asset' },
  { src: '/circuits/suzuka.webp', circuit: 'Suzuka International Racing Course', round: 3, source: 'bundled asset' },
  { src: '/circuits/bahrain.webp', circuit: 'Bahrain International Circuit', round: 4, source: 'bundled asset' },
  { src: '/circuits/jeddah.webp', circuit: 'Jeddah Corniche Circuit', round: 5, source: 'bundled asset' },
  { src: '/circuits/miami.webp', circuit: 'Miami International Autodrome', round: 6, source: 'bundled asset' },
  { src: '/circuits/montreal.webp', circuit: 'Circuit Gilles-Villeneuve', round: 7, source: 'bundled asset' },
  { src: '/circuits/monaco.webp', circuit: 'Circuit de Monaco', round: 8, source: 'bundled asset' },
  { src: '/circuits/barcelona.webp', circuit: 'Circuit de Barcelona-Catalunya', round: 9, source: 'bundled asset' },
  { src: '/circuits/red_bull_ring.webp', circuit: 'Red Bull Ring', round: 10, source: 'bundled asset' },
  { src: '/circuits/silverstone.webp', circuit: 'Silverstone Circuit', round: 11, source: 'bundled asset' },
  { src: '/circuits/spa.webp', circuit: 'Circuit de Spa-Francorchamps', round: 12, source: 'bundled asset' },
  { src: '/circuits/hungaroring.webp', circuit: 'Hungaroring', round: 13, source: 'bundled asset' },
  { src: '/circuits/zandvoort.webp', circuit: 'Circuit Zandvoort', round: 14, source: 'bundled asset' },
  { src: '/circuits/monza.webp', circuit: 'Autodromo Nazionale Monza', round: 15, source: 'bundled asset' },
  { src: '/circuits/madring.webp', circuit: 'Madring Circuit', round: 16, source: 'bundled asset' },
  { src: '/circuits/baku.webp', circuit: 'Baku City Circuit', round: 17, source: 'bundled asset' },
  { src: '/circuits/sepang.webp', circuit: 'Sepang International Circuit', round: 18, source: 'bundled asset' },
  { src: '/circuits/singapore.webp', circuit: 'Marina Bay Street Circuit', round: 19, source: 'bundled asset' },
  { src: '/circuits/cota.webp', circuit: 'Circuit of the Americas', round: 20, source: 'bundled asset' },
  { src: '/circuits/mexico.webp', circuit: 'Autódromo Hermanos Rodríguez', round: 21, source: 'bundled asset' },
  { src: '/circuits/interlagos.webp', circuit: 'Autódromo José Carlos Pace', round: 22, source: 'bundled asset' },
  { src: '/circuits/las_vegas.webp', circuit: 'Las Vegas Strip Circuit', round: 23, source: 'bundled asset' },
  { src: '/circuits/losail.webp', circuit: 'Lusail International Circuit', round: 24, source: 'bundled asset' },
  { src: '/circuits/yas_marina.webp', circuit: 'Yas Marina Circuit', round: 25, source: 'bundled asset' },
];

/** Aliases for circuit lookup. */
const ALIASES: Record<string, string> = {
  'albert park': 'albert park circuit',
  'circuit de barcelona-catalunya': 'circuit de barcelona-catalunya',
  'barcelona-catalunya': 'circuit de barcelona-catalunya',
  'circuit gilles-villeneuve': 'circuit gilles-villeneuve',
  'montreal': 'circuit gilles-villeneuve',
  'circuit of the americas': 'circuit of the americas',
  'autódromo hermanos rodríguez': 'autódromo hermanos rodríguez',
  'autodromo hermanos rodriguez': 'autódromo hermanos rodríguez',
  'mexico city': 'autódromo hermanos rodríguez',
  'red bull ring': 'red bull ring',
  'spielberg': 'red bull ring',
  'baku city circuit': 'baku city circuit',
  'baku': 'baku city circuit',
  'madring circuit': 'madring circuit',
  'marina bay street circuit': 'marina bay street circuit',
  'singapore': 'marina bay street circuit',
  'suzuka': 'suzuka international racing course',
  'suzuka circuit': 'suzuka international racing course',
  'interlagos': 'autódromo josé carlos pace',
  'são paulo': 'autódromo josé carlos pace',
};

function normalise(value: string): string {
  const norm = value.trim().toLowerCase();
  return ALIASES[norm] || norm;
}

const BY_CIRCUIT = new Map(PHOTOS.map((p) => [normalise(p.circuit), p]));
const BY_ROUND = new Map(PHOTOS.map((p) => [p.round, p]));

/** Photo for a circuit name (calendar / circuits.json / track-paths.json wording all accepted). */
export function getCircuitPhoto(name: string | undefined | null): CircuitPhoto | null {
  if (!name) return null;
  return BY_CIRCUIT.get(normalise(name)) ?? null;
}

/** Photo for a 2026 calendar round. */
export function getCircuitPhotoByRound(round: number | undefined | null): CircuitPhoto | null {
  if (round == null) return null;
  return BY_ROUND.get(round) ?? null;
}

/** Photo for a race-like object, preferring the circuit name and falling back to the round. */
export function getCircuitPhotoForRace(race: { circuit?: string; round?: number } | null | undefined): CircuitPhoto | null {
  if (!race) return null;
  return getCircuitPhoto(race.circuit) ?? getCircuitPhotoByRound(race.round);
}

/** Every deployed photo, used by the coverage panel. */
export function allCircuitPhotos(): CircuitPhoto[] {
  return PHOTOS;
}
