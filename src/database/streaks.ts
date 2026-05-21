import { getDatabase } from './connection';
import { differenceInDays, parseISO, subDays, format } from 'date-fns';
import { getStreak, updateStreak, getLogsForHabit } from './habits';

export async function recalculateHabitStreak(habitId: string) {
  const logs = await getLogsForHabit(habitId, 365); // Check last year
  const streak = await getStreak(habitId);
  
  if (!streak) return;

  const completedDates = logs
    .filter(l => l.status === 'completed')
    .map(l => l.date)
    .sort((a, b) => b.localeCompare(a)); // Newest first

  if (completedDates.length === 0) {
    await updateStreak(habitId, 0, streak.longestStreak, null);
    return;
  }

  let currentStreak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Check if streak is still alive (completed today or yesterday)
  const lastDate = completedDates[0];
  const daysSinceLast = differenceInDays(parseISO(today), parseISO(lastDate));

  if (daysSinceLast <= 1) {
    currentStreak = 1;
    for (let i = 0; i < completedDates.length - 1; i++) {
      const current = parseISO(completedDates[i]);
      const next = parseISO(completedDates[i + 1]);
      if (differenceInDays(current, next) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  const newLongest = Math.max(streak.longestStreak, currentStreak);
  await updateStreak(habitId, currentStreak, newLongest, lastDate);
}
