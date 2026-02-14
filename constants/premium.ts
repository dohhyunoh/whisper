import { BackgroundThemeKey, PremiumFontKey } from '@/data/types';
import { ImageSourcePropType } from 'react-native';

// Toggle this to false for v1.1+ to disable early bird grandfathering
export const IS_EARLY_BIRD_RELEASE = true;

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
    isPremium: true,
  },
  {
    key: 'luckiest-guy',
    displayName: 'Luckiest Guy',
    fontFamily: 'LuckiestGuy_400Regular',
    isPremium: true,
  },
  {
    key: 'shuffle',
    displayName: 'Shuffle',
    fontFamily: null, // Dynamically chosen per quote
    isPremium: true,
  },
];

// Just the Google font family names for shuffle to pick from
export const PREMIUM_FONTS = [
  'IndieFlower_400Regular',
  'PermanentMarker_400Regular',
  'LuckiestGuy_400Regular',
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
    displayName: 'Classic',
    gradientColors: ['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0'],
    textColor: '#3A6B80',
    secondaryTextColor: '#5A8BA8',
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
    isPremium: true,
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
    isPremium: true,
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
    isPremium: true,
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
    isPremium: true,
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
