import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Flag, Plus, Minus, CheckCircle2, Trash2 } from 'lucide-react';
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
          <h1 className="text-[clamp(28px,4vw,44px)] font-medium tracking-tight text-white mb-1">Goals</h1>
          <p className="text-neutral-400">Set long-term objectives and track milestones.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Target size={16} strokeWidth={1.5} /> New Goal
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
            <Card className="h-full hover:border-[var(--accent-border)] transition-colors duration-200">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest bg-[#1a1a1a] text-neutral-400 border border-[#2a2a2a]">
                    {goal.category}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      className="text-neutral-500 hover:text-red-400 transition-colors duration-200"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-medium mb-1 text-white">{goal.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-6">
                  <Flag size={12} strokeWidth={1.5} /> {goal.targetDate ? `Target: ${goal.targetDate}` : 'No target date'}
                </div>
                
                <div className="mt-auto space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-neutral-400">Progress</span>
                      <span className="font-medium text-white">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-[var(--accent)] rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 py-2 border-t border-[#2a2a2a] pt-4">
                    <button 
                      onClick={() => handleAdjustProgress(goal.id, goal.progress, -5)}
                      className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-neutral-400 transition-colors duration-200"
                    >
                      <Minus size={18} strokeWidth={1.5} />
                    </button>
                    <div className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Adjust</div>
                    <button 
                      onClick={() => handleAdjustProgress(goal.id, goal.progress, 5)}
                      className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-neutral-400 transition-colors duration-200"
                    >
                      <Plus size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {goals.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-[#2a2a2a] rounded-2xl bg-[#141414]/30">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-500">
              <Target size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-medium text-white">No goals found</h3>
            <p className="text-neutral-400 mt-1">What's your next big achievement?</p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-6" variant="outline">
              Create First Goal
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md bg-[#141414] rounded-2xl border border-[#2a2a2a] p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-lighter)]">
                  <Target size={20} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-medium text-white">New Goal</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2 block">Goal Title</label>
                  <Input 
                    value={newGoalTitle} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoalTitle(e.target.value)}
                    placeholder="e.g. Run a Marathon"
                    className="h-12 text-lg bg-[#1a1a1a] border-none rounded-xl"
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
