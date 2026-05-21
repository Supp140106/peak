// =============================================
// PEAK — Calendar & Habit History Page
// =============================================

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { useHabitStore } from '@/store/habitStore';
import { formatDate, formatShortDate, parseISO, todayISO } from '@/utils/dates';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Target, Award, CheckCircle2, XCircle, AlertCircle, HelpCircle, Timer } from 'lucide-react';
import { cn } from '@/utils/cn';
import * as habitDb from '@/database/habits';
import * as focusDb from '@/database/focus';
import type { HabitLog, Habit } from '@/types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  addYears,
  subYears
} from 'date-fns';

export function CalendarPage() {
  const { activeHabits, fetchHabits } = useHabitStore();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [focusMinutes, setFocusMinutes] = useState<Record<string, number>>({});
  
  // Calendar States
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayLogs, setDayLogs] = useState<HabitLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  useEffect(() => {
    fetchHabits();
    loadCounts();
  }, [fetchHabits]);

  useEffect(() => {
    loadLogsForSelectedDate();
  }, [selectedDate]);

  const loadCounts = async () => {
    // Load counts for up to 10 years back (3650 days) so we have historical data
    const [habitCounts, focusMin] = await Promise.all([
      habitDb.getDailyCompletionCounts(3650),
      focusDb.getDailyFocusMinutes(3650)
    ]);
    setCounts(habitCounts);
    setFocusMinutes(focusMin);
  };

  const loadLogsForSelectedDate = async () => {
    setLoadingLogs(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const logs = await habitDb.getLogsForDate(dateStr);
      setDayLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Switch months
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  // Switch years
  const prevYear = () => setCurrentDate(subYears(currentDate, 1));
  const nextYear = () => setCurrentDate(addYears(currentDate, 1));

  // Get days in the current month padded to start/end of weeks
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Grid starts at start of week of 1st day of month (Monday start)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    // Grid ends at end of week of last day of month
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  // Get days in current year for Yearly Heatmap
  const yearlyDays = useMemo(() => {
    const yearStart = startOfMonth(new Date(currentDate.getFullYear(), 0, 1));
    const yearEnd = endOfMonth(new Date(currentDate.getFullYear(), 11, 31));
    return eachDayOfInterval({ start: yearStart, end: yearEnd });
  }, [currentDate.getFullYear()]);

  // Group yearly days by week for GitHub style (columns = weeks)
  const yearlyWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    // Pad first week with empty spaces if necessary
    const firstDay = yearlyDays[0];
    const leadingDays = firstDay.getDay(); // 0 is Sunday
    const startDayAdjusted = (leadingDays === 0 ? 6 : leadingDays - 1); // Adjust to Monday start
    
    for (let i = 0; i < startDayAdjusted; i++) {
      currentWeek.push(null as any);
    }

    yearlyDays.forEach((day) => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null as any);
      }
      weeks.push(currentWeek);
    }
    return weeks;
  }, [yearlyDays]);

  const monthLabels = useMemo(() => {
    const labels: { label: string, colIndex: number }[] = [];
    let lastMonth = -1;
    yearlyWeeks.forEach((week, i) => {
      const firstValidDay = week.find(d => d !== null);
      if (firstValidDay) {
        const m = firstValidDay.getMonth();
        if (m !== lastMonth) {
          labels.push({ label: format(firstValidDay, 'MMM'), colIndex: i });
          lastMonth = m;
        }
      }
    });
    return labels;
  }, [yearlyWeeks]);

  const getLevelColor = (count: number) => {
    if (count === 0) return 'bg-[var(--color-bg-tertiary)] opacity-30 border-[var(--color-border)]';
    if (count <= 1) return 'bg-[var(--color-accent)] opacity-30 border-[var(--color-accent)]/20';
    if (count <= 2) return 'bg-[var(--color-accent)] opacity-55 border-[var(--color-accent)]/30';
    if (count <= 4) return 'bg-[var(--color-accent)] opacity-75 border-[var(--color-accent)]/40';
    return 'bg-[var(--color-accent)] border-[var(--color-accent)] shadow-sm shadow-[var(--color-accent)]/20';
  };

  const getStatusText = (dateStr: string) => {
    const count = counts[dateStr] || 0;
    if (count === 0) return 'No completions';
    return `${count} habit${count > 1 ? 's' : ''} completed`;
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-12 overflow-y-auto pr-1 scrollbar-hide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">Calendar</h1>
          <p className="text-[var(--color-text-secondary)] font-medium">Browse completions, track historical progress, and view daily details.</p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-1 rounded-xl shadow-sm self-start">
          <button 
            onClick={() => setViewType('monthly')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              viewType === 'monthly' ? "bg-[var(--color-accent)] text-white shadow" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            Monthly Grid
          </button>
          <button 
            onClick={() => setViewType('yearly')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              viewType === 'yearly' ? "bg-[var(--color-accent)] text-white shadow" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            Yearly Heatmap
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={viewType === 'monthly' ? prevMonth : prevYear}
            className="p-2 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] rounded-xl transition-all active:scale-95 text-[var(--color-text-secondary)]"
            title={viewType === 'monthly' ? 'Previous Month' : 'Previous Year'}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)] min-w-36 text-center">
            {viewType === 'monthly' 
              ? format(currentDate, 'MMMM yyyy') 
              : format(currentDate, 'yyyy')}
          </span>
          <button 
            onClick={viewType === 'monthly' ? nextMonth : nextYear}
            className="p-2 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] rounded-xl transition-all active:scale-95 text-[var(--color-text-secondary)]"
            title={viewType === 'monthly' ? 'Next Month' : 'Next Year'}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          <span>Less</span>
          {[0, 1, 2, 4, 6].map(l => (
            <div key={l} className={cn("w-3 h-3 rounded-md border", getLevelColor(l))} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Column: Calendar or Heatmap */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <Card className="border border-[var(--color-border)] shadow-sm bg-[var(--color-bg-secondary)] rounded-2xl">
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {viewType === 'monthly' ? (
                  <motion.div
                    key="monthly"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col"
                  >
                    {/* Days of Week Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                      <div>Sun</div>
                    </div>

                    {/* Monthly Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const count = counts[dateStr] || 0;
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isSameDay(day, new Date());
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "aspect-square rounded-2xl border flex flex-col justify-between p-2 relative group transition-all duration-200 active:scale-95",
                              isCurrentMonth 
                                ? "bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] border-[var(--color-border)]" 
                                : "bg-transparent border-transparent opacity-20 hover:opacity-40",
                              isSelected && "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-secondary)] border-transparent"
                            )}
                          >
                            {/* Day Number */}
                            <span className={cn(
                              "text-xs font-bold",
                              isTodayDate 
                                ? "text-[var(--color-accent)] bg-[var(--color-accent-light)] px-1.5 py-0.5 rounded-lg" 
                                : isCurrentMonth ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-tertiary)]"
                            )}>
                              {format(day, 'd')}
                            </span>

                            {/* Completion Indicator dots or color */}
                            {count > 0 && (
                              <div className="w-full flex items-center justify-end">
                                <span className={cn(
                                  "w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-extrabold text-white shadow-sm border",
                                  getLevelColor(count)
                                )}>
                                  {count}
                                </span>
                              </div>
                            )}

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-bold shadow-lg">
                              {format(day, 'MMM d')}: {getStatusText(dateStr)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="yearly"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col overflow-x-auto scrollbar-hide"
                  >
                    {/* Yearly grid */}
                    <div className="flex gap-1.5 min-w-[640px]">
                      {/* Day Labels */}
                      <div className="flex flex-col gap-[3px] mt-4 pr-1 text-[8px] font-bold text-[var(--color-text-tertiary)] uppercase select-none">
                        <div className="h-2.5 w-3"></div>
                        <div className="h-2.5 w-3 text-center">Mon</div>
                        <div className="h-2.5 w-3"></div>
                        <div className="h-2.5 w-3 text-center">Wed</div>
                        <div className="h-2.5 w-3"></div>
                        <div className="h-2.5 w-3 text-center">Fri</div>
                        <div className="h-2.5 w-3"></div>
                      </div>

                      <div className="flex flex-col w-full">
                        {/* Month labels header */}
                        <div className="flex text-[8px] text-[var(--color-text-tertiary)] mb-1 relative h-3 uppercase font-bold tracking-wider">
                          {monthLabels.map((m, i) => (
                            <div 
                              key={i} 
                              className="absolute" 
                              style={{ left: `${(m.colIndex / yearlyWeeks.length) * 100}%` }}
                            >
                              {m.label}
                            </div>
                          ))}
                        </div>

                        {/* Weeks grid */}
                        <div className="flex gap-[3px]">
                          {yearlyWeeks.map((week, weekIdx) => (
                            <div key={weekIdx} className="flex flex-col gap-[3px]">
                              {week.map((day, dayIdx) => {
                                if (!day) return <div key={dayIdx} className="w-[11px] h-[11px] rounded-[2px]" />;
                                
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const count = counts[dateStr] || 0;
                                const isSelected = isSameDay(day, selectedDate);
                                
                                return (
                                  <button
                                    key={dayIdx}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                      "w-[11px] h-[11px] rounded-[2px] border transition-all duration-300 relative group cursor-pointer",
                                      getLevelColor(count),
                                      isSelected ? "ring-1 ring-[var(--color-accent)] scale-110" : "hover:scale-105"
                                    )}
                                  >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[8px] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl font-bold">
                                      {format(day, 'MMM d, yyyy')}: {getStatusText(dateStr)}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Daily Details & Breakdown */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          {/* Details for Selected Day */}
          <Card className="border border-[var(--color-border)] shadow-sm bg-[var(--color-bg-secondary)] rounded-2xl">
            <CardContent className="p-6">
              <div className="border-b border-[var(--color-border)] pb-4 mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                  Selected Date Details
                </div>
                <h3 className="font-bold text-lg text-[var(--color-text-primary)]">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                
                {/* Focus Timer stats for the selected day */}
                <div className="mt-3 flex items-center gap-2.5 bg-[var(--color-accent-light)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/10 p-2.5 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
                    <Timer size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Focus Duration</span>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {focusMinutes[format(selectedDate, 'yyyy-MM-dd')] || 0} mins focused
                    </span>
                  </div>
                </div>
              </div>

              {loadingLogs ? (
                <div className="text-center py-8 text-[var(--color-text-tertiary)] text-xs italic">
                  Loading completion data...
                </div>
              ) : activeHabits.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-tertiary)] text-xs italic">
                  Create some habits to track progress!
                </div>
              ) : (
                <div className="space-y-3">
                  {activeHabits.map((habit) => {
                    const log = dayLogs.find(l => l.habitId === habit.id);
                    const status = log?.status || 'missed'; // Default to missed if no entry
                    
                    return (
                      <div 
                        key={habit.id}
                        className="flex items-center justify-between p-3 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] rounded-xl"
                      >
                        <div className="flex items-center gap-2.5">
                          <span style={{ color: habit.color }} className="text-base">
                            {habit.icon}
                          </span>
                          <span className="text-xs font-bold text-[var(--color-text-primary)] truncate max-w-36">
                            {habit.name}
                          </span>
                        </div>

                        <div>
                          {status === 'completed' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-success)] bg-[var(--color-success-light)]/20 px-2 py-0.5 rounded-lg border border-[var(--color-success)]/10">
                              <CheckCircle2 size={12} /> Done
                            </span>
                          ) : status === 'skipped' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-warning)] bg-[var(--color-warning-light)]/20 px-2 py-0.5 rounded-lg border border-[var(--color-warning)]/10">
                              <AlertCircle size={12} /> Skipped
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-text-tertiary)] bg-[var(--color-bg-primary)] px-2 py-0.5 rounded-lg border border-[var(--color-border)]">
                              <XCircle size={12} /> Uncompleted
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="border border-[var(--color-border)] shadow-sm bg-[var(--color-bg-secondary)] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Award size={15} />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)]">Quick Insights</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Total Habits tracked</span>
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">{activeHabits.length}</span>
                </div>
                
                {activeHabits.slice(0, 3).map(h => (
                  <div key={h.id} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-secondary)] truncate max-w-40 flex items-center gap-1.5">
                      <span style={{ color: h.color }}>{h.icon}</span> {h.name}
                    </span>
                    <span className="font-bold font-mono text-[var(--color-text-primary)]">
                      {h.totalCompletions || 0} completions
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
