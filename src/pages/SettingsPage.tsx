// =============================================
// PEAK — Settings Page
// =============================================

import React from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Monitor, Moon, Sun, Bell, Database, Download, Upload } from 'lucide-react';

export function SettingsPage() {
  const { settings, updateSetting } = useSettingsStore();

  if (!settings) return null;

  const THEMES = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'auto', label: 'System', icon: Monitor },
  ];

  const ACCENTS = [
    { id: '#D4896A', name: 'Terracotta' },
    { id: '#5DB075', name: 'Sage' },
    { id: '#E6A849', name: 'Amber' },
    { id: '#D66A6A', name: 'Rose' },
    { id: '#7A6AD4', name: 'Lavender' },
    { id: '#4DA5B3', name: 'Ocean' },
    { id: '#2D2D2D', name: 'Graphite' },
  ];

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">Settings</h1>
        <p className="text-[var(--color-text-secondary)]">Customize your Peak experience.</p>
      </div>

      <div className="space-y-8 flex-1 pb-12">
        {/* Profile */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-[var(--color-text-primary)]">Profile</h2>
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                  {settings.userAvatar ? (
                    <img src={settings.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(settings.userName || 'U').charAt(0)}</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2 block">Display Name</label>
                  <input 
                    type="text"
                    value={settings.userName || ''}
                    onChange={(e) => updateSetting('userName', e.target.value)}
                    className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-[var(--color-text-primary)]">Appearance</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-[var(--color-border)]">
              
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-[var(--color-text-primary)]">Theme</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Select your preferred color scheme.</p>
                </div>
                <div className="flex bg-[var(--color-bg-tertiary)] p-1 rounded-lg border border-[var(--color-border)]">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateSetting('theme', t.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        settings.theme === t.id 
                          ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm' 
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <t.icon size={16} />
                      <span className="hidden sm:inline">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-[var(--color-text-primary)]">Accent Color</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Personalize the primary color.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {ACCENTS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => updateSetting('accentColor', a.id)}
                      title={a.name}
                      className={`w-8 h-8 rounded-full ring-offset-2 ring-offset-[var(--color-bg-secondary)] transition-all ${
                        settings.accentColor === a.id ? 'ring-2 ring-[var(--color-border-focus)] scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: a.id }}
                    />
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

        {/* Behavior */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-[var(--color-text-primary)]">Behavior</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-[var(--color-border)]">
              
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-md mt-0.5">
                    <Bell size={18} className="text-[var(--color-text-secondary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--color-text-primary)]">Desktop Notifications</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">Get reminded about habits and focus sessions.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.notificationsEnabled}
                    onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[var(--color-bg-tertiary)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--color-border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)] border border-[var(--color-border)]"></div>
                </label>
              </div>

            </CardContent>
          </Card>
        </section>

        {/* Data & Storage */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-[var(--color-text-primary)]">Data & Storage</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-[var(--color-border)]">
              
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-md mt-0.5">
                    <Database size={18} className="text-[var(--color-text-secondary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--color-text-primary)]">Local Backup</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">Export your data as a JSON file or restore from a backup.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={async () => {
                      if (window.confirm('Importing data will overwrite your current database. This cannot be undone. Continue?')) {
                        try {
                          const { invoke } = await import('@tauri-apps/api/core');
                          const content = await invoke<string | null>('select_and_read_file');
                          if (!content) return; // User cancelled or read nothing

                          const { importAllData } = await import('@/database/backup');
                          await importAllData(content);
                          window.location.reload();
                        } catch (err) {
                          console.error('Import failed:', err);
                          alert('Failed to import data. Please ensure the file is a valid Peak backup. Details: ' + err);
                        }
                      }
                    }}
                  >
                    <Upload size={16} /> Import
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={async () => {
                      try {
                        const { exportAllData } = await import('@/database/backup');
                        const data = await exportAllData();
                        const { invoke } = await import('@tauri-apps/api/core');
                        const defaultFilename = `peak-backup-${new Date().toISOString().split('T')[0]}.json`;
                        
                        const success = await invoke<boolean>('save_file_dialog', {
                          content: data,
                          defaultFilename
                        });
                        
                        if (success) {
                          // No alert or nice notification can be shown. Let's just do a subtle console log or confirm success.
                          // Actually, a simple alert is fine, or we can just let it be silent since native dialog handled it.
                          // Let's keep it simple.
                        }
                      } catch (err) {
                        console.error('Export failed:', err);
                        alert('Failed to export data: ' + err);
                      }
                    }}
                  >
                    <Download size={16} /> Export
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-[var(--color-danger)]">Danger Zone</h2>
          <Card className="border-[var(--color-danger)]/20 bg-[var(--color-danger-light)]/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-[var(--color-text-primary)]">Reset Database</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Permanently delete all habits, logs, and settings. This cannot be undone.</p>
                </div>
                <Button 
                  variant="destructive" 
                  className="shrink-0"
                  onClick={async () => {
                    if (window.confirm('Are you absolutely sure? This will delete ALL your progress and cannot be undone.')) {
                      const { clearDatabase } = await import('@/database/habits');
                      await clearDatabase();
                      window.location.reload();
                    }
                  }}
                >
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
