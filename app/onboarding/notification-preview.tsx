import { useAppContext } from '@/context/app-context';
import { requestPermissions, scheduleQuoteNotifications } from '@/utils/notifications';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const QUOTE_TEXT = '"Your thoughts create your reality." — Neale Donald Walsch';

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

  const [perDay, setPerDay] = useState(3);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(21);

  // Animations
  const notifScale = useSharedValue(0.9);
  const notifOpacity = useSharedValue(0);
  const controlsOpacity = useSharedValue(0);
  const bottomOpacity = useSharedValue(0);

  const typedQuote = useTypewriter(QUOTE_TEXT, 800, 35);

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

    dispatch({ type: 'COMPLETE_ONBOARDING' });
    router.replace('/home');
  };

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.top}>
          <Text style={styles.title}>
            Messages,{'\n'}when you need them
          </Text>
          <Text style={styles.subtitle}>
            Thoughtful messages, to guide your mindset.
          </Text>
        </View>

        {/* Liquid glass notification */}
        <Animated.View style={[styles.notification, notifStyle]}>
          <View style={styles.notifContent}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.appIcon}
            />
            <View style={styles.notifTextArea}>
              <View style={styles.notifTitleRow}>
                <Text style={styles.notifAppName}>Whisper</Text>
                <Text style={styles.notifTime}>now</Text>
              </View>
              <Text style={styles.notifBody} numberOfLines={2}>
                {typedQuote}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Controls */}
        <Animated.View style={[styles.controls, controlsStyle]}>
          {/* Per day */}
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Quotes per day</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setPerDay((v) => Math.max(1, v - 1))}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{perDay}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setPerDay((v) => Math.min(10, v + 1))}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Time range — unified card */}
          <View style={styles.timeCard}>
            <View style={styles.timeRow}>
              <Text style={styles.controlLabel}>Starting at</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setStartHour((v) => Math.max(0, v - 1))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{formatHour(startHour)}</Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setStartHour((v) => Math.min(endHour - 1, v + 1))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.timeDivider} />

            <View style={styles.timeRow}>
              <Text style={styles.controlLabel}>Ending at</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setEndHour((v) => Math.max(startHour + 1, v - 1))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{formatHour(endHour)}</Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setEndHour((v) => Math.min(23, v + 1))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom */}
        <Animated.View style={[styles.bottom, bottomStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed ? styles.buttonPressed : undefined,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Send me Whispers</Text>
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
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 40,
  },
  top: {
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#5A8BA8',
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B8F9E',
    marginTop: 8,
  },

  // Liquid glass notification
  notification: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    padding: 16,
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    marginBottom: 32,
  },
  notifContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
  },
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
    fontSize: 15,
    fontWeight: '600',
    color: '#3A6B80',
  },
  notifTime: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9BB8C7',
  },
  notifBody: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5A8BA8',
    lineHeight: 20,
  },
  cursor: {
    color: '#5A8BA8',
    fontWeight: '200',
  },

  // Controls
  controls: {
    gap: 16,
    marginTop: 'auto',
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
    paddingVertical: 14,
    paddingHorizontal: 20,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  timeDivider: {
    height: 1,
    backgroundColor: 'rgba(184, 217, 232, 0.3)',
    marginHorizontal: 20,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3A6B80',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(90, 139, 168, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#5A8BA8',
    lineHeight: 22,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A8BA8',
    minWidth: 70,
    textAlign: 'center',
  },

  // Bottom section
  bottom: {
    alignItems: 'center',
    gap: 18,
    paddingTop: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#5A8BA8',
    borderRadius: 100,
    paddingVertical: 22,
    paddingHorizontal: 40,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
