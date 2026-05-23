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
        <h2 className="text-xl font-medium mb-4 text-white">Habit not found</h2>
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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 rounded-full">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Button>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${habit.color}15`, border: `1px solid ${habit.color}30` }}
            >
              <span style={{ color: habit.color }}>{habit.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-white mb-1">
                {habit.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-neutral-400">
                <span className="flex items-center gap-1.5"><Clock size={14} strokeWidth={1.5} /> {habit.frequency} ({habit.estimatedDuration}m)</span>
                <span className="flex items-center gap-1.5"><CalendarIcon size={14} strokeWidth={1.5} /> Created {formatShortDate(habit.createdAt)}</span>
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
            <Edit3 size={16} strokeWidth={1.5} /> Edit
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-400 border-red-500/30"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <Trash2 size={16} strokeWidth={1.5} /> Delete
          </Button>
        </div>
      </div>

      {habit.description && (
        <p className="text-neutral-400 max-w-3xl leading-relaxed">
          {habit.description}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col justify-center">
            <span className="text-sm font-medium text-neutral-500 mb-1 uppercase tracking-widest text-[10px]">Current Streak</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-white">{habit.currentStreak}</span>
              <span className="text-xs text-neutral-500">days</span>
              <Flame size={20} strokeWidth={1.5} className={cn("ml-auto", habit.currentStreak > 0 ? "text-[var(--accent)] fill-current" : "text-[#2a2a2a]")} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col justify-center">
            <span className="text-sm font-medium text-neutral-500 mb-1 uppercase tracking-widest text-[10px]">Longest Streak</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-white">{habit.longestStreak}</span>
              <span className="text-xs text-neutral-500">days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-center">
            <span className="text-sm font-medium text-neutral-500 mb-1 uppercase tracking-widest text-[10px]">Total Completions</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-white">{habit.totalCompletions}</span>
              <span className="text-xs text-neutral-500">times</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-center items-center h-full">
            <Button 
              onClick={() => toggleCompletion(habit.id)}
              className={cn(
                "w-full h-full text-md gap-2 transition-colors duration-200",
                habit.todayStatus === 'completed' 
                  ? "bg-[var(--accent-soft)] text-[var(--accent-lighter)] border border-[var(--accent-border)]" 
                  : "bg-white text-black"
              )}
            >
              {habit.todayStatus === 'completed' ? <><CheckCircle2 size={18} strokeWidth={1.5} /> Completed Today</> : <><CheckCircle2 size={18} strokeWidth={1.5} /> Mark Complete</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

        const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
        const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

        const handleToggleDay = async (day: Date) => {
          if (isAfter(day, new Date())) return;
          const dateStr = format(day, 'yyyy-MM-dd');
          await toggleCompletion(habit.id, dateStr);
        };

        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2a2a2a] pb-4 mb-6">
                <div>
                  <h3 className="font-medium text-xs uppercase tracking-wider text-white">
                    Consistency Calendar
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
                    Click on past days to record completions. Future dates are disabled.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] p-1 rounded-xl">
                  <button 
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-[#1a1a1a] text-neutral-400 rounded-lg transition-colors duration-200"
                    title="Previous Month"
                  >
                    <ChevronLeft size={14} strokeWidth={1.5} />
                  </button>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-white w-32 text-center select-none">
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                  <button 
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-[#1a1a1a] text-neutral-400 rounded-lg transition-colors duration-200"
                    title="Next Month"
                  >
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center mb-2 text-[9px] font-medium uppercase tracking-wider text-neutral-500">
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

                  let cellClass = "bg-[#1a1a1a]/40 hover:bg-[#1a1a1a] border-[#2a2a2a] text-white";
                  if (status === 'completed') {
                    cellClass = "bg-[var(--accent)] border-[var(--accent)] text-black font-medium";
                  } else if (status === 'skipped') {
                    cellClass = "bg-neutral-500 border-neutral-500 text-white font-medium";
                  } else if (status === 'missed') {
                    cellClass = "bg-red-500/30 border-red-500/30 text-white opacity-60";
                  }

                  return (
                    <button
                      key={dateStr}
                      disabled={isFuture}
                      onClick={() => handleToggleDay(day)}
                      className={cn(
                        "aspect-square rounded-xl border flex flex-col justify-between p-2 relative group transition-colors duration-200",
                        isCurrentMonth ? "" : "opacity-15",
                        isFuture ? "cursor-not-allowed opacity-20 bg-transparent border-transparent" : "cursor-pointer",
                        isTodayDate && !status && "border-[var(--accent)] ring-1 ring-[var(--accent-border)]",
                        cellClass
                      )}
                    >
                      <span className="text-[10px] font-medium">
                        {format(day, 'd')}
                      </span>

                      {status === 'completed' && (
                        <div className="w-full flex justify-end">
                          <CheckCircle2 size={10} strokeWidth={1.5} className="text-black" />
                        </div>
                      )}
                      {status === 'missed' && (
                        <div className="w-full flex justify-end">
                          <XCircle size={10} strokeWidth={1.5} className="text-white" />
                        </div>
                      )}

                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-black text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-medium">
                        {format(day, 'MMM d')}: {status ? status.toUpperCase() : isFuture ? 'FUTURE' : 'NO RECORD'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-end mt-4 text-[8px] font-medium uppercase tracking-widest text-neutral-500 border-t border-[#2a2a2a] pt-4">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[var(--accent)] rounded border border-[var(--accent-soft)]" /> Completed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-neutral-500 rounded border border-neutral-500/10" /> Skipped</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500/30 rounded border border-red-500/30" /> Missed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#1a1a1a] rounded border border-[#2a2a2a]" /> No Entry</span>
              </div>
            </CardContent>
          </Card>
        );
      })()}
      
      <div className="space-y-6">
         <h3 className="text-sm font-medium uppercase tracking-widest text-neutral-500">Recent Logs</h3>
         {isLoading ? (
           <p className="text-neutral-400 italic">Loading history...</p>
         ) : logs.length === 0 ? (
           <Card className="p-8 text-center text-neutral-500 italic">
             No activity recorded yet.
           </Card>
         ) : (
           <div className="space-y-4">
             {logs.slice(0, 10).map((log) => (
               <div key={log.id} className="flex items-center gap-4 p-5 border border-[#2a2a2a] rounded-xl bg-[#141414]">
                 <div className={cn(
                   "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                   log.status === 'completed' ? "bg-[var(--accent-soft)] text-[var(--accent-lighter)]" :
                   log.status === 'skipped' ? "bg-neutral-500/10 text-neutral-400" :
                   "bg-red-500/10 text-red-400"
                 )}>
                   {log.status === 'completed' ? <CheckCircle2 size={22} strokeWidth={1.5} /> : <XCircle size={22} strokeWidth={1.5} />}
                 </div>
                 <div>
                   <p className="font-medium text-white capitalize text-lg">{log.status}</p>
                   {log.note && <p className="text-sm text-neutral-400 mt-1">{log.note}</p>}
                 </div>
                 <div className="ml-auto text-xs font-medium text-neutral-500 uppercase tracking-widest">
                   {formatShortDate(parseISO(log.date))}
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75"
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
              className="absolute inset-0 bg-black/75"
              onClick={() => setIsDeleteConfirmOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#141414] rounded-2xl border border-[#2a2a2a] p-8"
            >
              <div className="flex items-center gap-4 mb-6 text-red-400">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-white">Delete Habit?</h3>
              </div>
              <p className="text-neutral-400 mb-8 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white">"{habit.name}"</span>? This action cannot be undone and all your progress history will be lost.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                <Button 
                  variant="destructive"
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
