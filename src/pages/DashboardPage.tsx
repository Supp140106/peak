// =============================================
// PEAK — Dashboard Page
// =============================================

import React, { useEffect } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { HabitCard } from '@/components/habits/HabitCard';
import { motion } from 'framer-motion';
import { getGreeting, formatShortDate } from '@/utils/dates';
import { Card, CardContent } from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settingsStore';

export function DashboardPage() {
  const { activeHabits, fetchHabits, toggleCompletion, isLoading } = useHabitStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const userName = settings?.userName || 'User';

  // If loading and no habits yet, show a loader
  if (isLoading && activeHabits.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--color-bg-tertiary)] border-t-[var(--color-accent)] animate-spin" />
        <div className="text-[var(--color-text-secondary)] font-medium">Syncing your habits...</div>
      </div>
    );
  }

  const todayStr = formatShortDate(new Date());
  
  // Calculate today's progress
  const totalToday = activeHabits.length;
  const completedToday = activeHabits.filter(h => h.todayStatus === 'completed').length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const maxStreak = activeHabits.length > 0 
    ? Math.max(...activeHabits.map(h => h.longestStreak ?? h.currentStreak)) 
    : 0;

  return (
    <div className="h-full flex flex-col space-y-8 pb-12">
      {/* Header section */}
      <header className="flex items-end justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2"
          >
            {getGreeting()}, {userName}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--color-text-secondary)] text-lg"
          >
            Today is {todayStr}. You've completed {completedToday} of {totalToday} habits.
          </motion.p>
        </div>
      </header>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 overflow-hidden relative border-none bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] shadow-premium">
          <CardContent className="p-8 flex items-center justify-between h-full">
            <div className="z-10">
              <h3 className="text-xl font-medium mb-1">Daily Progress</h3>
              <p className="text-[var(--color-text-secondary)] mb-6">Keep the momentum going!</p>
              
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">{progressPercent}%</span>
              </div>
            </div>
            
            {/* Visual Progress Ring */}
            <div className="relative w-32 h-32 flex-shrink-0 z-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-[var(--color-border)] fill-none opacity-20" 
                  strokeWidth="8"
                />
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-[var(--color-accent)] fill-none" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(progressPercent / 100) * 251.2} 251.2` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <h3 className="text-[var(--color-text-secondary)] font-medium mb-2 uppercase tracking-wider text-[xs]">Consistency</h3>
            <div className="text-4xl font-bold mb-4 text-[var(--color-text-primary)]">{progressPercent}<span className="text-xl text-[var(--color-text-tertiary)]">%</span></div>
            
            <h3 className="text-[var(--color-text-secondary)] font-medium mb-2 uppercase tracking-wider text-[xs] mt-4">Longest Streak</h3>
            <div className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-[var(--color-accent)]">🔥</span> {maxStreak} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Habits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Today's Habits</h2>
        </div>
        
        {activeHabits.length === 0 && !isLoading ? (
          <div className="text-center p-12 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)]">
            No habits scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeHabits.map(habit => (
              <HabitCard 
                key={habit.id} 
                habit={habit} 
                onToggle={toggleCompletion}
                onClick={(id) => navigate(`/habits/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
