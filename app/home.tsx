import { PremiumButton } from '@/components/premium-button';
import { ProfileButton } from '@/components/profile-button';
import { QuoteFeed } from '@/components/quote-feed';
import { useQuotes } from '@/hooks/use-quotes';
import { useAppContext } from '@/context/app-context';
import { hasSeenSwipeHint, markSwipeHintSeen } from '@/utils/storage';
import { getTodayDateString } from '@/utils/streak';
import { RiveFileFactory, RiveView, useRive } from '@rive-app/react-native';
import { GlassContainer } from '@/components/glass-container';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import allQuotes from '@/data/quotes';
import { shuffle } from '@/utils/shuffle';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RiveFile = Awaited<ReturnType<typeof RiveFileFactory.fromSource>>;

const BASE_BUTTON_SIZE = 44;
const BASE_SCREEN_WIDTH = 375;
const MAX_SCREEN_WIDTH = 430;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { dispatch } = useAppContext();
  const scale = 1 + ((Math.min(screenWidth, MAX_SCREEN_WIDTH) - BASE_SCREEN_WIDTH) / (MAX_SCREEN_WIDTH - BASE_SCREEN_WIDTH)) * 0.3;
  const buttonSize = Math.round(BASE_BUTTON_SIZE * scale);
  const { quoteId: initialQuoteId } = useLocalSearchParams<{ quoteId: string }>();

  const [activeWidgetData, setActiveWidgetData] = useState({
    id: initialQuoteId || null,
    key: Date.now(),
  });

  // Handle subsequent taps while the app is already open
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      if (parsed.queryParams?.quoteId) {
        setActiveWidgetData({
          id: parsed.queryParams.quoteId as string,
          key: Date.now(),
        });
      }
    });
    return () => sub.remove();
  }, []);

  const baseQuotes = useQuotes(undefined, undefined, true);

  const quotes = useMemo(() => {
    if (!activeWidgetData.id) return baseQuotes;
    const tappedQuote = allQuotes.find((q) => q.id === activeWidgetData.id);
    if (!tappedQuote) return baseQuotes;
    const reshuffled = shuffle(baseQuotes);
    return [tappedQuote, ...reshuffled.filter((q) => q.id !== activeWidgetData.id)];
  }, [baseQuotes, activeWidgetData.key]);

  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [riveFile, setRiveFile] = useState<RiveFile | null>(null);
  const { riveViewRef, setHybridRef } = useRive();

  const cardHeight = screenHeight;

  // Record daily open for streak tracking
  useEffect(() => {
    dispatch({ type: 'RECORD_DAILY_OPEN', payload: getTodayDateString() });
  }, [dispatch]);

  useEffect(() => {
    hasSeenSwipeHint().then((seen) => {
      if (!seen) {
        setShowSwipeHint(true);
      }
    });
  }, []);

  useEffect(() => {
    RiveFileFactory.fromSource(require('@/assets/rive/argo.riv'), undefined)
      .then(setRiveFile)
      .catch((err) => console.warn('Failed to load Rive file:', err));
  }, []);

  // Fire onBlink trigger every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      riveViewRef?.triggerInput('onBlink');
      riveViewRef?.playIfNeeded();
    }, 5000);
    return () => clearInterval(interval);
  }, [riveViewRef]);

  const handleHintDismissed = useCallback(() => {
    markSwipeHintSeen();
  }, []);

  const handleSwipe = useCallback(() => {
    riveViewRef?.triggerInput('OnSwipe');
    riveViewRef?.playIfNeeded();
  }, [riveViewRef]);

  const handleLike = useCallback(() => {
    riveViewRef?.triggerInput('OnLike');
    riveViewRef?.playIfNeeded();
  }, [riveViewRef]);

  return (
    <View style={styles.container}>
      <QuoteFeed
        key={activeWidgetData.key}
        quotes={quotes}
        cardHeight={cardHeight}
        showSwipeHint={showSwipeHint}
        onHintDismissed={handleHintDismissed}
        onSwipe={handleSwipe}
        onLike={handleLike}
      />

      {/* Premium icon - top right */}
      <PremiumButton
        style={[styles.premiumButton, { top: insets.top + 12 }]}
      />

      {/* Rive animation - bottom left */}
      {riveFile && (
        <Pressable
          style={[styles.riveContainer, { bottom: insets.bottom + 20 }]}
          onPress={() => router.push('/streak-detail')}
        >
          <GlassContainer
            style={[styles.glassButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
          >
            <RiveView
              hybridRef={setHybridRef}
              file={riveFile}
              stateMachineName="State Machine 1"
              autoPlay
              style={{ width: buttonSize + 2, height: buttonSize + 2 }}
            />
          </GlassContainer>
        </Pressable>
      )}

      {/* Profile icon - bottom right */}
      <ProfileButton
        style={[styles.profileButton, { bottom: insets.bottom + 20 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  premiumButton: {
    position: 'absolute',
    right: 16,
  },
  profileButton: {
    position: 'absolute',
    right: 16,
  },
  riveContainer: {
    position: 'absolute',
    left: 16,
  },
  glassButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
