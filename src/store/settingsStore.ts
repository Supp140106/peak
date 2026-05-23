// =============================================
// PEAK — Settings Zustand Store
// =============================================

import { create } from 'zustand';
import type { AppSettings } from '@/types';
import * as settingsDb from '@/database/settings';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyAccentColor(hex: string) {
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-soft', hexToRgba(hex, 0.1));
  document.documentElement.style.setProperty('--accent-border', hexToRgba(hex, 0.3));
  document.documentElement.style.setProperty('--accent-lighter', hexToRgba(hex, 0.8));
}

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: true,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const loaded = await settingsDb.loadSettings();
      set({ settings: loaded, isLoading: false });
      
      // Apply theme to document
      if (loaded.theme === 'dark' || (loaded.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Apply accent color
      applyAccentColor(loaded.accentColor);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  updateSetting: async (key, value) => {
    const { settings } = get();
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    set({ settings: newSettings });
    
    // Side effects
    if (key === 'theme') {
      if (value === 'dark' || (value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    if (key === 'accentColor') {
      applyAccentColor(value as string);
    }
    
    try {
      await settingsDb.saveSetting(key, value);
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
      // Revert optimistic update
      set({ settings });
    }
  }
}));
