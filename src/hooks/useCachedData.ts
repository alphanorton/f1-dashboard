import { useState, useEffect } from 'react';

interface CacheEntry {
  data?: unknown;
  request?: Promise<unknown>;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const staticJsonCache = new Map<string, CacheEntry>();

async function fetchStaticJson<T>(path: string): Promise<T> {
  const cached = staticJsonCache.get(path);
  if (cached?.data !== undefined && cached.expiresAt > Date.now()) return cached.data as T;
  if (cached?.request) return cached.request as Promise<T>;

  const request = fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch ${path}`);
      return res.json() as Promise<T>;
    })
    .then((data) => {
      staticJsonCache.set(path, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    })
    .catch((error: unknown) => {
      if (staticJsonCache.get(path)?.request === request) staticJsonCache.delete(path);
      throw error;
    });

  staticJsonCache.set(path, { request, expiresAt: 0 });
  return request;
}

export function useCachedData<T>(cacheKey: string, staticPath: string): { data: T | null; loading: boolean; error: string | null } {
  const cached = staticJsonCache.get(staticPath);
  const hasFreshData = cached?.data !== undefined && cached.expiresAt > Date.now();
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>(() => ({
    data: hasFreshData ? (cached.data as T) : null,
    loading: !hasFreshData,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;
    if (hasFreshData) {
      setState({ data: cached.data as T, loading: false, error: null });
      return () => { cancelled = true; };
    }

    setState((current) => ({ ...current, loading: current.data === null, error: null }));
    fetchStaticJson<T>(staticPath)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            loading: false,
            error: err instanceof Error ? err.message : 'Load failed',
          }));
        }
      });
    return () => { cancelled = true; };
  }, [cacheKey, staticPath]);

  return state;
}

