import { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Trophy, CircleDot, Gauge,
  MapPin, Map, Settings, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface MobileItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const primaryItems: MobileItem[] = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Races', href: '/grand-prix', icon: Calendar },
  { name: 'Standings', href: '/standings', icon: Trophy },
  { name: 'Tyres', href: '/tyres', icon: CircleDot },
];

const moreItems: MobileItem[] = [
  { name: 'Fastest Laps', href: '/fastest-laps', icon: Gauge },
  { name: 'Circuits', href: '/circuits', icon: MapPin },
  { name: 'Track Map', href: '/track-map', icon: Map },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileTabBar() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const inMore = moreItems.some((i) => i.href === location.pathname);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-w-[44px] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-inset',
      isActive ? 'text-f1-red-text' : 'text-gray-400 hover:text-gray-300'
    );

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-gray-800 bg-[#0B0B14]/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {primaryItems.map(({ name, href, icon: Icon }) => (
          <NavLink key={href} to={href} end={href === '/'} className={linkClass}>
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{name}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More pages"
          aria-expanded={moreOpen || inMore}
          className={cn(
            'flex min-w-[44px] flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-inset',
            inMore ? 'text-f1-red-text' : 'text-gray-400 hover:text-gray-300'
          )}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent
          className="fixed left-0 right-0 top-auto bottom-0 z-50 max-w-none rounded-b-none rounded-t-2xl translate-x-0 translate-y-0 border-t border-gray-800 bg-[#0B0B14] p-4 pb-6"
          aria-label="More pages"
        >
          <DialogTitle className="text-base text-white">More pages</DialogTitle>
          <DialogDescription className="text-gray-400">
            All dashboard pages
          </DialogDescription>
          <div className="grid grid-cols-2 gap-2">
            {moreItems.map(({ name, href, icon: Icon }) => (
              <NavLink
                key={href}
                to={href}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red',
                    isActive
                      ? 'border-f1-red/40 bg-f1-red/10 text-f1-red-text'
                      : 'border-gray-700/50 bg-surface text-gray-300 hover:border-gray-600 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{name}</span>
              </NavLink>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
