import { useAppContext } from '@/context/app-context';
import { markExchangeAnnouncementSeen } from '@/utils/migration';
import { getTodayDateString } from '@/utils/streak';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExchangeAnnouncementScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));

  const handleContinue = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markExchangeAnnouncementSeen();
    // If they've already checked in today, there's no check-in left — take them
    // straight into the exchange so the announcement delivers the feature now.
    // Otherwise re-enter the launch gate → today's check-in → respond.
    const checkedInToday = state.moodHistory.some((e) => e.date === getTodayDateString());
    router.replace(checkedInToday ? '/exchange/respond' : '/');
  };

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
            paddingTop: insets.top + 32 * s,
            paddingBottom: insets.bottom + 24 * s,
            paddingHorizontal: 28 * s,
          },
        ]}
      >
        <View style={styles.top}>
          <Animated.View
            entering={FadeIn.duration(600).delay(100)}
            style={[styles.badge, { paddingHorizontal: 14 * s, paddingVertical: 6 * s }]}
          >
            <Ionicons name="sparkles" size={14 * s} color="#3A6B80" />
            <Text style={[styles.badgeText, { fontSize: 12 * s }]}>New</Text>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.duration(600).delay(250).easing(Easing.out(Easing.cubic))}
            style={[styles.eyebrow, { fontSize: 14 * s, marginTop: 16 * s }]}
          >
            A quieter kind of connection
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.duration(700).delay(400).easing(Easing.out(Easing.cubic))}
            style={[styles.title, { fontSize: 30 * s, marginTop: 8 * s }]}
          >
            Write to a{'\n'}stranger.
          </Animated.Text>
        </View>

        <View style={styles.middle}>
          <Animated.View
            entering={FadeIn.duration(700).delay(700)}
            style={[styles.card, { padding: 24 * s, borderRadius: 22 * s }]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="mail-outline" size={40 * s} color="#5A8BA8" />
            </View>

            <Text style={[styles.body, { fontSize: 16 * s, lineHeight: 24 * s, marginTop: 16 * s }]}>
              After your daily check-in, you can now offer a few kind words to a stranger and,
              in return, a stranger writes back to you.
            </Text>

            <View style={[styles.divider, { marginVertical: 18 * s }]} />

            <View style={styles.row}>
              <Ionicons name="lock-closed" size={17 * s} color="#5A8BA8" />
              <Text style={[styles.rowText, { fontSize: 14 * s }]}>
                Anonymous, always. No names, no profiles.
              </Text>
            </View>
            <View style={[styles.row, { marginTop: 10 * s }]}>
              <Ionicons name="time-outline" size={18 * s} color="#5A8BA8" />
              <Text style={[styles.rowText, { fontSize: 14 * s }]}>
                Every note quietly fades within a day.
              </Text>
            </View>
            <View style={[styles.row, { marginTop: 10 * s }]}>
              <Ionicons name="heart" size={17 * s} color="#E8869B" />
              <Text style={[styles.rowText, { fontSize: 14 * s }]}>
                Give first — then be heard.
              </Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.duration(500).delay(1100)} style={styles.btnWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={[styles.buttonText, { fontSize: 17 * s }]}>Start with today&apos;s check-in</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between' },
  top: { alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(58, 107, 128, 0.25)',
  },
  badgeText: { color: '#3A6B80', fontWeight: '700', letterSpacing: 0.5 },
  eyebrow: { color: '#5A8BA8', fontWeight: '500', textAlign: 'center' },
  title: { fontWeight: '800', color: '#3A6B80', textAlign: 'center' },
  middle: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(184, 217, 232, 0.6)',
    shadowColor: '#5A8BA8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  iconWrap: { alignItems: 'center' },
  body: { color: '#3A6B80', fontWeight: '400', textAlign: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(58, 107, 128, 0.2)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { color: '#3A6B80', flex: 1 },
  btnWrap: { width: '100%' },
  button: {
    width: '100%',
    backgroundColor: '#3A6B80',
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonPressed: { transform: [{ translateY: 2 }], opacity: 0.95 },
  buttonText: { color: '#FFF', fontWeight: '700', letterSpacing: 0.4 },
});
