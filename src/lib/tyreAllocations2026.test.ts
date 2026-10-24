import { TYRE_ALLOCATIONS_2026, findTyreAllocation2026 } from './tyreAllocations2026.ts';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

assert(TYRE_ALLOCATIONS_2026.length === 25, `expected 25 calendar entries, got ${TYRE_ALLOCATIONS_2026.length}`);
assert(findTyreAllocation2026(['FORMULA 1 AUSTRALIAN GRAND PRIX 2026', 'Melbourne'])?.hard === 'C3', 'Australia compounds');
assert(findTyreAllocation2026(['Belgian Grand Prix', 'Spa-Francorchamps'])?.medium === 'C3', 'Belgium compounds');
assert(findTyreAllocation2026(['Spanish Grand Prix', 'Madrid', 'Madring'])?.soft === 'C4', 'Madrid compounds');
assert(findTyreAllocation2026(['Bahrain Grand Prix in Malaysia', 'Sepang'])?.hard === 'C2', 'Sepang replacement must not match cancelled Bahrain');
assert(findTyreAllocation2026(['Bahrain Grand Prix', 'Sakhir'])?.status === 'cancelled', 'cancelled Bahrain status');
assert(findTyreAllocation2026(['Las Vegas Grand Prix'])?.status === 'pending', 'unannounced allocation is explicit');
console.log('ok tyre allocation mapping tests passed');
