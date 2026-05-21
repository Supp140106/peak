// =============================================
// PEAK — Journal Database Operations
// =============================================

import { getDatabase } from './connection';
import type { JournalEntry, JournalEntryRow, JournalType } from '@/types';
import { generateId, nowISO } from '@/utils/dates';

function rowToEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    mood: row.mood as JournalEntry['mood'],
    moodScore: row.mood_score,
    type: row.type as JournalType,
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllJournalEntries(limit = 50): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.select<JournalEntryRow[]>(
    'SELECT * FROM journal_entries ORDER BY date DESC, created_at DESC LIMIT $1',
    [limit]
  );
  return rows.map(rowToEntry);
}

export async function getJournalEntriesForDate(date: string): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.select<JournalEntryRow[]>(
    'SELECT * FROM journal_entries WHERE date = $1 ORDER BY created_at DESC',
    [date]
  );
  return rows.map(rowToEntry);
}

export async function createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.execute(
    `INSERT INTO journal_entries (id, date, content, mood, mood_score, type, tags, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, entry.date, entry.content, entry.mood, entry.moodScore, entry.type, JSON.stringify(entry.tags), now, now]
  );

  return { ...entry, id, createdAt: now, updatedAt: now };
}

export async function updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (updates.content !== undefined) { fields.push(`content = $${i++}`); values.push(updates.content); }
  if (updates.mood !== undefined) { fields.push(`mood = $${i++}`); values.push(updates.mood); }
  if (updates.moodScore !== undefined) { fields.push(`mood_score = $${i++}`); values.push(updates.moodScore); }
  if (updates.type !== undefined) { fields.push(`type = $${i++}`); values.push(updates.type); }
  if (updates.tags !== undefined) { fields.push(`tags = $${i++}`); values.push(JSON.stringify(updates.tags)); }

  fields.push(`updated_at = $${i++}`);
  values.push(now);
  values.push(id);

  await db.execute(`UPDATE journal_entries SET ${fields.join(', ')} WHERE id = $${i}`, values);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM journal_entries WHERE id = $1', [id]);
}

export async function searchJournalEntries(query: string): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.select<JournalEntryRow[]>(
    "SELECT * FROM journal_entries WHERE content LIKE $1 ORDER BY date DESC",
    [`%${query}%`]
  );
  return rows.map(rowToEntry);
}
