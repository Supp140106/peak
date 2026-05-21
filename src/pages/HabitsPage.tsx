import React, { useState } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { EmptyState } from '@/components/common/EmptyState';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitForm } from '@/components/habits/HabitForm';
import { CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatePresence, motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

export function HabitsPage() {
  const { activeHabits, toggleCompletion, createHabit } = useHabitStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const active = activeHabits.filter(h => !h.isPaused && !h.isArchived);

  const handleCreate = async (data: any) => {
    await createHabit({
      ...data,
      isArchived: false,
      isPaused: false,
      tags: [],
    });
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">Your Habits</h1>
          <p className="text-[var(--color-text-secondary)]">Manage and track your daily routines.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          Create Habit
        </Button>
      </div>

      <div className="flex-1">
        {active.length === 0 ? (
          <EmptyState 
            icon={CheckSquare}
            title="No habits yet"
            description="Start building a better you by creating your first habit. Small daily actions lead to massive results."
            action={<Button onClick={() => setIsModalOpen(true)}>Create your first habit</Button>}
          />
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
          >
            <AnimatePresence>
              {active.map(habit => (
                <HabitCard 
                  key={habit.id} 
                  habit={habit} 
                  onToggle={toggleCompletion}
                  onClick={(id) => navigate(`/habits/${id}`)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-2xl">
              <HabitForm 
                onSubmit={handleCreate} 
                onCancel={() => setIsModalOpen(false)} 
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
