import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircuitImage } from '@/components/track/CircuitImage';
import { CircuitInteractiveMap } from '@/components/track/CircuitInteractiveMap';
import { Map, MapPin, Flag, ChevronLeft, ChevronRight, Crown, Gauge } from 'lucide-react';
import { useChampion } from '@/hooks/useChampion';
import { circuitSlug } from '@/lib/trackPaths';
import { getCircuitPhoto } from '@/lib/circuitPhotos';
import { getFlagUrl } from '@/lib/flags';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/PageLoader';
import { ErrorState } from '@/components/ui/ErrorState';

interface Corner {
  number: number;
  name: string;
  type: string;
  speed: string;
  gear: string | number;
  notes?: string;
}

interface Circuit {
  id: string;
  name: string;
  country: string;
  city: string;
  length: number;
  laps: number;
  turns: number;
  raceDistance?: number;
  capacity: number;
  lapRecord: string;
  maxGForce: string;
  maxGForceHistorical?: boolean;
  sectors: number;
  trackMapUrl?: string;
  flag?: string;
  corners: Corner[];
}

interface CircuitsData {
  season: number;
  circuits: Circuit[];
}

const SPEED_COLOR: Record<string, string> = {
  very_fast: 'text-red-400',
  fast: 'text-orange-400',
  medium: 'text-yellow-400',
  slow: 'text-blue-400',
};

const getSpeedColor = (speed: string) => SPEED_COLOR[speed] ?? 'text-gray-400';

const getSpeedLabel = (speed: string) =>
  ({ very_fast: 'Very fast', fast: 'Fast', medium: 'Medium', slow: 'Slow' }[speed] ?? speed);

const SECTOR_COLORS = ['#e10600', '#00b6e8', '#f5c542'] as const;

/** "1:19.813 (Charles Leclerc, Ferrari, 2024)" -> parts, when the record string follows that shape. */
function parseLapRecord(record: string): { time: string | null; rest: string | null } {
  const m = record.match(/^([\d:.]+)\s*\((.+?),\s*(\d{4})\)$/);
  if (!m) return { time: null, rest: record || null };
  return { time: m[1], rest: `${m[2]} · ${m[3]}` };
}

export function TrackMapPage() {
  const [data, setData] = useState<CircuitsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [measuredNums, setMeasuredNums] = useState<number[]>([]);

  const [retryKey, setRetryKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const { champion, wins } = useChampion();
  const winAt = (c: { name: string }) => { const slug = circuitSlug(c.name); return slug ? wins.get(slug) ?? null : null; };
  const surname = champion?.name.split(' ').slice(-1)[0] ?? '';

  // UX: the selected circuit lives in the URL (?circuit=spa) so it survives refresh and can be shared.
  const pick = (c: Circuit, scroll = false) => {
    setSelectedCircuit(c);
    setImageError(null);
    setActiveCorner(null);
    setMeasuredNums([]);
    setSearchParams({ circuit: c.id }, { replace: true });
    if (scroll) mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/data/circuits.json')
      .then(res => res.json())
      .then((d: CircuitsData) => {
        if (cancelled) return;
        setData(d);
        if (d.circuits.length > 0) {
          setSelectedCircuit(c => c ?? d.circuits.find(x => x.id === new URLSearchParams(window.location.search).get('circuit')) ?? d.circuits[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [retryKey]);

  const handleActiveCorner = useCallback((n: number | null) => setActiveCorner(n), []);
  const handleMeasured = useCallback((nums: number[]) => setMeasuredNums(nums), []);

  if (!loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="2026 circuit maps" subtitle="Circuit maps with corner details" icon={Map} />
        <ErrorState
          title="Could not load circuits"
          message="The circuit data is unavailable right now."
          onRetry={() => {
            setData(null);
            setLoading(true);
            setRetryKey(k => k + 1);
          }}
        />
      </div>
    );
  }

  if (loading || !data) {
    return <PageLoader message="Loading circuits..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="2026 circuit maps"
        subtitle={`${data.circuits.length} circuits · interactive layout, measured turns & circuit intelligence`}
        icon={Map}
      />

      {/* Circuit Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <MapPin className="h-5 w-5 text-red-500 shrink-0" />
            <label htmlFor="circuit-select" className="sr-only">Select a circuit</label>
            <select
              id="circuit-select"
              value={selectedCircuit?.id || ''}
              onChange={(e) => {
                const circuit = data.circuits.find(c => c.id === e.target.value);
                if (circuit) pick(circuit);
              }}
              className="flex-1 min-w-[250px] h-10 px-3 bg-surface border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
            >
              {data.circuits.map(c => (
                <option key={c.id} value={c.id}>
                  {c.flag || '🏁'} {c.name} ({c.country})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Track Map Display */}
      {selectedCircuit && (
        <Card className="overflow-hidden scroll-mt-20" ref={mapRef as React.Ref<HTMLDivElement>}>
          <CardHeader className="border-b border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {getFlagUrl(selectedCircuit.country) ? (
                  <img src={getFlagUrl(selectedCircuit.country)!} alt={`${selectedCircuit.country} flag`} className="w-9 h-6 object-cover rounded-sm" />
                ) : (
                  <span className="text-3xl">🏁</span>
                )}
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedCircuit.name}</h2>
                  <p className="text-gray-400">{selectedCircuit.city}, {selectedCircuit.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const i = data.circuits.findIndex(c => c.id === selectedCircuit.id);
                  const btn = 'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-surface text-gray-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red';
                  return (
                    <>
                      <button type="button" className={btn} aria-label="Previous circuit" onClick={() => pick(data.circuits[(i - 1 + data.circuits.length) % data.circuits.length])}><ChevronLeft className="h-4 w-4" /></button>
                      <button type="button" className={btn} aria-label="Next circuit" onClick={() => pick(data.circuits[(i + 1) % data.circuits.length])}><ChevronRight className="h-4 w-4" /></button>
                    </>
                  );
                })()}
                <span className="px-3 py-1 bg-surface border border-gray-700 rounded-lg text-xs text-gray-300 font-mono tabular-nums">
                  {selectedCircuit.length.toFixed(3)} km
                </span>
                <span className="px-3 py-1 bg-surface border border-gray-700 rounded-lg text-xs text-gray-300 tabular-nums">
                  {selectedCircuit.turns} turns
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Interactive circuit map (verified traced geometry) */}
            <CircuitInteractiveMap
              key={selectedCircuit.id}
              circuit={selectedCircuit}
              className="tmx-stage bg-[#0b0d10]"
              activeCorner={activeCorner}
              onActiveCornerChange={handleActiveCorner}
              onMeasuredCorners={handleMeasured}
              fallback={
                <CircuitImage
                  circuitId={selectedCircuit.id}
                  name={selectedCircuit.name}
                  trackMapUrl={selectedCircuit.trackMapUrl}
                  className="max-h-[560px]"
                  badge={champion && winAt(selectedCircuit) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300/50 bg-black/70 px-3 py-1.5 text-xs font-bold text-yellow-300 backdrop-blur">
                      <Crown className="h-3.5 w-3.5" aria-hidden="true" /> {surname} won here · R{winAt(selectedCircuit)!.round}
                    </span>
                  ) : undefined}
                />
              }
              badge={champion && winAt(selectedCircuit) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300/50 bg-black/70 px-3 py-1.5 text-xs font-bold text-yellow-300 backdrop-blur">
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" /> {surname} won here · R{winAt(selectedCircuit)!.round}
                </span>
              ) : undefined}
            />

            <p className="border-t border-gray-800 px-4 py-3 text-xs text-gray-400">
              Interactive layout traced from the official circuit map. Turn markers are measured peaks of curvature along that line
              (numbered from its origin — independent from official turn numbering); the start/finish bar sits at the line origin.
            </p>

            {/* Verified circuit photograph (only when one is confidently matched) */}
            {(() => {
              const photo = getCircuitPhoto(selectedCircuit.name);
              if (!photo) return null;
              return (
                <div className="relative h-44 w-full overflow-hidden border-t border-gray-800 sm:h-56">
                  <img
                    src={photo.src}
                    alt={`${selectedCircuit.name} aerial view`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(0deg, rgba(12,14,17,0.96) 0%, rgba(12,14,17,0.35) 55%, rgba(12,14,17,0.12) 100%)',
                    }}
                  />
                  <div className="absolute bottom-3 left-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Verified circuit photograph</p>
                    <p className="text-sm font-bold text-white">{selectedCircuit.name}</p>
                  </div>
                </div>
              );
            })()}

            {/* Technical information panel */}
            <div className="border-t border-gray-800 bg-[#0c0e11] p-4 sm:p-5">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                <Gauge className="h-3.5 w-3.5 text-f1-red" aria-hidden="true" /> Circuit intelligence
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {(() => {
                  const rec = parseLapRecord(selectedCircuit.lapRecord);
                  const tiles: Array<{
                    label: string;
                    value: React.ReactNode;
                    sub?: string;
                    accent?: boolean;
                  }> = [
                    { label: 'Track length', value: `${selectedCircuit.length.toFixed(3)}`, sub: 'km · per lap' },
                    { label: 'Laps', value: selectedCircuit.laps, sub: selectedCircuit.raceDistance !== undefined ? `${selectedCircuit.raceDistance.toFixed(3)} km race` : 'Race distance not in local data', accent: selectedCircuit.raceDistance === undefined },
                    { label: 'Corners', value: selectedCircuit.turns, sub: `${selectedCircuit.corners.length} in dataset` },
                    { label: 'Sectors', value: selectedCircuit.sectors, sub: 'Split points not in local data', accent: true },
                    { label: 'DRS zones', value: '—', sub: 'Not available in local data', accent: true },
                    rec.time
                      ? { label: 'Lap record', value: rec.time, sub: rec.rest ?? undefined, accent: true }
                      : { label: 'Lap record', value: selectedCircuit.lapRecord || '—', sub: selectedCircuit.lapRecord ? undefined : 'Not available locally' },
                  ];
                  return tiles.map((t, idx) => (
                    <div
                      key={idx}
                      className="tmx-tile"
                      style={t.accent ? { borderBottomColor: 'rgba(225,6,0,.55)' } : undefined}
                    >
                      <p className="tmx-tile-label">{t.label}</p>
                      <p className="tmx-tile-value">{t.value}</p>
                      {t.sub && <p className="tmx-tile-sub" style={t.accent ? { color: '#ff8f89' } : undefined}>{t.sub}</p>}
                    </div>
                  ));
                })()}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="tmx-tile">
                  <p className="tmx-tile-label">Spectator capacity</p>
                  <p className="tmx-tile-value">{selectedCircuit.capacity.toLocaleString('en-US')}</p>
                </div>
                <div className="tmx-tile">
                  <p className="tmx-tile-label">{selectedCircuit.maxGForceHistorical ? 'Highest documented G-force' : 'Max G-force'}</p>
                  <p className="tmx-tile-value">{selectedCircuit.maxGForce}</p>
                </div>
                <div className="tmx-tile">
                  <p className="tmx-tile-label">Circuit type</p>
                  <p className="tmx-tile-value">Grade 1 · {selectedCircuit.turns} turns</p>
                  <p className="tmx-tile-sub">Per local circuit dataset</p>
                </div>
              </div>

              {/* Sector tags — boundaries are not present in local datasets, so they are not drawn on the map */}
              <div className="mt-4 flex flex-wrap items-center gap-2" role="list" aria-label="Sectors">
                {['Sector 1', 'Sector 2', 'Sector 3'].map((s, i) => (
                  <span key={s} role="listitem" className="tmx-sector" style={{ borderColor: SECTOR_COLORS[i] }}>
                    <span className="tmx-sector-dot" style={{ background: SECTOR_COLORS[i] }} aria-hidden="true" />
                    {s}
                  </span>
                ))}
                <span className="tmx-sector-note">Split points not available in local data — sectors are not drawn on the map</span>
              </div>
            </div>

            {/* Corner explorer — official dataset list */}
            <div className="border-t border-gray-800 bg-[#0c0e11] p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  <Flag className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> Corner list ({selectedCircuit.corners.length} · official dataset)
                </p>
                <p className="text-[11px] text-gray-500">
                  {measuredNums.length} turn peak{measuredNums.length === 1 ? '' : 's'} measured on the traced layout
                </p>
              </div>
              <div className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                {selectedCircuit.corners.map((corner, idx) => (
                  <div key={`${corner.number}-${idx}`} className="tmx-cornerrow tmx-cornerrow-static">
                    <span className="tmx-cr-num">{corner.number}</span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-xs font-semibold text-white">{corner.name}</span>
                      {corner.notes && <span className="block truncate text-[10px] text-gray-500">{corner.notes}</span>}
                    </span>
                    <span className={`shrink-0 text-[10px] font-bold uppercase ${getSpeedColor(corner.speed)}`}>
                      {getSpeedLabel(corner.speed)}
                    </span>
                    <span className="w-10 shrink-0 text-right font-mono text-[10px] text-amber-400 tabular-nums">G{corner.gear}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                Names, speed profiles and gears come from the local circuit dataset. Map turn markers are measured from the traced
                geometry and numbered independently — the two numberings are not interchangeable.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Circuits Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-green-400" />
            All 2026 circuits
          </CardTitle>
          {champion && (
            <p className="flex items-center gap-1.5 pt-1 text-xs text-gray-400">
              <Crown className="h-3.5 w-3.5 text-yellow-300" aria-hidden="true" />
              Crown marks circuits where {champion.name} won in 2026 ({wins.size})
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.circuits.map(c => (
              <button
                key={c.id}
                onClick={() => pick(c, true)}
                aria-pressed={selectedCircuit?.id === c.id}
                className={`p-3 rounded-lg text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red ${
                  selectedCircuit?.id === c.id
                    ? 'bg-f1-red/15 border-2 border-f1-red/70'
                    : 'bg-surface border border-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getFlagUrl(c.country) ? (
                    <img src={getFlagUrl(c.country)!} alt={`${c.country} flag`} className="w-7 h-5 object-cover rounded-sm shrink-0" />
                  ) : (
                    <span className="text-xl shrink-0">🏁</span>
                  )}
                  <p className="font-bold text-white text-sm">{c.name}</p>
                  {champion && winAt(c) && (
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300" title={`${champion.name} won the ${winAt(c)!.race}`}>
                      <Crown className="h-3 w-3" aria-hidden="true" /><span className="sr-only">{champion.name} won here</span>R{winAt(c)!.round}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{c.city}, {c.country}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 tabular-nums">
                  <span>{c.length.toFixed(3)} km</span>
                  <span>•</span>
                  <span>{c.turns} turns</span>
                  <span>•</span>
                  <span>{c.capacity.toLocaleString('en-US')}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
