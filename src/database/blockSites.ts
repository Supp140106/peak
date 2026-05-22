// =============================================
// PEAK — Block Sites Database Operations
// =============================================

import { getDatabase } from './connection';
import { generateId } from '@/utils/dates';

export interface DbCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  is_custom: number;
  sort_order: number;
  domains: string[];
}

// Seed built-in categories once (idempotent)
const BUILTIN: Omit<DbCategory, 'domains'>[] = [
  { id: 'social',        label: 'Social Media',  emoji: '📱', color: 'bg-blue-50 border-blue-200 text-blue-700',   is_custom: 0, sort_order: 0 },
  { id: 'adult',         label: 'Adult',          emoji: '🔞', color: 'bg-red-50 border-red-200 text-red-700',     is_custom: 0, sort_order: 1 },
  { id: 'gambling',      label: 'Gambling',       emoji: '🎰', color: 'bg-yellow-50 border-yellow-200 text-yellow-700', is_custom: 0, sort_order: 2 },
  { id: 'video',         label: 'Video',          emoji: '🎬', color: 'bg-purple-50 border-purple-200 text-purple-700', is_custom: 0, sort_order: 3 },
  { id: 'entertainment', label: 'Entertainment',  emoji: '🎮', color: 'bg-green-50 border-green-200 text-green-700',  is_custom: 0, sort_order: 4 },
  { id: 'news',          label: 'News',           emoji: '📰', color: 'bg-orange-50 border-orange-200 text-orange-700', is_custom: 0, sort_order: 5 },
];

const BUILTIN_DOMAINS: Record<string, string[]> = {
  social:        ['facebook.com','instagram.com','twitter.com','x.com','tiktok.com','reddit.com','snapchat.com','pinterest.com','linkedin.com','tumblr.com'],
  adult:         ['pornhub.com','xvideos.com','xnxx.com','xhamster.com','redtube.com','youporn.com','tube8.com','spankbang.com','brazzers.com','onlyfans.com','chaturbate.com','livejasmin.com','myfreecams.com','cam4.com','stripchat.com','bongacams.com','naughtyamerica.com','bangbros.com','realitykings.com','mofos.com','digitalplayground.com','wicked.com','evilangel.com','kink.com','adultfriendfinder.com','ashleymadison.com','fapello.com','thothub.to','erome.com','motherless.com','hentaihaven.xxx','nhentai.net','rule34.xxx','gelbooru.com','danbooru.donmai.us','e621.net'],
  gambling:      ['bet365.com','draftkings.com','fanduel.com','pokerstars.com','betway.com','williamhill.com','ladbrokes.com','betfair.com','888casino.com','casumo.com'],
  video:         ['youtube.com','netflix.com','twitch.tv','disneyplus.com','hulu.com','primevideo.com','hbomax.com','peacocktv.com','dailymotion.com','vimeo.com'],
  entertainment: ['9gag.com','buzzfeed.com','imgur.com','ifunny.co','ebaumsworld.com','funnyjunk.com','cheezburger.com'],
  news:          ['cnn.com','bbc.com','nytimes.com','foxnews.com','theguardian.com','washingtonpost.com','huffpost.com','dailymail.co.uk','usatoday.com'],
};

export async function seedBuiltins(): Promise<void> {
  const db = await getDatabase();
  for (const cat of BUILTIN) {
    await db.execute(
      `INSERT OR IGNORE INTO block_categories (id, label, emoji, color, is_custom, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
      [cat.id, cat.label, cat.emoji, cat.color, cat.is_custom, cat.sort_order]
    );
    for (const domain of BUILTIN_DOMAINS[cat.id] ?? []) {
      await db.execute(
        `INSERT OR IGNORE INTO block_domains (id, category_id, domain) VALUES ($1,$2,$3)`,
        [generateId(), cat.id, domain]
      );
    }
  }
}

export async function getAllCategories(): Promise<DbCategory[]> {
  const db = await getDatabase();
  const cats = await db.select<Omit<DbCategory, 'domains'>[]>(
    `SELECT * FROM block_categories ORDER BY sort_order, label`
  );
  const result: DbCategory[] = [];
  for (const cat of cats) {
    const rows = await db.select<{ domain: string }[]>(
      `SELECT domain FROM block_domains WHERE category_id = $1 ORDER BY domain`,
      [cat.id]
    );
    result.push({ ...cat, domains: rows.map(r => r.domain) });
  }
  return result;
}

export async function createCategory(label: string, emoji: string, color: string): Promise<DbCategory> {
  const db = await getDatabase();
  const id = generateId();
  const sort = Date.now();
  await db.execute(
    `INSERT INTO block_categories (id, label, emoji, color, is_custom, sort_order) VALUES ($1,$2,$3,$4,1,$5)`,
    [id, label, emoji, color, sort]
  );
  return { id, label, emoji, color, is_custom: 1, sort_order: sort, domains: [] };
}

export async function updateCategory(id: string, label: string, emoji: string, color: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE block_categories SET label=$1, emoji=$2, color=$3 WHERE id=$4`,
    [label, emoji, color, id]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(`DELETE FROM block_categories WHERE id=$1`, [id]);
}

export async function addDomain(categoryId: string, domain: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `INSERT OR IGNORE INTO block_domains (id, category_id, domain) VALUES ($1,$2,$3)`,
    [generateId(), categoryId, domain]
  );
}

export async function removeDomain(categoryId: string, domain: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `DELETE FROM block_domains WHERE category_id=$1 AND domain=$2`,
    [categoryId, domain]
  );
}

export async function setDomainsForCategory(categoryId: string, domains: string[]): Promise<void> {
  const db = await getDatabase();
  await db.execute(`DELETE FROM block_domains WHERE category_id=$1`, [categoryId]);
  for (const domain of domains) {
    await db.execute(
      `INSERT OR IGNORE INTO block_domains (id, category_id, domain) VALUES ($1,$2,$3)`,
      [generateId(), categoryId, domain]
    );
  }
}
