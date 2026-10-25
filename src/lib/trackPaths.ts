import { useEffect, useState } from 'react';

// Real circuit centre-lines, traced from the PNG track maps in /public/data/track-maps
// (see /public/data/track-paths.json). Coordinates are in the PNG's own pixel space.
export interface TrackPath {
  w: number;
  h: number;
  d: string;
  bbox: [number, number, number, number];
}

type TrackPathMap = Record<string, TrackPath>;

let cache: Promise<TrackPathMap> | null = null;

function loadTrackPaths(): Promise<TrackPathMap> {
  if (!cache) {
    cache = fetch('/data/track-paths.json')
      .then((res) => {
        if (!res.ok) throw new Error('track paths unavailable');
        return res.json() as Promise<TrackPathMap>;
      })
      .catch(() => {
        cache = null;
        return {} as TrackPathMap;
      });
  }
  return cache;
}

const CIRCUIT_SLUGS: Array<[RegExp, string]> = [
  [/albert park/i, 'albert_park'],
  [/shanghai/i, 'shanghai'],
  [/suzuka/i, 'suzuka'],
  [/miami/i, 'miami'],
  [/villeneuve|montreal/i, 'montreal'],
  [/monaco/i, 'monaco'],
  [/barcelona|catalunya/i, 'barcelona'],
  [/red bull ring|spielberg/i, 'red_bull_ring'],
  [/silverstone/i, 'silverstone'],
  [/francorchamps/i, 'spa'],
  [/hungaroring/i, 'hungaroring'],
  [/zandvoort/i, 'zandvoort'],
  [/monza|nazionale/i, 'monza'],
  [/madring|madrid/i, 'madrid'],
  [/baku/i, 'baku'],
  [/sepang/i, 'sepang'],
  [/marina bay|singapore/i, 'singapore'],
  [/americas|cota/i, 'cota'],
  [/rodr[ií]guez|mexico/i, 'mexico'],
  [/interlagos|jos[eé] carlos pace/i, 'interlagos'],
  [/las vegas/i, 'las_vegas'],
  [/lusail|losail/i, 'losail'],
  [/yas marina/i, 'yas_marina'],
];

export function circuitSlug(circuitName: string): string | null {
  for (const [pattern, slug] of CIRCUIT_SLUGS) {
    if (pattern.test(circuitName)) return slug;
  }
  return null;
}

/** Returns the traced layout for a circuit, or null while loading / when none was traced. */
export function useTrackPath(circuitName?: string): TrackPath | null {
  const [track, setTrack] = useState<TrackPath | null>(null);

  useEffect(() => {
    let cancelled = false;
    const slug = circuitName ? circuitSlug(circuitName) : null;
    if (!slug) {
      setTrack(null);
      return;
    }
    loadTrackPaths().then((all) => {
      if (!cancelled) setTrack(all[slug] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [circuitName]);

  return track;
}
