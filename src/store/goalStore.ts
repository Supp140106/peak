// =============================================
// PEAK — Goals Zustand Store
// =============================================

import { create } from 'zustand';
import { getDatabase } from '@/database/connection';
import type { Goal } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      const results = await db.select<Goal[]>('SELECT * FROM goals ORDER BY created_at DESC');
      set({ goals: results, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      set({ error: 'Failed to load goals', isLoading: false });
    }
  },

  addGoal: async (goal) => {
    try {
      const db = await getDatabase();
      const id = uuidv4();
      const now = new Date().toISOString();
      
      await db.execute(
        `INSERT INTO goals (id, title, description, category, target_date, milestones, progress, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, goal.title, goal.description, goal.category, goal.targetDate, JSON.stringify(goal.milestones), goal.progress, goal.status, now, now]
      );
      
      await get().fetchGoals();
    } catch (error) {
      console.error('Failed to add goal:', error);
      set({ error: 'Failed to save goal' });
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      
      let query = 'UPDATE goals SET updated_at = $1';
      const params: any[] = [now];
      let i = 2;

      if (updates.title !== undefined) {
        query += `, title = $${i++}`;
        params.push(updates.title);
      }
      if (updates.progress !== undefined) {
        query += `, progress = $${i++}`;
        params.push(updates.progress);
      }
      if (updates.status !== undefined) {
        query += `, status = $${i++}`;
        params.push(updates.status);
      }
      if (updates.milestones !== undefined) {
        query += `, milestones = $${i++}`;
        params.push(JSON.stringify(updates.milestones));
      }

      query += ` WHERE id = $${i}`;
      params.push(id);

      await db.execute(query, params);
      await get().fetchGoals();
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  },

  deleteGoal: async (id) => {
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM goals WHERE id = $1', [id]);
      await get().fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  }
}));
