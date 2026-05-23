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

  const stats = useMemo(() => {
    const total = activeHabits.length;
    const totalCompletions = activeHabits.reduce((s, h) => s + (h.totalCompletions ?? 0), 0);
    const completedToday = activeHabits.filter(h => h.todayStatus === 'completed').length;
    const completionRate = total > 0 ? Math.round((completedToday / total) * 100) : 0;
    const avgStreak = total > 0
      ? Math.round(activeHabits.reduce((s, h) => s + (h.currentStreak ?? 0), 0) / total)
      : 0;
    const bestStreak = total > 0
      ? Math.max(...activeHabits.map(h => h.longestStreak ?? 0))
      : 0;
    return { totalCompletions, completionRate, avgStreak, bestStreak, completedToday, total };
  }, [activeHabits]);

  const weeklyHabitData = useMemo(() => {
    return getLast7Days().reverse().map(dateStr => ({
      name: formatShortDate(parseISO(dateStr)).replace(/\d{4}/, '').trim(),
      completed: completionCounts[dateStr] ?? 0,
      total: activeHabits.length,
    }));
  }, [completionCounts, activeHabits.length]);

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
    backgroundColor: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '0.75rem',
    fontSize: 12,
    color: '#fff',
  };

  return (
    <div className="h-full flex flex-col space-y-8 pb-12">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(28px,4vw,44px)] font-medium tracking-tight text-white mb-1">
          Analytics
        </motion.h1>
        <p className="text-neutral-400 text-lg">Insights into your consistency and focus.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Rate" value={`${stats.completionRate}%`}
          sub={`${stats.completedToday} / ${stats.total} habits`} accent />
        <StatCard label="Total Completions" value={stats.totalCompletions.toLocaleString()} sub="all time" />
        <StatCard label="Avg Streak" value={`${stats.avgStreak}d`} sub="across habits" />
        <StatCard label="Best Streak" value={`${stats.bestStreak}d`} sub="personal record" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Focus Today" value={`${todayFocusMins}m`} sub={`${Math.floor(todayFocusMins / 60)}h ${todayFocusMins % 60}m`} />
        <StatCard label="Total Focus" value={`${Math.floor(totalFocusMins / 60)}h`} sub={`${totalFocusMins} minutes`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-white mb-1">Habit Completions — Last 7 Days</h3>
            <p className="text-xs text-neutral-500 mb-4">Daily completed habits count</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyHabitData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gHabit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.25 }} />
                      <stop offset="95%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} habits`, 'Completed']} />
                  <Area type="monotone" dataKey="completed" strokeWidth={2.5} fill="url(#gHabit)" dot={{ r: 3, style: { fill: 'var(--accent)' } }} style={{ stroke: 'var(--accent)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-white mb-1">Focus Time — Last 7 Days</h3>
            <p className="text-xs text-neutral-500 mb-4">Minutes of focused work per day</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyFocusData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#737373', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} min`, 'Focus']} />
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={40} style={{ fill: 'var(--accent)' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-white mb-1">Category Balance</h3>
            <p className="text-xs text-neutral-500 mb-4">Today's completion rate per category</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
                  <PolarGrid stroke="#2a2a2a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="A" fillOpacity={0.35} strokeWidth={2} style={{ stroke: 'var(--accent)', fill: 'var(--accent)' }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Completion']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-white mb-1">Streak Leaderboard</h3>
            <p className="text-xs text-neutral-500 mb-4">Your top habits by current streak</p>
            <div className="space-y-3">
              {[...activeHabits]
                .sort((a, b) => (b.currentStreak ?? 0) - (a.currentStreak ?? 0))
                .slice(0, 6)
                .map((h, i) => {
                  const pct = stats.bestStreak > 0 ? ((h.currentStreak ?? 0) / stats.bestStreak) * 100 : 0;
                  return (
                    <div key={h.id} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-neutral-500 w-4">{i + 1}</span>
                      <span className="text-lg">{h.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white truncate">{h.name}</span>
                          <span className="text-xs text-[var(--accent)] font-medium ml-2 shrink-0">{h.currentStreak ?? 0}d</span>
                        </div>
                        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[var(--accent)] rounded-full"
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
                <p className="text-sm text-neutral-500 text-center py-8">No habits yet.</p>
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
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500 mb-1">{label}</p>
        <p className={`text-3xl font-medium ${accent ? 'text-[var(--accent)]' : 'text-white'}`}>{value}</p>
        {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
