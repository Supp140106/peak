import { getDatabase } from './connection';

export async function exportAllData(): Promise<string> {
  const db = await getDatabase();
  
  const tables = [
    'habits', 
    'habit_logs', 
    'streaks', 
    'goals', 
    'journal_entries', 
    'focus_sessions', 
    'achievements', 
    'settings'
  ];

  const backup: Record<string, any[]> = {};

  for (const table of tables) {
    try {
      backup[table] = await db.select(`SELECT * FROM ${table}`);
    } catch (e) {
      console.warn(`Could not export table ${table}:`, e);
      backup[table] = [];
    }
  }

  return JSON.stringify({
    version: 1,
    timestamp: new Date().toISOString(),
    data: backup
  }, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
  const db = await getDatabase();
  const backup = JSON.parse(jsonString);

  if (!backup.data || typeof backup.data !== 'object') {
    throw new Error('Invalid backup format');
  }

  // Clear existing data first (or we could merge, but clear is safer for a full restore)
  const { clearDatabase } = await import('./habits');
  await clearDatabase();

  for (const [table, rows] of Object.entries(backup.data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    for (const row of rows as any[]) {
      const values = columns.map(col => row[col]);
      await db.execute(query, values);
    }
  }
}
