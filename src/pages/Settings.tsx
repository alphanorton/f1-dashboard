import React, { useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/hooks/useAppStore';
import { clearCache as clearDataServiceCache } from '@/services/f1DataService';
import { toast } from '@/components/ui/toaster';
import {
  Settings as SettingsIcon, Database, RefreshCw, Trash2,
} from 'lucide-react';

const refreshIntervals: Array<{ value: number; label: string }> = [
  { value: 3000, label: '3 s' },
  { value: 5000, label: '5 s' },
  { value: 10000, label: '10 s' },
  { value: 30000, label: '30 s' },
  { value: 60000, label: '60 s' },
];

export function Settings() {
  const {
    autoRefresh, setAutoRefresh,
    refreshInterval, setRefreshInterval,
  } = useAppStore();
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    // Clear the persisted zustand UI store and the f1DataService runtime cache (calendar/results keys).
    localStorage.removeItem('f1-test-2026-store');
    clearDataServiceCache();
    setCacheCleared(true);
    toast({
      title: 'Cache cleared',
      description: 'Local dashboard data and settings were reset. Refresh the page to reload.',
    });
    setTimeout(() => setCacheCleared(false), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure your dashboard preferences"
        icon={SettingsIcon}
      />

      {/* Data & Refresh */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-blue-400" />
            Data &amp; refresh
          </CardTitle>
          <CardDescription>
            Controls how often live timing data is refreshed while the dashboard is open.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface border border-gray-700/50">
            <div>
              <p className="text-sm font-medium text-white">Auto refresh</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Automatically poll for new timing data
              </p>
            </div>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              aria-label="Auto refresh"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface border border-gray-700/50">
            <div>
              <p className="text-sm font-medium text-white">Refresh interval</p>
              <p className="text-xs text-gray-400 mt-0.5">
                How often to check for updates
              </p>
            </div>
            <Select
              value={String(refreshInterval)}
              onValueChange={(v) => setRefreshInterval(Number(v))}
            >
              <SelectTrigger className="w-24" aria-label="Refresh interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {refreshIntervals.map(({ value, label }) => (
                  <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface border border-gray-700/50">
            <div>
              <p className="text-sm font-medium text-white">API source</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Jolpica + local data (read-only)
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Connected
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="h-5 w-5 text-amber-400" />
            Cache
          </CardTitle>
          <CardDescription>
            Remove locally stored dashboard data from this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-gray-700/50">
            <div>
              <p className="text-sm font-medium text-white">Clear cached data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Resets all locally cached race data and settings for this browser.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleClearCache}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-red-500"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              {cacheCleared ? 'Cleared' : 'Clear cache'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
