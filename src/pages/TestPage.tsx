import React from 'react';
import { useAppStore } from '@/hooks/useAppStore';

export function TestPage() {
  const { theme, sidebarOpen } = useAppStore();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-f1-red">F1 Test 2026</h1>
        <p className="text-xl">✅ React is working!</p>
        <p className="text-gray-400">Theme: {theme}</p>
        <p className="text-gray-400">Sidebar: {sidebarOpen ? 'Open' : 'Closed'}</p>
      </div>
    </div>
  );
}
