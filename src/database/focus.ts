// =============================================
// PEAK — Focus Session Database Operations
// =============================================

import { getDatabase } from './connection';
import type { FocusSession, FocusSessionRow } from '@/types';
import { generateId, nowISO } from '@/utils/dates';

function rowToSession(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    type: row.type as FocusSession['type'],
    duration: row.duration,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    habitId: row.habit_id,
    notes: row.notes,
  };
}

export async function getAllFocusSessions(limit = 50): Promise<FocusSession[]> {
  const db = await getDatabase();
  const rows = await db.select<FocusSessionRow[]>(
    'SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT $1',
    [limit]
  );
  return rows.map(rowToSession);
}

export async function createFocusSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
  const db = await getDatabase();
  const id = generateId();
  await db.execute(
    `INSERT INTO focus_sessions (id, type, duration, started_at, ended_at, habit_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, session.type, session.duration, session.startedAt, session.endedAt, session.habitId, session.notes]
  );
  return { ...session, id };
}

export async function endFocusSession(id: string, duration: number): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  await db.execute(
    'UPDATE focus_sessions SET ended_at = $1, duration = $2 WHERE id = $3',
    [now, duration, id]
  );
}

function getLocalDateString(date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

export async function getTotalFocusTime(): Promise<number> {
  const db = await getDatabase();
  const result = await db.select<{ total: number }[]>(
    'SELECT COALESCE(SUM(duration), 0) as total FROM focus_sessions WHERE ended_at IS NOT NULL'
  );
  return result[0]?.total || 0;
}

export async function getTodayFocusTime(): Promise<number> {
  const db = await getDatabase();
  const today = getLocalDateString();
  const result = await db.select<{ total: number }[]>(
    "SELECT COALESCE(SUM(duration), 0) as total FROM focus_sessions WHERE ended_at IS NOT NULL AND date(started_at, 'localtime') = $1",
    [today]
  );
  return result[0]?.total || 0;
}

export async function getDailyFocusMinutes(days: number = 365): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.select<{ date: string; total_minutes: number }[]>(
    `SELECT 
      date(started_at, 'localtime') as date, 
      COALESCE(SUM(duration), 0) / 60 as total_minutes 
     FROM focus_sessions 
     WHERE ended_at IS NOT NULL 
     GROUP BY date(started_at, 'localtime')
     ORDER BY date DESC
     LIMIT $1`,
    [days]
  );
  
  const counts: Record<string, number> = {};
  rows.forEach(row => {
    counts[row.date] = Math.round(row.total_minutes);
  });
  return counts;
}

export interface FocusStreak {
  currentStreak: number;
  longestStreak: number;
}

export async function getFocusStreak(): Promise<FocusStreak> {
  const db = await getDatabase();
  const rows = await db.select<{ date: string }[]>(
    `SELECT date(started_at, 'localtime') as date 
     FROM focus_sessions 
     WHERE ended_at IS NOT NULL 
     GROUP BY date(started_at, 'localtime') 
     ORDER BY date DESC`
  );
  
  if (rows.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const completedDates = rows.map(r => r.date);
  
  let currentStreak = 0;
  const today = getLocalDateString(new Date());
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
  
  const lastDate = completedDates[0];
  
  if (lastDate === today || lastDate === yesterday) {
    currentStreak = 1;
    let prevDate = lastDate;
    
    for (let i = 1; i < completedDates.length; i++) {
      const current = new Date(prevDate);
      const next = new Date(completedDates[i]);
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        prevDate = completedDates[i];
      } else if (diffDays === 0) {
        continue;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;
  const sortedDates = [...completedDates].reverse();
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const current = new Date(sortedDates[i]);
      const prev = new Date(prevDate);
      const diffTime = Math.abs(current.getTime() - prev.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = sortedDates[i];
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}
