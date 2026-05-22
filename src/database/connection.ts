// =============================================
// PEAK — Database Connection & Schema
// =============================================

import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;
  db = await Database.load('sqlite:peak.db');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: Database): Promise<void> {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '✦',
      color TEXT DEFAULT '#D4896A',
      frequency TEXT DEFAULT 'daily',
      schedule TEXT,
      priority TEXT DEFAULT 'medium',
      difficulty TEXT DEFAULT 'medium',
      category TEXT DEFAULT 'General',
      tags TEXT DEFAULT '[]',
      estimated_duration INTEGER DEFAULT 15,
      is_archived INTEGER DEFAULT 0,
      is_paused INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      completed_at TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS streaks (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL UNIQUE,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      freeze_days_used INTEGER DEFAULT 0,
      last_completed_date TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      content TEXT DEFAULT '',
      mood TEXT,
      mood_score INTEGER,
      type TEXT DEFAULT 'reflection',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'Personal',
      target_date TEXT,
      milestones TEXT DEFAULT '[]',
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'pomodoro',
      duration INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      habit_id TEXT,
      notes TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE SET NULL
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '🏆',
      xp_reward INTEGER DEFAULT 0,
      unlocked_at TEXT
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS block_categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      emoji TEXT DEFAULT '🌐',
      color TEXT DEFAULT 'bg-blue-50 border-blue-200 text-blue-700',
      is_custom INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS block_domains (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES block_categories(id) ON DELETE CASCADE,
      UNIQUE(category_id, domain)
    )
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_block_domains_category ON block_domains(category_id)
  `);

  // Create indexes for performance
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at)
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
