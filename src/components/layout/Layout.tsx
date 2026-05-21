// =============================================
// PEAK — Main Layout
// =============================================

import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Menu
} from 'lucide-react';
import { SearchDialog } from '@/components/common/SearchDialog';
import { cn } from '@/utils/cn';
import { useGamificationStore } from '@/store/gamificationStore';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'habits', label: 'Habits', icon: CheckSquare, path: '/habits' },
  { id: 'focus', label: 'Focus', icon: Focus, path: '/focus' },
  { id: 'journal', label: 'Journal', icon: Book, path: '/journal' },
  { id: 'goals', label: 'Goals', icon: Target, path: '/goals' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/analytics' },
];

export function Sidebar() {
  const { settings, updateSetting } = useSettingsStore();
  const { level, xp } = useGamificationStore();
  const collapsed = settings?.sidebarCollapsed || false;

  const triggerSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] transition-all duration-300 z-30",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Area *
      <div className="h-20 flex items-center px-6 mb-2">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center shrink-0 shadow-sm">
          <img 
            src="/logo.png" 
            alt="Peak Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        {!collapsed && (
          <span className="ml-3 font-bold text-xl tracking-tight text-[var(--color-text-primary)]">PEAK</span>
        )}
      </div>/}

      {/* User Profile Summary */}
      <div className="px-4 mb-6">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]",
          collapsed ? "justify-center p-1" : "px-3"
        )}>
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {settings?.userAvatar ? (
              <img src={settings.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{(settings?.userName || 'U').charAt(0)}</span>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{settings?.userName || 'User'}</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Level {level}</p>
            </div>
          )}
        </div>
      </div>

      {/* Search Trigger */}
      <div className="px-4 mb-6">
        <button 
          onClick={triggerSearch}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-all group",
            collapsed && "justify-center"
          )}
        >
          <Search size={18} className="group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="text-sm font-medium">Search...</span>}
          {!collapsed && <kbd className="ml-auto text-[10px] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">⌘K</kbd>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
              isActive 
                ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" 
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]",
              collapsed && "justify-center"
            )}
          >
            <item.icon size={20} className={cn("transition-transform", !collapsed && "group-hover:scale-110")} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Level / XP Progress */}
      <div className="px-6 mb-6">
        {!collapsed ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Level {level}</span>
              <span className="text-[10px] font-bold text-[var(--color-accent)]">{Math.round((xp % 1000) / 10)}%</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--color-accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${(xp % 1000) / 10}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)]">
              L{level}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
            isActive 
              ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" 
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]",
            collapsed && "justify-center"
          )}
        >
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button 
          onClick={() => updateSetting('sidebarCollapsed', !collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-all",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function Layout() {
  return (
    <div className="flex h-screen w-full bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar />
      <main className="flex-1 relative overflow-y-auto">
        <div className="max-w-[1200px] mx-auto w-full p-8 md:p-12 min-h-full">
          <Outlet />
        </div>
      </main>
      <SearchDialog />
    </div>
  );
}
