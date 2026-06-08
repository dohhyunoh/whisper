import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/app-context';
import { checkTrialEligibility, restorePurchases } from '@/utils/revenuecat';

export default function SubscriptionRequiredScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = Math.max(0.85, Math.min(1, Math.min(width / 390, height / 844)));
  const { dispatch } = useAppContext();
  // null = still checking; true/false once store-trial eligibility is known.
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);

  useEffect(() => {
    checkTrialEligibility()
      .then(setTrialEligible)
      .catch(() => setTrialEligible(false));
  }, []);

  const handleSubscribe = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/onboarding/paywall', params: { from: 'gate' } });
  };

  const handleRestore = async () => {
    const ok = await restorePurchases();
    if (ok) {
      dispatch({ type: 'SET_PREMIUM_STATUS', payload: 'premium_purchased' });
      router.replace('/daily-deck');
    } else {
      Alert.alert('Nothing to Restore', 'No previous purchases found.');
    }
  };

  const ctaLabel = trialEligible ? 'Start free trial' : 'See plans';

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
            <Text style={[styles.badgeText, { fontSize: 12 * s }]}>Whisper Pro</Text>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.duration(700).delay(300).easing(Easing.out(Easing.cubic))}
            style={[styles.title, { fontSize: 32 * s, marginTop: 14 * s }]}
          >
            Whisper is a{'\n'}premium space.
          </Animated.Text>
        </View>

        <View style={styles.middle}>
          <Animated.View
            entering={FadeIn.duration(700).delay(600)}
            style={[styles.card, { padding: 24 * s, borderRadius: 22 * s }]}
          >
            <Text style={[styles.body, { fontSize: 16 * s, lineHeight: 24 * s }]}>
              A curated <Text style={styles.bodyEmphasis}>daily 10</Text>, personalized to you and
              learning from every swipe.
            </Text>
            <Text style={[styles.body, { fontSize: 16 * s, lineHeight: 24 * s, marginTop: 14 * s }]}>
              {trialEligible
                ? 'Start with 3 days free to make it your own.'
                : 'Subscribe to continue your practice.'}
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.duration(500).delay(1000)} style={styles.btnWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { paddingVertical: 18 * s },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSubscribe}
          >
            <Text style={[styles.buttonText, { fontSize: 17 * s }]}>{ctaLabel}</Text>
          </Pressable>
          <Pressable onPress={handleRestore} hitSlop={12} style={{ marginTop: 14 * s }}>
            <Text style={[styles.restoreText, { fontSize: 14 * s }]}>Restore purchase</Text>
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
  body: { color: '#3A6B80', fontWeight: '400' },
  bodyEmphasis: { fontWeight: '700' },
  btnWrap: { width: '100%', alignItems: 'center' },
  button: {
    width: '100%',
    backgroundColor: '#3A6B80',
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonPressed: { transform: [{ translateY: 2 }], opacity: 0.95 },
  buttonText: { color: '#FFF', fontWeight: '700', letterSpacing: 0.4 },
  restoreText: { color: '#5A8BA8', fontWeight: '600' },
});
