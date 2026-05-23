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

  if (isLoading && activeHabits.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="text-neutral-400 font-medium animate-pulse">Loading Peak...</div>
      </div>
    );
  }

  const todayStr = formatShortDate(new Date());
  
  const totalToday = activeHabits.length;
  const completedToday = activeHabits.filter(h => h.todayStatus === 'completed').length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const maxStreak = activeHabits.length > 0 
    ? Math.max(...activeHabits.map(h => h.longestStreak ?? h.currentStreak)) 
    : 0;

  return (
    <div className="h-full flex flex-col space-y-8 pb-12">
      <header className="flex items-end justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-medium tracking-tight text-white mb-2"
          >
            {getGreeting()}, {userName}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 text-lg"
          >
            Today is {todayStr}. You've completed {completedToday} of {totalToday} habits.
          </motion.p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="p-8 flex items-center justify-between h-full">
            <div>
              <h3 className="text-base font-medium mb-1 text-white">Daily Progress</h3>
              <p className="text-neutral-400 mb-6">Keep the momentum going!</p>
              
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-medium tracking-tight text-white">{progressPercent}%</span>
              </div>
            </div>
            
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-[#2a2a2a] fill-none" 
                  strokeWidth="8"
                />
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-[var(--accent)] fill-none" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(progressPercent / 100) * 251.2} 251.2` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <h3 className="text-neutral-400 font-medium mb-2 uppercase tracking-wider text-xs">Consistency</h3>
            <div className="text-4xl font-medium mb-4 text-white">{progressPercent}<span className="text-xl text-neutral-500">%</span></div>
            
            <h3 className="text-neutral-400 font-medium mb-2 uppercase tracking-wider text-xs mt-4">Longest Streak</h3>
            <div className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-[var(--accent)]">{maxStreak} days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-white">Today's Habits</h2>
        </div>
        
        {activeHabits.length === 0 && !isLoading ? (
          <div className="text-center p-12 rounded-2xl border border-dashed border-[#2a2a2a] text-neutral-400">
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
