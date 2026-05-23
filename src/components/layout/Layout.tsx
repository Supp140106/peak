import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSettingsStore } from '@/store/settingsStore';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Calendar,
  BarChart2,
  Focus,
  Book,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldOff
} from 'lucide-react';
import { SearchDialog } from '@/components/common/SearchDialog';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'habits', label: 'Habits', icon: CheckSquare, path: '/habits' },
  { id: 'focus', label: 'Focus', icon: Focus, path: '/focus' },
  { id: 'journal', label: 'Journal', icon: Book, path: '/journal' },
  { id: 'goals', label: 'Goals', icon: Target, path: '/goals' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/analytics' },
  { id: 'focus-block', label: 'Focus Block', icon: ShieldOff, path: '/focus-block' },
];

export function Sidebar() {
  const { settings, updateSetting } = useSettingsStore();
  const collapsed = settings?.sidebarCollapsed || false;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-[#0c0c0c] border-r border-[#2a2a2a] transition-all duration-200 z-30",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      {/* <div className="h-20 flex items-center px-6 mb-2">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#2a2a2a] flex items-center justify-center shrink-0">
          <img 
            src="/logo.png" 
            alt="Peak Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        {!collapsed && (
          <span className="ml-3 font-medium text-xl tracking-tight text-white">PEAK</span>
        )}
      </div> */}

      {/* User Profile */}
      <div className="px-4 mb-6 mt-6">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-2xl bg-[#141414] border border-[#2a2a2a]",
          collapsed ? "justify-center p-1" : "px-3"
        )}>
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-black text-xs font-bold shrink-0 overflow-hidden">
            {settings?.userAvatar ? (
              <img src={settings.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{(settings?.userName || 'U').charAt(0)}</span>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{settings?.userName || 'User'}</p>

            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <button
          onClick={triggerSearch}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#141414] border border-[#2a2a2a] text-neutral-500 hover:text-neutral-400 transition-colors duration-200",
            collapsed && "justify-center"
          )}
        >
          <Search size={18} strokeWidth={1.5} />
          {!collapsed && <span className="text-sm">Search...</span>}
          {!collapsed && <kbd className="ml-auto text-[10px] bg-[#0c0c0c] px-1.5 py-0.5 rounded border border-[#2a2a2a] text-neutral-500">⌘K</kbd>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200",
              isActive
                ? "bg-[#1a1a1a] text-white border border-[#2a2a2a]"
                : "text-neutral-400 hover:text-white hover:bg-[#1a1a1a]",
              collapsed && "justify-center"
            )}
          >
            <item.icon size={20} strokeWidth={1.5} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[#2a2a2a]">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200",
            isActive
              ? "bg-[#1a1a1a] text-white border border-[#2a2a2a]"
              : "text-neutral-400 hover:text-white hover:bg-[#1a1a1a]",
            collapsed && "justify-center"
          )}
        >
          <Settings size={20} strokeWidth={1.5} />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          onClick={() => updateSetting('sidebarCollapsed', !collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 mt-0.5 rounded-xl text-neutral-500 hover:text-neutral-400 transition-colors duration-200",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronRight size={20} strokeWidth={1.5} /> : <ChevronLeft size={20} strokeWidth={1.5} />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function Layout() {
  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] overflow-hidden">
      <Sidebar />
      <main className="flex-1 relative overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto w-full p-8 md:p-12 min-h-full">
          <Outlet />
        </div>
      </main>
      <SearchDialog />
    </div>
  );
}
