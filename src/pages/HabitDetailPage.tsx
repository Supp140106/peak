import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHabitStore } from '@/store/habitStore';
import { getLogsForHabit } from '@/database/habits';
import type { HabitLog } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flame, Calendar as CalendarIcon, Clock, Settings, Edit3, CheckCircle2, XCircle, Trash2, AlertCircle, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { formatShortDate, parseISO, getLast30Days } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { HabitForm } from '@/components/habits/HabitForm';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  subMonths, 
  addMonths, 
  isSameMonth, 
  isSameDay, 
  isAfter 
} from 'date-fns';

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeHabits, toggleCompletion, updateHabit, deleteHabit } = useHabitStore();
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Date state for month navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const habit = activeHabits.find(h => h.id === id);

  useEffect(() => {
    if (id) {
      getLogsForHabit(id, 3650).then(data => {
        setLogs(data);
        setIsLoading(false);
      });
    }
  }, [id, activeHabits]);

  if (!habit) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <h2 className="text-xl font-medium mb-4">Habit not found</h2>
        <Button onClick={() => navigate('/habits')}>Back to Habits</Button>
      </div>
    );
  }

  const days = getLast30Days().reverse();

  const getStatusForDate = (dateStr: string) => {
    const log = logs.find(l => l.date === dateStr);
    return log?.status || null;
  };

  const handleUpdate = async (data: any) => {
    if (id) {
      await updateHabit(id, data);
      setIsEditModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (id) {
      await deleteHabit(id);
      navigate('/habits');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
              style={{ backgroundColor: `${habit.color}15`, border: `1px solid ${habit.color}30` }}
            >
              <span style={{ color: habit.color }}>{habit.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">
                {habit.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1.5"><Clock size={14} /> {habit.frequency} ({habit.estimatedDuration}m)</span>
                <span className="flex items-center gap-1.5"><CalendarIcon size={14} /> Created {formatShortDate(habit.createdAt)}</span>
                <Badge variant="secondary" className="ml-2 font-normal text-[10px]">{habit.category}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 size={16}/> Edit
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)] border-[var(--color-danger)]/20"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <Trash2 size={16}/> Delete
          </Button>
        </div>
      </div>

      {habit.description && (
        <p className="text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
          {habit.description}
        </p>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-premium bg-[var(--color-bg-secondary)]">
          <CardContent className="p-6 flex flex-col justify-center">
            <span className="text-sm font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-widest text-[10px]">Current Streak</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--color-text-primary)]">{habit.currentStreak}</span>
              <span className="text-xs text-[var(--color-text-tertiary)]">days</span>
              <Flame size={20} className={cn("ml-auto", habit.currentStreak > 0 ? "text-[var(--color-accent)] fill-current" : "text-[var(--color-border)]")} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-premium bg-[var(--color-bg-secondary)]">
          <CardContent className="p-6 flex flex-col justify-center">
            <span className="text-sm font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-widest text-[10px]">Longest Streak</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--color-text-primary)]">{habit.longestStreak}</span>
              <span className="text-xs text-[var(--color-text-tertiary)]">days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-[var(--color-bg-secondary)]">
          <CardContent className="p-6 flex flex-col justify-center">
            <span className="text-sm font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-widest text-[10px]">Total Completions</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--color-text-primary)]">{habit.totalCompletions}</span>
              <span className="text-xs text-[var(--color-text-tertiary)]">times</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-[var(--color-bg-secondary)]">
          <CardContent className="p-6 flex flex-col justify-center items-center h-full">
            <Button 
              onClick={() => toggleCompletion(habit.id)}
              className={cn(
                "w-full h-full text-md gap-2 transition-all shadow-md active:scale-95",
                habit.todayStatus === 'completed' 
                  ? "bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white" 
                  : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
              )}
            >
              {habit.todayStatus === 'completed' ? <><CheckCircle2 size={18} /> Completed Today</> : <><CheckCircle2 size={18} /> Mark Complete</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Consistency (previous months/years navigation) */}
      {(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

        const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
        const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

        const handleToggleDay = async (day: Date) => {
          if (isAfter(day, new Date())) return; // Disable future dates
          const dateStr = format(day, 'yyyy-MM-dd');
          await toggleCompletion(habit.id, dateStr);
        };

        return (
          <Card className="border border-[var(--color-border)] shadow-sm bg-[var(--color-bg-secondary)] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-4 mb-6">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)]">
                    Consistency Calendar
                  </h3>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] font-medium mt-0.5">
                    Click on past days to record completions. Future dates are disabled.
                  </p>
                </div>
                
                {/* Chevrons Month Selector */}
                <div className="flex items-center gap-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] p-1 rounded-xl shadow-inner">
                  <button 
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-lg transition-colors active:scale-95"
                    title="Previous Month"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-primary)] w-32 text-center select-none">
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                  <button 
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-lg transition-colors active:scale-95"
                    title="Next Month"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 text-center mb-2 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const status = getStatusForDate(dateStr);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isSameDay(day, new Date());
                  const isFuture = isAfter(day, new Date());

                  let cellClass = "bg-[var(--color-bg-tertiary)]/40 hover:bg-[var(--color-bg-hover)] border-[var(--color-border)] text-[var(--color-text-primary)]";
                  if (status === 'completed') {
                    cellClass = "bg-[var(--color-success)] border-[var(--color-success)] text-white font-bold shadow-sm";
                  } else if (status === 'skipped') {
                    cellClass = "bg-[var(--color-warning)] border-[var(--color-warning)] text-white font-bold";
                  } else if (status === 'missed') {
                    cellClass = "bg-[var(--color-danger)] border-[var(--color-danger)] text-white opacity-60";
                  }

                  return (
                    <button
                      key={dateStr}
                      disabled={isFuture}
                      onClick={() => handleToggleDay(day)}
                      className={cn(
                        "aspect-square rounded-xl border flex flex-col justify-between p-2 relative group transition-all duration-200",
                        isCurrentMonth ? "" : "opacity-15",
                        isFuture ? "cursor-not-allowed opacity-20 bg-transparent border-transparent" : "active:scale-95 cursor-pointer",
                        isTodayDate && !status && "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30",
                        cellClass
                      )}
                    >
                      <span className="text-[10px] font-bold">
                        {format(day, 'd')}
                      </span>

                      {status === 'completed' && (
                        <div className="w-full flex justify-end">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                      )}
                      {status === 'missed' && (
                        <div className="w-full flex justify-end">
                          <XCircle size={10} className="text-white" />
                        </div>
                      )}

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-bold shadow-lg">
                        {format(day, 'MMM d')}: {status ? status.toUpperCase() : isFuture ? 'FUTURE' : 'NO RECORD'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legends Row */}
              <div className="flex flex-wrap gap-4 items-center justify-end mt-4 text-[8px] font-extrabold uppercase tracking-widest text-[var(--color-text-tertiary)] border-t border-[var(--color-border)] pt-4">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[var(--color-success)] rounded border border-[var(--color-success)]/10" /> Completed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[var(--color-warning)] rounded border border-[var(--color-warning)]/10" /> Skipped</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[var(--color-danger)] rounded border border-[var(--color-danger)]/10" /> Missed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border)]" /> No Entry</span>
              </div>
            </CardContent>
          </Card>
        );
      })()}
      
      {/* Activity Logs (Timeline) */}
      <div className="space-y-6">
         <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Recent Logs</h3>
         {isLoading ? (
           <p className="text-[var(--color-text-secondary)] italic">Loading history...</p>
         ) : logs.length === 0 ? (
           <Card className="border-none shadow-premium bg-[var(--color-bg-secondary)] p-8 text-center text-[var(--color-text-tertiary)] italic">
             No activity recorded yet.
           </Card>
         ) : (
           <div className="space-y-4">
             {logs.slice(0, 10).map((log) => (
               <div key={log.id} className="flex items-center gap-4 p-5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] shadow-sm">
                 <div className={cn(
                   "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                   log.status === 'completed' ? "bg-[var(--color-success-light)] text-[var(--color-success)]" :
                   log.status === 'skipped' ? "bg-[var(--color-warning-light)] text-[var(--color-warning)]" :
                   "bg-[var(--color-danger-light)] text-[var(--color-danger)]"
                 )}>
                   {log.status === 'completed' ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                 </div>
                 <div>
                   <p className="font-bold text-[var(--color-text-primary)] capitalize text-lg">{log.status}</p>
                   {log.note && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{log.note}</p>}
                 </div>
                 <div className="ml-auto text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
                   {formatShortDate(parseISO(log.date))}
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-2xl">
              <HabitForm 
                initialData={habit}
                onSubmit={handleUpdate} 
                onCancel={() => setIsEditModalOpen(false)} 
              />
            </div>
          </div>
        )}

        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsDeleteConfirmOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] shadow-xl p-8"
            >
              <div className="flex items-center gap-4 mb-6 text-[var(--color-danger)]">
                <div className="w-12 h-12 rounded-full bg-[var(--color-danger-light)] flex items-center justify-center">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-xl font-bold">Delete Habit?</h3>
              </div>
              <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[var(--color-text-primary)]">"{habit.name}"</span>? This action cannot be undone and all your progress history will be lost.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white"
                  onClick={handleDelete}
                >
                  Yes, Delete Habit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

