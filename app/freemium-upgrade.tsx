import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markV2MigrationSeen } from '@/utils/migration';
import { checkTrialEligibility } from '@/utils/revenuecat';

export default function FreemiumUpgradeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);

  useEffect(() => {
    checkTrialEligibility()
      .then(setTrialEligible)
      .catch(() => setTrialEligible(false));
  }, []);

  const handleContinue = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markV2MigrationSeen();
    router.replace({ pathname: '/onboarding/paywall', params: { from: 'freemium-migration' } });
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
            style={[styles.eyebrowBadge, { paddingHorizontal: 14 * s, paddingVertical: 6 * s }]}
          >
            <Ionicons name="sparkles" size={14 * s} color="#3A6B80" />
            <Text style={[styles.eyebrowText, { fontSize: 12 * s }]}>Major update</Text>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.duration(700).delay(300).easing(Easing.out(Easing.cubic))}
            style={[styles.title, { fontSize: 32 * s, marginTop: 14 * s }]}
          >
            Whisper{'\n'}just evolved.
          </Animated.Text>
        </View>

        <View style={styles.middle}>
          <Animated.View
            entering={FadeIn.duration(700).delay(600)}
            style={[styles.card, { padding: 24 * s, borderRadius: 22 * s }]}
          >
            <Text style={[styles.body, { fontSize: 16 * s, lineHeight: 24 * s }]}>
              Whisper is now a premium-only, highly curated experience. You receive a scarce,
              intentional batch of <Text style={styles.bodyEmphasis}>10 quotes daily</Text>, tuned to
              your emotional state.
            </Text>

            <View style={[styles.divider, { marginVertical: 18 * s }]} />

            <View style={styles.row}>
              <Ionicons name="heart" size={18 * s} color="#5A8BA8" />
              <Text style={[styles.rowText, { fontSize: 14 * s }]}>
                Swipe right — it speaks to you.
              </Text>
            </View>
            <View style={[styles.row, { marginTop: 10 * s }]}>
              <Ionicons name="close-circle" size={20 * s} color="#E85D75" />
              <Text style={[styles.rowText, { fontSize: 14 * s }]}>
                Swipe left — it doesn't speak to you.
              </Text>
            </View>
            <View style={[styles.row, { marginTop: 10 * s }]}>
              <Ionicons name="sparkles" size={18 * s} color="#5A8BA8" />
              <Text style={[styles.rowText, { fontSize: 14 * s }]}>
                The more you swipe, the better your daily quotes get.
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(600).delay(900)}
            style={[styles.trialPill, { marginTop: 16 * s, paddingHorizontal: 16 * s, paddingVertical: 12 * s, borderRadius: 14 * s }]}
          >
            <Text style={[styles.trialText, { fontSize: 14 * s }]}>
              {trialEligible === null
                ? 'Try the new Whisper.'
                : trialEligible
                ? 'Try the new Whisper — 3-day free trial. After that, $14.99/mo or $59.99/yr.'
                : 'Subscribe to continue. $14.99/mo or $59.99/yr.'}
            </Text>
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
            <Text style={[styles.buttonText, { fontSize: 17 * s }]}>
              {trialEligible ? 'Start my free trial' : 'See the upgrade'}
            </Text>
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
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(58, 107, 128, 0.25)',
  },
  eyebrowText: { color: '#3A6B80', fontWeight: '700', letterSpacing: 0.5 },
  title: {
    fontWeight: '800',
    color: '#3A6B80',
    textAlign: 'center',
  },
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
  body: { color: '#3A6B80', fontWeight: '400' },
  bodyEmphasis: { fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(58, 107, 128, 0.2)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { color: '#3A6B80', flex: 1 },
  trialPill: {
    backgroundColor: 'rgba(58, 107, 128, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(58, 107, 128, 0.18)',
  },
  trialText: { color: '#3A6B80', fontWeight: '600', textAlign: 'center' },
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
