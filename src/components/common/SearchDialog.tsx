import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, ArrowRight, LayoutDashboard, CheckSquare, Target, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabitStore } from '@/store/habitStore';
import { useKeyboardShortcut } from '@/hooks/useKeyboard';
import { cn } from '@/utils/cn';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'habit' | 'goal' | 'journal' | 'navigation';
  path: string;
}

export function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { activeHabits } = useHabitStore();

  useKeyboardShortcut({ key: 'k', meta: true }, () => setIsOpen(true));
  useKeyboardShortcut({ key: 'k', ctrl: true }, () => setIsOpen(true));
  
  useKeyboardShortcut({ key: 'Escape' }, () => setIsOpen(false), !isOpen);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const results: SearchResult[] = [];

  const navItems = [
    { title: 'Dashboard', path: '/', icon: LayoutDashboard },
    { title: 'Habits', path: '/habits', icon: CheckSquare },
    { title: 'Goals', path: '/goals', icon: Target },
    { title: 'Journal', path: '/journal', icon: BookOpen },
  ];

  if (query) {
    const q = query.toLowerCase();
    
    navItems.forEach(nav => {
      if (nav.title.toLowerCase().includes(q)) {
        results.push({ id: `nav-${nav.path}`, title: nav.title, subtitle: 'Navigation', type: 'navigation', path: nav.path });
      }
    });

    activeHabits.forEach(habit => {
      if (habit.name.toLowerCase().includes(q) || habit.description.toLowerCase().includes(q) || habit.category.toLowerCase().includes(q)) {
        results.push({ id: `habit-${habit.id}`, title: habit.name, subtitle: `Habit • ${habit.category}`, type: 'habit', path: `/habits/${habit.id}` });
      }
    });
  } else {
    navItems.forEach(nav => {
      results.push({ id: `nav-${nav.path}`, title: nav.title, subtitle: 'Navigation', type: 'navigation', path: nav.path });
    });
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75"
            onClick={() => setIsOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative z-10 w-full max-w-2xl bg-[#141414] rounded-2xl border border-[#2a2a2a] overflow-hidden"
          >
            <div className="flex items-center px-4 border-b border-[#2a2a2a]">
              <SearchIcon size={20} strokeWidth={1.5} className="text-neutral-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search habits, pages, or notes..."
                className="w-full h-14 bg-transparent border-none focus:outline-none px-4 text-lg text-white placeholder:text-neutral-500"
              />
              <div className="flex gap-1 shrink-0">
                <kbd className="text-[10px] border border-[#2a2a2a] rounded px-1.5 py-0.5 bg-[#1a1a1a] text-neutral-500">ESC</kbd>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((result, i) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors duration-200",
                        selectedIndex === i 
                          ? "bg-[var(--accent-soft)] text-[var(--accent-lighter)]" 
                          : "hover:bg-[#1a1a1a] text-white"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                        selectedIndex === i 
                          ? "bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-lighter)]" 
                          : "bg-[#1a1a1a] border-[#2a2a2a] text-neutral-400"
                      )}>
                        {result.type === 'navigation' ? <LayoutDashboard size={16} strokeWidth={1.5} /> : 
                         result.type === 'habit' ? <CheckSquare size={16} strokeWidth={1.5} /> : 
                         <BookOpen size={16} strokeWidth={1.5} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        <div className="text-xs text-neutral-500 truncate">{result.subtitle}</div>
                      </div>
                      {selectedIndex === i && (
                        <ArrowRight size={16} strokeWidth={1.5} className="text-[var(--accent-lighter)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-[#2a2a2a] bg-[#1a1a1a] flex justify-between items-center text-xs text-neutral-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><kbd className="border border-[#2a2a2a] rounded px-1 pb-0.5 bg-[#141414]">↑</kbd><kbd className="border border-[#2a2a2a] rounded px-1 pb-0.5 bg-[#141414]">↓</kbd> to navigate</span>
                <span className="flex items-center gap-1"><kbd className="border border-[#2a2a2a] rounded px-1 pb-0.5 bg-[#141414]">↵</kbd> to select</span>
              </div>
              <div>
                Global shortcut: <kbd className="border border-[#2a2a2a] rounded px-1 pb-0.5 bg-[#141414]">Cmd</kbd> + <kbd className="border border-[#2a2a2a] rounded px-1 pb-0.5 bg-[#141414]">K</kbd>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
