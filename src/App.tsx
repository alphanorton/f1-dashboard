import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { TrackMapPage } from '@/pages/TrackMapPage';
import { Standings } from '@/pages/Standings';
import { GrandPrix } from '@/pages/GrandPrix';
import { Circuits } from '@/pages/Circuits';
import { TireStrategy } from '@/pages/TireStrategy';
import { Settings } from '@/pages/Settings';
import { TestPage } from '@/pages/TestPage';
import { useAppStore } from '@/hooks/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const sidebarOpen = useAppStore(state => state.sidebarOpen);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-900">
            <Sidebar />
            <div className={sidebarOpen ? 'min-w-0 lg:ml-72' : 'min-w-0 lg:ml-20'}>
              <Header />
              <main className="p-4 sm:p-6 lg:p-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/grand-prix" element={<GrandPrix />} />
                  <Route path="/circuits" element={<Circuits />} />
                  <Route path="/standings" element={<Standings />} />
                  <Route path="/track-map" element={<TrackMapPage />} />
                  <Route path="/tyres" element={<TireStrategy />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/test" element={<TestPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;