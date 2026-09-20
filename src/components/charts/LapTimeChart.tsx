import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { LapTimeChartDataPoint } from '@/types';

interface LapTimeChartProps {
  data: LapTimeChartDataPoint[];
  className?: string;
  height?: number;
  driverColor?: string;
  driverName?: string;
  showBestLap?: boolean;
  showAverage?: boolean;
}

export function LapTimeChart({
  data,
  className,
  height = 250,
  driverColor = 'hsl(var(--primary))',
  driverName,
  showBestLap = true,
  showAverage = true,
}: LapTimeChartProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-[250px] text-muted-foreground', className)}>
        No lap data available
      </div>
    );
  }

  const validLaps = data.filter(lap => lap.time > 0);
  if (!validLaps.length) {
    return (
      <div className={cn('flex items-center justify-center h-[250px] text-muted-foreground', className)}>
        No valid lap times
      </div>
    );
  }

  const bestLap = validLaps.reduce((best, lap) => lap.time < best.time ? lap : best, validLaps[0]);
  const avgTime = validLaps.reduce((sum, lap) => sum + lap.time, 0) / validLaps.length;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(3).padStart(6, '0');
    return `${minutes}:${seconds}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const lap = validLaps.find(l => l.lap === parseInt(label));
      return (
        <div className="bg-surface border p-2 rounded shadow-lg min-w-[200px]">
          <p className="font-medium">Lap {label}</p>
          <p className="font-mono text-lg" style={{ color: payload[0].color }}>
            {formatTime(payload[0].value)}
          </p>
          {lap && (
            <>
              <p className="text-xs text-textMuted mt-1">
                Tire: {lap.compound || '—'} (Age: {lap.tireAge || 0})
              </p>
              <p className="text-xs text-textMuted">
                S1: {formatTime(lap.sector1 || 0)} | S2: {formatTime(lap.sector2 || 0)} | S3: {formatTime(lap.sector3 || 0)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={validLaps} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="lap"
            type="number"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            interval="preserveStartEnd"
          />
          <YAxis
            type="number"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={formatTime}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            width={80}
            reversed
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="time"
            stroke={driverColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
            name={driverName || 'Lap Time'}
          />
          {showBestLap && (
            <ReferenceLine
              y={bestLap.time}
              label={{ value: `Best: ${formatTime(bestLap.time)} (Lap ${bestLap.lap})`, position: 'insideStart', fill: '#00D2BE', fontSize: 10 }}
              stroke="#00D2BE"
              strokeDasharray="5 5"
            />
          )}
          {showAverage && (
            <ReferenceLine
              y={avgTime}
              label={{ value: `Avg: ${formatTime(avgTime)}`, position: 'insideEnd', fill: '#FF8700', fontSize: 10 }}
              stroke="#FF8700"
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}