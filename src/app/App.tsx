// =============================================
// PEAK — Main Router & App Wrapper
// =============================================

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useSettingsStore } from '@/store/settingsStore';

// Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { HabitsPage } from '@/pages/HabitsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { FocusPage } from '@/pages/FocusPage';
import { JournalPage } from '@/pages/JournalPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { HabitDetailPage } from '@/pages/HabitDetailPage';
import { FocusBlockPage } from '@/pages/FocusBlockPage';

export function App() {
  const { loadSettings, isLoading } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        <div className="animate-pulse-soft font-medium">Loading Peak...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="habits/:id" element={<HabitDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="focus" element={<FocusPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="focus-block" element={<FocusBlockPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
