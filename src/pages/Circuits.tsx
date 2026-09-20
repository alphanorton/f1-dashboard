import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Flag, Gauge, Layers, Timer, TrendingUp, AlertTriangle, ArrowUp, X } from 'lucide-react';

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
  capacity: number;
  lapRecord: string;
  maxGForce: string;
  sectors: number;
  trackMapUrl?: string;
  corners: Corner[];
}

interface CircuitsData {
  season: number;
  circuits: Circuit[];
}

export function Circuits() {
  const [data, setData] = useState<CircuitsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/data/circuits.json')
      .then(res => res.json())
      .then((d: CircuitsData) => {
        setData(d);
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

  const filteredCircuits = data.circuits.filter(circuit =>
    circuit.name.toLowerCase().includes(search.toLowerCase()) ||
    circuit.country.toLowerCase().includes(search.toLowerCase()) ||
    circuit.city.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-600/30 text-blue-500">
              <MapPin className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                2026 Circuits
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {data.circuits.length} circuits with corner details, sectors and G-force data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search circuit, country or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-9 bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Circuits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCircuits.map((circuit) => {
          const maxG = parseFloat(circuit.maxGForce.match(/[\d.]+/)?.[0] || '0');
          
          return (
            <div
              key={circuit.id}
              onClick={() => setSelectedCircuit(circuit)}
              className="group cursor-pointer relative rounded-xl border border-gray-800 bg-gray-900/70 hover:bg-gray-850 hover:border-gray-700 transition-all p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors truncate">
                    {circuit.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">{circuit.city}, {circuit.country}</p>
                </div>
                <Flag className="h-5 w-5 text-gray-500 shrink-0 ml-2" />
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                <MapPin className="h-3.5 w-3.5" />
                <span>{circuit.city}, {circuit.country}</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-800/60 px-2 py-1.5 rounded border border-gray-700/60">
                  <span className="text-[10px] text-gray-500 block">Track length</span>
                  <span className="text-sm font-bold text-white">{circuit.length.toFixed(3)} km</span>
                </div>
                <div className="bg-gray-800/60 px-2 py-1.5 rounded border border-gray-700/60">
                  <span className="text-[10px] text-gray-500 block">Laps</span>
                  <span className="text-sm font-bold text-white">{circuit.laps}</span>
                </div>
                <div className="bg-gray-800/60 px-2 py-1.5 rounded border border-gray-700/60">
                  <span className="text-[10px] text-gray-500 block">Turns</span>
                  <span className="text-sm font-bold text-white">{circuit.turns}</span>
                </div>
                <div className="bg-gray-800/60 px-2 py-1.5 rounded border border-gray-700/60">
                  <span className="text-[10px] text-gray-500 block">Sectors</span>
                  <span className="text-sm font-bold text-white">{circuit.sectors}</span>
                </div>
              </div>

              {/* Max G-Force Badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                maxG >= 5.5 ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                maxG >= 5.0 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                <TrendingUp className="h-3 w-3" />
                <span>Max: {circuit.maxGForce}</span>
              </div>

              {/* Corner count indicator */}
              <div className="mt-3 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-500">
                <span>{circuit.corners.length > 0 ? `${circuit.corners.length} corners with details` : 'Corner details not available'}</span>
                <span className="text-red-400">→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Circuit Detail Modal */}
      {selectedCircuit && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto"
          onClick={() => setSelectedCircuit(null)}
        >
          <div
            ref={modalRef}
            onScroll={() => {
              if (modalRef.current) {
                setShowScrollTop(modalRef.current.scrollTop > 200);
              }
            }}
            className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-800 pb-4 sticky top-0 bg-gray-900 z-10 -mx-6 px-6 -mt-6 pt-6 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedCircuit.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedCircuit.city}, {selectedCircuit.country}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{selectedCircuit.city}, {selectedCircuit.country}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCircuit(null)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Circuit Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                  <Gauge className="h-4 w-4" />
                  <span className="text-xs font-medium">Track length</span>
                </div>
                <span className="text-xl font-black text-white">{selectedCircuit.length.toFixed(3)}</span>
                <span className="text-xs text-gray-400 ml-1">km</span>
              </div>

              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <div className="flex items-center gap-1.5 text-purple-400 mb-1">
                  <Flag className="h-4 w-4" />
                  <span className="text-xs font-medium">Laps</span>
                </div>
                <span className="text-xl font-black text-white">{selectedCircuit.laps}</span>
                <span className="text-xs text-gray-400 ml-1">laps</span>
              </div>

              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Turns</span>
                </div>
                <span className="text-xl font-black text-white">{selectedCircuit.turns}</span>
              </div>

              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs font-medium">Sectors</span>
                </div>
                <span className="text-xl font-black text-white">{selectedCircuit.sectors}</span>
              </div>
            </div>

            {/* Lap Record & Max G & Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-1.5 text-blue-400 mb-2">
                  <Timer className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Lap record</span>
                </div>
                <p className="text-sm text-gray-300 font-mono">{selectedCircuit.lapRecord}</p>
              </div>

              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-1.5 text-red-400 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Max G-force</span>
                </div>
                <p className="text-sm text-red-300 font-bold">{selectedCircuit.maxGForce}</p>
              </div>

              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Spectator capacity</span>
                </div>
                <p className="text-lg text-emerald-300 font-black">{selectedCircuit.capacity.toLocaleString('en-US')}</p>
                <span className="text-xs text-gray-400">seats</span>
              </div>
            </div>

            {/* Corners Table */}
            {selectedCircuit.corners.length > 0 ? (
              <div className="bg-gray-800/40 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-400" />
                    Track corners ({selectedCircuit.corners.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-800/80 text-gray-400">
                      <tr>
                        <th className="py-2 px-3 text-center font-bold">No.</th>
                        <th className="py-2 px-3 text-right font-bold">Corner</th>
                        <th className="py-2 px-3 text-center font-bold">Type</th>
                        <th className="py-2 px-3 text-center font-bold">Speed</th>
                        <th className="py-2 px-3 text-center font-bold">Gear</th>
                        <th className="py-2 px-3 text-right font-bold hidden md:table-cell">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {selectedCircuit.corners.map((corner, idx) => (
                        <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                          <td className="py-2 px-3 text-center">
                            <span className="font-mono text-white font-bold">{corner.number}</span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="text-white font-medium">{corner.name}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-gray-400">{corner.type}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`font-medium ${getSpeedColor(corner.speed)}`}>
                              {getSpeedLabel(corner.speed)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="font-mono text-amber-400 font-bold">{corner.gear}</span>
                          </td>
                          <td className="py-2 px-3 text-right text-gray-500 hidden md:table-cell">
                            {corner.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/40 border border-gray-800 p-6 rounded-xl text-center">
                <p className="text-sm text-gray-500">Detailed corner information is not available for this circuit</p>
              </div>
            )}

            <div className="flex justify-end pt-2 gap-2">
              {showScrollTop && (
                <button
                  onClick={() => modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ArrowUp className="h-3.5 w-3.5" /> Scroll to top
                </button>
              )}
              <button
                onClick={() => setSelectedCircuit(null)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
