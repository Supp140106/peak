import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Habit } from '@/types';

import { cn } from '@/utils/cn';

const schema = yup.object({
  name: yup.string().required('Name is required').max(50),
  description: yup.string().max(200).default(''),
  icon: yup.string().required().default('✦'),
  color: yup.string().required().default('#f59e0b'),
  frequency: yup.string().oneOf(['daily', 'weekly', 'monthly', 'custom']).required(),
  priority: yup.string().oneOf(['low', 'medium', 'high']).required(),
  difficulty: yup.string().oneOf(['easy', 'medium', 'hard']).required(),
  category: yup.string().required(),
  estimatedDuration: yup.number().min(1).max(1440).required(),
});

type FormData = yup.InferType<typeof schema>;

interface HabitFormProps {
  initialData?: Partial<Habit>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const PRESET_COLORS = ['#f59e0b', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];
const PRESET_ICONS = ['✦', '🏃', '📚', '🧘', '🧠', '💧', '🥗', '💻', '🎨', '📝'];

export function HabitForm({ initialData, onSubmit, onCancel }: HabitFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      icon: initialData?.icon || '✦',
      color: initialData?.color || '#f59e0b',
      frequency: (initialData?.frequency as any) || 'daily',
      priority: (initialData?.priority as any) || 'medium',
      difficulty: (initialData?.difficulty as any) || 'medium',
      category: initialData?.category || 'General',
      estimatedDuration: initialData?.estimatedDuration || 15,
    }
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#141414] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col max-h-[90vh]"
    >
      <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
        <h2 className="text-xl font-medium text-white">{initialData ? 'Edit Habit' : 'New Habit'}</h2>
        <button onClick={onCancel} className="text-neutral-400 hover:text-white transition-colors duration-200">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <form id="habit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-400">Name</label>
              <Input {...register('name')} placeholder="e.g. Read 20 pages" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-400">Description</label>
              <Textarea {...register('description')} placeholder="Why are you building this habit?" className="min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-400">Icon & Color</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_ICONS.map(i => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => setValue('icon', i)}
                      className={cn("w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-colors duration-200", selectedIcon === i ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[#2a2a2a] hover:bg-[#1a1a1a]")}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {PRESET_COLORS.map(c => (
                    <button 
                      key={c} 
                      type="button"
                      onClick={() => setValue('color', c)}
                      className={cn("w-6 h-6 rounded-full ring-offset-2 ring-offset-[#141414] transition-all duration-200", selectedColor === c ? "ring-2 ring-[var(--accent)] scale-110" : "hover:scale-110")}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-neutral-400">Frequency</label>
                  <select {...register('frequency')} className="w-full h-10 rounded-xl border border-[#2a2a2a] bg-[#141414] px-3 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors duration-200">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-neutral-400">Duration (m)</label>
                    <Input type="number" {...register('estimatedDuration')} min="1" max="1440" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-neutral-400">Difficulty</label>
                    <select {...register('difficulty')} className="w-full h-10 rounded-xl border border-[#2a2a2a] bg-[#141414] px-3 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors duration-200">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="p-6 border-t border-[#2a2a2a] bg-[#1a1a1a] flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" form="habit-form">Save Habit</Button>
      </div>
    </motion.div>
  );
}
