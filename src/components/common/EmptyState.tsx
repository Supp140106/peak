// =============================================
// PEAK — Empty State Component
// =============================================

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]", className)}
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center mb-6 shadow-sm">
        <Icon size={32} className="text-[var(--color-text-tertiary)]" />
      </div>
      <h3 className="text-xl font-medium mb-2 text-[var(--color-text-primary)]">{title}</h3>
      <p className="text-[var(--color-text-secondary)] max-w-sm mb-8">{description}</p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
