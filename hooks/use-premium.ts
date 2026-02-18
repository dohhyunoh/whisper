import { useCallback, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import { BackgroundThemeKey, Category, PremiumFontKey } from '@/data/types';
import { ALL_THEMES, AnyBackgroundTheme, FONT_OPTIONS, FontOption, IMAGE_THEMES, ImageBackgroundTheme } from '@/constants/premium';
import { getTodayUnlockedCategory, isCategoryPremium } from '@/constants/categories';
import { hasPremiumAccess } from '@/utils/premium-check';

// Virtual theme object for shuffle mode
const SHUFFLE_THEME: AnyBackgroundTheme = {
  key: 'shuffle',
  displayName: 'Shuffle',
  gradientColors: ['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0'],
  textColor: '#FFFFFF',
  secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
  isPremium: true,
};

export function usePremium() {
  const { state, dispatch } = useAppContext();
  const { premium } = state;

  const isPremium = useMemo(() => hasPremiumAccess(premium.status), [premium.status]);

  const customPhotoTheme = useMemo((): ImageBackgroundTheme | null => {
    if (premium.settings.selectedBackground !== 'custom-photo' || !premium.settings.customPhotoUri) return null;
    return {
      key: 'custom-photo',
      displayName: 'My Photo',
      imageSource: { uri: premium.settings.customPhotoUri },
      textColor: '#FFFFFF',
      secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
      isPremium: true,
    };
  }, [premium.settings.selectedBackground, premium.settings.customPhotoUri]);

  const currentTheme = useMemo(() => {
    if (premium.settings.selectedBackground === 'shuffle') {
      return SHUFFLE_THEME;
    }
    if (customPhotoTheme) return customPhotoTheme;
    return ALL_THEMES.find((t) => t.key === premium.settings.selectedBackground) || ALL_THEMES[0];
  }, [premium.settings.selectedBackground, customPhotoTheme]);

  const currentFont = useMemo(() => {
    return FONT_OPTIONS.find((f) => f.key === premium.settings.selectedFont) || FONT_OPTIONS[0];
  }, [premium.settings.selectedFont]);

  const setFont = useCallback(
    (fontKey: PremiumFontKey) => {
      dispatch({ type: 'SET_PREMIUM_FONT', payload: fontKey });
    },
    [dispatch]
  );

  const setBackground = useCallback(
    (themeKey: BackgroundThemeKey) => {
      dispatch({ type: 'SET_PREMIUM_BACKGROUND', payload: themeKey });
    },
    [dispatch]
  );

  const setCustomPhoto = useCallback(
    (uri: string) => {
      dispatch({ type: 'SET_CUSTOM_PHOTO', payload: uri });
    },
    [dispatch]
  );

  const shufflePools = useMemo((): { name: string; themes: BackgroundThemeKey[] }[] => {
    const raw = premium.settings.shufflePools ?? [];
    // Migrate stale data from old format (array of arrays → array of objects)
    return raw.map((p, i) =>
      Array.isArray(p)
        ? { name: `Shuffle ${i + 1}`, themes: p as unknown as BackgroundThemeKey[] }
        : p
    );
  }, [premium.settings.shufflePools]);

  const activeShuffleIndex = premium.settings.activeShuffleIndex ?? 0;

  const activeShufflePool = useMemo((): BackgroundThemeKey[] => {
    const pools = premium.settings.shufflePools;
    if (!pools || pools.length === 0) return IMAGE_THEMES.map((t) => t.key);
    const pool = pools[activeShuffleIndex] ?? pools[0];
    // Guard against stale data from old format (array instead of object)
    if (Array.isArray(pool)) return pool as unknown as BackgroundThemeKey[];
    return pool.themes ?? IMAGE_THEMES.map((t) => t.key);
  }, [premium.settings.shufflePools, activeShuffleIndex]);

  const setShufflePools = useCallback(
    (pools: { name: string; themes: BackgroundThemeKey[] }[], activeIndex: number) => {
      dispatch({ type: 'SET_SHUFFLE_POOLS', payload: { pools, activeIndex } });
    },
    [dispatch]
  );

  const shuffleTheme = useCallback(() => {
    const currentKey = premium.settings.selectedBackground;
    const imageThemeKeys = IMAGE_THEMES.map((t) => t.key);
    const currentIndex = imageThemeKeys.indexOf(currentKey);
    const nextIndex = (currentIndex + 1) % imageThemeKeys.length;
    dispatch({ type: 'SET_PREMIUM_BACKGROUND', payload: imageThemeKeys[nextIndex] });
  }, [dispatch, premium.settings.selectedBackground]);

  const todayUnlockedCategory = useMemo(() => getTodayUnlockedCategory(), []);

  const isCategoryLocked = useCallback(
    (category: Category): boolean => {
      if (isPremium) return false;
      if (!isCategoryPremium(category)) return false;
      return category !== todayUnlockedCategory;
    },
    [isPremium, todayUnlockedCategory]
  );

  return {
    isPremium,
    status: premium.status,
    currentTheme,
    currentFont,
    setFont,
    setBackground,
    setCustomPhoto,
    customPhotoUri: premium.settings.customPhotoUri || null,
    shuffleTheme,
    shufflePools,
    activeShuffleIndex,
    activeShufflePool,
    setShufflePools,
    allThemes: ALL_THEMES as AnyBackgroundTheme[],
    allFonts: FONT_OPTIONS as FontOption[],
    isCategoryLocked,
    todayUnlockedCategory,
  };
}
