export type Category =
  | 'self-love'
  | 'relationships'
  | 'empowerment'
  | 'religion'
  | 'mood-boosters';

export type SelfLoveSub = 'self-worth' | 'body-positivity' | 'mental-health' | 'rest-recharge';
export type RelationshipSub = 'dating' | 'partnership' | 'friendship' | 'breakups' | 'family';
export type EmpowermentSub = 'career' | 'overcoming-obstacles' | 'financial-independence' | 'finding-voice';
export type ReligionSub = 'general-spirituality' | 'christianity' | 'islam' | 'hinduism' | 'buddhism';
export type MoodBoosterSub = 'daily-motivation' | 'humor' | 'calm' | 'gratitude';
export type SubCategory = SelfLoveSub | RelationshipSub | EmpowermentSub | ReligionSub | MoodBoosterSub | null;

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
  // Phase 1
  weatherMood: string;
  weatherSource: string;
  // Phase 2: Emotional Deep Dive
  primaryEmotion: string;
  emotionRoot: string;
  bodyCarry: string;
  narrative: string;
  // Phase 3: Life & Love
  heartStatus: string;
  heartDetail: string;
  heaviestRole: string;
  lightSource: string;
  faithDetail: string;
  // Phase 4: Preferences
  tonePreference: string;
  // Derived
  interests: string[];
  // Backward compat
  stuckReason: string;
  stuckResponse: string;
}

export const defaultUserData: UserData = {
  name: '',
  gender: '',
  weatherMood: '',
  weatherSource: '',
  primaryEmotion: '',
  emotionRoot: '',
  bodyCarry: '',
  narrative: '',
  heartStatus: '',
  heartDetail: '',
  heaviestRole: '',
  lightSource: '',
  faithDetail: '',
  tonePreference: '',
  interests: [],
  stuckReason: '',
  stuckResponse: '',
};

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
  streakDates: string[];
  hydrated: boolean;
  premium: PremiumState;
}

export type AppAction =
  | { type: 'SET_USER'; payload: UserData }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'TOGGLE_LIKE'; payload: string }
  | { type: 'HYDRATE'; payload: { user: UserData | null; onboardingComplete: boolean; likedIds: string[]; ownQuotes: OwnQuote[]; streakDates: string[]; premium: PremiumState } }
  | { type: 'SET_PREMIUM_STATUS'; payload: PremiumStatus }
  | { type: 'SET_PREMIUM_FONT'; payload: PremiumFontKey }
  | { type: 'SET_PREMIUM_BACKGROUND'; payload: BackgroundThemeKey }
  | { type: 'ADD_OWN_QUOTE'; payload: OwnQuote }
  | { type: 'REMOVE_OWN_QUOTE'; payload: string }
  | { type: 'RECORD_DAILY_OPEN'; payload: string };
