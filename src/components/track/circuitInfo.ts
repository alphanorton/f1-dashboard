import circuitsData from '../../../public/data/circuits.json';

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

const RECORD_PATTERN = /^(.*) \((.*), (\d{4})\)$/;

function parseLapRecord(record: string): { holder: string; year: number } {
  const match = record.match(RECORD_PATTERN);
  if (!match) return { holder: '', year: 0 };
  return { holder: match[1], year: Number(match[2]) };
}

export const CIRCUIT_INFO: Record<string, CircuitInfo> = Object.fromEntries(
  circuitsData.circuits.map((circuit) => {
    const { holder, year } = parseLapRecord(circuit.lapRecord);
    return [
      circuit.id,
      {
        name: circuit.name,
        country: circuit.country,
        length: circuit.length,
        turns: circuit.turns,
        lapRecord: circuit.lapRecord.split(' (')[0],
        lapRecordHolder: holder,
        lapRecordYear: year,
        trackMapUrl: circuit.trackMapUrl || undefined,
      },
    ];
  })
);
