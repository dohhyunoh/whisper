import { Events, posthog } from '@/utils/posthog';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TrialReminderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'trial_reminder' });
    titleOpacity.value = withTiming(1, { duration: 600 });
    subtitleOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    iconOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: iconOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + height * 0.06,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 32 * s,
          },
        ]}
      >
        {/* Center content */}
        <View style={styles.center}>
          <Animated.Text
            style={[styles.title, { fontSize: 28 * s, lineHeight: 38 * s }, titleStyle]}
          >
            We’ll send you a gentle reminder before your {'\n'} trial wraps up
          </Animated.Text>

          <Animated.Text
            style={[styles.subtitle, { fontSize: 16 * s, marginTop: 12 * s }, subtitleStyle]}
          >
            No pressure. Just clarity
          </Animated.Text>

          <Animated.View
            style={[
              styles.iconContainer,
              {
                width: 100 * s,
                height: 100 * s,
                borderRadius: 50 * s,
                marginTop: 32 * s,
              },
              iconStyle,
            ]}
          >
            <Ionicons name="notifications-outline" size={48 * s} color="#3A6B80" />
          </Animated.View>
        </View>

        {/* Bottom button */}
        <Animated.View style={[styles.bottom, buttonStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/onboarding/paywall', params: { from: 'onboarding' } });
            }}
          >
            <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#3A6B80',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    color: '#5A8BA8',
    textAlign: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(58, 107, 128, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#5A8BA8',
    borderRadius: 100,
    alignItems: 'center',
    shadowColor: '#3A6B80',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
  },
  buttonText: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
