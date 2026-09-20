import { cn } from '@/lib/utils';
import { CircuitImage } from './CircuitImage';
import { CIRCUIT_INFO } from './circuitInfo';

export { CircuitImage } from './CircuitImage';
export type { CircuitImageProps } from './CircuitImage';

interface TrackMapProps {
  circuitId: string;
  className?: string;
  showSectorColors?: boolean;
  carPositions?: Array<{
    x: number;
    y: number;
    number: number;
    name: string;
    color: string;
  }>;
  width?: number;
  height?: number;
}

interface CircuitInfo {
  name: string;
  country: string;
  length: number;
  turns: number;
  lapRecord: string;
  lapRecordHolder: string;
  lapRecordYear: number;
  trackMapUrl?: string;
}

const FALLBACK_ID = 'bahrain';
const FALLBACK_INFO: CircuitInfo = {
  name: 'Unknown circuit',
  country: '',
  length: 0,
  turns: 0,
  lapRecord: '',
  lapRecordHolder: '',
  lapRecordYear: 0,
};

export function TrackMap({
  circuitId,
  className,
  showSectorColors,
  carPositions,
  width,
  height,
}: TrackMapProps) {
  const info = CIRCUIT_INFO[circuitId] ?? CIRCUIT_INFO[FALLBACK_ID] ?? FALLBACK_INFO;

  return (
    <div
      className={cn('track-container relative', className)}
      style={{ width, height }}
    >
      <CircuitImage
        circuitId={circuitId}
        name={info.name}
        trackMapUrl={info.trackMapUrl}
        className="h-full w-full"
      />
      <div className="absolute bottom-4 left-4 right-4 p-4 bg-surface/80 backdrop-blur-sm rounded-xl border border-border/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-textMuted uppercase tracking-wider">Length</p>
            <p className="font-f1 text-lg font-bold">{info.length} km</p>
          </div>
          <div>
            <p className="text-xs text-textMuted uppercase tracking-wider">Turns</p>
            <p className="font-f1 text-lg font-bold">{info.turns}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted uppercase tracking-wider">Lap Record</p>
            <p className="font-f1 text-lg font-bold text-f1-red">{info.lapRecord}</p>
          </div>
        </div>
        <p className="text-xs text-textMuted mt-2 text-center">
          {info.lapRecordHolder} • {info.lapRecordYear}
        </p>
      </div>
    </div>
  );
}

export function TrackMapSelector({
  selectedCircuit,
  onSelect,
  className,
}: {
  selectedCircuit: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const circuits = Object.entries(CIRCUIT_INFO);

  return (
    <div className={cn('space-y-2', className)}>
      {circuits.map(([id, circuit]) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            'w-full p-3 rounded-lg border transition-all text-left',
            selectedCircuit === id
              ? 'border-f1-red bg-f1-red/10'
              : 'border-border hover:border-f1-red/50 hover:bg-surface-hover'
          )}
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-white">{circuit.name}</p>
              <p className="text-xs text-textMuted">
                {circuit.country} • {circuit.length}km • {circuit.turns} turns
              </p>
            </div>
            {selectedCircuit === id && (
              <span className="ml-auto text-f1-red font-f1">►</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
