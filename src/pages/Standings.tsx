import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, TrendingUp, Car, Zap, ChevronRight, Medal, Target } from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';

interface Driver {
  position: number;
  driverNumber: number;
  code: string;
  name: string;
  nationality: string;
  team: string;
  points: number;
  wins: number;
  podiums: number;
  gap: number;
}

interface Constructor {
  position: number;
  name: string;
  shortName: string;
  carName: string;
  engine: string;
  powerUnit: string;
  drivers: string[];
  points: number;
  wins: number;
  podiums: number;
  gap: number;
  updates: string[];
}

interface StandingsData {
  season: number;
  asOfRound: number;
  asOfRace: string;
  lastUpdated: string;
  remainingRaces: number;
  drivers: Driver[];
  constructors: Constructor[];
}

export function Standings() {
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConstructor, setSelectedConstructor] = useState<Constructor | null>(null);

  useEffect(() => {
    fetch('/data/standings.json')
      .then(res => res.json())
      .then((d: StandingsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load standings:', err);
        setLoading(false);
      });
  }, []);

  if (!loading && !data) {
    return <div role="alert" className="p-6 text-red-400">Failed to load standings.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading standings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-600/10 border border-amber-600/30 text-amber-500">
              <Trophy className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                2026 Championship Standings
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                After Round {data.asOfRound} — {data.asOfRace} | {data.remainingRaces} races remaining
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-lg text-xs text-gray-400">
          <Target className="h-4 w-4 text-amber-500" />
          <span>Last updated: {data.lastUpdated}</span>
        </div>
      </div>

      <Tabs defaultValue="drivers" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-gray-900 border border-gray-800">
          <TabsTrigger value="drivers" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            Drivers
          </TabsTrigger>
          <TabsTrigger value="constructors" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            Constructors
          </TabsTrigger>
        </TabsList>

        {/* DRIVERS STANDINGS */}
        <TabsContent value="drivers" className="mt-6">
          <Card className="border-gray-800 bg-gray-900/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/80 text-gray-300 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4 text-center font-bold">Pos</th>
                      <th className="py-3 px-4 text-right font-bold">Driver</th>
                      <th className="py-3 px-4 text-right font-bold hidden md:table-cell">Team</th>
                      <th className="py-3 px-4 text-center font-bold">Points</th>
                      <th className="py-3 px-4 text-center font-bold hidden sm:table-cell">Wins</th>
                      <th className="py-3 px-4 text-center font-bold hidden lg:table-cell">Podiums</th>
                      <th className="py-3 px-4 text-center font-bold hidden sm:table-cell">Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.drivers.map((driver, idx) => {
                      const isTop3 = driver.position <= 3;
                      const isLeader = driver.position === 1;
                      
                      return (
                        <tr 
                          key={driver.position}
                          className={`hover:bg-gray-800/40 transition-colors ${
                            isLeader ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center">
                              {isTop3 ? (
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                                  driver.position === 1 ? 'bg-amber-500 text-black' :
                                  driver.position === 2 ? 'bg-gray-300 text-black' :
                                  'bg-amber-700 text-white'
                                }`}>
                                  {driver.position}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-mono text-sm">{driver.position}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-gray-300 border border-gray-700 font-mono">
                                {driver.driverNumber}
                              </span>
                              <div>
                                <p className="font-bold text-white text-sm">{driver.name}</p>
                                <p className="text-xs text-gray-400">{driver.team}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className="text-gray-300 text-xs">{driver.team}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-black text-base ${isLeader ? 'text-amber-400' : 'text-white'}`}>
                              {driver.points}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center hidden sm:table-cell">
                            <span className="text-gray-300 font-medium">{driver.wins}</span>
                          </td>
                          <td className="py-3 px-4 text-center hidden lg:table-cell">
                            <span className="text-gray-400">{driver.podiums}</span>
                          </td>
                          <td className="py-3 px-4 text-center hidden sm:table-cell">
                            {driver.gap > 0 ? (
                              <span className="text-gray-500 text-xs font-mono">−{driver.gap}</span>
                            ) : (
                              <span className="text-amber-400 text-xs font-bold">Leader</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Driver Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium">Championship leader</span>
                </div>
                <p className="text-lg font-black text-white">{data.drivers[0].name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{data.drivers[0].points} points</p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-xs font-medium">Most wins</span>
                </div>
                <p className="text-lg font-black text-white">
                  {data.drivers.reduce((max, d) => d.wins > max.wins ? d : max, data.drivers[0]).name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {Math.max(...data.drivers.map(d => d.wins))} wins
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Medal className="h-4 w-4" />
                  <span className="text-xs font-medium">Most podiums</span>
                </div>
                <p className="text-lg font-black text-white">
                  {data.drivers.reduce((max, d) => d.podiums > max.podiums ? d : max, data.drivers[0]).name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {Math.max(...data.drivers.map(d => d.podiums))} podiums
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Points gap</span>
                </div>
                <p className="text-lg font-black text-white">{data.drivers[1].gap}</p>
                <p className="text-xs text-gray-400 mt-0.5">points to P2</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONSTRUCTORS STANDINGS */}
        <TabsContent value="constructors" className="mt-6 space-y-6">
          <Card className="border-gray-800 bg-gray-900/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/80 text-gray-300 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4 text-center font-bold">Pos</th>
                      <th className="py-3 px-4 text-right font-bold">Constructor</th>
                      <th className="py-3 px-4 text-right font-bold hidden lg:table-cell">Car</th>
                      <th className="py-3 px-4 text-center font-bold">Points</th>
                      <th className="py-3 px-4 text-center font-bold hidden sm:table-cell">Gap</th>
                      <th className="py-3 px-4 text-center font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.constructors.map((team) => {
                      const isTop3 = team.position <= 3;
                      const isLeader = team.position === 1;
                      
                      return (
                        <tr 
                          key={team.position}
                          className={`hover:bg-gray-800/40 transition-colors cursor-pointer ${
                            isLeader ? 'bg-amber-950/20' : ''
                          }`}
                          onClick={() => setSelectedConstructor(team)}
                        >
                          <td className="py-3 px-4 text-center">
                            {isTop3 ? (
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-black ${
                                team.position === 1 ? 'bg-amber-500 text-black' :
                                team.position === 2 ? 'bg-gray-300 text-black' :
                                'bg-amber-700 text-white'
                              }`}>
                                {team.position}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-mono text-sm">{team.position}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-white text-sm">{team.name}</p>
                              <p className="text-xs text-gray-400">{team.shortName}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className="text-gray-300 text-xs font-mono">{team.carName}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-black text-base ${isLeader ? 'text-amber-400' : 'text-white'}`}>
                              {team.points}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center hidden sm:table-cell">
                            {team.gap > 0 ? (
                              <span className="text-gray-500 text-xs font-mono">−{team.gap}</span>
                            ) : (
                              <span className="text-amber-400 text-xs font-bold">Leader</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button className="text-red-400 hover:text-red-300 transition-colors">
                              <ChevronRight className="h-4 w-4 rotate-180" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Constructor Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium">Championship leader</span>
                </div>
                <p className="text-lg font-black text-white">{data.constructors[0].name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{data.constructors[0].points} points</p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-xs font-medium">Most wins</span>
                </div>
                <p className="text-lg font-black text-white">
                  {data.constructors.reduce((max, t) => t.wins > max.wins ? t : max).name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {Math.max(...data.constructors.map(t => t.wins))} wins
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Points gap</span>
                </div>
                <p className="text-lg font-black text-white">{data.constructors[1].gap}</p>
                <p className="text-xs text-gray-400 mt-0.5">points to P2</p>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Car className="h-4 w-4" />
                  <span className="text-xs font-medium">Active teams</span>
                </div>
                <p className="text-lg font-black text-white">{data.constructors.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">constructors this season</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Constructor Detail Modal */}
      {selectedConstructor && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto"
          onClick={() => setSelectedConstructor(null)}
        >
          <div 
            className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedConstructor.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedConstructor.shortName}</p>
              </div>
              <button 
                onClick={() => setSelectedConstructor(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Car & Engine Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <div className="flex items-center gap-1.5 text-red-400 mb-1">
                  <Car className="h-4 w-4" />
                  <span className="text-xs font-medium">Car</span>
                </div>
                <span className="text-white font-bold font-mono">{selectedConstructor.carName}</span>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium">Power unit</span>
                </div>
                <span className="text-white font-medium text-sm">{selectedConstructor.powerUnit}</span>
              </div>
            </div>

            <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
              <span className="text-xs text-gray-400 block mb-1">Engine specification:</span>
              <span className="text-xs text-gray-300">{selectedConstructor.engine}</span>
            </div>

            {/* Drivers */}
            <div className="bg-gray-800/40 border border-gray-800 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Drivers</h4>
              <div className="flex flex-wrap gap-2">
                {selectedConstructor.drivers.map((driver, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white">
                    {driver}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60 text-center">
                <span className="text-xs text-gray-400 block mb-1">Total points</span>
                <span className="text-xl font-black text-amber-400">{selectedConstructor.points}</span>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60 text-center">
                <span className="text-xs text-gray-400 block mb-1">Wins</span>
                <span className="text-xl font-black text-emerald-400">{selectedConstructor.wins}</span>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60 text-center">
                <span className="text-xs text-gray-400 block mb-1">Podiums</span>
                <span className="text-xl font-black text-blue-400">{selectedConstructor.podiums}</span>
              </div>
            </div>

            {/* Technical Updates */}
            <div className="bg-gray-800/40 border border-gray-800 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                2026 technical updates
              </h4>
              {selectedConstructor.updates.length > 0 ? (
                <ul className="space-y-2">
                  {selectedConstructor.updates.map((update, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-amber-400 mt-0.5">▸</span>
                      <span>{update}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">No technical updates announced yet</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedConstructor(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
