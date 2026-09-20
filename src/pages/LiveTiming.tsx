import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Timer, Trophy, TrendingUp, Clock } from 'lucide-react';

interface Driver {
  position: number;
  number: string;
  name: string;
  team: string;
  interval: string;
  gap: string;
  lastLap: string;
  bestLap: string;
  sector1: string;
  sector2: string;
  sector3: string;
  pits: number;
  tire: string;
  tireAge: number;
}

const LIVE_TIMING_DATA: Driver[] = [
  {
    position: 1,
    number: '1',
    name: 'Max Verstappen',
    team: 'Red Bull Racing',
    interval: 'Leader',
    gap: '---',
    lastLap: '1:28.234',
    bestLap: '1:27.891',
    sector1: '26.134',
    sector2: '35.892',
    sector3: '25.865',
    pits: 2,
    tire: 'Hard',
    tireAge: 14
  },
  {
    position: 2,
    number: '4',
    name: 'Lando Norris',
    team: 'McLaren',
    interval: '+3.421',
    gap: '+3.421',
    lastLap: '1:28.567',
    bestLap: '1:28.102',
    sector1: '26.289',
    sector2: '36.012',
    sector3: '26.266',
    pits: 1,
    tire: 'Hard',
    tireAge: 30
  },
  {
    position: 3,
    number: '16',
    name: 'Charles Leclerc',
    team: 'Ferrari',
    interval: '+1.892',
    gap: '+5.313',
    lastLap: '1:28.789',
    bestLap: '1:28.234',
    sector1: '26.412',
    sector2: '36.145',
    sector3: '26.232',
    pits: 2,
    tire: 'Hard',
    tireAge: 12
  },
  {
    position: 4,
    number: '81',
    name: 'Oscar Piastri',
    team: 'McLaren',
    interval: '+2.145',
    gap: '+7.458',
    lastLap: '1:29.012',
    bestLap: '1:28.567',
    sector1: '26.523',
    sector2: '36.234',
    sector3: '26.255',
    pits: 1,
    tire: 'Medium',
    tireAge: 22
  },
  {
    position: 5,
    number: '55',
    name: 'Carlos Sainz',
    team: 'Ferrari',
    interval: '+3.892',
    gap: '+11.350',
    lastLap: '1:29.234',
    bestLap: '1:28.678',
    sector1: '26.678',
    sector2: '36.345',
    sector3: '26.211',
    pits: 2,
    tire: 'Hard',
    tireAge: 18
  },
  {
    position: 6,
    number: '11',
    name: 'Sergio Pérez',
    team: 'Red Bull Racing',
    interval: '+5.123',
    gap: '+16.473',
    lastLap: '1:29.456',
    bestLap: '1:28.891',
    sector1: '26.789',
    sector2: '36.456',
    sector3: '26.211',
    pits: 2,
    tire: 'Hard',
    tireAge: 16
  },
  {
    position: 7,
    number: '63',
    name: 'George Russell',
    team: 'Mercedes',
    interval: '+2.891',
    gap: '+19.364',
    lastLap: '1:29.567',
    bestLap: '1:29.012',
    sector1: '26.891',
    sector2: '36.512',
    sector3: '26.164',
    pits: 1,
    tire: 'Medium',
    tireAge: 28
  },
  {
    position: 8,
    number: '44',
    name: 'Lewis Hamilton',
    team: 'Mercedes',
    interval: '+4.234',
    gap: '+23.598',
    lastLap: '1:29.678',
    bestLap: '1:29.234',
    sector1: '26.923',
    sector2: '36.589',
    sector3: '26.166',
    pits: 2,
    tire: 'Hard',
    tireAge: 20
  },
  {
    position: 9,
    number: '14',
    name: 'Fernando Alonso',
    team: 'Aston Martin',
    interval: '+6.892',
    gap: '+30.490',
    lastLap: '1:30.123',
    bestLap: '1:29.567',
    sector1: '27.012',
    sector2: '36.678',
    sector3: '26.433',
    pits: 1,
    tire: 'Medium',
    tireAge: 32
  },
  {
    position: 10,
    number: '18',
    name: 'Lance Stroll',
    team: 'Aston Martin',
    interval: '+2.456',
    gap: '+32.946',
    lastLap: '1:30.345',
    bestLap: '1:29.891',
    sector1: '27.145',
    sector2: '36.789',
    sector3: '26.411',
    pits: 1,
    tire: 'Hard',
    tireAge: 25
  },
];

const getTeamColor = (team: string): string => {
  const colors: Record<string, string> = {
    'Red Bull Racing': 'border-l-4 border-blue-600',
    'McLaren': 'border-l-4 border-orange-500',
    'Ferrari': 'border-l-4 border-red-600',
    'Mercedes': 'border-l-4 border-teal-500',
    'Aston Martin': 'border-l-4 border-green-600',
  };
  return colors[team] || 'border-l-4 border-gray-600';
};

const getTireColor = (tire: string): string => {
  const colors: Record<string, string> = {
    'Soft': 'bg-red-600 text-white',
    'Medium': 'bg-yellow-400 text-black',
    'Hard': 'bg-gray-200 text-black',
  };
  return colors[tire] || 'bg-gray-600 text-white';
};

export function LiveTiming() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-f1 font-bold text-white flex items-center gap-3">
          <Timer className="h-8 w-8 text-f1-red" />
          Live Timing
        </h1>
        <p className="text-gray-400 mt-2">British GP 2026 (Round 12 - 12 July 2026) - Final Results</p>
      </div>

      {/* Race Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <p className="text-2xl font-bold text-white">✓ Finished</p>
          </CardContent>
        </Card>
        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Leader time</p>
            <p className="text-2xl font-bold text-green-400">1:27.891</p>
          </CardContent>
        </Card>
        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Safety Car</p>
            <p className="text-2xl font-bold text-gray-500">---</p>
          </CardContent>
        </Card>
        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Flag</p>
            <p className="text-2xl font-bold text-white">🏁 Finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Timing Table */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Final classification - British GP 2026 🇬🇧
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 p-2 text-xs text-gray-400 font-medium border-b border-gray-700">
              <div className="col-span-1 text-center">Pos</div>
              <div className="col-span-3">Driver</div>
              <div className="col-span-2 text-center hidden md:block">Interval</div>
              <div className="col-span-2 text-center">Last Lap</div>
              <div className="col-span-2 text-center hidden lg:block">Best Lap</div>
              <div className="col-span-2 text-center">Tire</div>
            </div>

            {/* Data Rows */}
            {LIVE_TIMING_DATA.map((driver) => (
              <div
                key={driver.position}
                className={`grid grid-cols-12 gap-2 p-2 rounded ${getTeamColor(driver.team)} bg-gray-900 hover:bg-gray-800 transition-colors`}
              >
                {/* Position */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className={`font-bold ${
                    driver.position === 1 ? 'text-yellow-400' :
                    driver.position === 2 ? 'text-gray-300' :
                    driver.position === 3 ? 'text-orange-400' :
                    'text-white'
                  }`}>
                    {driver.position}
                  </span>
                </div>

                {/* Driver */}
                <div className="col-span-3 flex flex-col justify-center">
                  <p className="text-white font-bold text-sm">{driver.name}</p>
                  <p className="text-xs text-gray-400 truncate">{driver.team}</p>
                </div>

                {/* Interval */}
                <div className="col-span-2 hidden md:flex items-center justify-center">
                  <span className={`text-sm ${driver.position === 1 ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {driver.interval}
                  </span>
                </div>

                {/* Last Lap */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-sm text-white font-mono">{driver.lastLap}</span>
                </div>

                {/* Best Lap */}
                <div className="col-span-2 hidden lg:flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    {driver.bestLap === '1:27.891' && <Trophy className="h-3 w-3 text-purple-400" />}
                    <span className="text-sm text-purple-400 font-mono">{driver.bestLap}</span>
                  </div>
                </div>

                {/* Tire */}
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getTireColor(driver.tire)}`}>
                    {driver.tire}
                  </span>
                  <span className="text-xs text-gray-400">{driver.tireAge}L</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sector Times */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Sector times - British GP 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {LIVE_TIMING_DATA.slice(0, 3).map((driver) => (
              <div key={driver.position} className="p-3 rounded-lg bg-gray-900 border border-gray-700">
                <p className="font-bold text-white mb-2">{driver.name}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">S1</p>
                    <p className="text-purple-400 font-mono">{driver.sector1}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">S2</p>
                    <p className="text-purple-400 font-mono">{driver.sector2}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">S3</p>
                    <p className="text-purple-400 font-mono">{driver.sector3}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pit Stops Summary */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle>Pit stops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {LIVE_TIMING_DATA.slice(0, 5).map((driver) => (
              <div key={driver.number} className="p-3 rounded-lg bg-gray-900 border border-gray-700 text-center">
                <p className="text-xs text-gray-400 mb-1">{driver.name.split(' ')[1]}</p>
                <p className="text-2xl font-bold text-white">{driver.pits}</p>
                <p className="text-xs text-gray-500">stops</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Battle Info */}
      <Card className="border-yellow-700/50 bg-yellow-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-400" />
            Key battles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
              <p className="text-sm text-white">
                <span className="font-bold text-yellow-400">P1:</span> Verstappen pulling away (+3.4s to Norris)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
              <p className="text-sm text-white">
                <span className="font-bold text-orange-400">P2-P4:</span> McLaren vs Ferrari battle (+1.9s)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
              <p className="text-sm text-white">
                <span className="font-bold text-green-400">P7-P8:</span> Mercedes teammates close (+4.2s)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
