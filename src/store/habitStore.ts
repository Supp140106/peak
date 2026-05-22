// =============================================
// PEAK — Habit Zustand Store
// =============================================

import { create } from 'zustand';
import type { Habit, HabitLog, HabitWithStats } from '@/types';
import * as habitDb from '@/database/habits';
import { todayISO } from '@/utils/dates';

interface HabitState {
  habits: Habit[];
  activeHabits: HabitWithStats[];
  archivedHabits: Habit[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchHabits: () => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (id: string, date?: string) => Promise<void>;
  skipHabit: (id: string, date?: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  activeHabits: [],
  archivedHabits: [],
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const active = await habitDb.getAllHabits();
      const archived = await habitDb.getArchivedHabits();
      
      // Enrich active habits with streak & completion data
      const enrichedActive: HabitWithStats[] = await Promise.all(
        active.map(async (habit) => {
          const streak = await habitDb.getStreak(habit.id);
          const todayLog = await habitDb.getLogForHabitOnDate(habit.id, todayISO());
          const totalCompletions = await habitDb.getTotalCompletions(habit.id);
          
          return {
            ...habit,
            currentStreak: streak?.currentStreak || 0,
            longestStreak: streak?.longestStreak || 0,
            todayStatus: todayLog ? todayLog.status : null,
            completionRate: 0, // Calculate this properly based on created_at and frequency
            totalCompletions
          };
        })
      );

      set({ 
        habits: [...active, ...archived], 
        activeHabits: enrichedActive, 
        archivedHabits: archived,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch habits:', error);
      set({ error: 'Failed to load habits', isLoading: false });
    }
  },

  createHabit: async (habit) => {
    try {
      await habitDb.createHabit(habit);
      await get().fetchHabits();
    } catch (error) {
      console.error('Failed to create habit:', error);
      set({ error: 'Failed to create habit' });
    }
  },

  updateHabit: async (id, updates) => {
    try {
      await habitDb.updateHabit(id, updates);
      await get().fetchHabits();
    } catch (error) {
      console.error('Failed to update habit:', error);
      set({ error: 'Failed to update habit' });
    }
  },

  deleteHabit: async (id) => {
    try {
      await habitDb.deleteHabit(id);
      await get().fetchHabits();
    } catch (error) {
      console.error('Failed to delete habit:', error);
      set({ error: 'Failed to delete habit' });
    }
  },

  toggleCompletion: async (id, date) => {
    try {
      await habitDb.toggleHabitCompletion(id, date);
      
      // Recalculate streak after toggling
      const { recalculateHabitStreak } = await import('@/database/streaks');
      await recalculateHabitStreak(id);
      
      // Grant XP if completed
      const log = await habitDb.getLogForHabitOnDate(id, date || todayISO());
      if (log && log.status === 'completed') {
        const { useGamificationStore } = await import('@/store/gamificationStore');
        useGamificationStore.getState().addXp(50);
      }
      
      await get().fetchHabits();
    } catch (error) {
      console.error('Failed to toggle habit:', error);
      set({ error: 'Failed to toggle completion' });
    }
  },

  skipHabit: async (id, date) => {
    try {
      await habitDb.skipHabit(id, date);
      await get().fetchHabits();
    } catch (error) {
      console.error('Failed to skip habit:', error);
      set({ error: 'Failed to skip habit' });
    }
  }
}));
