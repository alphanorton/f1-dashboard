import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { SectorComparisonDataPoint } from '@/types';

interface SectorComparisonChartProps {
  data: SectorComparisonDataPoint[];
  className?: string;
  height?: number;
  driverColors?: string[];
  driverNames?: string[];
}

export function SectorComparisonChart({
  data,
  className,
  height = 300,
  driverColors = ['#E10600', '#00D2BE', '#FF8700'],
  driverNames = ['Driver 1', 'Driver 2', 'Driver 3'],
}: SectorComparisonChartProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-[300px] text-muted-foreground', className)}>
        No sector comparison data available
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(3).padStart(6, '0');
    return `${minutes}:${seconds}`;
  };

  const formattedData = data.map((d, i) => ({
    lap: `L${d.lap}`,
    sector1: d.sector1,
    sector2: d.sector2,
    sector3: d.sector3,
    total: d.total,
    index: i,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const lapData = formattedData.find(d => d.lap === label);
      return (
        <div className="bg-surface border p-2 rounded shadow-lg min-w-[220px]">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="font-mono text-sm flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
              {entry.name}: {formatTime(entry.value)}
            </p>
          ))}
          {lapData && (
            <p className="text-xs text-textMuted mt-1 font-mono">
              Total: {formatTime(lapData.total)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const sectors = ['sector1', 'sector2', 'sector3'];
  const sectorLabels = ['S1', 'S2', 'S3'];

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} horizontal={true} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={formatTime}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            height={40}
          />
          <YAxis
            dataKey="lap"
            type="category"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {sectors.map((sector, i) => (
            <Bar
              key={sector}
              dataKey={sector}
              stackId="a"
              radius={[0, 4, 4, 0]}
              name={sectorLabels[i]}
              fill={driverColors[i % driverColors.length]}
            >
              <Cell fill={driverColors[i % driverColors.length]} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==================== Single Driver Sector Comparison ====================
interface SingleDriverSectorProps {
  data: SectorComparisonDataPoint[];
  className?: string;
  height?: number;
  driverColor?: string;
  driverName?: string;
}

export function SingleDriverSectorComparison({
  data,
  className,
  height = 250,
  driverColor = '#E10600',
  driverName,
}: SingleDriverSectorProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-[250px] text-muted-foreground', className)}>
        No sector data available
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(3).padStart(6, '0');
    return `${minutes}:${seconds}`;
  };

  const formattedData = data.map(d => ({
    lap: `L${d.lap}`,
    sector1: d.sector1,
    sector2: d.sector2,
    sector3: d.sector3,
    total: d.total,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border p-2 rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="font-mono text-sm flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
              {entry.name}: {formatTime(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} horizontal={true} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={formatTime}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            height={40}
          />
          <YAxis
            dataKey="lap"
            type="category"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="sector1" stackId="a" radius={[0, 4, 4, 0]} name="S1" fill="#E10600" />
          <Bar dataKey="sector2" stackId="a" radius={[0, 4, 4, 0]} name="S2" fill="#FFD700" />
          <Bar dataKey="sector3" stackId="a" radius={[0, 4, 4, 0]} name="S3" fill="#9B51E0" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}