import { useAppContext } from '@/context/app-context';
import { getFirstQuote } from '@/utils/first-quote';
import { requestPermissions, scheduleQuoteNotifications } from '@/utils/notifications';
import { checkTrialEligibility } from '@/utils/revenuecat';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { posthog, Events } from '@/utils/posthog';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const FALLBACK_QUOTE = '"Your thoughts create your reality." — Neale Donald Walsch';

function useTypewriter(text: string, delayMs: number, speedMs: number) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let index = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const startTimeout = setTimeout(() => {
      const tick = () => {
        index++;
        setDisplayed(text.slice(0, index));
        if (index < text.length) {
          timeout = setTimeout(tick, speedMs);
        }
      };
      tick();
    }, delayMs);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [text, delayMs, speedMs]);

  return displayed;
}

export default function NotificationPreviewScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const [perDay, setPerDay] = useState(3);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(21);

  // Pre-fetch trial eligibility in background so it's ready when user taps continue
  const trialEligibleRef = useRef<boolean>(false);
  useEffect(() => {
    checkTrialEligibility().then((eligible) => {
      trialEligibleRef.current = eligible;
    });
  }, []);

  // Animations
  const notifScale = useSharedValue(0.9);
  const notifOpacity = useSharedValue(0);
  const controlsOpacity = useSharedValue(0);
  const bottomOpacity = useSharedValue(0);

  const quoteText = getFirstQuote() || FALLBACK_QUOTE;
  const typedQuote = useTypewriter(quoteText, 800, 35);

  useEffect(() => {
    posthog.capture(Events.ONBOARDING_SCREEN_VIEWED, { screen_name: 'notification_preview' });
  }, []);

  useEffect(() => {
    notifOpacity.value = withTiming(1, { duration: 500 });
    notifScale.value = withSpring(1, { damping: 12, stiffness: 120 });

    controlsOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    bottomOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  const notifStyle = useAnimatedStyle(() => ({
    opacity: notifOpacity.value,
    transform: [{ scale: notifScale.value }],
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
  }));

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${ampm}`;
  };

  const handleContinue = async () => {
    const granted = await requestPermissions();

    if (granted) {
      await scheduleQuoteNotifications(
        perDay,
        startHour,
        endHour,
        state.user?.interests,
      );
    } else {
      Alert.alert(
        'Notifications disabled',
        'You can enable them later in Settings.',
      );
    }

    if (trialEligibleRef.current) {
      router.push('/onboarding/trial-offer');
    } else {
      router.push({ pathname: '/onboarding/paywall', params: { from: 'onboarding' } });
    }
  };

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={[styles.content, { paddingTop: insets.top + height * 0.06, paddingBottom: insets.bottom + 16, paddingHorizontal: 32 * s }]}>
        {/* Header */}
        <View style={[styles.top, { marginBottom: 24 * s }]}>
          <Text style={[styles.title, { fontSize: 34 * s, lineHeight: 42 * s }]}>
            When should we{'\n'}send your {state.user?.tonePreference ? state.user.tonePreference.toLowerCase() : ''} reminders?
          </Text>
          <Text style={[styles.subtitle, { fontSize: 15 * s, marginTop: 8 * s }]}>
            Thoughtful messages, to guide your mindset.
          </Text>
        </View>

        {/* Liquid glass notification */}
        <Animated.View style={[styles.notification, { padding: 14 * s, marginBottom: 24 * s }, notifStyle]}>
          <View style={styles.notifContent}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={[styles.appIcon, { width: 40 * s, height: 40 * s, borderRadius: 10 * s }]}
            />
            <View style={styles.notifTextArea}>
              <View style={styles.notifTitleRow}>
                <Text style={[styles.notifAppName, { fontSize: 14 * s }]}>Whisper</Text>
                <Text style={[styles.notifTime, { fontSize: 12 * s }]}>now</Text>
              </View>
              <Text style={[styles.notifBody, { fontSize: 13 * s, lineHeight: 18 * s }]}>
                {typedQuote}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Controls */}
        <Animated.View style={[styles.controls, { gap: 12 * s }, controlsStyle]}>
          {/* Per day */}
          <View style={[styles.controlRow, { paddingVertical: 12 * s, paddingHorizontal: 18 * s }]}>
            <Text style={[styles.controlLabel, { fontSize: 15 * s }]}>Quotes per day</Text>
            <View style={[styles.stepper, { gap: 12 * s }]}>
              <Pressable
                style={[styles.stepperBtn, { width: 30 * s, height: 30 * s, borderRadius: 15 * s }]}
                onPress={() => setPerDay((v) => Math.max(1, v - 1))}
              >
                <Text style={[styles.stepperBtnText, { fontSize: 18 * s }]}>−</Text>
              </Pressable>
              <Text style={[styles.stepperValue, { fontSize: 15 * s, minWidth: 60 * s }]}>{perDay}</Text>
              <Pressable
                style={[styles.stepperBtn, { width: 30 * s, height: 30 * s, borderRadius: 15 * s }]}
                onPress={() => setPerDay((v) => Math.min(10, v + 1))}
              >
                <Text style={[styles.stepperBtnText, { fontSize: 18 * s }]}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Time range — unified card */}
          <View style={styles.timeCard}>
            <View style={[styles.timeRow, { paddingVertical: 12 * s, paddingHorizontal: 18 * s }]}>
              <Text style={[styles.controlLabel, { fontSize: 15 * s }]}>Starting at</Text>
              <View style={[styles.stepper, { gap: 12 * s }]}>
                <Pressable
                  style={[styles.stepperBtn, { width: 30 * s, height: 30 * s, borderRadius: 15 * s }]}
                  onPress={() => setStartHour((v) => Math.max(0, v - 1))}
                >
                  <Text style={[styles.stepperBtnText, { fontSize: 18 * s }]}>−</Text>
                </Pressable>
                <Text style={[styles.stepperValue, { fontSize: 15 * s, minWidth: 60 * s }]}>{formatHour(startHour)}</Text>
                <Pressable
                  style={[styles.stepperBtn, { width: 30 * s, height: 30 * s, borderRadius: 15 * s }]}
                  onPress={() => setStartHour((v) => Math.min(endHour - 1, v + 1))}
                >
                  <Text style={[styles.stepperBtnText, { fontSize: 18 * s }]}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.timeDivider} />

            <View style={[styles.timeRow, { paddingVertical: 12 * s, paddingHorizontal: 18 * s }]}>
              <Text style={[styles.controlLabel, { fontSize: 15 * s }]}>Ending at</Text>
              <View style={[styles.stepper, { gap: 12 * s }]}>
                <Pressable
                  style={[styles.stepperBtn, { width: 30 * s, height: 30 * s, borderRadius: 15 * s }]}
                  onPress={() => setEndHour((v) => Math.max(startHour + 1, v - 1))}
                >
                  <Text style={[styles.stepperBtnText, { fontSize: 18 * s }]}>−</Text>
                </Pressable>
                <Text style={[styles.stepperValue, { fontSize: 15 * s, minWidth: 60 * s }]}>{formatHour(endHour)}</Text>
                <Pressable
                  style={[styles.stepperBtn, { width: 30 * s, height: 30 * s, borderRadius: 15 * s }]}
                  onPress={() => setEndHour((v) => Math.min(23, v + 1))}
                >
                  <Text style={[styles.stepperBtnText, { fontSize: 18 * s }]}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom */}
        <Animated.View style={[styles.bottom, { paddingTop: 16 * s }, bottomStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s, paddingHorizontal: 36 * s },
              pressed ? styles.buttonPressed : undefined,
            ]}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleContinue();
            }}
          >
            <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Send me Whispers</Text>
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
  top: {},
  title: {
    fontWeight: '700',
    color: '#5A8BA8',
  },
  subtitle: {
    fontWeight: '300',
    color: '#6B8F9E',
  },

  // Liquid glass notification
  notification: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  notifContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  appIcon: {},
  notifTextArea: {
    flex: 1,
    gap: 4,
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifAppName: {
    fontWeight: '600',
    color: '#3A6B80',
  },
  notifTime: {
    fontWeight: '400',
    color: '#9BB8C7',
  },
  notifBody: {
    fontWeight: '400',
    color: '#5A8BA8',
  },
  cursor: {
    color: '#5A8BA8',
    fontWeight: '200',
  },

  // Controls
  controls: {
    marginBottom: 8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 217, 232, 0.3)',
  },
  timeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 217, 232, 0.3)',
    overflow: 'hidden',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeDivider: {
    height: 1,
    backgroundColor: 'rgba(184, 217, 232, 0.3)',
    marginHorizontal: 20,
  },
  controlLabel: {
    fontWeight: '500',
    color: '#3A6B80',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    backgroundColor: 'rgba(90, 139, 168, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontWeight: '500',
    color: '#5A8BA8',
    lineHeight: 22,
  },
  stepperValue: {
    fontWeight: '600',
    color: '#5A8BA8',
    textAlign: 'center',
  },

  // Bottom section
  bottom: {
    alignItems: 'center',
    gap: 18,
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
