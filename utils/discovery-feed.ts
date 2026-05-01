import { DiscoveryCard } from '@/components/discovery-row';
import { CATEGORIES, CategoryInfo, SubcategoryInfo } from '@/constants/categories';
import { Category, Quote, UserData } from '@/data/types';

// ---------------------------------------------------------------------------
// Weather mood → adjective + category mappings (5 per weather for daily rotation)
// ---------------------------------------------------------------------------

const weatherCategories: Record<string, { category: Category; subcategory: string }[]> = {
  Clear: [
    { category: 'mood-boosters', subcategory: 'gratitude' },
    { category: 'mood-boosters', subcategory: 'daily-motivation' },
    { category: 'mood-boosters', subcategory: 'poetry' },
    { category: 'self-love', subcategory: 'body-positivity' },
    { category: 'mood-boosters', subcategory: 'philosophy' },
  ],
  Cloudy: [
    { category: 'self-love', subcategory: 'mental-health' },
    { category: 'self-love', subcategory: 'rest-recharge' },
    { category: 'mood-boosters', subcategory: 'calm' },
    { category: 'mood-boosters', subcategory: 'philosophy' },
    { category: 'self-love', subcategory: 'self-worth' },
  ],
  Stormy: [
    { category: 'self-love', subcategory: 'mental-health' },
    { category: 'mood-boosters', subcategory: 'calm' },
    { category: 'mood-boosters', subcategory: 'manifestation' },
    { category: 'mood-boosters', subcategory: 'philosophy' },
    { category: 'self-love', subcategory: 'rest-recharge' },
  ],
  Windy: [
    { category: 'mood-boosters', subcategory: 'calm' },
    { category: 'self-love', subcategory: 'rest-recharge' },
    { category: 'mood-boosters', subcategory: 'philosophy' },
    { category: 'relationships', subcategory: 'family' },
    { category: 'relationships', subcategory: 'friendship' },
  ],
};

// ---------------------------------------------------------------------------
// Identity role → category mappings (5 per role for daily rotation)
// ---------------------------------------------------------------------------

const roleCategories: Record<string, { category: Category; subcategory: string }[]> = {
  'The Careerist': [
    { category: 'empowerment', subcategory: 'career' },
    { category: 'empowerment', subcategory: 'financial-independence' },
    { category: 'empowerment', subcategory: 'overcoming-obstacles' },
    { category: 'empowerment', subcategory: 'finding-voice' },
    { category: 'mood-boosters', subcategory: 'daily-motivation' },
  ],
  'The Caretaker': [
    { category: 'self-love', subcategory: 'rest-recharge' },
    { category: 'relationships', subcategory: 'family' },
    { category: 'relationships', subcategory: 'friendship' },
    { category: 'self-love', subcategory: 'mental-health' },
    { category: 'mood-boosters', subcategory: 'gratitude' },
  ],
  'The People Pleaser': [
    { category: 'empowerment', subcategory: 'finding-voice' },
    { category: 'self-love', subcategory: 'self-worth' },
    { category: 'relationships', subcategory: 'partnership' },
    { category: 'self-love', subcategory: 'mental-health' },
    { category: 'relationships', subcategory: 'friendship' },
  ],
  'The Perfectionist': [
    { category: 'self-love', subcategory: 'self-worth' },
    { category: 'mood-boosters', subcategory: 'calm' },
    { category: 'self-love', subcategory: 'body-positivity' },
    { category: 'mood-boosters', subcategory: 'philosophy' },
    { category: 'self-love', subcategory: 'rest-recharge' },
  ],
  'The Critic': [
    { category: 'self-love', subcategory: 'self-worth' },
    { category: 'self-love', subcategory: 'body-positivity' },
    { category: 'mood-boosters', subcategory: 'gratitude' },
    { category: 'mood-boosters', subcategory: 'philosophy' },
    { category: 'self-love', subcategory: 'mental-health' },
  ],
  'The Strong One': [
    { category: 'self-love', subcategory: 'rest-recharge' },
    { category: 'empowerment', subcategory: 'overcoming-obstacles' },
    { category: 'self-love', subcategory: 'mental-health' },
    { category: 'relationships', subcategory: 'letting-go' },
    { category: 'mood-boosters', subcategory: 'calm' },
  ],
};

// ---------------------------------------------------------------------------
// Heart row — personalized by heartStatus + heartDetail
// ---------------------------------------------------------------------------

interface HeartRowSpec {
  title: string;
  subtitle: string;
  mappings: { category: Category; subcategory: string }[];
}

function heartRowFor(user: UserData): HeartRowSpec | null {
  const status = user.heartStatus;
  const detail = user.heartDetail;

  if (status === 'An ex-partner') {
    if (detail === 'Letting go') {
      return {
        title: 'Closing the chapter',
        subtitle: 'For the strength to walk away',
        mappings: [
          { category: 'relationships', subcategory: 'letting-go' },
          { category: 'self-love', subcategory: 'self-worth' },
          { category: 'empowerment', subcategory: 'finding-voice' },
        ],
      };
    }
    if (detail === 'Looking back') {
      return {
        title: 'When you miss them',
        subtitle: 'For the nights that feel heavy',
        mappings: [
          { category: 'relationships', subcategory: 'letting-go' },
          { category: 'mood-boosters', subcategory: 'manifestation' },
          { category: 'self-love', subcategory: 'self-worth' },
        ],
      };
    }
    // Fresh wound / Scarring over / unspecified
    return {
      title: 'Tender hearts',
      subtitle: 'Soft words for the mend',
      mappings: [
        { category: 'relationships', subcategory: 'letting-go' },
        { category: 'self-love', subcategory: 'mental-health' },
        { category: 'self-love', subcategory: 'rest-recharge' },
      ],
    };
  }

  if (['A new partner', 'A long-term partner'].includes(status)) {
    const rough = ['Stormy seas', 'Distant'].includes(detail);
    return rough
      ? {
          title: 'Weathering it together',
          subtitle: 'For the hard stretches of love',
          mappings: [
            { category: 'relationships', subcategory: 'partnership' },
            { category: 'mood-boosters', subcategory: 'calm' },
            { category: 'empowerment', subcategory: 'finding-voice' },
          ],
        }
      : {
          title: 'In love, together',
          subtitle: 'For the person you come home to',
          mappings: [
            { category: 'relationships', subcategory: 'partnership' },
            { category: 'relationships', subcategory: 'dating' },
            { category: 'mood-boosters', subcategory: 'gratitude' },
          ],
        };
  }

  if (status === 'Just me') {
    return {
      title: 'Beautifully solo',
      subtitle: 'For the season of you',
      mappings: [
        { category: 'self-love', subcategory: 'self-worth' },
        { category: 'relationships', subcategory: 'attracting-love' },
        { category: 'mood-boosters', subcategory: 'manifestation' },
      ],
    };
  }

  if (status === 'My family/friends') {
    return {
      title: 'The people around you',
      subtitle: 'For the bonds that carry you',
      mappings: [
        { category: 'relationships', subcategory: 'family' },
        { category: 'relationships', subcategory: 'friendship' },
        { category: 'mood-boosters', subcategory: 'gratitude' },
      ],
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Pick 3 items from a pool of 5, rotating daily.
 * Stable within a single day, different combination each day.
 */
function getDailyPicks<T>(pool: T[], dayOfYear: number, count = 3): T[] {
  const n = pool.length;
  const picks: T[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(pool[(dayOfYear + i) % n]);
  }
  return picks;
}

/** Seeded Fisher-Yates shuffle — same seed = same order, different seed = different order. */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    const j = Math.floor(r * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function findCategory(key: Category): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

function findSubcategory(cat: CategoryInfo, subKey: string): SubcategoryInfo | undefined {
  return cat.subcategories?.find((s) => s.key === subKey);
}

function getQuoteCount(allQuotes: Quote[], category: Category, subcategory?: string): number {
  return allQuotes.filter(
    (q) => q.category === category && (!subcategory || q.subcategory === subcategory)
  ).length;
}

/**
 * Pick a preview quote that rotates daily. The `salt` shifts the index so
 * different rows/cards don't all land on the same quote on a given day.
 */
function getPreviewQuote(allQuotes: Quote[], category: Category, subcategory?: string, salt = 0): Quote | undefined {
  const filtered = allQuotes.filter(
    (q) => q.category === category && (!subcategory || q.subcategory === subcategory)
  );
  if (filtered.length === 0) return undefined;
  return filtered[(getDayOfYear() + salt) % filtered.length];
}

function buildCard(
  allQuotes: Quote[],
  categoryKey: Category,
  subcategoryKey: string | undefined,
  isCategoryLocked: (cat: Category) => boolean,
  isSubcategoryLocked: (cat: Category, sub: string) => boolean,
  interests: string[],
  quoteSalt = 0,
): DiscoveryCard | null {
  const cat = findCategory(categoryKey);
  if (!cat) return null;
  const sub = subcategoryKey ? findSubcategory(cat, subcategoryKey) : undefined;

  const isLocked = subcategoryKey
    ? isSubcategoryLocked(categoryKey, subcategoryKey)
    : isCategoryLocked(categoryKey);

  const interestKey = subcategoryKey ? `${categoryKey}:${subcategoryKey}` : categoryKey;
  const isFollowed =
    interests.includes(interestKey) ||
    (!subcategoryKey && interests.some((i) => i.startsWith(categoryKey + ':'))) ||
    (!!subcategoryKey && interests.includes(categoryKey));

  const previewQuote = getPreviewQuote(allQuotes, categoryKey, subcategoryKey, quoteSalt);

  return {
    category: cat,
    subcategory: sub,
    previewQuote,
    quoteCount: getQuoteCount(allQuotes, categoryKey, subcategoryKey),
    isLocked,
    isFollowed,
  };
}

// ---------------------------------------------------------------------------
// Row builder
// ---------------------------------------------------------------------------

export interface DiscoveryRowData {
  title: string;
  subtitle?: string;
  items: DiscoveryCard[];
}

export function buildDiscoveryRows(
  user: UserData,
  allQuotes: Quote[],
  isCategoryLocked: (cat: Category) => boolean,
  isSubcategoryLocked: (cat: Category, sub: string) => boolean,
  todayUnlocked?: { category: Category; subcategory: string },
): DiscoveryRowData[] {
  const rows: DiscoveryRowData[] = [];
  const shownKeys = new Set<string>();
  const interests = user.interests ?? [];
  const dayOfYear = getDayOfYear();

  const addCards = (
    mappings: { category: Category; subcategory?: string }[],
    salt = 0,
    dedup = false,
  ): DiscoveryCard[] => {
    const cards: DiscoveryCard[] = [];
    const localSeen = new Set<string>();
    for (let i = 0; i < mappings.length; i++) {
      const m = mappings[i];
      const key = `${m.category}:${m.subcategory ?? ''}`;
      if (localSeen.has(key)) continue;
      if (dedup && shownKeys.has(key)) continue;
      localSeen.add(key);
      shownKeys.add(key);
      const card = buildCard(allQuotes, m.category, m.subcategory, isCategoryLocked, isSubcategoryLocked, interests, salt + i);
      if (card) cards.push(card);
    }
    return cards;
  };

  // -----------------------------------------------------------------------
  // Row 1: The Daily Hook — 3 picked from 5 weather-mapped subcategories
  // -----------------------------------------------------------------------
  const rawWeather = user.weatherMood || 'Cloudy';
  const weather = rawWeather.charAt(0).toUpperCase() + rawWeather.slice(1).toLowerCase();

  const weatherPool = weatherCategories[weather] || weatherCategories.Cloudy;
  const hookMappings = getDailyPicks(weatherPool, dayOfYear);

  const name = user.name;
  const hookTitle = name
    ? `Curated for ${name}'s ${weather} Mind`
    : `Curated for a ${weather} Mind`;

  rows.push({
    title: hookTitle,
    subtitle: 'Matched to your weather check-in',
    items: addCards(hookMappings, dayOfYear * 3),
  });

  // -----------------------------------------------------------------------
  // Row 2: Heart row — personalized by heartStatus + heartDetail
  // -----------------------------------------------------------------------
  const heart = heartRowFor(user);
  if (heart) {
    const heartCards = addCards(heart.mappings, dayOfYear * 5);
    if (heartCards.length > 0) {
      rows.push({ title: heart.title, subtitle: heart.subtitle, items: heartCards });
    }
  }

  // -----------------------------------------------------------------------
  // Row 3: The Deep Identity — 3 picked from 5 role-mapped subcategories
  // -----------------------------------------------------------------------
  const role = user.heaviestRole || '';
  const rolePool = roleCategories[role] || [];
  if (rolePool.length > 0) {
    const rolePicks = getDailyPicks(rolePool, dayOfYear);
    const roleCards = addCards(rolePicks, dayOfYear * 7);
    if (roleCards.length > 0) {
      rows.push({
        title: `Fuel for ${role}`,
        subtitle: 'Matched to the role you carry most',
        items: roleCards,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Row 4: Today's Free Unlock (free users only)
  // -----------------------------------------------------------------------
  if (todayUnlocked) {
    const todayCat = findCategory(todayUnlocked.category);
    if (todayCat) {
      const todaySub = findSubcategory(todayCat, todayUnlocked.subcategory);
      const todayLabel = todaySub?.label ?? todayUnlocked.subcategory;

      const todayMappings: { category: Category; subcategory?: string }[] = [
        { category: todayUnlocked.category, subcategory: todayUnlocked.subcategory },
      ];
      if (todayCat.subcategories) {
        for (const sib of todayCat.subcategories) {
          if (sib.key !== todayUnlocked.subcategory) {
            todayMappings.push({ category: todayCat.key, subcategory: sib.key });
          }
        }
      }

      const todayCards = addCards(todayMappings, dayOfYear * 11);
      if (todayCards.length > 0) {
        rows.push({
          title: `Unlocked Today: ${todayLabel}`,
          subtitle: `From ${todayCat.label} — unlocked for 24 hours`,
          items: todayCards,
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Row 5: Exploration — remaining subcategories, seeded shuffle daily
  // -----------------------------------------------------------------------
  const explorationMappings: { category: Category; subcategory?: string }[] = [];
  for (const cat of CATEGORIES) {
    if (!cat.subcategories) continue;
    for (const sub of cat.subcategories) {
      explorationMappings.push({ category: cat.key, subcategory: sub.key });
    }
  }
  const shuffled = seededShuffle(explorationMappings, dayOfYear);
  const explorationCards = addCards(shuffled, dayOfYear * 13, true);
  if (explorationCards.length > 0) {
    rows.push({
      title: 'Explore New Paths',
      subtitle: 'Categories waiting for you',
      items: explorationCards,
    });
  }

  return rows;
}
