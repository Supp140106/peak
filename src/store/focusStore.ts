import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId, nowISO } from '@/utils/dates';
import { getDatabase } from '@/database/connection';
import * as focusDb from '@/database/focus';
import type { FocusSession } from '@/types';

interface FocusState {
  mode: 'focus' | 'shortBreak' | 'longBreak';
  timeLeft: number;
  isActive: boolean;
  sessionCount: number;
  currentSessionId: string | null;
  lastTickAt: number | null; // Timestamp
  totalSessionDuration: number;
  
  // Reactive Stats
  recentSessions: FocusSession[];
  todayFocusTime: number;
  totalFocusTime: number;
  dailyData: Record<string, number>;
  focusStreak: { currentStreak: number; longestStreak: number };
  
  setMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => void;
  setTimeLeft: (time: number) => void;
  setIsActive: (active: boolean) => void;
  incrementSessionCount: () => void;
  
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  clearTimer: () => Promise<void>;
  tick: () => void;
  syncTime: () => void; // Call this on mount to fix drift/background time
  loadStats: () => Promise<void>;
}

const MODES = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      mode: 'focus',
      timeLeft: 25 * 60,
      isActive: false,
      sessionCount: 0,
      currentSessionId: null,
      lastTickAt: null,
      totalSessionDuration: 25 * 60,

      // Stats default state
      recentSessions: [],
      todayFocusTime: 0,
      totalFocusTime: 0,
      dailyData: {},
      focusStreak: { currentStreak: 0, longestStreak: 0 },

      setMode: (mode) => set({ 
        mode, 
        timeLeft: MODES[mode], 
        isActive: false,
        lastTickAt: null,
        totalSessionDuration: MODES[mode]
      }),
      
      setTimeLeft: (timeLeft) => {
        const { currentSessionId } = get();
        if (currentSessionId) {
          set({ timeLeft });
        } else {
          set({ timeLeft, totalSessionDuration: timeLeft });
        }
      },
      
      setIsActive: (isActive) => set({ 
        isActive, 
        lastTickAt: isActive ? Date.now() : null 
      }),
      
      incrementSessionCount: () => set((state) => ({ sessionCount: state.sessionCount + 1 })),

      loadStats: async () => {
        try {
          const [counts, today, total, sessions, streak] = await Promise.all([
            focusDb.getDailyFocusMinutes(365),
            focusDb.getTodayFocusTime(),
            focusDb.getTotalFocusTime(),
            focusDb.getAllFocusSessions(5),
            focusDb.getFocusStreak()
          ]);
          set({
            dailyData: counts,
            todayFocusTime: today,
            totalFocusTime: total,
            recentSessions: sessions,
            focusStreak: streak
          });
        } catch (error) {
          console.error('Failed to load focus stats:', error);
        }
      },

      syncTime: () => {
        const { isActive, lastTickAt, timeLeft } = get();
        if (!isActive || !lastTickAt) return;

        const now = Date.now();
        const elapsed = Math.floor((now - lastTickAt) / 1000);
        
        if (elapsed > 0) {
          const newTimeLeft = Math.max(0, timeLeft - elapsed);
          set({ timeLeft: newTimeLeft, lastTickAt: now });
          
          if (newTimeLeft === 0) {
            get().tick(); // Trigger completion logic
          }
        }
      },

      tick: () => {
        const { timeLeft, isActive, mode, sessionCount, lastTickAt } = get();
        if (!isActive) return;

        const now = Date.now();
        const elapsed = lastTickAt ? Math.floor((now - lastTickAt) / 1000) : 1;

        if (elapsed >= 1) {
          const newTimeLeft = Math.max(0, timeLeft - elapsed);
          const nextTickTime = lastTickAt ? lastTickAt + (elapsed * 1000) : now;
          set({ timeLeft: newTimeLeft, lastTickAt: nextTickTime });

          if (newTimeLeft === 0) {
            // Session complete
            set({ isActive: false, lastTickAt: null });
            get().endSession();
            
            if (mode === 'focus') {
              const nextCount = sessionCount + 1;
              set({ sessionCount: nextCount });
              if (nextCount % 4 === 0) {
                get().setMode('longBreak');
              } else {
                get().setMode('shortBreak');
              }
            } else {
              get().setMode('focus');
            }
          }
        }
      },

      startSession: async () => {
        const { mode, isActive, currentSessionId, timeLeft } = get();
        if (isActive) return;

        if (currentSessionId) {
          // Resume existing paused session
          set({ isActive: true, lastTickAt: Date.now() });
          return;
        }

        // Start new session
        const id = generateId();
        const startTime = nowISO();
        
        try {
          const db = await getDatabase();
          await db.execute(
            'INSERT INTO focus_sessions (id, type, duration, started_at) VALUES ($1, $2, $3, $4)',
            [id, mode, timeLeft, startTime]
          );
          
          set({ 
            isActive: true, 
            currentSessionId: id, 
            totalSessionDuration: timeLeft, 
            lastTickAt: Date.now() 
          });

          await get().loadStats();
        } catch (error) {
          console.error('Failed to start new session:', error);
        }
      },

      endSession: async () => {
        const { currentSessionId, totalSessionDuration, timeLeft, mode } = get();
        if (!currentSessionId) return;

        const endTime = nowISO();
        const actualDuration = totalSessionDuration - timeLeft;
        
        try {
          const db = await getDatabase();
          
          if (actualDuration < 10) {
            // Delete if too short
            await db.execute('DELETE FROM focus_sessions WHERE id = $1', [currentSessionId]);
          } else {
            // Save actual duration and ended time
            await db.execute(
              'UPDATE focus_sessions SET ended_at = $1, duration = $2 WHERE id = $3',
              [endTime, actualDuration, currentSessionId]
            );

            // Award proportional XP
            if (mode === 'focus') {
              const xpGained = Math.min(100, Math.round((actualDuration / totalSessionDuration) * 100));
              if (xpGained > 0) {
                const { useGamificationStore } = await import('@/store/gamificationStore');
                useGamificationStore.getState().addXp(xpGained);
              }
            }
          }
        } catch (error) {
          console.error('Failed to end session:', error);
        }

        // Reset timer state back to mode's default
        set({ 
          currentSessionId: null, 
          isActive: false, 
          lastTickAt: null,
          timeLeft: MODES[mode],
          totalSessionDuration: MODES[mode]
        });

        // Trigger reactive stats update
        await get().loadStats();
      },

      clearTimer: async () => {
        const { mode } = get();
        set({
          currentSessionId: null,
          isActive: false,
          lastTickAt: null,
          timeLeft: MODES[mode],
          totalSessionDuration: MODES[mode]
        });
        await get().loadStats();
      },
    }),
    {
      name: 'peak-focus-storage',
      partialize: (state) => ({ 
        mode: state.mode, 
        timeLeft: state.timeLeft, 
        sessionCount: state.sessionCount,
        currentSessionId: state.currentSessionId,
        lastTickAt: state.lastTickAt,
        isActive: state.isActive,
        totalSessionDuration: state.totalSessionDuration
      }),
    }
  )
);
