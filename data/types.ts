export type Category =
  | 'self-love'
  | 'relationships'
  | 'empowerment'
  | 'religion'
  | 'mood-boosters';

export type SelfLoveSub = 'self-worth' | 'body-positivity' | 'mental-health' | 'rest-recharge';
export type RelationshipSub = 'dating' | 'partnership' | 'friendship' | 'letting-go' | 'family' | 'attracting-love';
export type EmpowermentSub = 'career' | 'overcoming-obstacles' | 'financial-independence' | 'finding-voice';
export type ReligionSub = 'general-spirituality' | 'christianity' | 'islam' | 'hinduism' | 'buddhism';
export type MoodBoosterSub = 'daily-motivation' | 'calm' | 'gratitude' | 'manifestation' | 'philosophy' | 'poetry';
export type SubCategory = SelfLoveSub | RelationshipSub | EmpowermentSub | ReligionSub | MoodBoosterSub | null;

export type ToneTag = 'gentle' | 'direct' | 'playful';

export interface Quote {
  id: string;
  text: string;
  author: string;
  source?: string;
  category: Category;
  subcategory?: SubCategory;
  tone?: ToneTag;
  tags?: string[];
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
  // Phase 2: Emotional Deep Dive
  primaryEmotion: string;
  emotionRoot: string;
  narrative: string;
  // Phase 3: Life & Love
  heartStatus: string;
  heartDetail: string;
  heaviestRole: string;
  lightSource: string;
  faithDetail: string;
  // Phase 4: What do you need
  whatHelps: string;
  wordsShape: string;
  quoteRitual: string;
  // Phase 5: The bridge
  appExpect: string;
  tonePreference: string;
  // Derived
  interests: string[];
}

export const defaultUserData: UserData = {
  name: '',
  gender: '',
  weatherMood: '',
  primaryEmotion: '',
  emotionRoot: '',
  narrative: '',
  heartStatus: '',
  heartDetail: '',
  heaviestRole: '',
  lightSource: '',
  faithDetail: '',
  whatHelps: '',
  wordsShape: '',
  quoteRitual: '',
  appExpect: '',
  tonePreference: '',
  interests: [],
};

// Premium types
export type PremiumStatus = 'premium_purchased' | 'standard_free';
export type PremiumFontKey = 'system' | 'indie-flower' | 'permanent-marker' | 'luckiest-guy' | 'playfair-display' | 'caveat' | 'merriweather' | 'cormorant-garamond' | 'satisfy' | 'josefin-sans' | 'pacifico' | 'shuffle';
export type BackgroundThemeKey =
  // Gradient themes
  | 'default'
  | 'classic-rose'
  | 'classic-amber'
  | 'classic-lavender'
  | 'classic-mint'
  // Custom user photos (custom-photo-0, custom-photo-1, etc.)
  | `custom-photo-${number}`
  // Shuffle mode (cycles through image themes per quote)
  | 'shuffle'
  // Image themes
  | 'desert-dunes' | 'misty-forest' | 'autumn-leaves' | 'mountain-lake'
  | 'starry-night' | 'golden-sunset' | 'ocean-waves' | 'northern-lights'
  | 'foggy-morning' | 'purple-sky' | 'snowy-peaks' | 'cozy-candles'
  | 'theme-13' | 'theme-14' | 'theme-15';

export interface WidgetSettings {
  includeFavorites: boolean;
  includeOwnQuotes: boolean;
}

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  includeFavorites: true,
  includeOwnQuotes: true,
};

export interface PremiumSettings {
  selectedFont: PremiumFontKey;
  selectedBackground: BackgroundThemeKey;
  customPhotoUri?: string; // deprecated, migrated to customPhotoUris
  customPhotoUris?: string[];
  shufflePools?: { name: string; themes: BackgroundThemeKey[] }[];
  activeShuffleIndex?: number;
  fontShufflePool?: PremiumFontKey[];
  widget?: WidgetSettings;
}

export interface PremiumState {
  status: PremiumStatus;
  settings: PremiumSettings;
}

export interface MoodHistoryEntry {
  date: string; // YYYY-MM-DD
  mood: string; // mood id, e.g. 'clear'
}

export interface AppState {
  user: UserData | null;
  onboardingComplete: boolean;
  likedIds: string[];
  ownQuotes: OwnQuote[];
  streakDates: string[];
  moodHistory: MoodHistoryEntry[];
  hydrated: boolean;
  premium: PremiumState;
  // Bumped on every deck swipe so the widget re-syncs against updated weights.
  swipeNonce: number;
}

export type AppAction =
  | { type: 'SET_USER'; payload: UserData }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'TOGGLE_LIKE'; payload: string }
  | { type: 'RECORD_SWIPE' }
  | { type: 'HYDRATE'; payload: { user: UserData | null; onboardingComplete: boolean; likedIds: string[]; ownQuotes: OwnQuote[]; streakDates: string[]; moodHistory: MoodHistoryEntry[]; premium: PremiumState } }
  | { type: 'SET_PREMIUM_STATUS'; payload: PremiumStatus }
  | { type: 'SET_PREMIUM_FONT'; payload: PremiumFontKey }
  | { type: 'SET_PREMIUM_BACKGROUND'; payload: BackgroundThemeKey }
  | { type: 'ADD_OWN_QUOTE'; payload: OwnQuote }
  | { type: 'EDIT_OWN_QUOTE'; payload: OwnQuote }
  | { type: 'REMOVE_OWN_QUOTE'; payload: string }
  | { type: 'RECORD_DAILY_OPEN'; payload: string }
  | { type: 'RECORD_DAILY_CHECKIN'; payload: { date: string; moodId: string; moodLabel: string } }
  | { type: 'SET_CUSTOM_PHOTO'; payload: string } // deprecated
  | { type: 'ADD_CUSTOM_PHOTOS'; payload: string[] }
  | { type: 'REMOVE_CUSTOM_PHOTO'; payload: number }
  | { type: 'SET_SHUFFLE_POOLS'; payload: { pools: { name: string; themes: BackgroundThemeKey[] }[]; activeIndex: number } }
  | { type: 'SET_FONT_SHUFFLE_POOL'; payload: PremiumFontKey[] }
  | { type: 'SET_WIDGET_SETTINGS'; payload: Partial<WidgetSettings> };
