import { PremiumButton } from '@/components/premium-button';
import { ProfileButton } from '@/components/profile-button';
import { QuoteFeed } from '@/components/quote-feed';
import { useQuotes } from '@/hooks/use-quotes';
import { useAppContext } from '@/context/app-context';
import { hasSeenSwipeHint, markSwipeHintSeen } from '@/utils/storage';
import { getTodayDateString } from '@/utils/streak';
import { RiveFileFactory, RiveView, useRive } from '@rive-app/react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
  const quotes = useQuotes(undefined, undefined, true);
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
          style={[styles.riveContainer, { bottom: insets.bottom + 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
          onPress={() => router.push('/streak-detail')}
        >
          <BlurView intensity={80} tint="light" style={styles.blur}>
            <RiveView
              hybridRef={setHybridRef}
              file={riveFile}
              stateMachineName="State Machine 1"
              autoPlay
              style={{ width: buttonSize + 2, height: buttonSize + 2 }}
            />
          </BlurView>
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
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 20, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  blur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
