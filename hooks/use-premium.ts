import { ALL_THEMES, AnyBackgroundTheme, FONT_OPTIONS, FontOption, FREE_FONTS, IMAGE_THEMES, ImageBackgroundTheme, PREMIUM_FONTS } from '@/constants/premium';
import { useAppContext } from '@/context/app-context';
import { BackgroundThemeKey, PremiumFontKey } from '@/data/types';
import { hasPremiumAccess } from '@/utils/premium-check';
import { useCallback, useMemo } from 'react';

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

  // Migrate old single customPhotoUri to customPhotoUris array
  const customPhotoUris = useMemo((): string[] => {
    const uris = premium.settings.customPhotoUris ?? [];
    if (uris.length === 0 && premium.settings.customPhotoUri) {
      return [premium.settings.customPhotoUri];
    }
    return uris;
  }, [premium.settings.customPhotoUris, premium.settings.customPhotoUri]);

  const customPhotoTheme = useMemo((): ImageBackgroundTheme | null => {
    const bg = premium.settings.selectedBackground;
    let idx: number;
    if ((bg as string) === 'custom-photo') {
      // Legacy key — treat as index 0
      idx = 0;
    } else if (bg.startsWith('custom-photo-')) {
      idx = parseInt(bg.replace('custom-photo-', ''), 10);
    } else {
      return null;
    }
    const uri = customPhotoUris[idx];
    if (!uri) return null;
    return {
      key: `custom-photo-${idx}` as BackgroundThemeKey,
      displayName: 'My Photo',
      imageSource: { uri },
      textColor: '#FFFFFF',
      secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
      isPremium: true,
    };
  }, [premium.settings.selectedBackground, customPhotoUris]);

  const currentTheme = useMemo(() => {
    if (isPremium) {
      if (premium.settings.selectedBackground === 'shuffle') {
        return SHUFFLE_THEME;
      }
      if (customPhotoTheme) return customPhotoTheme;
    }
    const theme = ALL_THEMES.find((t) => t.key === premium.settings.selectedBackground);
    if (theme && (isPremium || !theme.isPremium)) return theme;
    return ALL_THEMES[0];
  }, [premium.settings.selectedBackground, customPhotoTheme, isPremium]);

  const currentFont = useMemo(() => {
    const font = FONT_OPTIONS.find((f) => f.key === premium.settings.selectedFont);
    if (font && (isPremium || !font.isPremium)) return font;
    return FONT_OPTIONS[0];
  }, [premium.settings.selectedFont, isPremium]);

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

  const addCustomPhotos = useCallback(
    (uris: string[]) => {
      dispatch({ type: 'ADD_CUSTOM_PHOTOS', payload: uris });
    },
    [dispatch]
  );

  const removeCustomPhoto = useCallback(
    (index: number) => {
      dispatch({ type: 'REMOVE_CUSTOM_PHOTO', payload: index });
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

  // Font shuffle pool: user's selected fonts for font shuffle mode
  const activeFontShufflePool = useMemo((): string[] => {
    const saved = premium.settings.fontShufflePool;
    const allPool = isPremium ? PREMIUM_FONTS : FREE_FONTS;
    if (!saved || saved.length === 0) return allPool;
    // Map font keys to font family names, filtering to what the user has access to
    const mapped = saved
      .map((key) => FONT_OPTIONS.find((f) => f.key === key)?.fontFamily)
      .filter((f): f is string => f != null);
    return mapped.length > 0 ? mapped : allPool;
  }, [premium.settings.fontShufflePool, isPremium]);

  const setFontShufflePool = useCallback(
    (pool: PremiumFontKey[]) => {
      dispatch({ type: 'SET_FONT_SHUFFLE_POOL', payload: pool });
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

  return {
    isPremium,
    status: premium.status,
    currentTheme,
    currentFont,
    setFont,
    setBackground,
    setCustomPhoto,
    addCustomPhotos,
    removeCustomPhoto,
    customPhotoUri: premium.settings.customPhotoUri || null,
    customPhotoUris,
    shuffleTheme,
    shufflePools,
    activeShuffleIndex,
    activeShufflePool,
    setShufflePools,
    activeFontShufflePool,
    setFontShufflePool,
    allThemes: ALL_THEMES as AnyBackgroundTheme[],
    allFonts: FONT_OPTIONS as FontOption[],
  };
}
