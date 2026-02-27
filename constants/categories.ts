import { Category } from '@/data/types';

export interface SubcategoryInfo {
  key: string;
  label: string;
}

export interface CategoryInfo {
  key: Category;
  label: string;
  subcategories?: SubcategoryInfo[];
}

export const SELF_LOVE_SUBCATEGORIES: SubcategoryInfo[] = [
  { key: 'self-worth', label: 'Self-Worth' },
  { key: 'body-positivity', label: 'Body Positivity' },
  { key: 'mental-health', label: 'Mental Health' },
  { key: 'rest-recharge', label: 'Rest & Recharge' },
];

export const RELATIONSHIP_SUBCATEGORIES: SubcategoryInfo[] = [
  { key: 'dating', label: 'Dating' },
  { key: 'partnership', label: 'Partnership' },
  { key: 'friendship', label: 'Friendship' },
  { key: 'breakups', label: 'Breakups' },
  { key: 'family', label: 'Family' },
  { key: 'attracting-love', label: 'Attracting Love' },
];

export const EMPOWERMENT_SUBCATEGORIES: SubcategoryInfo[] = [
  { key: 'career', label: 'Career' },
  { key: 'overcoming-obstacles', label: 'Overcoming Obstacles' },
  { key: 'financial-independence', label: 'Financial Independence' },
  { key: 'finding-voice', label: 'Finding Voice' },
];

export const RELIGION_SUBCATEGORIES: SubcategoryInfo[] = [
  { key: 'general-spirituality', label: 'General Spirituality' },
  { key: 'christianity', label: 'Christianity' },
  { key: 'islam', label: 'Islam' },
  { key: 'hinduism', label: 'Hinduism' },
  { key: 'buddhism', label: 'Buddhism' },
];

export const MOOD_BOOSTER_SUBCATEGORIES: SubcategoryInfo[] = [
  { key: 'daily-motivation', label: 'Daily Motivation' },
  { key: 'calm', label: 'Calm' },
  { key: 'gratitude', label: 'Gratitude' },
];

export const CATEGORIES: CategoryInfo[] = [
  { key: 'self-love', label: 'Self-Love & Wellness', subcategories: SELF_LOVE_SUBCATEGORIES },
  { key: 'relationships', label: 'Love & Relationships', subcategories: RELATIONSHIP_SUBCATEGORIES },
  { key: 'empowerment', label: 'Empowerment & Career', subcategories: EMPOWERMENT_SUBCATEGORIES },
  { key: 'religion', label: 'Faith & Spirituality', subcategories: RELIGION_SUBCATEGORIES },
  { key: 'mood-boosters', label: 'Mood Boosters', subcategories: MOOD_BOOSTER_SUBCATEGORIES },
];


// Premium locking - categories that are always free
export const FREE_CATEGORIES: Category[] = ['empowerment', 'mood-boosters'];

// Categories that require premium (except for daily rotation)
export const LOCKED_CATEGORIES: Category[] = ['self-love', 'relationships', 'religion'];

// Daily rotation order (index = day % 3)
export const DAILY_UNLOCK_ORDER: Category[] = ['self-love', 'relationships', 'religion'];

export function getTodayUnlockedCategory(): Category {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return DAILY_UNLOCK_ORDER[dayOfYear % 3];
}

export function isCategoryPremium(category: Category): boolean {
  return LOCKED_CATEGORIES.includes(category);
}
