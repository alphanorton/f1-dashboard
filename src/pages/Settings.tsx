import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Settings as SettingsIcon, Palette, Database, Zap
} from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-f1 font-bold text-white flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-f1-red" />
          Settings
        </h1>
      </div>

      {/* UI Settings */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-400" />
            UI settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded bg-gray-900 border border-gray-700">
              <span className="text-white">Dark theme</span>
              <span className="text-green-400">✓ On</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-gray-900 border border-gray-700">
              <span className="text-white">Language</span>
              <span className="text-gray-400">English</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-gray-900 border border-gray-700">
              <span className="text-white">Font</span>
              <span className="text-gray-400">Vazirmatn + Orbitron</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Settings */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            Data settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded bg-gray-900 border border-gray-700">
              <span className="text-white">Auto Refresh</span>
              <span className="text-green-400">✓ On</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-gray-900 border border-gray-700">
              <span className="text-white">API Source</span>
              <span className="text-gray-400">Local Data (Primary) + Jolpica</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-gray-900 border border-gray-700">
              <span className="text-white">Cache Duration</span>
              <span className="text-gray-400">30 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 rounded bg-gray-900 border border-gray-700">
              <p className="text-sm text-gray-400">⚡ React 18.3.1 + Vite 5.4.0</p>
            </div>
            <div className="p-3 rounded bg-gray-900 border border-gray-700">
              <p className="text-sm text-gray-400">📦 Bundle: ~950 KB</p>
            </div>
            <div className="p-3 rounded bg-gray-900 border border-gray-700">
              <p className="text-sm text-gray-400">🔄 Hot Module Replacement: Enabled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
