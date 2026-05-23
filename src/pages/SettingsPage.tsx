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
    { id: '#f59e0b', name: 'Amber' },
    { id: '#f97316', name: 'Orange' },
    { id: '#84cc16', name: 'Lime' },
    { id: '#06b6d4', name: 'Cyan' },
    { id: '#8b5cf6', name: 'Purple' },
    { id: '#ec4899', name: 'Pink' },
    { id: '#ffffff', name: 'White' },
  ];

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[clamp(28px,4vw,44px)] font-medium tracking-tight text-white mb-1">Settings</h1>
        <p className="text-neutral-400">Customize your Peak experience.</p>
      </div>

      <div className="space-y-8 flex-1 pb-12">
        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Profile</h2>
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-[var(--accent)] flex items-center justify-center text-black text-3xl font-bold overflow-hidden">
                  {settings.userAvatar ? (
                    <img src={settings.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(settings.userName || 'U').charAt(0)}</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[10px] font-medium text-white uppercase tracking-wider">Change</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2 block">Display Name</label>
                  <input 
                    type="text"
                    value={settings.userName || ''}
                    onChange={(e) => updateSetting('userName', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white focus:border-[var(--accent)] outline-none transition-colors duration-200"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Appearance</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-[#2a2a2a]">
              
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white">Theme</h3>
                  <p className="text-sm text-neutral-400">Select your preferred color scheme.</p>
                </div>
                <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateSetting('theme', t.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        settings.theme === t.id 
                          ? 'bg-[#141414] text-white' 
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <t.icon size={16} strokeWidth={1.5} />
                      <span className="hidden sm:inline">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white">Accent Color</h3>
                  <p className="text-sm text-neutral-400">Personalize the primary color.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {ACCENTS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => updateSetting('accentColor', a.id)}
                      title={a.name}
                      className={`w-8 h-8 rounded-full ring-offset-2 ring-offset-[#141414] transition-all duration-200 ${
                        settings.accentColor === a.id ? 'ring-2 ring-[var(--accent)] scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: a.id }}
                    />
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Behavior</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-[#2a2a2a]">
              
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#1a1a1a] rounded-md mt-0.5">
                    <Bell size={18} strokeWidth={1.5} className="text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Desktop Notifications</h3>
                    <p className="text-sm text-neutral-400">Get reminded about habits and focus sessions.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.notificationsEnabled}
                    onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[#1a1a1a] peer-focus:outline-none peer-focus:border-[var(--accent)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#2a2a2a] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] border border-[#2a2a2a]"></div>
                </label>
              </div>

            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4 text-white">Data & Storage</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-[#2a2a2a]">
              
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#1a1a1a] rounded-md mt-0.5">
                    <Database size={18} strokeWidth={1.5} className="text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Local Backup</h3>
                    <p className="text-sm text-neutral-400">Export your data as a JSON file or restore from a backup.</p>
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
                          if (!content) return;
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
                    <Upload size={16} strokeWidth={1.5} /> Import
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
                        await invoke<boolean>('save_file_dialog', { content: data, defaultFilename });
                      } catch (err) {
                        console.error('Export failed:', err);
                        alert('Failed to export data: ' + err);
                      }
                    }}
                  >
                    <Download size={16} strokeWidth={1.5} /> Export
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4 text-red-400">Danger Zone</h2>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white">Reset Database</h3>
                  <p className="text-sm text-neutral-400">Permanently delete all habits, logs, and settings. This cannot be undone.</p>
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
