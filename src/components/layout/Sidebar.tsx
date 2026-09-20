import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Settings, Trophy, Calendar, CircleDot, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/hooks/useAppStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Grand Prix', href: '/grand-prix', icon: Calendar },
  { name: 'Circuits', href: '/circuits', icon: Map },
  { name: 'Standings', href: '/standings', icon: Trophy },
  { name: 'Track Map', href: '/track-map', icon: Map },
  { name: 'Tyre Strategy', href: '/tyres', icon: CircleDot },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  return (
    <aside className={cn('border-gray-800 bg-surface lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:border-r flex flex-col', sidebarOpen ? 'lg:w-72' : 'lg:w-20')}>
      <div className="hidden lg:flex items-center justify-between h-16 px-3 border-b border-gray-800">
        {sidebarOpen && <span className="font-f1 font-bold text-xl text-white">F1 / 2026</span>}
        <button onClick={toggleSidebar} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={sidebarOpen} className="rounded-lg p-3 text-gray-400 hover:bg-gray-800 hover:text-white">
          <ChevronLeft className={cn('h-5 w-5', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>
      <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto p-2 lg:flex-1 lg:flex-col lg:p-3">
        {navigation.map(({name, href, icon: Icon}) => (
          <NavLink key={href} to={href} end={href === '/'} title={name} className={({isActive}) => cn('flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors', isActive ? 'bg-f1-red/15 text-red-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white', !sidebarOpen && 'lg:justify-center')}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className={cn('whitespace-nowrap', !sidebarOpen && 'lg:sr-only')}>{name}</span>
          </NavLink>
        ))}
      </nav>
      {sidebarOpen && <p className="hidden lg:block p-5 border-t border-gray-800 text-xs text-gray-500">Race data &amp; strategy explorer</p>}
    </aside>
  );
}
