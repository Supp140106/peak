import React from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, Clock } from 'lucide-react';
import type { HabitWithStats } from '@/types';
import { cn } from '@/utils/cn';

interface HabitCardProps {
  habit: HabitWithStats;
  onToggle: (id: string) => void;
  onClick: (id: string) => void;
}

export function HabitCard({ habit, onToggle, onClick }: HabitCardProps) {
  const isCompleted = habit.todayStatus === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative flex items-center p-4 rounded-2xl border bg-[#141414] transition-colors duration-200 cursor-pointer overflow-hidden",
        isCompleted 
          ? "border-[var(--accent-border)]" 
          : "border-[#2a2a2a] hover:border-[#2a2a2a]"
      )}
      onClick={() => onClick(habit.id)}
    >
      {isCompleted && (
        <motion.div 
          layoutId={`fill-${habit.id}`}
          className="absolute inset-0 bg-[var(--accent-soft)] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(habit.id);
        }}
        className={cn(
          "relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-200 mr-4",
          isCompleted
            ? "bg-[var(--accent)] border-[var(--accent)] text-black"
            : "border-[#2a2a2a] text-transparent group-hover:border-[var(--accent)]"
        )}
      >
        <Check size={16} strokeWidth={isCompleted ? 3 : 2} />
      </button>

      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl" style={{ color: habit.color }}>{habit.icon}</span>
          <div className="truncate">
            <h4 className={cn(
              "font-medium truncate transition-colors duration-200",
              isCompleted ? "text-neutral-400 line-through" : "text-white"
            )}>
              {habit.name}
            </h4>
            <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
              <Clock size={12} strokeWidth={1.5} />
              {habit.frequency} • {habit.estimatedDuration}m
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4 z-10">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-[var(--accent)] font-medium">
            <Flame size={14} strokeWidth={1.5} className={habit.currentStreak > 0 ? "fill-current" : ""} />
            <span>{habit.currentStreak}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">Streak</span>
        </div>
      </div>
    </motion.div>
  );
}
