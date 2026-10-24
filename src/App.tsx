import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { PageLoader } from '@/components/ui/PageLoader';
import { Dashboard } from '@/pages/Dashboard';
import { useAppStore } from '@/hooks/useAppStore';
import { useSpotlight } from '@/hooks/useSpotlight';
import { PageTransition } from '@/components/motion/PageTransition';

const TrackMapPage = lazy(() => import('@/pages/TrackMapPage').then((m) => ({ default: m.TrackMapPage })));
const Standings = lazy(() => import('@/pages/Standings').then((m) => ({ default: m.Standings })));
const GrandPrix = lazy(() => import('@/pages/GrandPrix').then((m) => ({ default: m.GrandPrix })));
const Singapore2026 = lazy(() => import('@/pages/Singapore2026').then((m) => ({ default: m.Singapore2026 })));
const Circuits = lazy(() => import('@/pages/Circuits').then((m) => ({ default: m.Circuits })));
const TireStrategy = lazy(() => import('@/pages/TireStrategy').then((m) => ({ default: m.TireStrategy })));
const FastestLaps = lazy(() => import('@/pages/FastestLaps').then((m) => ({ default: m.FastestLaps })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const TestPage = lazy(() => import('@/pages/TestPage').then((m) => ({ default: m.TestPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <PageLoader message="Loading..." />
    </div>
  );
}

function App() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  useSpotlight();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-f1-red focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Skip to content
          </a>
          <div className="app-backdrop min-h-screen bg-gray-900">
            <Sidebar />
            <div className={sidebarOpen ? 'min-w-0 lg:ml-72' : 'min-w-0 lg:ml-20'}>
              <Header />
              <main id="main" className="p-4 pb-24 sm:p-6 lg:pb-8 lg:p-8">
                <Suspense fallback={<PageFallback />}>
                  <PageTransition>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/grand-prix" element={<GrandPrix />} />
                    <Route path="/singapore-2026" element={<Singapore2026 />} />
                    <Route path="/circuits" element={<Circuits />} />
                    <Route path="/standings" element={<Standings />} />
                    <Route path="/track-map" element={<TrackMapPage />} />
                    <Route path="/tyres" element={<TireStrategy />} />
                    <Route path="/fastest-laps" element={<FastestLaps />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/test" element={<TestPage />} />
                  </Routes>
                  </PageTransition>
                </Suspense>
              </main>
            </div>
            <MobileTabBar />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
