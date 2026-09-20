import { useEffect, useState } from 'react';
import { syncAllData, getLastSyncStatus, setLastSyncStatus, isCacheExpired } from '@/api/dataSync';

export interface SyncState {
  isSyncing: boolean;
  lastSync: any;
  syncError: string | null;
}

export function useDataSync(season: number = 2025) {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSync: getLastSyncStatus(),
    syncError: null,
  });

  useEffect(() => {
    if (isCacheExpired('seasons')) {
      setState(s => ({ ...s, isSyncing: true }));
      syncAllData(season)
        .then(status => {
          setLastSyncStatus(status);
          setState({ isSyncing: false, lastSync: status, syncError: null });
        })
        .catch(err => {
          setState(s => ({
            ...s,
            isSyncing: false,
            syncError: err instanceof Error ? err.message : 'Sync failed',
          }));
        });
    }
  }, [season]);

  return state;
}
