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
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex items-center p-4 rounded-[var(--radius-lg)] border bg-[var(--color-bg-secondary)] transition-all duration-300 cursor-pointer overflow-hidden",
        isCompleted 
          ? "border-[var(--color-success)]/30 shadow-sm" 
          : "border-[var(--color-border)] hover:border-[var(--color-border-focus)] hover:shadow-md"
      )}
      onClick={() => onClick(habit.id)}
    >
      {/* Background fill animation on complete */}
      {isCompleted && (
        <motion.div 
          layoutId={`fill-${habit.id}`}
          className="absolute inset-0 bg-[var(--color-success-light)]/20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Completion Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(habit.id);
        }}
        className={cn(
          "relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 mr-4",
          isCompleted
            ? "bg-[var(--color-success)] border-[var(--color-success)] text-white"
            : "border-[var(--color-border)] text-transparent group-hover:border-[var(--color-accent)]"
        )}
      >
        <Check size={16} strokeWidth={isCompleted ? 3 : 2} />
      </button>

      {/* Icon & Details */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl" style={{ color: habit.color }}>{habit.icon}</span>
          <div className="truncate">
            <h4 className={cn(
              "font-medium truncate transition-colors",
              isCompleted ? "text-[var(--color-text-secondary)] line-through" : "text-[var(--color-text-primary)]"
            )}>
              {habit.name}
            </h4>
            <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5 mt-0.5">
              <Clock size={12} />
              {habit.frequency} • {habit.estimatedDuration}m
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 ml-4 z-10">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-[var(--color-accent)] font-medium">
            <Flame size={14} className={habit.currentStreak > 0 ? "fill-current" : ""} />
            <span>{habit.currentStreak}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Streak</span>
        </div>
      </div>
    </motion.div>
  );
}
