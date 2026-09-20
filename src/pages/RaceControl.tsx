import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Flag, AlertTriangle, CheckCircle, XCircle, Info, Radio } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface RaceControlMessage {
  lap: number;
  time: string;
  type: 'flag' | 'penalty' | 'investigation' | 'decision' | 'info';
  severity: 'green' | 'yellow' | 'red' | 'blue';
  message: string;
  driver?: string;
}

const RACE_CONTROL_SILVERSTONE: RaceControlMessage[] = [
  { lap: 1, time: '15:01:23', type: 'flag', severity: 'green', message: 'GREEN FLAG - Race started' },
  { lap: 3, time: '15:07:45', type: 'investigation', severity: 'yellow', message: 'Investigation - Turn 1 incident - Stroll vs Magnussen', driver: 'Stroll' },
  { lap: 5, time: '15:12:34', type: 'info', severity: 'blue', message: 'DRS enabled - Zone 1 & 2' },
  { lap: 8, time: '15:19:12', type: 'penalty', severity: 'yellow', message: '5-second penalty for Stroll - Causing collision', driver: 'Stroll' },
  { lap: 12, time: '15:28:56', type: 'investigation', severity: 'yellow', message: 'Investigation - Track limits - Turn 9 (Copse)', driver: 'Pérez' },
  { lap: 14, time: '15:32:18', type: 'flag', severity: 'yellow', message: 'YELLOW FLAG - Sector 2 - Debris on track' },
  { lap: 15, time: '15:34:02', type: 'info', severity: 'green', message: 'Virtual Safety Car - Track being cleared' },
  { lap: 17, time: '15:37:45', type: 'flag', severity: 'green', message: 'GREEN FLAG - Race resumed' },
  { lap: 18, time: '15:39:23', type: 'decision', severity: 'yellow', message: 'No Further Action - Pérez track limits incident', driver: 'Pérez' },
  { lap: 22, time: '15:48:12', type: 'investigation', severity: 'yellow', message: 'Investigation - Unsafe Release - Pit Lane', driver: 'Hamilton' },
  { lap: 24, time: '15:51:34', type: 'penalty', severity: 'red', message: '10-second penalty for Hamilton - Unsafe pit release', driver: 'Hamilton' },
  { lap: 28, time: '15:59:45', type: 'investigation', severity: 'yellow', message: 'Investigation - Overtaking under yellow - Turn 15', driver: 'Alonso' },
  { lap: 31, time: '16:05:23', type: 'penalty', severity: 'red', message: '5-second penalty for Alonso - Overtaking under yellow flag', driver: 'Alonso' },
  { lap: 35, time: '16:12:56', type: 'flag', severity: 'blue', message: 'BLUE FLAG - P15 (Sargeant) for leaders' },
  { lap: 38, time: '16:18:34', type: 'info', severity: 'green', message: 'P2 battle: Norris vs Leclerc - gap 1.9s' },
  { lap: 42, time: '16:25:12', type: 'investigation', severity: 'yellow', message: 'Post-race investigation - Weaving on straight', driver: 'Tsunoda' },
  { lap: 45, time: '16:30:45', type: 'info', severity: 'blue', message: '7 laps remaining - Verstappen leads by +3.4s' },
  { lap: 48, time: '16:35:23', type: 'flag', severity: 'yellow', message: 'YELLOW FLAG - Sector 3 - Incident Turn 16' },
  { lap: 49, time: '16:37:01', type: 'flag', severity: 'red', message: 'RED FLAG - Heavy incident Turn 16 - Race stopped' },
  { lap: 51, time: '16:52:34', type: 'flag', severity: 'green', message: 'RESTART - Standing start from grid' },
  { lap: 52, time: '16:56:12', type: 'flag', severity: 'green', message: 'CHEQUERED FLAG - Race complete' },
];

const PENALTIES_SUMMARY = [
  { driver: 'Lance Stroll', penalty: '5s', reason: 'Causing collision (Lap 8)', applied: true },
  { driver: 'Lewis Hamilton', penalty: '10s', reason: 'Unsafe pit release (Lap 24)', applied: true },
  { driver: 'Fernando Alonso', penalty: '5s', reason: 'Overtaking under yellow (Lap 31)', applied: true },
  { driver: 'Yuki Tsunoda', penalty: 'Investigation', reason: 'Weaving on straight (After race)', applied: false },
];

export function RaceControl() {
  const [selectedRace, setSelectedRace] = useState<string>('silverstone');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flag':
        return <Flag className="h-4 w-4" />;
      case 'penalty':
        return <XCircle className="h-4 w-4" />;
      case 'investigation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'decision':
        return <CheckCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Radio className="h-4 w-4" />;
    }
  };

  const getTypeColor = (severity: string) => {
    switch (severity) {
      case 'green':
        return 'bg-green-900/20 border-green-700 text-green-400';
      case 'yellow':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-400';
      case 'red':
        return 'bg-red-900/20 border-red-700 text-red-400';
      case 'blue':
        return 'bg-blue-900/20 border-blue-700 text-blue-400';
      default:
        return 'bg-gray-900 border-gray-700 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-f1 font-bold text-white flex items-center gap-3">
          <Flag className="h-8 w-8 text-f1-red" />
          Race Control 2026
        </h1>
        <p className="text-gray-400 mt-2">Official messages, penalties and investigations</p>
      </div>

      {/* Race Selector */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Radio className="h-5 w-5 text-f1-red" />
            <Select value={selectedRace} onValueChange={setSelectedRace}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a race" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silverstone">🇬🇧 British GP - Silverstone (Completed)</SelectItem>
                <SelectItem value="austria">🇦🇹 Austrian GP - Red Bull Ring (Completed)</SelectItem>
                <SelectItem value="spain">🇪🇸 Spanish GP - Barcelona</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total messages</p>
                <p className="text-2xl font-bold text-white">{RACE_CONTROL_SILVERSTONE.length}</p>
              </div>
              <Radio className="h-8 w-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Penalties</p>
                <p className="text-2xl font-bold text-red-400">3</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Investigations</p>
                <p className="text-2xl font-bold text-yellow-400">4</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Red Flags</p>
                <p className="text-2xl font-bold text-red-400">1</p>
              </div>
              <Flag className="h-8 w-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Penalties Summary */}
      <Card className="border-red-700/50 bg-red-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            Penalties summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PENALTIES_SUMMARY.map((penalty, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded font-bold text-sm ${
                    penalty.applied ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                  }`}>
                    {penalty.penalty}
                  </span>
                  <div>
                    <p className="font-bold text-white">{penalty.driver}</p>
                    <p className="text-sm text-gray-400">{penalty.reason}</p>
                  </div>
                </div>
                <span className={`text-xs ${penalty.applied ? 'text-green-400' : 'text-yellow-400'}`}>
                  {penalty.applied ? '✓ Applied' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Race Control Messages Timeline */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-purple-400" />
            Race Control messages - British GP 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {RACE_CONTROL_SILVERSTONE.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getTypeColor(msg.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    {getTypeIcon(msg.type)}
                    <span className="text-xs font-bold">Lap {msg.lap}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{msg.message}</p>
                    {msg.driver && (
                      <p className="text-xs text-gray-400 mt-1">Driver: {msg.driver}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flag Guide */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle>Flag guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-700">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-green-400" />
                <p className="font-bold text-green-400">GREEN FLAG 🟢</p>
              </div>
              <p className="text-sm text-gray-300">Track clear - normal racing</p>
            </div>

            <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <p className="font-bold text-yellow-400">YELLOW FLAG 🟡</p>
              </div>
              <p className="text-sm text-gray-300">Danger - no overtaking</p>
            </div>

            <div className="p-3 rounded-lg bg-red-900/20 border border-red-700">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-red-400" />
                <p className="font-bold text-red-400">RED FLAG 🔴</p>
              </div>
              <p className="text-sm text-gray-300">Race stopped</p>
            </div>

            <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-700">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-blue-400" />
                <p className="font-bold text-blue-400">BLUE FLAG 🔵</p>
              </div>
              <p className="text-sm text-gray-300">Faster driver approaching</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-900 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-white" />
                <p className="font-bold text-white">CHEQUERED FLAG 🏁</p>
              </div>
              <p className="text-sm text-gray-300">Race complete</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-900 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-gray-400" />
                <p className="font-bold text-gray-400">BLACK & WHITE ⚫⚪</p>
              </div>
              <p className="text-sm text-gray-300">Warning for unsportsmanlike conduct</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Car Info */}
      <Card className="border-yellow-700/50 bg-yellow-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-yellow-400" />
            Safety Car & VSC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
              <p className="font-bold text-white mb-1">🟡 Virtual Safety Car (VSC)</p>
              <p className="text-gray-300">Speeds limited - gaps must be maintained - pit stops allowed</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
              <p className="font-bold text-white mb-1">🚗 Safety Car (SC)</p>
              <p className="text-gray-300">Safety car on track - drivers line up behind it</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
              <p className="font-bold text-white mb-1">🔴 Red Flag</p>
              <p className="text-gray-300">Race stopped - return to pit lane - restart possible</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
