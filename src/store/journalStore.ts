// =============================================
// PEAK — Journal Zustand Store
// =============================================

import { create } from 'zustand';
import { getDatabase } from '@/database/connection';
import type { JournalEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  
  fetchEntries: () => Promise<void>;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchEntries: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      const results = await db.select<JournalEntry[]>('SELECT * FROM journal_entries ORDER BY date DESC');
      set({ entries: results, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      set({ error: 'Failed to load journal', isLoading: false });
    }
  },

  addEntry: async (entry) => {
    try {
      const db = await getDatabase();
      const id = uuidv4();
      const now = new Date().toISOString();
      
      await db.execute(
        `INSERT INTO journal_entries (id, date, content, mood, type, tags, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, entry.date, entry.content, entry.mood, entry.type, JSON.stringify(entry.tags), now, now]
      );
      
      await get().fetchEntries();
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      set({ error: 'Failed to save entry' });
    }
  },

  updateEntry: async (id, updates) => {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      
      let query = 'UPDATE journal_entries SET updated_at = $1';
      const params: any[] = [now];
      let i = 2;

      if (updates.content !== undefined) {
        query += `, content = $${i++}`;
        params.push(updates.content);
      }
      if (updates.mood !== undefined) {
        query += `, mood = $${i++}`;
        params.push(updates.mood);
      }
      if (updates.tags !== undefined) {
        query += `, tags = $${i++}`;
        params.push(JSON.stringify(updates.tags));
      }

      query += ` WHERE id = $${i}`;
      params.push(id);

      await db.execute(query, params);
      await get().fetchEntries();
    } catch (error) {
      console.error('Failed to update journal entry:', error);
    }
  },

  deleteEntry: async (id) => {
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM journal_entries WHERE id = $1', [id]);
      await get().fetchEntries();
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    }
  }
}));
