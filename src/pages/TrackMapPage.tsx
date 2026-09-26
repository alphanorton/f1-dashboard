import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CircuitImage } from '@/components/track/CircuitImage';
import { Map, MapPin, Flag, Info, Image as ImageIcon, Eye } from 'lucide-react';
import { getFlagUrl } from '@/lib/flags';

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

export function TrackMapPage() {
  const [data, setData] = useState<CircuitsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/circuits.json')
      .then(res => res.json())
      .then((d: CircuitsData) => {
        setData(d);
        if (d.circuits.length > 0) {
          setSelectedCircuit(d.circuits[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load circuits:', err);
        setLoading(false);
      });
  }, []);

  if (!loading && !data) {
    return <div role="alert" className="p-6 text-red-400">Failed to load circuits.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading circuits...</p>
        </div>
      </div>
    );
  }

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'very_fast': return 'text-red-400';
      case 'fast': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'slow': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getSpeedLabel = (speed: string) => {
    switch (speed) {
      case 'very_fast': return 'Very fast';
      case 'fast': return 'Fast';
      case 'medium': return 'Medium';
      case 'slow': return 'Slow';
      default: return speed;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Map className="h-8 w-8 text-red-600" />
          2026 circuit maps
        </h1>
        <p className="text-gray-400 mt-2">{data.circuits.length} circuits with map images and corner details</p>
      </div>

      {/* Circuit Selector */}
      <Card className="border-gray-800 bg-gray-900/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <MapPin className="h-5 w-5 text-red-500 shrink-0" />
            <select
              value={selectedCircuit?.id || ''}
              onChange={(e) => {
                const circuit = data.circuits.find(c => c.id === e.target.value);
                if (circuit) {
                  setSelectedCircuit(circuit);
                  setImageError(null);
                }
              }}
              className="flex-1 min-w-[250px] px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
        <Card className="border-gray-800 bg-gray-900/60 overflow-hidden">
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
                <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 font-mono">
                  {selectedCircuit.length.toFixed(3)} km
                </span>
                <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300">
                  {selectedCircuit.turns} turns
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Track Map Image */}
            <CircuitImage
              key={selectedCircuit.id}
              circuitId={selectedCircuit.id}
              name={selectedCircuit.name}
              trackMapUrl={selectedCircuit.trackMapUrl}
              className="max-h-[560px]"
            />
            <p className="border-t border-gray-800 px-4 py-3 text-xs text-gray-400">
              Source: Formula 1 legacy circuit diagrams. Layouts may differ from the 2026 configuration.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-900/40 border-t border-gray-800">
              <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <p className="text-xs text-gray-500 mb-1">Track length</p>
                <p className="text-lg font-bold text-white">{selectedCircuit.length.toFixed(3)} km</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <p className="text-xs text-gray-500 mb-1">Laps</p>
                <p className="text-lg font-bold text-white">{selectedCircuit.laps}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <p className="text-xs text-gray-500 mb-1">Spectator capacity</p>
                <p className="text-lg font-bold text-emerald-400">{selectedCircuit.capacity.toLocaleString('en-US')}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <p className="text-xs text-gray-500 mb-1">
                  {selectedCircuit.maxGForceHistorical ? 'Highest documented G-force' : 'Max G-force'}
                </p>
                <p className="text-lg font-bold text-red-400">{selectedCircuit.maxGForce}</p>
              </div>
              {selectedCircuit.raceDistance !== undefined && (
                <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60">
                  <p className="text-xs text-gray-500 mb-1">Race distance</p>
                  <p className="text-lg font-bold text-white">{selectedCircuit.raceDistance.toFixed(3)} km</p>
                </div>
              )}
            </div>

            {/* Lap Record & Corners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-900/40 border-t border-gray-800">
              <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-800">
                <div className="flex items-center gap-1.5 text-blue-400 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Lap record</span>
                </div>
                <p className="text-sm text-gray-300 font-mono">{selectedCircuit.lapRecord}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-800">
                <div className="flex items-center gap-1.5 text-amber-400 mb-2">
                  <Flag className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Corners ({selectedCircuit.corners.length})</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {selectedCircuit.corners.map((corner, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-gray-900/50 rounded border border-gray-800">
                      <span className="font-mono text-white font-bold w-8 text-center">{corner.number}</span>
                      <span className="text-white flex-1 text-right pr-2 truncate">{corner.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${getSpeedColor(corner.speed)}`}>
                        {getSpeedLabel(corner.speed)}
                      </span>
                      <span className="font-mono text-amber-400 w-10 text-center">{corner.gear}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Circuits Grid */}
      <Card className="border-gray-800 bg-gray-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-green-400" />
            All 2026 circuits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.circuits.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCircuit(c);
                  setImageError(null);
                }}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedCircuit?.id === c.id
                    ? 'bg-red-500/20 border-2 border-red-500'
                    : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getFlagUrl(c.country) ? (
                    <img src={getFlagUrl(c.country)!} alt={`${c.country} flag`} className="w-7 h-5 object-cover rounded-sm shrink-0" />
                  ) : (
                    <span className="text-xl shrink-0">🏁</span>
                  )}
                  <p className="font-bold text-white text-sm">{c.name}</p>
                </div>
                <p className="text-xs text-gray-400 truncate">{c.city}, {c.country}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
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