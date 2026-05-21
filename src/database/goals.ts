// =============================================
// PEAK — Goals Database Operations
// =============================================

import { getDatabase } from './connection';
import type { Goal, GoalRow, GoalMilestone } from '@/types';
import { generateId, nowISO } from '@/utils/dates';

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    targetDate: row.target_date,
    milestones: JSON.parse(row.milestones || '[]') as GoalMilestone[],
    progress: row.progress,
    status: row.status as Goal['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  const rows = await db.select<GoalRow[]>('SELECT * FROM goals ORDER BY created_at DESC');
  return rows.map(rowToGoal);
}

export async function getActiveGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  const rows = await db.select<GoalRow[]>(
    "SELECT * FROM goals WHERE status = 'active' ORDER BY created_at DESC"
  );
  return rows.map(rowToGoal);
}

export async function createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();
  await db.execute(
    `INSERT INTO goals (id, title, description, category, target_date, milestones, progress, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, goal.title, goal.description, goal.category, goal.targetDate, JSON.stringify(goal.milestones), goal.progress, goal.status, now, now]
  );
  return { ...goal, id, createdAt: now, updatedAt: now };
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (updates.title !== undefined) { fields.push(`title = $${i++}`); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push(`description = $${i++}`); values.push(updates.description); }
  if (updates.category !== undefined) { fields.push(`category = $${i++}`); values.push(updates.category); }
  if (updates.targetDate !== undefined) { fields.push(`target_date = $${i++}`); values.push(updates.targetDate); }
  if (updates.milestones !== undefined) { fields.push(`milestones = $${i++}`); values.push(JSON.stringify(updates.milestones)); }
  if (updates.progress !== undefined) { fields.push(`progress = $${i++}`); values.push(updates.progress); }
  if (updates.status !== undefined) { fields.push(`status = $${i++}`); values.push(updates.status); }

  fields.push(`updated_at = $${i++}`);
  values.push(now);
  values.push(id);

  await db.execute(`UPDATE goals SET ${fields.join(', ')} WHERE id = $${i}`, values);
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM goals WHERE id = $1', [id]);
}
