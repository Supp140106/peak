import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, ArrowRight, LayoutDashboard, CheckSquare, Target, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabitStore } from '@/store/habitStore';
import { useKeyboardShortcut } from '@/hooks/useKeyboard';
import { Input } from '@/components/ui/Input';
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
  
  // Close on Escape
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

  // Static navigation
  const navItems = [
    { title: 'Dashboard', path: '/', icon: LayoutDashboard },
    { title: 'Habits', path: '/habits', icon: CheckSquare },
    { title: 'Goals', path: '/goals', icon: Target },
    { title: 'Journal', path: '/journal', icon: BookOpen },
  ];

  if (query) {
    const q = query.toLowerCase();
    
    // Search Navigation
    navItems.forEach(nav => {
      if (nav.title.toLowerCase().includes(q)) {
        results.push({ id: `nav-${nav.path}`, title: nav.title, subtitle: 'Navigation', type: 'navigation', path: nav.path });
      }
    });

    // Search Habits
    activeHabits.forEach(habit => {
      if (habit.name.toLowerCase().includes(q) || habit.description.toLowerCase().includes(q) || habit.category.toLowerCase().includes(q)) {
        results.push({ id: `habit-${habit.id}`, title: habit.name, subtitle: `Habit • ${habit.category}`, type: 'habit', path: `/habits/${habit.id}` });
      }
    });
  } else {
    // Default suggestions when empty
    navItems.forEach(nav => {
      results.push({ id: `nav-${nav.path}`, title: nav.title, subtitle: 'Navigation', type: 'navigation', path: nav.path });
    });
  }

  // Keyboard navigation within list
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative z-10 w-full max-w-2xl bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 border-b border-[var(--color-border)]">
              <SearchIcon size={20} className="text-[var(--color-text-tertiary)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search habits, pages, or notes..."
                className="w-full h-14 bg-transparent border-none focus:outline-none px-4 text-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              />
              <div className="flex gap-1 shrink-0">
                <kbd className="text-[10px] font-sans border border-[var(--color-border)] rounded px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">ESC</kbd>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)]">
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
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                        selectedIndex === i 
                          ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" 
                          : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center shrink-0 border",
                        selectedIndex === i 
                          ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-[var(--color-accent)]" 
                          : "bg-[var(--color-bg-tertiary)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      )}>
                        {result.type === 'navigation' ? <LayoutDashboard size={16} /> : 
                         result.type === 'habit' ? <CheckSquare size={16} /> : 
                         <BookOpen size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        <div className="text-xs truncate opacity-70">{result.subtitle}</div>
                      </div>
                      {selectedIndex === i && (
                        <ArrowRight size={16} className="text-[var(--color-accent)] opacity-70" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex justify-between items-center text-xs text-[var(--color-text-tertiary)]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><kbd className="border border-[var(--color-border)] rounded px-1 pb-0.5 bg-[var(--color-bg-secondary)]">↑</kbd><kbd className="border border-[var(--color-border)] rounded px-1 pb-0.5 bg-[var(--color-bg-secondary)]">↓</kbd> to navigate</span>
                <span className="flex items-center gap-1"><kbd className="border border-[var(--color-border)] rounded px-1 pb-0.5 bg-[var(--color-bg-secondary)]">↵</kbd> to select</span>
              </div>
              <div>
                Global shortcut: <kbd className="border border-[var(--color-border)] rounded px-1 pb-0.5 bg-[var(--color-bg-secondary)]">Cmd</kbd> + <kbd className="border border-[var(--color-border)] rounded px-1 pb-0.5 bg-[var(--color-bg-secondary)]">K</kbd>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
