// =============================================
// PEAK — Analytics Page
// =============================================

import React, { useMemo, useEffect, useState } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { Card, CardContent } from '@/components/ui/Card';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, CartesianGrid,
} from 'recharts';
import { getLast7Days, formatShortDate, parseISO } from '@/utils/dates';
import { motion } from 'framer-motion';
import { subDays, format } from 'date-fns';
import * as habitDb from '@/database/habits';
import * as focusDb from '@/database/focus';

export function AnalyticsPage() {
  const { activeHabits, fetchHabits } = useHabitStore();
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});
  const [focusMinutes, setFocusMinutes] = useState<Record<string, number>>({});
  const [totalFocusMins, setTotalFocusMins] = useState(0);
  const [todayFocusMins, setTodayFocusMins] = useState(0);

  useEffect(() => {
    fetchHabits();
    habitDb.getDailyCompletionCounts(30).then(setCompletionCounts);
    focusDb.getDailyFocusMinutes(30).then(setFocusMinutes);
    focusDb.getTotalFocusTime().then(s => setTotalFocusMins(Math.round(s / 60)));
    focusDb.getTodayFocusTime().then(s => setTodayFocusMins(Math.round(s / 60)));
  }, [fetchHabits]);

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = activeHabits.length;
    const totalCompletions = activeHabits.reduce((s, h) => s + (h.totalCompletions ?? 0), 0);

    // Completion rate: completed today / total habits (avoid div-by-zero)
    const completedToday = activeHabits.filter(h => h.todayStatus === 'completed').length;
    const completionRate = total > 0 ? Math.round((completedToday / total) * 100) : 0;

    // Average current streak across all habits
    const avgStreak = total > 0
      ? Math.round(activeHabits.reduce((s, h) => s + (h.currentStreak ?? 0), 0) / total)
      : 0;

    // Personal record = max longest streak
    const bestStreak = total > 0
      ? Math.max(...activeHabits.map(h => h.longestStreak ?? 0))
      : 0;

    return { totalCompletions, completionRate, avgStreak, bestStreak, completedToday, total };
  }, [activeHabits]);

  // ── Last 7 days habit completions ───────────────────────────────────────────
  const weeklyHabitData = useMemo(() => {
    return getLast7Days().reverse().map(dateStr => ({
      name: formatShortDate(parseISO(dateStr)).replace(/\d{4}/, '').trim(),
      completed: completionCounts[dateStr] ?? 0,
      total: activeHabits.length,
    }));
  }, [completionCounts, activeHabits.length]);

  // ── Last 7 days focus minutes ────────────────────────────────────────────────
  const weeklyFocusData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, 'yyyy-MM-dd');
      return {
        name: format(d, 'EEE'),
        minutes: focusMinutes[key] ?? 0,
      };
    });
  }, [focusMinutes]);

  // ── Category radar ───────────────────────────────────────────────────────────
  // Each category's score = (completions in last 7 days for habits in that category) / max possible
  const categoryData = useMemo(() => {
    const catMap: Record<string, { completed: number; total: number }> = {};
    activeHabits.forEach(h => {
      if (!catMap[h.category]) catMap[h.category] = { completed: 0, total: 0 };
      catMap[h.category].total += 1;
      if (h.todayStatus === 'completed') catMap[h.category].completed += 1;
    });
    const entries = Object.entries(catMap);
    if (entries.length === 0) return [{ subject: 'No habits', A: 0, fullMark: 100 }];
    return entries.map(([cat, { completed, total }]) => ({
      subject: cat,
      A: total > 0 ? Math.round((completed / total) * 100) : 0,
      fullMark: 100,
    }));
  }, [activeHabits]);

  const tooltipStyle = {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.75rem',
    fontSize: 12,
  };

  return (
    <div className="h-full flex flex-col space-y-8 pb-12">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">
          Analytics
        </motion.h1>
        <p className="text-[var(--color-text-secondary)] text-lg">Insights into your consistency and focus.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Rate" value={`${stats.completionRate}%`}
          sub={`${stats.completedToday} / ${stats.total} habits`} accent />
        <StatCard label="Total Completions" value={stats.totalCompletions.toLocaleString()} sub="all time" />
        <StatCard label="Avg Streak" value={`${stats.avgStreak}d`} sub="across habits" />
        <StatCard label="Best Streak" value={`${stats.bestStreak}d`} sub="personal record" />
      </div>

      {/* Focus stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Focus Today" value={`${todayFocusMins}m`} sub={`${Math.floor(todayFocusMins / 60)}h ${todayFocusMins % 60}m`} />
        <StatCard label="Total Focus" value={`${Math.floor(totalFocusMins / 60)}h`} sub={`${totalFocusMins} minutes`} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Habit Completions — Last 7 Days</h3>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Daily completed habits count</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyHabitData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gHabit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} habits`, 'Completed']} />
                  <Area type="monotone" dataKey="completed" stroke="var(--color-accent)" strokeWidth={2.5} fill="url(#gHabit)" dot={{ r: 3, fill: 'var(--color-accent)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Focus Time — Last 7 Days</h3>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Minutes of focused work per day</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyFocusData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} min`, 'Focus']} />
                  <Bar dataKey="minutes" fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Category Balance</h3>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Today's completion rate per category</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.35} strokeWidth={2} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Completion']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Streak leaderboard */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Streak Leaderboard</h3>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Your top habits by current streak</p>
            <div className="space-y-3">
              {[...activeHabits]
                .sort((a, b) => (b.currentStreak ?? 0) - (a.currentStreak ?? 0))
                .slice(0, 6)
                .map((h, i) => {
                  const pct = stats.bestStreak > 0 ? ((h.currentStreak ?? 0) / stats.bestStreak) * 100 : 0;
                  return (
                    <div key={h.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[var(--color-text-tertiary)] w-4">{i + 1}</span>
                      <span className="text-lg">{h.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{h.name}</span>
                          <span className="text-xs text-[var(--color-accent)] font-bold ml-2 shrink-0">🔥 {h.currentStreak ?? 0}d</span>
                        </div>
                        <div className="h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[var(--color-accent)] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              {activeHabits.length === 0 && (
                <p className="text-sm text-[var(--color-text-tertiary)] text-center py-8">No habits yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">{label}</p>
        <p className={`text-3xl font-bold ${accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>{value}</p>
        {sub && <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
