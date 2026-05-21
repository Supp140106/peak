// =============================================
// PEAK — Habit Database Operations
// =============================================

import { format, subDays } from 'date-fns';
import { getDatabase } from './connection';
import type { Habit, HabitRow, HabitLog, HabitLogRow, Streak, StreakRow } from '@/types';
import { generateId, nowISO, todayISO } from '@/utils/dates';

// === Row → Model Mappers ===

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency as Habit['frequency'],
    schedule: row.schedule,
    priority: row.priority as Habit['priority'],
    difficulty: row.difficulty as Habit['difficulty'],
    category: row.category,
    tags: JSON.parse(row.tags || '[]'),
    estimatedDuration: row.estimated_duration,
    isArchived: row.is_archived === 1,
    isPaused: row.is_paused === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    status: row.status as HabitLog['status'],
    note: row.note,
    completedAt: row.completed_at,
  };
}

function rowToStreak(row: StreakRow): Streak {
  return {
    id: row.id,
    habitId: row.habit_id,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    freezeDaysUsed: row.freeze_days_used,
    lastCompletedDate: row.last_completed_date,
  };
}

// === Habit CRUD ===

export async function getAllHabits(): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.select<HabitRow[]>(
    'SELECT * FROM habits WHERE is_archived = 0 ORDER BY created_at DESC'
  );
  return rows.map(rowToHabit);
}

export async function getArchivedHabits(): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.select<HabitRow[]>(
    'SELECT * FROM habits WHERE is_archived = 1 ORDER BY updated_at DESC'
  );
  return rows.map(rowToHabit);
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const db = await getDatabase();
  const rows = await db.select<HabitRow[]>('SELECT * FROM habits WHERE id = $1', [id]);
  return rows.length > 0 ? rowToHabit(rows[0]) : null;
}

export async function createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.execute(
    `INSERT INTO habits (id, name, description, icon, color, frequency, schedule, priority, difficulty, category, tags, estimated_duration, is_archived, is_paused, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [id, habit.name, habit.description, habit.icon, habit.color, habit.frequency, habit.schedule, habit.priority, habit.difficulty, habit.category, JSON.stringify(habit.tags), habit.estimatedDuration, habit.isArchived ? 1 : 0, habit.isPaused ? 1 : 0, now, now]
  );

  // Create streak record
  await db.execute(
    'INSERT INTO streaks (id, habit_id, current_streak, longest_streak, freeze_days_used, last_completed_date) VALUES ($1, $2, 0, 0, 0, NULL)',
    [generateId(), id]
  );

  return { ...habit, id, createdAt: now, updatedAt: now };
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(updates.description); }
  if (updates.icon !== undefined) { fields.push(`icon = $${paramIndex++}`); values.push(updates.icon); }
  if (updates.color !== undefined) { fields.push(`color = $${paramIndex++}`); values.push(updates.color); }
  if (updates.frequency !== undefined) { fields.push(`frequency = $${paramIndex++}`); values.push(updates.frequency); }
  if (updates.schedule !== undefined) { fields.push(`schedule = $${paramIndex++}`); values.push(updates.schedule); }
  if (updates.priority !== undefined) { fields.push(`priority = $${paramIndex++}`); values.push(updates.priority); }
  if (updates.difficulty !== undefined) { fields.push(`difficulty = $${paramIndex++}`); values.push(updates.difficulty); }
  if (updates.category !== undefined) { fields.push(`category = $${paramIndex++}`); values.push(updates.category); }
  if (updates.tags !== undefined) { fields.push(`tags = $${paramIndex++}`); values.push(JSON.stringify(updates.tags)); }
  if (updates.estimatedDuration !== undefined) { fields.push(`estimated_duration = $${paramIndex++}`); values.push(updates.estimatedDuration); }
  if (updates.isArchived !== undefined) { fields.push(`is_archived = $${paramIndex++}`); values.push(updates.isArchived ? 1 : 0); }
  if (updates.isPaused !== undefined) { fields.push(`is_paused = $${paramIndex++}`); values.push(updates.isPaused ? 1 : 0); }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(now);
  values.push(id);

  await db.execute(
    `UPDATE habits SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM streaks WHERE habit_id = $1', [id]);
  await db.execute('DELETE FROM habit_logs WHERE habit_id = $1', [id]);
  await db.execute('DELETE FROM habits WHERE id = $1', [id]);
}

// === Habit Logs ===

export async function getLogsForHabit(habitId: string, limit = 90): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = await db.select<HabitLogRow[]>(
    'SELECT * FROM habit_logs WHERE habit_id = $1 ORDER BY date DESC LIMIT $2',
    [habitId, limit]
  );
  return rows.map(rowToLog);
}

export async function getLogsForDate(date: string): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = await db.select<HabitLogRow[]>(
    'SELECT * FROM habit_logs WHERE date = $1',
    [date]
  );
  return rows.map(rowToLog);
}

export async function getLogForHabitOnDate(habitId: string, date: string): Promise<HabitLog | null> {
  const db = await getDatabase();
  const rows = await db.select<HabitLogRow[]>(
    'SELECT * FROM habit_logs WHERE habit_id = $1 AND date = $2',
    [habitId, date]
  );
  return rows.length > 0 ? rowToLog(rows[0]) : null;
}

export async function toggleHabitCompletion(habitId: string, date?: string): Promise<HabitLog> {
  const db = await getDatabase();
  const targetDate = date || todayISO();
  const now = nowISO();

  const existing = await getLogForHabitOnDate(habitId, targetDate);

  if (existing && existing.status === 'completed') {
    // Un-complete
    await db.execute('DELETE FROM habit_logs WHERE id = $1', [existing.id]);
    return { ...existing, status: 'missed' };
  } else if (existing) {
    // Update to completed
    await db.execute(
      'UPDATE habit_logs SET status = $1, completed_at = $2 WHERE id = $3',
      ['completed', now, existing.id]
    );
    return { ...existing, status: 'completed', completedAt: now };
  } else {
    // Create new completed log
    const id = generateId();
    await db.execute(
      'INSERT INTO habit_logs (id, habit_id, date, status, note, completed_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, habitId, targetDate, 'completed', null, now]
    );
    return { id, habitId, date: targetDate, status: 'completed', note: null, completedAt: now };
  }
}

export async function skipHabit(habitId: string, date?: string): Promise<void> {
  const db = await getDatabase();
  const targetDate = date || todayISO();
  const existing = await getLogForHabitOnDate(habitId, targetDate);

  if (existing) {
    await db.execute('UPDATE habit_logs SET status = $1 WHERE id = $2', ['skipped', existing.id]);
  } else {
    await db.execute(
      'INSERT INTO habit_logs (id, habit_id, date, status, note, completed_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [generateId(), habitId, targetDate, 'skipped', null, null]
    );
  }
}

// === Streaks ===

export async function getStreak(habitId: string): Promise<Streak | null> {
  const db = await getDatabase();
  const rows = await db.select<StreakRow[]>('SELECT * FROM streaks WHERE habit_id = $1', [habitId]);
  return rows.length > 0 ? rowToStreak(rows[0]) : null;
}

export async function updateStreak(habitId: string, current: number, longest: number, lastDate: string | null): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    'UPDATE streaks SET current_streak = $1, longest_streak = $2, last_completed_date = $3 WHERE habit_id = $4',
    [current, longest, lastDate, habitId]
  );
}

// === Analytics helpers ===

export async function getCompletionCountForDateRange(startDate: string, endDate: string): Promise<{ date: string; count: number }[]> {
  const db = await getDatabase();
  return db.select(
    `SELECT date, COUNT(*) as count FROM habit_logs 
     WHERE status = 'completed' AND date >= $1 AND date <= $2 
     GROUP BY date ORDER BY date`,
    [startDate, endDate]
  );
}

export async function getTotalCompletions(habitId: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM habit_logs WHERE habit_id = $1 AND status = $2',
    [habitId, 'completed']
  );
  return result[0]?.count || 0;
}

export async function getDailyCompletionCounts(days = 30): Promise<Record<string, number>> {
  const db = await getDatabase();
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const rows = await db.select<{ date: string; count: number }[]>(
    `SELECT date, COUNT(*) as count FROM habit_logs 
     WHERE status = 'completed' AND date >= $1 
     GROUP BY date`,
    [startDate]
  );
  
  const map: Record<string, number> = {};
  rows.forEach(r => map[r.date] = r.count);
  return map;
}

export async function clearDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM habit_logs');
  await db.execute('DELETE FROM streaks');
  await db.execute('DELETE FROM habits');
  await db.execute('DELETE FROM goals');
  await db.execute('DELETE FROM journal_entries');
  await db.execute('DELETE FROM focus_sessions');
  await db.execute('DELETE FROM achievements');
  await db.execute('DELETE FROM settings');
}
