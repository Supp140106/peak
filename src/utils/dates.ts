// =============================================
// PEAK — Date Utilities
// =============================================

import { format, isToday, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval, subDays, differenceInDays, parseISO } from 'date-fns';

export function generateId(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export { format, isToday, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval, subDays, differenceInDays, parseISO } from 'date-fns';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d');
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getWeekDays(date?: Date): Date[] {
  const d = date || new Date();
  return eachDayOfInterval({
    start: startOfWeek(d, { weekStartsOn: 1 }),
    end: endOfWeek(d, { weekStartsOn: 1 }),
  });
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
}

export function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));
}

export function getLast90Days(): string[] {
  return Array.from({ length: 90 }, (_, i) => format(subDays(new Date(), 89 - i), 'yyyy-MM-dd'));
}

export function getDaysBetween(start: string, end: string): number {
  return differenceInDays(parseISO(end), parseISO(start));
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
