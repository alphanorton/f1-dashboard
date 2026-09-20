import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface CircuitImageProps {
  circuitId: string;
  name: string;
  trackMapUrl?: string;
  className?: string;
}

type LoadState = 'loading' | 'loaded' | 'error';

const RETRY_DELAYS_MS = [1500, 4000];

export function CircuitImage({ circuitId, name, trackMapUrl, className }: CircuitImageProps) {
  const hasUrl = Boolean(trackMapUrl);
  const [state, setState] = useState<LoadState>(hasUrl ? 'loading' : 'error');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState(Boolean(trackMapUrl) ? 'loading' : 'error');
    setAttempt(0);
  }, [circuitId, trackMapUrl]);

  useEffect(() => {
    if (state !== 'error' || !hasUrl || attempt >= RETRY_DELAYS_MS.length) return;
    const delay = RETRY_DELAYS_MS[attempt];
    const timer = setTimeout(() => setState('loading'), delay);
    return () => clearTimeout(timer);
  }, [state, attempt, hasUrl]);

  const showSpinner = state === 'loading';
  const showFallback = !hasUrl || (state === 'error' && attempt >= RETRY_DELAYS_MS.length);

  return (
    <div className={cn('relative w-full aspect-[4/3] overflow-hidden bg-black', className)}>
      {hasUrl && (
        <img
          key={`${circuitId}-${attempt}`}
          src={trackMapUrl}
          alt={`${name} track map`}
          loading="lazy"
          decoding="async"
          onLoad={() => {
            setState('loaded');
            setAttempt(0);
          }}
          onError={() => {
            setState('error');
            setAttempt(a => Math.min(a + 1, RETRY_DELAYS_MS.length));
          }}
          className={cn(
            'absolute inset-0 h-full w-full object-contain',
            state !== 'loaded' && 'invisible'
          )}
        />
      )}

      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {state === 'loaded' && (
        <p className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] text-gray-300">
          Legacy F1 diagram - 2026 layout may differ
        </p>
      )}

      {showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center p-4">
            <p className="font-f1 text-lg font-bold text-white">{name}</p>
            <p className="mt-2 text-sm text-gray-400">Track map image is unavailable right now</p>
            <p className="text-xs text-gray-600 mt-1">
              The official Formula 1 map CDN did not respond. It will appear automatically once reachable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
