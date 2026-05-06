import { LikeButton } from '@/components/like-button';
import { ShareButton } from '@/components/share-button';
import { ALL_THEMES, BACKGROUND_THEMES, IMAGE_THEMES, isImageTheme } from '@/constants/premium';
import { Quote } from '@/data/types';
import { useLikes } from '@/hooks/use-likes';
import { usePremium } from '@/hooks/use-premium';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import ViewShot, { captureRef } from 'react-native-view-shot';

interface QuoteCardProps {
  quote: Quote;
  height: number;
  onLike?: () => void;
}

export function QuoteCard({ quote, height, onLike }: QuoteCardProps) {
  const { isLiked, toggleLike } = useLikes();
  const { currentTheme, currentFont, activeShufflePool, activeFontShufflePool, customPhotoUris } = usePremium();
  const opacity = useSharedValue(0);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const tapX = useSharedValue(0);
  const tapY = useSharedValue(0);

  // Track where the quote area ends so we can position buttons below it
  const [quoteBottomY, setQuoteBottomY] = useState(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const handleDoubleTap = useCallback(() => {
    // Only trigger like if not already liked
    if (!isLiked(quote.id)) {
      toggleLike(quote.id);
      onLike?.();
    }
    // Always show heart animation on double-tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withSpring(1.2, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8 }),
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 200 })
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 0 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 200 })
    );
  }, [isLiked, toggleLike, quote.id]);

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      tapX.value = event.x;
      tapY.value = event.y;
      runOnJS(handleDoubleTap)();
    });

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    left: tapX.value - 30,
    top: tapY.value - 30,
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Determine if we're using shuffle mode for backgrounds
  const isShuffleMode = currentTheme.key === 'shuffle';

  // Get shuffled theme when in shuffle mode (from user-curated pool)
  const shuffledImageTheme = useMemo(() => {
    if (!isShuffleMode) return null;
    const pool = activeShufflePool.length > 0 ? activeShufflePool : IMAGE_THEMES.map((t) => t.key);
    const hash = quote.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pickedKey = pool[hash % pool.length];
    if (pickedKey.startsWith('custom-photo-')) {
      const idx = parseInt(pickedKey.replace('custom-photo-', ''), 10);
      const uri = customPhotoUris[idx];
      if (uri) {
        return {
          key: pickedKey as any,
          displayName: 'My Photo',
          imageSource: { uri },
          textColor: '#FFFFFF',
          secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
          isPremium: true,
        };
      }
    }
    return ALL_THEMES.find((t) => t.key === pickedKey) || IMAGE_THEMES[0];
  }, [isShuffleMode, quote.id, activeShufflePool, customPhotoUris]);

  // Check if current theme is an image theme (or shuffle picked an image theme)
  const isImageBackground = useMemo(() => {
    if (isShuffleMode) return shuffledImageTheme ? isImageTheme(shuffledImageTheme) : false;
    return isImageTheme(currentTheme);
  }, [currentTheme, isShuffleMode, shuffledImageTheme]);

  // Get the actual image theme to use (either current or shuffled)
  const activeImageTheme = useMemo(() => {
    if (isShuffleMode && shuffledImageTheme && isImageTheme(shuffledImageTheme)) {
      return shuffledImageTheme;
    }
    if (isImageTheme(currentTheme)) {
      return currentTheme;
    }
    return null;
  }, [currentTheme, isShuffleMode, shuffledImageTheme]);

  const defaultTheme = BACKGROUND_THEMES[0];

  // Determine gradient colors from selected theme (or shuffled gradient theme)
  const gradientColors = useMemo(() => {
    const activeThemeForGradient = (isShuffleMode && shuffledImageTheme) ? shuffledImageTheme : currentTheme;
    if ('gradientColors' in activeThemeForGradient) {
      return activeThemeForGradient.gradientColors;
    }
    return defaultTheme.gradientColors;
  }, [currentTheme, isShuffleMode, shuffledImageTheme]);

  // Determine text colors based on theme (use active image/gradient theme for shuffle mode)
  const activeTheme = activeImageTheme || (isShuffleMode && shuffledImageTheme ? shuffledImageTheme : currentTheme);
  const textColor = activeTheme.textColor;
  const secondaryColor = activeTheme.secondaryTextColor;
  const tertiaryColor = activeTheme.secondaryTextColor;

  // Determine font family: shuffle picks randomly per quote, otherwise use selected font
  const fontFamily = useMemo(() => {
    if (currentFont.key === 'shuffle') {
      const hash = quote.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const index = hash % activeFontShufflePool.length;
      return activeFontShufflePool[index];
    }
    return currentFont.fontFamily;
  }, [currentFont, quote.id, activeFontShufflePool]);

  const viewShotRef = useRef<ViewShot>(null);

  const handleCaptureImage = useCallback(async (): Promise<string | null> => {
    try {
      if (viewShotRef.current) {
        return await captureRef(viewShotRef);
      }
    } catch {}
    return null;
  }, []);

  const handleQuoteAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const { y, height: h } = e.nativeEvent.layout;
    setQuoteBottomY(y + h);
  }, []);

  const quoteFontSize = 26;
  const quoteLineHeight = 38;

  // Quote text only — inside ViewShot for capture
  const quoteContent = (
    <Animated.View style={[styles.inner, fadeStyle]}>
      <View style={styles.quoteArea} onLayout={handleQuoteAreaLayout}>
        <Text
          style={[
            styles.quoteText,
            { color: textColor, fontSize: quoteFontSize, lineHeight: quoteLineHeight },
            fontFamily && { fontFamily },
          ]}
        >
          "{quote.text}"
        </Text>
        <Text style={[styles.author, { color: textColor }, fontFamily && { fontFamily }]}>
          — {quote.author}
        </Text>
        {quote.source && (
          <Text style={[styles.source, { color: secondaryColor }, fontFamily && { fontFamily }]}>
            {quote.source}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  // Action buttons — positioned absolutely, outside ViewShot
  const actionButtons = quoteBottomY > 0 ? (
    <Animated.View
      style={[styles.actions, { position: 'absolute', top: quoteBottomY + 32, left: 0, right: 0 }, fadeStyle]}
      pointerEvents="box-none"
    >
      <ShareButton quote={quote} color={textColor} onCaptureImage={handleCaptureImage} />
      <LikeButton
        liked={isLiked(quote.id)}
        onToggle={() => {
          const wasLiked = isLiked(quote.id);
          toggleLike(quote.id);
          if (!wasLiked) onLike?.();
        }}
        color={textColor}
      />
    </Animated.View>
  ) : null;

  if (isImageBackground && activeImageTheme) {
    return (
      <GestureDetector gesture={doubleTapGesture}>
        <Animated.View style={[styles.container, { height }]}>
          <ViewShot ref={viewShotRef} style={StyleSheet.absoluteFill}>
            <ImageBackground
              source={activeImageTheme.imageSource}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            >
              <View style={styles.imageOverlay} />
              {quoteContent}
            </ImageBackground>
          </ViewShot>

          {actionButtons}

          <Animated.View style={[styles.heartOverlay, heartAnimatedStyle]}>
            <Ionicons name="heart" size={60} color="#FF6B8A" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={doubleTapGesture}>
      <View style={[styles.container, { height }]}>
        <ViewShot ref={viewShotRef} style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={gradientColors}
            locations={[0, 0.3, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          >
            {quoteContent}
          </LinearGradient>
        </ViewShot>

        {actionButtons}

        <Animated.View style={[styles.heartOverlay, heartAnimatedStyle]}>
          <Ionicons name="heart" size={60} color="#FF6B8A" />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  quoteArea: {
    gap: 16,
    width: '100%',
  },
  quoteText: {
    fontSize: 26,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 38,
  },
  author: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  source: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartOverlay: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});
