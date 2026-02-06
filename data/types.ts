export type Category =
  | 'motivation'
  | 'philosophy'
  | 'health'
  | 'relationships'
  | 'religion';

export type RelationshipSub = 'dating' | 'breaking-up' | 'single' | 'other';
export type HealthSub = 'mental' | 'physical';
export type ReligionSub = 'christianity' | 'islam' | 'hinduism' | 'buddhism' | 'other';
export type SubCategory = RelationshipSub | HealthSub | ReligionSub | null;

export interface Quote {
  id: string;
  text: string;
  author: string;
  source?: string;
  category: Category;
  subcategory?: SubCategory;
}

export interface OwnQuote {
  id: string;
  text: string;
  author?: string;
  source?: string;
  createdAt: number;
}

export interface UserData {
  name: string;
  gender: string;
  interests: string[];
  stuckReason: string;
  stuckResponse: string;
}

// Premium types
export type PremiumStatus = 'grandfathered_premium' | 'premium_purchased' | 'standard_free';
export type PremiumFontKey = 'system' | 'indie-flower' | 'permanent-marker' | 'luckiest-guy' | 'shuffle';
export type BackgroundThemeKey =
  // Gradient themes
  | 'default'
  // Shuffle mode (cycles through image themes per quote)
  | 'shuffle'
  // Image themes
  | 'desert-dunes' | 'misty-forest' | 'autumn-leaves' | 'mountain-lake'
  | 'starry-night' | 'golden-sunset' | 'ocean-waves' | 'northern-lights'
  | 'foggy-morning' | 'purple-sky' | 'snowy-peaks' | 'cozy-candles'
  | 'theme-13' | 'theme-14' | 'theme-15';

export interface PremiumSettings {
  selectedFont: PremiumFontKey;
  selectedBackground: BackgroundThemeKey;
}

export interface PremiumState {
  status: PremiumStatus;
  settings: PremiumSettings;
}

export interface AppState {
  user: UserData | null;
  onboardingComplete: boolean;
  likedIds: string[];
  ownQuotes: OwnQuote[];
  hydrated: boolean;
  premium: PremiumState;
}

export type AppAction =
  | { type: 'SET_USER'; payload: UserData }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'TOGGLE_LIKE'; payload: string }
  | { type: 'HYDRATE'; payload: { user: UserData | null; onboardingComplete: boolean; likedIds: string[]; ownQuotes: OwnQuote[]; premium: PremiumState } }
  | { type: 'SET_PREMIUM_STATUS'; payload: PremiumStatus }
  | { type: 'SET_PREMIUM_FONT'; payload: PremiumFontKey }
  | { type: 'SET_PREMIUM_BACKGROUND'; payload: BackgroundThemeKey }
  | { type: 'ADD_OWN_QUOTE'; payload: OwnQuote }
  | { type: 'REMOVE_OWN_QUOTE'; payload: string };
