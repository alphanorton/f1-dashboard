import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Calendar, Map, MapPin,
  CircleDot, Gauge, Settings, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/hooks/useAppStore';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const sections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Season',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Grand Prix', href: '/grand-prix', icon: Calendar },
      { name: 'Standings', href: '/standings', icon: Trophy },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { name: 'Tyre Strategy', href: '/tyres', icon: CircleDot },
      { name: 'Fastest Laps', href: '/fastest-laps', icon: Gauge },
    ],
  },
  {
    label: 'Reference',
    items: [
      { name: 'Circuits', href: '/circuits', icon: MapPin },
      { name: 'Track Map', href: '/track-map', icon: Map },
    ],
  },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red',
      isActive ? 'bg-f1-red/15 text-red-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
      !sidebarOpen && 'lg:justify-center'
    );

  return (
    <aside
      className={cn(
        'border-gray-800 bg-surface lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:border-r flex flex-col',
        sidebarOpen ? 'lg:w-72' : 'lg:w-20'
      )}
    >
      <div className="hidden lg:flex items-center justify-between h-16 px-3 border-b border-gray-800">
        {sidebarOpen && <span className="font-f1 font-bold text-xl text-white">F1 / 2026</span>}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarOpen}
          className="rounded-lg p-3 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
        >
          <ChevronLeft className={cn('h-5 w-5', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      <nav aria-label="Main navigation" className="flex gap-2 overflow-x-auto p-2 lg:flex-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:p-3">
        {sidebarOpen && (
          <div className="hidden lg:flex lg:flex-col lg:flex-1">
            {sections.map((section) => (
              <div key={section.label} className="mb-3">
                <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                  {section.label}
                </p>
                <ul className="space-y-1">
                  {section.items.map(({ name, href, icon: Icon }) => (
                    <li key={href}>
                      <NavLink to={href} end={href === '/'} title={name} className={linkClasses}>
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className="whitespace-nowrap">{name}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!sidebarOpen && (
          <div className="flex gap-2 lg:hidden">
            {sections.flatMap((section) => section.items).map(({ name, href, icon: Icon }) => (
              <NavLink key={href} to={href} end={href === '/'} title={name} className={linkClasses}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {sidebarOpen && (
        <div className="hidden lg:block border-t border-gray-800 p-3">
          <NavLink to="/settings" title="Settings" className={linkClasses}>
            <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">Settings</span>
          </NavLink>
        </div>
      )}

    </aside>
  );
}
