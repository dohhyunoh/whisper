import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function useCurrentDateTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const h = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const time = `${h}:${minutes}`;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const date = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  return { time, date };
}

export default function WidgetPromoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));
  const cardWidth = width - 56 * s * 2;

  return (
    <LinearGradient
      colors={['#B8D9E8', '#D4E8F0', '#EEF4F7', '#F5F5F0']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16 * s,
            paddingHorizontal: 28 * s,
          },
        ]}
      >
        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={[styles.title, { fontSize: 28 * s }]}>
            Quotes on Your Lock Screen
          </Text>
          <Text style={[styles.subtitle, { fontSize: 15 * s, marginTop: 8 * s }]}>
            Glance at your phone to find inspiration {'\n'} without unlocking.
          </Text>
        </View>

        {/* Phone mockup */}
        <View style={[styles.phoneFrame, { width: cardWidth, height: cardWidth * 1.8 }]}>
          <LockScreenMockup s={s} />
        </View>

        {/* Bottom button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { paddingVertical: 18 * s },
            pressed && styles.pressed,
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/onboarding/widget-home');
          }}
        >
          <Text style={[styles.buttonText, { fontSize: 18 * s }]}>Continue</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function LockScreenMockup({ s }: { s: number }) {
  const { time, date } = useCurrentDateTime();

  return (
    <View style={mockStyles.screen}>
      <View style={mockStyles.statusBar}>
        <Text style={[mockStyles.time, { fontSize: 48 * s }]}>{time}</Text>
        <Text style={[mockStyles.date, { fontSize: 14 * s }]}>{date}</Text>
      </View>

      <View style={[mockStyles.lockWidgetHalf, { marginTop: 24 * s }]}>
        <View style={[mockStyles.removeBadge, { width: 20 * s, height: 20 * s, borderRadius: 10 * s, top: -8 * s, right: -8 * s }]}>
          <Text style={[mockStyles.removeBadgeText, { fontSize: 14 * s }]}>−</Text>
        </View>
        <View style={mockStyles.lockWidgetInner}>
          <Text style={[mockStyles.lockQuote, { fontSize: 10 * s }]}>
            "The only way out is through."
          </Text>
          <Text style={[mockStyles.lockAuthor, { fontSize: 8 * s }]}>
            — Robert Frost
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
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
  phoneFrame: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#3A6B80',
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
});

const mockStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  statusBar: {
    alignItems: 'center',
    marginTop: 40,
  },
  time: {
    fontWeight: '300',
    color: 'white',
  },
  date: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  lockWidgetHalf: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginLeft: 20,
    width: '42%',
  },
  lockWidgetInner: {
    gap: 2,
  },
  lockQuote: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  lockAuthor: {
    color: 'rgba(255,255,255,0.6)',
  },
  removeBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removeBadgeText: {
    color: 'white',
    fontWeight: '600',
    lineHeight: 16,
  },
});
