import { GlassContainer } from '@/components/glass-container';
import { ProfileButton } from '@/components/profile-button';
import { SwipeDeck } from '@/components/swipe-deck';
import { Toast } from '@/components/toast';
import { useAppContext } from '@/context/app-context';
import allQuotes from '@/data/quotes';
import { Quote } from '@/data/types';
import { getOrBuildTodayDeck } from '@/utils/deck-engine';
import { hasPremiumAccess } from '@/utils/premium-check';
import { getTodayDateString } from '@/utils/streak';
import { applyWeeklyDecayIfNeeded, hasSeenDeckHint } from '@/utils/tag-weights';
import { RiveFileFactory, RiveView, useRive } from '@rive-app/react-native';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RiveFile = Awaited<ReturnType<typeof RiveFileFactory.fromSource>>;

const BASE_BUTTON_SIZE = 44;
const BASE_SCREEN_WIDTH = 375;
const MAX_SCREEN_WIDTH = 430;

const quoteList: Quote[] = allQuotes as Quote[];

export default function DailyDeckScreen() {
  const { state } = useAppContext();
  // Premium-only backstop: covers in-session/direct navigation that bypasses the
  // launch gate in index.tsx (onboarding completion, paywall dismissal, etc.).
  if (state.hydrated && !hasPremiumAccess(state.premium.status, state.premium.trialEndsAt)) {
    return state.premium.trialEndsAt != null
      ? <Redirect href="/gift-ended" />
      : <Redirect href="/subscription-required" />;
  }
  return <DailyDeckContent />;
}

function DailyDeckContent() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { state } = useAppContext();

  const scale = 1 + ((Math.min(screenWidth, MAX_SCREEN_WIDTH) - BASE_SCREEN_WIDTH) / (MAX_SCREEN_WIDTH - BASE_SCREEN_WIDTH)) * 0.3;
  const buttonSize = Math.round(BASE_BUTTON_SIZE * scale);

  const [riveFile, setRiveFile] = useState<RiveFile | null>(null);
  const { riveViewRef, setHybridRef } = useRive();

  // Returning users (hint already seen) get the buttons immediately.
  const initiallyVisible = useState(() => hasSeenDeckHint())[0];
  const buttonsOpacity = useSharedValue(initiallyVisible ? 1 : 0);
  const [buttonsVisible, setButtonsVisible] = useState(initiallyVisible);

  const handleFirstSwipe = useCallback(() => {
    if (buttonsVisible) return;
    setButtonsVisible(true);
    buttonsOpacity.value = withTiming(1, { duration: 500 });
  }, [buttonsVisible]);

  const buttonsAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const [toastVisible, setToastVisible] = useState(false);
  const handleHeartTapped = useCallback(() => {
    setToastVisible(false);
    // Re-arm in next tick so the Toast effect re-runs even on rapid taps.
    requestAnimationFrame(() => setToastVisible(true));
  }, []);

  const deck = useMemo(() => {
    applyWeeklyDecayIfNeeded();
    // Today's check-in mood drives the mood bonus; the onboarding emotion is
    // only the fallback before the first check-in of the day.
    const todayMood = state.moodHistory.find((e) => e.date === getTodayDateString())?.mood;
    return getOrBuildTodayDeck({
      allQuotes: quoteList,
      mood: todayMood ?? state.user?.primaryEmotion,
      interests: state.user?.interests,
      tonePreference: state.user?.tonePreference,
      likedIds: state.likedIds,
    });
  }, [state.user, state.likedIds, state.moodHistory]);

  const quotes = useMemo(() => {
    const map = new Map(quoteList.map((q) => [q.id, q]));
    return deck.quoteIds.map((id) => map.get(id)).filter((q): q is Quote => !!q);
  }, [deck]);

  useEffect(() => {
    RiveFileFactory.fromSource(require('@/assets/rive/argo.riv'), undefined)
      .then(setRiveFile)
      .catch((err) => console.warn('Failed to load Rive file:', err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      riveViewRef?.triggerInput('onBlink');
      riveViewRef?.playIfNeeded();
    }, 5000);
    return () => clearInterval(interval);
  }, [riveViewRef]);

  return (
    <View style={styles.container}>
      <SwipeDeck
        quotes={quotes}
        height={screenHeight}
        onFirstSwipe={handleFirstSwipe}
        onHeartTapped={handleHeartTapped}
      />

      <Toast
        message="Added to favorites"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        topInset={insets.top}
      />

      <Animated.View
        style={[StyleSheet.absoluteFill, buttonsAnimStyle]}
        pointerEvents={buttonsVisible ? 'box-none' : 'none'}
      >
        {riveFile && (
          <Pressable
            style={[styles.riveContainer, { bottom: insets.bottom + 20 }]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/streak-detail');
            }}
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

        <ProfileButton
          style={[styles.profileButton, { bottom: insets.bottom + 20 }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
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
