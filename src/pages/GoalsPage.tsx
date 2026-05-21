// =============================================
// PEAK — Goals Page
// =============================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Flag, Plus, Minus, CheckCircle2, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGoalStore } from '@/store/goalStore';

export function GoalsPage() {
  const { goals, fetchGoals, addGoal, updateGoal, deleteGoal, isLoading } = useGoalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    await addGoal({
      title: newGoalTitle,
      description: '',
      category: 'General',
      targetDate: '',
      milestones: [],
      progress: 0,
      status: 'active'
    });
    setNewGoalTitle('');
    setIsModalOpen(false);
  };

  const handleAdjustProgress = async (id: string, current: number, delta: number) => {
    const next = Math.max(0, Math.min(100, current + delta));
    await updateGoal(id, { progress: next });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">Goals</h1>
          <p className="text-[var(--color-text-secondary)]">Set long-term objectives and track milestones.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Target size={16} /> New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full hover:border-[var(--color-accent)]/50 transition-all group shadow-sm hover:shadow-md">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                    {goal.category}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">{goal.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] mb-6">
                  <Flag size={12} /> {goal.targetDate ? `Target: ${goal.targetDate}` : 'No target date'}
                </div>
                
                <div className="mt-auto space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-[var(--color-text-secondary)]">Progress</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent)]/80 rounded-full shadow-[0_0_8px_var(--color-accent)]/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 py-2 border-t border-[var(--color-border)] pt-4">
                    <button 
                      onClick={() => handleAdjustProgress(goal.id, goal.progress, -5)}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <div className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Adjust</div>
                    <button 
                      onClick={() => handleAdjustProgress(goal.id, goal.progress, 5)}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {goals.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-secondary)]/30">
            <div className="w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-text-tertiary)]">
              <Target size={32} />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No goals found</h3>
            <p className="text-[var(--color-text-secondary)] mt-1">What's your next big achievement?</p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-6" variant="outline">
              Create First Goal
            </Button>
          </div>
        )}
      </div>

      {/* Goal Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md bg-[var(--color-bg-secondary)] rounded-3xl p-8 border border-[var(--color-border)] shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
                  <Target size={20} />
                </div>
                <h2 className="text-2xl font-bold">New Goal</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2 block">Goal Title</label>
                  <Input 
                    value={newGoalTitle} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoalTitle(e.target.value)}
                    placeholder="e.g. Run a Marathon"
                    className="h-12 text-lg bg-[var(--color-bg-tertiary)] border-none rounded-xl"
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddGoal} className="px-8 rounded-xl h-12">Create Goal</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
