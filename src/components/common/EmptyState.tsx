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
      <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mb-6">
        <Icon size={32} strokeWidth={1.5} className="text-neutral-500" />
      </div>
      <h3 className="text-xl font-medium mb-2 text-white">{title}</h3>
      <p className="text-neutral-400 max-w-sm mb-8">{description}</p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
