import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { format, startOfYear, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

interface FocusHeatmapProps {
  data: Record<string, number>; // date string -> minutes
  view: 'yearly' | 'monthly';
  year?: number;
  month?: number; // 0-11
  onDayClick?: (date: string) => void; // optional click handler
}

export function FocusHeatmap({ data, view, year = new Date().getFullYear(), month = new Date().getMonth(), onDayClick }: FocusHeatmapProps) {
  const days = useMemo(() => {
    if (view === 'yearly') {
      const start = startOfYear(new Date(year, 0, 1));
      const end = endOfYear(new Date(year, 0, 1));
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(new Date(year, month, 1));
      const end = endOfMonth(new Date(year, month, 1));
      return eachDayOfInterval({ start, end });
    }
  }, [view, year, month]);

  const getLevelColor = (minutes: number) => {
    if (minutes === 0) return 'bg-[var(--color-bg-tertiary)] opacity-30';
    if (minutes <= 25) return 'bg-[var(--color-accent)] opacity-30';
    if (minutes <= 60) return 'bg-[var(--color-accent)] opacity-50';
    if (minutes <= 120) return 'bg-[var(--color-accent)] opacity-70';
    if (minutes <= 240) return 'bg-[var(--color-accent)] opacity-90';
    return 'bg-[var(--color-accent)]';
  };

  // Group days by week for GitHub style (columns = weeks)
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Fill leading empty days for the first week
  const firstDay = days[0];
  const leadingDays = firstDay.getDay(); // 0 is Sunday
  const startDayAdjusted = (leadingDays === 0 ? 6 : leadingDays - 1);
  
  for (let i = 0; i < startDayAdjusted; i++) {
    currentWeek.push(null as any);
  }

  days.forEach((day) => {
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

  const monthLabels = useMemo(() => {
    const labels: { label: string, colIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
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
  }, [weeks]);

  return (
    <div className="flex flex-col">
      {view === 'yearly' && (
        <div className="flex text-[9px] text-[var(--color-text-tertiary)] mb-1.5 relative h-3 uppercase font-bold tracking-tighter">
          {monthLabels.map((m, i) => (
            <div 
              key={i} 
              className="absolute" 
              style={{ left: `${(m.colIndex / weeks.length) * 100}%` }}
            >
              {m.label}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mt-1 pr-1 text-[8px] font-bold text-[var(--color-text-tertiary)] uppercase select-none">
          <div className="h-2.5 w-3"></div>
          <div className="h-2.5 w-3 text-center">Mon</div>
          <div className="h-2.5 w-3"></div>
          <div className="h-2.5 w-3 text-center">Wed</div>
          <div className="h-2.5 w-3"></div>
          <div className="h-2.5 w-3 text-center">Fri</div>
          <div className="h-2.5 w-3"></div>
        </div>

        <div className="flex gap-[3px] overflow-x-auto pb-2 scrollbar-hide">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {week.map((day, dayIdx) => {
                if (!day) return <div key={dayIdx} className="w-[10px] h-[10px] rounded-[1px]" />;
                
                const dateStr = format(day, 'yyyy-MM-dd');
                const minutes = data[dateStr] || 0;
                const handleClick = () => {
                  if (onDayClick) onDayClick(dateStr);
                };
                
                return (
                  <motion.div
                    key={dayIdx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (weekIdx * 7 + dayIdx) * 0.0005 }}
                    className={cn(
                      "w-[10px] h-[10px] rounded-[1px] transition-all duration-300 relative group cursor-help",
                      getLevelColor(minutes)
                    )}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[9px] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl font-bold">
                      {format(day, 'MMM d')}: {minutes}m
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[8px] font-bold uppercase tracking-tighter text-[var(--color-text-tertiary)]">
        <span>Less</span>
        {[0, 25, 60, 120, 240, 480].map((m, i) => (
          <div key={i} className={cn("w-[9px] h-[9px] rounded-[1px]", getLevelColor(m))} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
