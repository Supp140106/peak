// =============================================
// PEAK — Analytics Page
// =============================================

import React, { useMemo, useEffect, useState } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { getLast7Days, formatShortDate, parseISO } from '@/utils/dates';
import { motion } from 'framer-motion';
import * as habitDb from '@/database/habits';

export function AnalyticsPage() {
  const { activeHabits, fetchHabits } = useHabitStore();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchHabits();
    habitDb.getDailyCompletionCounts(7).then(setCounts);
  }, [fetchHabits]);

  const stats = useMemo(() => {
    const totalCompletions = activeHabits.reduce((acc, h) => acc + (h.totalCompletions || 0), 0);
    const avgStreak = activeHabits.length > 0 
      ? Math.round(activeHabits.reduce((acc, h) => acc + (h.currentStreak || 0), 0) / activeHabits.length) 
      : 0;
    const maxStreak = activeHabits.length > 0
      ? Math.max(...activeHabits.map(h => h.longestStreak || 0))
      : 0;
    
    return { totalCompletions, avgStreak, maxStreak };
  }, [activeHabits]);

  const weeklyData = useMemo(() => {
    const days = getLast7Days().reverse();
    return days.map(dateStr => {
      const display = formatShortDate(parseISO(dateStr));
      return {
        name: display,
        completed: counts[dateStr] || 0,
        total: activeHabits.length,
      };
    });
  }, [activeHabits.length, counts]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    activeHabits.forEach(h => {
      categories[h.category] = (categories[h.category] || 0) + 1;
    });
    
    if (Object.keys(categories).length === 0) {
      return [
        { subject: 'None', A: 0, fullMark: 100 },
      ];
    }

    return Object.entries(categories).map(([key, val]) => ({
      subject: key,
      A: Math.min(val * 20, 100), 
      fullMark: 100
    }));
  }, [activeHabits]);

  return (
    <div className="h-full flex flex-col space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">Analytics</h1>
        <p className="text-[var(--color-text-secondary)]">Insights into your consistency and focus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatItem title="Total Completions" value={stats.totalCompletions.toString()} />
        <StatItem title="Average Streak" value={`${stats.avgStreak} days`} />
        <StatItem title="Personal Record" value={`${stats.maxStreak} days`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-6">Weekly Activity</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="var(--color-accent)" strokeWidth={3} fill="url(#colorAcc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-2">Category Balance</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">Habit distribution by category.</p>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Focus" dataKey="A" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.4} strokeWidth={2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatItem({ title, value }: { title: string, value: string }) {
  return (
    <Card className="border-none bg-[var(--color-bg-secondary)] shadow-premium">
      <CardContent className="p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">{title}</p>
        <p className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
      </CardContent>
    </Card>
  );
}
