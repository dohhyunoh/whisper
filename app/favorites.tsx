import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ShareSheet } from '@/components/share-sheet';
import HeartIconSvg from '@/assets/svg/share_icon/HeartIconSvg';
import ShareIconSvg from '@/assets/svg/share_icon/ShareIconSvg';
import { useLikes } from '@/hooks/use-likes';
import { useQuotesByIds } from '@/hooks/use-quotes';
import { usePremium } from '@/hooks/use-premium';
import { ALL_THEMES, BACKGROUND_THEMES, IMAGE_THEMES, isImageTheme } from '@/constants/premium';
import { Quote } from '@/data/types';

const SCREEN = Dimensions.get('window');

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { likedIds, toggleLike, isLiked } = useLikes();
  const favoriteQuotes = useQuotesByIds(likedIds);
  const { currentTheme, currentFont, activeShufflePool, activeFontShufflePool, customPhotoUris } = usePremium();

  const [shareQuote, setShareQuote] = useState<Quote | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const isShuffleMode = currentTheme.key === 'shuffle';

  const shuffledImageTheme = useMemo(() => {
    if (!isShuffleMode || !shareQuote) return null;
    const pool = activeShufflePool.length > 0 ? activeShufflePool : IMAGE_THEMES.map((t) => t.key);
    const hash = shareQuote.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
  }, [isShuffleMode, shareQuote, activeShufflePool, customPhotoUris]);

  const activeImageTheme = useMemo(() => {
    if (isShuffleMode && shuffledImageTheme && isImageTheme(shuffledImageTheme)) return shuffledImageTheme;
    if (isImageTheme(currentTheme)) return currentTheme;
    return null;
  }, [currentTheme, isShuffleMode, shuffledImageTheme]);

  const gradientColors = useMemo(() => {
    const t = (isShuffleMode && shuffledImageTheme) ? shuffledImageTheme : currentTheme;
    if ('gradientColors' in t) return t.gradientColors;
    return BACKGROUND_THEMES[0].gradientColors;
  }, [currentTheme, isShuffleMode, shuffledImageTheme]);

  const activeTheme = activeImageTheme || (isShuffleMode && shuffledImageTheme ? shuffledImageTheme : currentTheme);
  const textColor = activeTheme.textColor;
  const secondaryColor = activeTheme.secondaryTextColor;

  const fontFamily = useMemo(() => {
    if (!shareQuote) return currentFont.fontFamily;
    if (currentFont.key === 'shuffle') {
      const hash = shareQuote.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return activeFontShufflePool[hash % activeFontShufflePool.length];
    }
    return currentFont.fontFamily;
  }, [currentFont, shareQuote, activeFontShufflePool]);

  const handleCaptureImage = useCallback(async (): Promise<string | null> => {
    try {
      if (viewShotRef.current) return await captureRef(viewShotRef);
    } catch {}
    return null;
  }, []);

  const openShare = (quote: Quote) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareQuote(quote);
    // Allow the offscreen capture card to render before opening the sheet
    setTimeout(() => setSheetVisible(true), 50);
  };

  const closeShare = () => {
    setSheetVisible(false);
    setTimeout(() => setShareQuote(null), 300);
  };

  const quoteContent = shareQuote ? (
    <View style={styles.captureInner}>
      <Text
        style={[styles.captureQuote, { color: textColor }, fontFamily && { fontFamily }]}
      >
        &ldquo;{shareQuote.text}&rdquo;
      </Text>
      <Text style={[styles.captureAuthor, { color: textColor }, fontFamily && { fontFamily }]}>
        — {shareQuote.author}
      </Text>
      {shareQuote.source && (
        <Text style={[styles.captureSource, { color: secondaryColor }, fontFamily && { fontFamily }]}>
          {shareQuote.source}
        </Text>
      )}
    </View>
  ) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color="#3A6B80" />
        </Pressable>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {favoriteQuotes.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="heart" size={48} color="#C5D5DC" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>Tap the heart on a quote to save it here</Text>
          </View>
        ) : (
          favoriteQuotes.map((quote) => (
            <Pressable
              key={quote.id}
              style={styles.quoteCard}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/category-feed', params: { favorites: 'true', favoriteId: quote.id } });
              }}
            >
              <Text style={styles.quoteText}>&ldquo;{quote.text}&rdquo;</Text>
              {quote.author && (
                <Text style={styles.quoteAuthor}>— {quote.author}</Text>
              )}
              {quote.source && (
                <Text style={styles.quoteSource}>{quote.source}</Text>
              )}
              <View style={styles.cardFooter}>
                <View style={styles.actionButtons}>
                  <Pressable onPress={() => openShare(quote)} hitSlop={12}>
                    <ShareIconSvg size={22} color="#5A8BA8" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (isLiked(quote.id)) {
                        Alert.alert(
                          'Remove from Favorites',
                          'Are you sure you want to remove this quote from your favorites?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => toggleLike(quote.id) },
                          ]
                        );
                      } else {
                        toggleLike(quote.id);
                      }
                    }}
                    hitSlop={12}
                  >
                    <HeartIconSvg
                      filled={isLiked(quote.id)}
                      size={22}
                      color={isLiked(quote.id) ? '#E85D75' : '#5A8BA8'}
                    />
                  </Pressable>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#7B9AAA" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Offscreen capture card — matches home screen look */}
      {shareQuote && (
        <View style={styles.offscreen} pointerEvents="none">
          <ViewShot ref={viewShotRef} style={styles.captureCard}>
            {activeImageTheme ? (
              <ImageBackground
                source={activeImageTheme.imageSource}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              >
                <View style={styles.imageOverlay} />
                {quoteContent}
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={gradientColors}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFill}
              >
                {quoteContent}
              </LinearGradient>
            )}
          </ViewShot>
        </View>
      )}

      {shareQuote && (
        <ShareSheet
          visible={sheetVisible}
          onClose={closeShare}
          quote={shareQuote}
          onCaptureImage={handleCaptureImage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3A6B80',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A6B80',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7B9AAA',
    textAlign: 'center',
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  quoteText: {
    fontSize: 15,
    color: '#3A6B80',
    lineHeight: 22,
  },
  quoteAuthor: {
    fontSize: 13,
    color: '#5A8BA8',
    fontWeight: '500',
  },
  quoteSource: {
    fontSize: 12,
    color: '#7B9AAA',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  offscreen: {
    position: 'absolute',
    left: -SCREEN.width * 2,
    top: 0,
    width: SCREEN.width,
    height: SCREEN.height,
  },
  captureCard: {
    width: SCREEN.width,
    height: SCREEN.height,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  captureInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  captureQuote: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 38,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  captureAuthor: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  captureSource: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
