import StarSvg from '@/assets/svg/welcome/StarSvg';
import SunSvg from '@/assets/svg/welcome/SunSvg';
import WreathSvg from '@/assets/svg/welcome/WreathSvg';
import { useAppContext } from '@/context/app-context';
import { Events, posthog } from '@/utils/posthog';
import { RiveFileFactory, RiveView, useRive } from '@rive-app/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RestWelcomeScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const name = state.user?.name || null;

  const [riveFile, setRiveFile] = useState<Awaited<ReturnType<typeof RiveFileFactory.fromSource>> | null>(null);
  const { riveViewRef, setHybridRef } = useRive();

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(15);
  const subtitleOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'rest_welcome' });
  }, []);

  useEffect(() => {
    RiveFileFactory.fromSource(require('@/assets/rive/argo.riv'), undefined)
      .then(setRiveFile)
      .catch((err) => console.warn('Failed to load Rive file:', err));
  }, []);

  useEffect(() => {
    if (riveFile && riveViewRef) {
      const timeout = setTimeout(() => {
        riveViewRef.triggerInput('hi');
        riveViewRef.playIfNeeded();
      }, 2200);
      return () => clearTimeout(timeout);
    }
  }, [riveFile, riveViewRef]);

  useEffect(() => {
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));
    subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    btnOpacity.value = withDelay(1800, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      {/* Stars — upper left */}
      <View style={[styles.starsContainer, { top: insets.top + 130 * s, left: 30 * s }]} pointerEvents="none">
        <StarSvg size={80 * s} color="rgba(90,139,168,1)" />
      </View>

      {/* Sun — upper right */}
      <View style={[styles.sunContainer, { top: insets.top + 10 * s, right: -10 * s }]} pointerEvents="none">
        <SunSvg size={160 * s} color="rgba(90,139,168,1)" />
      </View>

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 32 * s }]}>
        <View style={styles.center}>
          {/* Wreath behind mascot */}
          <View style={styles.mascotWrapper}>
            <View style={[styles.wreathContainer, { transform: [{ rotate: '25deg' }, { translateX: -10 * s }] }]} pointerEvents="none">
              <WreathSvg size={250 * s} color="rgba(90,139,168,1)" />
            </View>
            {riveFile && (
              <Pressable
                style={styles.riveWrapper}
                onPress={() => {
                  riveViewRef?.triggerInput('hi');
                  riveViewRef?.playIfNeeded();
                }}
              >
                <RiveView
                  hybridRef={setHybridRef}
                  file={riveFile}
                  stateMachineName="State Machine 2"
                  autoPlay
                  style={{ width: 180 * s, height: 180 * s, backgroundColor: 'transparent' }}
                />
              </Pressable>
            )}
          </View>
          <Animated.Text style={[styles.title, { fontSize: 28 * s, marginTop: 40 * s }, titleStyle]}>
            Nice to meet you{name ? `, ${name}` : ''}
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { fontSize: 15 * s, marginTop: 16 * s }, subtitleStyle]}>
            Let's understand your world a little better.
          </Animated.Text>
        </View>

        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s, paddingHorizontal: 40 * s },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/onboarding/heart-check')}
          >
            <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', color: '#5A8BA8', textAlign: 'center' },
  subtitle: { fontWeight: '300', color: '#6B8F9E', textAlign: 'center' },
  btnWrapper: { width: '100%', marginBottom: 20 },
  button: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(184, 217, 232, 0.4)',
    alignItems: 'center',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  buttonPressed: { transform: [{ translateY: 2 }] },
  buttonText: { fontWeight: '700', color: '#5A8BA8', letterSpacing: 0.5 },
  starsContainer: { position: 'absolute' },
  sunContainer: { position: 'absolute' },
  mascotWrapper: { alignItems: 'center', justifyContent: 'center' },
  wreathContainer: { position: 'absolute' },
  riveWrapper: { zIndex: 1 },
});
