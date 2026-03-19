import { BackgroundThemeKey, PremiumFontKey } from '@/data/types';
import { ImageSourcePropType } from 'react-native';

// RevenueCat
export const REVENUECAT_API_KEY = 'appl_ztDnaUZoxdvOCUoQGYtZjTxccLn';
export const REVENUECAT_ENTITLEMENT_ID = 'pro';

export interface FontOption {
  key: PremiumFontKey;
  displayName: string;
  fontFamily: string | null; // null for system font
  isPremium: boolean;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    key: 'shuffle',
    displayName: 'Shuffle',
    fontFamily: null, // Dynamically chosen per quote
    isPremium: false,
  },
  {
    key: 'system',
    displayName: 'System',
    fontFamily: null,
    isPremium: false,
  },
  {
    key: 'indie-flower',
    displayName: 'Indie Flower',
    fontFamily: 'IndieFlower_400Regular',
    isPremium: true,
  },
  {
    key: 'permanent-marker',
    displayName: 'Permanent Marker',
    fontFamily: 'PermanentMarker_400Regular',
    isPremium: false,
  },
  {
    key: 'luckiest-guy',
    displayName: 'Luckiest Guy',
    fontFamily: 'LuckiestGuy_400Regular',
    isPremium: true,
  },
  {
    key: 'playfair-display',
    displayName: 'Playfair Display',
    fontFamily: 'PlayfairDisplay_400Regular',
    isPremium: true,
  },
  {
    key: 'caveat',
    displayName: 'Caveat',
    fontFamily: 'Caveat_400Regular',
    isPremium: false,
  },
  {
    key: 'merriweather',
    displayName: 'Merriweather',
    fontFamily: 'Merriweather_400Regular',
    isPremium: true,
  },
  {
    key: 'cormorant-garamond',
    displayName: 'Cormorant Garamond',
    fontFamily: 'CormorantGaramond_400Regular',
    isPremium: true,
  },
  {
    key: 'satisfy',
    displayName: 'Satisfy',
    fontFamily: 'Satisfy_400Regular',
    isPremium: true,
  },
  {
    key: 'josefin-sans',
    displayName: 'Josefin Sans',
    fontFamily: 'JosefinSans_400Regular',
    isPremium: false,
  },
  {
    key: 'pacifico',
    displayName: 'Pacifico',
    fontFamily: 'Pacifico_400Regular',
    isPremium: true,
  },
];

// Free font family names for free-user shuffle
export const FREE_FONTS = [
  'PermanentMarker_400Regular',
  'Caveat_400Regular',
  'JosefinSans_400Regular',
];

// All Google font family names for premium shuffle
export const PREMIUM_FONTS = [
  'IndieFlower_400Regular',
  'PermanentMarker_400Regular',
  'LuckiestGuy_400Regular',
  'PlayfairDisplay_400Regular',
  'Caveat_400Regular',
  'Merriweather_400Regular',
  'CormorantGaramond_400Regular',
  'Satisfy_400Regular',
  'JosefinSans_400Regular',
  'Pacifico_400Regular',
];

export interface BackgroundTheme {
  key: BackgroundThemeKey;
  displayName: string;
  gradientColors: readonly [string, string, string, string];
  textColor: string;
  secondaryTextColor: string;
  isPremium: boolean;
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    key: 'default',
    displayName: 'Sky Blue',
    gradientColors: ['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0'],
    textColor: '#3A6B80',
    secondaryTextColor: '#5A8BA8',
    isPremium: false,
  },
  {
    key: 'classic-rose',
    displayName: 'Rose',
    gradientColors: ['#F0C8E0', '#F2DCE9', '#F7EEF4', '#F5F5F0'],
    textColor: '#803A6B',
    secondaryTextColor: '#A85A8B',
    isPremium: false,
  },
  {
    key: 'classic-amber',
    displayName: 'Amber',
    gradientColors: ['#F0E0C8', '#F2E9DC', '#F7F4EE', '#F5F5F0'],
    textColor: '#806B3A',
    secondaryTextColor: '#A88B5A',
    isPremium: false,
  },
  {
    key: 'classic-lavender',
    displayName: 'Lavender',
    gradientColors: ['#D4C8F0', '#E2DCF2', '#F0EEF7', '#F5F5F0'],
    textColor: '#5A3A80',
    secondaryTextColor: '#7B5AA8',
    isPremium: false,
  },
  {
    key: 'classic-mint',
    displayName: 'Mint',
    gradientColors: ['#C8F0D8', '#DCF2E4', '#EEF7F0', '#F5F5F0'],
    textColor: '#3A806B',
    secondaryTextColor: '#5AA88B',
    isPremium: false,
  },
];

// Image-based background themes
export interface ImageBackgroundTheme {
  key: BackgroundThemeKey;
  displayName: string;
  imageSource: ImageSourcePropType;
  textColor: string;
  secondaryTextColor: string;
  isPremium: boolean;
}

export const IMAGE_THEMES: ImageBackgroundTheme[] = [
  {
    key: 'desert-dunes',
    displayName: 'Desert Dunes',
    imageSource: require('@/assets/themes/pexels-ahmad-basem-739226667-30190590.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'misty-forest',
    displayName: 'Misty Forest',
    imageSource: require('@/assets/themes/pexels-aliaksandra-babko-2148943026-30388784.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: false,
  },
  {
    key: 'autumn-leaves',
    displayName: 'Autumn Leaves',
    imageSource: require('@/assets/themes/pexels-ellie-burgin-1661546-29640873.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'mountain-lake',
    displayName: 'Mountain Lake',
    imageSource: require('@/assets/themes/pexels-free-nature-stock-1376766.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'starry-night',
    displayName: 'Starry Night',
    imageSource: require('@/assets/themes/pexels-griffinw-1635439.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: false,
  },
  {
    key: 'golden-sunset',
    displayName: 'Golden Sunset',
    imageSource: require('@/assets/themes/pexels-jaime-reimer-1376930-9899914.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'ocean-waves',
    displayName: 'Ocean Waves',
    imageSource: require('@/assets/themes/pexels-jobzky-8022691.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'northern-lights',
    displayName: 'Northern Lights',
    imageSource: require('@/assets/themes/pexels-martin-mariani-2162253-3801458.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'foggy-morning',
    displayName: 'Foggy Morning',
    imageSource: require('@/assets/themes/pexels-merlin-11280356.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: false,
  },
  {
    key: 'purple-sky',
    displayName: 'Purple Sky',
    imageSource: require('@/assets/themes/pexels-rlldied-10997873.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'snowy-peaks',
    displayName: 'Snowy Peaks',
    imageSource: require('@/assets/themes/pexels-schets-creatives-689602434-30486091.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'cozy-candles',
    displayName: 'Cozy Candles',
    imageSource: require('@/assets/themes/pexels-shvetsa-4014875.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'theme-13',
    displayName: 'Theme 13',
    imageSource: require('@/assets/themes/pexels-ruslan-ataev-830130344-19897117.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: false,
  },
  {
    key: 'theme-14',
    displayName: 'Theme 14',
    imageSource: require('@/assets/themes/pexels-mehmed-lukavackic-2159281936-35915585.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
  {
    key: 'theme-15',
    displayName: 'Theme 15',
    imageSource: require('@/assets/themes/pexels-vikki-145486223-10420371.jpg'),
    textColor: '#FFFFFF',
    secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
    isPremium: true,
  },
];

// Combined type for any theme (gradient or image)
export type AnyBackgroundTheme = BackgroundTheme | ImageBackgroundTheme;

// Helper to check if a theme is an image theme
export function isImageTheme(theme: AnyBackgroundTheme): theme is ImageBackgroundTheme {
  return 'imageSource' in theme;
}

// All themes combined (gradients first, then images)
export const ALL_THEMES: AnyBackgroundTheme[] = [...BACKGROUND_THEMES, ...IMAGE_THEMES];

export const DEFAULT_PREMIUM_SETTINGS = {
  selectedFont: 'system' as PremiumFontKey,
  selectedBackground: 'default' as BackgroundThemeKey,
};
