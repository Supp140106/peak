import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDatabase } from '@/database/connection';
import { generateId, nowISO } from '@/utils/dates';

interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string;
}

interface GamificationState {
  xp: number;
  level: number;
  achievements: Achievement[];
  
  addXp: (amount: number) => Promise<void>;
  checkAchievements: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
}

const XP_PER_LEVEL = 1000;

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      achievements: [],

      addXp: async (amount) => {
        const { xp, level } = get();
        const newXp = xp + amount;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
        
        set({ xp: newXp, level: newLevel });
        
        if (newLevel > level) {
          // Level up logic (maybe a notification)
        }
        
        await get().checkAchievements();
      },

      fetchAchievements: async () => {
        try {
          const db = await getDatabase();
          const rows = await db.select<any[]>('SELECT * FROM achievements');
          set({ achievements: rows });
        } catch (error) {
          console.error('Failed to fetch achievements:', error);
        }
      },

      checkAchievements: async () => {
        // Logic to check and unlock achievements based on XP, streaks, etc.
        // For now, let's just implement a simple one for first XP
        const { xp, achievements } = get();
        
        if (xp > 0 && !achievements.find(a => a.type === 'first_xp')) {
          await unlockAchievement({
            type: 'first_xp',
            name: 'The Journey Begins',
            description: 'Earned your first XP in Peak.',
            icon: '🚀',
            xpReward: 50
          });
        }
      },
    }),
    {
      name: 'peak-gamification-storage',
    }
  )
);

async function unlockAchievement(achievement: Omit<Achievement, 'id' | 'unlockedAt'>) {
  try {
    const db = await getDatabase();
    const id = generateId();
    const unlockedAt = nowISO();
    
    await db.execute(
      'INSERT INTO achievements (id, type, name, description, icon, xp_reward, unlocked_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, achievement.type, achievement.name, achievement.description, achievement.icon, achievement.xpReward, unlockedAt]
    );
    
    useGamificationStore.getState().fetchAchievements();
  } catch (error) {
    console.error('Failed to unlock achievement:', error);
  }
}
