import { useAppContext } from '@/context/app-context';
import { Events, posthog } from '@/utils/posthog';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RestAcknowledgeScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const name = state.user?.name || null;

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(15);
  const subtitleOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'rest_acknowledge' });
  }, []);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    titleTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    btnOpacity.value = withDelay(1400, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
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
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 32 * s }]}>
        <View style={styles.center}>
          <Animated.Text style={[styles.title, { fontSize: 28 * s }, titleStyle]}>
            We are listening{name ? `, ${name}` : ''}.
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { fontSize: 15 * s, marginTop: 16 * s }, subtitleStyle]}>
            Now let's talk about how that feels.
          </Animated.Text>
        </View>

        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s, paddingHorizontal: 40 * s },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/onboarding/primary-emotion')}
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
});
