// =============================================
// PEAK — Core Type Definitions
// =============================================

// === Habit Types ===

export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type HabitPriority = 'low' | 'medium' | 'high';
export type HabitDifficulty = 'easy' | 'medium' | 'hard';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type LogStatus = 'completed' | 'skipped' | 'missed';

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  schedule: string | null; // JSON string for custom schedules
  priority: HabitPriority;
  difficulty: HabitDifficulty;
  category: string;
  tags: string[]; // stored as JSON
  estimatedDuration: number; // minutes
  isArchived: boolean;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: LogStatus;
  note: string | null;
  completedAt: string | null;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  todayStatus: LogStatus | null;
  completionRate: number;
  totalCompletions: number;
}

// === Streak Types ===

export interface Streak {
  id: string;
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  freezeDaysUsed: number;
  lastCompletedDate: string | null;
}

export interface StreakMilestone {
  days: number;
  label: string;
  icon: string;
  reached: boolean;
}

// === Journal Types ===

export type JournalType = 'reflection' | 'gratitude' | 'note';
export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: MoodType | null;
  moodScore: number | null; // 1-5
  type: JournalType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// === Goal Types ===

export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string | null;
  milestones: GoalMilestone[];
  progress: number; // 0-100
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

// === Focus Types ===

export type FocusType = 'pomodoro' | 'stopwatch' | 'deepwork';

export interface FocusSession {
  id: string;
  type: FocusType;
  duration: number; // seconds
  startedAt: string;
  endedAt: string | null;
  habitId: string | null;
  notes: string | null;
}

// === Gamification Types ===

export interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string | null;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  currentLevelXp: number;
}

// === Settings Types ===

export type ThemeMode = 'light' | 'dark' | 'auto';
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

export interface AppSettings {
  theme: ThemeMode;
  accentColor: string;
  fontScale: number;
  layoutDensity: LayoutDensity;
  notificationsEnabled: boolean;
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
  // Welcome
  hasCompletedOnboarding: boolean;
  // User Profile
  userName: string;
  userAvatar: string | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  accentColor: '#D4896A',
  fontScale: 1,
  layoutDensity: 'comfortable',
  notificationsEnabled: true,
  reducedMotion: false,
  sidebarCollapsed: false,
  hasCompletedOnboarding: false,
  userName: 'User',
  userAvatar: null,
};

// === UI Types ===

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

// === Utility Types ===

export type DateString = string; // YYYY-MM-DD format

export interface DayData {
  date: DateString;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

// === Database Row Types (raw from SQLite) ===

export interface HabitRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency: string;
  schedule: string | null;
  priority: string;
  difficulty: string;
  category: string;
  tags: string;
  estimated_duration: number;
  is_archived: number;
  is_paused: number;
  created_at: string;
  updated_at: string;
}

export interface HabitLogRow {
  id: string;
  habit_id: string;
  date: string;
  status: string;
  note: string | null;
  completed_at: string | null;
}

export interface StreakRow {
  id: string;
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  freeze_days_used: number;
  last_completed_date: string | null;
}

export interface JournalEntryRow {
  id: string;
  date: string;
  content: string;
  mood: string | null;
  mood_score: number | null;
  type: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  milestones: string;
  progress: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FocusSessionRow {
  id: string;
  type: string;
  duration: number;
  started_at: string;
  ended_at: string | null;
  habit_id: string | null;
  notes: string | null;
}

export interface AchievementRow {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string | null;
}

export interface SettingsRow {
  key: string;
  value: string;
}
