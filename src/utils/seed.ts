import { getDatabase } from '../database/connection';
import { createHabit, toggleHabitCompletion } from '../database/habits';

export async function seedDatabase() {
  const db = await getDatabase();
  
  // Clear existing
  await db.execute('DELETE FROM habit_logs');
  await db.execute('DELETE FROM streaks');
  await db.execute('DELETE FROM habits');
  
  // Create some sample habits
  const h1 = await createHabit({
    name: "Morning Meditation",
    description: "Start the day with a calm mind",
    icon: "🧘‍♂️",
    color: "#5DB075",
    frequency: "daily",
    schedule: null,
    priority: "high",
    difficulty: "medium",
    category: "Mindfulness",
    tags: ["morning", "health"],
    estimatedDuration: 15,
    isArchived: false,
    isPaused: false
  });
  
  const h2 = await createHabit({
    name: "Read 20 pages",
    description: "Continuous learning",
    icon: "📚",
    color: "#D4896A",
    frequency: "daily",
    schedule: null,
    priority: "medium",
    difficulty: "easy",
    category: "Learning",
    tags: ["reading", "evening"],
    estimatedDuration: 30,
    isArchived: false,
    isPaused: false
  });
  
  const h3 = await createHabit({
    name: "Deep Work Session",
    description: "Focus without distractions",
    icon: "🧠",
    color: "#E6A849",
    frequency: "daily",
    schedule: null,
    priority: "high",
    difficulty: "hard",
    category: "Work",
    tags: ["focus", "career"],
    estimatedDuration: 90,
    isArchived: false,
    isPaused: false
  });

  // Manually update streaks for the demo
  await db.execute('UPDATE streaks SET current_streak = 12, longest_streak = 15 WHERE habit_id = $1', [h1.id]);
  await db.execute('UPDATE streaks SET current_streak = 4, longest_streak = 20 WHERE habit_id = $1', [h2.id]);
  
  // Complete one for today
  await toggleHabitCompletion(h1.id);
  
  console.log("Database seeded successfully!");
}
