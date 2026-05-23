import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { useHabitStore } from '@/store/habitStore';
import { formatDate, formatShortDate, parseISO, todayISO } from '@/utils/dates';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Award, CheckCircle2, XCircle, AlertCircle, HelpCircle, Timer } from 'lucide-react';
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

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevYear = () => setCurrentDate(subYears(currentDate, 1));
  const nextYear = () => setCurrentDate(addYears(currentDate, 1));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  const yearlyDays = useMemo(() => {
    const yearStart = startOfMonth(new Date(currentDate.getFullYear(), 0, 1));
    const yearEnd = endOfMonth(new Date(currentDate.getFullYear(), 11, 31));
    return eachDayOfInterval({ start: yearStart, end: yearEnd });
  }, [currentDate.getFullYear()]);

  const yearlyWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    const firstDay = yearlyDays[0];
    const leadingDays = firstDay.getDay();
    const startDayAdjusted = (leadingDays === 0 ? 6 : leadingDays - 1);
    
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
    if (count === 0) return 'bg-[#1a1a1a] border-[#2a2a2a]';
    if (count <= 1) return 'bg-[var(--accent-soft)] border-[var(--accent-border)]';
    if (count <= 2) return 'bg-[var(--accent-soft)] border-[var(--accent-border)]';
    if (count <= 4) return 'bg-[var(--accent-soft)] border-[var(--accent-border)]';
    return 'bg-[var(--accent)] border-[var(--accent)]';
  };

  const getStatusText = (dateStr: string) => {
    const count = counts[dateStr] || 0;
    if (count === 0) return 'No completions';
    return `${count} habit${count > 1 ? 's' : ''} completed`;
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-12 overflow-y-auto pr-1 scrollbar-hide">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[clamp(28px,4vw,44px)] font-medium tracking-tight text-white mb-1">Calendar</h1>
          <p className="text-neutral-400">Browse completions, track historical progress, and view daily details.</p>
        </div>

        <div className="flex bg-[#141414] border border-[#2a2a2a] p-1 rounded-xl self-start">
          <button 
            onClick={() => setViewType('monthly')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors duration-200",
              viewType === 'monthly' ? "bg-white text-black" : "text-neutral-500 hover:text-white"
            )}
          >
            Monthly Grid
          </button>
          <button 
            onClick={() => setViewType('yearly')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors duration-200",
              viewType === 'yearly' ? "bg-white text-black" : "text-neutral-500 hover:text-white"
            )}
          >
            Yearly Heatmap
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={viewType === 'monthly' ? prevMonth : prevYear}
            className="p-2 border border-[#2a2a2a] bg-[#1a1a1a] hover:border-neutral-600 rounded-xl transition-colors duration-200 text-neutral-400"
            title={viewType === 'monthly' ? 'Previous Month' : 'Previous Year'}
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <span className="text-sm font-medium uppercase tracking-wider text-white min-w-36 text-center">
            {viewType === 'monthly' 
              ? format(currentDate, 'MMMM yyyy') 
              : format(currentDate, 'yyyy')}
          </span>
          <button 
            onClick={viewType === 'monthly' ? nextMonth : nextYear}
            className="p-2 border border-[#2a2a2a] bg-[#1a1a1a] hover:border-neutral-600 rounded-xl transition-colors duration-200 text-neutral-400"
            title={viewType === 'monthly' ? 'Next Month' : 'Next Year'}
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[9px] font-medium uppercase tracking-wider text-neutral-500">
          <span>Less</span>
          {[0, 1, 2, 4, 6].map(l => (
            <div key={l} className={cn("w-3 h-3 rounded-md border", getLevelColor(l))} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <Card>
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
                    <div className="grid grid-cols-7 gap-2 mb-3 text-center text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                      <div>Sun</div>
                    </div>

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
                              "aspect-square rounded-2xl border flex flex-col justify-between p-2 relative group transition-colors duration-200",
                              isCurrentMonth 
                                ? "bg-[#1a1a1a] hover:bg-[#1a1a1a] border-[#2a2a2a]" 
                                : "bg-transparent border-transparent opacity-20 hover:opacity-40",
                              isSelected && "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[#141414] border-transparent"
                            )}
                          >
                            <span className={cn(
                              "text-xs font-medium",
                              isTodayDate 
                                ? "text-[var(--accent)]" 
                                : isCurrentMonth ? "text-white" : "text-neutral-500"
                            )}>
                              {format(day, 'd')}
                            </span>

                            {count > 0 && (
                              <div className="w-full flex items-center justify-end">
                                <span className={cn(
                                  "w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-bold text-black border",
                                  getLevelColor(count)
                                )}>
                                  {count}
                                </span>
                              </div>
                            )}

                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-black text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-medium">
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
                    <div className="flex gap-1.5 min-w-[640px]">
                      <div className="flex flex-col gap-[3px] mt-4 pr-1 text-[8px] font-bold text-neutral-500 uppercase select-none">
                        <div className="h-2.5 w-3"></div>
                        <div className="h-2.5 w-3 text-center">Mon</div>
                        <div className="h-2.5 w-3"></div>
                        <div className="h-2.5 w-3 text-center">Wed</div>
                        <div className="h-2.5 w-3"></div>
                        <div className="h-2.5 w-3 text-center">Fri</div>
                        <div className="h-2.5 w-3"></div>
                      </div>

                      <div className="flex flex-col w-full">
                        <div className="flex text-[8px] text-neutral-500 mb-1 relative h-3 uppercase font-bold tracking-wider">
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
                                      "w-[11px] h-[11px] rounded-[2px] border transition-colors duration-200 relative group cursor-pointer",
                                      getLevelColor(count),
                                      isSelected ? "ring-1 ring-[var(--accent)] scale-110" : ""
                                    )}
                                  >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-white text-black text-[8px] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl font-bold">
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

        <div className="lg:col-span-4 flex flex-col space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="border-b border-[#2a2a2a] pb-4 mb-4">
                <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 mb-1">
                  Selected Date Details
                </div>
                <h3 className="font-medium text-lg text-white">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                
                <div className="mt-3 flex items-center gap-2.5 bg-[var(--accent-soft)] text-[var(--accent-lighter)] border border-[var(--accent-soft)] p-2.5 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-lighter)]">
                    <Timer size={14} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">Focus Duration</span>
                    <span className="text-xs font-medium text-white">
                      {focusMinutes[format(selectedDate, 'yyyy-MM-dd')] || 0} mins focused
                    </span>
                  </div>
                </div>
              </div>

              {loadingLogs ? (
                <div className="text-center py-8 text-neutral-500 text-xs italic">
                  Loading completion data...
                </div>
              ) : activeHabits.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs italic">
                  Create some habits to track progress!
                </div>
              ) : (
                <div className="space-y-3">
                  {activeHabits.map((habit) => {
                    const log = dayLogs.find(l => l.habitId === habit.id);
                    const status = log?.status || 'missed';
                    
                    return (
                      <div 
                        key={habit.id}
                        className="flex items-center justify-between p-3 border border-[#2a2a2a] bg-[#1a1a1a] rounded-xl"
                      >
                        <div className="flex items-center gap-2.5">
                          <span style={{ color: habit.color }} className="text-base">
                            {habit.icon}
                          </span>
                          <span className="text-xs font-medium text-white truncate max-w-36">
                            {habit.name}
                          </span>
                        </div>

                        <div>
                          {status === 'completed' ? (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent-lighter)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-lg border border-[var(--accent-border)]">
                              <CheckCircle2 size={12} strokeWidth={1.5} /> Done
                            </span>
                          ) : status === 'skipped' ? (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 bg-[#1a1a1a] px-2 py-0.5 rounded-lg border border-[#2a2a2a]">
                              <AlertCircle size={12} strokeWidth={1.5} /> Skipped
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-500 bg-[#0c0c0c] px-2 py-0.5 rounded-lg border border-[#2a2a2a]">
                              <XCircle size={12} strokeWidth={1.5} /> Uncompleted
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-lighter)]">
                  <Award size={15} strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-xs uppercase tracking-wider text-white">Quick Insights</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2.5">
                  <span className="text-xs font-medium text-neutral-400">Total Habits tracked</span>
                  <span className="text-xs font-medium text-white">{activeHabits.length}</span>
                </div>
                
                {activeHabits.slice(0, 3).map(h => (
                  <div key={h.id} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 truncate max-w-40 flex items-center gap-1.5">
                      <span style={{ color: h.color }}>{h.icon}</span> {h.name}
                    </span>
                    <span className="font-medium font-mono text-white">
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
