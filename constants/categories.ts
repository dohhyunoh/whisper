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

export const RELATIONSHIP_SUBCATEGORIES: SubcategoryInfo[] = [
  { key: 'dating', label: 'Dating' },
  { key: 'breaking-up', label: 'Breaking Up' },
  { key: 'single', label: 'Single' },
];

export const HEALTH_SUBCATEGORIES: SubcategoryInfo[] = [
  { key: 'mental', label: 'Mental' },
  { key: 'physical', label: 'Physical' },
];

export const RELIGION_SUBCATEGORIES: SubcategoryInfo[] = [
  { key: 'christianity', label: 'Christianity' },
  { key: 'islam', label: 'Islam' },
  { key: 'hinduism', label: 'Hinduism' },
  { key: 'buddhism', label: 'Buddhism' },
];

export const CATEGORIES: CategoryInfo[] = [
  { key: 'motivation', label: 'Motivation' },
  { key: 'philosophy', label: 'Philosophy' },
  { key: 'health', label: 'Health', subcategories: HEALTH_SUBCATEGORIES },
  { key: 'relationships', label: 'Relationships', subcategories: RELATIONSHIP_SUBCATEGORIES },
  { key: 'religion', label: 'Religion', subcategories: RELIGION_SUBCATEGORIES },
];

export const CATEGORY_GRADIENTS: Record<Category, readonly [string, string, string, string]> = {
  motivation: ['#F0E0C8', '#F2E9DC', '#F7F4EE', '#F5F5F0'],
  philosophy: ['#C8E0F0', '#DCE9F2', '#EEF4F7', '#F5F5F0'],
  health: ['#C8F0C8', '#DCF2DC', '#EEF7EE', '#F5F5F0'],
  relationships: ['#F0C8D8', '#F2DCE4', '#F7EEF0', '#F5F5F0'],
  religion: ['#D4C8F0', '#E2DCF2', '#F0EEF7', '#F5F5F0'],
};

// Premium locking - categories that are always free
export const FREE_CATEGORIES: Category[] = ['motivation', 'philosophy'];

// Categories that require premium (except for daily rotation)
export const LOCKED_CATEGORIES: Category[] = ['relationships', 'religion', 'health'];

// Daily rotation order (index = day % 3)
export const DAILY_UNLOCK_ORDER: Category[] = ['relationships', 'religion', 'health'];

export function getTodayUnlockedCategory(): Category {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return DAILY_UNLOCK_ORDER[dayOfYear % 3];
}

export function isCategoryPremium(category: Category): boolean {
  return LOCKED_CATEGORIES.includes(category);
}
