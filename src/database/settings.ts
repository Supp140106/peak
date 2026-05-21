// =============================================
// PEAK — Settings Database Operations
// =============================================

import { getDatabase } from './connection';
import type { AppSettings, SettingsRow, DEFAULT_SETTINGS } from '@/types';

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const rows = await db.select<SettingsRow[]>('SELECT * FROM settings');
  
  const defaults: AppSettings = {
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

  for (const row of rows) {
    try {
      const value = JSON.parse(row.value);
      (defaults as unknown as Record<string, unknown>)[row.key] = value;
    } catch {
      (defaults as unknown as Record<string, unknown>)[row.key] = row.value;
    }
  }

  return defaults;
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await getDatabase();
  const serialized = JSON.stringify(value);
  await db.execute(
    `INSERT INTO settings (key, value) VALUES ($1, $2) 
     ON CONFLICT(key) DO UPDATE SET value = $2`,
    [key, serialized]
  );
}

export async function saveAllSettings(settings: AppSettings): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    await saveSetting(key, value);
  }
}
